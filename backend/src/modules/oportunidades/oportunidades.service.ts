import { BadRequestException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Oportunidade,
  EstagioOportunidade,
  OrigemOportunidade,
  LifecycleStatusOportunidade,
} from './oportunidade.entity';
import { Atividade, TipoAtividade } from './atividade.entity';
import { OportunidadeStageEvent } from './oportunidade-stage-event.entity';
import { DashboardV2JobsService } from '../dashboard-v2/dashboard-v2.jobs.service';
import { Lead, OrigemLead, StatusLead } from '../leads/lead.entity';
import {
  CreateOportunidadeDto,
  LifecycleTransitionDto,
  LifecycleViewOportunidade,
  MetricasQueryDto,
  OportunidadesListQueryDto,
  UpdateOportunidadeDto,
  UpdateEstagioDto,
} from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';
import { FeatureFlagTenant } from '../dashboard-v2/entities/feature-flag-tenant.entity';
import { createHash } from 'crypto';

const ALL_OPORTUNIDADE_STAGES = new Set<string>([
  EstagioOportunidade.LEADS,
  EstagioOportunidade.QUALIFICACAO,
  EstagioOportunidade.PROPOSTA,
  EstagioOportunidade.NEGOCIACAO,
  EstagioOportunidade.FECHAMENTO,
  EstagioOportunidade.GANHO,
  EstagioOportunidade.PERDIDO,
]);

const MODERN_DB_STAGE_VALUES = new Set<string>([
  'leads',
  'qualification',
  'proposal',
  'negotiation',
  'closing',
  'won',
  'lost',
]);

const LEGACY_DB_STAGE_VALUES = new Set<string>([
  'lead',
  'qualificado',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
]);

const OPORTUNIDADES_LIFECYCLE_FLAG_KEY = 'crm_oportunidades_lifecycle_v1';
const OPORTUNIDADES_STALE_POLICY_FLAG_KEY = 'crm_oportunidades_stale_policy_v1';
const OPORTUNIDADES_STALE_AUTO_ARCHIVE_FLAG_KEY = 'crm_oportunidades_stale_auto_archive_v1';
const STALE_DEFAULT_THRESHOLD_DAYS = 30;
const STALE_DEFAULT_AUTO_ARCHIVE_DAYS = 60;
const STALE_MIN_DAYS = 7;
const STALE_MAX_DAYS = 365;
const STALE_DEFAULT_SCAN_LIMIT = 300;
const ALL_OPORTUNIDADE_LIFECYCLE_STATUSES = new Set<string>([
  LifecycleStatusOportunidade.OPEN,
  LifecycleStatusOportunidade.WON,
  LifecycleStatusOportunidade.LOST,
  LifecycleStatusOportunidade.ARCHIVED,
  LifecycleStatusOportunidade.DELETED,
]);

export const OPORTUNIDADE_LIFECYCLE_TRANSITIONS: Record<
  LifecycleStatusOportunidade,
  readonly LifecycleStatusOportunidade[]
> = {
  [LifecycleStatusOportunidade.OPEN]: [
    LifecycleStatusOportunidade.WON,
    LifecycleStatusOportunidade.LOST,
    LifecycleStatusOportunidade.ARCHIVED,
    LifecycleStatusOportunidade.DELETED,
  ],
  [LifecycleStatusOportunidade.WON]: [
    LifecycleStatusOportunidade.OPEN,
    LifecycleStatusOportunidade.ARCHIVED,
    LifecycleStatusOportunidade.DELETED,
  ],
  [LifecycleStatusOportunidade.LOST]: [
    LifecycleStatusOportunidade.OPEN,
    LifecycleStatusOportunidade.ARCHIVED,
    LifecycleStatusOportunidade.DELETED,
  ],
  [LifecycleStatusOportunidade.ARCHIVED]: [
    LifecycleStatusOportunidade.OPEN,
    LifecycleStatusOportunidade.WON,
    LifecycleStatusOportunidade.LOST,
    LifecycleStatusOportunidade.DELETED,
  ],
  [LifecycleStatusOportunidade.DELETED]: [
    LifecycleStatusOportunidade.OPEN,
    LifecycleStatusOportunidade.WON,
    LifecycleStatusOportunidade.LOST,
    LifecycleStatusOportunidade.ARCHIVED,
  ],
};

type LifecycleFlagDecision = {
  enabled: boolean;
  source: 'disabled' | 'enabled' | 'rollout';
  rolloutPercentage: number;
};

type TenantFlagSource = 'tenant' | 'default';

type StalePolicyDecision = {
  enabled: boolean;
  thresholdDays: number;
  source: TenantFlagSource;
  autoArchiveEnabled: boolean;
  autoArchiveAfterDays: number;
  autoArchiveSource: TenantFlagSource;
};

type StaleOpportunitySnapshot = {
  id: string;
  oportunidade: Oportunidade;
  isStale: boolean;
  staleDays: number;
  lastInteractionAt: string | null;
  staleSince: string | null;
};

type StaleCheckResult = {
  enabled: boolean;
  thresholdDays: number;
  totalCandidates: number;
  totalStale: number;
  generatedAt: string;
  stale: Oportunidade[];
};

type AutoArchiveResult = {
  enabled: boolean;
  autoArchiveEnabled: boolean;
  thresholdDays: number;
  totalCandidates: number;
  archivedCount: number;
  dryRun: boolean;
  trigger: 'manual' | 'scheduler';
  archivedIds: string[];
  failed: Array<{ id: string; reason: string }>;
  generatedAt: string;
};

function normalizeLifecycleRuleInput(
  lifecycleStatus?: LifecycleStatusOportunidade | string | null,
): LifecycleStatusOportunidade | null {
  const normalized = (lifecycleStatus || '').toString().trim().toLowerCase();
  if (!normalized) return null;

  switch (normalized) {
    case 'open':
    case 'aberta':
    case 'aberto':
      return LifecycleStatusOportunidade.OPEN;
    case 'won':
    case 'ganho':
      return LifecycleStatusOportunidade.WON;
    case 'lost':
    case 'perdido':
      return LifecycleStatusOportunidade.LOST;
    case 'archived':
    case 'arquivado':
      return LifecycleStatusOportunidade.ARCHIVED;
    case 'deleted':
    case 'deletado':
    case 'excluido':
      return LifecycleStatusOportunidade.DELETED;
    default:
      return ALL_OPORTUNIDADE_LIFECYCLE_STATUSES.has(normalized)
        ? (normalized as LifecycleStatusOportunidade)
        : null;
  }
}

function normalizeStageRuleInput(
  stage?: EstagioOportunidade | string | null,
): EstagioOportunidade | null {
  const normalized = (stage || '').toString().trim().toLowerCase();
  if (!normalized) return null;

  switch (normalized) {
    case 'lead':
    case 'leads':
      return EstagioOportunidade.LEADS;
    case 'qualificado':
    case 'qualificacao':
    case 'qualification':
      return EstagioOportunidade.QUALIFICACAO;
    case 'proposta':
    case 'proposal':
      return EstagioOportunidade.PROPOSTA;
    case 'negociacao':
    case 'negotiation':
      return EstagioOportunidade.NEGOCIACAO;
    case 'fechamento':
    case 'closing':
      return EstagioOportunidade.FECHAMENTO;
    case 'ganho':
    case 'won':
      return EstagioOportunidade.GANHO;
    case 'perdido':
    case 'lost':
      return EstagioOportunidade.PERDIDO;
    default:
      return ALL_OPORTUNIDADE_STAGES.has(normalized)
        ? (normalized as EstagioOportunidade)
        : null;
  }
}

export const OPORTUNIDADE_STAGE_TRANSITIONS: Record<
  EstagioOportunidade,
  readonly EstagioOportunidade[]
> = {
  // Fluxo "forward" sequencial com rollback de 1 etapa entre estágios comerciais.
  // Estágios terminais (won/lost) não podem ser reabertos via updateEstagio.
  [EstagioOportunidade.LEADS]: [EstagioOportunidade.QUALIFICACAO, EstagioOportunidade.PERDIDO],
  [EstagioOportunidade.QUALIFICACAO]: [
    EstagioOportunidade.LEADS,
    EstagioOportunidade.PROPOSTA,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.PROPOSTA]: [
    EstagioOportunidade.QUALIFICACAO,
    EstagioOportunidade.NEGOCIACAO,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.NEGOCIACAO]: [
    EstagioOportunidade.PROPOSTA,
    EstagioOportunidade.FECHAMENTO,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.FECHAMENTO]: [
    EstagioOportunidade.NEGOCIACAO,
    EstagioOportunidade.GANHO,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.GANHO]: [],
  [EstagioOportunidade.PERDIDO]: [],
};

export function isOportunidadeTerminalStage(stage?: EstagioOportunidade | string | null): boolean {
  const normalized = normalizeStageRuleInput(stage);
  return normalized === EstagioOportunidade.GANHO || normalized === EstagioOportunidade.PERDIDO;
}

export function getAllowedNextOportunidadeStages(
  currentStage?: EstagioOportunidade | string | null,
): readonly EstagioOportunidade[] {
  const normalized = normalizeStageRuleInput(currentStage);
  if (!normalized) return [];
  return OPORTUNIDADE_STAGE_TRANSITIONS[normalized] || [];
}

export function isOportunidadeStageTransitionAllowed(
  currentStage?: EstagioOportunidade | string | null,
  nextStage?: EstagioOportunidade | string | null,
): boolean {
  const current = normalizeStageRuleInput(currentStage);
  const next = normalizeStageRuleInput(nextStage);
  if (!current || !next) return false;
  if (current === next) return true;
  return getAllowedNextOportunidadeStages(current).includes(next);
}

export function getAllowedNextOportunidadeLifecycleStatuses(
  currentLifecycleStatus?: LifecycleStatusOportunidade | string | null,
): readonly LifecycleStatusOportunidade[] {
  const normalized = normalizeLifecycleRuleInput(currentLifecycleStatus);
  if (!normalized) return [];
  return OPORTUNIDADE_LIFECYCLE_TRANSITIONS[normalized] || [];
}

export function isOportunidadeLifecycleTransitionAllowed(
  currentLifecycleStatus?: LifecycleStatusOportunidade | string | null,
  nextLifecycleStatus?: LifecycleStatusOportunidade | string | null,
): boolean {
  const current = normalizeLifecycleRuleInput(currentLifecycleStatus);
  const next = normalizeLifecycleRuleInput(nextLifecycleStatus);
  if (!current || !next) return false;
  if (current === next) return true;
  return getAllowedNextOportunidadeLifecycleStatuses(current).includes(next);
}

export function normalizeStaleThresholdDays(
  value: unknown,
  fallback = STALE_DEFAULT_THRESHOLD_DAYS,
): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return Math.min(Math.max(Math.floor(fallback), STALE_MIN_DAYS), STALE_MAX_DAYS);
  }

  return Math.min(Math.max(Math.floor(numeric), STALE_MIN_DAYS), STALE_MAX_DAYS);
}

export function calculateStaleDays(
  lastInteractionAt?: Date | string | null,
  referenceDate: Date = new Date(),
): number {
  if (!lastInteractionAt) {
    return 0;
  }

  const resolved =
    lastInteractionAt instanceof Date ? lastInteractionAt : new Date(lastInteractionAt);
  if (Number.isNaN(resolved.getTime())) {
    return 0;
  }

  const diffMs = referenceDate.getTime() - resolved.getTime();
  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function isOportunidadeStale(
  lastInteractionAt: Date | string | null | undefined,
  thresholdDays: number,
  referenceDate: Date = new Date(),
): boolean {
  const safeThreshold = normalizeStaleThresholdDays(thresholdDays);
  return calculateStaleDays(lastInteractionAt, referenceDate) >= safeThreshold;
}

type OportunidadeActivitiesRange = {
  start: Date;
  end: Date;
};

type OportunidadeAtividadeResumo = {
  range: {
    periodStart: string;
    periodEnd: string;
  };
  totalAtividades: number;
  porTipo: Array<{
    tipo: TipoAtividade;
    quantidade: number;
  }>;
  porVendedor: Array<{
    vendedorId: string;
    nome: string;
    avatarUrl?: string | null;
    quantidade: number;
    oportunidadesAtivas: number;
    ultimaAtividadeEm: string | null;
  }>;
  recentes: Array<{
    id: number;
    tipo: TipoAtividade;
    descricao: string;
    dataAtividade: string | null;
    oportunidadeId: number;
    oportunidadeTitulo?: string;
    vendedor?: {
      id: string;
      nome: string;
      avatarUrl?: string | null;
    };
  }>;
};

type OportunidadeHistoricoEstagioItem = {
  id: string;
  fromStage: EstagioOportunidade | null;
  toStage: EstagioOportunidade;
  changedAt: string;
  source: string;
  changedBy?: {
    id: string;
    nome: string;
    avatarUrl?: string | null;
  };
};

type TableColumnMetadata = {
  columnName: string;
  dataType: string;
  udtName: string;
};

type OportunidadeLifecycleFilters = {
  lifecycle_status?: LifecycleStatusOportunidade;
  lifecycle_view?: LifecycleViewOportunidade;
  include_deleted?: boolean | string;
};

type OportunidadeFindFilters = {
  id?: string;
  estagio?: EstagioOportunidade;
  responsavel_id?: string;
  cliente_id?: string;
  dataInicio?: string;
  dataFim?: string;
} & OportunidadeLifecycleFilters;

@Injectable()
export class OportunidadesService {
  private readonly logger = new Logger(OportunidadesService.name);
  private tableColumnsCache = new Map<string, Set<string>>();
  private tableColumnMetadataCache = new Map<string, Map<string, TableColumnMetadata>>();
  private enumValuesCache = new Map<string, Set<string>>();
  private stageEventsTableAvailable?: boolean;
  private featureFlagsTableAvailable?: boolean;

  private readonly canonicalStageOrder: EstagioOportunidade[] = [
    EstagioOportunidade.LEADS,
    EstagioOportunidade.QUALIFICACAO,
    EstagioOportunidade.PROPOSTA,
    EstagioOportunidade.NEGOCIACAO,
    EstagioOportunidade.FECHAMENTO,
    EstagioOportunidade.GANHO,
    EstagioOportunidade.PERDIDO,
  ];

  private isTerminalStage(stage?: EstagioOportunidade | string): boolean {
    return isOportunidadeTerminalStage(stage);
  }

  constructor(
    @InjectRepository(Oportunidade)
    private oportunidadeRepository: Repository<Oportunidade>,
    @InjectRepository(Atividade)
    private atividadeRepository: Repository<Atividade>,
    @InjectRepository(OportunidadeStageEvent)
    private stageEventRepository: Repository<OportunidadeStageEvent>,
    @InjectRepository(FeatureFlagTenant)
    private readonly featureFlagRepository: Repository<FeatureFlagTenant>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @Optional()
    private readonly dashboardV2JobsService?: DashboardV2JobsService,
  ) {}

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private parseSimpleArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [];
  }

  private parseBooleanFlag(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'sim';
    }

    return false;
  }

  private parseDateInput(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const localDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (localDateMatch) {
      const year = Number(localDateMatch[1]);
      const month = Number(localDateMatch[2]);
      const day = Number(localDateMatch[3]);
      const parsed = new Date(year, month - 1, day);

      if (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day
      ) {
        return parsed;
      }

      return null;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private normalizeText(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeEmail(value?: string | null): string | undefined {
    const normalized = this.normalizeText(value);
    return normalized ? normalized.toLowerCase() : undefined;
  }

  private normalizePhoneDigits(value?: string | null): string | undefined {
    const normalized = this.normalizeText(value);
    if (!normalized) {
      return undefined;
    }

    const digits = normalized.replace(/\D/g, '');
    return digits.length > 0 ? digits : undefined;
  }

  private parseCustomFields(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return { ...(value as Record<string, unknown>) };
  }

  private mapOpportunityOriginToLeadOrigin(
    origem?: OrigemOportunidade | string | null,
  ): OrigemLead {
    switch ((origem || '').toString().trim().toLowerCase()) {
      case OrigemOportunidade.WEBSITE:
        return OrigemLead.FORMULARIO;
      case OrigemOportunidade.CAMPANHA:
        return OrigemLead.IMPORTACAO;
      case OrigemOportunidade.REDES_SOCIAIS:
        return OrigemLead.WHATSAPP;
      case OrigemOportunidade.INDICACAO:
      case OrigemOportunidade.PARCEIRO:
        return OrigemLead.INDICACAO;
      case OrigemOportunidade.TELEFONE:
      case OrigemOportunidade.EMAIL:
        return OrigemLead.MANUAL;
      case OrigemOportunidade.EVENTO:
        return OrigemLead.OUTRO;
      default:
        return OrigemLead.MANUAL;
    }
  }

  private mapOpportunityStageToLeadStatus(
    estagio?: EstagioOportunidade | string | null,
  ): StatusLead {
    const normalized = normalizeStageRuleInput(estagio);

    switch (normalized) {
      case EstagioOportunidade.LEADS:
        return StatusLead.NOVO;
      case EstagioOportunidade.QUALIFICACAO:
        return StatusLead.QUALIFICADO;
      case EstagioOportunidade.PROPOSTA:
      case EstagioOportunidade.NEGOCIACAO:
      case EstagioOportunidade.FECHAMENTO:
      case EstagioOportunidade.GANHO:
        return StatusLead.CONVERTIDO;
      case EstagioOportunidade.PERDIDO:
        return StatusLead.DESQUALIFICADO;
      default:
        return StatusLead.NOVO;
    }
  }

  private calculateLeadScore(input: {
    email?: string;
    telefone?: string;
    empresa_nome?: string;
    observacoes?: string;
    status?: StatusLead;
  }): number {
    let score = 0;

    if (input.email) score += 25;
    if (input.telefone) score += 25;
    if (input.empresa_nome) score += 20;
    if (input.observacoes && input.observacoes.length > 10) score += 15;
    if (input.status === StatusLead.CONTATADO) score += 15;

    return Math.min(score, 100);
  }

  private buildLeadSnapshotFromOpportunity(oportunidade: Oportunidade): {
    oportunidadeId: string;
    nome: string;
    email?: string;
    telefone?: string;
    empresa_nome?: string;
    observacoes?: string;
    responsavel_id?: string;
    origem: OrigemLead;
    status: StatusLead;
  } | null {
    const oportunidadeId = String(oportunidade.id);
    const nome =
      this.normalizeText(oportunidade.nomeContato) ||
      this.normalizeText(oportunidade.cliente?.nome) ||
      this.normalizeText(oportunidade.empresaContato) ||
      this.normalizeText(oportunidade.titulo);

    if (!nome) {
      return null;
    }

    const email =
      this.normalizeEmail(oportunidade.emailContato) ||
      this.normalizeEmail(oportunidade.cliente?.email);
    const telefone =
      this.normalizeText(oportunidade.telefoneContato) ||
      this.normalizeText(oportunidade.cliente?.telefone);
    const empresa_nome =
      this.normalizeText(oportunidade.empresaContato) ||
      this.normalizeText(oportunidade.cliente?.nome);
    const observacoes = this.normalizeText(oportunidade.descricao);
    const responsavel_id =
      this.normalizeText((oportunidade as any).responsavel_id) ||
      this.normalizeText(oportunidade.responsavel?.id);

    return {
      oportunidadeId,
      nome,
      email,
      telefone,
      empresa_nome,
      observacoes,
      responsavel_id,
      origem: this.mapOpportunityOriginToLeadOrigin(oportunidade.origem),
      status: this.mapOpportunityStageToLeadStatus(oportunidade.estagio),
    };
  }

  private isPipelineMirroredLead(lead: Lead, oportunidadeId: string): boolean {
    const customFields = this.parseCustomFields(lead.campos_customizados);
    const customOpportunityId = customFields.pipeline_oportunidade_id;

    return (
      customFields.pipeline_sync === true ||
      (typeof customOpportunityId === 'string' && customOpportunityId === oportunidadeId)
    );
  }

  private async findLeadCandidateForOpportunity(
    empresaId: string,
    snapshot: {
      oportunidadeId: string;
      nome: string;
      email?: string;
      telefone?: string;
    },
  ): Promise<Lead | null> {
    const byLinkedOpportunity = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.empresa_id = :empresaId', { empresaId })
      .andWhere('lead.oportunidade_id = :oportunidadeId', {
        oportunidadeId: snapshot.oportunidadeId,
      })
      .orderBy('lead.updated_at', 'DESC')
      .getOne();

    if (byLinkedOpportunity) {
      return byLinkedOpportunity;
    }

    if (snapshot.email) {
      const byEmail = await this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.empresa_id = :empresaId', { empresaId })
        .andWhere('LOWER(COALESCE(lead.email, \'\')) = :email', { email: snapshot.email })
        .andWhere('(lead.oportunidade_id IS NULL OR lead.oportunidade_id = :oportunidadeId)', {
          oportunidadeId: snapshot.oportunidadeId,
        })
        .orderBy('lead.updated_at', 'DESC')
        .getOne();

      if (byEmail) {
        return byEmail;
      }
    }

    const phoneDigits = this.normalizePhoneDigits(snapshot.telefone);
    if (phoneDigits) {
      return this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.empresa_id = :empresaId', { empresaId })
        .andWhere(
          "regexp_replace(COALESCE(lead.telefone, ''), '[^0-9]', '', 'g') = :phoneDigits",
          { phoneDigits },
        )
        .andWhere('LOWER(COALESCE(lead.nome, \'\')) = :nome', {
          nome: snapshot.nome.toLowerCase(),
        })
        .andWhere('(lead.oportunidade_id IS NULL OR lead.oportunidade_id = :oportunidadeId)', {
          oportunidadeId: snapshot.oportunidadeId,
        })
        .orderBy('lead.updated_at', 'DESC')
        .getOne();
    }

    return null;
  }

  private async syncLeadMirrorFromOpportunity(
    oportunidade: Oportunidade,
    empresaId: string,
    source: 'create' | 'update' | 'update_estagio' | 'reopen',
  ): Promise<void> {
    try {
      const leadsColumns = await this.getTableColumns('leads');
      if (leadsColumns.size === 0) {
        return;
      }

      const snapshot = this.buildLeadSnapshotFromOpportunity(oportunidade);
      if (!snapshot) {
        return;
      }

      const existingLead = await this.findLeadCandidateForOpportunity(empresaId, snapshot);
      const nowIso = new Date().toISOString();

      if (!existingLead) {
        const newLead = this.leadRepository.create({
          empresaId,
          nome: snapshot.nome,
          email: snapshot.email,
          telefone: snapshot.telefone,
          empresa_nome: snapshot.empresa_nome,
          status: snapshot.status,
          origem: snapshot.origem,
          observacoes: snapshot.observacoes,
          responsavel_id: snapshot.responsavel_id,
          oportunidade_id: snapshot.oportunidadeId,
          convertido_em:
            snapshot.status === StatusLead.CONVERTIDO ? new Date() : null,
          campos_customizados: {
            pipeline_sync: true,
            pipeline_oportunidade_id: snapshot.oportunidadeId,
            pipeline_sync_source: source,
            pipeline_sync_at: nowIso,
          },
          score: this.calculateLeadScore({
            email: snapshot.email,
            telefone: snapshot.telefone,
            empresa_nome: snapshot.empresa_nome,
            observacoes: snapshot.observacoes,
            status: snapshot.status,
          }),
        });

        await this.leadRepository.save(newLead);
        return;
      }

      const isPipelineMirror = this.isPipelineMirroredLead(
        existingLead,
        snapshot.oportunidadeId,
      );
      const customFields = this.parseCustomFields(existingLead.campos_customizados);
      const nextStatus =
        existingLead.status === StatusLead.CONVERTIDO && !isPipelineMirror
          ? StatusLead.CONVERTIDO
          : snapshot.status;

      existingLead.nome = snapshot.nome;

      if (snapshot.email) {
        existingLead.email = snapshot.email;
      }
      if (snapshot.telefone) {
        existingLead.telefone = snapshot.telefone;
      }
      if (snapshot.empresa_nome) {
        existingLead.empresa_nome = snapshot.empresa_nome;
      }
      if (snapshot.responsavel_id) {
        existingLead.responsavel_id = snapshot.responsavel_id;
      }

      existingLead.status = nextStatus;
      existingLead.origem = snapshot.origem;
      if (!existingLead.oportunidade_id) {
        existingLead.oportunidade_id = snapshot.oportunidadeId;
      }
      if (!existingLead.observacoes && snapshot.observacoes) {
        existingLead.observacoes = snapshot.observacoes;
      }
      if (nextStatus === StatusLead.CONVERTIDO && !existingLead.convertido_em) {
        existingLead.convertido_em = new Date();
      }

      existingLead.campos_customizados = {
        ...customFields,
        pipeline_sync: true,
        pipeline_oportunidade_id: snapshot.oportunidadeId,
        pipeline_sync_source: source,
        pipeline_sync_at: nowIso,
      };

      existingLead.score = this.calculateLeadScore({
        email: this.normalizeEmail(existingLead.email),
        telefone: this.normalizeText(existingLead.telefone),
        empresa_nome: this.normalizeText(existingLead.empresa_nome),
        observacoes: this.normalizeText(existingLead.observacoes),
        status: existingLead.status,
      });

      await this.leadRepository.save(existingLead);
    } catch (error: any) {
      this.logger.warn(
        `Falha ao sincronizar Lead da oportunidade ${oportunidade.id}: ${error?.message || error}`,
      );
    }
  }

  private parseDateValue(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const resolved = value instanceof Date ? value : new Date(value as any);
    return Number.isNaN(resolved.getTime()) ? null : resolved;
  }

  private getMostRecentDate(values: Array<Date | null | undefined>): Date | null {
    let latest: Date | null = null;

    for (const value of values) {
      if (!value) {
        continue;
      }

      if (!latest || value.getTime() > latest.getTime()) {
        latest = value;
      }
    }

    return latest;
  }

  private resolveActivitiesRange(periodStart?: string, periodEnd?: string): OportunidadeActivitiesRange {
    const defaultEnd = new Date();
    defaultEnd.setHours(23, 59, 59, 999);

    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultStart.getDate() - 29);
    defaultStart.setHours(0, 0, 0, 0);

    const parsedStart = this.parseDateInput(periodStart);
    const parsedEnd = this.parseDateInput(periodEnd);

    let start = parsedStart ? new Date(parsedStart) : defaultStart;
    let end = parsedEnd ? new Date(parsedEnd) : defaultEnd;

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start.getTime() > end.getTime()) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    return { start, end };
  }

  private toIsoStringOrNull(value: unknown): string | null {
    if (!value) {
      return null;
    }

    const parsed = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  }

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    if (this.tableColumnsCache.has(tableName)) {
      return this.tableColumnsCache.get(tableName)!;
    }

    const rows = await this.oportunidadeRepository.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
      `,
      [tableName],
    );

    const columns = new Set<string>(
      rows
        .map((row: { column_name?: string }) => row.column_name)
        .filter((columnName: string | undefined): columnName is string => !!columnName),
    );

    this.tableColumnsCache.set(tableName, columns);
    return columns;
  }

  private async getTableColumnMetadata(
    tableName: string,
    columnName: string,
  ): Promise<TableColumnMetadata | null> {
    if (!this.tableColumnMetadataCache.has(tableName)) {
      const rows = await this.oportunidadeRepository.query(
        `
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
        `,
        [tableName],
      );

      const metadataMap = new Map<string, TableColumnMetadata>();
      rows.forEach((row: { column_name?: string; data_type?: string; udt_name?: string }) => {
        const currentColumn = row.column_name?.toString();
        if (!currentColumn) return;
        metadataMap.set(currentColumn, {
          columnName: currentColumn,
          dataType: (row.data_type || '').toString(),
          udtName: (row.udt_name || '').toString(),
        });
      });

      this.tableColumnMetadataCache.set(tableName, metadataMap);
    }

    return this.tableColumnMetadataCache.get(tableName)?.get(columnName) ?? null;
  }

  private async getEnumValues(enumTypeName: string): Promise<Set<string>> {
    if (this.enumValuesCache.has(enumTypeName)) {
      return this.enumValuesCache.get(enumTypeName)!;
    }

    const rows = await this.oportunidadeRepository.query(
      `
        SELECT e.enumlabel
        FROM pg_type t
        INNER JOIN pg_namespace n ON n.oid = t.typnamespace
        INNER JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE n.nspname = 'public'
          AND t.typname = $1
        ORDER BY e.enumsortorder
      `,
      [enumTypeName],
    );

    const values = new Set<string>(
      rows
        .map((row: { enumlabel?: string }) => row.enumlabel?.toString().toLowerCase())
        .filter((value: string | undefined): value is string => Boolean(value)),
    );

    this.enumValuesCache.set(enumTypeName, values);
    return values;
  }

  private async resolveDatabaseEstagioMode(columns: Set<string>): Promise<'legacy' | 'modern'> {
    if (!columns.has('estagio')) {
      return columns.has('responsavel_id') && !columns.has('usuario_id') ? 'modern' : 'legacy';
    }

    const estagioMetadata = await this.getTableColumnMetadata('oportunidades', 'estagio');
    const isUserDefined =
      estagioMetadata?.dataType?.toLowerCase() === 'user-defined' &&
      Boolean(estagioMetadata?.udtName);

    if (isUserDefined) {
      const enumValues = await this.getEnumValues(estagioMetadata!.udtName);
      const hasModernValues = Array.from(MODERN_DB_STAGE_VALUES).some((value) =>
        enumValues.has(value),
      );
      if (hasModernValues) {
        return 'modern';
      }

      const hasLegacyValues = Array.from(LEGACY_DB_STAGE_VALUES).some((value) =>
        enumValues.has(value),
      );
      return hasLegacyValues ? 'legacy' : 'modern';
    }

    return columns.has('responsavel_id') && !columns.has('usuario_id') ? 'modern' : 'legacy';
  }

  private async resolveOportunidadesSchema() {
    const columns = await this.getTableColumns('oportunidades');

    const responsavelColumn = columns.has('responsavel_id')
      ? 'responsavel_id'
      : columns.has('usuario_id')
        ? 'usuario_id'
        : 'responsavel_id';
    const responsavelMirrorColumn =
      responsavelColumn === 'responsavel_id' && columns.has('usuario_id')
        ? 'usuario_id'
        : responsavelColumn === 'usuario_id' && columns.has('responsavel_id')
          ? 'responsavel_id'
          : null;
    const dataFechamentoEsperadoColumn = columns.has('data_fechamento_prevista')
      ? 'data_fechamento_prevista'
      : columns.has('dataFechamentoEsperado')
        ? 'dataFechamentoEsperado'
        : null;
    const dataFechamentoRealColumn = columns.has('data_fechamento_real')
      ? 'data_fechamento_real'
      : columns.has('dataFechamentoReal')
        ? 'dataFechamentoReal'
        : null;
    const createdAtColumn = columns.has('createdAt') ? 'createdAt' : 'criado_em';
    const updatedAtColumn = columns.has('updatedAt') ? 'updatedAt' : 'atualizado_em';
    const lifecycleStatusColumn = columns.has('lifecycle_status')
      ? 'lifecycle_status'
      : columns.has('lifecycleStatus')
        ? 'lifecycleStatus'
        : null;
    const archivedAtColumn = columns.has('archived_at')
      ? 'archived_at'
      : columns.has('archivedAt')
        ? 'archivedAt'
        : null;
    const archivedByColumn = columns.has('archived_by')
      ? 'archived_by'
      : columns.has('archivedBy')
        ? 'archivedBy'
        : null;
    const deletedAtColumn = columns.has('deleted_at')
      ? 'deleted_at'
      : columns.has('deletedAt')
        ? 'deletedAt'
        : null;
    const deletedByColumn = columns.has('deleted_by')
      ? 'deleted_by'
      : columns.has('deletedBy')
        ? 'deletedBy'
        : null;
    const reopenedAtColumn = columns.has('reopened_at')
      ? 'reopened_at'
      : columns.has('reopenedAt')
        ? 'reopenedAt'
        : null;
    const reopenedByColumn = columns.has('reopened_by')
      ? 'reopened_by'
      : columns.has('reopenedBy')
        ? 'reopenedBy'
        : null;
    const estagioMode = await this.resolveDatabaseEstagioMode(columns);

    return {
      columns,
      responsavelColumn,
      responsavelMirrorColumn,
      dataFechamentoEsperadoColumn,
      dataFechamentoRealColumn,
      createdAtColumn,
      updatedAtColumn,
      lifecycleStatusColumn,
      archivedAtColumn,
      archivedByColumn,
      deletedAtColumn,
      deletedByColumn,
      reopenedAtColumn,
      reopenedByColumn,
      estagioMode,
    };
  }

  private async resolveAtividadesSchema() {
    const columns = await this.getTableColumns('atividades');

    return {
      columns,
      userColumn: columns.has('usuario_id') ? 'usuario_id' : 'criado_por_id',
      dateColumn: columns.has('data') ? 'data' : 'dataAtividade',
      createdAtColumn: columns.has('criado_em') ? 'criado_em' : 'createdAt',
      titleColumn: columns.has('titulo') ? 'titulo' : null,
    };
  }

  private toDatabaseEstagio(
    estagio?: EstagioOportunidade | string,
    mode: 'legacy' | 'modern' = 'legacy',
  ): EstagioOportunidade {
    const normalized = (estagio || '').toString().toLowerCase();
    if (mode === 'modern') {
      switch (normalized) {
        case 'lead':
        case 'leads':
          return EstagioOportunidade.LEADS;
        case 'qualificado':
        case 'qualificacao':
        case 'qualification':
          return EstagioOportunidade.QUALIFICACAO;
        case 'proposta':
        case 'proposal':
          return EstagioOportunidade.PROPOSTA;
        case 'negociacao':
        case 'negotiation':
          return EstagioOportunidade.NEGOCIACAO;
        case 'closing':
        case 'fechamento':
          return EstagioOportunidade.FECHAMENTO;
        case 'ganho':
        case 'won':
          return EstagioOportunidade.GANHO;
        case 'perdido':
        case 'lost':
          return EstagioOportunidade.PERDIDO;
        default:
          return EstagioOportunidade.LEADS;
      }
    }

    switch (normalized) {
      case 'lead':
      case 'leads':
        return 'lead' as unknown as EstagioOportunidade;
      case 'qualificado':
      case 'qualificacao':
      case 'qualification':
        return 'qualificado' as unknown as EstagioOportunidade;
      case 'proposta':
      case 'proposal':
        return 'proposta' as unknown as EstagioOportunidade;
      case 'negociacao':
      case 'negotiation':
      case 'closing':
      case 'fechamento':
        return 'negociacao' as unknown as EstagioOportunidade;
      case 'ganho':
      case 'won':
        return 'ganho' as unknown as EstagioOportunidade;
      case 'perdido':
      case 'lost':
        return 'perdido' as unknown as EstagioOportunidade;
      default:
        return 'lead' as unknown as EstagioOportunidade;
    }
  }

  private fromDatabaseEstagio(estagio?: string | EstagioOportunidade): EstagioOportunidade {
    const normalized = (estagio || '').toString().toLowerCase();
    switch (normalized) {
      case EstagioOportunidade.LEADS:
      case 'lead':
        return EstagioOportunidade.LEADS;
      case EstagioOportunidade.QUALIFICACAO:
      case 'qualificado':
      case 'qualificacao':
        return EstagioOportunidade.QUALIFICACAO;
      case EstagioOportunidade.PROPOSTA:
      case 'proposta':
        return EstagioOportunidade.PROPOSTA;
      case EstagioOportunidade.NEGOCIACAO:
      case 'negociacao':
        return EstagioOportunidade.NEGOCIACAO;
      case EstagioOportunidade.FECHAMENTO:
      case 'closing':
      case 'fechamento':
        return EstagioOportunidade.FECHAMENTO;
      case EstagioOportunidade.GANHO:
      case 'ganho':
        return EstagioOportunidade.GANHO;
      case EstagioOportunidade.PERDIDO:
      case 'perdido':
        return EstagioOportunidade.PERDIDO;
      default:
        return EstagioOportunidade.LEADS;
    }
  }

  private resolveLifecycleFromStage(
    estagio?: EstagioOportunidade | string | null,
  ): LifecycleStatusOportunidade {
    const normalizedStage = this.fromDatabaseEstagio(estagio || undefined);

    if (normalizedStage === EstagioOportunidade.GANHO) {
      return LifecycleStatusOportunidade.WON;
    }

    if (normalizedStage === EstagioOportunidade.PERDIDO) {
      return LifecycleStatusOportunidade.LOST;
    }

    return LifecycleStatusOportunidade.OPEN;
  }

  private fromDatabaseLifecycleStatus(
    lifecycleStatus?: LifecycleStatusOportunidade | string | null,
    estagioFallback?: EstagioOportunidade | string | null,
  ): LifecycleStatusOportunidade {
    const normalized = normalizeLifecycleRuleInput(lifecycleStatus);
    if (normalized) {
      return normalized;
    }

    return this.resolveLifecycleFromStage(estagioFallback);
  }

  private getLifecycleStatusesByView(
    lifecycleView?: LifecycleViewOportunidade | string | null,
  ): LifecycleStatusOportunidade[] | null {
    const normalized = (lifecycleView || '').toString().trim().toLowerCase();
    switch (normalized) {
      case LifecycleViewOportunidade.OPEN:
        return [LifecycleStatusOportunidade.OPEN];
      case LifecycleViewOportunidade.CLOSED:
        return [LifecycleStatusOportunidade.WON, LifecycleStatusOportunidade.LOST];
      case LifecycleViewOportunidade.ARCHIVED:
        return [LifecycleStatusOportunidade.ARCHIVED];
      case LifecycleViewOportunidade.DELETED:
        return [LifecycleStatusOportunidade.DELETED];
      case LifecycleViewOportunidade.ALL_ACTIVE:
        return [
          LifecycleStatusOportunidade.OPEN,
          LifecycleStatusOportunidade.WON,
          LifecycleStatusOportunidade.LOST,
          LifecycleStatusOportunidade.ARCHIVED,
        ];
      case LifecycleViewOportunidade.ALL:
        return [
          LifecycleStatusOportunidade.OPEN,
          LifecycleStatusOportunidade.WON,
          LifecycleStatusOportunidade.LOST,
          LifecycleStatusOportunidade.ARCHIVED,
          LifecycleStatusOportunidade.DELETED,
        ];
      default:
        return null;
    }
  }

  private resolveLifecycleStatusFilterValues(
    filters?: OportunidadeLifecycleFilters,
  ): LifecycleStatusOportunidade[] {
    const normalizedStatus = normalizeLifecycleRuleInput(filters?.lifecycle_status);
    if (normalizedStatus) {
      return [normalizedStatus];
    }

    const byView = this.getLifecycleStatusesByView(filters?.lifecycle_view);
    if (byView?.length) {
      return byView;
    }

    if (this.parseBooleanFlag(filters?.include_deleted)) {
      return [
        LifecycleStatusOportunidade.OPEN,
        LifecycleStatusOportunidade.WON,
        LifecycleStatusOportunidade.LOST,
        LifecycleStatusOportunidade.ARCHIVED,
        LifecycleStatusOportunidade.DELETED,
      ];
    }

    return [
      LifecycleStatusOportunidade.OPEN,
      LifecycleStatusOportunidade.WON,
      LifecycleStatusOportunidade.LOST,
      LifecycleStatusOportunidade.ARCHIVED,
    ];
  }

  private buildLifecycleFromStageExpression(estagioExpression: string): string {
    return `
      CASE lower(coalesce(${estagioExpression}::text, ''))
        WHEN 'ganho' THEN 'won'
        WHEN 'won' THEN 'won'
        WHEN 'perdido' THEN 'lost'
        WHEN 'lost' THEN 'lost'
        ELSE 'open'
      END
    `;
  }

  private getBucketByTenantId(empresaId: string): number {
    const digest = createHash('md5').update(empresaId).digest('hex');
    const intValue = Number.parseInt(digest.slice(0, 8), 16);
    return intValue % 100;
  }

  private async isFeatureFlagsTableAvailable(): Promise<boolean> {
    if (this.featureFlagsTableAvailable !== undefined) {
      return this.featureFlagsTableAvailable;
    }

    const columns = await this.getTableColumns('feature_flags_tenant');
    this.featureFlagsTableAvailable =
      columns.has('empresa_id') &&
      columns.has('flag_key') &&
      columns.has('enabled') &&
      columns.has('rollout_percentage');

    return this.featureFlagsTableAvailable;
  }

  private async resolveLifecycleFeatureFlagDecision(
    empresaId: string,
  ): Promise<LifecycleFlagDecision> {
    if (!(await this.isFeatureFlagsTableAvailable())) {
      return {
        enabled: false,
        source: 'disabled',
        rolloutPercentage: 0,
      };
    }

    try {
      const flag = await this.featureFlagRepository.findOne({
        where: {
          empresa_id: empresaId,
          flag_key: OPORTUNIDADES_LIFECYCLE_FLAG_KEY,
        },
      });

      if (!flag) {
        return {
          enabled: false,
          source: 'disabled',
          rolloutPercentage: 0,
        };
      }

      if (flag.enabled) {
        return {
          enabled: true,
          source: 'enabled',
          rolloutPercentage: Number(flag.rollout_percentage || 0),
        };
      }

      const rolloutPercentage = Math.max(0, Math.min(100, Number(flag.rollout_percentage || 0)));
      if (rolloutPercentage <= 0) {
        return {
          enabled: false,
          source: 'disabled',
          rolloutPercentage,
        };
      }

      const enabled = this.getBucketByTenantId(empresaId) < rolloutPercentage;
      return {
        enabled,
        source: enabled ? 'rollout' : 'disabled',
        rolloutPercentage,
      };
    } catch (error: any) {
      this.logger.warn(
        `Falha ao resolver feature flag ${OPORTUNIDADES_LIFECYCLE_FLAG_KEY}: ${error?.message || error}`,
      );

      return {
        enabled: false,
        source: 'disabled',
        rolloutPercentage: 0,
      };
    }
  }

  private async isLifecycleEnabledForTenant(params: {
    empresaId: string;
    schema: Awaited<ReturnType<OportunidadesService['resolveOportunidadesSchema']>>;
  }): Promise<boolean> {
    if (!params.schema.lifecycleStatusColumn) {
      return false;
    }

    const featureFlag = await this.resolveLifecycleFeatureFlagDecision(params.empresaId);
    return featureFlag.enabled;
  }

  private normalizeOportunidade(oportunidade: Oportunidade): Oportunidade {
    oportunidade.estagio = this.fromDatabaseEstagio(oportunidade.estagio);
    return oportunidade;
  }

  private getEstagioFilterValues(estagio: EstagioOportunidade): string[] {
    switch (estagio) {
      case EstagioOportunidade.LEADS:
        return ['lead', 'leads'];
      case EstagioOportunidade.QUALIFICACAO:
        return ['qualificado', 'qualificacao', 'qualification'];
      case EstagioOportunidade.PROPOSTA:
        return ['proposta', 'proposal'];
      case EstagioOportunidade.NEGOCIACAO:
      case EstagioOportunidade.FECHAMENTO:
        return ['negociacao', 'negotiation', 'closing', 'fechamento'];
      case EstagioOportunidade.GANHO:
        return ['ganho', 'won'];
      case EstagioOportunidade.PERDIDO:
        return ['perdido', 'lost'];
      default:
        return ['lead', 'leads'];
    }
  }

  private normalizeStageForEvent(stage?: EstagioOportunidade | string | null): string | null {
    const normalized = (stage || '').toString().trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    switch (normalized) {
      case 'lead':
      case 'leads':
        return EstagioOportunidade.LEADS;
      case 'qualificado':
      case 'qualificacao':
      case 'qualification':
        return EstagioOportunidade.QUALIFICACAO;
      case 'proposta':
      case 'proposal':
        return EstagioOportunidade.PROPOSTA;
      case 'negociacao':
      case 'negotiation':
        return EstagioOportunidade.NEGOCIACAO;
      case 'fechamento':
      case 'closing':
        return EstagioOportunidade.FECHAMENTO;
      case 'ganho':
      case 'won':
        return EstagioOportunidade.GANHO;
      case 'perdido':
      case 'lost':
        return EstagioOportunidade.PERDIDO;
      default:
        return normalized;
    }
  }

  private async isStageEventsTableAvailable(): Promise<boolean> {
    if (this.stageEventsTableAvailable !== undefined) {
      return this.stageEventsTableAvailable;
    }

    const columns = await this.getTableColumns('oportunidade_stage_events');
    this.stageEventsTableAvailable =
      columns.has('empresa_id') &&
      columns.has('oportunidade_id') &&
      columns.has('to_stage') &&
      columns.has('changed_at') &&
      columns.has('source');

    if (!this.stageEventsTableAvailable) {
      this.logger.warn(
        'Tabela "oportunidade_stage_events" indisponivel. Dual-write de estagio permanece em modo degradado.',
      );
    }

    return this.stageEventsTableAvailable;
  }

  private async createStageEvent(params: {
    empresaId: string;
    oportunidadeId: string | number;
    fromStage?: EstagioOportunidade | string | null;
    toStage?: EstagioOportunidade | string | null;
    changedBy?: string | null;
    changedAt?: Date;
    source: string;
  }): Promise<void> {
    if (!(await this.isStageEventsTableAvailable())) {
      return;
    }

    const oportunidadeId = params.oportunidadeId?.toString().trim();
    if (!oportunidadeId) {
      this.logger.warn(
        `Nao foi possivel registrar stage event: oportunidade_id invalido (${params.oportunidadeId}).`,
      );
      return;
    }

    const toStage = this.normalizeStageForEvent(params.toStage);
    if (!toStage) {
      return;
    }

    const fromStage = this.normalizeStageForEvent(params.fromStage);
    const changedBy =
      params.changedBy && /^[0-9a-fA-F-]{36}$/.test(params.changedBy) ? params.changedBy : null;

    try {
      await this.stageEventRepository.query(
        `
          INSERT INTO "oportunidade_stage_events" (
            "empresa_id",
            "oportunidade_id",
            "from_stage",
            "to_stage",
            "changed_at",
            "changed_by",
            "source"
          ) VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now()), $6, $7)
        `,
        [
          params.empresaId,
          oportunidadeId,
          fromStage,
          toStage,
          params.changedAt ? params.changedAt.toISOString() : null,
          changedBy,
          params.source,
        ],
      );

      await this.dashboardV2JobsService?.enqueueStageEventRecompute({
        empresaId: params.empresaId,
        oportunidadeId,
        changedAt: (params.changedAt || new Date()).toISOString(),
        trigger: params.source,
      });
    } catch (error: any) {
      this.logger.error(
        `Falha ao registrar stage event da oportunidade ${oportunidadeId}: ${error?.message || error}`,
      );
    }
  }

  async create(
    createOportunidadeDto: CreateOportunidadeDto,
    empresaId: string,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });

    if (lifecycleEnabled && this.isTerminalStage(createOportunidadeDto.estagio)) {
      throw new BadRequestException(
        'Nao e permitido criar oportunidade diretamente em estagio terminal (ganho/perdido) com ciclo de vida habilitado.',
      );
    }

    const columns: string[] = [
      'titulo',
      'descricao',
      'valor',
      'probabilidade',
      'estagio',
      'empresa_id',
      schema.responsavelColumn,
      'cliente_id',
    ];
    const values: unknown[] = [
      createOportunidadeDto.titulo,
      createOportunidadeDto.descricao ?? null,
      createOportunidadeDto.valor,
      createOportunidadeDto.probabilidade,
      this.toDatabaseEstagio(createOportunidadeDto.estagio, schema.estagioMode),
      empresaId,
      createOportunidadeDto.responsavel_id,
      createOportunidadeDto.cliente_id ?? null,
    ];

    // Compatibilidade com schemas hibridos que mantem usuario_id e responsavel_id.
    if (schema.responsavelMirrorColumn) {
      columns.push(schema.responsavelMirrorColumn);
      values.push(createOportunidadeDto.responsavel_id);
    }

    if (schema.lifecycleStatusColumn) {
      columns.push(schema.lifecycleStatusColumn);
      values.push(this.resolveLifecycleFromStage(createOportunidadeDto.estagio));
    }

    if (schema.dataFechamentoEsperadoColumn) {
      columns.push(schema.dataFechamentoEsperadoColumn);
      values.push(
        createOportunidadeDto.dataFechamentoEsperado
          ? new Date(createOportunidadeDto.dataFechamentoEsperado)
          : null,
      );
    }

    if (schema.columns.has('prioridade') && createOportunidadeDto.prioridade !== undefined) {
      columns.push('prioridade');
      values.push(createOportunidadeDto.prioridade);
    }

    if (schema.columns.has('origem') && createOportunidadeDto.origem !== undefined) {
      columns.push('origem');
      values.push(createOportunidadeDto.origem);
    }

    if (schema.columns.has('tags') && createOportunidadeDto.tags !== undefined) {
      columns.push('tags');
      values.push(
        createOportunidadeDto.tags.length > 0 ? createOportunidadeDto.tags.join(',') : null,
      );
    }

    if (schema.columns.has('nomeContato')) {
      columns.push('nomeContato');
      values.push(createOportunidadeDto.nomeContato ?? null);
    }
    if (schema.columns.has('emailContato')) {
      columns.push('emailContato');
      values.push(createOportunidadeDto.emailContato ?? null);
    }
    if (schema.columns.has('telefoneContato')) {
      columns.push('telefoneContato');
      values.push(createOportunidadeDto.telefoneContato ?? null);
    }
    if (schema.columns.has('empresaContato')) {
      columns.push('empresaContato');
      values.push(createOportunidadeDto.empresaContato ?? null);
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const rows = await this.oportunidadeRepository.query(
      `
        INSERT INTO "oportunidades" (${columns.map((column) => this.quoteIdentifier(column)).join(', ')})
        VALUES (${placeholders})
        RETURNING "id"
      `,
      values,
    );
    const savedOportunidadeId = rows?.[0]?.id;

    this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao: 'Oportunidade criada',
        oportunidade_id: savedOportunidadeId,
      },
      {
        userId: createOportunidadeDto.responsavel_id,
        empresaId,
      },
    ).catch(() => undefined);

    this.createStageEvent({
      empresaId,
      oportunidadeId: savedOportunidadeId,
      fromStage: null,
      toStage: createOportunidadeDto.estagio,
      changedBy: createOportunidadeDto.responsavel_id,
      source: 'create',
    }).catch(() => undefined);

    const oportunidade = await this.findOne(savedOportunidadeId, empresaId);
    await this.syncLeadMirrorFromOpportunity(oportunidade, empresaId, 'create');
    return oportunidade;
  }

  async findAll(empresaId: string, filters?: OportunidadeFindFilters): Promise<Oportunidade[]> {
    const schema = await this.resolveOportunidadesSchema();
    const usersColumns = await this.getTableColumns('users');
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const responsavelRef = `oportunidade.${this.quoteIdentifier(schema.responsavelColumn)}`;
    const createdAtRef = `oportunidade.${this.quoteIdentifier(schema.createdAtColumn)}`;
    const updatedAtRef = `oportunidade.${this.quoteIdentifier(schema.updatedAtColumn)}`;
    const responsavelAvatarExpr = usersColumns.has('avatar_url')
      ? 'responsavel.avatar_url'
      : 'NULL';
    const dataFechamentoEsperadoExpr = schema.dataFechamentoEsperadoColumn
      ? `oportunidade.${this.quoteIdentifier(schema.dataFechamentoEsperadoColumn)}`
      : 'NULL';
    const dataFechamentoRealExpr = schema.dataFechamentoRealColumn
      ? `oportunidade.${this.quoteIdentifier(schema.dataFechamentoRealColumn)}`
      : 'NULL';
    const prioridadeExpr = schema.columns.has('prioridade')
      ? `oportunidade.${this.quoteIdentifier('prioridade')}`
      : `'medium'`;
    const origemExpr = schema.columns.has('origem')
      ? `oportunidade.${this.quoteIdentifier('origem')}`
      : `'website'`;
    const tagsExpr = schema.columns.has('tags')
      ? `oportunidade.${this.quoteIdentifier('tags')}`
      : 'NULL';
    const nomeContatoExpr = schema.columns.has('nomeContato')
      ? `oportunidade.${this.quoteIdentifier('nomeContato')}`
      : 'NULL';
    const emailContatoExpr = schema.columns.has('emailContato')
      ? `oportunidade.${this.quoteIdentifier('emailContato')}`
      : 'NULL';
    const telefoneContatoExpr = schema.columns.has('telefoneContato')
      ? `oportunidade.${this.quoteIdentifier('telefoneContato')}`
      : 'NULL';
    const empresaContatoExpr = schema.columns.has('empresaContato')
      ? `oportunidade.${this.quoteIdentifier('empresaContato')}`
      : 'NULL';
    const lifecycleStatusExpr = schema.lifecycleStatusColumn
      ? `oportunidade.${this.quoteIdentifier(schema.lifecycleStatusColumn)}`
      : this.buildLifecycleFromStageExpression('oportunidade.estagio');
    const archivedAtExpr = schema.archivedAtColumn
      ? `oportunidade.${this.quoteIdentifier(schema.archivedAtColumn)}`
      : 'NULL';
    const archivedByExpr = schema.archivedByColumn
      ? `oportunidade.${this.quoteIdentifier(schema.archivedByColumn)}`
      : 'NULL';
    const deletedAtExpr = schema.deletedAtColumn
      ? `oportunidade.${this.quoteIdentifier(schema.deletedAtColumn)}`
      : 'NULL';
    const deletedByExpr = schema.deletedByColumn
      ? `oportunidade.${this.quoteIdentifier(schema.deletedByColumn)}`
      : 'NULL';
    const reopenedAtExpr = schema.reopenedAtColumn
      ? `oportunidade.${this.quoteIdentifier(schema.reopenedAtColumn)}`
      : 'NULL';
    const reopenedByExpr = schema.reopenedByColumn
      ? `oportunidade.${this.quoteIdentifier(schema.reopenedByColumn)}`
      : 'NULL';

    const queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .leftJoin('users', 'responsavel', `responsavel.id = ${responsavelRef}`)
      .leftJoin('clientes', 'cliente', 'cliente.id = oportunidade.cliente_id')
      .select('oportunidade.id', 'id')
      .addSelect('oportunidade.empresa_id', 'empresa_id')
      .addSelect('oportunidade.titulo', 'titulo')
      .addSelect('oportunidade.descricao', 'descricao')
      .addSelect('oportunidade.valor', 'valor')
      .addSelect('COALESCE(oportunidade.probabilidade, 0)', 'probabilidade')
      .addSelect('oportunidade.estagio', 'estagio')
      .addSelect(prioridadeExpr, 'prioridade')
      .addSelect(origemExpr, 'origem')
      .addSelect(tagsExpr, 'tags')
      .addSelect(dataFechamentoEsperadoExpr, 'dataFechamentoEsperado')
      .addSelect(dataFechamentoRealExpr, 'dataFechamentoReal')
      .addSelect(responsavelRef, 'responsavel_id')
      .addSelect('oportunidade.cliente_id', 'cliente_id')
      .addSelect(createdAtRef, 'createdAt')
      .addSelect(updatedAtRef, 'updatedAt')
      .addSelect(nomeContatoExpr, 'nomeContato')
      .addSelect(emailContatoExpr, 'emailContato')
      .addSelect(telefoneContatoExpr, 'telefoneContato')
      .addSelect(empresaContatoExpr, 'empresaContato')
      .addSelect(lifecycleStatusExpr, 'lifecycle_status')
      .addSelect(archivedAtExpr, 'archived_at')
      .addSelect(archivedByExpr, 'archived_by')
      .addSelect(deletedAtExpr, 'deleted_at')
      .addSelect(deletedByExpr, 'deleted_by')
      .addSelect(reopenedAtExpr, 'reopened_at')
      .addSelect(reopenedByExpr, 'reopened_by')
      .addSelect('responsavel.id', 'responsavel__id')
      .addSelect('responsavel.nome', 'responsavel__nome')
      .addSelect('responsavel.email', 'responsavel__email')
      .addSelect(responsavelAvatarExpr, 'responsavel__avatar_url')
      .addSelect('cliente.id', 'cliente__id')
      .addSelect('cliente.nome', 'cliente__nome')
      .addSelect('cliente.email', 'cliente__email')
      .addSelect('cliente.telefone', 'cliente__telefone')
      .where('oportunidade.empresa_id = :empresaId', { empresaId })
      .orderBy(updatedAtRef, 'DESC');

    if (filters?.estagio) {
      queryBuilder.andWhere('oportunidade.estagio::text IN (:...estagios)', {
        estagios: this.getEstagioFilterValues(filters.estagio),
      });
    }

    if (filters?.id) {
      queryBuilder.andWhere('oportunidade.id::text = :id', { id: filters.id });
    }

    if (filters?.responsavel_id) {
      queryBuilder.andWhere(`${responsavelRef}::text = :responsavel_id`, {
        responsavel_id: filters.responsavel_id,
      });
    }

    if (filters?.cliente_id) {
      queryBuilder.andWhere('oportunidade.cliente_id = :cliente_id', {
        cliente_id: filters.cliente_id,
      });
    }

    if (filters?.dataInicio && filters?.dataFim) {
      queryBuilder.andWhere(`${createdAtRef} BETWEEN :dataInicio AND :dataFim`, {
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
      });
    }

    if (lifecycleEnabled && schema.lifecycleStatusColumn) {
      const lifecycleStatuses = this.resolveLifecycleStatusFilterValues(filters);
      if (lifecycleStatuses.length > 0) {
        queryBuilder.andWhere(`${lifecycleStatusExpr}::text IN (:...lifecycleStatuses)`, {
          lifecycleStatuses,
        });
      }
    } else if (schema.lifecycleStatusColumn && !this.parseBooleanFlag(filters?.include_deleted)) {
      queryBuilder.andWhere(`${lifecycleStatusExpr}::text <> :deletedLifecycle`, {
        deletedLifecycle: LifecycleStatusOportunidade.DELETED,
      });
    }

    const oportunidades = await queryBuilder.getRawMany();

    return oportunidades.map((item) => ({
      id: item.id,
      empresa_id: item.empresa_id,
      titulo: item.titulo,
      descricao: item.descricao,
      valor: Number(item.valor || 0),
      probabilidade: Number(item.probabilidade || 0),
      estagio: this.fromDatabaseEstagio(item.estagio),
      prioridade: item.prioridade || 'medium',
      origem: item.origem || 'website',
      tags: this.parseSimpleArray(item.tags),
      dataFechamentoEsperado: item.dataFechamentoEsperado ?? null,
      dataFechamentoReal: item.dataFechamentoReal ?? null,
      lifecycle_status: this.fromDatabaseLifecycleStatus(item.lifecycle_status, item.estagio),
      archived_at: item.archived_at ?? null,
      archived_by: item.archived_by ?? null,
      deleted_at: item.deleted_at ?? null,
      deleted_by: item.deleted_by ?? null,
      reopened_at: item.reopened_at ?? null,
      reopened_by: item.reopened_by ?? null,
      responsavel_id: item.responsavel_id?.toString?.() ?? item.responsavel_id,
      cliente_id: item.cliente_id,
      responsavel: item.responsavel__id
        ? {
            id: item.responsavel__id,
            nome: item.responsavel__nome,
            email: item.responsavel__email,
            avatar_url: item.responsavel__avatar_url,
          }
        : undefined,
      cliente: item.cliente__id
        ? {
            id: item.cliente__id,
            nome: item.cliente__nome,
            email: item.cliente__email,
            telefone: item.cliente__telefone,
          }
        : undefined,
      nomeContato: item.nomeContato ?? undefined,
      emailContato: item.emailContato ?? undefined,
      telefoneContato: item.telefoneContato ?? undefined,
      empresaContato: item.empresaContato ?? undefined,
      atividades: [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) as Oportunidade[];
  }

  async findOne(
    id: string,
    empresaId?: string,
    options?: { include_deleted?: boolean },
  ): Promise<Oportunidade> {
    if (!empresaId) {
      throw new NotFoundException('Oportunidade nao encontrada');
    }

    const [oportunidade] = await this.findAll(empresaId, {
      id,
      lifecycle_view: options?.include_deleted
        ? LifecycleViewOportunidade.ALL
        : LifecycleViewOportunidade.ALL_ACTIVE,
      include_deleted: Boolean(options?.include_deleted),
    });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada');
    }

    return oportunidade;
  }

  async update(
    id: string,
    updateOportunidadeDto: UpdateOportunidadeDto,
    empresaId: string,
    actorUserId?: string,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const oportunidade = await this.findOne(id, empresaId);
    const estagioAnterior = oportunidade.estagio;
    const currentLifecycle = this.fromDatabaseLifecycleStatus(
      (oportunidade as any).lifecycle_status,
      oportunidade.estagio,
    );

    if (
      lifecycleEnabled &&
      updateOportunidadeDto.estagio !== undefined &&
      updateOportunidadeDto.estagio !== estagioAnterior
    ) {
      if (currentLifecycle === LifecycleStatusOportunidade.DELETED) {
        throw new BadRequestException(
          'Oportunidade excluida logicamente. Restaure antes de alterar o estagio.',
        );
      }

      if (currentLifecycle === LifecycleStatusOportunidade.ARCHIVED) {
        throw new BadRequestException(
          'Oportunidade arquivada. Restaure antes de alterar o estagio.',
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (updateOportunidadeDto.titulo !== undefined) {
      updateData.titulo = updateOportunidadeDto.titulo;
    }

    if (updateOportunidadeDto.descricao !== undefined) {
      updateData.descricao = updateOportunidadeDto.descricao;
    }

    if (updateOportunidadeDto.valor !== undefined) {
      updateData.valor = updateOportunidadeDto.valor;
    }

    if (updateOportunidadeDto.probabilidade !== undefined) {
      updateData.probabilidade = updateOportunidadeDto.probabilidade;
    }

    if (updateOportunidadeDto.estagio !== undefined) {
      const nextStage = updateOportunidadeDto.estagio;
      if (nextStage !== estagioAnterior) {
        if (!isOportunidadeStageTransitionAllowed(estagioAnterior, nextStage)) {
          const allowed = getAllowedNextOportunidadeStages(estagioAnterior);
          throw new BadRequestException(
            `Transicao de estagio invalida: ${estagioAnterior} -> ${nextStage}. Permitidos: ${allowed.join(', ') || 'nenhum'}`,
          );
        }

        if (nextStage === EstagioOportunidade.PERDIDO) {
          throw new BadRequestException(
            'Para marcar como perdido, use PATCH /oportunidades/:id/estagio com motivoPerda.',
          );
        }
      }

      updateData.estagio = this.toDatabaseEstagio(
        nextStage,
        schema.estagioMode,
      );

      if (schema.lifecycleStatusColumn) {
        if (nextStage === EstagioOportunidade.GANHO) {
          updateData[schema.lifecycleStatusColumn] = LifecycleStatusOportunidade.WON;
        } else if (nextStage === EstagioOportunidade.PERDIDO) {
          updateData[schema.lifecycleStatusColumn] = LifecycleStatusOportunidade.LOST;
        } else {
          updateData[schema.lifecycleStatusColumn] = LifecycleStatusOportunidade.OPEN;
        }
      }
    }

    if (updateOportunidadeDto.responsavel_id !== undefined) {
      updateData[schema.responsavelColumn] = updateOportunidadeDto.responsavel_id;
      if (schema.responsavelMirrorColumn) {
        updateData[schema.responsavelMirrorColumn] = updateOportunidadeDto.responsavel_id;
      }
    }

    if (updateOportunidadeDto.cliente_id !== undefined) {
      updateData.cliente_id = updateOportunidadeDto.cliente_id ?? null;
    }

    if (
      schema.dataFechamentoEsperadoColumn &&
      updateOportunidadeDto.dataFechamentoEsperado !== undefined
    ) {
      updateData[schema.dataFechamentoEsperadoColumn] = updateOportunidadeDto.dataFechamentoEsperado
        ? new Date(updateOportunidadeDto.dataFechamentoEsperado)
        : null;
    }

    if (schema.columns.has('prioridade') && updateOportunidadeDto.prioridade !== undefined) {
      updateData.prioridade = updateOportunidadeDto.prioridade;
    }
    if (schema.columns.has('origem') && updateOportunidadeDto.origem !== undefined) {
      updateData.origem = updateOportunidadeDto.origem;
    }
    if (schema.columns.has('tags') && updateOportunidadeDto.tags !== undefined) {
      updateData.tags =
        updateOportunidadeDto.tags.length > 0 ? updateOportunidadeDto.tags.join(',') : null;
    }
    if (schema.columns.has('nomeContato') && updateOportunidadeDto.nomeContato !== undefined) {
      updateData.nomeContato = updateOportunidadeDto.nomeContato;
    }
    if (schema.columns.has('emailContato') && updateOportunidadeDto.emailContato !== undefined) {
      updateData.emailContato = updateOportunidadeDto.emailContato;
    }
    if (
      schema.columns.has('telefoneContato') &&
      updateOportunidadeDto.telefoneContato !== undefined
    ) {
      updateData.telefoneContato = updateOportunidadeDto.telefoneContato;
    }
    if (
      schema.columns.has('empresaContato') &&
      updateOportunidadeDto.empresaContato !== undefined
    ) {
      updateData.empresaContato = updateOportunidadeDto.empresaContato;
    }

    if (Object.keys(updateData).length > 0) {
      const entries = Object.entries(updateData);
      const setClause = entries
        .map(([column], index) => `${this.quoteIdentifier(column)} = $${index + 1}`)
        .join(', ');
      const values = entries.map(([, value]) => value);

      await this.oportunidadeRepository.query(
        `
          UPDATE "oportunidades"
          SET ${setClause}
          WHERE "id"::text = $${values.length + 1}
            AND "empresa_id" = $${values.length + 2}
        `,
        [...values, id, empresaId],
      );
    }

    if (updateOportunidadeDto.estagio && updateOportunidadeDto.estagio !== estagioAnterior) {
      await this.createStageEvent({
        empresaId,
        oportunidadeId: oportunidade.id,
        fromStage: estagioAnterior,
        toStage: updateOportunidadeDto.estagio,
        changedBy: actorUserId ?? oportunidade.responsavel_id,
        source: 'update',
      });

      await this.createAtividade(
        {
          tipo: TipoAtividade.NOTA,
          descricao: `Estagio alterado de "${estagioAnterior}" para "${updateOportunidadeDto.estagio}"`,
          oportunidade_id: id,
        },
        {
          userId: actorUserId ?? oportunidade.responsavel_id,
          empresaId,
        },
      );
    }

    const oportunidadeAtualizada = await this.findOne(id, empresaId);
    await this.syncLeadMirrorFromOpportunity(oportunidadeAtualizada, empresaId, 'update');
    return oportunidadeAtualizada;
  }

  async updateEstagio(
    id: string,
    updateEstagioDto: UpdateEstagioDto,
    empresaId: string,
    actorUserId?: string,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const oportunidade = await this.findOne(id, empresaId);
    const currentStage = oportunidade.estagio;
    const nextStage = updateEstagioDto.estagio;
    const currentLifecycle = this.fromDatabaseLifecycleStatus(
      (oportunidade as any).lifecycle_status,
      oportunidade.estagio,
    );

    if (lifecycleEnabled && currentLifecycle === LifecycleStatusOportunidade.DELETED) {
      throw new BadRequestException(
        'Oportunidade excluida logicamente. Restaure antes de alterar o estagio.',
      );
    }

    if (lifecycleEnabled && currentLifecycle === LifecycleStatusOportunidade.ARCHIVED) {
      throw new BadRequestException(
        'Oportunidade arquivada. Restaure antes de alterar o estagio.',
      );
    }

    if (currentStage === nextStage) {
      return oportunidade;
    }

    if (!isOportunidadeStageTransitionAllowed(currentStage, nextStage)) {
      const allowed = getAllowedNextOportunidadeStages(currentStage);
      throw new BadRequestException(
        `Transicao de estagio invalida: ${currentStage} -> ${nextStage}. Permitidos: ${allowed.join(', ') || 'nenhum'}`,
      );
    }

    if (nextStage === EstagioOportunidade.PERDIDO && !updateEstagioDto.motivoPerda) {
      throw new BadRequestException(
        'motivoPerda e obrigatorio para marcar oportunidade como perdida',
      );
    }

    const updatePayload: Record<string, unknown> = {
      estagio: this.toDatabaseEstagio(nextStage, schema.estagioMode),
    };

    if (schema.lifecycleStatusColumn) {
      if (nextStage === EstagioOportunidade.GANHO) {
        updatePayload[schema.lifecycleStatusColumn] = LifecycleStatusOportunidade.WON;
      } else if (nextStage === EstagioOportunidade.PERDIDO) {
        updatePayload[schema.lifecycleStatusColumn] = LifecycleStatusOportunidade.LOST;
      } else if (currentLifecycle !== LifecycleStatusOportunidade.OPEN) {
        updatePayload[schema.lifecycleStatusColumn] = LifecycleStatusOportunidade.OPEN;
      }
    }

    if (schema.dataFechamentoRealColumn) {
      if (updateEstagioDto.dataFechamentoReal) {
        updatePayload[schema.dataFechamentoRealColumn] = new Date(updateEstagioDto.dataFechamentoReal);
      } else if (this.isTerminalStage(nextStage)) {
        updatePayload[schema.dataFechamentoRealColumn] = new Date();
      }
    }

    // Campos de perda (presentes em schemas mais novos)
    if (schema.columns.has('motivo_perda')) {
      updatePayload.motivoPerda =
        nextStage === EstagioOportunidade.PERDIDO ? updateEstagioDto.motivoPerda ?? null : null;
    }

    if (schema.columns.has('motivo_perda_detalhes')) {
      updatePayload.motivoPerdaDetalhes =
        nextStage === EstagioOportunidade.PERDIDO
          ? (updateEstagioDto.motivoPerdaDetalhes ?? null)
          : null;
    }

    if (schema.columns.has('concorrente_nome')) {
      updatePayload.concorrenteNome =
        nextStage === EstagioOportunidade.PERDIDO ? updateEstagioDto.concorrenteNome ?? null : null;
    }

    if (schema.columns.has('data_revisao')) {
      updatePayload.dataRevisao =
        nextStage === EstagioOportunidade.PERDIDO && updateEstagioDto.dataRevisao
          ? new Date(updateEstagioDto.dataRevisao)
          : null;
    }

    await this.oportunidadeRepository
      .createQueryBuilder()
      .update('oportunidades')
      .set(updatePayload as any)
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();

    await this.createStageEvent({
      empresaId,
      oportunidadeId: oportunidade.id,
      fromStage: oportunidade.estagio,
      toStage: updateEstagioDto.estagio,
      changedBy: actorUserId ?? oportunidade.responsavel_id,
      source: 'update_estagio',
    });

    const descricao =
      nextStage === EstagioOportunidade.GANHO
        ? 'Oportunidade GANHA'
        : nextStage === EstagioOportunidade.PERDIDO
          ? `Oportunidade perdida${updateEstagioDto.motivoPerda ? ` (motivo: ${updateEstagioDto.motivoPerda})` : ''}`
          : `Movido para estagio: ${nextStage}`;

    await this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao,
        oportunidade_id: id,
      },
      {
        userId: actorUserId ?? oportunidade.responsavel_id,
        empresaId,
      },
    );

    const oportunidadeAtualizada = await this.findOne(id, empresaId);
    await this.syncLeadMirrorFromOpportunity(oportunidadeAtualizada, empresaId, 'update_estagio');
    return oportunidadeAtualizada;
  }

  async getLifecycleFeatureFlag(empresaId: string): Promise<LifecycleFlagDecision> {
    return this.resolveLifecycleFeatureFlagDecision(empresaId);
  }

  async setLifecycleFeatureFlag(input: {
    empresaId: string;
    enabled: boolean;
    rolloutPercentage?: number;
    updatedBy?: string | null;
  }): Promise<LifecycleFlagDecision> {
    if (!(await this.isFeatureFlagsTableAvailable())) {
      throw new BadRequestException(
        'Tabela de feature flags indisponivel. Execute as migrations antes de configurar a flag.',
      );
    }

    const rolloutPercentage = Math.max(0, Math.min(100, Number(input.rolloutPercentage || 0)));

    await this.featureFlagRepository
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagTenant)
      .values({
        empresa_id: input.empresaId,
        flag_key: OPORTUNIDADES_LIFECYCLE_FLAG_KEY,
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

    return this.resolveLifecycleFeatureFlagDecision(input.empresaId);
  }

  private getDefaultStalePolicyEnabled(): boolean {
    return this.parseBooleanFlag(process.env.OPORTUNIDADES_STALE_POLICY_ENABLED);
  }

  private getDefaultAutoArchiveEnabled(): boolean {
    return this.parseBooleanFlag(process.env.OPORTUNIDADES_STALE_AUTO_ARCHIVE_ENABLED);
  }

  private getDefaultStaleThresholdDays(): number {
    return normalizeStaleThresholdDays(
      process.env.OPORTUNIDADES_STALE_DEFAULT_DAYS,
      STALE_DEFAULT_THRESHOLD_DAYS,
    );
  }

  private getDefaultAutoArchiveAfterDays(minimumThresholdDays: number): number {
    const resolved = normalizeStaleThresholdDays(
      process.env.OPORTUNIDADES_STALE_AUTO_ARCHIVE_AFTER_DAYS,
      STALE_DEFAULT_AUTO_ARCHIVE_DAYS,
    );
    return Math.max(resolved, minimumThresholdDays);
  }

  private normalizeStaleQueryLimit(limit?: number): number {
    const parsed = Number(limit ?? STALE_DEFAULT_SCAN_LIMIT);
    if (!Number.isFinite(parsed)) {
      return STALE_DEFAULT_SCAN_LIMIT;
    }

    return Math.min(Math.max(Math.floor(parsed), 1), 2000);
  }

  private getAutoArchiveBatchLimit(limit?: number): number {
    const envBatchLimit = Number(
      process.env.OPORTUNIDADES_STALE_AUTO_ARCHIVE_BATCH_SIZE || STALE_DEFAULT_SCAN_LIMIT,
    );
    const fallback = Number.isFinite(envBatchLimit) ? envBatchLimit : STALE_DEFAULT_SCAN_LIMIT;
    return this.normalizeStaleQueryLimit(limit ?? fallback);
  }

  private async resolveTenantFlagConfig(empresaId: string, flagKey: string): Promise<{
    source: TenantFlagSource;
    enabled: boolean;
    numericValue: number | null;
  }> {
    if (!(await this.isFeatureFlagsTableAvailable())) {
      return {
        source: 'default',
        enabled: false,
        numericValue: null,
      };
    }

    try {
      const flag = await this.featureFlagRepository.findOne({
        where: {
          empresa_id: empresaId,
          flag_key: flagKey,
        },
      });

      if (!flag) {
        return {
          source: 'default',
          enabled: false,
          numericValue: null,
        };
      }

      return {
        source: 'tenant',
        enabled: Boolean(flag.enabled),
        numericValue: Number.isFinite(Number(flag.rollout_percentage))
          ? Number(flag.rollout_percentage)
          : null,
      };
    } catch (error: any) {
      this.logger.warn(
        `Falha ao resolver configuracao de flag ${flagKey}: ${error?.message || error}`,
      );
      return {
        source: 'default',
        enabled: false,
        numericValue: null,
      };
    }
  }

  private async upsertTenantFlagConfig(input: {
    empresaId: string;
    flagKey: string;
    enabled: boolean;
    numericValue: number;
    updatedBy?: string | null;
  }): Promise<void> {
    await this.featureFlagRepository
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagTenant)
      .values({
        empresa_id: input.empresaId,
        flag_key: input.flagKey,
        enabled: input.enabled,
        rollout_percentage: Math.max(0, Math.floor(Number(input.numericValue) || 0)),
        updated_by: input.updatedBy || null,
        updated_at: new Date(),
      })
      .orUpdate(
        ['enabled', 'rollout_percentage', 'updated_by', 'updated_at'],
        ['empresa_id', 'flag_key'],
      )
      .execute();
  }

  async getStalePolicy(empresaId: string): Promise<StalePolicyDecision> {
    const defaultThresholdDays = this.getDefaultStaleThresholdDays();
    const defaultEnabled = this.getDefaultStalePolicyEnabled();
    const defaultAutoArchiveEnabled = this.getDefaultAutoArchiveEnabled();
    const defaultAutoArchiveAfterDays = this.getDefaultAutoArchiveAfterDays(defaultThresholdDays);

    const [staleFlag, autoArchiveFlag] = await Promise.all([
      this.resolveTenantFlagConfig(empresaId, OPORTUNIDADES_STALE_POLICY_FLAG_KEY),
      this.resolveTenantFlagConfig(empresaId, OPORTUNIDADES_STALE_AUTO_ARCHIVE_FLAG_KEY),
    ]);

    const thresholdDays =
      staleFlag.source === 'tenant'
        ? normalizeStaleThresholdDays(staleFlag.numericValue, defaultThresholdDays)
        : defaultThresholdDays;

    const autoArchiveAfterDaysRaw =
      autoArchiveFlag.source === 'tenant'
        ? normalizeStaleThresholdDays(autoArchiveFlag.numericValue, defaultAutoArchiveAfterDays)
        : defaultAutoArchiveAfterDays;

    return {
      enabled: staleFlag.source === 'tenant' ? staleFlag.enabled : defaultEnabled,
      thresholdDays,
      source: staleFlag.source,
      autoArchiveEnabled:
        autoArchiveFlag.source === 'tenant' ? autoArchiveFlag.enabled : defaultAutoArchiveEnabled,
      autoArchiveAfterDays: Math.max(autoArchiveAfterDaysRaw, thresholdDays),
      autoArchiveSource: autoArchiveFlag.source,
    };
  }

  async setStalePolicy(input: {
    empresaId: string;
    enabled?: boolean;
    thresholdDays?: number;
    autoArchiveEnabled?: boolean;
    autoArchiveAfterDays?: number;
    updatedBy?: string | null;
  }): Promise<StalePolicyDecision> {
    if (!(await this.isFeatureFlagsTableAvailable())) {
      throw new BadRequestException(
        'Tabela de feature flags indisponivel. Execute as migrations antes de configurar a politica stale.',
      );
    }

    const currentPolicy = await this.getStalePolicy(input.empresaId);
    const enabled = input.enabled ?? currentPolicy.enabled;
    const thresholdDays = normalizeStaleThresholdDays(
      input.thresholdDays,
      currentPolicy.thresholdDays,
    );
    const autoArchiveEnabled = input.autoArchiveEnabled ?? currentPolicy.autoArchiveEnabled;
    const autoArchiveAfterDays = Math.max(
      normalizeStaleThresholdDays(input.autoArchiveAfterDays, currentPolicy.autoArchiveAfterDays),
      thresholdDays,
    );

    await Promise.all([
      this.upsertTenantFlagConfig({
        empresaId: input.empresaId,
        flagKey: OPORTUNIDADES_STALE_POLICY_FLAG_KEY,
        enabled,
        numericValue: thresholdDays,
        updatedBy: input.updatedBy || null,
      }),
      this.upsertTenantFlagConfig({
        empresaId: input.empresaId,
        flagKey: OPORTUNIDADES_STALE_AUTO_ARCHIVE_FLAG_KEY,
        enabled: autoArchiveEnabled,
        numericValue: autoArchiveAfterDays,
        updatedBy: input.updatedBy || null,
      }),
    ]);

    return this.getStalePolicy(input.empresaId);
  }

  private async resolveOpenCandidatesForStale(input: {
    empresaId: string;
    lifecycleEnabled: boolean;
  }): Promise<Oportunidade[]> {
    const lifecycleFilters: OportunidadeFindFilters | undefined = input.lifecycleEnabled
      ? {
          lifecycle_view: LifecycleViewOportunidade.OPEN,
        }
      : undefined;

    const oportunidades = await this.findAll(input.empresaId, lifecycleFilters);
    if (input.lifecycleEnabled) {
      return oportunidades.filter((oportunidade) => {
        const lifecycleStatus = this.fromDatabaseLifecycleStatus(
          (oportunidade as any).lifecycle_status,
          oportunidade.estagio,
        );
        return lifecycleStatus === LifecycleStatusOportunidade.OPEN;
      });
    }

    return oportunidades.filter((oportunidade) => !this.isTerminalStage(oportunidade.estagio));
  }

  private async loadLatestActivityByOportunidade(
    empresaId: string,
    oportunidadeIds: string[],
  ): Promise<Map<string, Date>> {
    const results = new Map<string, Date>();
    if (!oportunidadeIds.length) {
      return results;
    }

    const atividadeSchema = await this.resolveAtividadesSchema();
    const dateExpression = `MAX(atividade.${this.quoteIdentifier(atividadeSchema.dateColumn)})`;

    const rows = await this.atividadeRepository
      .createQueryBuilder('atividade')
      .select('atividade.oportunidade_id::text', 'oportunidade_id')
      .addSelect(dateExpression, 'last_activity_at')
      .where('atividade.empresa_id = :empresaId', { empresaId })
      .andWhere('atividade.oportunidade_id::text IN (:...oportunidadeIds)', { oportunidadeIds })
      .groupBy('atividade.oportunidade_id')
      .getRawMany<{ oportunidade_id?: string; last_activity_at?: string | Date | null }>();

    rows.forEach((row) => {
      if (!row.oportunidade_id) {
        return;
      }

      const parsed = this.parseDateValue(row.last_activity_at);
      if (parsed) {
        results.set(row.oportunidade_id, parsed);
      }
    });

    return results;
  }

  private async loadLatestStageEventByOportunidade(
    empresaId: string,
    oportunidadeIds: string[],
  ): Promise<Map<string, Date>> {
    const results = new Map<string, Date>();
    if (!oportunidadeIds.length) {
      return results;
    }

    if (!(await this.isStageEventsTableAvailable())) {
      return results;
    }

    const stageEventColumns = await this.getTableColumns('oportunidade_stage_events');
    const changedAtColumn = stageEventColumns.has('changed_at')
      ? 'changed_at'
      : stageEventColumns.has('created_at')
        ? 'created_at'
        : null;

    if (!changedAtColumn) {
      return results;
    }

    const rows = await this.stageEventRepository
      .createQueryBuilder('evento')
      .select('evento.oportunidade_id::text', 'oportunidade_id')
      .addSelect(`MAX(evento.${this.quoteIdentifier(changedAtColumn)})`, 'last_stage_event_at')
      .where('evento.empresa_id = :empresaId', { empresaId })
      .andWhere('evento.oportunidade_id::text IN (:...oportunidadeIds)', { oportunidadeIds })
      .groupBy('evento.oportunidade_id')
      .getRawMany<{ oportunidade_id?: string; last_stage_event_at?: string | Date | null }>();

    rows.forEach((row) => {
      if (!row.oportunidade_id) {
        return;
      }

      const parsed = this.parseDateValue(row.last_stage_event_at);
      if (parsed) {
        results.set(row.oportunidade_id, parsed);
      }
    });

    return results;
  }

  private applyStaleSnapshot(snapshot: StaleOpportunitySnapshot): Oportunidade {
    return {
      ...snapshot.oportunidade,
      is_stale: snapshot.isStale,
      stale_days: snapshot.staleDays,
      last_interaction_at: snapshot.lastInteractionAt,
      stale_since: snapshot.staleSince,
    } as Oportunidade;
  }

  private async buildStaleSnapshots(
    empresaId: string,
    oportunidades: Oportunidade[],
    thresholdDays: number,
    referenceDate: Date = new Date(),
  ): Promise<StaleOpportunitySnapshot[]> {
    if (!oportunidades.length) {
      return [];
    }

    const oportunidadeIds = oportunidades.map((oportunidade) => String(oportunidade.id));
    const [activityMap, stageEventMap] = await Promise.all([
      this.loadLatestActivityByOportunidade(empresaId, oportunidadeIds),
      this.loadLatestStageEventByOportunidade(empresaId, oportunidadeIds),
    ]);

    return oportunidades.map((oportunidade) => {
      const oportunidadeId = String(oportunidade.id);
      const interactionDate = this.getMostRecentDate([
        this.parseDateValue((oportunidade as any).updatedAt || oportunidade.updatedAt),
        this.parseDateValue((oportunidade as any).createdAt || oportunidade.createdAt),
        activityMap.get(oportunidadeId),
        stageEventMap.get(oportunidadeId),
      ]);
      const staleDays = calculateStaleDays(interactionDate, referenceDate);
      const isStaleDeal = staleDays >= thresholdDays;
      const staleSince =
        isStaleDeal && interactionDate
          ? new Date(interactionDate.getTime() + thresholdDays * 24 * 60 * 60 * 1000)
          : null;

      return {
        id: oportunidadeId,
        oportunidade,
        isStale: isStaleDeal,
        staleDays,
        lastInteractionAt: interactionDate ? interactionDate.toISOString() : null,
        staleSince: staleSince ? staleSince.toISOString() : null,
      };
    });
  }

  async listarOportunidadesParadas(
    empresaId: string,
    options?: {
      thresholdDays?: number;
      limit?: number;
    },
  ): Promise<StaleCheckResult> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const policy = await this.getStalePolicy(empresaId);
    const thresholdDays = normalizeStaleThresholdDays(options?.thresholdDays, policy.thresholdDays);
    const limit = this.normalizeStaleQueryLimit(options?.limit);
    const candidates = await this.resolveOpenCandidatesForStale({
      empresaId,
      lifecycleEnabled,
    });
    const snapshots = await this.buildStaleSnapshots(empresaId, candidates, thresholdDays);
    const staleSnapshots = snapshots
      .filter((snapshot) => snapshot.isStale)
      .sort((left, right) => {
        if (right.staleDays !== left.staleDays) {
          return right.staleDays - left.staleDays;
        }
        return right.id.localeCompare(left.id);
      });

    return {
      enabled: policy.enabled,
      thresholdDays,
      totalCandidates: candidates.length,
      totalStale: staleSnapshots.length,
      generatedAt: new Date().toISOString(),
      stale: staleSnapshots.slice(0, limit).map((snapshot) => this.applyStaleSnapshot(snapshot)),
    };
  }

  async processarAutoArquivamentoStale(
    empresaId: string,
    options?: {
      dryRun?: boolean;
      trigger?: 'manual' | 'scheduler';
      limit?: number;
    },
  ): Promise<AutoArchiveResult> {
    const trigger = options?.trigger === 'manual' ? 'manual' : 'scheduler';
    const dryRun = Boolean(options?.dryRun);
    const policy = await this.getStalePolicy(empresaId);
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const featureEnabled = lifecycleEnabled && policy.enabled;
    const autoArchiveEnabled = featureEnabled && policy.autoArchiveEnabled;

    if (!autoArchiveEnabled) {
      return {
        enabled: featureEnabled,
        autoArchiveEnabled,
        thresholdDays: policy.autoArchiveAfterDays,
        totalCandidates: 0,
        archivedCount: 0,
        dryRun,
        trigger,
        archivedIds: [],
        failed: [],
        generatedAt: new Date().toISOString(),
      };
    }

    const batchLimit = this.getAutoArchiveBatchLimit(options?.limit);
    const staleResult = await this.listarOportunidadesParadas(empresaId, {
      thresholdDays: policy.autoArchiveAfterDays,
      limit: batchLimit,
    });
    const candidates = staleResult.stale.slice(0, batchLimit);
    const archivedIds: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    if (dryRun) {
      return {
        enabled: featureEnabled,
        autoArchiveEnabled,
        thresholdDays: policy.autoArchiveAfterDays,
        totalCandidates: candidates.length,
        archivedCount: 0,
        dryRun,
        trigger,
        archivedIds: candidates.map((oportunidade) => String(oportunidade.id)),
        failed,
        generatedAt: new Date().toISOString(),
      };
    }

    for (const oportunidade of candidates) {
      const oportunidadeId = String(oportunidade.id);
      try {
        await this.arquivar(oportunidadeId, empresaId, undefined, {
          motivo: 'Auto-arquivamento por inatividade',
          comentario: `Arquivada automaticamente (${trigger}) apos ${policy.autoArchiveAfterDays} dias sem interacao relevante.`,
        });
        archivedIds.push(oportunidadeId);
      } catch (error: any) {
        failed.push({
          id: oportunidadeId,
          reason: error?.message || 'Falha ao arquivar oportunidade automaticamente.',
        });
      }
    }

    return {
      enabled: featureEnabled,
      autoArchiveEnabled,
      thresholdDays: policy.autoArchiveAfterDays,
      totalCandidates: candidates.length,
      archivedCount: archivedIds.length,
      dryRun,
      trigger,
      archivedIds,
      failed,
      generatedAt: new Date().toISOString(),
    };
  }

  async remove(id: string, empresaId: string, actorUserId?: string): Promise<void> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });

    if (!lifecycleEnabled || !schema.lifecycleStatusColumn) {
      await this.oportunidadeRepository
        .createQueryBuilder()
        .delete()
        .from('oportunidades')
        .where('id::text = :id', { id })
        .andWhere('empresa_id = :empresaId', { empresaId })
        .execute();
      return;
    }

    const oportunidade = await this.findOne(id, empresaId, { include_deleted: true });
    const currentLifecycle = this.fromDatabaseLifecycleStatus(
      (oportunidade as any).lifecycle_status,
      oportunidade.estagio,
    );

    if (currentLifecycle === LifecycleStatusOportunidade.DELETED) {
      return;
    }

    if (
      !isOportunidadeLifecycleTransitionAllowed(
        currentLifecycle,
        LifecycleStatusOportunidade.DELETED,
      )
    ) {
      const allowed = getAllowedNextOportunidadeLifecycleStatuses(currentLifecycle);
      throw new BadRequestException(
        `Transicao de lifecycle invalida: ${currentLifecycle} -> deleted. Permitidos: ${allowed.join(', ') || 'nenhum'}`,
      );
    }

    const now = new Date();
    const updatePayload: Record<string, unknown> = {
      [schema.lifecycleStatusColumn]: LifecycleStatusOportunidade.DELETED,
    };

    if (schema.deletedAtColumn) {
      updatePayload[schema.deletedAtColumn] = now;
    }
    if (schema.deletedByColumn) {
      updatePayload[schema.deletedByColumn] = actorUserId || null;
    }

    await this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao: 'Oportunidade movida para lixeira',
        oportunidade_id: id,
      },
      {
        userId: actorUserId ?? oportunidade.responsavel_id,
        empresaId,
      },
    );

    await this.oportunidadeRepository
      .createQueryBuilder()
      .update('oportunidades')
      .set(updatePayload as any)
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();
  }

  async removePermanente(id: string, empresaId: string, _actorUserId?: string): Promise<void> {
    await this.findOne(id, empresaId, { include_deleted: true });

    await this.oportunidadeRepository
      .createQueryBuilder()
      .delete()
      .from('oportunidades')
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();
  }

  async arquivar(
    id: string,
    empresaId: string,
    actorUserId?: string,
    payload?: LifecycleTransitionDto,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    if (!lifecycleEnabled || !schema.lifecycleStatusColumn) {
      throw new BadRequestException(
        'Ciclo de vida desabilitado para esta empresa. Acao de arquivamento indisponivel.',
      );
    }

    const oportunidade = await this.findOne(id, empresaId, { include_deleted: true });
    const currentLifecycle = this.fromDatabaseLifecycleStatus(
      (oportunidade as any).lifecycle_status,
      oportunidade.estagio,
    );

    if (currentLifecycle === LifecycleStatusOportunidade.DELETED) {
      throw new BadRequestException('Oportunidade na lixeira. Restaure antes de arquivar.');
    }

    if (currentLifecycle === LifecycleStatusOportunidade.ARCHIVED) {
      return oportunidade;
    }

    if (
      !isOportunidadeLifecycleTransitionAllowed(
        currentLifecycle,
        LifecycleStatusOportunidade.ARCHIVED,
      )
    ) {
      const allowed = getAllowedNextOportunidadeLifecycleStatuses(currentLifecycle);
      throw new BadRequestException(
        `Transicao de lifecycle invalida: ${currentLifecycle} -> archived. Permitidos: ${allowed.join(', ') || 'nenhum'}`,
      );
    }

    const now = new Date();
    const updatePayload: Record<string, unknown> = {
      [schema.lifecycleStatusColumn]: LifecycleStatusOportunidade.ARCHIVED,
    };

    if (schema.archivedAtColumn) {
      updatePayload[schema.archivedAtColumn] = now;
    }
    if (schema.archivedByColumn) {
      updatePayload[schema.archivedByColumn] = actorUserId || null;
    }

    await this.oportunidadeRepository
      .createQueryBuilder()
      .update('oportunidades')
      .set(updatePayload as any)
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();

    const notaPartes = ['Oportunidade arquivada'];
    if (payload?.motivo?.trim()) {
      notaPartes.push(`Motivo: ${payload.motivo.trim()}`);
    }
    if (payload?.comentario?.trim()) {
      notaPartes.push(`Detalhes: ${payload.comentario.trim()}`);
    }

    await this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao: notaPartes.join('\n'),
        oportunidade_id: id,
      },
      {
        userId: actorUserId ?? oportunidade.responsavel_id,
        empresaId,
      },
    );

    const oportunidadeAtualizada = await this.findOne(id, empresaId, { include_deleted: true });
    await this.syncLeadMirrorFromOpportunity(oportunidadeAtualizada, empresaId, 'reopen');
    return oportunidadeAtualizada;
  }

  async restaurar(
    id: string,
    empresaId: string,
    actorUserId?: string,
    payload?: LifecycleTransitionDto,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    if (!lifecycleEnabled || !schema.lifecycleStatusColumn) {
      throw new BadRequestException(
        'Ciclo de vida desabilitado para esta empresa. Acao de restauracao indisponivel.',
      );
    }

    const oportunidade = await this.findOne(id, empresaId, { include_deleted: true });
    const currentLifecycle = this.fromDatabaseLifecycleStatus(
      (oportunidade as any).lifecycle_status,
      oportunidade.estagio,
    );

    if (
      currentLifecycle !== LifecycleStatusOportunidade.ARCHIVED &&
      currentLifecycle !== LifecycleStatusOportunidade.DELETED
    ) {
      return oportunidade;
    }

    const restoredLifecycle = this.resolveLifecycleFromStage(oportunidade.estagio);
    const updatePayload: Record<string, unknown> = {
      [schema.lifecycleStatusColumn]: restoredLifecycle,
    };

    if (schema.archivedAtColumn) {
      updatePayload[schema.archivedAtColumn] = null;
    }
    if (schema.archivedByColumn) {
      updatePayload[schema.archivedByColumn] = null;
    }
    if (schema.deletedAtColumn) {
      updatePayload[schema.deletedAtColumn] = null;
    }
    if (schema.deletedByColumn) {
      updatePayload[schema.deletedByColumn] = null;
    }

    await this.oportunidadeRepository
      .createQueryBuilder()
      .update('oportunidades')
      .set(updatePayload as any)
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();

    const notaPartes = ['Oportunidade restaurada para fluxo ativo'];
    if (payload?.motivo?.trim()) {
      notaPartes.push(`Motivo: ${payload.motivo.trim()}`);
    }
    if (payload?.comentario?.trim()) {
      notaPartes.push(`Detalhes: ${payload.comentario.trim()}`);
    }

    await this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao: notaPartes.join('\n'),
        oportunidade_id: id,
      },
      {
        userId: actorUserId ?? oportunidade.responsavel_id,
        empresaId,
      },
    );

    return this.findOne(id, empresaId, { include_deleted: true });
  }

  async reabrir(
    id: string,
    empresaId: string,
    actorUserId?: string,
    payload?: LifecycleTransitionDto,
  ): Promise<Oportunidade> {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const oportunidade = await this.findOne(id, empresaId, { include_deleted: true });
    const currentLifecycle = this.fromDatabaseLifecycleStatus(
      (oportunidade as any).lifecycle_status,
      oportunidade.estagio,
    );

    if (currentLifecycle === LifecycleStatusOportunidade.DELETED) {
      throw new BadRequestException('Oportunidade na lixeira. Restaure antes de reabrir.');
    }

    if (currentLifecycle === LifecycleStatusOportunidade.ARCHIVED) {
      throw new BadRequestException('Oportunidade arquivada. Restaure antes de reabrir.');
    }

    if (
      oportunidade.estagio !== EstagioOportunidade.GANHO &&
      oportunidade.estagio !== EstagioOportunidade.PERDIDO
    ) {
      throw new BadRequestException('Apenas oportunidades ganhas ou perdidas podem ser reabertas.');
    }

    const reopenedStage = EstagioOportunidade.FECHAMENTO;
    const updatePayload: Record<string, unknown> = {
      estagio: this.toDatabaseEstagio(reopenedStage, schema.estagioMode),
    };

    if (schema.lifecycleStatusColumn && lifecycleEnabled) {
      updatePayload[schema.lifecycleStatusColumn] = LifecycleStatusOportunidade.OPEN;
    }

    if (schema.dataFechamentoRealColumn) {
      updatePayload[schema.dataFechamentoRealColumn] = null;
    }

    if (schema.reopenedAtColumn) {
      updatePayload[schema.reopenedAtColumn] = new Date();
    }

    if (schema.reopenedByColumn) {
      updatePayload[schema.reopenedByColumn] = actorUserId || null;
    }

    if (schema.columns.has('motivo_perda')) {
      updatePayload.motivoPerda = null;
    }
    if (schema.columns.has('motivo_perda_detalhes')) {
      updatePayload.motivoPerdaDetalhes = null;
    }
    if (schema.columns.has('concorrente_nome')) {
      updatePayload.concorrenteNome = null;
    }
    if (schema.columns.has('data_revisao')) {
      updatePayload.dataRevisao = null;
    }

    await this.oportunidadeRepository
      .createQueryBuilder()
      .update('oportunidades')
      .set(updatePayload as any)
      .where('id::text = :id', { id })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();

    await this.createStageEvent({
      empresaId,
      oportunidadeId: oportunidade.id,
      fromStage: oportunidade.estagio,
      toStage: reopenedStage,
      changedBy: actorUserId ?? oportunidade.responsavel_id,
      source: 'reopen',
    });

    const notaPartes = ['Oportunidade reaberta para o estagio Fechamento'];
    if (payload?.motivo?.trim()) {
      notaPartes.push(`Motivo: ${payload.motivo.trim()}`);
    }
    if (payload?.comentario?.trim()) {
      notaPartes.push(`Detalhes: ${payload.comentario.trim()}`);
    }

    await this.createAtividade(
      {
        tipo: TipoAtividade.NOTA,
        descricao: notaPartes.join('\n'),
        oportunidade_id: id,
      },
      {
        userId: actorUserId ?? oportunidade.responsavel_id,
        empresaId,
      },
    );

    return this.findOne(id, empresaId, { include_deleted: true });
  }

  async createAtividade(
    createAtividadeDto: CreateAtividadeDto,
    context: { userId?: string; empresaId: string },
  ): Promise<Atividade> {
    const atividadeSchema = await this.resolveAtividadesSchema();
    const oportunidadeId = createAtividadeDto.oportunidade_id?.toString();
    if (!oportunidadeId) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const oportunidade = await this.findOne(oportunidadeId, context.empresaId, {
      include_deleted: true,
    });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const lifecycleStatus = this.fromDatabaseLifecycleStatus(
      (oportunidade as any).lifecycle_status,
      oportunidade.estagio,
    );
    if (lifecycleStatus === LifecycleStatusOportunidade.DELETED) {
      throw new BadRequestException(
        'Nao e permitido registrar atividade em oportunidade na lixeira. Restaure antes.',
      );
    }

    const columns: string[] = [
      'tipo',
      'descricao',
      'oportunidade_id',
      'empresa_id',
      atividadeSchema.userColumn,
      atividadeSchema.dateColumn,
    ];
    const values: unknown[] = [
      createAtividadeDto.tipo,
      createAtividadeDto.descricao,
      oportunidade.id,
      context.empresaId,
      context.userId ?? (oportunidade as any).responsavel_id,
      createAtividadeDto.dataAtividade ? new Date(createAtividadeDto.dataAtividade) : new Date(),
    ];

    if (atividadeSchema.titleColumn) {
      columns.splice(1, 0, atividadeSchema.titleColumn);
      values.splice(1, 0, createAtividadeDto.titulo ?? 'Atividade');
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const insertResult = await this.atividadeRepository.query(
      `
        INSERT INTO "atividades" (${columns.map((column) => this.quoteIdentifier(column)).join(', ')})
        VALUES (${placeholders})
        RETURNING
          "id",
          "empresa_id",
          "tipo",
          "descricao",
          "oportunidade_id",
          ${this.quoteIdentifier(atividadeSchema.userColumn)} AS "criado_por_id",
          ${this.quoteIdentifier(atividadeSchema.dateColumn)} AS "dataAtividade",
          ${this.quoteIdentifier(atividadeSchema.createdAtColumn)} AS "createdAt"
      `,
      values,
    );

    const atividade = insertResult?.[0];
    return {
      id: atividade.id,
      empresa_id: atividade.empresa_id,
      tipo: atividade.tipo,
      descricao: atividade.descricao,
      oportunidade_id: atividade.oportunidade_id,
      criado_por_id: atividade.criado_por_id,
      dataAtividade: atividade.dataAtividade,
      createdAt: atividade.createdAt,
      criadoPor: undefined,
    } as Atividade;
  }

  async listarAtividades(oportunidadeId: string, empresaId: string): Promise<Atividade[]> {
    const atividadeSchema = await this.resolveAtividadesSchema();
    const usersColumns = await this.getTableColumns('users');
    const oportunidade = await this.findOne(oportunidadeId, empresaId, { include_deleted: true });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const userRef = `atividade.${this.quoteIdentifier(atividadeSchema.userColumn)}`;
    const dateRef = `atividade.${this.quoteIdentifier(atividadeSchema.dateColumn)}`;
    const createdRef = `atividade.${this.quoteIdentifier(atividadeSchema.createdAtColumn)}`;
    const usuarioAvatarExpr = usersColumns.has('avatar_url') ? 'usuario.avatar_url' : 'NULL';

    const rows = await this.atividadeRepository
      .createQueryBuilder('atividade')
      .leftJoin('users', 'usuario', `usuario.id = ${userRef}`)
      .select('atividade.id', 'id')
      .addSelect('atividade.empresa_id', 'empresa_id')
      .addSelect('atividade.tipo', 'tipo')
      .addSelect('atividade.descricao', 'descricao')
      .addSelect('atividade.oportunidade_id', 'oportunidade_id')
      .addSelect(userRef, 'criado_por_id')
      .addSelect(dateRef, 'dataAtividade')
      .addSelect(createdRef, 'createdAt')
      .addSelect('usuario.id', 'usuario__id')
      .addSelect('usuario.nome', 'usuario__nome')
      .addSelect(usuarioAvatarExpr, 'usuario__avatar_url')
      .where('atividade.oportunidade_id::text = :oportunidadeId', { oportunidadeId })
      .andWhere('atividade.empresa_id = :empresaId', { empresaId })
      .orderBy(dateRef, 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      empresa_id: row.empresa_id,
      tipo: row.tipo,
      descricao: row.descricao,
      oportunidade_id: row.oportunidade_id,
      criado_por_id: row.criado_por_id,
      dataAtividade: row.dataAtividade,
      createdAt: row.createdAt,
      criadoPor: row.usuario__id
        ? {
            id: row.usuario__id,
            nome: row.usuario__nome,
            avatar_url: row.usuario__avatar_url,
          }
        : undefined,
    })) as Atividade[];
  }

  async obterResumoAtividadesComerciais(
    empresaId: string,
    options?: {
      periodStart?: string;
      periodEnd?: string;
      vendedorId?: string;
      limit?: number;
    },
  ): Promise<OportunidadeAtividadeResumo> {
    const atividadeSchema = await this.resolveAtividadesSchema();
    const usersColumns = await this.getTableColumns('users');
    const range = this.resolveActivitiesRange(options?.periodStart, options?.periodEnd);
    const vendedorId = options?.vendedorId?.trim() || undefined;
    const parsedLimit = Number(options?.limit ?? 12);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 100)
      : 12;

    const userRef = `atividade.${this.quoteIdentifier(atividadeSchema.userColumn)}`;
    const dateRef = `atividade.${this.quoteIdentifier(atividadeSchema.dateColumn)}`;
    const avatarExpr = usersColumns.has('avatar_url') ? 'usuario.avatar_url' : 'NULL';
    const queryParams = {
      empresaId,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    };

    const totalQuery = this.atividadeRepository
      .createQueryBuilder('atividade')
      .select('COUNT(*)::int', 'total')
      .where('atividade.empresa_id = :empresaId', { empresaId })
      .andWhere(`${dateRef} BETWEEN :start AND :end`, queryParams);

    const byTypeQuery = this.atividadeRepository
      .createQueryBuilder('atividade')
      .select('atividade.tipo', 'tipo')
      .addSelect('COUNT(*)::int', 'quantidade')
      .where('atividade.empresa_id = :empresaId', { empresaId })
      .andWhere(`${dateRef} BETWEEN :start AND :end`, queryParams)
      .groupBy('atividade.tipo')
      .orderBy('quantidade', 'DESC');

    const bySellerQuery = this.atividadeRepository
      .createQueryBuilder('atividade')
      .leftJoin('users', 'usuario', `usuario.id = ${userRef}`)
      .select(`${userRef}`, 'vendedor_id')
      .addSelect(`COALESCE(usuario.nome, 'Usuario removido')`, 'vendedor_nome')
      .addSelect(avatarExpr, 'vendedor_avatar_url')
      .addSelect('COUNT(*)::int', 'quantidade')
      .addSelect('COUNT(DISTINCT atividade.oportunidade_id)::int', 'oportunidades_ativas')
      .addSelect(`MAX(${dateRef})`, 'ultima_atividade_em')
      .where('atividade.empresa_id = :empresaId', { empresaId })
      .andWhere(`${dateRef} BETWEEN :start AND :end`, queryParams)
      .groupBy(`${userRef}`)
      .addGroupBy('usuario.nome')
      .orderBy('quantidade', 'DESC')
      .addOrderBy('vendedor_nome', 'ASC');

    if (usersColumns.has('avatar_url')) {
      bySellerQuery.addGroupBy('usuario.avatar_url');
    }

    const recentQuery = this.atividadeRepository
      .createQueryBuilder('atividade')
      .leftJoin(
        'oportunidades',
        'oportunidade',
        'oportunidade.id::text = atividade.oportunidade_id::text AND oportunidade.empresa_id = atividade.empresa_id',
      )
      .leftJoin('users', 'usuario', `usuario.id = ${userRef}`)
      .select('atividade.id', 'id')
      .addSelect('atividade.tipo', 'tipo')
      .addSelect('atividade.descricao', 'descricao')
      .addSelect('atividade.oportunidade_id', 'oportunidade_id')
      .addSelect(dateRef, 'data_atividade')
      .addSelect('oportunidade.titulo', 'oportunidade_titulo')
      .addSelect('usuario.id', 'usuario_id')
      .addSelect('usuario.nome', 'usuario_nome')
      .addSelect(avatarExpr, 'usuario_avatar_url')
      .where('atividade.empresa_id = :empresaId', { empresaId })
      .andWhere(`${dateRef} BETWEEN :start AND :end`, queryParams)
      .orderBy(dateRef, 'DESC')
      .addOrderBy('atividade.id', 'DESC')
      .limit(limit);

    if (vendedorId) {
      totalQuery.andWhere(`${userRef}::text = :vendedorId`, { vendedorId });
      byTypeQuery.andWhere(`${userRef}::text = :vendedorId`, { vendedorId });
      bySellerQuery.andWhere(`${userRef}::text = :vendedorId`, { vendedorId });
      recentQuery.andWhere(`${userRef}::text = :vendedorId`, { vendedorId });
    }

    const [totalRow, byTypeRows, bySellerRows, recentRows] = await Promise.all([
      totalQuery.getRawOne<{ total?: string }>(),
      byTypeQuery.getRawMany<{ tipo?: string; quantidade?: string }>(),
      bySellerQuery.getRawMany<{
        vendedor_id?: string;
        vendedor_nome?: string;
        vendedor_avatar_url?: string | null;
        quantidade?: string;
        oportunidades_ativas?: string;
        ultima_atividade_em?: string | Date | null;
      }>(),
      recentQuery.getRawMany<{
        id?: string;
        tipo?: string;
        descricao?: string;
        oportunidade_id?: string;
        data_atividade?: string | Date | null;
        oportunidade_titulo?: string | null;
        usuario_id?: string | null;
        usuario_nome?: string | null;
        usuario_avatar_url?: string | null;
      }>(),
    ]);

    return {
      range: {
        periodStart: range.start.toISOString(),
        periodEnd: range.end.toISOString(),
      },
      totalAtividades: Number(totalRow?.total || 0),
      porTipo: byTypeRows.map((row) => ({
        tipo: (row.tipo || TipoAtividade.NOTA) as TipoAtividade,
        quantidade: Number(row.quantidade || 0),
      })),
      porVendedor: bySellerRows
        .filter((row) => Boolean(row.vendedor_id))
        .map((row) => ({
          vendedorId: String(row.vendedor_id),
          nome: row.vendedor_nome || 'Usuario removido',
          avatarUrl: row.vendedor_avatar_url || null,
          quantidade: Number(row.quantidade || 0),
          oportunidadesAtivas: Number(row.oportunidades_ativas || 0),
          ultimaAtividadeEm: this.toIsoStringOrNull(row.ultima_atividade_em),
        })),
      recentes: recentRows.map((row) => ({
        id: Number(row.id || 0),
        tipo: (row.tipo || TipoAtividade.NOTA) as TipoAtividade,
        descricao: row.descricao || '',
        dataAtividade: this.toIsoStringOrNull(row.data_atividade),
        oportunidadeId: Number(row.oportunidade_id || 0),
        oportunidadeTitulo: row.oportunidade_titulo || undefined,
        vendedor: row.usuario_id
          ? {
              id: row.usuario_id,
              nome: row.usuario_nome || 'Usuario removido',
              avatarUrl: row.usuario_avatar_url || null,
            }
          : undefined,
      })),
    };
  }

  async listarHistoricoEstagios(
    oportunidadeId: string,
    empresaId: string,
    limit = 50,
  ): Promise<OportunidadeHistoricoEstagioItem[]> {
    const oportunidade = await this.findOne(oportunidadeId, empresaId, { include_deleted: true });
    const usersColumns = await this.getTableColumns('users');
    const avatarExpr = usersColumns.has('avatar_url') ? 'usuario.avatar_url' : 'NULL';
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 200)
      : 50;

    const rows = await this.stageEventRepository
      .createQueryBuilder('evento')
      .leftJoin('users', 'usuario', 'usuario.id = evento.changed_by')
      .select('evento.id', 'id')
      .addSelect('evento.from_stage', 'from_stage')
      .addSelect('evento.to_stage', 'to_stage')
      .addSelect('evento.changed_at', 'changed_at')
      .addSelect('evento.source', 'source')
      .addSelect('usuario.id', 'usuario_id')
      .addSelect('usuario.nome', 'usuario_nome')
      .addSelect(avatarExpr, 'usuario_avatar_url')
      .where('evento.empresa_id = :empresaId', { empresaId })
      .andWhere('evento.oportunidade_id::text = :oportunidadeId', {
        oportunidadeId: String(oportunidade.id),
      })
      .orderBy('evento.changed_at', 'DESC')
      .addOrderBy('evento.created_at', 'DESC')
      .limit(safeLimit)
      .getRawMany<{
        id?: string;
        from_stage?: string | null;
        to_stage?: string;
        changed_at?: string | Date;
        source?: string;
        usuario_id?: string | null;
        usuario_nome?: string | null;
        usuario_avatar_url?: string | null;
      }>();

    return rows
      .filter((row) => Boolean(row.id && row.to_stage))
      .map((row) => ({
        id: String(row.id),
        fromStage: row.from_stage ? this.fromDatabaseEstagio(row.from_stage) : null,
        toStage: this.fromDatabaseEstagio(row.to_stage as string),
        changedAt: this.toIsoStringOrNull(row.changed_at) || new Date().toISOString(),
        source: row.source || 'system',
        changedBy: row.usuario_id
          ? {
              id: row.usuario_id,
              nome: row.usuario_nome || 'Usuario removido',
              avatarUrl: row.usuario_avatar_url || null,
            }
          : undefined,
      }));
  }

  async getMetricas(empresaId: string, filtros?: MetricasQueryDto) {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const createdAtRef = `oportunidade.${this.quoteIdentifier(schema.createdAtColumn)}`;
    const lifecycleStatusExpr = schema.lifecycleStatusColumn
      ? `oportunidade.${this.quoteIdentifier(schema.lifecycleStatusColumn)}`
      : this.buildLifecycleFromStageExpression('oportunidade.estagio');

    let queryBuilder = this.oportunidadeRepository
      .createQueryBuilder('oportunidade')
      .select('oportunidade.estagio', 'estagio')
      .addSelect('oportunidade.valor', 'valor')
      .where('oportunidade.empresa_id = :empresaId', { empresaId });

    if (filtros?.dataInicio && filtros?.dataFim) {
      queryBuilder = queryBuilder.andWhere(`${createdAtRef} BETWEEN :dataInicio AND :dataFim`, {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
      });
    }

    if (lifecycleEnabled && schema.lifecycleStatusColumn) {
      const lifecycleStatuses = this.resolveLifecycleStatusFilterValues(filtros);
      if (lifecycleStatuses.length > 0) {
        queryBuilder = queryBuilder.andWhere(`${lifecycleStatusExpr}::text IN (:...lifecycleStatuses)`, {
          lifecycleStatuses,
        });
      }
    } else if (schema.lifecycleStatusColumn && !this.parseBooleanFlag(filtros?.include_deleted)) {
      queryBuilder = queryBuilder.andWhere(`${lifecycleStatusExpr}::text <> :deletedLifecycle`, {
        deletedLifecycle: LifecycleStatusOportunidade.DELETED,
      });
    }

    const todasOportunidades = (await queryBuilder.getRawMany()).map((opp) => ({
      estagio: this.fromDatabaseEstagio(opp.estagio),
      valor: Number(opp.valor || 0),
    }));

    const totalOportunidades = todasOportunidades.length;
    const valorTotalPipeline = todasOportunidades.reduce((sum, opp) => sum + Number(opp.valor), 0);

    const oportunidadesGanhas = todasOportunidades.filter(
      (opp) => opp.estagio === EstagioOportunidade.GANHO,
    );
    const valorGanho = oportunidadesGanhas.reduce((sum, opp) => sum + Number(opp.valor), 0);

    const taxaConversao =
      totalOportunidades > 0
        ? ((oportunidadesGanhas.length / totalOportunidades) * 100).toFixed(1)
        : 0;

    const valorMedio = totalOportunidades > 0 ? valorTotalPipeline / totalOportunidades : 0;

    const distribuicaoPorEstagio = {};
    this.canonicalStageOrder.forEach((estagio) => {
      const oportunidadesEstagio = todasOportunidades.filter((opp) => opp.estagio === estagio);
      distribuicaoPorEstagio[estagio] = {
        quantidade: oportunidadesEstagio.length,
        valor: oportunidadesEstagio.reduce((sum, opp) => sum + Number(opp.valor), 0),
      };
    });

    return {
      totalOportunidades,
      valorTotalPipeline,
      valorGanho,
      taxaConversao: Number(taxaConversao),
      valorMedio,
      distribuicaoPorEstagio,
    };
  }

  async getPipelineData(empresaId: string, filters?: OportunidadeLifecycleFilters) {
    const schema = await this.resolveOportunidadesSchema();
    const lifecycleEnabled = await this.isLifecycleEnabledForTenant({ empresaId, schema });
    const normalizedFilters: OportunidadeFindFilters = { ...(filters || {}) };

    if (
      lifecycleEnabled &&
      !normalizedFilters.lifecycle_status &&
      !normalizedFilters.lifecycle_view &&
      !this.parseBooleanFlag(normalizedFilters.include_deleted)
    ) {
      normalizedFilters.lifecycle_view = LifecycleViewOportunidade.OPEN;
    }

    const oportunidades = await this.findAll(empresaId, normalizedFilters);

    const pipeline = {};
    this.canonicalStageOrder.forEach((estagio) => {
      pipeline[estagio] = {
        id: estagio,
        title: this.getEstagioLabel(estagio),
        color: this.getEstagioColor(estagio),
        opportunities: oportunidades.filter((opp) => opp.estagio === estagio),
      };
    });

    return {
      stages: pipeline,
      stageOrder: this.canonicalStageOrder,
    };
  }

  private getEstagioLabel(estagio: EstagioOportunidade): string {
    const labels = {
      [EstagioOportunidade.LEADS]: 'Leads',
      [EstagioOportunidade.QUALIFICACAO]: 'Qualificacao',
      [EstagioOportunidade.PROPOSTA]: 'Proposta',
      [EstagioOportunidade.NEGOCIACAO]: 'Negociacao',
      [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
      [EstagioOportunidade.GANHO]: 'Ganho',
      [EstagioOportunidade.PERDIDO]: 'Perdido',
    };
    return labels[estagio];
  }

  private getEstagioColor(estagio: EstagioOportunidade): string {
    const colors = {
      [EstagioOportunidade.LEADS]: '#6B7280',
      [EstagioOportunidade.QUALIFICACAO]: '#3B82F6',
      [EstagioOportunidade.PROPOSTA]: '#F59E0B',
      [EstagioOportunidade.NEGOCIACAO]: '#8B5CF6',
      [EstagioOportunidade.FECHAMENTO]: '#06B6D4',
      [EstagioOportunidade.GANHO]: '#10B981',
      [EstagioOportunidade.PERDIDO]: '#EF4444',
    };
    return colors[estagio];
  }
}
