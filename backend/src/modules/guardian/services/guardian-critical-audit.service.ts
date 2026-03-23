import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuardianCriticalAudit } from '../entities/guardian-critical-audit.entity';

export type GuardianCriticalAuditInput = {
  actorUserId: string;
  actorRole?: string | null;
  actorEmail?: string | null;
  empresaId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  requestIp?: string | null;
  userAgent?: string | null;
  httpMethod: string;
  route: string;
  statusCode: number;
  outcome: 'success' | 'error';
  beforePayload?: Record<string, unknown> | null;
  afterPayload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  requestId?: string | null;
};

export type GuardianCriticalAuditListFilters = {
  page?: number;
  limit?: number;
  outcome?: string;
  method?: string;
  actorUserId?: string;
  targetType?: string;
  targetId?: string;
  requestId?: string;
  route?: string;
  dataInicio?: string;
  dataFim?: string;
};

export type GuardianCriticalAuditListResult = {
  data: GuardianCriticalAudit[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@Injectable()
export class GuardianCriticalAuditService {
  private readonly logger = new Logger(GuardianCriticalAuditService.name);

  private readonly sensitiveKeys = new Set<string>([
    'password',
    'senha',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'cookie',
    'secret',
    'api_key',
    'apikey',
  ]);

  constructor(
    @InjectRepository(GuardianCriticalAudit)
    private readonly guardianCriticalAuditRepository: Repository<GuardianCriticalAudit>,
  ) {}

  async record(input: GuardianCriticalAuditInput): Promise<void> {
    try {
      await this.guardianCriticalAuditRepository.insert({
        actorUserId: input.actorUserId,
        actorRole: this.normalizeNullableString(input.actorRole, 40),
        actorEmail: this.normalizeNullableString(input.actorEmail, 255),
        empresaId: this.normalizeNullableString(input.empresaId, 36),
        targetType: this.normalizeNullableString(input.targetType, 80),
        targetId: this.normalizeNullableString(input.targetId, 120),
        requestIp: this.normalizeNullableString(input.requestIp, 45),
        userAgent: this.normalizeNullableString(input.userAgent, 1000),
        httpMethod: String(input.httpMethod || 'UNKNOWN').slice(0, 10).toUpperCase(),
        route: this.normalizeRoute(input.route),
        statusCode: Number.isFinite(input.statusCode) ? Math.trunc(input.statusCode) : 500,
        outcome: input.outcome === 'error' ? 'error' : 'success',
        beforePayload: this.sanitizeValue(input.beforePayload) as Record<string, unknown> | null,
        afterPayload: this.sanitizeValue(input.afterPayload) as Record<string, unknown> | null,
        errorMessage: this.normalizeNullableString(input.errorMessage, 2000),
        requestId: this.normalizeNullableString(input.requestId, 120),
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar auditoria critica guardian: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async list(filters: GuardianCriticalAuditListFilters = {}): Promise<GuardianCriticalAuditListResult> {
    const page = this.clamp(filters.page, 1, 100000, 1);
    const limit = this.clamp(filters.limit, 1, 200, 20);

    const query = this.guardianCriticalAuditRepository
      .createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC');

    const outcome = this.normalizeOutcome(filters.outcome);
    if (outcome) {
      query.andWhere('audit.outcome = :outcome', { outcome });
    }

    const method = this.normalizeHttpMethod(filters.method);
    if (method) {
      query.andWhere('audit.httpMethod = :method', { method });
    }

    const actorUserId = this.normalizeFilterText(filters.actorUserId, 120);
    if (actorUserId) {
      query.andWhere('audit.actorUserId = :actorUserId', { actorUserId });
    }

    const targetType = this.normalizeFilterText(filters.targetType, 80);
    if (targetType) {
      query.andWhere('audit.targetType = :targetType', { targetType });
    }

    const targetId = this.normalizeFilterText(filters.targetId, 120);
    if (targetId) {
      query.andWhere('audit.targetId ILIKE :targetId', { targetId: `%${targetId}%` });
    }

    const requestId = this.normalizeFilterText(filters.requestId, 120);
    if (requestId) {
      query.andWhere('audit.requestId ILIKE :requestId', { requestId: `%${requestId}%` });
    }

    const route = this.normalizeFilterText(filters.route, 255);
    if (route) {
      query.andWhere('audit.route ILIKE :route', { route: `%${route}%` });
    }

    const range = this.normalizeDateRange(filters.dataInicio, filters.dataFim);
    if (range.dataInicio) {
      query.andWhere('audit.createdAt >= :dataInicio', { dataInicio: range.dataInicio });
    }
    if (range.dataFim) {
      query.andWhere('audit.createdAt <= :dataFim', { dataFim: range.dataFim });
    }

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listForExport(filters: GuardianCriticalAuditListFilters = {}): Promise<GuardianCriticalAudit[]> {
    const limit = this.clamp(filters.limit, 1, 5000, 1000);
    const result = await this.list({
      ...filters,
      page: 1,
      limit,
    });
    return result.data;
  }

  private normalizeNullableString(value: unknown, maxLength: number): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    return normalized.slice(0, maxLength);
  }

  private normalizeFilterText(value: unknown, maxLength: number): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }

    return normalized.slice(0, maxLength);
  }

  private normalizeOutcome(value: unknown): 'success' | 'error' | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (normalized !== 'success' && normalized !== 'error') {
      throw new BadRequestException('Parametro outcome invalido');
    }

    return normalized;
  }

  private normalizeHttpMethod(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toUpperCase();
    if (!normalized) {
      return undefined;
    }

    if (!/^[A-Z]{3,10}$/.test(normalized)) {
      throw new BadRequestException('Parametro method invalido');
    }

    return normalized;
  }

  private normalizeDateRange(dataInicio?: string, dataFim?: string): {
    dataInicio?: Date;
    dataFim?: Date;
  } {
    const startDate = this.parseDate(dataInicio, 'data_inicio');
    const endDate = this.parseDate(dataFim, 'data_fim');

    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('Periodo invalido: data_fim menor que data_inicio');
    }

    return {
      dataInicio: startDate,
      dataFim: endDate,
    };
  }

  private parseDate(value: unknown, fieldName: string): Date | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Parametro ${fieldName} invalido`);
    }

    return parsed;
  }

  private clamp(value: number | undefined, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.trunc(value as number)));
  }

  private normalizeRoute(route: unknown): string {
    if (typeof route !== 'string' || !route.trim()) {
      return '/guardian';
    }

    return route.trim().split('?')[0].slice(0, 255);
  }

  private sanitizeValue(input: unknown, depth = 0): unknown {
    if (input === null || input === undefined) {
      return null;
    }

    if (depth > 4) {
      return '[depth-limited]';
    }

    if (typeof input === 'string') {
      return input.length > 1000 ? `${input.slice(0, 1000)}...` : input;
    }

    if (typeof input === 'number' || typeof input === 'boolean') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.slice(0, 50).map((item) => this.sanitizeValue(item, depth + 1));
    }

    if (typeof input !== 'object') {
      return String(input).slice(0, 200);
    }

    const sanitized: Record<string, unknown> = {};
    const entries = Object.entries(input as Record<string, unknown>).slice(0, 80);
    for (const [key, value] of entries) {
      if (this.sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      sanitized[key] = this.sanitizeValue(value, depth + 1);
    }
    return sanitized;
  }
}
