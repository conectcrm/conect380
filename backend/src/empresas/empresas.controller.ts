import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Param,
  HttpStatus,
  HttpException,
  Put,
  UseGuards,
  Request,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmpresaCardEstatisticasResumo, EmpresasService } from './empresas.service';
import {
  CreateEmpresaDto,
  ReenviarEmailAtivacaoDto,
  VerificarEmailDto,
} from './dto/empresas.dto';
import { CreateMinhaEmpresaDto } from './dto/minhas-empresas.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Permission } from '../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { UserRole } from '../modules/users/user.entity';
import { Empresa } from './entities/empresa.entity';

const strictBodyValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  private buildPublicEmpresaPayload(empresa: Partial<Empresa>) {
    return {
      id: empresa.id,
      nome: empresa.nome,
      email: empresa.email,
      plano: empresa.plano,
      status: empresa.status,
      subdominio: empresa.subdominio,
      ativo: empresa.ativo,
      email_verificado: empresa.email_verificado,
      created_at: empresa.created_at,
      updated_at: empresa.updated_at,
    };
  }

  private extractRequestIp(req: any): string | null {
    const forwardedFor = req?.headers?.['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim() || null;
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return String(forwardedFor[0]).trim() || null;
    }

    return req?.ip || req?.socket?.remoteAddress || null;
  }

  private extractUserAgent(req: any): string | null {
    const userAgent = req?.headers?.['user-agent'];
    return typeof userAgent === 'string' && userAgent.trim() ? userAgent.trim() : null;
  }


  @Post('registro')
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  @UsePipes(strictBodyValidationPipe)
  @ApiOperation({ summary: 'Registrar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Empresa já existe' })
  async registrarEmpresa(@Body() createEmpresaDto: CreateEmpresaDto, @Request() req: any) {

    try {
      const empresa = await this.empresasService.registrarEmpresa(createEmpresaDto, {
        ip: this.extractRequestIp(req),
        userAgent: this.extractUserAgent(req),
      });
      return {
        success: true,
        message: empresa.email_verificado
          ? 'Empresa registrada com sucesso.'
          : 'Empresa registrada com sucesso. Verifique seu email para ativar a conta.',
        data: this.buildPublicEmpresaPayload(empresa),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verificar-cnpj/:cnpj')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'Verificar disponibilidade de CNPJ' })
  async verificarCNPJ(@Param('cnpj') cnpj: string) {
    try {
      const disponivel = await this.empresasService.verificarCNPJDisponivel(cnpj);
      return {
        disponivel,
        message: disponivel ? 'CNPJ disponível' : 'CNPJ já cadastrado',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro ao verificar CNPJ', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('verificar-email/:email')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'Verificar disponibilidade de email' })
  async verificarEmail(@Param('email') email: string) {
    try {
      const disponivel = await this.empresasService.verificarEmailDisponivel(email);
      return {
        disponivel,
        message: disponivel ? 'Email disponível' : 'Email já cadastrado',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro ao verificar email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verificar-email')
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'Verificar email de ativação' })
  @UsePipes(strictBodyValidationPipe)
  async verificarEmailAtivacao(@Body() verificarEmailDto: VerificarEmailDto) {
    try {
      const resultado = await this.empresasService.verificarEmailAtivacao(verificarEmailDto.token);
      return {
        success: true,
        message: 'Email verificado com sucesso!',
        data: this.buildPublicEmpresaPayload(resultado),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Token inválido ou expirado',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reenviar-ativacao')
  @Throttle({ default: { limit: 3, ttl: 5 * 60 * 1000 } })
  @ApiOperation({ summary: 'Reenviar email de ativação' })
  @UsePipes(strictBodyValidationPipe)
  async reenviarEmailAtivacao(@Body() body: ReenviarEmailAtivacaoDto) {
    try {
      await this.empresasService.reenviarEmailAtivacao(body.email);
    } catch (error) {
      if (!(error instanceof HttpException) || error.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
        throw new HttpException(
          'Erro ao processar reenvio de ativacao',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return {
      success: true,
      message:
        'Se o email estiver cadastrado e pendente de ativacao, um novo link sera enviado.',
    };
  }

  @Get('subdominio/:subdominio')
  @ApiOperation({ summary: 'Obter empresa por subdomínio' })
  async obterEmpresaPorSubdominio(@Param('subdominio') subdominio: string) {
    try {
      const empresa = await this.empresasService.obterPorSubdominio(subdominio);
      if (!empresa) {
        throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
      }
      return empresa;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id([0-9a-fA-F-]{36})')
  @ApiOperation({ summary: 'Obter empresa por ID' })
  async obterEmpresaPorId(@Param('id') id: string) {
    try {
      const empresa = await this.empresasService.obterPorId(id);
      if (!empresa) {
        throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
      }
      return empresa;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.CONFIG_EMPRESA_UPDATE)
  @ApiOperation({ summary: 'Atualizar dados da empresa' })
  async atualizarEmpresa(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateEmpresaDto>,
  ) {
    try {
      const empresaIdUsuario = req.user?.empresa_id;
      if (!empresaIdUsuario || empresaIdUsuario !== id) {
        throw new HttpException('Acesso negado para atualizar esta empresa', HttpStatus.FORBIDDEN);
      }

      const empresa = await this.empresasService.atualizarEmpresa(id, updateData);
      return {
        success: true,
        message: 'Empresa atualizada com sucesso',
        data: empresa,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao atualizar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('planos')
  @ApiOperation({ summary: 'Listar planos disponíveis' })
  async listarPlanos() {
    try {
      const planos = await this.empresasService.listarPlanos();
      return planos;
    } catch (error) {
      throw new HttpException('Erro ao listar planos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('status/:empresaId')
  @ApiOperation({ summary: 'Verificar status da empresa' })
  async verificarStatusEmpresa(@Param('empresaId') empresaId: string) {
    try {
      const status = await this.empresasService.verificarStatusEmpresa(empresaId);
      return status;
    } catch (error) {
      throw new HttpException(
        'Erro ao verificar status da empresa',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Controller('minhas-empresas')
@ApiTags('minhas-empresas')
export class MinhasEmpresasController {
  private readonly platformOwnerEmpresaIds: Set<string>;

  constructor(private readonly empresasService: EmpresasService) {
    this.platformOwnerEmpresaIds = this.parseOwnerIds(process.env.PLATFORM_OWNER_EMPRESA_IDS);
  }

  private parseOwnerIds(raw?: string): Set<string> {
    if (!raw || typeof raw !== 'string') {
      return new Set();
    }

    return new Set(
      raw
        .split(/[;,]/g)
        .map((value) => value.trim())
        .filter(Boolean),
    );
  }

  private static readonly SWITCH_BLOCKED_STATUS = new Set([
    'suspended',
    'suspensa',
    'inactive',
    'inativa',
    'canceled',
    'cancelada',
  ]);

  private buildCardPermissions(
    user: { role?: string; permissions?: unknown } | null | undefined,
    canManageEmpresas: boolean,
  ) {
    const isSuperadmin = this.isSuperadmin(user);

    return {
      podeEditarConfiguracoes:
        isSuperadmin || this.hasPermission(user, Permission.CONFIG_EMPRESA_UPDATE),
      podeGerenciarUsuarios:
        isSuperadmin ||
        this.hasPermission(user, Permission.USERS_READ) ||
        this.hasPermission(user, Permission.USERS_CREATE) ||
        this.hasPermission(user, Permission.USERS_UPDATE),
      podeVerRelatorios:
        isSuperadmin ||
        this.hasPermission(user, Permission.RELATORIOS_READ) ||
        this.hasPermission(user, Permission.DASHBOARD_READ),
      podeExportarDados:
        isSuperadmin ||
        this.hasPermission(user, Permission.RELATORIOS_READ) ||
        this.hasPermission(user, Permission.DASHBOARD_READ),
      podeAlterarPlano: isSuperadmin || this.hasPermission(user, Permission.PLANOS_MANAGE),
      podeGerenciarEmpresas: canManageEmpresas,
    };
  }

  private mapPlano(planoRaw: string, valorMensal: number | null, limites?: Record<string, any>) {
    const plano = (planoRaw || 'starter').toString().toLowerCase();

    const limitesUsuarios =
      typeof limites?.usuarios === 'number' ? limites.usuarios : plano === 'enterprise' ? -1 : 0;
    const limitesClientes =
      typeof limites?.clientes === 'number' ? limites.clientes : plano === 'enterprise' ? -1 : 0;
    const limitesArmazenamento =
      typeof limites?.armazenamento === 'string'
        ? limites.armazenamento
        : plano === 'enterprise'
          ? 'Ilimitado'
          : '0GB';

    if (plano === 'enterprise') {
      return {
        id: 'enterprise',
        nome: 'Enterprise',
        preco: Number(valorMensal ?? 0),
        features: [],
        limitesUsuarios,
        limitesClientes,
        limitesArmazenamento,
        limites: {
          usuarios: limitesUsuarios,
          clientes: limitesClientes,
          armazenamento: limitesArmazenamento,
        },
      };
    }

    if (plano === 'professional' || plano === 'business' || plano === 'pro') {
      return {
        id: 'business',
        nome: 'Business',
        preco: Number(valorMensal ?? 0),
        features: [],
        limitesUsuarios,
        limitesClientes,
        limitesArmazenamento,
        limites: {
          usuarios: limitesUsuarios,
          clientes: limitesClientes,
          armazenamento: limitesArmazenamento,
        },
      };
    }

    return {
      id: 'starter',
      nome: 'Starter',
      preco: Number(valorMensal ?? 0),
      features: [],
      limitesUsuarios,
      limitesClientes,
      limitesArmazenamento,
      limites: {
        usuarios: limitesUsuarios,
        clientes: limitesClientes,
        armazenamento: limitesArmazenamento,
      },
    };
  }

  private mapStatus(statusRaw: string | null | undefined, ativo: boolean): string {
    const status = (statusRaw || '').toLowerCase();
    if (status === 'ativa' || status === 'active') {
      return 'ativa';
    }

    if (status === 'trial') {
      return 'trial';
    }

    if (status === 'suspensa' || status === 'suspended' || status === 'past_due') {
      return 'suspensa';
    }

    if (
      status === 'inativa' ||
      status === 'inactive' ||
      status === 'cancelada' ||
      status === 'canceled'
    ) {
      return 'inativa';
    }

    if (status === 'ativa' || status === 'trial' || status === 'suspensa' || status === 'inativa') {
      return status;
    }
    return ativo ? 'ativa' : 'inativa';
  }

  private isSuperadmin(user: { role?: string } | null | undefined): boolean {
    return String(user?.role || '').toLowerCase() === UserRole.SUPERADMIN;
  }

  private hasPermission(
    user: { permissions?: unknown } | null | undefined,
    permission: Permission,
  ): boolean {
    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
    return permissions.some(
      (value) => String(value || '').trim().toLowerCase() === String(permission).toLowerCase(),
    );
  }

  private extractEmpresaIdFromUser(
    user:
      | { empresa_id?: string | null; empresaId?: string | null; empresa?: { id?: string | null } | null }
      | null
      | undefined,
  ): string | null {
    const candidates = [user?.empresa_id, user?.empresaId, user?.empresa?.id];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
    return null;
  }

  private canManageEmpresasPortfolio(
    user: { role?: string; permissions?: unknown } | null | undefined,
  ): boolean {
    return this.isSuperadmin(user) || this.hasPermission(user, Permission.ADMIN_EMPRESAS_MANAGE);
  }

  private isPlatformOwnerEmpresa(empresaId: string | null | undefined): boolean {
    const normalized = String(empresaId || '').trim();
    if (!normalized) {
      return false;
    }

    return this.platformOwnerEmpresaIds.has(normalized);
  }

  private canManageEmpresasNoPainelMinhasEmpresas(
    user: { role?: string; permissions?: unknown } | null | undefined,
    empresaIdContexto: string | null | undefined,
  ): boolean {
    return (
      this.canManageEmpresasPortfolio(user) &&
      !this.isPlatformOwnerEmpresa(empresaIdContexto)
    );
  }

  private async resolvePortfolioOwnerKey(empresaIdContexto: string): Promise<string> {
    const resolvedOwnerKey = await this.empresasService.resolverOwnerKeyPortfolioPorEmpresa(
      empresaIdContexto,
    );
    const normalizedContext = String(empresaIdContexto || '').trim();
    const normalizedOwner = String(resolvedOwnerKey || '').trim();

    // Minhas Empresas deve permanecer no escopo do cliente.
    // Se a empresa estiver vinculada ao tenant proprietario da plataforma,
    // limitamos o portfolio ao proprio tenant de contexto.
    if (
      normalizedContext &&
      normalizedOwner &&
      normalizedOwner !== normalizedContext &&
      this.platformOwnerEmpresaIds.has(normalizedOwner)
    ) {
      return normalizedContext;
    }

    return normalizedOwner || normalizedContext;
  }

  private async obterEmpresasDoPortfolio(
    empresaIdContexto: string,
  ): Promise<Empresa[]> {
    if (this.isPlatformOwnerEmpresa(empresaIdContexto)) {
      const empresaContexto = await this.empresasService.obterPorId(empresaIdContexto);
      return [empresaContexto];
    }

    const ownerKey = await this.resolvePortfolioOwnerKey(empresaIdContexto);

    await this.empresasService.vincularEmpresaAoPortfolioSeAusente(empresaIdContexto, ownerKey);

    const empresasPortfolio = await this.empresasService.listarEmpresasDoPortfolio(ownerKey);
    if (empresasPortfolio.some((empresa) => empresa.id === empresaIdContexto)) {
      return empresasPortfolio;
    }

    const empresaContexto = await this.empresasService.obterPorId(empresaIdContexto);
    return [empresaContexto, ...empresasPortfolio];
  }

  private async assertCanManageEmpresaTarget(
    user:
      | {
          id?: string | null;
          role?: string;
          permissions?: unknown;
        }
      | null
      | undefined,
    empresaIdContexto: string | null,
    empresaIdAlvo: string,
  ): Promise<void> {
    const canManagePortfolio = this.canManageEmpresasPortfolio(user);
    if (!canManagePortfolio) {
      throw new HttpException(
        'Usuario nao possui permissao para gerenciar empresas',
        HttpStatus.FORBIDDEN,
      );
    }

    if (this.isPlatformOwnerEmpresa(empresaIdContexto)) {
      throw new HttpException(
        'Operacao indisponivel neste painel para tenant proprietario da plataforma',
        HttpStatus.FORBIDDEN,
      );
    }

    const normalizedTargetId = String(empresaIdAlvo || '').trim();
    if (empresaIdContexto && normalizedTargetId === String(empresaIdContexto).trim()) {
      return;
    }

    if (!empresaIdContexto) {
      throw new HttpException('Escopo de portfolio nao identificado', HttpStatus.FORBIDDEN);
    }
    const ownerKey = await this.resolvePortfolioOwnerKey(empresaIdContexto);

    const pertenceAoPortfolio = await this.empresasService.empresaPertenceAoPortfolio(
      normalizedTargetId,
      ownerKey,
    );

    if (!pertenceAoPortfolio) {
      throw new HttpException(
        'Acesso permitido apenas para empresas do mesmo proprietario',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private normalizeText(value: unknown, fallback = 'Nao informado'): string {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized.length > 0 ? normalized : fallback;
  }

  private normalizeUf(value: unknown): string {
    const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
    return /^[A-Z]{2}$/.test(normalized) ? normalized : 'SP';
  }

  private normalizeCep(value: unknown): string {
    const raw = typeof value === 'string' ? value.trim() : '';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 8) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }

    return '00000-000';
  }

  private composeEndereco(value: CreateMinhaEmpresaDto['endereco']): string {
    if (!value || typeof value !== 'object') {
      return 'Nao informado';
    }

    const rua = this.normalizeText(value.rua, '');
    const numero = this.normalizeText(value.numero, '');
    const complemento = this.normalizeText(value.complemento, '');
    const bairro = this.normalizeText(value.bairro, '');

    const linhaPrincipal = [rua, numero].filter(Boolean).join(', ');
    const linhaSecundaria = [complemento, bairro].filter(Boolean).join(' - ');
    const enderecoComposto = [linhaPrincipal, linhaSecundaria].filter(Boolean).join(' | ');

    return enderecoComposto || 'Nao informado';
  }

  private gerarSenhaTemporaria(): string {
    const blocoAleatorio = Math.random().toString(36).slice(2, 8);
    return `Tmp#${Date.now().toString(36)}${blocoAleatorio}1A`;
  }

  private mapEmpresaCard(
    empresa: Empresa,
    isActive: boolean,
    cardPermissions?: ReturnType<MinhasEmpresasController['buildCardPermissions']>,
    cardStats?: EmpresaCardEstatisticasResumo,
  ) {
    const dataCriacao = empresa.created_at ? empresa.created_at.toISOString() : new Date().toISOString();
    const dataVencimento = empresa.data_expiracao ? empresa.data_expiracao.toISOString() : dataCriacao;
    const ultimoAcesso = empresa.ultimo_acesso ? empresa.ultimo_acesso.toISOString() : dataCriacao;
    const plano = this.mapPlano(empresa.plano, empresa.valor_mensal, empresa.limites || {});
    const status = this.mapStatus(empresa.status, empresa.ativo);
    const resolvedCardPermissions = cardPermissions ?? {
      podeEditarConfiguracoes: true,
      podeGerenciarUsuarios: true,
      podeVerRelatorios: true,
      podeExportarDados: true,
      podeAlterarPlano: true,
      podeGerenciarEmpresas: true,
    };
    const resolvedCardStats = cardStats ?? {
      usuariosAtivos: 0,
      totalUsuarios: 0,
      clientesCadastrados: 0,
    };

    return {
      id: empresa.id,
      nome: empresa.nome,
      descricao: null,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone,
      endereco: empresa.endereco,
      plano,
      status,
      isActive,
      dataVencimento,
      dataCriacao,
      ultimoAcesso,
      configuracoes: (empresa.configuracoes as Record<string, unknown>) || {},
      estatisticas: {
        usuariosAtivos: resolvedCardStats.usuariosAtivos,
        totalUsuarios: resolvedCardStats.totalUsuarios,
        clientesCadastrados: resolvedCardStats.clientesCadastrados,
        propostasEsteAno: 0,
        propostasEsteMes: 0,
        faturaAcumulada: 0,
        crescimentoMensal: 0,
        armazenamentoUsado: '0GB',
        armazenamentoTotal: plano.limitesArmazenamento,
        ultimasAtividades: [],
      },
      permissoes: {
        ...resolvedCardPermissions,
      },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter empresas do usuario' })
  @ApiResponse({ status: 200, description: 'Lista de empresas retornada com sucesso' })
  async getMinhasEmpresas(@Request() req) {
    try {
      const empresaId = this.extractEmpresaIdFromUser(req.user);
      const canManageEmpresasPortfolio = this.canManageEmpresasNoPainelMinhasEmpresas(
        req.user,
        empresaId,
      );
      const cardPermissions = this.buildCardPermissions(req.user, canManageEmpresasPortfolio);
      if (!empresaId) {
        throw new HttpException('empresa_id ausente no token', HttpStatus.UNAUTHORIZED);
      }

      if (canManageEmpresasPortfolio) {
        const empresasPortfolio = await this.obterEmpresasDoPortfolio(empresaId);
        const estatisticasByEmpresa = await this.empresasService.obterEstatisticasCardEmpresas(
          empresasPortfolio.map((empresa) => empresa.id),
        );

        return {
          success: true,
          empresas: empresasPortfolio.map((empresa) =>
            this.mapEmpresaCard(
              empresa,
              empresa.id === empresaId,
              cardPermissions,
              estatisticasByEmpresa[empresa.id],
            ),
          ),
        };
      }

      const empresa = await this.empresasService.obterPorId(empresaId);
      const estatisticasByEmpresa =
        await this.empresasService.obterEstatisticasCardEmpresas([empresa.id]);

      return {
        success: true,
        empresas: [this.mapEmpresaCard(empresa, true, cardPermissions, estatisticasByEmpresa[empresa.id])],
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Erro ao buscar empresas',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  @UsePipes(strictBodyValidationPipe)
  @ApiOperation({ summary: 'Criar nova empresa via area administrativa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  async criarEmpresa(@Request() req, @Body() body: CreateMinhaEmpresaDto) {
    try {
      const empresaIdContexto = this.extractEmpresaIdFromUser(req.user);
      if (!empresaIdContexto) {
        throw new HttpException('empresa_id ausente no token', HttpStatus.UNAUTHORIZED);
      }

      if (!this.canManageEmpresasNoPainelMinhasEmpresas(req.user, empresaIdContexto)) {
        throw new HttpException(
          'Operacao indisponivel neste painel para tenant proprietario da plataforma',
          HttpStatus.FORBIDDEN,
        );
      }
      const ownerKey = await this.resolvePortfolioOwnerKey(empresaIdContexto);
      await this.empresasService.vincularEmpresaAoPortfolioSeAusente(empresaIdContexto, ownerKey);

      const endereco = body.endereco;
      const senhaTemporaria =
        body.usuarioAdmin?.senha?.trim() || this.gerarSenhaTemporaria();

      const payload: CreateEmpresaDto = {
        empresa: {
          nome: body.nome,
          cnpj: body.cnpj,
          email: body.email,
          telefone: body.telefone,
          endereco: this.composeEndereco(endereco),
          cidade: this.normalizeText(endereco?.cidade),
          estado: this.normalizeUf(endereco?.estado),
          cep: this.normalizeCep(endereco?.cep),
        },
        usuario: {
          nome: this.normalizeText(body.usuarioAdmin?.nome, body.nome),
          email: this.normalizeText(body.usuarioAdmin?.email, body.email).toLowerCase(),
          senha: senhaTemporaria,
          telefone: this.normalizeText(body.usuarioAdmin?.telefone, body.telefone),
        },
        plano: this.normalizeText(body.planoId, 'starter').toLowerCase(),
        aceitarTermos: true,
      };

      const empresaCriada = await this.empresasService.registrarEmpresa(payload);
      await this.empresasService.vincularEmpresaAoPortfolio(empresaCriada.id, ownerKey);
      await this.empresasService.marcarAdminEmpresaComoSenhaTemporaria(empresaCriada.id);
      const estatisticasByEmpresa =
        await this.empresasService.obterEstatisticasCardEmpresas([empresaCriada.id]);

      return {
        ...this.mapEmpresaCard(empresaCriada, false, undefined, estatisticasByEmpresa[empresaCriada.id]),
        credenciaisAdmin: {
          email: payload.usuario.email,
          senhaTemporaria,
          deveTrocarSenhaNoPrimeiroAcesso: true,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao criar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':empresaId([0-9a-fA-F-]{36})/suspender')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  @ApiOperation({ summary: 'Suspender empresa pelo painel de minhas empresas' })
  async suspenderEmpresa(
    @Request() req,
    @Param('empresaId') empresaId: string,
    @Body() body: { motivo?: string },
  ) {
    try {
      const empresaIdContexto = this.extractEmpresaIdFromUser(req.user);
      await this.assertCanManageEmpresaTarget(req.user, empresaIdContexto, empresaId);
      const motivo = typeof body?.motivo === 'string' ? body.motivo.trim() : '';
      const empresa = await this.empresasService.suspenderEmpresa(
        empresaId,
        motivo || 'Suspensao manual',
      );

      return {
        success: true,
        message: 'Empresa suspensa com sucesso',
        empresa: this.mapEmpresaCard(
          empresa,
          empresa.id === empresaIdContexto,
          this.buildCardPermissions(
            req.user,
            this.canManageEmpresasNoPainelMinhasEmpresas(req.user, empresaIdContexto),
          ),
        ),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao suspender empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':empresaId([0-9a-fA-F-]{36})/reativar')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  @ApiOperation({ summary: 'Reativar empresa pelo painel de minhas empresas' })
  async reativarEmpresa(@Request() req, @Param('empresaId') empresaId: string) {
    try {
      const empresaIdContexto = this.extractEmpresaIdFromUser(req.user);
      await this.assertCanManageEmpresaTarget(req.user, empresaIdContexto, empresaId);
      const empresa = await this.empresasService.reativarEmpresa(empresaId);

      return {
        success: true,
        message: 'Empresa reativada com sucesso',
        empresa: this.mapEmpresaCard(
          empresa,
          empresa.id === empresaIdContexto,
          this.buildCardPermissions(
            req.user,
            this.canManageEmpresasNoPainelMinhasEmpresas(req.user, empresaIdContexto),
          ),
        ),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao reativar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':empresaId([0-9a-fA-F-]{36})/cancelar-servico')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.PLANOS_MANAGE)
  @ApiOperation({ summary: 'Cancelar servico da empresa (assinatura)' })
  async cancelarServicoEmpresa(
    @Request() req,
    @Param('empresaId') empresaId: string,
    @Body() body: { dataFim?: string },
  ) {
    try {
      const empresaIdContexto = this.extractEmpresaIdFromUser(req.user);
      await this.assertCanManageEmpresaTarget(req.user, empresaIdContexto, empresaId);
      const dataFimRaw = typeof body?.dataFim === 'string' ? body.dataFim.trim() : '';
      const dataFim = dataFimRaw ? new Date(dataFimRaw) : undefined;
      if (dataFim && Number.isNaN(dataFim.getTime())) {
        throw new HttpException('dataFim invalida', HttpStatus.BAD_REQUEST);
      }

      const assinatura = await this.empresasService.cancelarServicoEmpresa(empresaId, dataFim);

      return {
        success: true,
        message: 'Servico cancelado com sucesso',
        assinatura,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao cancelar servico',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('switch')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Alternar contexto da empresa ativa' })
  @ApiResponse({ status: 200, description: 'Contexto da empresa atualizado com sucesso' })
  async switchEmpresa(@Request() req, @Body() body: { empresaId?: string }) {
    try {
      const empresaIdUsuario = this.extractEmpresaIdFromUser(req.user);
      const empresaIdSolicitada = body?.empresaId;

      if (!empresaIdUsuario) {
        throw new HttpException('empresa_id ausente no token', HttpStatus.UNAUTHORIZED);
      }

      if (!empresaIdSolicitada) {
        throw new HttpException('empresaId é obrigatório', HttpStatus.BAD_REQUEST);
      }

      const canManageEmpresasPortfolio = this.canManageEmpresasNoPainelMinhasEmpresas(
        req.user,
        empresaIdUsuario,
      );

      // Usuarios comuns permanecem no proprio contexto.
      // Gestores podem alternar entre empresas do mesmo portfolio.
      if (empresaIdSolicitada !== empresaIdUsuario) {
        if (!canManageEmpresasPortfolio) {
          throw new HttpException(
            'Usuário não possui acesso à empresa informada',
            HttpStatus.FORBIDDEN,
          );
        }

        await this.assertCanManageEmpresaTarget(req.user, empresaIdUsuario, empresaIdSolicitada);
      }

      const empresa = await this.empresasService.obterPorId(empresaIdSolicitada);
      const empresaStatus = String(empresa.status || '')
        .trim()
        .toLowerCase();
      const agora = Date.now();
      const trialExpirado =
        empresaStatus === 'trial' &&
        ((empresa.trial_end_date && new Date(empresa.trial_end_date).getTime() < agora) ||
          (empresa.data_expiracao && new Date(empresa.data_expiracao).getTime() < agora));

      if (
        !empresa.ativo ||
        MinhasEmpresasController.SWITCH_BLOCKED_STATUS.has(empresaStatus) ||
        trialExpirado
      ) {
        throw new HttpException(
          'A empresa informada esta indisponivel para acesso no momento',
          HttpStatus.CONFLICT,
        );
      }

      if (canManageEmpresasPortfolio && empresaIdSolicitada !== empresaIdUsuario) {
        await this.empresasService.atualizarEmpresaDoUsuario(req.user.id, empresaIdSolicitada);
      }

      return {
        success: true,
        empresaId: empresa.id,
        configuracoes: (empresa.configuracoes as Record<string, unknown>) || {},
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Erro ao alternar empresa',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
