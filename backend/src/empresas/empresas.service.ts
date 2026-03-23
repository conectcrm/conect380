import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { User, UserRole } from '../modules/users/user.entity';
import { CreateEmpresaDto } from './dto/empresas.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { EmpresaModuloService } from '../modules/empresas/services/empresa-modulo.service';
import { PlanosService } from '../modules/planos/planos.service';
import { AssinaturasService } from '../modules/planos/assinaturas.service';
import { FeatureFlagTenant } from '../modules/dashboard-v2/entities/feature-flag-tenant.entity';
import { DEFAULT_PLANOS_SISTEMA } from '../modules/planos/planos.defaults';

type RegistroEmpresaConsentAuditMeta = {
  ip?: string | null;
  userAgent?: string | null;
  termosVersao?: string;
  privacidadeVersao?: string;
};

@Injectable()
export class EmpresasService {
  private readonly logger = new Logger(EmpresasService.name);
  private static readonly DASHBOARD_V2_FLAG_KEY = 'dashboard_v2_enabled';
  private static readonly OPORTUNIDADES_LIFECYCLE_FLAG_KEY = 'crm_oportunidades_lifecycle_v1';
  private static readonly SELF_SIGNUP_ENABLE_OPORTUNIDADES_LIFECYCLE =
    String(process.env.SELF_SIGNUP_ENABLE_OPORTUNIDADES_LIFECYCLE || 'true')
      .trim()
      .toLowerCase() !== 'false';
  private static readonly SELF_SIGNUP_PLANOS_CANONICOS = new Set(
    DEFAULT_PLANOS_SISTEMA.map((plano) => String(plano.codigo || '').trim().toLowerCase()),
  );
  private static readonly TERMOS_VERSAO_ATUAL = process.env.LGPD_TERMOS_VERSAO || '2026-02-23';
  private static readonly PRIVACIDADE_VERSAO_ATUAL =
    process.env.LGPD_PRIVACIDADE_VERSAO || '2026-02-23';
  private static readonly TRIAL_DIAS_CADASTRO = (() => {
    const configured = Number.parseInt(String(process.env.SELF_SIGNUP_TRIAL_DAYS || '15'), 10);
    if (!Number.isFinite(configured) || configured < 1 || configured > 60) {
      return 15;
    }
    return configured;
  })();
  private static readonly AUTO_VERIFICAR_EMAIL_CADASTRO =
    String(process.env.SELF_SIGNUP_AUTO_VERIFY_EMAIL || 'true').trim().toLowerCase() !== 'false';
  private static readonly EMAIL_VERIFICACAO_TOKEN_TTL_HOURS = 24;
  private static readonly BLOQUEAR_EMAIL_DESCARTAVEL =
    String(process.env.SELF_SIGNUP_BLOCK_DISPOSABLE_EMAIL || 'false')
      .trim()
      .toLowerCase() === 'true';
  private static readonly UF_VALIDAS = new Set([
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ]);
  private static readonly DOMINIOS_EMAIL_DESCARTAVEL = new Set([
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'yopmail.com',
    'trashmail.com',
  ]);

  private normalizeText(value?: string | null): string {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private normalizeDigits(value?: string | null): string {
    return String(value || '').replace(/\D/g, '');
  }

  private normalizeEmail(email?: string | null): string {
    return this.normalizeText(email).toLowerCase();
  }

  private normalizePlano(value?: string | null): string {
    const normalized = this.normalizeText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const aliases: Record<string, string> = {
      starter: 'starter',
      start: 'starter',
      basic: 'starter',
      basico: 'starter',
      business: 'business',
      professional: 'business',
      pro: 'business',
      enterprise: 'enterprise',
      premium: 'enterprise',
      empresarial: 'enterprise',
    };

    return aliases[normalized] || normalized;
  }

  private createEmailVerificationToken(referenceDate: Date = new Date()): string {
    return `${referenceDate.getTime().toString(36)}.${crypto.randomBytes(32).toString('hex')}`;
  }

  private resolveEmailVerificationTokenIssuedAt(
    token: string,
    fallbackDate: Date,
  ): Date {
    const [timestampPart] = String(token || '').split('.');
    if (!timestampPart) {
      return fallbackDate;
    }

    const parsedTimestamp = Number.parseInt(timestampPart, 36);
    if (!Number.isFinite(parsedTimestamp) || parsedTimestamp <= 0) {
      return fallbackDate;
    }

    const issuedAt = new Date(parsedTimestamp);
    return Number.isNaN(issuedAt.getTime()) ? fallbackDate : issuedAt;
  }

  private validarUF(uf: string): string {
    const normalized = this.normalizeText(uf).toUpperCase();
    if (!EmpresasService.UF_VALIDAS.has(normalized)) {
      throw new HttpException('Estado (UF) invalido', HttpStatus.BAD_REQUEST);
    }
    return normalized;
  }

  private validarTelefone(telefone: string, fieldLabel: string): string {
    const digits = this.normalizeDigits(telefone);
    if (digits.length < 10 || digits.length > 11) {
      throw new HttpException(`${fieldLabel} invalido`, HttpStatus.BAD_REQUEST);
    }

    if (/^(.)\1+$/.test(digits)) {
      throw new HttpException(`${fieldLabel} invalido`, HttpStatus.BAD_REQUEST);
    }

    return digits;
  }

  private validarCep(cep: string): string {
    const digits = this.normalizeDigits(cep);
    if (digits.length !== 8) {
      throw new HttpException('CEP invalido', HttpStatus.BAD_REQUEST);
    }
    return digits;
  }

  private isCnpjValido(cnpjDigits: string): boolean {
    if (!/^\d{14}$/.test(cnpjDigits)) {
      return false;
    }

    if (/^(\d)\1{13}$/.test(cnpjDigits)) {
      return false;
    }

    const calcularDigito = (base: string, pesos: number[]): number => {
      const soma = base
        .split('')
        .reduce((acc, digit, index) => acc + Number(digit) * pesos[index], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const base = cnpjDigits.slice(0, 12);
    const d1 = calcularDigito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = calcularDigito(`${base}${d1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return cnpjDigits === `${base}${d1}${d2}`;
  }

  private validarCnpj(cnpj: string): string {
    const cnpjDigits = this.normalizeDigits(cnpj);
    if (!this.isCnpjValido(cnpjDigits)) {
      throw new HttpException('CNPJ invalido', HttpStatus.BAD_REQUEST);
    }
    return cnpjDigits;
  }

  private validarEmail(email: string, fieldLabel: string): string {
    const normalized = this.normalizeEmail(email);
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(normalized)) {
      throw new HttpException(`${fieldLabel} invalido`, HttpStatus.BAD_REQUEST);
    }

    if (this.isDominioDescartavel(normalized)) {
      throw new HttpException(
        `${fieldLabel} com dominio temporario nao e permitido`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return normalized;
  }

  private isDominioDescartavel(email: string): boolean {
    if (!EmpresasService.BLOQUEAR_EMAIL_DESCARTAVEL) {
      return false;
    }

    const domain = email.split('@')[1]?.trim().toLowerCase();
    if (!domain) {
      return false;
    }

    return EmpresasService.DOMINIOS_EMAIL_DESCARTAVEL.has(domain);
  }

  private async buscarEmpresaPorEmailInsensitive(email: string): Promise<Empresa | null> {
    return this.empresaRepository
      .createQueryBuilder('empresa')
      .where('LOWER(empresa.email) = LOWER(:email)', { email })
      .getOne();
  }

  private async buscarUsuarioPorEmailInsensitive(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.email) = LOWER(:email)', { email })
      .getOne();
  }

  private toMoney(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Number(parsed.toFixed(2));
  }

  private formatStorageLimit(bytes: number): string {
    const parsed = Number(bytes);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return '0GB';
    }

    const gb = parsed / (1024 * 1024 * 1024);
    if (gb >= 1000) {
      return `${(gb / 1024).toFixed(1)}TB`;
    }

    if (Number.isInteger(gb)) {
      return `${gb}GB`;
    }

    return `${gb.toFixed(1)}GB`;
  }

  private maskEmail(email?: string): string {
    if (!email || !email.includes('@')) return '[redacted]';

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '[redacted]';

    const visiblePrefix = localPart.slice(0, 2);
    return `${visiblePrefix}${'*'.repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
  }

  private maskDigits(value?: string): string {
    if (!value) return '[redacted]';

    const digits = value.replace(/\D/g, '');
    if (!digits) return '[redacted]';

    const visibleSuffix = digits.slice(-4);
    return `${'*'.repeat(Math.max(digits.length - 4, 4))}${visibleSuffix}`;
  }

  private buildRegistroEmpresaLogMeta(createEmpresaDto: CreateEmpresaDto): Record<string, unknown> {
    const { empresa, usuario, plano, aceitarTermos } = createEmpresaDto;

    return {
      plano,
      aceitarTermos: Boolean(aceitarTermos),
      empresa: {
        nome: empresa?.nome || '[vazio]',
        cnpj: this.maskDigits(empresa?.cnpj),
        email: this.maskEmail(empresa?.email),
        telefone: this.maskDigits(empresa?.telefone),
        cidade: empresa?.cidade || null,
        estado: empresa?.estado || null,
      },
      usuarioAdmin: {
        nome: usuario?.nome || '[vazio]',
        email: this.maskEmail(usuario?.email),
        telefone: this.maskDigits(usuario?.telefone),
        senha: '[redacted]',
      },
    };
  }

  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FeatureFlagTenant)
    private readonly featureFlagTenantRepository: Repository<FeatureFlagTenant>,
    private mailService: MailService,
    private empresaModuloService: EmpresaModuloService,
    private planosService: PlanosService,
    private assinaturasService: AssinaturasService,
  ) {}

  private async upsertTenantFeatureFlag(input: {
    empresaId: string;
    flagKey: string;
    enabled: boolean;
    rolloutPercentage?: number;
    updatedBy?: string | null;
  }): Promise<void> {
    const rolloutPercentage = Math.max(0, Math.min(100, Number(input.rolloutPercentage || 0)));

    await this.featureFlagTenantRepository
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagTenant)
      .values({
        empresa_id: input.empresaId,
        flag_key: input.flagKey,
        enabled: input.enabled,
        rollout_percentage: rolloutPercentage,
        updated_by: input.updatedBy || null,
        updated_at: new Date(),
      })
      .orUpdate(
        ['enabled', 'rollout_percentage', 'updated_by', 'updated_at'],
        ['empresa_id', 'flag_key'],
      )
      .execute();
  }

  private async habilitarDashboardV2ParaEmpresa(empresaId: string): Promise<void> {
    await this.upsertTenantFeatureFlag({
      empresaId,
      flagKey: EmpresasService.DASHBOARD_V2_FLAG_KEY,
      enabled: true,
      rolloutPercentage: 0,
      updatedBy: null,
    });
  }

  private async habilitarLifecycleOportunidadesParaEmpresa(empresaId: string): Promise<void> {
    await this.upsertTenantFeatureFlag({
      empresaId,
      flagKey: EmpresasService.OPORTUNIDADES_LIFECYCLE_FLAG_KEY,
      enabled: true,
      rolloutPercentage: 0,
      updatedBy: null,
    });
  }

  async registrarEmpresa(
    createEmpresaDto: CreateEmpresaDto,
    consentAuditMeta?: RegistroEmpresaConsentAuditMeta,
  ): Promise<Empresa> {
    this.logger.log(
      `[REGISTRO_EMPRESA] Iniciado ${JSON.stringify(
        this.buildRegistroEmpresaLogMeta(createEmpresaDto),
      )}`,
    );

    const { empresa, usuario, plano, aceitarTermos } = createEmpresaDto;
    this.logger.debug(`[REGISTRO_EMPRESA] Plano extraido: "${plano}"`);

    if (!aceitarTermos) {
      throw new HttpException('E necessario aceitar os termos de uso', HttpStatus.BAD_REQUEST);
    }

    const cnpjNormalizado = this.validarCnpj(empresa.cnpj);
    const emailEmpresaNormalizado = this.validarEmail(empresa.email, 'Email da empresa');
    const emailUsuarioNormalizado = this.validarEmail(usuario.email, 'Email do usuario');
    const telefoneEmpresaNormalizado = this.validarTelefone(empresa.telefone, 'Telefone da empresa');
    const telefoneUsuarioNormalizado = this.validarTelefone(usuario.telefone, 'Telefone do usuario');
    const cepNormalizado = this.validarCep(empresa.cep);
    const estadoNormalizado = this.validarUF(empresa.estado);
    const planoCanonico = this.normalizePlano(plano);

    if (!planoCanonico) {
      throw new HttpException('Plano invalido para cadastro', HttpStatus.BAD_REQUEST);
    }

    const planoCatalogo = await this.planosService.buscarPorCodigo(planoCanonico).catch(() => {
      throw new HttpException(
        `Plano "${plano}" nao encontrado no catalogo`,
        HttpStatus.BAD_REQUEST,
      );
    });

    const [cnpjExiste, emailEmpresaExiste, emailUsuarioExiste] = await Promise.all([
      this.empresaRepository.findOne({ where: { cnpj: cnpjNormalizado } }),
      this.buscarEmpresaPorEmailInsensitive(emailEmpresaNormalizado),
      this.buscarUsuarioPorEmailInsensitive(emailUsuarioNormalizado),
    ]);

    if (cnpjExiste) {
      throw new HttpException('CNPJ ja cadastrado', HttpStatus.CONFLICT);
    }

    if (emailEmpresaExiste) {
      throw new HttpException('Email da empresa ja cadastrado', HttpStatus.CONFLICT);
    }

    if (emailUsuarioExiste) {
      throw new HttpException('Email do usuario ja cadastrado', HttpStatus.CONFLICT);
    }

    try {
      const subdominio = await this.gerarSubdominioUnico(empresa.nome);
      const dataInicioTrial = new Date();
      const dataFimTrial = new Date(dataInicioTrial);
      dataFimTrial.setDate(dataFimTrial.getDate() + EmpresasService.TRIAL_DIAS_CADASTRO);

      const emailVerificadoInicial = EmpresasService.AUTO_VERIFICAR_EMAIL_CADASTRO;
      const tokenVerificacao = emailVerificadoInicial
        ? null
        : this.createEmailVerificationToken();
      const planoCodigo = planoCatalogo.codigo;
      const valorMensalPlano = this.toMoney(planoCatalogo.preco);

      const novaEmpresa = this.empresaRepository.create({
        nome: this.normalizeText(empresa.nome),
        slug: this.gerarSlug(this.normalizeText(empresa.nome)),
        cnpj: cnpjNormalizado,
        email: emailEmpresaNormalizado,
        telefone: telefoneEmpresaNormalizado,
        endereco: this.normalizeText(empresa.endereco),
        cidade: this.normalizeText(empresa.cidade),
        estado: estadoNormalizado,
        cep: cepNormalizado,
        plano: planoCodigo,
        status: 'trial',
        subdominio: subdominio,
        ativo: true,
        trial_end_date: dataFimTrial,
        data_expiracao: dataFimTrial,
        valor_mensal: valorMensalPlano,
        email_verificado: emailVerificadoInicial,
        token_verificacao: tokenVerificacao,
        termosAceitosEm: new Date(),
        termosAceitosIp: consentAuditMeta?.ip?.slice(0, 64) || null,
        termosAceitosUserAgent: consentAuditMeta?.userAgent?.slice(0, 1000) || null,
        termosAceitosVersao:
          consentAuditMeta?.termosVersao || EmpresasService.TERMOS_VERSAO_ATUAL,
        privacidadeAceitaVersao:
          consentAuditMeta?.privacidadeVersao || EmpresasService.PRIVACIDADE_VERSAO_ATUAL,
      });

      const empresaSalva = await this.empresaRepository.save(novaEmpresa);

      const senhaHash = await bcrypt.hash(usuario.senha, 10);
      const novoUsuario = this.userRepository.create({
        nome: this.normalizeText(usuario.nome),
        email: emailUsuarioNormalizado,
        senha: senhaHash,
        telefone: telefoneUsuarioNormalizado,
        role: UserRole.ADMIN,
        empresa_id: empresaSalva.id,
        ativo: emailVerificadoInicial,
      });

      await this.userRepository.save(novoUsuario);
      this.logger.debug(`[REGISTRO_EMPRESA] Usuario admin salvo: ${novoUsuario.id}`);

      if (!emailVerificadoInicial) {
        await this.enviarEmailVerificacao(empresaSalva, novoUsuario);
      }

      await this.assinaturasService.criar({
        empresaId: empresaSalva.id,
        planoId: planoCatalogo.id,
        status: 'trial',
        dataInicio: dataInicioTrial.toISOString(),
        dataFim: dataFimTrial.toISOString(),
        proximoVencimento: dataFimTrial.toISOString(),
        valorMensal: valorMensalPlano,
        renovacaoAutomatica: true,
        observacoes: `Trial de ${EmpresasService.TRIAL_DIAS_CADASTRO} dias criado no self-signup`,
      });

      const modulosPlano = (planoCatalogo.modulosInclusos || [])
        .map((item) => String(item?.modulo?.codigo || '').trim())
        .filter(Boolean);

      if (modulosPlano.length === 0) {
        this.logger.error(
          `[REGISTRO_EMPRESA] Plano ${planoCodigo} sem modulos vinculados no catalogo`,
        );
        throw new HttpException(
          'Plano selecionado sem modulos configurados. Contate o suporte.',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.empresaModuloService.sincronizarModulosPlano(
        empresaSalva.id,
        modulosPlano,
        planoCodigo,
      );
      this.logger.log(
        `Modulos do plano ${planoCodigo} ativados para empresa ${empresaSalva.id}: ${modulosPlano.join(', ')}`,
      );

      try {
        await this.habilitarDashboardV2ParaEmpresa(empresaSalva.id);
      } catch (flagError) {
        const flagMessage =
          flagError instanceof Error ? flagError.message : 'erro desconhecido ao habilitar flag';
        this.logger.warn(
          `[REGISTRO_EMPRESA] Falha ao habilitar dashboard_v2_enabled para empresa ${empresaSalva.id}: ${flagMessage}`,
        );
      }

      if (EmpresasService.SELF_SIGNUP_ENABLE_OPORTUNIDADES_LIFECYCLE) {
        try {
          await this.habilitarLifecycleOportunidadesParaEmpresa(empresaSalva.id);
        } catch (flagError) {
          const flagMessage =
            flagError instanceof Error ? flagError.message : 'erro desconhecido ao habilitar flag';
          this.logger.warn(
            `[REGISTRO_EMPRESA] Falha ao habilitar crm_oportunidades_lifecycle_v1 para empresa ${empresaSalva.id}: ${flagMessage}`,
          );
        }
      } else {
        this.logger.debug(
          `[REGISTRO_EMPRESA] crm_oportunidades_lifecycle_v1 nao habilitada para empresa ${empresaSalva.id} porque SELF_SIGNUP_ENABLE_OPORTUNIDADES_LIFECYCLE=false`,
        );
      }

      this.logger.log(
        `[REGISTRO_EMPRESA] Concluido empresaId=${empresaSalva.id} adminUserId=${novoUsuario.id}`,
      );

      return empresaSalva;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const maybeMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (maybeMessage.includes('duplicate key')) {
        throw new HttpException(
          'Dados de cadastro ja existem. Revise CNPJ e emails informados.',
          HttpStatus.CONFLICT,
        );
      }

      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('[REGISTRO_EMPRESA] Erro ao registrar empresa', stack);
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verificarCNPJDisponivel(cnpj: string): Promise<boolean> {
    const cnpjLimpo = this.validarCnpj(cnpj);
    const empresa = await this.empresaRepository.findOne({
      where: { cnpj: cnpjLimpo },
    });
    return !empresa;
  }

  async verificarEmailDisponivel(email: string): Promise<boolean> {
    const emailNormalizado = this.validarEmail(email, 'Email');
    const [empresaExiste, usuarioExiste] = await Promise.all([
      this.buscarEmpresaPorEmailInsensitive(emailNormalizado),
      this.buscarUsuarioPorEmailInsensitive(emailNormalizado),
    ]);
    return !empresaExiste && !usuarioExiste;
  }

  async verificarEmailAtivacao(token: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { token_verificacao: token },
      relations: ['usuarios'],
    });

    if (!empresa) {
      throw new HttpException('Token invÃ¡lido', HttpStatus.BAD_REQUEST);
    }

    // Verificar se token nÃ£o expirou (24 horas)
    const tokenCreatedAt = this.resolveEmailVerificationTokenIssuedAt(token, empresa.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - tokenCreatedAt.getTime()) / (1000 * 60 * 60);

    if (diffHours > EmpresasService.EMAIL_VERIFICACAO_TOKEN_TTL_HOURS) {
      throw new HttpException('Token expirado', HttpStatus.BAD_REQUEST);
    }

    // Ativar empresa e usuÃ¡rio
    empresa.email_verificado = true;
    empresa.token_verificacao = null;
    await this.empresaRepository.save(empresa);

    // Ativar usuÃ¡rio administrador
    const adminUser = empresa.usuarios.find((u) => u.role === 'admin');
    if (adminUser) {
      adminUser.ativo = true;
      await this.userRepository.save(adminUser);
    }

    return empresa;
  }

  async reenviarEmailAtivacao(email: string): Promise<void> {
    const emailNormalizado = this.validarEmail(email, 'Email');
    const empresa = await this.empresaRepository
      .createQueryBuilder('empresa')
      .leftJoinAndSelect('empresa.usuarios', 'usuarios')
      .where('LOWER(empresa.email) = LOWER(:email)', { email: emailNormalizado })
      .getOne();

    if (!empresa) {
      throw new HttpException('Empresa nÃ£o encontrada', HttpStatus.NOT_FOUND);
    }

    if (empresa.email_verificado) {
      throw new HttpException('Email jÃ¡ verificado', HttpStatus.BAD_REQUEST);
    }

    // Gerar novo token
    empresa.token_verificacao = this.createEmailVerificationToken();
    await this.empresaRepository.save(empresa);

    // Buscar usuÃ¡rio admin
    const adminUser = empresa.usuarios.find((u) => u.role === 'admin');
    if (!adminUser) {
      throw new HttpException('UsuÃ¡rio administrador nÃ£o encontrado', HttpStatus.NOT_FOUND);
    }

    // Reenviar email
    await this.enviarEmailVerificacao(empresa, adminUser);
  }

  async obterPorSubdominio(subdominio: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { subdominio },
    });

    if (!empresa) {
      throw new HttpException('Empresa nÃ£o encontrada', HttpStatus.NOT_FOUND);
    }

    return empresa;
  }

  async obterPorId(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
    });

    if (!empresa) {
      throw new HttpException('Empresa nÃ£o encontrada', HttpStatus.NOT_FOUND);
    }

    return empresa;
  }

  async atualizarEmpresa(id: string, updateData: Partial<Empresa>): Promise<Empresa> {
    const empresa = await this.obterPorId(id);
    const payload: Partial<Empresa> = { ...updateData };

    if (payload.nome) {
      payload.nome = this.normalizeText(payload.nome);
    }

    if (payload.endereco) {
      payload.endereco = this.normalizeText(payload.endereco);
    }

    if (payload.cidade) {
      payload.cidade = this.normalizeText(payload.cidade);
    }

    if (payload.slug) {
      payload.slug = this.gerarSlug(this.normalizeText(payload.slug));
    }

    // Validar CNPJ se estiver sendo alterado
    if (payload.cnpj && payload.cnpj !== empresa.cnpj) {
      const cnpjNormalizado = this.validarCnpj(payload.cnpj);
      const cnpjEmUso = await this.empresaRepository.findOne({
        where: { cnpj: cnpjNormalizado },
      });
      if (cnpjEmUso && cnpjEmUso.id !== empresa.id) {
        throw new HttpException('CNPJ ja cadastrado em outra empresa', HttpStatus.CONFLICT);
      }
      payload.cnpj = cnpjNormalizado;
    }

    // Validar email se estiver sendo alterado
    if (payload.email && payload.email !== empresa.email) {
      const emailNormalizado = this.validarEmail(payload.email, 'Email');
      const emailEmUso = await this.buscarEmpresaPorEmailInsensitive(emailNormalizado);
      if (emailEmUso && emailEmUso.id !== empresa.id) {
        throw new HttpException('Email ja cadastrado em outra empresa', HttpStatus.CONFLICT);
      }
      payload.email = emailNormalizado;
    }

    if (payload.telefone) {
      payload.telefone = this.validarTelefone(payload.telefone, 'Telefone');
    }

    if (payload.cep) {
      payload.cep = this.validarCep(payload.cep);
    }

    if (payload.estado) {
      payload.estado = this.validarUF(payload.estado);
    }

    if (payload.plano) {
      payload.plano = this.normalizePlano(payload.plano);
    }

    // Atualizar empresa
    Object.assign(empresa, payload);
    return await this.empresaRepository.save(empresa);
  }

  async listarPlanos(): Promise<any[]> {
    const planosCatalogo = (await this.planosService.listarTodos()).filter((plano) => {
      const codigoPlano = String(plano?.codigo || '')
        .trim()
        .toLowerCase();

      return EmpresasService.SELF_SIGNUP_PLANOS_CANONICOS.has(codigoPlano);
    });

    if (planosCatalogo.length > 0) {
      return planosCatalogo.map((plano) => {
        const recursos: string[] = [
          plano.limiteUsuarios === -1
            ? 'Usuarios ilimitados'
            : `Ate ${plano.limiteUsuarios} usuarios`,
          plano.limiteClientes === -1
            ? 'Clientes ilimitados'
            : `Ate ${plano.limiteClientes.toLocaleString('pt-BR')} clientes`,
          `${this.formatStorageLimit(plano.limiteStorage)} de armazenamento`,
          `${Number(plano.limiteApiCalls).toLocaleString('pt-BR')} API calls/dia`,
        ];

        if (plano.whiteLabel) {
          recursos.push('White-label');
        }

        if (plano.suportePrioritario) {
          recursos.push('Suporte prioritario');
        } else {
          recursos.push('Suporte padrao');
        }

        const modulos = (plano.modulosInclusos || [])
          .map((item) => item?.modulo?.nome)
          .filter((value): value is string => Boolean(value));

        if (modulos.length > 0) {
          recursos.push(`Modulos: ${modulos.join(', ')}`);
        }

        return {
          id: plano.codigo,
          nome: plano.nome,
          preco: this.toMoney(plano.preco),
          descricao: plano.descricao || null,
          recursos,
          limites: {
            usuarios: plano.limiteUsuarios,
            clientes: plano.limiteClientes,
            armazenamento: this.formatStorageLimit(plano.limiteStorage),
          },
        };
      });
    }

    // Fallback estatico para cenarios de bootstrap sem catalogo.
    return [
      {
        id: 'starter',
        nome: 'Starter',
        preco: 149,
        descricao: 'Ideal para pequenas empresas',
        recursos: [
          'Ate 3 usuarios',
          'Ate 1.000 clientes',
          'Modulos basicos',
          '5GB de armazenamento',
          'Suporte por email',
        ],
        limites: {
          usuarios: 3,
          clientes: 1000,
          armazenamento: '5GB',
        },
      },
      {
        id: 'business',
        nome: 'Business',
        preco: 549,
        descricao: 'Para empresas em crescimento',
        recursos: [
          'Ate 10 usuarios',
          'Ate 10.000 clientes',
          'Todos os modulos',
          '50GB de armazenamento',
          'White label basico',
          'Suporte prioritario',
        ],
        limites: {
          usuarios: 10,
          clientes: 10000,
          armazenamento: '50GB',
        },
      },
      {
        id: 'enterprise',
        nome: 'Enterprise',
        preco: 1790,
        descricao: 'Para grandes operacoes',
        recursos: [
          'Usuarios ilimitados',
          'Clientes ilimitados',
          'API completa',
          '500GB de armazenamento',
          'White label completo',
          'Suporte dedicado',
        ],
        limites: {
          usuarios: -1,
          clientes: -1,
          armazenamento: '500GB',
        },
      },
    ];
  }

  async verificarStatusEmpresa(empresaId: string): Promise<any> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new HttpException('Empresa nÃ£o encontrada', HttpStatus.NOT_FOUND);
    }

    const agora = new Date();
    const expirada = empresa.data_expiracao && empresa.data_expiracao < agora;

    return {
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo,
      plano: empresa.plano,
      email_verificado: empresa.email_verificado,
      data_expiracao: empresa.data_expiracao,
      expirada,
      dias_restantes: empresa.data_expiracao
        ? Math.ceil((empresa.data_expiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    };
  }

  private async gerarSubdominioUnico(nomeEmpresa: string): Promise<string> {
    // Limpar nome da empresa para criar subdomÃ­nio
    const baseSubdominio = nomeEmpresa
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 20); // MÃ¡ximo 20 caracteres

    let subdominio = baseSubdominio;
    let contador = 1;

    // Verificar se subdomÃ­nio jÃ¡ existe
    while (await this.empresaRepository.findOne({ where: { subdominio } })) {
      subdominio = `${baseSubdominio}${contador}`;
      contador++;
    }

    return subdominio;
  }

  private async enviarEmailVerificacao(empresa: Empresa, usuario: User): Promise<void> {
    try {
      const verificacaoUrl = `${process.env.FRONTEND_URL}/verificar-email?token=${empresa.token_verificacao}&email=${empresa.email}`;

      await this.mailService.enviarEmailVerificacao({
        to: usuario.email,
        empresa: empresa.nome,
        usuario: usuario.nome,
        url: verificacaoUrl,
      });
    } catch (error) {
      console.error('Erro ao enviar email de verificaÃ§Ã£o:', error);
      // NÃ£o interromper o processo se o email falhar
    }
  }

  private gerarSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaÃ§os por hÃ­fens
      .replace(/-+/g, '-') // Remove hÃ­fens duplicados
      .slice(0, 100); // Limita a 100 caracteres
  }

}
