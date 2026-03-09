import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtividadeTipo } from '../users/entities/user-activity.entity';
import { User, UserRole } from '../users/user.entity';
import { FilterEmpresasAdminDto } from '../admin/dto/filter-empresas-admin.dto';
import { AdminBffAuditInterceptor } from '../admin/interceptors/admin-bff-audit.interceptor';
import { AdminBffService } from '../admin/services/admin-bff.service';
import { AssinaturasService } from '../planos/assinaturas.service';
import { AssinaturaDueDateSchedulerService } from '../planos/assinatura-due-date-scheduler.service';
import {
  ASSINATURA_STATUS_VALUES,
  isAssinaturaStatus,
  toCanonicalAssinaturaStatus,
} from '../planos/entities/assinatura-empresa.entity';
import { GuardianMfaGuard } from './guardian-mfa.guard';
import { GuardianCriticalAuditInterceptor } from './interceptors/guardian-critical-audit.interceptor';
import { GuardianCriticalAudit } from './entities/guardian-critical-audit.entity';
import { GuardianCapabilitiesService } from './services/guardian-capabilities.service';
import { GuardianCriticalAuditService } from './services/guardian-critical-audit.service';
import { GuardianPolicySnapshotService } from './services/guardian-policy-snapshot.service';
import { GuardianRuntimeAlertService } from './services/guardian-runtime-alert.service';

@Controller('guardian/bff')
@UseGuards(JwtAuthGuard, GuardianMfaGuard, EmpresaGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(AdminBffAuditInterceptor, GuardianCriticalAuditInterceptor)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.USERS_READ)
export class GuardianBffController {
  constructor(
    private readonly adminBffService: AdminBffService,
    private readonly assinaturasService: AssinaturasService,
    private readonly assinaturaDueDateSchedulerService: AssinaturaDueDateSchedulerService,
    private readonly guardianCapabilitiesService: GuardianCapabilitiesService,
    private readonly guardianCriticalAuditService: GuardianCriticalAuditService,
    private readonly guardianPolicySnapshotService: GuardianPolicySnapshotService,
    private readonly guardianRuntimeAlertService: GuardianRuntimeAlertService,
  ) {}

  @Get('capabilities')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getCapabilities() {
    return {
      success: true,
      data: this.guardianCapabilitiesService.getCapabilities(),
    };
  }

  @Get('runtime-context')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getRuntimeContext() {
    await this.guardianRuntimeAlertService.syncRuntimePolicy();
    return {
      success: true,
      data: this.guardianCapabilitiesService.getRuntimeContext(),
    };
  }

  @Get('runtime-history')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getRuntimeHistory(@Query('limit') limit?: string) {
    await this.guardianRuntimeAlertService.syncRuntimePolicy();
    return {
      success: true,
      data: await this.guardianPolicySnapshotService.list(
        this.parseOptionalPositiveInt(limit, 'limit') ?? 20,
      ),
    };
  }

  @Get('overview')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getOverview(@CurrentUser() user: User) {
    return {
      success: true,
      data: await this.adminBffService.getOverview(user),
    };
  }

  @Get('users')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listUsers(
    @CurrentUser() user: User,
    @Query('busca') busca?: string,
    @Query('role') role?: string,
    @Query('ativo') ativo?: string,
    @Query('ordenacao') ordenacao?: string,
    @Query('direcao') direcao?: string,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listUsers(user, {
        busca,
        role,
        ativo: this.parseOptionalBoolean(ativo, 'ativo'),
        ordenacao,
        direcao,
        limite: this.parseOptionalPositiveInt(limite, 'limite'),
        pagina: this.parseOptionalPositiveInt(pagina, 'pagina'),
      }),
    };
  }

  @Get('access-change-requests')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listAccessChangeRequests(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const normalizedStatus = this.normalizeAccessChangeStatus(status);
    return {
      success: true,
      data: await this.adminBffService.listAccessChangeRequests(user, {
        status: normalizedStatus,
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
      }),
    };
  }

  @Post('access-change-requests/:id/approve')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async approveAccessChangeRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.approveAccessChangeRequest(user, requestId, body?.reason),
      message: 'Solicitacao aprovada e aplicada com sucesso',
    };
  }

  @Post('access-change-requests/:id/reject')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async rejectAccessChangeRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.rejectAccessChangeRequest(user, requestId, body?.reason),
      message: 'Solicitacao rejeitada com sucesso',
    };
  }

  @Get('break-glass/requests')
  @Permissions(Permission.USERS_READ)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listBreakGlassRequests(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('target_user_id') targetUserId?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listBreakGlassRequests(user, {
        status,
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
        targetUserId,
      }),
    };
  }

  @Post('break-glass/requests')
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async requestBreakGlassAccess(
    @CurrentUser() user: User,
    @Body()
    body: {
      target_user_id?: string;
      permissions?: string[] | string;
      duration_minutes?: number;
      reason?: string;
    },
  ) {
    this.guardianCapabilitiesService.assertBreakGlassRequestCreationAllowed();

    const targetUserId =
      typeof body?.target_user_id === 'string' ? body.target_user_id.trim() : '';
    if (!targetUserId) {
      throw new BadRequestException('Campo target_user_id obrigatorio');
    }

    const reason = this.normalizeOptionalReason(body?.reason);
    if (!reason) {
      throw new BadRequestException('Campo reason obrigatorio');
    }

    const permissions = this.normalizePermissionsInput(body?.permissions);

    return {
      success: true,
      data: await this.adminBffService.requestBreakGlassAccess(user, {
        targetUserId,
        scopePermissions: permissions,
        durationMinutes:
          typeof body?.duration_minutes === 'number'
            ? Math.trunc(body.duration_minutes)
            : undefined,
        reason,
      }),
      message: 'Solicitacao de acesso emergencial registrada com sucesso',
    };
  }

  @Post('break-glass/requests/:id/approve')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async approveBreakGlassRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.approveBreakGlassRequest(user, requestId, body?.reason),
      message: 'Solicitacao de acesso emergencial aprovada',
    };
  }

  @Post('break-glass/requests/:id/reject')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async rejectBreakGlassRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    const reason = this.normalizeOptionalReason(body?.reason);
    if (!reason) {
      throw new BadRequestException('Campo reason obrigatorio');
    }

    return {
      success: true,
      data: await this.adminBffService.rejectBreakGlassRequest(user, requestId, reason),
      message: 'Solicitacao de acesso emergencial rejeitada',
    };
  }

  @Get('break-glass/active')
  @Permissions(Permission.USERS_READ)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listActiveBreakGlassAccesses(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('target_user_id') targetUserId?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listActiveBreakGlassAccesses(user, {
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
        targetUserId,
      }),
    };
  }

  @Post('break-glass/:id/revoke')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async revokeBreakGlassAccess(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.revokeBreakGlassAccess(user, requestId, body?.reason),
      message: 'Acesso emergencial revogado com sucesso',
    };
  }

  @Get('access-review/report')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getAccessReviewReport(
    @CurrentUser() user: User,
    @Query('role') role?: string,
    @Query('include_inactive') includeInactive?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.generateAccessReviewReport(user, {
        role,
        includeInactive: this.parseOptionalBoolean(includeInactive, 'include_inactive'),
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
      }),
    };
  }

  @Post('access-review/recertify')
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async recertifyAccess(
    @CurrentUser() user: User,
    @Body()
    body: {
      target_user_id?: string;
      approved?: boolean;
      reason?: string;
    },
  ) {
    this.guardianCapabilitiesService.assertDirectAccessRecertificationAllowed();

    const targetUserId =
      typeof body?.target_user_id === 'string' ? body.target_user_id.trim() : '';
    if (!targetUserId) {
      throw new BadRequestException('Campo target_user_id obrigatorio');
    }
    if (typeof body?.approved !== 'boolean') {
      throw new BadRequestException('Campo approved obrigatorio e deve ser booleano');
    }

    const normalizedReason = this.normalizeOptionalReason(body?.reason);
    if (!body.approved && !normalizedReason) {
      throw new BadRequestException('Informe reason ao reprovar uma recertificacao');
    }

    return {
      success: true,
      data: await this.adminBffService.recertifyAccess(
        user,
        targetUserId,
        body.approved,
        normalizedReason,
      ),
      message: 'Recertificacao registrada com sucesso',
    };
  }

  @Get('companies')
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listCompanies(@Query() filters: FilterEmpresasAdminDto) {
    const result = await this.adminBffService.listCompanies(filters);
    return {
      success: true,
      data: result?.data ?? [],
      meta: result?.meta ?? null,
    };
  }

  @Get('audit/activities')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listAuditActivities(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('usuario_id') usuarioId?: string,
    @Query('tipo') tipo?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('admin_only') adminOnly?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listAuditActivities(user, {
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
        usuarioId,
        tipo: this.parseOptionalAtividadeTipo(tipo),
        dataInicio,
        dataFim,
        adminOnly: this.parseOptionalBoolean(adminOnly, 'admin_only'),
      }),
    };
  }

  @Get('billing/subscriptions')
  @Permissions(Permission.PLANOS_MANAGE)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listBillingSubscriptions(
    @Query() filters: FilterEmpresasAdminDto,
    @Query('subscription_status') subscriptionStatus?: string,
  ) {
    const normalizedStatus = this.parseOptionalAssinaturaStatus(subscriptionStatus);
    const result = await this.adminBffService.listCompanies(filters);
    const companies = Array.isArray(result?.data) ? result.data : [];

    const items = await Promise.all(
      companies.map(async (company) => {
        const empresaId = typeof company?.id === 'string' ? company.id : '';
        const assinatura = empresaId ? await this.assinaturasService.buscarPorEmpresa(empresaId) : null;
        const canonicalStatus = assinatura ? toCanonicalAssinaturaStatus(assinatura.status) : null;

        return {
          empresa: {
            id: empresaId || null,
            nome: typeof company?.nome === 'string' ? company.nome : null,
            status: typeof company?.status === 'string' ? company.status : null,
            plano: typeof company?.plano === 'string' ? company.plano : null,
            ativo: typeof company?.ativo === 'boolean' ? company.ativo : null,
          },
          assinatura: assinatura
            ? {
                id: assinatura.id,
                status: assinatura.status,
                status_canonico: canonicalStatus,
                valor_mensal: assinatura.valorMensal,
                proximo_vencimento: assinatura.proximoVencimento,
                renovacao_automatica: assinatura.renovacaoAutomatica,
                plano: assinatura.plano
                  ? {
                      id: assinatura.plano.id,
                      nome: assinatura.plano.nome,
                    }
                  : null,
                criado_em: assinatura.criadoEm,
                atualizado_em: assinatura.atualizadoEm,
              }
            : null,
        };
      }),
    );

    const filteredItems = normalizedStatus
      ? items.filter((item) => item.assinatura?.status_canonico === normalizedStatus)
      : items;

    return {
      success: true,
      data: filteredItems,
      meta: {
        ...(result?.meta || {}),
        total_filtered: filteredItems.length,
        available_statuses: ASSINATURA_STATUS_VALUES,
      },
    };
  }

  @Patch('billing/subscriptions/:empresaId/suspend')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.PLANOS_MANAGE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async suspendBillingSubscription(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() body: { reason?: string },
  ) {
    const reason = this.normalizeOptionalReason(body?.reason);
    if (!reason) {
      throw new BadRequestException('Campo reason obrigatorio');
    }

    const assinatura = await this.assinaturasService.suspender(empresaId);
    return {
      success: true,
      data: {
        empresa_id: empresaId,
        assinatura_id: assinatura.id,
        status: assinatura.status,
        status_canonico: toCanonicalAssinaturaStatus(assinatura.status),
        reason,
      },
      message: 'Assinatura suspensa com sucesso',
    };
  }

  @Patch('billing/subscriptions/:empresaId/reactivate')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.PLANOS_MANAGE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async reactivateBillingSubscription(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() body: { reason?: string },
  ) {
    const reason = this.normalizeOptionalReason(body?.reason);
    if (!reason) {
      throw new BadRequestException('Campo reason obrigatorio');
    }

    const assinatura = await this.assinaturasService.reativar(empresaId);
    return {
      success: true,
      data: {
        empresa_id: empresaId,
        assinatura_id: assinatura.id,
        status: assinatura.status,
        status_canonico: toCanonicalAssinaturaStatus(assinatura.status),
        reason,
      },
      message: 'Assinatura reativada com sucesso',
    };
  }

  @Post('billing/subscriptions/jobs/due-date-cycle')
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.PLANOS_MANAGE)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async runBillingDueDateCycle() {
    this.guardianCapabilitiesService.assertManualBillingDueDateCycleAllowed();

    return {
      success: true,
      data: await this.assinaturaDueDateSchedulerService.runDueDateStatusCycle(),
      message: 'Ciclo de vencimento executado com sucesso',
    };
  }

  @Get('audit/critical')
  @Permissions(Permission.USERS_READ)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listCriticalAudit(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('outcome') outcome?: string,
    @Query('method') method?: string,
    @Query('actor_user_id') actorUserId?: string,
    @Query('target_type') targetType?: string,
    @Query('target_id') targetId?: string,
    @Query('request_id') requestId?: string,
    @Query('route') route?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
  ) {
    const result = await this.guardianCriticalAuditService.list({
      page: this.parseOptionalPositiveInt(page, 'page'),
      limit: this.parseOptionalPositiveInt(limit, 'limit'),
      outcome,
      method,
      actorUserId,
      targetType,
      targetId,
      requestId,
      route,
      dataInicio,
      dataFim,
    });

    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('audit/critical/export')
  @Permissions(Permission.USERS_READ)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async exportCriticalAudit(
    @Query('format') format?: string,
    @Query('limit') limit?: string,
    @Query('outcome') outcome?: string,
    @Query('method') method?: string,
    @Query('actor_user_id') actorUserId?: string,
    @Query('target_type') targetType?: string,
    @Query('target_id') targetId?: string,
    @Query('request_id') requestId?: string,
    @Query('route') route?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
  ) {
    const normalizedFormat = this.parseAuditExportFormat(format);
    const items = await this.guardianCriticalAuditService.listForExport({
      limit: this.parseOptionalPositiveInt(limit, 'limit'),
      outcome,
      method,
      actorUserId,
      targetType,
      targetId,
      requestId,
      route,
      dataInicio,
      dataFim,
    });

    if (normalizedFormat === 'csv') {
      return {
        success: true,
        format: 'csv',
        data: this.toCriticalAuditCsv(items),
      };
    }

    return {
      success: true,
      format: 'json',
      data: items,
    };
  }

  private normalizeAccessChangeStatus(status?: string): string | undefined {
    if (!status) {
      return undefined;
    }

    const normalizedStatus = status.trim().toUpperCase();
    const allowed = new Set<string>(['REQUESTED', 'APPROVED', 'REJECTED']);
    if (!allowed.has(normalizedStatus)) {
      throw new BadRequestException('Status invalido. Use REQUESTED, APPROVED ou REJECTED.');
    }

    return normalizedStatus;
  }

  private parseOptionalAssinaturaStatus(status?: string): ReturnType<typeof toCanonicalAssinaturaStatus> | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = status.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (!isAssinaturaStatus(normalized)) {
      throw new BadRequestException(
        `Parametro subscription_status invalido. Use: ${ASSINATURA_STATUS_VALUES.join(', ')}`,
      );
    }

    return toCanonicalAssinaturaStatus(normalized);
  }

  private parseOptionalPositiveInt(rawValue: string | undefined, fieldName: string): number | undefined {
    if (rawValue === undefined) {
      return undefined;
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(`Parametro ${fieldName} invalido`);
    }

    return parsed;
  }

  private parseOptionalBoolean(value: string | undefined, fieldName: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }

    throw new BadRequestException(`Parametro ${fieldName} invalido`);
  }

  private parseOptionalAtividadeTipo(tipo?: string): AtividadeTipo | undefined {
    if (!tipo) {
      return undefined;
    }

    const candidate = tipo.trim().toUpperCase() as AtividadeTipo;
    const allowed = new Set<AtividadeTipo>(Object.values(AtividadeTipo));
    if (!allowed.has(candidate)) {
      throw new BadRequestException('Parametro tipo invalido');
    }

    return candidate;
  }

  private parseAuditExportFormat(format?: string): 'json' | 'csv' {
    if (!format) {
      return 'json';
    }

    const normalized = format.trim().toLowerCase();
    if (normalized === 'json' || normalized === 'csv') {
      return normalized;
    }

    throw new BadRequestException('Parametro format invalido. Use json ou csv.');
  }

  private toCriticalAuditCsv(items: GuardianCriticalAudit[]): string {
    const escapeCell = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const normalized = String(value).replace(/"/g, '""');
      return `"${normalized}"`;
    };

    const header = [
      'id',
      'created_at',
      'actor_user_id',
      'actor_role',
      'actor_email',
      'target_type',
      'target_id',
      'http_method',
      'route',
      'status_code',
      'outcome',
      'request_id',
      'error_message',
    ];

    const rows = items.map((item) =>
      [
        item.id,
        item.createdAt ? item.createdAt.toISOString() : '',
        item.actorUserId,
        item.actorRole,
        item.actorEmail,
        item.targetType,
        item.targetId,
        item.httpMethod,
        item.route,
        item.statusCode,
        item.outcome,
        item.requestId,
        item.errorMessage,
      ]
        .map(escapeCell)
        .join(','),
    );

    return [header.map(escapeCell).join(','), ...rows].join('\n');
  }

  private normalizePermissionsInput(input: unknown): string[] {
    if (Array.isArray(input)) {
      const parsed = input
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        return parsed;
      }
      throw new BadRequestException('Campo permissions obrigatorio');
    }

    if (typeof input === 'string') {
      const parsed = input
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        return parsed;
      }
      throw new BadRequestException('Campo permissions obrigatorio');
    }

    throw new BadRequestException('Campo permissions obrigatorio');
  }

  private normalizeOptionalReason(input: unknown): string | undefined {
    if (input === undefined || input === null) {
      return undefined;
    }

    if (typeof input !== 'string') {
      throw new BadRequestException('Campo reason invalido');
    }

    const normalized = input.trim();
    if (!normalized) {
      return undefined;
    }

    return normalized.slice(0, 2000);
  }
}
