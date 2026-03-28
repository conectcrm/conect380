import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { User, UserRole } from '../../users/user.entity';
import { EmpresaModuloService } from '../../empresas/services/empresa-modulo.service';
import { CreateEmpresaAdminDto } from '../dto/create-empresa-admin.dto';
import { UpdateEmpresaAdminDto } from '../dto/update-empresa-admin.dto';
import { FilterEmpresasAdminDto } from '../dto/filter-empresas-admin.dto';
import { CreateModuloEmpresaDto } from '../dto/create-modulo-empresa.dto';
import { UpdateModuloEmpresaDto } from '../dto/update-modulo-empresa.dto';
import { MudarPlanoDto } from '../dto/mudar-plano.dto';
import { ModuloEmpresa } from '../entities/modulo-empresa.entity';
import { HistoricoPlano } from '../entities/historico-plano.entity';
import { PlanosService } from '../../planos/planos.service';
import { AssinaturasService } from '../../planos/assinaturas.service';
import { Plano } from '../../planos/entities/plano.entity';
import { toCanonicalAssinaturaStatus } from '../../planos/entities/assinatura-empresa.entity';
import { UsersService } from '../../users/users.service';
import { MailService } from '../../../mail/mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CoreAdminEmpresasService {
  private readonly logger = new Logger(CoreAdminEmpresasService.name);
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ModuloEmpresa)
    private moduloEmpresaRepository: Repository<ModuloEmpresa>,
    @InjectRepository(HistoricoPlano)
    private historicoPlanoRepository: Repository<HistoricoPlano>,
    private empresaModuloService: EmpresaModuloService,
    private planosService: PlanosService,
    private assinaturasService: AssinaturasService,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  /**
   * Listar todas as empresas com filtros e paginação
   */
  async listarTodas(filters: FilterEmpresasAdminDto) {
    const {
      search,
      status,
      plano,
      healthScoreMin,
      healthScoreMax,
      dataInicio,
      dataFim,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    const query = this.empresaRepository
      .createQueryBuilder('empresa')
      .leftJoinAndSelect('empresa.usuarios', 'usuarios');

    // Filtro de busca (nome, CNPJ ou email)
    if (search) {
      query.andWhere(
        '(empresa.nome ILIKE :search OR empresa.cnpj ILIKE :search OR empresa.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtro de status
    if (status) {
      query.andWhere('empresa.status = :status', { status });
    }

    // Filtro de plano
    if (plano) {
      query.andWhere('empresa.plano = :plano', { plano });
    }

    // Filtro de health score
    if (healthScoreMin !== undefined) {
      query.andWhere('empresa.health_score >= :healthScoreMin', { healthScoreMin });
    }
    if (healthScoreMax !== undefined) {
      query.andWhere('empresa.health_score <= :healthScoreMax', { healthScoreMax });
    }

    // Filtro de data (created_at)
    if (dataInicio) {
      query.andWhere('empresa.created_at >= :dataInicio', { dataInicio });
    }
    if (dataFim) {
      query.andWhere('empresa.created_at <= :dataFim', { dataFim });
    }

    // Ordenação
    query.orderBy(`empresa.${sortBy}`, sortOrder);

    // Paginação
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [empresas, total] = await query.getManyAndCount();

    return {
      data: empresas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar empresa por ID com todos os relacionamentos
   */
  async buscarPorId(id: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
      relations: ['usuarios'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    // Buscar módulos ativos
    const modulos = await this.empresaModuloService.listar(id);

    return {
      ...empresa,
      modulos,
    };
  }

  /**
   * Criar nova empresa (onboarding completo)
   */
  async criar(dto: CreateEmpresaAdminDto) {
    const nomeEmpresa = this.normalizeRequiredText(dto.nome, 'Nome da empresa');
    const cnpjEmpresa = this.normalizeCnpj(dto.cnpj);
    const emailEmpresa = this.normalizeRequiredEmail(dto.email, 'Email da empresa');
    const telefoneEmpresa = this.normalizeTelefone(dto.telefone);
    const enderecoEmpresa = this.normalizeOptionalText(dto.endereco) || '';
    const cidadeEmpresa = this.normalizeOptionalText(dto.cidade) || '';
    const estadoEmpresa = this.normalizeEstado(dto.estado) || '';
    const cepEmpresa = this.normalizeCep(dto.cep) || '';
    const adminNome = this.normalizeRequiredText(dto.admin_nome, 'Nome do administrador');
    const adminEmail = this.normalizeRequiredEmail(dto.admin_email, 'Email do administrador');

    this.logger.log(`Criando nova empresa: ${nomeEmpresa}`);

    const empresaExistente = await this.empresaRepository.findOne({
      where: { cnpj: cnpjEmpresa },
    });

    if (empresaExistente) {
      throw new BadRequestException('CNPJ ja cadastrado no sistema');
    }

    const emailExistente = await this.empresaRepository
      .createQueryBuilder('empresa')
      .where('LOWER(empresa.email) = LOWER(:email)', { email: emailEmpresa })
      .getOne();

    if (emailExistente) {
      throw new BadRequestException('Email da empresa ja cadastrado');
    }

    const emailAdminExistente = await this.userRepository
      .createQueryBuilder('usuario')
      .where('LOWER(usuario.email) = LOWER(:email)', { email: adminEmail })
      .getOne();

    if (emailAdminExistente) {
      throw new BadRequestException('Email do administrador ja cadastrado');
    }

    const slug = this.gerarSlug(nomeEmpresa);
    const subdominio = slug;

    const trialDays = Number.parseInt(String(dto.trial_days || '7'), 10) || 7;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    const planoCatalogo = await this.resolvePlanoFromInput(dto.plano || 'starter');
    const planoCode = planoCatalogo.codigo;
    const valorMensalCatalogo = this.toMoney(planoCatalogo.preco);

    const assinaturaStatusMap: Record<string, 'trial' | 'active' | 'past_due' | 'suspended' | 'canceled'> = {
      trial: 'trial',
      active: 'active',
      past_due: 'past_due',
      suspended: 'suspended',
      cancelled: 'canceled',
    };
    const assinaturaInicialStatus = assinaturaStatusMap[String(dto.status || 'trial')] || 'trial';

    const empresa = this.empresaRepository.create({
      nome: nomeEmpresa,
      slug,
      cnpj: cnpjEmpresa,
      email: emailEmpresa,
      telefone: telefoneEmpresa,
      endereco: enderecoEmpresa,
      cidade: cidadeEmpresa,
      estado: estadoEmpresa,
      cep: cepEmpresa,
      subdominio,
      plano: planoCode,
      status: dto.status || 'trial',
      trial_end_date: trialEndDate,
      valor_mensal: valorMensalCatalogo,
      limites: dto.limites || this.getLimitesPadrao(planoCode),
      account_manager_id: dto.account_manager_id,
      notas_internas: dto.notas_internas,
      ativo: true,
      email_verificado: false,
    });

    const empresaSalva = await this.empresaRepository.save(empresa);

    const hashedPassword = await bcrypt.hash(dto.admin_senha, 10);
    const adminUser = this.userRepository.create({
      nome: adminNome,
      email: adminEmail,
      senha: hashedPassword,
      role: UserRole.ADMIN,
      empresa_id: empresaSalva.id,
      ativo: true,
    });

    await this.userRepository.save(adminUser);

    const hoje = new Date();
    const proximoVencimento = new Date(hoje);
    proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

    await this.assinaturasService.criar({
      empresaId: empresaSalva.id,
      planoId: planoCatalogo.id,
      status: assinaturaInicialStatus,
      dataInicio: hoje.toISOString(),
      proximoVencimento: proximoVencimento.toISOString(),
      valorMensal: valorMensalCatalogo,
      renovacaoAutomatica: true,
      observacoes: `Assinatura criada via admin.criar em ${hoje.toISOString()}`,
    });

    await this.sincronizarModulosEmpresaComPlano(empresaSalva.id, planoCatalogo);

    this.logger.log(`Empresa criada com sucesso: ${empresaSalva.id}`);

    return this.buscarPorId(empresaSalva.id);
  }

  /**
   * Atualizar dados da empresa
   */
  async atualizar(id: string, dto: UpdateEmpresaAdminDto) {
    const empresa = await this.empresaRepository.findOne({ where: { id } });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} nao encontrada`);
    }

    const updatePayload: UpdateEmpresaAdminDto = { ...dto };
    const requestedPlan = typeof updatePayload.plano === 'string' ? updatePayload.plano.trim() : '';

    if (requestedPlan) {
      await this.mudarPlano(id, {
        plano: requestedPlan,
        motivo: 'Alteracao via admin.atualizar',
        valor_mensal: updatePayload.valor_mensal,
      });
      delete updatePayload.plano;
      delete updatePayload.valor_mensal;
    }

    if (typeof updatePayload.nome === 'string') {
      updatePayload.nome = this.normalizeRequiredText(updatePayload.nome, 'Nome da empresa');
      empresa.slug = this.gerarSlug(updatePayload.nome);
    }

    if (typeof updatePayload.cnpj === 'string') {
      const cnpjNormalizado = this.normalizeCnpj(updatePayload.cnpj);
      if (cnpjNormalizado !== empresa.cnpj) {
        const cnpjEmUso = await this.empresaRepository.findOne({ where: { cnpj: cnpjNormalizado } });
        if (cnpjEmUso && cnpjEmUso.id !== empresa.id) {
          throw new BadRequestException('CNPJ ja cadastrado no sistema');
        }
      }
      updatePayload.cnpj = cnpjNormalizado;
    }

    if (typeof updatePayload.email === 'string') {
      const emailNormalizado = this.normalizeRequiredEmail(updatePayload.email, 'Email da empresa');
      if (emailNormalizado.toLowerCase() !== String(empresa.email || '').toLowerCase()) {
        const emailEmUso = await this.empresaRepository
          .createQueryBuilder('empresa')
          .where('LOWER(empresa.email) = LOWER(:email)', { email: emailNormalizado })
          .getOne();

        if (emailEmUso && emailEmUso.id !== empresa.id) {
          throw new BadRequestException('Email da empresa ja cadastrado');
        }
      }
      updatePayload.email = emailNormalizado;
    }

    if (typeof updatePayload.telefone === 'string') {
      updatePayload.telefone = this.normalizeTelefone(updatePayload.telefone);
    }

    if (typeof updatePayload.endereco === 'string') {
      updatePayload.endereco = this.normalizeOptionalText(updatePayload.endereco) || '';
    }

    if (typeof updatePayload.cidade === 'string') {
      updatePayload.cidade = this.normalizeOptionalText(updatePayload.cidade) || '';
    }

    if (typeof updatePayload.estado === 'string') {
      updatePayload.estado = this.normalizeEstado(updatePayload.estado) || '';
    }

    if (typeof updatePayload.cep === 'string') {
      updatePayload.cep = this.normalizeCep(updatePayload.cep) || '';
    }

    if (Object.keys(updatePayload).length === 0) {
      return this.buscarPorId(id);
    }

    Object.assign(empresa, updatePayload);
    const empresaAtualizada = await this.empresaRepository.save(empresa);

    return this.buscarPorId(empresaAtualizada.id);
  }

  /**
   * Suspender empresa (bloquear acesso)
   */
  async suspender(id: string, motivo: string) {
    const empresa = await this.empresaRepository.findOne({ where: { id } });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    empresa.status = 'suspended';
    empresa.ativo = false;
    empresa.notas_internas = `${empresa.notas_internas || ''}\n\n[${new Date().toISOString()}] SUSPENSA: ${motivo}`;

    await this.empresaRepository.save(empresa);

    this.logger.warn(`⚠️ Empresa ${empresa.nome} foi suspensa. Motivo: ${motivo}`);

    await this.notificarStatusEmpresa(empresa, 'suspended', motivo);

    return { message: 'Empresa suspensa com sucesso', empresa };
  }

  /**
   * Reativar empresa (restaurar acesso)
   */
  async reativar(id: string) {
    const empresa = await this.empresaRepository.findOne({ where: { id } });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    empresa.status = 'active';
    empresa.ativo = true;
    empresa.notas_internas = `${empresa.notas_internas || ''}\n\n[${new Date().toISOString()}] REATIVADA`;

    await this.empresaRepository.save(empresa);

    this.logger.log(`✅ Empresa ${empresa.nome} foi reativada`);

    await this.notificarStatusEmpresa(empresa, 'active');

    return { message: 'Empresa reativada com sucesso', empresa };
  }

  /**
   * Calcular health score da empresa
   */
  async calcularHealthScore(id: string): Promise<number> {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
      relations: ['usuarios'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    let score = 0;

    // 1. Uso (40 pts)
    const diasSemUso = empresa.ultimo_acesso
      ? Math.floor((Date.now() - empresa.ultimo_acesso.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (diasSemUso === 0)
      score += 40; // Login hoje
    else if (diasSemUso <= 2)
      score += 35; // Login nos últimos 2 dias
    else if (diasSemUso <= 7)
      score += 25; // Login na semana
    else if (diasSemUso <= 30) score += 10; // Login no mês
    // else 0 pts

    // 2. Engajamento (30 pts)
    const usuariosAtivos = empresa.usuarios?.filter((u) => u.ativo).length || 0;
    const totalUsuarios = empresa.usuarios?.length || 1;
    const taxaAtivacao = usuariosAtivos / totalUsuarios;
    score += Math.round(taxaAtivacao * 30);

    // 3. Financeiro (20 pts)
    if (empresa.status === 'active') score += 20;
    else if (empresa.status === 'trial') score += 15;
    else if (empresa.status === 'past_due') score += 5;
    // else 0 pts

    // 4. Dados cadastrados (10 pts) - simplificado
    if (empresa.uso_mensal) {
      const temDados = (empresa.uso_mensal.clientes || 0) > 0;
      if (temDados) score += 10;
    }

    // Garantir que score está entre 0-100
    score = Math.max(0, Math.min(100, score));

    // Atualizar na base
    empresa.health_score = score;
    await this.empresaRepository.save(empresa);

    return score;
  }

  /**
   * Listar usuários da empresa
   */
  async listarUsuarios(empresaId: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${empresaId} não encontrada`);
    }

    return await this.userRepository.find({
      where: { empresa_id: empresaId },
      select: ['id', 'nome', 'email', 'role', 'ativo', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  async resetarSenhaUsuario(
    empresaId: string,
    usuarioId: string,
    actor: Pick<User, 'id' | 'nome' | 'email'>,
    reason?: string,
  ): Promise<{ usuarioId: string; novaSenha: string }> {
    const empresa = await this.empresaRepository.findOne({ where: { id: empresaId } });
    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${empresaId} nao encontrada`);
    }

    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId, empresa_id: empresaId },
      select: ['id', 'email', 'nome'],
    });
    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado para a empresa informada');
    }

    const normalizedReason = this.normalizeOptionalReason(reason);
    const novaSenha = await this.usersService.resetarSenha(usuarioId, empresaId, {
      actor,
      source: 'core-admin.empresas.resetarSenhaUsuario',
      reason: normalizedReason || undefined,
    });

    return {
      usuarioId: usuario.id,
      novaSenha,
    };
  }

  private async notificarStatusEmpresa(
    empresa: Empresa,
    status: 'suspended' | 'active',
    reason?: string,
  ): Promise<void> {
    const recipients = await this.resolverDestinatariosNotificacao(empresa.id, empresa.email);
    if (recipients.length === 0) {
      this.logger.warn(
        `Nenhum destinatario valido para notificacao de status da empresa ${empresa.id}`,
      );
      return;
    }

    try {
      await this.mailService.enviarEmailStatusEmpresa({
        to: recipients,
        empresa: empresa.nome,
        status,
        reason,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar notificacao de status da empresa ${empresa.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async resolverDestinatariosNotificacao(
    empresaId: string,
    companyEmail?: string | null,
  ): Promise<string[]> {
    const allowedRoles = new Set<UserRole>([
      UserRole.SUPERADMIN,
      UserRole.ADMIN,
      UserRole.GERENTE,
    ]);

    const users = await this.userRepository.find({
      where: { empresa_id: empresaId, ativo: true },
      select: ['email', 'role'],
    });

    const emails = new Set<string>();

    for (const user of users) {
      if (!allowedRoles.has(user.role)) {
        continue;
      }

      const normalized = this.normalizeEmail(user.email);
      if (normalized) {
        emails.add(normalized);
      }
    }

    const normalizedCompanyEmail = this.normalizeEmail(companyEmail);
    if (normalizedCompanyEmail) {
      emails.add(normalizedCompanyEmail);
    }

    return Array.from(emails);
  }

  private normalizeEmail(email?: string | null): string | null {
    const candidate = String(email || '')
      .trim()
      .toLowerCase();
    if (!candidate) {
      return null;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
  }

  private normalizeText(value?: string | null): string {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private normalizeOptionalText(value?: string | null): string | undefined {
    const normalized = this.normalizeText(value);
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeRequiredText(value: string, fieldLabel: string): string {
    const normalized = this.normalizeText(value);
    if (!normalized) {
      throw new BadRequestException(`${fieldLabel} invalido`);
    }
    return normalized;
  }

  private normalizeDigits(value?: string | null): string {
    return String(value || '').replace(/\D/g, '');
  }

  private normalizeCnpj(value: string): string {
    const digits = this.normalizeDigits(value);
    if (digits.length !== 14) {
      throw new BadRequestException('CNPJ invalido');
    }
    return digits;
  }

  private normalizeTelefone(value: string): string {
    const digits = this.normalizeDigits(value);
    if (digits.length < 10 || digits.length > 11) {
      throw new BadRequestException('Telefone invalido');
    }
    return digits;
  }

  private normalizeCep(value?: string | null): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const digits = this.normalizeDigits(value);
    if (!digits) {
      return undefined;
    }

    if (digits.length !== 8) {
      throw new BadRequestException('CEP invalido');
    }

    return digits;
  }

  private normalizeEstado(value?: string | null): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const normalized = this.normalizeText(value).toUpperCase();
    if (!normalized) {
      return undefined;
    }

    if (normalized.length !== 2) {
      throw new BadRequestException('Estado invalido');
    }

    return normalized;
  }

  private normalizeRequiredEmail(value: string, fieldLabel: string): string {
    const normalized = this.normalizeText(value).toLowerCase();
    if (!CoreAdminEmpresasService.EMAIL_REGEX.test(normalized)) {
      throw new BadRequestException(`${fieldLabel} invalido`);
    }
    return normalized;
  }

  private normalizeOptionalReason(input?: string): string | null {
    if (!input) {
      return null;
    }

    const normalized = input.trim();
    if (!normalized) {
      return null;
    }

    return normalized.slice(0, 2000);
  }

  /**
   * Helpers
   */
  private gerarSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços para hífen
      .replace(/-+/g, '-') // Múltiplos hífens para um
      .substring(0, 50); // Limitar tamanho
  }

  private getLimitesPadrao(plano: string) {
    const limites = {
      starter: {
        usuarios: 5,
        clientes: 1000,
        armazenamento: '5GB',
      },
      business: {
        usuarios: 50,
        clientes: 10000,
        armazenamento: '50GB',
      },
      enterprise: {
        usuarios: 999,
        clientes: 999999,
        armazenamento: '500GB',
      },
      custom: {
        usuarios: 999,
        clientes: 999999,
        armazenamento: '500GB',
      },
    };

    const normalized = this.resolvePlanCode(plano);
    return limites[normalized] || limites.starter;
  }

  /**
   * ========================================
   * GESTÃO DE MÓDULOS
   * ========================================
   */

  /**
   * Listar módulos de uma empresa
   */
  async listarModulos(empresaId: string): Promise<ModuloEmpresa[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} não encontrada`);
    }

    const modulos = await this.moduloEmpresaRepository.find({
      where: { empresaId },
      order: { modulo: 'ASC' },
    });

    this.logger.log(`Listados ${modulos.length} módulos da empresa ${empresa.nome}`);

    return modulos;
  }

  /**
   * Ativar módulo para uma empresa
   */
  async ativarModulo(empresaId: string, dto: CreateModuloEmpresaDto): Promise<ModuloEmpresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} não encontrada`);
    }

    // Verificar se módulo já existe
    const moduloExistente = await this.moduloEmpresaRepository.findOne({
      where: { empresaId, modulo: dto.modulo },
    });

    if (moduloExistente) {
      throw new BadRequestException(`Módulo ${dto.modulo} já está cadastrado para esta empresa`);
    }

    const modulo = this.moduloEmpresaRepository.create({
      empresaId,
      modulo: dto.modulo,
      ativo: dto.ativo !== undefined ? dto.ativo : true,
      limites: dto.limites || this.getLimitesPadraoModulo(dto.modulo, empresa.plano),
      configuracoes: dto.configuracoes || {},
      uso_atual: {
        usuarios: 0,
        leads: 0,
        storage_mb: 0,
        api_calls_dia: 0,
      },
    });

    const moduloSalvo = await this.moduloEmpresaRepository.save(modulo);

    this.logger.log(`Módulo ${dto.modulo} ativado para empresa ${empresa.nome}`);

    return moduloSalvo;
  }

  /**
   * Desativar módulo de uma empresa
   */
  async desativarModulo(empresaId: string, modulo: string): Promise<void> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} não encontrada`);
    }

    const moduloEmpresa = await this.moduloEmpresaRepository.findOne({
      where: { empresaId, modulo },
    });

    if (!moduloEmpresa) {
      throw new NotFoundException(`Módulo ${modulo} não encontrado para esta empresa`);
    }

    moduloEmpresa.ativo = false;
    moduloEmpresa.dataDesativacao = new Date();
    await this.moduloEmpresaRepository.save(moduloEmpresa);

    this.logger.log(`Módulo ${modulo} desativado para empresa ${empresa.nome}`);
  }

  /**
   * Atualizar limites de um módulo
   */
  async atualizarModulo(
    empresaId: string,
    modulo: string,
    dto: UpdateModuloEmpresaDto,
  ): Promise<ModuloEmpresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} não encontrada`);
    }

    const moduloEmpresa = await this.moduloEmpresaRepository.findOne({
      where: { empresaId, modulo },
    });

    if (!moduloEmpresa) {
      throw new NotFoundException(`Módulo ${modulo} não encontrado para esta empresa`);
    }

    if (dto.ativo !== undefined) {
      moduloEmpresa.ativo = dto.ativo;
      if (!dto.ativo) {
        moduloEmpresa.dataDesativacao = new Date();
      }
    }

    if (dto.limites) {
      moduloEmpresa.limites = { ...moduloEmpresa.limites, ...dto.limites };
    }

    if (dto.configuracoes) {
      moduloEmpresa.configuracoes = { ...moduloEmpresa.configuracoes, ...dto.configuracoes };
    }

    const moduloAtualizado = await this.moduloEmpresaRepository.save(moduloEmpresa);

    this.logger.log(`Módulo ${modulo} atualizado para empresa ${empresa.nome}`);

    return moduloAtualizado;
  }

  /**
   * ========================================
   * GESTÃO DE PLANOS
   * ========================================
   */

  /**
   * Listar histórico de mudanças de plano
   */
  async historicoPlanos(empresaId: string): Promise<HistoricoPlano[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} não encontrada`);
    }

    const historico = await this.historicoPlanoRepository.find({
      where: { empresaId },
      order: { dataAlteracao: 'DESC' },
    });

    this.logger.log(
      `Listado histórico de ${historico.length} mudanças de plano para ${empresa.nome}`,
    );

    return historico;
  }

  private normalizePlanInput(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private toMoney(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Number(parsed.toFixed(2));
  }

  private extractPlanoModuleCodes(plano: Plano): string[] {
    return (plano.modulosInclusos || [])
      .map((item) => String(item?.modulo?.codigo || '').trim())
      .filter(Boolean);
  }

  private async sincronizarModulosEmpresaComPlano(empresaId: string, plano: Plano): Promise<void> {
    const modulos = this.extractPlanoModuleCodes(plano);
    if (modulos.length === 0) {
      throw new BadRequestException(
        `Plano "${plano.codigo}" sem modulos vinculados no catalogo.`,
      );
    }

    await this.empresaModuloService.sincronizarModulosPlano(empresaId, modulos, plano.codigo);
  }

  private resolvePlanCode(rawInput: string): string {
    const normalized = this.normalizePlanInput(rawInput);
    const aliases: Record<string, string> = {
      starter: 'starter',
      start: 'starter',
      basico: 'starter',
      basic: 'starter',
      professional: 'business',
      profissonal: 'business',
      profissional: 'business',
      pro: 'business',
      business: 'business',
      enterprise: 'enterprise',
      custom: 'custom',
      personalizado: 'custom',
    };

    return aliases[normalized] || normalized;
  }

  private async resolvePlanoFromInput(planoInput: string): Promise<Plano> {
    const resolvedCode = this.resolvePlanCode(planoInput);

    try {
      return await this.planosService.buscarPorCodigo(resolvedCode);
    } catch {
      const normalizedName = this.normalizePlanInput(planoInput);
      const planosAtivos = await this.planosService.listarTodos();
      const byName = planosAtivos.find(
        (item) => this.normalizePlanInput(item.nome) === normalizedName,
      );

      if (byName) {
        return byName;
      }

      throw new BadRequestException(`Plano "${planoInput}" nao encontrado no catalogo`);
    }
  }

  /**
   * Mudar plano de uma empresa
   */
  async mudarPlano(empresaId: string, dto: MudarPlanoDto): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa ${empresaId} nao encontrada`);
    }

    const planoDestino = await this.resolvePlanoFromInput(dto.plano);
    const assinaturaAtual = await this.assinaturasService.buscarPorEmpresa(empresaId);
    const statusAtual = assinaturaAtual
      ? toCanonicalAssinaturaStatus(assinaturaAtual.status)
      : null;

    const planoAnterior = assinaturaAtual?.plano?.codigo || empresa.plano || 'trial';
    const valorAnterior = this.toMoney(assinaturaAtual?.valorMensal ?? empresa.valor_mensal ?? 0);

    if (
      dto.valor_mensal !== undefined &&
      this.toMoney(dto.valor_mensal) !== this.toMoney(planoDestino.preco)
    ) {
      this.logger.warn(
        `valor_mensal manual ignorado para empresa ${empresaId}; usando preco do catalogo (${planoDestino.codigo})`,
      );
    }

    let assinaturaAtualizada = assinaturaAtual;

    if (!assinaturaAtual || statusAtual === 'canceled') {
      const hoje = new Date();
      const proximoVencimento = new Date(hoje);
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

      assinaturaAtualizada = await this.assinaturasService.criar({
        empresaId,
        planoId: planoDestino.id,
        status: 'active',
        dataInicio: hoje.toISOString(),
        proximoVencimento: proximoVencimento.toISOString(),
        valorMensal: this.toMoney(planoDestino.preco),
        renovacaoAutomatica: true,
        observacoes: `Assinatura criada via admin.mudarPlano em ${hoje.toISOString()}`,
      });
    } else if (assinaturaAtual.plano?.id !== planoDestino.id) {
      assinaturaAtualizada = await this.assinaturasService.alterarPlano(empresaId, planoDestino.id);
    }

    await this.sincronizarModulosEmpresaComPlano(empresaId, planoDestino);

    const valorNovo = this.toMoney(assinaturaAtualizada?.valorMensal ?? planoDestino.preco);

    const historico = this.historicoPlanoRepository.create({
      empresaId,
      planoAnterior: planoAnterior || 'trial',
      planoNovo: planoDestino.codigo,
      valorAnterior,
      valorNovo,
      motivo: dto.motivo || 'Alteracao manual pelo admin',
      alteradoPor: dto.alterado_por,
    });

    await this.historicoPlanoRepository.save(historico);

    // Legacy fields remain synchronized, but assinatura is the source of truth.
    empresa.plano = planoDestino.codigo;
    empresa.valor_mensal = valorNovo;

    const empresaAtualizada = await this.empresaRepository.save(empresa);

    this.logger.log(
      `Plano da empresa ${empresa.nome} alterado via assinatura de ${planoAnterior} para ${planoDestino.codigo}`,
    );

    return empresaAtualizada;
  }

  /**
   * Obter limites padrão de um módulo baseado no plano
   */
  private getLimitesPadraoModulo(modulo: string, plano: string): Record<string, number> {
    const limitesBasePorPlano = {
      starter: {
        usuarios: 5,
        leads: 1000,
        storage_mb: 1024, // 1GB
        api_calls_dia: 5000,
        whatsapp_conexoes: 1,
        email_envios_dia: 100,
      },
      business: {
        usuarios: 20,
        leads: 10000,
        storage_mb: 10240, // 10GB
        api_calls_dia: 50000,
        whatsapp_conexoes: 5,
        email_envios_dia: 1000,
      },
      enterprise: {
        usuarios: 100,
        leads: 100000,
        storage_mb: 102400, // 100GB
        api_calls_dia: 500000,
        whatsapp_conexoes: 20,
        email_envios_dia: 10000,
      },
      custom: {
        usuarios: 999,
        leads: 999999,
        storage_mb: 1048576, // 1TB
        api_calls_dia: 9999999,
        whatsapp_conexoes: 100,
        email_envios_dia: 100000,
      },
    };

    const planoNormalizado = this.resolvePlanCode(plano || 'starter');
    return limitesBasePorPlano[planoNormalizado] || limitesBasePorPlano.starter;
  }
}

