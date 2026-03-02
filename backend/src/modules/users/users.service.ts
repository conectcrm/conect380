import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { EmpresaConfig } from '../empresas/entities/empresa-config.entity';
import { AtividadeTipo, UserActivity } from './entities/user-activity.entity';
import {
  UserAccessChangeAction,
  UserAccessChangeRequest,
  UserAccessChangeStatus,
} from './entities/user-access-change-request.entity';
import { Notification, NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationService } from '../../notifications/notification.service';
import { securityLogger } from '../../config/logger.config';

type UsersReadScopeInput = {
  user_ids?: unknown;
  allowed_roles?: unknown;
};

type UsersReadScopeFilters = {
  userIds: string[];
  allowedRoles: UserRole[];
};

type LgpdPrivacyRequestType = 'data_export' | 'account_anonymization' | 'account_deletion';
type LgpdPrivacyRequestStatus = 'open' | 'in_review' | 'completed' | 'rejected';
type AdministrativeAuditActor = Pick<User, 'id' | 'nome' | 'email'>;
type AdministrativeAuditContext = {
  actor?: AdministrativeAuditActor;
  source?: string;
  reason?: string | null;
  relatedRequestId?: string | null;
};
type AdminSecurityAlertSeverity = 'medium' | 'high' | 'critical';
type AdministrativeAuditField =
  | 'id'
  | 'nome'
  | 'email'
  | 'role'
  | 'permissoes'
  | 'empresa_id'
  | 'ativo'
  | 'telefone'
  | 'avatar_url'
  | 'idioma_preferido'
  | 'status_atendente'
  | 'capacidade_maxima'
  | 'tickets_ativos'
  | 'deve_trocar_senha';

const ATENDIMENTO_PERMISSION_TOKENS = [
  'ATENDIMENTO',
  'ATENDIMENTO_DLQ_MANAGE',
  'ATENDIMENTO_CHATS_REPLY',
  'ATENDIMENTO_TICKETS_READ',
  'ATENDIMENTO_CHATS_READ',
  'ATENDIMENTO_TICKETS_CREATE',
  'ATENDIMENTO_TICKETS_UPDATE',
  'ATENDIMENTO_TICKETS_ASSIGN',
  'ATENDIMENTO_TICKETS_CLOSE',
  'ATENDIMENTO_FILAS_MANAGE',
  'ATENDIMENTO_SLA_MANAGE',
  'atendimento.dlq.manage',
  'atendimento.chats.reply',
  'atendimento.tickets.read',
  'atendimento.chats.read',
  'atendimento.tickets.create',
  'atendimento.tickets.update',
  'atendimento.tickets.assign',
  'atendimento.tickets.close',
  'atendimento.filas.manage',
  'atendimento.sla.manage',
];

const ADMIN_AUDIT_USER_FIELDS: AdministrativeAuditField[] = [
  'id',
  'nome',
  'email',
  'role',
  'permissoes',
  'empresa_id',
  'ativo',
  'telefone',
  'avatar_url',
  'idioma_preferido',
  'status_atendente',
  'capacidade_maxima',
  'tickets_ativos',
  'deve_trocar_senha',
];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private userColumnsCache: Set<string> | null = null;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(EmpresaConfig)
    private empresaConfigRepository: Repository<EmpresaConfig>,
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
    @InjectRepository(UserAccessChangeRequest)
    private userAccessChangeRequestRepository: Repository<UserAccessChangeRequest>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationService: NotificationService,
  ) {}

  private async getUsersTableColumns(): Promise<Set<string>> {
    if (this.userColumnsCache) {
      return this.userColumnsCache;
    }

    const rows: Array<{ column_name: string }> = await this.userRepository.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
      `,
    );

    this.userColumnsCache = new Set(rows.map((row) => row.column_name));
    return this.userColumnsCache;
  }

  private resolveUsersColumnExpression(
    columns: Set<string>,
    alias: string,
    candidates: string[],
    fallbackExpression: string = 'NULL',
  ): string {
    for (const candidate of candidates) {
      if (columns.has(candidate)) {
        return `u.${candidate} AS ${alias}`;
      }
    }

    return `${fallbackExpression} AS ${alias}`;
  }

  private buildUserSelect(columns: Set<string>, includePassword: boolean = false): string {
    const baseSelect = [
      'u.id',
      'u.nome',
      'u.email',
      this.resolveUsersColumnExpression(columns, 'telefone', ['telefone']),
      'u.role',
      this.resolveUsersColumnExpression(columns, 'permissoes', ['permissoes']),
      'u.empresa_id',
      this.resolveUsersColumnExpression(columns, 'avatar_url', ['avatar_url']),
      this.resolveUsersColumnExpression(columns, 'idioma_preferido', ['idioma_preferido'], "'pt-BR'"),
      this.resolveUsersColumnExpression(columns, 'configuracoes', ['configuracoes']),
      'u.ativo',
      this.resolveUsersColumnExpression(columns, 'deve_trocar_senha', ['deve_trocar_senha'], 'false'),
      this.resolveUsersColumnExpression(columns, 'status_atendente', ['status_atendente']),
      this.resolveUsersColumnExpression(columns, 'capacidade_maxima', ['capacidade_maxima'], 'NULL'),
      this.resolveUsersColumnExpression(columns, 'tickets_ativos', ['tickets_ativos'], 'NULL'),
      this.resolveUsersColumnExpression(columns, 'ultimo_login', ['ultimo_login']),
      this.resolveUsersColumnExpression(columns, 'created_at', ['created_at', 'criado_em']),
      this.resolveUsersColumnExpression(columns, 'updated_at', ['updated_at', 'atualizado_em']),
      'e.id AS empresa_rel_id',
      'e.nome AS empresa_nome',
      'e.slug AS empresa_slug',
      'e.cnpj AS empresa_cnpj',
      'e.plano AS empresa_plano',
      'e.ativo AS empresa_ativo',
      'e.subdominio AS empresa_subdominio',
    ];

    if (includePassword) {
      baseSelect.splice(3, 0, 'u.senha');
    } else {
      baseSelect.splice(3, 0, 'NULL::text AS senha');
    }

    return baseSelect.join(',\n          ');
  }

  private mapRawUser(raw: any): User {
    const permissoes =
      raw.permissoes && typeof raw.permissoes === 'string'
        ? raw.permissoes.split(',').filter(Boolean)
        : raw.permissoes ?? null;

    const empresa =
      raw.empresa_rel_id && raw.empresa_nome && raw.empresa_slug
        ? ({
            id: raw.empresa_rel_id,
            nome: raw.empresa_nome,
            slug: raw.empresa_slug,
            cnpj: raw.empresa_cnpj ?? null,
            plano: raw.empresa_plano ?? null,
            ativo: raw.empresa_ativo ?? null,
            subdominio: raw.empresa_subdominio ?? null,
          } as Empresa)
        : undefined;

    return this.userRepository.create({
      id: raw.id,
      nome: raw.nome,
      email: raw.email,
      senha: raw.senha,
      telefone: raw.telefone,
      role: raw.role,
      permissoes,
      empresa_id: raw.empresa_id,
      avatar_url: raw.avatar_url,
      idioma_preferido: raw.idioma_preferido,
      configuracoes: raw.configuracoes,
      ativo: raw.ativo,
      deve_trocar_senha: raw.deve_trocar_senha,
      status_atendente: raw.status_atendente,
      capacidade_maxima: raw.capacidade_maxima,
      tickets_ativos: raw.tickets_ativos,
      ultimo_login: raw.ultimo_login,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      empresa,
    } as Partial<User>);
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

  private normalizeRoleForCreate(userData: Partial<User>): Partial<User> {
    const roleNormalizado = this.normalizeRoleInput(userData.role);
    return {
      ...userData,
      role: roleNormalizado ?? UserRole.VENDEDOR,
    };
  }

  private normalizeRoleForUpdate(userData: Partial<User>): Partial<User> {
    if (userData.role === undefined) {
      return userData;
    }

    const roleNormalizado = this.normalizeRoleInput(userData.role);
    if (!roleNormalizado) {
      const { role, ...rest } = userData;
      return rest;
    }

    return {
      ...userData,
      role: roleNormalizado,
    };
  }

  private normalizeReadScopeUserIds(userIds: unknown): string[] {
    if (!Array.isArray(userIds)) {
      return [];
    }

    const normalized = userIds
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter(Boolean);

    return Array.from(new Set(normalized));
  }

  private normalizeReadScopeRoles(roles: unknown): UserRole[] {
    if (!Array.isArray(roles)) {
      return [];
    }

    const normalized = roles
      .map((role) => this.normalizeRoleInput(role))
      .filter((role): role is UserRole => !!role);

    return Array.from(new Set(normalized));
  }

  private resolveReadScopeFilters(input?: UsersReadScopeInput): UsersReadScopeFilters {
    return {
      userIds: this.normalizeReadScopeUserIds(input?.user_ids),
      allowedRoles: this.normalizeReadScopeRoles(input?.allowed_roles),
    };
  }

  private toAuditIsoString(value: unknown): string | null {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return null;
  }

  private normalizeAuditComparableValue(value: unknown): unknown {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeAuditComparableValue(item));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce<Record<string, unknown>>((acc, [key, entryValue]) => {
          acc[key] = this.normalizeAuditComparableValue(entryValue);
          return acc;
        }, {});
    }

    return value ?? null;
  }

  private buildAdministrativeUserSnapshot(user?: User | null): Record<string, unknown> | null {
    if (!user) {
      return null;
    }

    const rawPermissions = user.permissoes as unknown;
    const normalizedPermissions = Array.isArray(rawPermissions)
      ? rawPermissions.filter((permission): permission is string => typeof permission === 'string')
      : typeof rawPermissions === 'string'
        ? rawPermissions
            .split(',')
            .map((permission) => permission.trim())
            .filter(Boolean)
        : [];

    return {
      id: user.id,
      nome: user.nome ?? null,
      email: user.email ?? null,
      role: user.role ?? null,
      permissoes: normalizedPermissions,
      empresa_id: user.empresa_id ?? null,
      ativo: user.ativo,
      telefone: user.telefone ?? null,
      avatar_url: user.avatar_url ?? null,
      idioma_preferido: user.idioma_preferido ?? null,
      status_atendente: user.status_atendente ?? null,
      capacidade_maxima: user.capacidade_maxima ?? null,
      tickets_ativos: user.tickets_ativos ?? null,
      deve_trocar_senha: user.deve_trocar_senha,
      ultimo_login: this.toAuditIsoString(user.ultimo_login),
      created_at: this.toAuditIsoString(user.created_at),
      updated_at: this.toAuditIsoString(user.updated_at),
    };
  }

  private buildAdministrativeChangedFields(
    beforeSnapshot: Record<string, unknown> | null,
    afterSnapshot: Record<string, unknown> | null,
  ): string[] {
    const changedFields: string[] = [];

    for (const field of ADMIN_AUDIT_USER_FIELDS) {
      const beforeValue = this.normalizeAuditComparableValue(beforeSnapshot?.[field]);
      const afterValue = this.normalizeAuditComparableValue(afterSnapshot?.[field]);
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changedFields.push(field);
      }
    }

    return changedFields;
  }

  private async addAdministrativeUserActivityLog(params: {
    empresaId: string;
    event: 'user_create' | 'user_update' | 'user_password_reset' | 'user_status_change' | 'user_delete';
    tipo: AtividadeTipo;
    descricao: string;
    targetUser: User;
    beforeSnapshot?: Record<string, unknown> | null;
    afterSnapshot?: Record<string, unknown> | null;
    auditContext?: AdministrativeAuditContext;
  }): Promise<void> {
    const actorId = params.auditContext?.actor?.id || params.targetUser.id;
    const changedFields = this.buildAdministrativeChangedFields(
      params.beforeSnapshot ?? null,
      params.afterSnapshot ?? null,
    );

    await this.userActivityRepository.save(
      this.userActivityRepository.create({
        usuarioId: actorId,
        empresaId: params.empresaId,
        tipo: params.tipo,
        descricao: params.descricao,
        detalhes: JSON.stringify({
          categoria: 'admin_user_audit',
          evento: params.event,
          target_user_id: params.targetUser.id,
          actor: params.auditContext?.actor
            ? {
                id: params.auditContext.actor.id,
                nome: params.auditContext.actor.nome ?? null,
                email: params.auditContext.actor.email ?? null,
              }
            : null,
          before: params.beforeSnapshot ?? null,
          after: params.afterSnapshot ?? null,
          changed_fields: changedFields,
          source: params.auditContext?.source ?? null,
          request_id: params.auditContext?.relatedRequestId ?? null,
          reason: params.auditContext?.reason ?? null,
          timestamp: new Date().toISOString(),
        }),
      }),
    );
  }

  private extractNormalizedPermissions(input: unknown): string[] {
    if (Array.isArray(input)) {
      return input
        .filter((permission): permission is string => typeof permission === 'string')
        .map((permission) => permission.trim())
        .filter(Boolean);
    }

    if (typeof input === 'string') {
      return input
        .split(',')
        .map((permission) => permission.trim())
        .filter(Boolean);
    }

    return [];
  }

  private isSensitivePermissionToken(permission: string): boolean {
    const normalized = permission.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (normalized.startsWith('admin.')) {
      return true;
    }

    if (normalized.startsWith('users.')) {
      return true;
    }

    if (normalized.endsWith('.manage')) {
      return true;
    }

    const explicitSensitivePermissions = new Set<string>([
      'atendimento.dlq.manage',
      'financeiro.pagamentos.manage',
      'financeiro.alertas.manage',
      'financeiro.contas_pagar.manage',
      'financeiro.contas-bancarias.manage',
      'config.system.branding.manage',
      'config.automacoes.manage',
    ]);

    return explicitSensitivePermissions.has(normalized);
  }

  private getRoleSecurityRank(role: unknown): number {
    const normalizedRole = this.normalizeRoleInput(role);

    switch (normalizedRole) {
      case UserRole.SUPERADMIN:
        return 6;
      case UserRole.ADMIN:
        return 5;
      case UserRole.GERENTE:
        return 4;
      case UserRole.FINANCEIRO:
        return 3;
      case UserRole.SUPORTE:
        return 2;
      case UserRole.VENDEDOR:
      default:
        return 1;
    }
  }

  private detectPrivilegeEscalation(params: {
    beforeUser: User;
    afterUser: User;
  }): { isEscalation: boolean; reasons: string[]; addedSensitivePermissions: string[] } {
    const reasons: string[] = [];
    const beforeRoleRank = this.getRoleSecurityRank(params.beforeUser.role);
    const afterRoleRank = this.getRoleSecurityRank(params.afterUser.role);
    if (afterRoleRank > beforeRoleRank) {
      reasons.push(`role_upgrade:${params.beforeUser.role || 'unknown'}->${params.afterUser.role || 'unknown'}`);
    }

    const beforePermissions = new Set(this.extractNormalizedPermissions(params.beforeUser.permissoes));
    const afterPermissions = this.extractNormalizedPermissions(params.afterUser.permissoes);
    const addedSensitivePermissions = afterPermissions.filter(
      (permission) => !beforePermissions.has(permission) && this.isSensitivePermissionToken(permission),
    );
    if (addedSensitivePermissions.length > 0) {
      reasons.push('sensitive_permission_granted');
    }

    return {
      isEscalation: reasons.length > 0,
      reasons,
      addedSensitivePermissions,
    };
  }

  private detectPrivilegedUserCreation(user: User): {
    isPrivileged: boolean;
    reasons: string[];
    sensitivePermissions: string[];
  } {
    const reasons: string[] = [];
    const roleRank = this.getRoleSecurityRank(user.role);
    if (roleRank >= this.getRoleSecurityRank(UserRole.GERENTE)) {
      reasons.push(`privileged_role_created:${user.role || 'unknown'}`);
    }

    const permissions = this.extractNormalizedPermissions(user.permissoes);
    const sensitivePermissions = permissions.filter((permission) => this.isSensitivePermissionToken(permission));
    if (sensitivePermissions.length > 0) {
      reasons.push('sensitive_permission_granted');
    }

    return {
      isPrivileged: reasons.length > 0,
      reasons,
      sensitivePermissions,
    };
  }

  private async notifyAdminsSecurityAlert(params: {
    empresaId: string;
    event: 'privilege_escalation' | 'auth_login_lockout';
    severity: AdminSecurityAlertSeverity;
    title: string;
    message: string;
    actor?: AdministrativeAuditActor | null;
    targetUser?: Pick<User, 'id' | 'nome' | 'email' | 'role'> | null;
    metadata?: Record<string, unknown>;
    source?: string;
  }): Promise<void> {
    const adminRoles = new Set<UserRole>([UserRole.SUPERADMIN, UserRole.ADMIN]);
    const companyUsers = await this.userRepository.find({
      where: { empresa_id: params.empresaId, ativo: true },
      select: ['id', 'nome', 'email', 'role', 'empresa_id'],
    });

    const recipients = companyUsers.filter((candidate) => {
      if (!candidate?.id) {
        return false;
      }

      const normalizedRole = this.normalizeRoleInput(candidate.role);
      return !!normalizedRole && adminRoles.has(normalizedRole);
    });

    if (recipients.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.notificationService.create({
          empresaId: params.empresaId,
          userId: recipient.id,
          type: NotificationType.SISTEMA,
          title: params.title,
          message: params.message,
          data: {
            category: 'admin_security_alert',
            event: params.event,
            severity: params.severity,
            channel: 'in_app_notification',
            actor: params.actor || null,
            target_user: params.targetUser || null,
            metadata: params.metadata || null,
            source: params.source || null,
            generated_at: new Date().toISOString(),
          },
        }),
      ),
    );

    const failed = results.filter((result) => result.status === 'rejected').length;
    if (failed > 0) {
      this.logger.warn(
        `Falha parcial ao enviar alerta de seguranca admin (${params.event}): ${failed}/${results.length}`,
      );
    }
  }

  async emitAdminSecurityAlert(params: {
    empresaId: string;
    event: 'privilege_escalation' | 'auth_login_lockout';
    severity: AdminSecurityAlertSeverity;
    title: string;
    message: string;
    actor?: AdministrativeAuditActor | null;
    targetUser?: Pick<User, 'id' | 'nome' | 'email' | 'role'> | null;
    metadata?: Record<string, unknown>;
    source?: string;
  }): Promise<void> {
    await this.notifyAdminsSecurityAlert(params);
  }

  private parseActivityDetailsJson(value?: string | null): Record<string, unknown> | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private isLgpdPrivacyRequestDetails(details: Record<string, unknown> | null): boolean {
    return details?.categoria === 'lgpd_privacy_request';
  }

  private serializeLgpdRequestActivity(activity: UserActivity & { usuario?: User }): Record<string, unknown> {
    const details = this.parseActivityDetailsJson(activity.detalhes);
    const requestedBy =
      details && typeof details.requested_by === 'object' && details.requested_by
        ? (details.requested_by as Record<string, unknown>)
        : null;
    const handledBy =
      details && typeof details.handled_by === 'object' && details.handled_by
        ? (details.handled_by as Record<string, unknown>)
        : null;

    return {
      id: activity.id,
      protocolo: activity.id,
      created_at: activity.createdAt,
      updated_at:
        typeof details?.updated_at === 'string'
          ? details.updated_at
          : typeof details?.requested_at === 'string'
            ? details.requested_at
            : activity.createdAt,
      status: (details?.status as string) || 'open',
      type: (details?.request_type as string) || 'data_export',
      reason: typeof details?.reason === 'string' ? details.reason : null,
      resolution_note:
        typeof details?.resolution_note === 'string' ? details.resolution_note : null,
      requested_at:
        typeof details?.requested_at === 'string' ? details.requested_at : activity.createdAt,
      handled_at: typeof details?.handled_at === 'string' ? details.handled_at : null,
      handled_by: handledBy,
      requester: {
        id: activity.usuarioId,
        nome:
          activity.usuario?.nome ||
          (requestedBy && typeof requestedBy.nome === 'string' ? requestedBy.nome : null),
        email:
          activity.usuario?.email ||
          (requestedBy && typeof requestedBy.email === 'string' ? requestedBy.email : null),
      },
      raw_details: details,
    };
  }

  private async notifyAdminsAboutPrivacyRequest(params: {
    empresaId: string;
    requester: Pick<User, 'id' | 'nome' | 'email'>;
    requestId: string;
    requestType: LgpdPrivacyRequestType;
  }): Promise<void> {
    const adminRoles = new Set<UserRole>([UserRole.SUPERADMIN, UserRole.ADMIN]);
    const companyUsers = await this.userRepository.find({
      where: { empresa_id: params.empresaId, ativo: true },
      select: ['id', 'nome', 'email', 'role', 'empresa_id'],
    });

    const recipients = companyUsers.filter((candidate) => {
      if (!candidate?.id || candidate.id === params.requester.id) {
        return false;
      }
      const normalizedRole = this.normalizeRoleInput(candidate.role);
      return !!normalizedRole && adminRoles.has(normalizedRole);
    });

    if (recipients.length === 0) {
      return;
    }

    const requestTypeLabelMap: Record<LgpdPrivacyRequestType, string> = {
      data_export: 'Exportacao de dados',
      account_anonymization: 'Anonimizacao de conta',
      account_deletion: 'Exclusao de conta',
    };

    const title = 'Nova solicitacao LGPD registrada';
    const message = `${params.requester.nome || 'Usuario'} registrou uma solicitacao de ${
      requestTypeLabelMap[params.requestType]
    }. Protocolo: ${params.requestId}.`;

    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.notificationService.create({
          empresaId: params.empresaId,
          userId: recipient.id,
          type: NotificationType.SISTEMA,
          title,
          message,
          data: {
            category: 'lgpd_privacy_request',
            requestId: params.requestId,
            requestType: params.requestType,
            requesterUserId: params.requester.id,
            source: 'users.profile.privacy-request',
          },
        }),
      ),
    );

    const failed = results.filter((result) => result.status === 'rejected').length;
    if (failed > 0) {
      this.logger.warn(
        `Falha parcial ao notificar admins sobre solicitacao LGPD ${params.requestId}: ${failed}/${results.length}`,
      );
    }
  }

  private async notifyRequesterAboutPrivacyRequestStatus(params: {
    empresaId: string;
    requesterUserId: string;
    requestId: string;
    requestType: LgpdPrivacyRequestType;
    status: Extract<LgpdPrivacyRequestStatus, 'completed' | 'rejected'>;
    handledBy?: { id?: string | null; nome?: string | null; email?: string | null } | null;
    resolutionNote?: string | null;
  }): Promise<void> {
    const requestTypeLabelMap: Record<LgpdPrivacyRequestType, string> = {
      data_export: 'exportacao de dados',
      account_anonymization: 'anonimizacao de conta',
      account_deletion: 'exclusao de conta',
    };

    const statusLabelMap: Record<Extract<LgpdPrivacyRequestStatus, 'completed' | 'rejected'>, string> = {
      completed: 'concluida',
      rejected: 'negada',
    };

    const handledByLabel = params.handledBy?.nome || 'equipe administrativa';
    const title =
      params.status === 'completed'
        ? 'Sua solicitacao LGPD foi concluida'
        : 'Sua solicitacao LGPD foi atualizada';
    const message = `Sua solicitacao de ${
      requestTypeLabelMap[params.requestType]
    } (protocolo ${params.requestId}) foi ${statusLabelMap[params.status]} por ${handledByLabel}.`;

    await this.notificationService.create({
      empresaId: params.empresaId,
      userId: params.requesterUserId,
      type: NotificationType.SISTEMA,
      title,
      message,
      data: {
        category: 'lgpd_privacy_request',
        requestId: params.requestId,
        requestType: params.requestType,
        requestStatus: params.status,
        handledBy: params.handledBy || null,
        resolutionNote: params.resolutionNote || null,
        source: 'users.privacy-requests.update-status',
      },
    });
  }

  private appendReadScopeClause(
    whereClauses: string[],
    whereValues: unknown[],
    scopeFilters: UsersReadScopeFilters,
  ): void {
    if (scopeFilters.userIds.length === 0 && scopeFilters.allowedRoles.length === 0) {
      return;
    }

    const scopeClauses: string[] = [];

    if (scopeFilters.userIds.length > 0) {
      const userPlaceholders = scopeFilters.userIds.map((id) => {
        whereValues.push(id);
        return `$${whereValues.length}`;
      });
      scopeClauses.push(`u.id IN (${userPlaceholders.join(', ')})`);
    }

    if (scopeFilters.allowedRoles.length > 0) {
      const rolePlaceholders = scopeFilters.allowedRoles.map((role) => {
        whereValues.push(role);
        return `$${whereValues.length}`;
      });
      scopeClauses.push(`u.role IN (${rolePlaceholders.join(', ')})`);
    }

    if (scopeClauses.length === 1) {
      whereClauses.push(scopeClauses[0]);
      return;
    }

    whereClauses.push(`(${scopeClauses.join(' OR ')})`);
  }

  private filterUsersByReadScope(users: User[], scopeFilters: UsersReadScopeFilters): User[] {
    if (scopeFilters.userIds.length === 0 && scopeFilters.allowedRoles.length === 0) {
      return users;
    }

    const userIdSet = new Set(scopeFilters.userIds);
    const roleSet = new Set(scopeFilters.allowedRoles);

    return users.filter((user) => {
      if (user.id && userIdSet.has(user.id)) {
        return true;
      }

      if (roleSet.size === 0) {
        return false;
      }

      const normalizedRole = this.normalizeRoleInput(user.role);
      return !!normalizedRole && roleSet.has(normalizedRole);
    });
  }

  private isActiveFlag(value: unknown): boolean {
    return value === true || value === 'true' || value === 't' || value === 1 || value === '1';
  }

  private normalizePermissionsInput(permissoes: unknown): string | null {
    if (Array.isArray(permissoes)) {
      const values = permissoes
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

      return values.length > 0 ? values.join(',') : null;
    }

    if (typeof permissoes === 'string') {
      const values = permissoes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      return values.length > 0 ? values.join(',') : null;
    }

    return null;
  }

  private normalizeSortDirection(direction: unknown): 'ASC' | 'DESC' {
    const normalized = typeof direction === 'string' ? direction.trim().toUpperCase() : 'ASC';
    return normalized === 'DESC' ? 'DESC' : 'ASC';
  }

  private resolveUsersSortColumn(orderBy: unknown, columns: Set<string>): string {
    const normalized = typeof orderBy === 'string' ? orderBy.trim().toLowerCase() : 'nome';

    switch (normalized) {
      case 'email':
        return 'u.email';
      case 'role':
        return 'u.role';
      case 'created_at':
        if (columns.has('created_at')) {
          return 'u.created_at';
        }
        if (columns.has('criado_em')) {
          return 'u.criado_em';
        }
        return 'u.nome';
      case 'ultimo_login':
        if (columns.has('ultimo_login')) {
          return 'u.ultimo_login';
        }
        if (columns.has('updated_at')) {
          return 'u.updated_at';
        }
        if (columns.has('atualizado_em')) {
          return 'u.atualizado_em';
        }
        return 'u.nome';
      case 'nome':
      default:
        return 'u.nome';
    }
  }

  private async persistOptionalUsersColumns(
    id: string,
    userData: Partial<User>,
    empresaId?: string,
  ): Promise<void> {
    const columns = await this.getUsersTableColumns();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    const pushAssignment = (column: string, value: unknown, cast?: 'json'): void => {
      if (!columns.has(column) || value === undefined) {
        return;
      }

      values.push(value);
      const valueExpression = cast ? `$${values.length}::${cast}` : `$${values.length}`;
      setClauses.push(`${column} = ${valueExpression}`);
    };

    const normalizedPermissions =
      userData.permissoes === undefined
        ? undefined
        : this.normalizePermissionsInput(userData.permissoes);

    pushAssignment('telefone', userData.telefone);
    pushAssignment('permissoes', normalizedPermissions);
    pushAssignment('avatar_url', userData.avatar_url);
    pushAssignment('idioma_preferido', userData.idioma_preferido);
    pushAssignment(
      'configuracoes',
      userData.configuracoes === undefined ? undefined : JSON.stringify(userData.configuracoes ?? null),
      'json',
    );
    pushAssignment('status_atendente', userData.status_atendente);
    pushAssignment('capacidade_maxima', userData.capacidade_maxima);
    pushAssignment('tickets_ativos', userData.tickets_ativos);
    pushAssignment('ativo', userData.ativo);

    if (setClauses.length === 0) {
      return;
    }

    const whereClauses = [`id = $${values.length + 1}`];
    values.push(id);

    if (empresaId) {
      whereClauses.push(`empresa_id = $${values.length + 1}`);
      values.push(empresaId);
    }

    await this.userRepository.query(
      `
        UPDATE users
        SET ${setClauses.join(',\n            ')}
        WHERE ${whereClauses.join(' AND ')}
      `,
      values,
    );
  }

  private extractRepositoryUpdatableFields(userData: Partial<User>): Partial<User> {
    const updatable: Partial<User> = {};
    const assign = <K extends keyof User>(key: K): void => {
      if (userData[key] !== undefined) {
        updatable[key] = userData[key] as User[K];
      }
    };

    assign('nome');
    assign('email');
    assign('senha');
    assign('role');
    assign('empresa_id');
    assign('ativo');
    assign('deve_trocar_senha');
    assign('status_atendente');
    assign('capacidade_maxima');
    assign('tickets_ativos');

    return updatable;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, true);

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.email = $1
        LIMIT 1
      `,
      [email],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  async findById(id: string): Promise<User | undefined> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, false);

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [id],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  private async findByIdWithPassword(id: string): Promise<User | undefined> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, true);

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [id],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  /**
   * Busca usuário por ID (inclui senha - para validação de senha antiga)
   * Diferente de findById que NÃO retorna senha
   */
  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(value);
  }

  private normalizeAccessChangeReason(reason?: string): string | null {
    if (typeof reason !== 'string') {
      return null;
    }

    const normalized = reason.trim();
    if (!normalized) {
      return null;
    }

    return normalized.slice(0, 2000);
  }

  private isMissingTableError(error: unknown, tableName: string): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverCode = String((error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code || '');
    if (driverCode === '42P01') {
      return true;
    }

    const rawMessage = String(
      (error as QueryFailedError & { driverError?: { message?: string } }).driverError?.message || error.message || '',
    ).toLowerCase();

    return rawMessage.includes(tableName.toLowerCase());
  }

  private normalizeAccessChangeStatus(status?: string): UserAccessChangeStatus | undefined {
    if (typeof status !== 'string') {
      return undefined;
    }

    const normalized = status.trim().toUpperCase();
    if (normalized === UserAccessChangeStatus.REQUESTED) {
      return UserAccessChangeStatus.REQUESTED;
    }

    if (normalized === UserAccessChangeStatus.APPROVED) {
      return UserAccessChangeStatus.APPROVED;
    }

    if (normalized === UserAccessChangeStatus.REJECTED) {
      return UserAccessChangeStatus.REJECTED;
    }

    return undefined;
  }

  private parseStoredAccessRequestPayload(payload: unknown): Partial<User> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return {};
    }

    return { ...(payload as Record<string, unknown>) } as Partial<User>;
  }

  private async addAccessChangeActivityLog(params: {
    empresaId: string;
    actorId: string;
    actorNome?: string | null;
    actorEmail?: string | null;
    requestId: string;
    action: UserAccessChangeAction;
    status: UserAccessChangeStatus;
    targetUserId?: string | null;
    detailReason?: string | null;
  }): Promise<void> {
    await this.userActivityRepository.save(
      this.userActivityRepository.create({
        usuarioId: params.actorId,
        empresaId: params.empresaId,
        tipo: AtividadeTipo.EDICAO,
        descricao: `Workflow de acesso ${params.status.toLowerCase()} (${params.action})`,
        detalhes: JSON.stringify({
          categoria: 'user_access_change_workflow',
          request_id: params.requestId,
          action: params.action,
          status: params.status,
          target_user_id: params.targetUserId ?? null,
          reason: params.detailReason ?? null,
          actor: {
            id: params.actorId,
            nome: params.actorNome ?? null,
            email: params.actorEmail ?? null,
          },
          timestamp: new Date().toISOString(),
        }),
      }),
    );
  }

  isSensitiveAccessChangePayload(payload: Partial<User> | null | undefined): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    return ['role', 'permissoes', 'ativo', 'deve_trocar_senha'].some((field) => field in payload);
  }

  async isDualApprovalRequiredForAccessChanges(empresaId: string): Promise<boolean> {
    if (!empresaId) {
      return false;
    }

    try {
      const config = await this.empresaConfigRepository.findOne({
        where: { empresaId },
        select: ['id', 'aprovacaoNovoUsuario'],
      });

      return Boolean(config?.aprovacaoNovoUsuario);
    } catch (error) {
      if (this.isMissingTableError(error, 'empresa_configuracoes')) {
        this.logger.warn(
          '[ADM-102] Tabela empresa_configuracoes indisponivel. Dupla aprovacao mantida desabilitada por fallback seguro.',
        );
        return false;
      }

      throw error;
    }
  }

  async createAccessChangeRequest(params: {
    empresaId: string;
    action: UserAccessChangeAction;
    requestedByUser: Pick<User, 'id' | 'nome' | 'email'>;
    targetUserId?: string | null;
    requestPayload: Partial<User>;
    requestReason?: string;
  }): Promise<UserAccessChangeRequest> {
    const normalizedReason = this.normalizeAccessChangeReason(params.requestReason);
    const payload: Record<string, unknown> = {
      ...(params.requestPayload as Record<string, unknown>),
    };

    if (params.action === UserAccessChangeAction.USER_CREATE) {
      const rawPassword = typeof payload.senha === 'string' ? payload.senha.trim() : '';
      if (!rawPassword) {
        throw new BadRequestException('Nao foi possivel registrar solicitacao: senha ausente.');
      }

      payload.senha = this.isBcryptHash(rawPassword) ? rawPassword : await bcrypt.hash(rawPassword, 10);
    }

    const request = await this.userAccessChangeRequestRepository.save(
      this.userAccessChangeRequestRepository.create({
        empresaId: params.empresaId,
        action: params.action,
        status: UserAccessChangeStatus.REQUESTED,
        requestedByUserId: params.requestedByUser.id,
        targetUserId: params.targetUserId ?? null,
        requestPayload: payload,
        requestReason: normalizedReason,
      }),
    );

    await this.addAccessChangeActivityLog({
      empresaId: params.empresaId,
      actorId: params.requestedByUser.id,
      actorNome: params.requestedByUser.nome,
      actorEmail: params.requestedByUser.email,
      requestId: request.id,
      action: params.action,
      status: UserAccessChangeStatus.REQUESTED,
      targetUserId: params.targetUserId ?? null,
      detailReason: normalizedReason,
    });

    return request;
  }

  async listAccessChangeRequests(
    empresaId: string,
    filters: {
      status?: string;
      limit?: number;
    } = {},
  ): Promise<UserAccessChangeRequest[]> {
    const requestedLimit =
      typeof filters.limit === 'number' && Number.isFinite(filters.limit) ? filters.limit : 50;
    const limit = Math.max(1, Math.min(200, Math.trunc(requestedLimit)));
    const normalizedStatus = this.normalizeAccessChangeStatus(filters.status);

    const query = this.userAccessChangeRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requestedByUser', 'requestedByUser')
      .leftJoinAndSelect('request.decidedByUser', 'decidedByUser')
      .leftJoinAndSelect('request.targetUser', 'targetUser')
      .leftJoinAndSelect('request.appliedUser', 'appliedUser')
      .where('request.empresaId = :empresaId', { empresaId })
      .orderBy('request.createdAt', 'DESC')
      .take(limit);

    if (normalizedStatus) {
      query.andWhere('request.status = :status', { status: normalizedStatus });
    }

    return query.getMany();
  }

  async approveAccessChangeRequest(params: {
    requestId: string;
    empresaId: string;
    approver: Pick<User, 'id' | 'nome' | 'email'>;
    decisionReason?: string;
  }): Promise<{ request: UserAccessChangeRequest; appliedUser: User }> {
    const request = await this.userAccessChangeRequestRepository.findOne({
      where: { id: params.requestId, empresaId: params.empresaId },
    });

    if (!request) {
      throw new NotFoundException('Solicitacao de acesso nao encontrada');
    }

    if (request.status !== UserAccessChangeStatus.REQUESTED) {
      throw new BadRequestException('Solicitacao ja foi decidida');
    }

    if (request.requestedByUserId && request.requestedByUserId === params.approver.id) {
      throw new ForbiddenException('O solicitante nao pode aprovar a propria solicitacao');
    }

    const now = new Date();
    const normalizedReason = this.normalizeAccessChangeReason(params.decisionReason);
    const payload = this.parseStoredAccessRequestPayload(request.requestPayload);

    let appliedUser: User;
    if (request.action === UserAccessChangeAction.USER_CREATE) {
      const createPayload: Partial<User> = {
        ...(payload as Partial<User>),
        empresa_id: params.empresaId,
      };

      const storedPassword = typeof createPayload.senha === 'string' ? createPayload.senha.trim() : '';
      if (!storedPassword) {
        throw new BadRequestException('Solicitacao sem senha armazenada para aprovacao');
      }

      appliedUser = await this.createWithHash({
        ...createPayload,
        senha: storedPassword,
      });

      await this.addAdministrativeUserActivityLog({
        empresaId: params.empresaId,
        event: 'user_create',
        tipo: AtividadeTipo.CRIACAO,
        descricao: `Usuario criado por aprovacao (${appliedUser.email})`,
        targetUser: appliedUser,
        beforeSnapshot: null,
        afterSnapshot: this.buildAdministrativeUserSnapshot(appliedUser),
        auditContext: {
          actor: params.approver,
          source: 'users.service.approveAccessChangeRequest',
          reason: normalizedReason,
          relatedRequestId: request.id,
        },
      });

      const privilegedCreation = this.detectPrivilegedUserCreation(appliedUser);
      if (privilegedCreation.isPrivileged) {
        securityLogger.adminCreated(params.approver.id, appliedUser.id);
        await this.emitAdminSecurityAlert({
          empresaId: params.empresaId,
          event: 'privilege_escalation',
          severity: 'high',
          title: 'Alerta de seguranca: criacao de acesso privilegiado',
          message: `${params.approver.nome || params.approver.email || 'Aprovador'} aprovou criacao de usuario privilegiado (${appliedUser.email}).`,
          actor: params.approver,
          targetUser: {
            id: appliedUser.id,
            nome: appliedUser.nome,
            email: appliedUser.email,
            role: appliedUser.role,
          },
          metadata: {
            reasons: privilegedCreation.reasons,
            sensitive_permissions: privilegedCreation.sensitivePermissions,
            request_id: request.id,
          },
          source: 'users.service.approveAccessChangeRequest',
        });
      }
      request.targetUserId = appliedUser.id;
    } else if (request.action === UserAccessChangeAction.USER_UPDATE) {
      const targetUserId = request.targetUserId;
      if (!targetUserId) {
        throw new BadRequestException('Solicitacao de atualizacao sem usuario alvo');
      }

      const { id, empresa_id, senha, ...updatePayload } = payload as Record<string, unknown>;
      void id;
      void empresa_id;
      void senha;

      appliedUser = await this.atualizar(
        targetUserId,
        updatePayload as Partial<User>,
        params.empresaId,
        {
          actor: params.approver,
          source: 'users.service.approveAccessChangeRequest',
          reason: normalizedReason,
          relatedRequestId: request.id,
        },
      );
    } else {
      throw new BadRequestException('Tipo de solicitacao de acesso invalido');
    }

    request.status = UserAccessChangeStatus.APPROVED;
    request.decidedByUserId = params.approver.id;
    request.decisionReason = normalizedReason;
    request.decidedAt = now;
    request.appliedAt = now;
    request.appliedUserId = appliedUser.id;

    const saved = await this.userAccessChangeRequestRepository.save(request);

    await this.addAccessChangeActivityLog({
      empresaId: params.empresaId,
      actorId: params.approver.id,
      actorNome: params.approver.nome,
      actorEmail: params.approver.email,
      requestId: saved.id,
      action: saved.action,
      status: UserAccessChangeStatus.APPROVED,
      targetUserId: saved.targetUserId,
      detailReason: normalizedReason,
    });

    return {
      request: saved,
      appliedUser,
    };
  }

  async rejectAccessChangeRequest(params: {
    requestId: string;
    empresaId: string;
    reviewer: Pick<User, 'id' | 'nome' | 'email'>;
    decisionReason?: string;
  }): Promise<UserAccessChangeRequest> {
    const request = await this.userAccessChangeRequestRepository.findOne({
      where: { id: params.requestId, empresaId: params.empresaId },
    });

    if (!request) {
      throw new NotFoundException('Solicitacao de acesso nao encontrada');
    }

    if (request.status !== UserAccessChangeStatus.REQUESTED) {
      throw new BadRequestException('Solicitacao ja foi decidida');
    }

    if (request.requestedByUserId && request.requestedByUserId === params.reviewer.id) {
      throw new ForbiddenException('O solicitante nao pode rejeitar a propria solicitacao');
    }

    const normalizedReason = this.normalizeAccessChangeReason(params.decisionReason);
    request.status = UserAccessChangeStatus.REJECTED;
    request.decidedByUserId = params.reviewer.id;
    request.decisionReason = normalizedReason;
    request.decidedAt = new Date();
    request.appliedAt = null;
    request.appliedUserId = null;

    const saved = await this.userAccessChangeRequestRepository.save(request);

    await this.addAccessChangeActivityLog({
      empresaId: params.empresaId,
      actorId: params.reviewer.id,
      actorNome: params.reviewer.nome,
      actorEmail: params.reviewer.email,
      requestId: saved.id,
      action: saved.action,
      status: UserAccessChangeStatus.REJECTED,
      targetUserId: saved.targetUserId,
      detailReason: normalizedReason,
    });

    return saved;
  }

  async findOne(id: string, empresaId?: string): Promise<User | undefined> {
    const user = await this.findByIdWithPassword(id);
    if (!user) {
      return undefined;
    }

    if (empresaId && user.empresa_id !== empresaId) {
      return undefined;
    }

    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    const normalizedData = this.normalizeRoleForCreate(userData);
    const user = this.userRepository.create(normalizedData);
    const savedUser = await this.userRepository.save(user);
    await this.persistOptionalUsersColumns(savedUser.id, normalizedData, savedUser.empresa_id);
    return this.findById(savedUser.id);
  }

  async createWithHash(userData: Partial<User>): Promise<User> {
    // Buscar primeira empresa ativa se não fornecida
    if (!userData.empresa_id) {
      const empresa = await this.empresaRepository.findOne({
        where: { ativo: true },
      });

      if (!empresa) {
        throw new Error('Nenhuma empresa ativa encontrada');
      }

      userData.empresa_id = empresa.id;
    }

    const normalizedData = this.normalizeRoleForCreate(userData);
    const user = this.userRepository.create(normalizedData);
    const savedUser = await this.userRepository.save(user);
    await this.persistOptionalUsersColumns(savedUser.id, normalizedData, savedUser.empresa_id);
    return this.findById(savedUser.id);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const normalizedData = this.normalizeRoleForUpdate(userData);
    const repositoryUpdatableData = this.extractRepositoryUpdatableFields(normalizedData);

    if (Object.keys(repositoryUpdatableData).length > 0) {
      await this.userRepository.update(id, repositoryUpdatableData);
    }

    await this.persistOptionalUsersColumns(id, normalizedData);
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return user;
  }

  async exportOwnData(userId: string, empresaId?: string): Promise<Record<string, unknown>> {
    const user = await this.findOne(userId, empresaId);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const [activities, notifications] = await Promise.all([
      this.userActivityRepository.find({
        where: {
          usuarioId: userId,
          ...(empresaId ? { empresaId } : {}),
        },
        order: { createdAt: 'DESC' },
        take: 200,
      }),
      this.notificationRepository.find({
        where: {
          userId,
          ...(empresaId ? { empresaId } : {}),
        },
        order: { createdAt: 'DESC' },
        take: 200,
      }),
    ]);

    return {
      exported_at: new Date().toISOString(),
      format_version: '1.0',
      titular: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone ?? null,
        role: user.role,
        permissoes: Array.isArray(user.permissoes) ? user.permissoes : [],
        avatar_url: user.avatar_url ?? null,
        idioma_preferido: user.idioma_preferido ?? null,
        configuracoes: user.configuracoes ?? null,
        empresa_id: user.empresa_id,
        ativo: user.ativo,
        ultimo_login: user.ultimo_login ?? null,
        created_at: user.created_at ?? null,
        updated_at: user.updated_at ?? null,
      },
      empresa: user.empresa
        ? {
            id: user.empresa.id,
            nome: user.empresa.nome,
            slug: user.empresa.slug,
            cnpj: user.empresa.cnpj ?? null,
            plano: user.empresa.plano ?? null,
            ativo: user.empresa.ativo ?? null,
            subdominio: user.empresa.subdominio ?? null,
          }
        : null,
      atividades_recentes: activities.map((activity) => ({
        id: activity.id,
        tipo: activity.tipo,
        descricao: activity.descricao,
        detalhes: activity.detalhes ?? null,
        created_at: activity.createdAt,
      })),
      notificacoes_recentes: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        data: notification.data ?? null,
        created_at: notification.createdAt,
        read_at: notification.readAt ?? null,
      })),
      limits: {
        atividades_recentes: 200,
        notificacoes_recentes: 200,
      },
    };
  }

  async createPrivacyRequest(
    userId: string,
    empresaId: string,
    input: {
      type: 'data_export' | 'account_anonymization' | 'account_deletion';
      reason?: string;
    },
  ): Promise<Record<string, unknown>> {
    const user = await this.findOne(userId, empresaId);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const reason =
      typeof input.reason === 'string' && input.reason.trim().length > 0
        ? input.reason.trim().slice(0, 1000)
        : null;

    const saved = await this.userActivityRepository.save(
      this.userActivityRepository.create({
        usuarioId: userId,
        empresaId,
        tipo: AtividadeTipo.EDICAO,
        descricao: `Solicitacao LGPD registrada (${input.type})`,
        detalhes: JSON.stringify({
          categoria: 'lgpd_privacy_request',
          request_type: input.type,
          reason,
          status: 'open',
          requested_by: {
            id: user.id,
            email: user.email,
            nome: user.nome,
          },
          requested_at: new Date().toISOString(),
        }),
      }),
    );

    try {
      await this.notifyAdminsAboutPrivacyRequest({
        empresaId,
        requester: {
          id: user.id,
          nome: user.nome,
          email: user.email,
        },
        requestId: saved.id,
        requestType: input.type,
      });
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel notificar admins sobre solicitacao LGPD ${saved.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      protocolo: saved.id,
      status: 'recebido',
      tipo: input.type,
      criado_em: saved.createdAt,
      observacao:
        'Solicitacao registrada para avaliacao administrativa. Nenhuma exclusao/anonimizacao e executada automaticamente.',
    };
  }

  async listPrivacyRequests(
    empresaId: string,
    filters: {
      status?: LgpdPrivacyRequestStatus;
      type?: LgpdPrivacyRequestType;
      limit?: number;
    } = {},
  ): Promise<Record<string, unknown>[]> {
    const requestedLimit =
      typeof filters.limit === 'number' && Number.isFinite(filters.limit) ? filters.limit : 50;
    const limit = Math.max(1, Math.min(200, Math.trunc(requestedLimit)));

    const activities = await this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.usuario', 'usuario')
      .where('activity.empresa_id = :empresaId', { empresaId })
      .andWhere('activity.detalhes IS NOT NULL')
      .andWhere('activity.detalhes LIKE :marker', {
        marker: '%"categoria":"lgpd_privacy_request"%',
      })
      .orderBy('activity.created_at', 'DESC')
      .take(limit * 3)
      .getMany();

    return activities
      .map((activity) => this.serializeLgpdRequestActivity(activity))
      .filter((item) => {
        const details = item.raw_details as Record<string, unknown> | undefined;
        if (!this.isLgpdPrivacyRequestDetails(details ?? null)) {
          return false;
        }

        if (filters.status && item.status !== filters.status) {
          return false;
        }

        if (filters.type && item.type !== filters.type) {
          return false;
        }

        return true;
      })
      .slice(0, limit)
      .map(({ raw_details, ...rest }) => rest);
  }

  async updatePrivacyRequestStatus(
    activityId: string,
    empresaId: string,
    actor: Pick<User, 'id' | 'nome' | 'email'>,
    payload: {
      status: LgpdPrivacyRequestStatus;
      resolution_note?: string;
    },
  ): Promise<Record<string, unknown>> {
    const activity = await this.userActivityRepository.findOne({
      where: { id: activityId, empresaId },
      relations: ['usuario'],
    });

    if (!activity) {
      throw new NotFoundException('Solicitacao LGPD nao encontrada');
    }

    const details = this.parseActivityDetailsJson(activity.detalhes);
    if (!this.isLgpdPrivacyRequestDetails(details)) {
      throw new NotFoundException('Registro informado nao e uma solicitacao LGPD');
    }

    const previousStatus =
      typeof details?.status === 'string' ? (details.status as LgpdPrivacyRequestStatus) : 'open';

    const resolutionNote =
      typeof payload.resolution_note === 'string' && payload.resolution_note.trim().length > 0
        ? payload.resolution_note.trim().slice(0, 1500)
        : null;

    const nextDetails: Record<string, unknown> = {
      ...(details || {}),
      status: payload.status,
      updated_at: new Date().toISOString(),
      handled_at: new Date().toISOString(),
      handled_by: {
        id: actor.id,
        nome: actor.nome ?? null,
        email: actor.email ?? null,
      },
    };

    if (resolutionNote) {
      nextDetails.resolution_note = resolutionNote;
    } else if (payload.status === 'completed' || payload.status === 'rejected') {
      nextDetails.resolution_note = null;
    }

    if (payload.status === 'completed' || payload.status === 'rejected') {
      nextDetails.closed_at = new Date().toISOString();
    }

    activity.detalhes = JSON.stringify(nextDetails);
    activity.descricao = `Solicitacao LGPD ${payload.status}`;

    const saved = await this.userActivityRepository.save(activity);

    const shouldNotifyRequester =
      payload.status !== previousStatus &&
      (payload.status === 'completed' || payload.status === 'rejected') &&
      activity.usuarioId &&
      activity.usuarioId !== actor.id;

    if (shouldNotifyRequester) {
      try {
        await this.notifyRequesterAboutPrivacyRequestStatus({
          empresaId,
          requesterUserId: activity.usuarioId,
          requestId: saved.id,
          requestType: ((details?.request_type as LgpdPrivacyRequestType) || 'data_export') as LgpdPrivacyRequestType,
          status: payload.status as 'completed' | 'rejected',
          handledBy: {
            id: actor.id,
            nome: actor.nome ?? null,
            email: actor.email ?? null,
          },
          resolutionNote,
        });
      } catch (error) {
        this.logger.warn(
          `Nao foi possivel notificar solicitante sobre tratamento LGPD ${saved.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return this.serializeLgpdRequestActivity(saved as UserActivity & { usuario?: User });
  }

  async generateAccessReviewReport(
    empresaId: string,
    options: {
      role?: string;
      includeInactive?: boolean;
      limit?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    const normalizedRole = this.normalizeRoleInput(options.role);
    const hasRoleFilter = typeof options.role === 'string' && options.role.trim().length > 0;
    if (hasRoleFilter && !normalizedRole) {
      throw new BadRequestException('Perfil de usuario invalido para filtro role');
    }
    const includeInactive = options.includeInactive !== false;
    const requestedLimit =
      typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : 200;
    const limit = Math.max(1, Math.min(500, Math.trunc(requestedLimit)));

    const whereClauses: string[] = ['empresa_id = $1'];
    const whereValues: unknown[] = [empresaId];

    if (normalizedRole) {
      whereValues.push(normalizedRole);
      whereClauses.push(`role = $${whereValues.length}`);
    }

    if (!includeInactive) {
      whereValues.push(true);
      whereClauses.push(`ativo = $${whereValues.length}`);
    }

    const whereSql = whereClauses.join(' AND ');

    const summaryRows: Array<{
      role: string;
      total: string | number;
      ativos: string | number;
      inativos: string | number;
    }> = await this.userRepository.query(
      `
        SELECT
          role,
          COUNT(*)::int AS total,
          SUM(CASE WHEN ativo = true THEN 1 ELSE 0 END)::int AS ativos,
          SUM(CASE WHEN ativo = true THEN 0 ELSE 1 END)::int AS inativos
        FROM users
        WHERE ${whereSql}
        GROUP BY role
        ORDER BY role ASC
      `,
      whereValues,
    );

    const columns = await this.getUsersTableColumns();
    const detailValues = [...whereValues, limit];
    const permissionsSelect = columns.has('permissoes')
      ? 'u.permissoes AS permissoes'
      : 'NULL::text AS permissoes';
    const lastLoginSelect = columns.has('ultimo_login')
      ? 'u.ultimo_login AS ultimo_login'
      : 'NULL::timestamp AS ultimo_login';
    const createdAtSelect = this.resolveUsersColumnExpression(
      columns,
      'created_at_ref',
      ['created_at', 'criado_em'],
      'NULL::timestamp',
    );
    const updatedAtSelect = this.resolveUsersColumnExpression(
      columns,
      'updated_at_ref',
      ['updated_at', 'atualizado_em'],
      'NULL::timestamp',
    );

    const detailRows: Array<{
      id: string;
      nome: string;
      email: string;
      role: string;
      ativo: boolean;
      permissoes?: string | null;
      ultimo_login?: string | null;
      created_at_ref?: string | null;
      updated_at_ref?: string | null;
    }> = await this.userRepository.query(
      `
        SELECT
          u.id,
          u.nome,
          u.email,
          u.role,
          u.ativo,
          ${permissionsSelect},
          ${lastLoginSelect},
          ${createdAtSelect},
          ${updatedAtSelect}
        FROM users u
        WHERE ${whereSql}
        ORDER BY u.nome ASC
        LIMIT $${whereValues.length + 1}
      `,
      detailValues,
    );

    const users = detailRows.map((row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      role: this.normalizeRoleInput(row.role) ?? row.role,
      ativo: this.isActiveFlag(row.ativo),
      permissoes: this.extractNormalizedPermissions(row.permissoes),
      ultimo_login: this.toAuditIsoString(row.ultimo_login),
      created_at: this.toAuditIsoString(row.created_at_ref),
      updated_at: this.toAuditIsoString(row.updated_at_ref),
    }));

    const byProfile = summaryRows.map((row) => {
      const profile = this.normalizeRoleInput(row.role) ?? row.role;
      return {
        role: profile,
        total: typeof row.total === 'number' ? row.total : Number(row.total) || 0,
        ativos: typeof row.ativos === 'number' ? row.ativos : Number(row.ativos) || 0,
        inativos: typeof row.inativos === 'number' ? row.inativos : Number(row.inativos) || 0,
      };
    });

    const totalUsers = byProfile.reduce((acc, entry) => acc + entry.total, 0);
    const activeUsers = byProfile.reduce((acc, entry) => acc + entry.ativos, 0);
    const inactiveUsers = byProfile.reduce((acc, entry) => acc + entry.inativos, 0);

    return {
      empresa_id: empresaId,
      generated_at: new Date().toISOString(),
      filters: {
        role: normalizedRole ?? null,
        include_inactive: includeInactive,
        detail_limit: limit,
      },
      summary: {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: inactiveUsers,
        by_profile: byProfile,
      },
      users,
    };
  }

  async recertifyUserAccess(params: {
    empresaId: string;
    targetUserId: string;
    approved: boolean;
    reason?: string | null;
    responsible: Pick<User, 'id' | 'nome' | 'email'>;
    source?: string;
  }): Promise<{
    decision: 'approved' | 'rejected';
    action_taken: 'kept' | 'deactivated' | 'already_inactive';
    activity_id: string;
    targetUser: User;
  }> {
    const targetUser = await this.findById(params.targetUserId);
    if (!targetUser || targetUser.empresa_id !== params.empresaId) {
      throw new NotFoundException('Usuario alvo da recertificacao nao encontrado');
    }

    const normalizedReason = this.normalizeAccessChangeReason(params.reason ?? undefined);
    const beforeSnapshot = this.buildAdministrativeUserSnapshot(targetUser);
    const decision: 'approved' | 'rejected' = params.approved ? 'approved' : 'rejected';

    let actionTaken: 'kept' | 'deactivated' | 'already_inactive' = 'kept';
    let updatedTargetUser = targetUser;

    if (!params.approved) {
      if (targetUser.ativo) {
        await this.userRepository.update(
          { id: targetUser.id, empresa_id: params.empresaId },
          { ativo: false },
        );
        const refreshed = await this.findById(targetUser.id);
        if (!refreshed || refreshed.empresa_id !== params.empresaId) {
          throw new NotFoundException('Usuario alvo da recertificacao nao encontrado');
        }
        updatedTargetUser = refreshed;
        actionTaken = 'deactivated';
      } else {
        actionTaken = 'already_inactive';
      }
    }

    const afterSnapshot = this.buildAdministrativeUserSnapshot(updatedTargetUser);
    const changedFields = this.buildAdministrativeChangedFields(beforeSnapshot, afterSnapshot);

    const activity = await this.userActivityRepository.save(
      this.userActivityRepository.create({
        usuarioId: params.responsible.id,
        empresaId: params.empresaId,
        tipo: AtividadeTipo.EDICAO,
        descricao: `Recertificacao de acesso ${decision} (${updatedTargetUser.email})`,
        detalhes: JSON.stringify({
          categoria: 'admin_access_review',
          evento: 'access_recertification',
          decision,
          action_taken: actionTaken,
          target_user_id: updatedTargetUser.id,
          actor: {
            id: params.responsible.id,
            nome: params.responsible.nome ?? null,
            email: params.responsible.email ?? null,
          },
          before: beforeSnapshot,
          after: afterSnapshot,
          changed_fields: changedFields,
          reason: normalizedReason ?? null,
          source: params.source ?? 'users.service.recertifyUserAccess',
          timestamp: new Date().toISOString(),
        }),
      }),
    );

    return {
      decision,
      action_taken: actionTaken,
      activity_id: activity.id,
      targetUser: updatedTargetUser,
    };
  }

  async findByEmpresa(empresaId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { empresa_id: empresaId },
      relations: ['empresa'],
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    const columns = await this.getUsersTableColumns();
    if (!columns.has('ultimo_login')) {
      return;
    }

    await this.userRepository.query(
      `
        UPDATE users
        SET ultimo_login = $1
        WHERE id = $2
      `,
      [new Date(), id],
    );
  }

  /**
   * Atualiza senha do usuário e marca como ativo (primeiro acesso concluído)
   * @param id ID do usuário
   * @param hashedPassword Senha já com hash bcrypt
   * @param ativar Se true, marca usuário como ativo (default: true)
   */
  async updatePassword(id: string, hashedPassword: string, ativar: boolean = true): Promise<void> {
    await this.userRepository.update(id, {
      senha: hashedPassword,
      ativo: ativar,
      deve_trocar_senha: false,
    });
  }

  async listarComFiltros(filtros: any): Promise<{ usuarios: User[]; total: number }> {
    try {
      const columns = await this.getUsersTableColumns();
      const select = this.buildUserSelect(columns, false);
      const scopeFilters = this.resolveReadScopeFilters(filtros);
      const whereClauses: string[] = ['u.empresa_id = $1'];
      const whereValues: unknown[] = [filtros.empresa_id];

      const busca = typeof filtros.busca === 'string' ? filtros.busca.trim() : '';
      if (busca) {
        whereValues.push(`%${busca}%`);
        const placeholder = `$${whereValues.length}`;
        whereClauses.push(`(u.nome ILIKE ${placeholder} OR u.email ILIKE ${placeholder})`);
      }

      const roleFilter = this.normalizeRoleInput(filtros.role);
      if (roleFilter) {
        whereValues.push(roleFilter);
        whereClauses.push(`u.role = $${whereValues.length}`);
      }

      if (typeof filtros.ativo === 'boolean') {
        whereValues.push(filtros.ativo);
        whereClauses.push(`u.ativo = $${whereValues.length}`);
      }

      this.appendReadScopeClause(whereClauses, whereValues, scopeFilters);

      const whereSql = whereClauses.join('\n          AND ');
      const countRows: Array<{ total: string | number }> = await this.userRepository.query(
        `
          SELECT COUNT(*)::int AS total
          FROM users u
          WHERE ${whereSql}
        `,
        whereValues,
      );

      const totalRaw = countRows?.[0]?.total ?? 0;
      const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw) || 0;

      // Garantir que a direção seja em maiúsculas para o TypeORM
      const limiteRaw = Number(filtros.limite ?? 10);
      const paginaRaw = Number(filtros.pagina ?? 1);
      const limite = Number.isFinite(limiteRaw) ? Math.max(1, Math.floor(limiteRaw)) : 10;
      const pagina = Number.isFinite(paginaRaw) ? Math.max(1, Math.floor(paginaRaw)) : 1;
      const offset = (pagina - 1) * limite;

      const direcao = this.normalizeSortDirection(filtros.direcao);
      const orderBy = this.resolveUsersSortColumn(filtros.ordenacao, columns);
      const dataValues = [...whereValues, limite, offset];
      const limitPlaceholder = `$${whereValues.length + 1}`;
      const offsetPlaceholder = `$${whereValues.length + 2}`;

      const rows: any[] = await this.userRepository.query(
        `
          SELECT
            ${select}
          FROM users u
          LEFT JOIN empresas e ON e.id = u.empresa_id
          WHERE ${whereSql}
          ORDER BY ${orderBy} ${direcao}
          LIMIT ${limitPlaceholder}
          OFFSET ${offsetPlaceholder}
        `,
        dataValues,
      );

      const usuarios = rows.map((row) => this.mapRawUser(row));
      return { usuarios, total };
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      return { usuarios: [], total: 0 };
    }
  }

  async obterEstatisticas(empresa_id: string, scopeInput: UsersReadScopeInput = {}): Promise<any> {
    const scopeFilters = this.resolveReadScopeFilters(scopeInput);
    const whereClauses: string[] = ['u.empresa_id = $1'];
    const whereValues: unknown[] = [empresa_id];
    this.appendReadScopeClause(whereClauses, whereValues, scopeFilters);

    const whereSql = whereClauses.join('\n          AND ');
    const rows: Array<{ role: string; ativo: boolean | string | number; total: string | number }> =
      await this.userRepository.query(
        `
          SELECT
            u.role AS role,
            u.ativo AS ativo,
            COUNT(*)::int AS total
          FROM users u
          WHERE ${whereSql}
          GROUP BY u.role, u.ativo
        `,
        whereValues,
      );

    let total = 0;
    let ativos = 0;
    let inativos = 0;
    let adminCount = 0;
    let gerenteCount = 0;
    let vendedorCount = 0;
    let suporteCount = 0;
    let financeiroCount = 0;

    for (const row of rows) {
      const count = typeof row.total === 'number' ? row.total : Number(row.total) || 0;
      if (count <= 0) {
        continue;
      }

      total += count;
      if (this.isActiveFlag(row.ativo)) {
        ativos += count;
      } else {
        inativos += count;
      }

      const role = this.normalizeRoleInput(row.role);
      if (role === UserRole.ADMIN) {
        adminCount += count;
      } else if (role === UserRole.GERENTE) {
        gerenteCount += count;
      } else if (role === UserRole.VENDEDOR) {
        vendedorCount += count;
      } else if (role === UserRole.SUPORTE) {
        suporteCount += count;
      } else if (role === UserRole.FINANCEIRO) {
        financeiroCount += count;
      }
    }

    return {
      total,
      ativos,
      inativos,
      por_perfil: {
        admin: adminCount,
        gerente: gerenteCount,
        manager: gerenteCount, // alias legado
        vendedor: vendedorCount,
        suporte: suporteCount,
        financeiro: financeiroCount,
        user: suporteCount, // alias legado
      },
    };
  }
  async listarAtendentes(empresa_id: string, scopeInput: UsersReadScopeInput = {}): Promise<User[]> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, false);
    const scopeFilters = this.resolveReadScopeFilters(scopeInput);
    const atendimentoPermissionWhere = ATENDIMENTO_PERMISSION_TOKENS.map(
      (token) =>
        `
            u.permissoes = '${token}'
            OR u.permissoes LIKE '${token},%'
            OR u.permissoes LIKE '%,${token}'
            OR u.permissoes LIKE '%,${token},%'
        `.trim(),
    ).join('\n            OR ');

    if (!columns.has('permissoes')) {
      const fallbackRows: any[] = await this.userRepository.query(
        `
          SELECT
            ${select}
          FROM users u
          LEFT JOIN empresas e ON e.id = u.empresa_id
          WHERE u.empresa_id = $1
            AND u.ativo = true
            AND u.role = $2
          ORDER BY u.nome ASC
        `,
        [empresa_id, UserRole.SUPORTE],
      );

      const fallbackUsers = fallbackRows.map((row) => this.mapRawUser(row));
      return this.filterUsersByReadScope(fallbackUsers, scopeFilters);
    }

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.empresa_id = $1
          AND u.ativo = true
          AND (
            ${atendimentoPermissionWhere}
          )
        ORDER BY u.nome ASC
      `,
      [empresa_id],
    );

    const atendentes = rows.map((row) => this.mapRawUser(row));
    return this.filterUsersByReadScope(atendentes, scopeFilters);
  }

  async criar(
    userData: Partial<User>,
    auditContext: AdministrativeAuditContext = {},
  ): Promise<User> {
    // Validação de campos obrigatórios
    if (!userData.nome || !userData.email || !userData.senha || !userData.empresa_id) {
      throw new Error('Campos obrigatórios ausentes: nome, email, senha, empresa_id');
    }

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(userData.senha, 10);
    const userDataWithHashedPassword = this.normalizeRoleForCreate({
      ...userData,
      senha: hashedPassword,
    });

    const user = this.userRepository.create(userDataWithHashedPassword);

    try {
      const savedUser = await this.userRepository.save(user);
      await this.persistOptionalUsersColumns(savedUser.id, userDataWithHashedPassword, savedUser.empresa_id);
      const createdUser = await this.findById(savedUser.id);
      if (!createdUser) {
        throw new NotFoundException('Usuario recem-criado nao encontrado');
      }

      await this.addAdministrativeUserActivityLog({
        empresaId: createdUser.empresa_id,
        event: 'user_create',
        tipo: AtividadeTipo.CRIACAO,
        descricao: `Usuario criado (${createdUser.email})`,
        targetUser: createdUser,
        beforeSnapshot: null,
        afterSnapshot: this.buildAdministrativeUserSnapshot(createdUser),
        auditContext,
      });

      const privilegedCreation = this.detectPrivilegedUserCreation(createdUser);
      if (privilegedCreation.isPrivileged) {
        const actor = auditContext.actor ?? null;
        if (actor?.id) {
          securityLogger.adminCreated(actor.id, createdUser.id);
        }

        await this.emitAdminSecurityAlert({
          empresaId: createdUser.empresa_id,
          event: 'privilege_escalation',
          severity: 'high',
          title: 'Alerta de seguranca: criacao de acesso privilegiado',
          message: `${
            actor?.nome || actor?.email || 'Sistema'
          } criou um usuario com acesso privilegiado (${createdUser.email}).`,
          actor,
          targetUser: {
            id: createdUser.id,
            nome: createdUser.nome,
            email: createdUser.email,
            role: createdUser.role,
          },
          metadata: {
            reasons: privilegedCreation.reasons,
            sensitive_permissions: privilegedCreation.sensitivePermissions,
          },
          source: auditContext.source || 'users.service.criar',
        });
      }

      return createdUser;
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      if (err.code === '23505' && String(err.detail).includes('email')) {
        throw new Error('Já existe um usuário cadastrado com este e-mail.');
      }
      throw err;
    }
  }

  async atualizar(
    id: string,
    userData: Partial<User>,
    empresa_id: string,
    auditContext: AdministrativeAuditContext = {},
  ): Promise<User> {
    const beforeUser = await this.findById(id);
    if (!beforeUser || beforeUser.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const normalizedData = this.normalizeRoleForUpdate(userData);
    const repositoryUpdatableData = this.extractRepositoryUpdatableFields(normalizedData);

    if (Object.keys(repositoryUpdatableData).length > 0) {
      await this.userRepository.update({ id, empresa_id }, repositoryUpdatableData);
    }

    await this.persistOptionalUsersColumns(id, normalizedData, empresa_id);
    const user = await this.findById(id);
    if (!user || user.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.addAdministrativeUserActivityLog({
      empresaId: empresa_id,
      event: 'user_update',
      tipo: AtividadeTipo.EDICAO,
      descricao: `Usuario atualizado (${user.email})`,
      targetUser: user,
      beforeSnapshot: this.buildAdministrativeUserSnapshot(beforeUser),
      afterSnapshot: this.buildAdministrativeUserSnapshot(user),
      auditContext,
    });

    const escalation = this.detectPrivilegeEscalation({
      beforeUser,
      afterUser: user,
    });
    if (escalation.isEscalation) {
      if (auditContext.actor?.id) {
        securityLogger.permissionChange(
          auditContext.actor.id,
          user.id,
          escalation.reasons.join(','),
        );
      }

      await this.emitAdminSecurityAlert({
        empresaId: empresa_id,
        event: 'privilege_escalation',
        severity: 'high',
        title: 'Alerta de seguranca: elevacao de privilegio',
        message: `${
          auditContext.actor?.nome || auditContext.actor?.email || 'Sistema'
        } alterou privilegios de ${user.email}.`,
        actor: auditContext.actor ?? null,
        targetUser: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
        },
        metadata: {
          reasons: escalation.reasons,
          added_sensitive_permissions: escalation.addedSensitivePermissions,
          before_role: beforeUser.role,
          after_role: user.role,
        },
        source: auditContext.source || 'users.service.atualizar',
      });
    }

    return user;
  }

  async excluir(
    id: string,
    empresa_id: string,
    auditContext: AdministrativeAuditContext = {},
  ): Promise<void> {
    const beforeUser = await this.findById(id);
    if (!beforeUser || beforeUser.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    try {
      const resultado = await this.userRepository.delete({ id, empresa_id });

      if (!resultado.affected) {
        throw new NotFoundException('Usuário não encontrado');
      }
      await this.addAdministrativeUserActivityLog({
        empresaId: empresa_id,
        event: 'user_delete',
        tipo: AtividadeTipo.EXCLUSAO,
        descricao: `Usuario excluido (${beforeUser.email})`,
        targetUser: beforeUser,
        beforeSnapshot: this.buildAdministrativeUserSnapshot(beforeUser),
        afterSnapshot: null,
        auditContext,
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError?.code === '23503' ||
          error.driverError?.code === 'ER_ROW_IS_REFERENCED_2')
      ) {
        throw new ConflictException(
          'Não é possível excluir este usuário porque existem registros relacionados em outros módulos. Reatribua ou conclua os vínculos antes de excluir.',
        );
      }

      throw error;
    }
  }

  async resetarSenha(
    id: string,
    empresa_id: string,
    auditContext: AdministrativeAuditContext = {},
  ): Promise<string> {
    const beforeUser = await this.findById(id);

    if (!beforeUser || beforeUser.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const novaSenha = this.gerarSenhaTemporaria();
    const senhaHasheada = await bcrypt.hash(novaSenha, 10);

    await this.userRepository.update(
      { id, empresa_id },
      {
        senha: senhaHasheada,
        deve_trocar_senha: true,
      },
    );

    const afterUser = await this.findById(id);
    if (!afterUser || afterUser.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.addAdministrativeUserActivityLog({
      empresaId: empresa_id,
      event: 'user_password_reset',
      tipo: AtividadeTipo.RESET_SENHA,
      descricao: `Senha resetada para usuario (${afterUser.email})`,
      targetUser: afterUser,
      beforeSnapshot: this.buildAdministrativeUserSnapshot(beforeUser),
      afterSnapshot: this.buildAdministrativeUserSnapshot(afterUser),
      auditContext,
    });

    return novaSenha;
  }

  private gerarSenhaTemporaria(): string {
    const letrasMaiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const letrasMinusculas = 'abcdefghijkmnpqrstuvwxyz';
    const numeros = '23456789';
    const simbolos = '@#$%&*?!';
    const conjuntoCompleto = `${letrasMaiusculas}${letrasMinusculas}${numeros}${simbolos}`;

    const gerarCaractere = (fonte: string) => fonte[Math.floor(Math.random() * fonte.length)];

    const base = [
      gerarCaractere(letrasMaiusculas),
      gerarCaractere(letrasMinusculas),
      gerarCaractere(numeros),
      gerarCaractere(simbolos),
    ];

    while (base.length < 12) {
      base.push(gerarCaractere(conjuntoCompleto));
    }

    for (let i = base.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }

    return base.join('');
  }

  async alterarStatus(
    id: string,
    ativo: boolean,
    empresa_id: string,
    auditContext: AdministrativeAuditContext = {},
  ): Promise<User> {

    // Verificar se o usuário existe e pertence à empresa
    const beforeUser = await this.findById(id);

    if (!beforeUser || beforeUser.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Atualizar o status
    await this.userRepository.update({ id, empresa_id }, { ativo });

    // Buscar o usuário atualizado
    const usuarioAtualizado = await this.findById(id);
    if (!usuarioAtualizado || usuarioAtualizado.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.addAdministrativeUserActivityLog({
      empresaId: empresa_id,
      event: 'user_status_change',
      tipo: AtividadeTipo.ALTERACAO_STATUS,
      descricao: `Status de usuario alterado para ${ativo ? 'ativo' : 'inativo'} (${usuarioAtualizado.email})`,
      targetUser: usuarioAtualizado,
      beforeSnapshot: this.buildAdministrativeUserSnapshot(beforeUser),
      afterSnapshot: this.buildAdministrativeUserSnapshot(usuarioAtualizado),
      auditContext,
    });

    return usuarioAtualizado;
  }

  async ativarEmMassa(ids: string[], empresa_id: string): Promise<void> {
    for (const id of ids) {
      await this.userRepository.update({ id, empresa_id }, { ativo: true });
    }
  }

  async desativarEmMassa(ids: string[], empresa_id: string): Promise<void> {
    for (const id of ids) {
      await this.userRepository.update({ id, empresa_id }, { ativo: false });
    }
  }
}

