import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  LEGACY_PERMISSION_ALIASES,
  Permission,
} from '../../../common/permissions/permissions.constants';
import { resolveUserPermissions } from '../../../common/permissions/permissions.utils';
import {
  AdminBreakGlassAccess,
  AdminBreakGlassStatus,
} from '../entities/admin-break-glass-access.entity';
import { AtividadeTipo, UserActivity } from '../entities/user-activity.entity';
import { User, UserRole } from '../user.entity';

type BreakGlassActor = Pick<User, 'id' | 'nome' | 'email' | 'role' | 'empresa_id'>;

type ListBreakGlassFilters = {
  status?: string;
  limit?: number;
  targetUserId?: string;
};

@Injectable()
export class AdminBreakGlassAccessService {
  private readonly logger = new Logger(AdminBreakGlassAccessService.name);
  private hasWarnedMissingTable = false;
  private readonly canonicalPermissions = new Set<string>(Object.values(Permission));

  constructor(
    @InjectRepository(AdminBreakGlassAccess)
    private readonly breakGlassRepository: Repository<AdminBreakGlassAccess>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async requestAccess(params: {
    actor: BreakGlassActor;
    targetUserId: string;
    scopePermissions: string[];
    durationMinutes?: number;
    requestReason: string;
  }): Promise<Record<string, unknown>> {
    const empresaId = this.normalizeRequiredUuidLike(params.actor?.empresa_id, 'empresa_id');
    const targetUserId = this.normalizeRequiredUuidLike(params.targetUserId, 'target_user_id');
    const requestReason = this.normalizeRequiredReason(params.requestReason, 'request_reason');
    const scopePermissions = this.normalizeScopePermissions(params.scopePermissions, {
      allowEmpty: false,
    });
    const durationMinutes = this.normalizeDurationMinutes(params.durationMinutes);

    const actorRole = this.normalizeRole(params.actor.role);
    if (!actorRole || !this.canRequestBreakGlass(actorRole)) {
      throw new ForbiddenException('Perfil sem permissao para solicitar acesso emergencial');
    }

    const targetUser = await this.findCompanyUserOrThrow(targetUserId, empresaId);
    this.ensureTargetRoleAllowed(actorRole, targetUser.role, 'solicitar');

    const existingPending = await this.breakGlassRepository.findOne({
      where: {
        empresaId,
        targetUserId,
        status: AdminBreakGlassStatus.REQUESTED,
      },
      order: { createdAt: 'DESC' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Ja existe solicitacao pendente de break-glass para este usuario',
      );
    }

    await this.expireDueAccesses(empresaId, targetUserId);

    const activeGrant = await this.breakGlassRepository
      .createQueryBuilder('grant')
      .where('grant.empresaId = :empresaId', { empresaId })
      .andWhere('grant.targetUserId = :targetUserId', { targetUserId })
      .andWhere('grant.status = :status', { status: AdminBreakGlassStatus.APPROVED })
      .andWhere('grant.expiresAt IS NOT NULL')
      .andWhere('grant.expiresAt > :now', { now: new Date() })
      .getOne();

    if (activeGrant) {
      throw new BadRequestException('Usuario ja possui acesso emergencial ativo');
    }

    const request = await this.breakGlassRepository.save(
      this.breakGlassRepository.create({
        empresaId,
        targetUserId,
        requestedByUserId: params.actor.id,
        approvedByUserId: null,
        revokedByUserId: null,
        status: AdminBreakGlassStatus.REQUESTED,
        scopePermissions,
        durationMinutes,
        requestReason,
        approvalReason: null,
        revocationReason: null,
        requestedAt: new Date(),
        approvedAt: null,
        startsAt: null,
        expiresAt: null,
        revokedAt: null,
      }),
    );

    const hydrated = await this.findByIdOrThrow(request.id, empresaId);

    await this.addBreakGlassActivity({
      empresaId,
      actor: params.actor,
      event: 'break_glass_requested',
      request: hydrated,
      reason: requestReason,
      metadata: {
        duration_minutes: durationMinutes,
        permissions: scopePermissions,
      },
    });

    return this.serializeRequest(hydrated);
  }

  async listRequests(
    actor: BreakGlassActor,
    filters: ListBreakGlassFilters = {},
  ): Promise<Record<string, unknown>[]> {
    const empresaId = this.normalizeRequiredUuidLike(actor?.empresa_id, 'empresa_id');
    await this.expireDueAccesses(empresaId);

    const normalizedStatus = this.normalizeStatus(filters.status);
    const limit = this.clamp(filters.limit, 1, 200, 50);

    const query = this.breakGlassRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requestedByUser', 'requestedByUser')
      .leftJoinAndSelect('request.approvedByUser', 'approvedByUser')
      .leftJoinAndSelect('request.revokedByUser', 'revokedByUser')
      .leftJoinAndSelect('request.targetUser', 'targetUser')
      .where('request.empresaId = :empresaId', { empresaId })
      .orderBy('request.createdAt', 'DESC')
      .take(limit);

    if (normalizedStatus) {
      query.andWhere('request.status = :status', { status: normalizedStatus });
    }

    const targetUserId = this.normalizeOptionalUuidLike(filters.targetUserId);
    if (targetUserId) {
      query.andWhere('request.targetUserId = :targetUserId', { targetUserId });
    }

    const items = await this.safeTableCall(() => query.getMany(), []);
    return items.map((item) => this.serializeRequest(item));
  }

  async approveRequest(params: {
    actor: BreakGlassActor;
    requestId: string;
    approvalReason?: string;
  }): Promise<Record<string, unknown>> {
    const empresaId = this.normalizeRequiredUuidLike(params.actor?.empresa_id, 'empresa_id');
    const requestId = this.normalizeRequiredUuidLike(params.requestId, 'id');
    const actorRole = this.normalizeRole(params.actor.role);
    if (!actorRole || !this.canApproveOrRevokeBreakGlass(actorRole)) {
      throw new ForbiddenException('Perfil sem permissao para aprovar break-glass');
    }

    const request = await this.findByIdOrThrow(requestId, empresaId);
    if (request.status !== AdminBreakGlassStatus.REQUESTED) {
      throw new BadRequestException('Solicitacao de break-glass ja foi decidida');
    }
    if (request.requestedByUserId === params.actor.id) {
      throw new ForbiddenException('O solicitante nao pode aprovar a propria solicitacao');
    }

    const targetUser = await this.findCompanyUserOrThrow(request.targetUserId, empresaId);
    this.ensureTargetRoleAllowed(actorRole, targetUser.role, 'aprovar');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + request.durationMinutes * 60 * 1000);
    const approvalReason = this.normalizeOptionalReason(params.approvalReason);

    request.status = AdminBreakGlassStatus.APPROVED;
    request.approvedByUserId = params.actor.id;
    request.approvalReason = approvalReason;
    request.approvedAt = now;
    request.startsAt = now;
    request.expiresAt = expiresAt;
    request.revokedAt = null;
    request.revokedByUserId = null;
    request.revocationReason = null;

    const saved = await this.breakGlassRepository.save(request);

    await this.addBreakGlassActivity({
      empresaId,
      actor: params.actor,
      event: 'break_glass_approved',
      request: saved,
      reason: approvalReason ?? null,
      metadata: {
        starts_at: saved.startsAt?.toISOString() ?? null,
        expires_at: saved.expiresAt?.toISOString() ?? null,
      },
    });

    return this.serializeRequest(saved);
  }

  async rejectRequest(params: {
    actor: BreakGlassActor;
    requestId: string;
    rejectionReason: string;
  }): Promise<Record<string, unknown>> {
    const empresaId = this.normalizeRequiredUuidLike(params.actor?.empresa_id, 'empresa_id');
    const requestId = this.normalizeRequiredUuidLike(params.requestId, 'id');
    const actorRole = this.normalizeRole(params.actor.role);
    if (!actorRole || !this.canApproveOrRevokeBreakGlass(actorRole)) {
      throw new ForbiddenException('Perfil sem permissao para rejeitar break-glass');
    }

    const request = await this.findByIdOrThrow(requestId, empresaId);
    if (request.status !== AdminBreakGlassStatus.REQUESTED) {
      throw new BadRequestException('Solicitacao de break-glass ja foi decidida');
    }
    if (request.requestedByUserId === params.actor.id) {
      throw new ForbiddenException('O solicitante nao pode rejeitar a propria solicitacao');
    }

    const rejectionReason = this.normalizeRequiredReason(
      params.rejectionReason,
      'rejection_reason',
    );

    request.status = AdminBreakGlassStatus.REJECTED;
    request.approvedByUserId = params.actor.id;
    request.approvalReason = rejectionReason;
    request.approvedAt = new Date();
    request.startsAt = null;
    request.expiresAt = null;
    request.revokedAt = null;
    request.revokedByUserId = null;
    request.revocationReason = null;

    const saved = await this.breakGlassRepository.save(request);

    await this.addBreakGlassActivity({
      empresaId,
      actor: params.actor,
      event: 'break_glass_rejected',
      request: saved,
      reason: rejectionReason,
    });

    return this.serializeRequest(saved);
  }

  async revokeActiveAccess(params: {
    actor: BreakGlassActor;
    requestId: string;
    revocationReason?: string;
  }): Promise<Record<string, unknown>> {
    const empresaId = this.normalizeRequiredUuidLike(params.actor?.empresa_id, 'empresa_id');
    const requestId = this.normalizeRequiredUuidLike(params.requestId, 'id');
    const actorRole = this.normalizeRole(params.actor.role);
    if (!actorRole || !this.canApproveOrRevokeBreakGlass(actorRole)) {
      throw new ForbiddenException('Perfil sem permissao para revogar break-glass');
    }

    await this.expireDueAccesses(empresaId);
    const request = await this.findByIdOrThrow(requestId, empresaId);
    if (request.status !== AdminBreakGlassStatus.APPROVED) {
      throw new BadRequestException('Somente acessos emergenciais ativos podem ser revogados');
    }

    const targetUser = await this.findCompanyUserOrThrow(request.targetUserId, empresaId);
    this.ensureTargetRoleAllowed(actorRole, targetUser.role, 'revogar');

    const revocationReason = this.normalizeOptionalReason(params.revocationReason);
    request.status = AdminBreakGlassStatus.REVOKED;
    request.revokedByUserId = params.actor.id;
    request.revokedAt = new Date();
    request.revocationReason = revocationReason ?? null;

    const saved = await this.breakGlassRepository.save(request);

    await this.addBreakGlassActivity({
      empresaId,
      actor: params.actor,
      event: 'break_glass_revoked',
      request: saved,
      reason: revocationReason ?? null,
    });

    return this.serializeRequest(saved);
  }

  async listActiveAccesses(
    actor: BreakGlassActor,
    filters: { limit?: number; targetUserId?: string } = {},
  ): Promise<Record<string, unknown>[]> {
    const empresaId = this.normalizeRequiredUuidLike(actor?.empresa_id, 'empresa_id');
    await this.expireDueAccesses(empresaId);

    const limit = this.clamp(filters.limit, 1, 200, 50);
    const targetUserId = this.normalizeOptionalUuidLike(filters.targetUserId);

    const query = this.breakGlassRepository
      .createQueryBuilder('grant')
      .leftJoinAndSelect('grant.requestedByUser', 'requestedByUser')
      .leftJoinAndSelect('grant.approvedByUser', 'approvedByUser')
      .leftJoinAndSelect('grant.revokedByUser', 'revokedByUser')
      .leftJoinAndSelect('grant.targetUser', 'targetUser')
      .where('grant.empresaId = :empresaId', { empresaId })
      .andWhere('grant.status = :status', { status: AdminBreakGlassStatus.APPROVED })
      .andWhere('grant.startsAt IS NOT NULL')
      .andWhere('grant.expiresAt IS NOT NULL')
      .andWhere('grant.startsAt <= :now', { now: new Date() })
      .andWhere('grant.expiresAt > :now', { now: new Date() })
      .orderBy('grant.expiresAt', 'ASC')
      .take(limit);

    if (targetUserId) {
      query.andWhere('grant.targetUserId = :targetUserId', { targetUserId });
    }

    const items = await this.safeTableCall(() => query.getMany(), []);
    return items.map((item) => this.serializeRequest(item));
  }

  async resolveEffectivePermissionsForUser(user: User): Promise<{
    permissions: string[];
    breakGlass: {
      active: boolean;
      grants: Array<{ id: string; expires_at: string; permissions: string[] }>;
    };
  }> {
    const basePermissions = Array.from(resolveUserPermissions(user)).map((permission) =>
      String(permission),
    );
    const baseSet = new Set<string>(basePermissions);

    if (!user?.id || !user?.empresa_id) {
      return {
        permissions: Array.from(baseSet),
        breakGlass: {
          active: false,
          grants: [],
        },
      };
    }

    await this.expireDueAccesses(user.empresa_id, user.id);

    const now = new Date();
    const activeGrants = await this.safeTableCall(
      () =>
        this.breakGlassRepository
          .createQueryBuilder('grant')
          .where('grant.empresaId = :empresaId', { empresaId: user.empresa_id })
          .andWhere('grant.targetUserId = :targetUserId', { targetUserId: user.id })
          .andWhere('grant.status = :status', { status: AdminBreakGlassStatus.APPROVED })
          .andWhere('grant.startsAt IS NOT NULL')
          .andWhere('grant.expiresAt IS NOT NULL')
          .andWhere('grant.startsAt <= :now', { now })
          .andWhere('grant.expiresAt > :now', { now })
          .orderBy('grant.expiresAt', 'ASC')
          .getMany(),
      [],
    );

    for (const grant of activeGrants) {
      for (const permission of this.normalizeScopePermissions(grant.scopePermissions, { allowEmpty: true })) {
        baseSet.add(permission);
      }
    }

    return {
      permissions: Array.from(baseSet),
      breakGlass: {
        active: activeGrants.length > 0,
        grants: activeGrants
          .filter((grant) => grant.expiresAt)
          .map((grant) => ({
            id: grant.id,
            expires_at: grant.expiresAt!.toISOString(),
            permissions: this.normalizeScopePermissions(grant.scopePermissions, {
              allowEmpty: true,
            }),
          })),
      },
    };
  }

  async expireDueAccesses(empresaId?: string, targetUserId?: string): Promise<number> {
    const now = new Date();

    const query = this.breakGlassRepository
      .createQueryBuilder('grant')
      .leftJoinAndSelect('grant.targetUser', 'targetUser')
      .where('grant.status = :status', { status: AdminBreakGlassStatus.APPROVED })
      .andWhere('grant.expiresAt IS NOT NULL')
      .andWhere('grant.expiresAt <= :now', { now })
      .orderBy('grant.expiresAt', 'ASC')
      .take(200);

    if (empresaId) {
      query.andWhere('grant.empresaId = :empresaId', { empresaId });
    }

    if (targetUserId) {
      query.andWhere('grant.targetUserId = :targetUserId', { targetUserId });
    }

    const expired = await this.safeTableCall(() => query.getMany(), []);
    if (expired.length === 0) {
      return 0;
    }

    for (const grant of expired) {
      grant.status = AdminBreakGlassStatus.EXPIRED;
      grant.revokedAt = now;
      grant.revokedByUserId = null;
      grant.revocationReason = 'Expiracao automatica do acesso emergencial';

      const saved = await this.breakGlassRepository.save(grant);
      await this.addBreakGlassActivity({
        empresaId: saved.empresaId,
        actor: null,
        event: 'break_glass_expired',
        request: saved,
        reason: saved.revocationReason,
      });
    }

    return expired.length;
  }

  private normalizeStatus(status?: string): AdminBreakGlassStatus | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = status.trim().toUpperCase() as AdminBreakGlassStatus;
    const allowed = new Set<AdminBreakGlassStatus>(Object.values(AdminBreakGlassStatus));
    if (!allowed.has(normalized)) {
      throw new BadRequestException(
        'Status invalido. Use REQUESTED, APPROVED, REJECTED, EXPIRED ou REVOKED.',
      );
    }

    return normalized;
  }

  private normalizePermissionToken(permission: unknown): string | null {
    if (typeof permission !== 'string') {
      return null;
    }

    const trimmed = permission.trim();
    if (!trimmed) {
      return null;
    }

    const canonical = trimmed.toLowerCase();
    if (this.canonicalPermissions.has(canonical)) {
      return canonical;
    }

    const legacy = LEGACY_PERMISSION_ALIASES[trimmed.toUpperCase()];
    return legacy ?? null;
  }

  private normalizeScopePermissions(
    input: unknown,
    options: { allowEmpty?: boolean } = {},
  ): string[] {
    const values: unknown[] = Array.isArray(input)
      ? input
      : typeof input === 'string'
        ? input.split(',')
        : [];

    const normalized = values
      .map((value) => this.normalizePermissionToken(value))
      .filter((value): value is string => !!value);

    const unique = Array.from(new Set(normalized));
    if (unique.length === 0 && !options.allowEmpty) {
      throw new BadRequestException('Informe ao menos uma permissao canonica para o break-glass');
    }

    if (unique.length > 20) {
      throw new BadRequestException('Limite maximo de 20 permissoes por solicitacao break-glass');
    }

    return unique;
  }

  private normalizeDurationMinutes(value?: number): number {
    const fallback = 30;
    const numeric = Number.isFinite(value) ? Number(value) : fallback;
    const parsed = Math.trunc(numeric);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return this.clamp(parsed, 5, 240, fallback);
  }

  private normalizeRequiredReason(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`Campo ${fieldName} obrigatorio`);
    }

    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`Campo ${fieldName} obrigatorio`);
    }

    return normalized.slice(0, 4000);
  }

  private normalizeOptionalReason(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Campo reason invalido');
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    return normalized.slice(0, 4000);
  }

  private normalizeRequiredUuidLike(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`Campo ${fieldName} obrigatorio`);
    }

    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`Campo ${fieldName} obrigatorio`);
    }

    return normalized;
  }

  private normalizeOptionalUuidLike(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized || undefined;
  }

  private normalizeRole(role: unknown): UserRole | null {
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

  private canRequestBreakGlass(role: UserRole): boolean {
    return (
      role === UserRole.SUPERADMIN ||
      role === UserRole.ADMIN ||
      role === UserRole.GERENTE
    );
  }

  private canApproveOrRevokeBreakGlass(role: UserRole): boolean {
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN;
  }

  private ensureTargetRoleAllowed(
    actorRole: UserRole,
    targetRole: unknown,
    verb: 'solicitar' | 'aprovar' | 'revogar',
  ): void {
    const normalizedTargetRole = this.normalizeRole(targetRole);
    if (!normalizedTargetRole) {
      throw new BadRequestException('Perfil do usuario alvo invalido para break-glass');
    }

    if (normalizedTargetRole === UserRole.SUPERADMIN && actorRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(`Somente superadmin pode ${verb} break-glass para superadmin`);
    }
  }

  private async findCompanyUserOrThrow(userId: string, empresaId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, empresa_id: empresaId },
      select: ['id', 'nome', 'email', 'role', 'ativo', 'empresa_id'],
    });

    if (!user) {
      throw new NotFoundException('Usuario alvo nao encontrado');
    }

    if (!user.ativo) {
      throw new BadRequestException('Usuario alvo inativo para break-glass');
    }

    return user;
  }

  private async findByIdOrThrow(id: string, empresaId: string): Promise<AdminBreakGlassAccess> {
    const request = await this.safeTableCall(
      () =>
        this.breakGlassRepository.findOne({
          where: { id, empresaId },
          relations: ['requestedByUser', 'approvedByUser', 'revokedByUser', 'targetUser'],
        }),
      null,
    );

    if (!request) {
      throw new NotFoundException('Solicitacao de break-glass nao encontrada');
    }

    return request;
  }

  private serializeRequest(entry: AdminBreakGlassAccess): Record<string, unknown> {
    return {
      id: entry.id,
      empresa_id: entry.empresaId,
      status: entry.status,
      scope_permissions: this.normalizeScopePermissions(entry.scopePermissions, {
        allowEmpty: true,
      }),
      duration_minutes: entry.durationMinutes,
      request_reason: entry.requestReason,
      approval_reason: entry.approvalReason ?? null,
      revocation_reason: entry.revocationReason ?? null,
      requested_at: entry.requestedAt,
      approved_at: entry.approvedAt ?? null,
      starts_at: entry.startsAt ?? null,
      expires_at: entry.expiresAt ?? null,
      revoked_at: entry.revokedAt ?? null,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
      target_user_id: entry.targetUserId,
      requested_by_user_id: entry.requestedByUserId,
      approved_by_user_id: entry.approvedByUserId ?? null,
      revoked_by_user_id: entry.revokedByUserId ?? null,
      target_user: entry.targetUser
        ? {
            id: entry.targetUser.id,
            nome: entry.targetUser.nome,
            email: entry.targetUser.email,
            role: entry.targetUser.role,
          }
        : null,
      requested_by: entry.requestedByUser
        ? {
            id: entry.requestedByUser.id,
            nome: entry.requestedByUser.nome,
            email: entry.requestedByUser.email,
            role: entry.requestedByUser.role,
          }
        : null,
      approved_by: entry.approvedByUser
        ? {
            id: entry.approvedByUser.id,
            nome: entry.approvedByUser.nome,
            email: entry.approvedByUser.email,
            role: entry.approvedByUser.role,
          }
        : null,
      revoked_by: entry.revokedByUser
        ? {
            id: entry.revokedByUser.id,
            nome: entry.revokedByUser.nome,
            email: entry.revokedByUser.email,
            role: entry.revokedByUser.role,
          }
        : null,
    };
  }

  private async addBreakGlassActivity(params: {
    empresaId: string;
    actor: BreakGlassActor | null;
    event:
      | 'break_glass_requested'
      | 'break_glass_approved'
      | 'break_glass_rejected'
      | 'break_glass_revoked'
      | 'break_glass_expired';
    request: AdminBreakGlassAccess;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const actor = params.actor;
    const fallbackActorId = actor?.id || params.request.targetUserId;

    await this.userActivityRepository.save(
      this.userActivityRepository.create({
        usuarioId: fallbackActorId,
        empresaId: params.empresaId,
        tipo: AtividadeTipo.EDICAO,
        descricao: `Break-glass ${params.event} (${params.request.id})`,
        detalhes: JSON.stringify({
          categoria: 'admin_break_glass',
          evento: params.event,
          request_id: params.request.id,
          status: params.request.status,
          target_user_id: params.request.targetUserId,
          actor: actor
            ? {
                id: actor.id,
                nome: actor.nome ?? null,
                email: actor.email ?? null,
                role: actor.role ?? null,
              }
            : null,
          reason: params.reason ?? null,
          scope_permissions: this.normalizeScopePermissions(params.request.scopePermissions, {
            allowEmpty: true,
          }),
          duration_minutes: params.request.durationMinutes,
          starts_at: params.request.startsAt?.toISOString() ?? null,
          expires_at: params.request.expiresAt?.toISOString() ?? null,
          metadata: params.metadata ?? null,
          timestamp: new Date().toISOString(),
        }),
      }),
    );
  }

  private clamp(value: number | undefined, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.trunc(value as number)));
  }

  private isMissingTableError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const code = String(
      (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code || '',
    );
    return code === '42P01';
  }

  private async safeTableCall<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isMissingTableError(error)) {
        if (!this.hasWarnedMissingTable) {
          this.hasWarnedMissingTable = true;
          this.logger.warn(
            '[ADM-303] Tabela admin_break_glass_accesses ausente. Fluxo break-glass operando em fallback.',
          );
        }
        return fallback;
      }

      throw error;
    }
  }
}
