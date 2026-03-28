import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationService } from '../../../notifications/notification.service';
import { UserActivitiesService } from '../../users/services/user-activities.service';
import { AdminBreakGlassAccessService } from '../../users/services/admin-break-glass-access.service';
import { AtividadeTipo } from '../../users/entities/user-activity.entity';
import {
  UserAccessChangeRequest,
  UserAccessChangeStatus,
} from '../../users/entities/user-access-change-request.entity';
import { User, UserRole } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { FilterEmpresasAdminDto } from '../dto/filter-empresas-admin.dto';
import { CoreAdminEmpresasService } from './core-admin-empresas.service';

type UsersReadScopeFilters = {
  user_ids?: string[];
  allowed_roles?: UserRole[];
};

type ListUsersInput = {
  busca?: string;
  role?: string;
  ativo?: boolean;
  ordenacao?: string;
  direcao?: string;
  limite?: number;
  pagina?: number;
};

type ListAuditActivitiesInput = {
  limit?: number;
  usuarioId?: string;
  tipo?: AtividadeTipo;
  dataInicio?: string;
  dataFim?: string;
  adminOnly?: boolean;
};

@Injectable()
export class CoreAdminBffService {
  private readonly adminAuditCategories = new Set<string>([
    'admin_user_audit',
    'admin_access_review',
    'admin_bff_audit',
    'user_access_change_workflow',
    'admin_break_glass',
  ]);

  constructor(
    private readonly usersService: UsersService,
    private readonly userActivitiesService: UserActivitiesService,
    private readonly coreAdminEmpresasService: CoreAdminEmpresasService,
    private readonly notificationService: NotificationService,
    private readonly adminBreakGlassAccessService: AdminBreakGlassAccessService,
  ) {}

  async getOverview(actor: User): Promise<Record<string, unknown>> {
    const [stats, accessRequests, notifications, breakGlassRequests, breakGlassActive] =
      await Promise.all([
        this.usersService.obterEstatisticas(actor.empresa_id),
        this.usersService.listAccessChangeRequests(actor.empresa_id, {
          status: UserAccessChangeStatus.REQUESTED,
          limit: 100,
        }),
        this.notificationService.findByUser(actor.id, true),
        this.adminBreakGlassAccessService.listRequests(actor, {
          status: 'REQUESTED',
          limit: 100,
        }),
        this.adminBreakGlassAccessService.listActiveAccesses(actor, {
          limit: 100,
        }),
      ]);

    const adminSecurityAlerts = notifications.filter((notification) => {
      const category = this.extractNotificationCategory(notification?.data);
      return category === 'admin_security_alert';
    });

    return {
      generated_at: new Date().toISOString(),
      empresa_id: actor.empresa_id,
      users: {
        total: Number(stats?.total ?? 0),
        ativos: Number(stats?.ativos ?? 0),
        inativos: Number(stats?.inativos ?? 0),
      },
      pending_access_requests: accessRequests.length,
      admin_security_alerts: adminSecurityAlerts.length,
      pending_break_glass_requests: Array.isArray(breakGlassRequests)
        ? breakGlassRequests.length
        : 0,
      active_break_glass_accesses: Array.isArray(breakGlassActive)
        ? breakGlassActive.length
        : 0,
    };
  }

  async listUsers(actor: User, input: ListUsersInput) {
    const scopeFilters = this.resolveUsersReadScopeFilters(actor);
    const limite = this.clamp(input.limite, 1, 100, 20);
    const pagina = this.clamp(input.pagina, 1, 1000, 1);
    const filtros = {
      busca: input.busca || '',
      role: input.role || '',
      ativo: input.ativo,
      ordenacao: input.ordenacao || 'nome',
      direcao: input.direcao || 'asc',
      limite,
      pagina,
      empresa_id: actor.empresa_id,
      ...scopeFilters,
    };

    const result = await this.usersService.listarComFiltros(filtros);
    return {
      items: result.usuarios.map((usuario) => this.sanitizeUser(usuario)),
      total: result.total,
      pagina,
      limite,
    };
  }

  async listAccessChangeRequests(
    actor: User,
    filters: { status?: string; limit?: number } = {},
  ): Promise<Record<string, unknown>[]> {
    const data = await this.usersService.listAccessChangeRequests(actor.empresa_id, filters);
    return data.map((item) => this.serializeAccessChangeRequest(item));
  }

  async approveAccessChangeRequest(
    actor: User,
    requestId: string,
    reason?: string,
  ): Promise<{ request: Record<string, unknown>; applied_user: Record<string, unknown> | null }> {
    const result = await this.usersService.approveAccessChangeRequest({
      requestId,
      empresaId: actor.empresa_id,
      approver: {
        id: actor.id,
        nome: actor.nome,
        email: actor.email,
      },
      decisionReason: this.normalizeOptionalReason(reason),
    });

    return {
      request: this.serializeAccessChangeRequest(result.request),
      applied_user: this.sanitizeUser(result.appliedUser),
    };
  }

  async rejectAccessChangeRequest(
    actor: User,
    requestId: string,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    const request = await this.usersService.rejectAccessChangeRequest({
      requestId,
      empresaId: actor.empresa_id,
      reviewer: {
        id: actor.id,
        nome: actor.nome,
        email: actor.email,
      },
      decisionReason: this.normalizeOptionalReason(reason),
    });

    return this.serializeAccessChangeRequest(request);
  }

  async generateAccessReviewReport(
    actor: User,
    options: {
      role?: string;
      includeInactive?: boolean;
      limit?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    return this.usersService.generateAccessReviewReport(actor.empresa_id, options);
  }

  async recertifyAccess(
    actor: User,
    targetUserId: string,
    approved: boolean,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    await this.ensureCanManageUser(actor, targetUserId, 'recertificar acesso de');

    const result = await this.usersService.recertifyUserAccess({
      empresaId: actor.empresa_id,
      targetUserId,
      approved,
      reason: this.normalizeOptionalReason(reason),
      responsible: {
        id: actor.id,
        nome: actor.nome,
        email: actor.email,
      },
      source: 'core-admin.bff.recertify',
    });

    return {
      decision: result.decision,
      action_taken: result.action_taken,
      activity_id: result.activity_id,
      target_user: this.sanitizeUser(result.targetUser),
    };
  }

  async listCompanies(filters: FilterEmpresasAdminDto) {
    return this.coreAdminEmpresasService.listarTodas(filters);
  }

  async listAuditActivities(
    actor: User,
    options: ListAuditActivitiesInput = {},
  ): Promise<Record<string, unknown>[]> {
    const data = await this.userActivitiesService.listarAtividades(actor.empresa_id, {
      limit: this.clamp(options.limit, 1, 200, 50),
      usuarioId: options.usuarioId,
      tipo: options.tipo,
      dataInicio: options.dataInicio,
      dataFim: options.dataFim,
    });

    const adminOnly = options.adminOnly !== false;
    const normalizedData = Array.isArray(data) ? data : [];

    return normalizedData
      .map((entry) => {
        const details = this.parseDetails(entry?.detalhes);
        const categoria = typeof details?.categoria === 'string' ? details.categoria : null;
        const evento = typeof details?.evento === 'string' ? details.evento : null;

        return {
          ...entry,
          categoria,
          evento,
        };
      })
      .filter((entry) => !adminOnly || this.isAdminAuditCategory(entry.categoria));
  }

  async listBreakGlassRequests(
    actor: User,
    filters: { status?: string; limit?: number; targetUserId?: string } = {},
  ): Promise<Record<string, unknown>[]> {
    return this.adminBreakGlassAccessService.listRequests(actor, {
      status: filters.status,
      limit: filters.limit,
      targetUserId: filters.targetUserId,
    });
  }

  async requestBreakGlassAccess(
    actor: User,
    params: {
      targetUserId: string;
      scopePermissions: string[];
      durationMinutes?: number;
      reason: string;
    },
  ): Promise<Record<string, unknown>> {
    return this.adminBreakGlassAccessService.requestAccess({
      actor,
      targetUserId: params.targetUserId,
      scopePermissions: params.scopePermissions,
      durationMinutes: params.durationMinutes,
      requestReason: params.reason,
    });
  }

  async approveBreakGlassRequest(
    actor: User,
    requestId: string,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    return this.adminBreakGlassAccessService.approveRequest({
      actor,
      requestId,
      approvalReason: this.normalizeOptionalReason(reason),
    });
  }

  async rejectBreakGlassRequest(
    actor: User,
    requestId: string,
    reason: string,
  ): Promise<Record<string, unknown>> {
    return this.adminBreakGlassAccessService.rejectRequest({
      actor,
      requestId,
      rejectionReason: reason,
    });
  }

  async revokeBreakGlassAccess(
    actor: User,
    requestId: string,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    return this.adminBreakGlassAccessService.revokeActiveAccess({
      actor,
      requestId,
      revocationReason: this.normalizeOptionalReason(reason),
    });
  }

  async listActiveBreakGlassAccesses(
    actor: User,
    filters: { limit?: number; targetUserId?: string } = {},
  ): Promise<Record<string, unknown>[]> {
    return this.adminBreakGlassAccessService.listActiveAccesses(actor, {
      limit: filters.limit,
      targetUserId: filters.targetUserId,
    });
  }

  private normalizeOptionalReason(input?: string): string | undefined {
    if (!input) {
      return undefined;
    }

    const normalized = input.trim();
    if (!normalized) {
      return undefined;
    }

    return normalized.slice(0, 2000);
  }

  private parseDetails(input: unknown): Record<string, unknown> | null {
    if (typeof input !== 'string' || !input.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(input);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private isAdminAuditCategory(category: unknown): boolean {
    if (typeof category !== 'string') {
      return false;
    }
    return this.adminAuditCategories.has(category);
  }

  private extractNotificationCategory(input: unknown): string | null {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return null;
    }

    const category = (input as Record<string, unknown>).category;
    return typeof category === 'string' ? category : null;
  }

  private serializeAccessChangeRequest(request: UserAccessChangeRequest): Record<string, unknown> {
    const safePayload =
      request.requestPayload && typeof request.requestPayload === 'object'
        ? { ...(request.requestPayload as Record<string, unknown>) }
        : {};

    if ('senha' in safePayload) {
      safePayload.senha = '[REDACTED]';
    }
    if ('password' in safePayload) {
      safePayload.password = '[REDACTED]';
    }

    return {
      id: request.id,
      empresa_id: request.empresaId,
      action: request.action,
      status: request.status,
      target_user_id: request.targetUserId,
      request_payload: safePayload,
      request_reason: request.requestReason,
      decision_reason: request.decisionReason,
      decided_at: request.decidedAt ?? null,
      applied_at: request.appliedAt ?? null,
      applied_user_id: request.appliedUserId ?? null,
      created_at: request.createdAt,
      updated_at: request.updatedAt,
      requested_by: request.requestedByUser
        ? {
            id: request.requestedByUser.id,
            nome: request.requestedByUser.nome,
            email: request.requestedByUser.email,
          }
        : null,
      decided_by: request.decidedByUser
        ? {
            id: request.decidedByUser.id,
            nome: request.decidedByUser.nome,
            email: request.decidedByUser.email,
          }
        : null,
      target_user: request.targetUser
        ? {
            id: request.targetUser.id,
            nome: request.targetUser.nome,
            email: request.targetUser.email,
            role: request.targetUser.role,
          }
        : null,
      applied_user: request.appliedUser
        ? {
            id: request.appliedUser.id,
            nome: request.appliedUser.nome,
            email: request.appliedUser.email,
            role: request.appliedUser.role,
          }
        : null,
    };
  }

  private sanitizeUser(user?: User | null): Record<string, unknown> | null {
    if (!user) {
      return null;
    }

    const { senha, ...safeUser } = user as User & { senha?: string };
    return safeUser as Record<string, unknown>;
  }

  private async ensureCanManageUser(actor: User, userId: string, action: string): Promise<void> {
    const target = await this.usersService.findOne(userId, actor.empresa_id);
    if (!target) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const actorRole = this.normalizeRoleInput(actor.role) ?? UserRole.VENDEDOR;
    const targetRole = this.normalizeRoleInput(target.role);

    if (target.id === actor.id && actorRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        `Nao e permitido ${action} o proprio usuario por este endpoint`,
      );
    }

    if (!targetRole || !this.getManageableRoles(actorRole).has(targetRole)) {
      throw new ForbiddenException(`Sem permissao para ${action} este usuario`);
    }
  }

  private resolveUsersReadScopeFilters(actor: User): UsersReadScopeFilters {
    const actorRole = this.normalizeRoleInput(actor.role);

    if (actorRole === UserRole.SUPERADMIN || actorRole === UserRole.ADMIN) {
      return {};
    }

    if (actorRole === UserRole.GERENTE) {
      const manageableRoles = Array.from(this.getManageableRoles(actorRole));
      if (!actor.id) {
        return { allowed_roles: manageableRoles };
      }

      return {
        user_ids: [actor.id],
        allowed_roles: manageableRoles,
      };
    }

    return actor.id ? { user_ids: [actor.id] } : {};
  }

  private normalizeRoleInput(role: unknown): UserRole | null {
    if (typeof role !== 'string') {
      return null;
    }

    const normalized = role.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    switch (normalized) {
      case 'superadmin':
        return UserRole.SUPERADMIN;
      case 'admin':
      case 'administrador':
        return UserRole.ADMIN;
      case 'gerente':
      case 'manager':
      case 'gestor':
        return UserRole.GERENTE;
      case 'vendedor':
        return UserRole.VENDEDOR;
      case 'suporte':
      case 'support':
      case 'user':
      case 'usuario':
      case 'operacional':
        return UserRole.SUPORTE;
      case 'financeiro':
        return UserRole.FINANCEIRO;
      default:
        return null;
    }
  }

  private getManageableRoles(actorRole: UserRole): Set<UserRole> {
    if (actorRole === UserRole.SUPERADMIN) {
      return new Set([
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.GERENTE,
        UserRole.VENDEDOR,
        UserRole.SUPORTE,
        UserRole.FINANCEIRO,
      ]);
    }

    if (actorRole === UserRole.ADMIN) {
      return new Set([UserRole.GERENTE, UserRole.VENDEDOR, UserRole.SUPORTE, UserRole.FINANCEIRO]);
    }

    if (actorRole === UserRole.GERENTE) {
      return new Set([UserRole.VENDEDOR, UserRole.SUPORTE]);
    }

    return new Set();
  }

  private clamp(value: number | undefined, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.trunc(value as number)));
  }
}
