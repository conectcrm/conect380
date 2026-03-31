import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Oportunidade,
  EstagioOportunidade,
  OrigemOportunidade,
  LifecycleStatusOportunidade,
} from './oportunidade.entity';
import { Atividade, StatusAtividade, TipoAtividade } from './atividade.entity';
import { OportunidadeStageEvent } from './oportunidade-stage-event.entity';
import { DashboardV2JobsService } from '../dashboard-v2/dashboard-v2.jobs.service';
import { Lead, OrigemLead, StatusLead } from '../leads/lead.entity';
import { ClientesService } from '../clientes/clientes.service';
import { StatusCliente } from '../clientes/cliente.entity';
import {
  CreateOportunidadeDto,
  CreateOportunidadeItemPreliminarDto,
  LifecycleTransitionDto,
  LifecycleViewOportunidade,
  MetricasQueryDto,
  OportunidadesListQueryDto,
  UpdateOportunidadeItemPreliminarDto,
  UpdateOportunidadeDto,
  UpdateEstagioDto,
} from './dto/oportunidade.dto';
import { ConcluirAtividadeDto, CreateAtividadeDto } from './dto/atividade.dto';
import { FeatureFlagTenant } from '../dashboard-v2/entities/feature-flag-tenant.entity';
import { User, UserRole } from '../users/user.entity';
import { NotificationService } from '../../notifications/notification.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { createHash } from 'crypto';
import { OportunidadeItemPreliminar } from './oportunidade-item-preliminar.entity';

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
const SALES_PIPELINE_DRAFT_WITHOUT_PLACEHOLDER_FLAG_KEY =
  'sales.pipeline_draft_without_placeholder';
const SALES_OPPORTUNITY_PRELIMINARY_ITEMS_FLAG_KEY = 'sales.opportunity_preliminary_items';
const SALES_STRICT_PROPOSTA_TRANSITIONS_FLAG_KEY = 'sales.strict_proposta_transitions';
const SALES_DISCOUNT_POLICY_PER_TENANT_FLAG_KEY = 'sales.discount_policy_per_tenant';
const STALE_DEFAULT_THRESHOLD_DAYS = 30;
const STALE_DEFAULT_AUTO_ARCHIVE_DAYS = 60;
const STALE_MIN_DAYS = 7;
const STALE_MAX_DAYS = 365;
const STALE_DEFAULT_SCAN_LIMIT = 300;

const SALES_FEATURE_FLAG_KEY_MAP = {
  pipelineDraftWithoutPlaceholder: SALES_PIPELINE_DRAFT_WITHOUT_PLACEHOLDER_FLAG_KEY,
  opportunityPreliminaryItems: SALES_OPPORTUNITY_PRELIMINARY_ITEMS_FLAG_KEY,
  strictPropostaTransitions: SALES_STRICT_PROPOSTA_TRANSITIONS_FLAG_KEY,
  discountPolicyPerTenant: SALES_DISCOUNT_POLICY_PER_TENANT_FLAG_KEY,
} as const;

const SALES_FEATURE_DEFAULT_ENV_BY_NAME = {
  pipelineDraftWithoutPlaceholder: 'SALES_PIPELINE_DRAFT_WITHOUT_PLACEHOLDER_DEFAULT',
  opportunityPreliminaryItems: 'SALES_OPPORTUNITY_PRELIMINARY_ITEMS_DEFAULT',
  strictPropostaTransitions: 'SALES_STRICT_PROPOSTA_TRANSITIONS_DEFAULT',
  discountPolicyPerTenant: 'SALES_DISCOUNT_POLICY_PER_TENANT_DEFAULT',
} as const;

const SALES_FEATURE_DEFAULT_FALLBACK = {
  pipelineDraftWithoutPlaceholder: true,
  opportunityPreliminaryItems: true,
  strictPropostaTransitions: true,
  discountPolicyPerTenant: true,
} as const;

export type SalesFeatureFlagName = keyof typeof SALES_FEATURE_FLAG_KEY_MAP;
type SalesFeatureFlagKey = (typeof SALES_FEATURE_FLAG_KEY_MAP)[SalesFeatureFlagName];
const SALES_FEATURE_FLAG_NAME_LIST = Object.keys(
  SALES_FEATURE_FLAG_KEY_MAP,
) as SalesFeatureFlagName[];
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
type TenantFlagConfig = {
  source: TenantFlagSource;
  enabled: boolean;
  numericValue: number | null;
};

type StalePolicyDecision = {
  enabled: boolean;
  thresholdDays: number;
  source: TenantFlagSource;
  autoArchiveEnabled: boolean;
  autoArchiveAfterDays: number;
  autoArchiveSource: TenantFlagSource;
};

type SalesFeatureFlagDecisionItem = {
  flagKey: SalesFeatureFlagKey;
  enabled: boolean;
  source: TenantFlagSource;
};

export type SalesFeatureFlagsDecision = {
  pipelineDraftWithoutPlaceholder: SalesFeatureFlagDecisionItem;
  opportunityPreliminaryItems: SalesFeatureFlagDecisionItem;
  strictPropostaTransitions: SalesFeatureFlagDecisionItem;
  discountPolicyPerTenant: SalesFeatureFlagDecisionItem;
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

const OPORTUNIDADE_FORWARD_STAGE_ORDER: readonly EstagioOportunidade[] = [
  EstagioOportunidade.LEADS,
  EstagioOportunidade.QUALIFICACAO,
  EstagioOportunidade.PROPOSTA,
  EstagioOportunidade.NEGOCIACAO,
  EstagioOportunidade.FECHAMENTO,
];

const OPORTUNIDADE_STAGE_SKIP_PRIVILEGED_ROLES = new Set<string>([
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.GERENTE,
  'manager',
]);

export const OPORTUNIDADE_DEFAULT_PROBABILIDADE_BY_STAGE: Record<
  EstagioOportunidade,
  number
> = {
  [EstagioOportunidade.LEADS]: 20,
  [EstagioOportunidade.QUALIFICACAO]: 40,
  [EstagioOportunidade.PROPOSTA]: 60,
  [EstagioOportunidade.NEGOCIACAO]: 80,
  [EstagioOportunidade.FECHAMENTO]: 95,
  [EstagioOportunidade.GANHO]: 100,
  [EstagioOportunidade.PERDIDO]: 0,
};

export function isOportunidadeTerminalStage(stage?: EstagioOportunidade | string | null): boolean {
  const normalized = normalizeStageRuleInput(stage);
  return normalized === EstagioOportunidade.GANHO || normalized === EstagioOportunidade.PERDIDO;
}

export function getDefaultOportunidadeProbabilityByStage(
  stage?: EstagioOportunidade | string | null,
): number {
  const normalized = normalizeStageRuleInput(stage);
  if (!normalized) return 50;
  return OPORTUNIDADE_DEFAULT_PROBABILIDADE_BY_STAGE[normalized] ?? 50;
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

export function isOportunidadeForwardSkipTransition(
  currentStage?: EstagioOportunidade | string | null,
  nextStage?: EstagioOportunidade | string | null,
): boolean {
  const current = normalizeStageRuleInput(currentStage);
  const next = normalizeStageRuleInput(nextStage);
  if (!current || !next) return false;
  if (current === next) return false;

  const currentIndex = OPORTUNIDADE_FORWARD_STAGE_ORDER.indexOf(current);
  const nextIndex = OPORTUNIDADE_FORWARD_STAGE_ORDER.indexOf(next);

  if (currentIndex === -1 || nextIndex === -1) {
    return false;
  }

  return nextIndex - currentIndex > 1;
}

export function canBypassOportunidadeStageTransitionByRole(role?: UserRole | string | null): boolean {
  const normalizedRole = (role || '').toString().trim().toLowerCase();
  if (!normalizedRole) return false;
  return OPORTUNIDADE_STAGE_SKIP_PRIVILEGED_ROLES.has(normalizedRole);
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

type OportunidadeItemPreliminarPayload = {
  id: string;
  empresa_id: string;
  oportunidade_id: string;
  produto_id: string | null;
  catalog_item_id: string | null;
  nome_snapshot: string;
  sku_snapshot: string | null;
  descricao_snapshot: string | null;
  preco_unitario_estimado: number;
  quantidade_estimada: number;
  desconto_percentual: number;
  subtotal_estimado: number;
  origem: string;
  ordem: number;
  created_at: string | null;
  updated_at: string | null;
};

type OportunidadePreliminarItemAsPropostaProduto = {
  id: string;
  itemPreliminarId: string;
  produtoId?: string;
  catalogItemId?: string;
  nome: string;
  descricao?: string;
  precoUnitario: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
  origem: string;
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
  private itensPreliminaresTableAvailable?: boolean;

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
    @InjectRepository(OportunidadeItemPreliminar)
    private readonly oportunidadeItemPreliminarRepository: Repository<OportunidadeItemPreliminar>,
    @InjectRepository(FeatureFlagTenant)
    private readonly featureFlagRepository: Repository<FeatureFlagTenant>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly clientesService: ClientesService,
    @Optional()
    private readonly notificationService?: NotificationService,
    @Optional()
    private readonly dashboardV2JobsService?: DashboardV2JobsService,
  ) {}

  private formatCurrencyBrl(value: unknown): string {
    const parsed = Number(value ?? 0);
    const safeValue = Number.isFinite(parsed) ? parsed : 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(safeValue);
  }

  private getAtividadeTipoLabel(tipo?: TipoAtividade | string | null): string {
    switch (String(tipo || '').toLowerCase()) {
      case TipoAtividade.LIGACAO:
        return 'Ligacao';
      case TipoAtividade.EMAIL:
        return 'E-mail';
      case TipoAtividade.REUNIAO:
        return 'Reuniao';
      case TipoAtividade.TAREFA:
        return 'Tarefa';
      case TipoAtividade.NOTA:
      default:
        return 'Atividade';
    }
  }

  private async notifyAssignedUserOnActivityCreated(input: {
    empresaId: string;
    oportunidade: Oportunidade;
    atividade: Pick<Atividade, 'id' | 'tipo' | 'descricao' | 'dataAtividade' | 'responsavel_id'>;
    actorUserId?: string;
  }): Promise<void> {
    if (!this.notificationService) {
      return;
    }

    const assignedUserId = String(input.atividade.responsavel_id || '').trim();
    if (!assignedUserId) {
      return;
    }

    const actorUserId = String(input.actorUserId || '').trim();
    if (actorUserId && actorUserId === assignedUserId) {
      return;
    }

    try {
      const destinatario = await this.userRepository.findOne({
        where: {
          id: assignedUserId,
          empresa_id: input.empresaId,
          ativo: true,
        },
        select: ['id'],
      });

      if (!destinatario) {
        return;
      }

      const actorName = actorUserId
        ? (
            await this.userRepository.findOne({
              where: { id: actorUserId, empresa_id: input.empresaId },
              select: ['nome'],
            })
          )?.nome || 'Equipe comercial'
        : 'Equipe comercial';

      const oportunidadeTitulo = String(input.oportunidade.titulo || 'Oportunidade').trim();
      const tipoLabel = this.getAtividadeTipoLabel(input.atividade.tipo);
      const dataAtividade = new Date(input.atividade.dataAtividade || new Date());
      const dataAtividadeValida = Number.isNaN(dataAtividade.getTime()) ? new Date() : dataAtividade;
      const dataAtividadeLabel = dataAtividadeValida.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const title = 'Nova tarefa da pipeline';
      const message = `${actorName} atribuiu ${tipoLabel.toLowerCase()} para ${dataAtividadeLabel} na oportunidade "${oportunidadeTitulo}".`;

      await this.notificationService.create({
        empresaId: input.empresaId,
        userId: destinatario.id,
        type: NotificationType.SISTEMA,
        title,
        message,
        data: {
          category: 'comercial',
          event: 'atividade_atribuida',
          module: 'pipeline',
          oportunidadeId: String(input.oportunidade.id || ''),
          oportunidadeTitulo,
          atividadeId: String(input.atividade.id || ''),
          atividadeTipo: input.atividade.tipo,
          atividadeDescricao: String(input.atividade.descricao || ''),
          dataAtividade: dataAtividadeValida.toISOString(),
          assignedByUserId: actorUserId || null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao notificar responsavel por atividade atribuida (${input.atividade.id}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async notifyManagersOnWonOpportunity(input: {
    empresaId: string;
    oportunidade: Oportunidade;
    actorUserId?: string;
    source: 'update' | 'update_estagio';
  }): Promise<void> {
    if (!this.notificationService) {
      return;
    }

    try {
      let recipients = await this.userRepository.find({
        where: {
          empresa_id: input.empresaId,
          ativo: true,
          role: In([UserRole.GERENTE]),
        },
        select: ['id'],
      });

      // Fallback para administradores quando nao houver gerente ativo.
      if (recipients.length === 0) {
        recipients = await this.userRepository.find({
          where: {
            empresa_id: input.empresaId,
            ativo: true,
            role: In([UserRole.ADMIN, UserRole.SUPERADMIN]),
          },
          select: ['id'],
        });
      }

      if (recipients.length === 0) {
        return;
      }

      const actorIdNormalized =
        typeof input.actorUserId === 'string' ? input.actorUserId.trim() : '';
      const filteredRecipients = actorIdNormalized
        ? recipients.filter((recipient) => recipient.id !== actorIdNormalized)
        : recipients;
      if (filteredRecipients.length === 0) {
        return;
      }

      const actorCandidates = [input.actorUserId, input.oportunidade.responsavel_id].filter(
        (id): id is string => typeof id === 'string' && id.trim().length > 0,
      );
      const actor = actorCandidates.length
        ? await this.userRepository.findOne({
            where: {
              empresa_id: input.empresaId,
              id: In(actorCandidates),
            },
            select: ['id', 'nome'],
          })
        : null;
      const actorName = actor?.nome?.trim() || 'Equipe comercial';

      const oportunidadeTitulo = String(input.oportunidade.titulo || 'Oportunidade').trim();
      const valor = this.formatCurrencyBrl(input.oportunidade.valor);
      const title = 'Venda concluida no pipeline';
      const message = `${actorName} concluiu a oportunidade "${oportunidadeTitulo}" como ganha. Valor: ${valor}.`;

      const jobs = filteredRecipients.map((recipient) =>
        this.notificationService!.create({
          empresaId: input.empresaId,
          userId: recipient.id,
          type: NotificationType.SISTEMA,
          title,
          message,
          data: {
            category: 'comercial',
            event: 'venda_concluida',
            source: input.source,
            oportunidadeId: String(input.oportunidade.id || ''),
            oportunidadeTitulo,
            valor: Number(input.oportunidade.valor ?? 0),
            actorUserId: input.actorUserId || null,
          },
        }),
      );

      const settled = await Promise.allSettled(jobs);
      const failed = settled.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        this.logger.warn(
          `Falha ao entregar ${failed} notificacao(oes) de venda concluida para empresa ${input.empresaId}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Falha ao notificar gestores sobre venda concluida (${input.oportunidade.id}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async maybePromoteClienteFromWonOpportunity(input: {
    empresaId: string;
    oportunidade: Oportunidade;
  }): Promise<void> {
    const clienteIdRaw = (input.oportunidade as any).cliente_id;
    const clienteId = typeof clienteIdRaw === 'string' ? clienteIdRaw.trim() : '';
    if (!clienteId) {
      return;
    }

    try {
      const cliente = await this.clientesService.findById(clienteId, input.empresaId);
      if (!cliente) {
        return;
      }

      const currentStatus = (cliente as any).status as StatusCliente | undefined;
      if (currentStatus === StatusCliente.CLIENTE || currentStatus === StatusCliente.INATIVO) {
        return;
      }

      await this.clientesService.updateStatus(clienteId, input.empresaId, StatusCliente.CLIENTE);
    } catch (error) {
      this.logger.warn(
        `[OportunidadesService] Nao foi possivel promover cliente ${clienteId} para status cliente apos oportunidade ${input.oportunidade.id} ser marcada como ganha.`,
      );
      this.logger.debug(
        `[OportunidadesService] Detalhes: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

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

  private getPropostaEmailDetailsColumn(columns: Set<string>): string | null {
    if (columns.has('emailDetails')) {
      return '"emailDetails"';
    }

    if (columns.has('email_details')) {
      return 'email_details';
    }

    return null;
  }

  private buildPropostaFlowStatusExpression(alias: string, columns: Set<string>): string {
    const emailDetailsColumn = this.getPropostaEmailDetailsColumn(columns);
    if (!emailDetailsColumn) {
      return `${alias}.status::text`;
    }

    return `COALESCE(${alias}.${emailDetailsColumn}->>'fluxoStatus', ${alias}.status::text)`;
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

  private getFeatureFlagQueryTimeoutMs(): number {
    const parsed = Number(process.env.FEATURE_FLAGS_QUERY_TIMEOUT_MS || 5000);
    if (!Number.isFinite(parsed)) {
      return 5000;
    }

    return Math.min(Math.max(Math.floor(parsed), 1000), 60000);
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return promise;
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private isFeatureFlagTimeoutError(error: unknown): boolean {
    const message = String((error as any)?.message || '');
    if (!message) {
      return false;
    }

    return (
      message.includes('Timeout ao persistir feature flag') ||
      message.includes('Timeout ao consultar feature flag') ||
      message.includes('Timeout ao consultar feature flags comerciais')
    );
  }

  private resolveBooleanEnvFlag(envName: string, fallback: boolean): boolean {
    const rawValue = process.env[envName];
    if (rawValue === undefined || rawValue === null || String(rawValue).trim().length === 0) {
      return fallback;
    }

    return this.parseBooleanFlag(rawValue);
  }

  private getSalesFeatureDefaultByName(flagName: SalesFeatureFlagName): boolean {
    return this.resolveBooleanEnvFlag(
      SALES_FEATURE_DEFAULT_ENV_BY_NAME[flagName],
      SALES_FEATURE_DEFAULT_FALLBACK[flagName],
    );
  }

  private toSalesFeatureDecision(
    flagName: SalesFeatureFlagName,
    tenantFlag: {
      source: TenantFlagSource;
      enabled: boolean;
      numericValue: number | null;
    },
  ): SalesFeatureFlagDecisionItem {
    const flagKey = SALES_FEATURE_FLAG_KEY_MAP[flagName];
    if (tenantFlag.source === 'tenant') {
      return {
        flagKey,
        enabled: tenantFlag.enabled,
        source: 'tenant',
      };
    }

    return {
      flagKey,
      enabled: this.getSalesFeatureDefaultByName(flagName),
      source: 'default',
    };
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
      responsavelColumn: columns.has('responsavel_id') ? 'responsavel_id' : null,
      dateColumn: columns.has('data') ? 'data' : 'dataAtividade',
      createdAtColumn: columns.has('criado_em') ? 'criado_em' : 'createdAt',
      titleColumn: columns.has('titulo') ? 'titulo' : null,
      statusColumn: columns.has('status') ? 'status' : null,
      completionResultColumn: columns.has('resultado_conclusao')
        ? 'resultado_conclusao'
        : columns.has('resultadoConclusao')
          ? 'resultadoConclusao'
          : null,
      completedByColumn: columns.has('concluido_por')
        ? 'concluido_por'
        : columns.has('concluidoPor')
          ? 'concluidoPor'
          : null,
      completedAtColumn: columns.has('concluido_em')
        ? 'concluido_em'
        : columns.has('concluidoEm')
          ? 'concluidoEm'
          : null,
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

    try {
      const columns = await this.withTimeout(
        this.getTableColumns('feature_flags_tenant'),
        this.getFeatureFlagQueryTimeoutMs(),
        'Timeout ao verificar metadata da tabela de feature flags',
      );

      this.featureFlagsTableAvailable =
        columns.has('empresa_id') &&
        columns.has('flag_key') &&
        columns.has('enabled') &&
        columns.has('rollout_percentage');
    } catch (error: any) {
      this.logger.warn(
        `Falha ao verificar disponibilidade da tabela de feature flags: ${error?.message || error}`,
      );
      this.featureFlagsTableAvailable = false;
    }

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
      const flag = await this.withTimeout(
        this.featureFlagRepository.findOne({
          where: {
            empresa_id: empresaId,
            flag_key: OPORTUNIDADES_LIFECYCLE_FLAG_KEY,
          },
        }),
        this.getFeatureFlagQueryTimeoutMs(),
        `Timeout ao consultar feature flag ${OPORTUNIDADES_LIFECYCLE_FLAG_KEY}`,
      );

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

  private async isItensPreliminaresTableAvailable(): Promise<boolean> {
    if (this.itensPreliminaresTableAvailable !== undefined) {
      return this.itensPreliminaresTableAvailable;
    }

    try {
      const columns = await this.getTableColumns('oportunidade_itens_preliminares');
      this.itensPreliminaresTableAvailable =
        columns.has('empresa_id') &&
        columns.has('oportunidade_id') &&
        columns.has('nome_snapshot') &&
        columns.has('preco_unitario_estimado') &&
        columns.has('quantidade_estimada');
    } catch {
      this.itensPreliminaresTableAvailable = false;
    }

    if (!this.itensPreliminaresTableAvailable) {
      this.logger.warn(
        'Tabela "oportunidade_itens_preliminares" indisponivel. Fluxo segue sem pre-preenchimento de proposta.',
      );
    }

    return this.itensPreliminaresTableAvailable;
  }

  private async assertItensPreliminaresTableAvailable(): Promise<void> {
    if (await this.isItensPreliminaresTableAvailable()) {
      return;
    }

    throw new BadRequestException(
      'Itens preliminares indisponiveis neste ambiente. Execute as migrations pendentes.',
    );
  }

  private async isOpportunityPreliminaryItemsFeatureEnabled(empresaId: string): Promise<boolean> {
    return this.isSalesFeatureEnabledForTenant(empresaId, 'opportunityPreliminaryItems');
  }

  private async assertOpportunityPreliminaryItemsFeatureEnabled(empresaId: string): Promise<void> {
    if (await this.isOpportunityPreliminaryItemsFeatureEnabled(empresaId)) {
      return;
    }

    throw new BadRequestException(
      'Itens preliminares desabilitados para esta empresa. Ative a feature flag sales.opportunity_preliminary_items.',
    );
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
    const propostasColumns = await this.getTableColumns('propostas');
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
    const hasPropostaPrincipalColumn = schema.columns.has('proposta_principal_id');
    const propostaPrincipalStatusExpr = hasPropostaPrincipalColumn
      ? this.buildPropostaFlowStatusExpression('proposta_principal', propostasColumns)
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

    if (hasPropostaPrincipalColumn) {
      queryBuilder
        .leftJoin(
          'propostas',
          'proposta_principal',
          'proposta_principal.id::text = oportunidade.proposta_principal_id::text AND proposta_principal.empresa_id = oportunidade.empresa_id',
        )
        .addSelect('oportunidade.proposta_principal_id::text', 'proposta_principal_id')
        .addSelect('proposta_principal.id::text', 'proposta_principal__id')
        .addSelect('proposta_principal.numero', 'proposta_principal__numero')
        .addSelect('proposta_principal.titulo', 'proposta_principal__titulo')
        .addSelect(propostaPrincipalStatusExpr, 'proposta_principal__status');
    }

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
      proposta_principal_id: item.proposta_principal_id ?? null,
      propostaPrincipal: item.proposta_principal__id
        ? {
            id: item.proposta_principal__id,
            numero: item.proposta_principal__numero || '',
            titulo: item.proposta_principal__titulo || '',
            status: item.proposta_principal__status || 'rascunho',
            sugerePerda: ['rejeitada', 'expirada'].includes(
              String(item.proposta_principal__status || '').trim().toLowerCase(),
            ),
          }
        : undefined,
      atividades: [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) as unknown as Oportunidade[];
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

        if (lifecycleEnabled && nextStage === EstagioOportunidade.GANHO) {
          throw new BadRequestException(
            'Para marcar como ganho, use PATCH /oportunidades/:id/estagio.',
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

      if (schema.columns.has('probabilidade') && updateOportunidadeDto.probabilidade === undefined) {
        updateData.probabilidade = getDefaultOportunidadeProbabilityByStage(nextStage);
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

    const becameWonNow =
      estagioAnterior !== EstagioOportunidade.GANHO &&
      oportunidadeAtualizada.estagio === EstagioOportunidade.GANHO;
    if (becameWonNow) {
      void this.notifyManagersOnWonOpportunity({
        empresaId,
        oportunidade: oportunidadeAtualizada,
        actorUserId: actorUserId ?? oportunidade.responsavel_id,
        source: 'update',
      });
      await this.maybePromoteClienteFromWonOpportunity({
        empresaId,
        oportunidade: oportunidadeAtualizada,
      });
    }

    return oportunidadeAtualizada;
  }

  async updateEstagio(
    id: string,
    updateEstagioDto: UpdateEstagioDto,
    empresaId: string,
    actorUserId?: string,
    actorRole?: UserRole | string | null,
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

    const transitionAllowed = isOportunidadeStageTransitionAllowed(currentStage, nextStage);
    const forwardSkipRequested = isOportunidadeForwardSkipTransition(currentStage, nextStage);
    const forcedTransitionRequested = Boolean(updateEstagioDto.forcarTransicao);
    const justificativaForcamento = (updateEstagioDto.justificativaForcamento || '').trim();
    const canBypassTransitionRule = canBypassOportunidadeStageTransitionByRole(actorRole);

    if (!transitionAllowed) {
      if (!(forwardSkipRequested && forcedTransitionRequested)) {
        const allowed = getAllowedNextOportunidadeStages(currentStage);
        throw new BadRequestException(
          `Transicao de estagio invalida: ${currentStage} -> ${nextStage}. Permitidos: ${allowed.join(', ') || 'nenhum'}`,
        );
      }

      if (!canBypassTransitionRule) {
        throw new ForbiddenException(
          'Somente gerente, admin ou superadmin podem pular etapas no pipeline.',
        );
      }

      if (!justificativaForcamento) {
        throw new BadRequestException(
          'justificativaForcamento e obrigatoria para pular etapas no pipeline.',
        );
      }
    }

    const stageSkipBypassed = !transitionAllowed && forwardSkipRequested && forcedTransitionRequested;

    if (updateEstagioDto.forcarTransicao && !stageSkipBypassed) {
      const allowed = getAllowedNextOportunidadeStages(currentStage);
      throw new BadRequestException(
        `forcarTransicao so pode ser usado em pulo de etapa forward. Permitidos no fluxo normal a partir de ${currentStage}: ${allowed.join(', ') || 'nenhum'}.`,
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

    if (schema.columns.has('probabilidade')) {
      updatePayload.probabilidade = getDefaultOportunidadeProbabilityByStage(nextStage);
    }

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
      source: stageSkipBypassed ? 'update_estagio_forcado' : 'update_estagio',
    });

    const descricao = stageSkipBypassed
      ? [
          `Movido para estagio: ${nextStage} (pulo de etapa autorizado)`,
          `Justificativa: ${justificativaForcamento}`,
        ].join('\n')
      : nextStage === EstagioOportunidade.GANHO
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

    const becameWonNow =
      currentStage !== EstagioOportunidade.GANHO &&
      oportunidadeAtualizada.estagio === EstagioOportunidade.GANHO;
    if (becameWonNow) {
      void this.notifyManagersOnWonOpportunity({
        empresaId,
        oportunidade: oportunidadeAtualizada,
        actorUserId: actorUserId ?? oportunidade.responsavel_id,
        source: 'update_estagio',
      });
      await this.maybePromoteClienteFromWonOpportunity({
        empresaId,
        oportunidade: oportunidadeAtualizada,
      });
    }

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

    try {
      await this.withTimeout(
        this.featureFlagRepository
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
          .execute(),
        this.getFeatureFlagQueryTimeoutMs(),
        `Timeout ao persistir feature flag ${OPORTUNIDADES_LIFECYCLE_FLAG_KEY}`,
      );
    } catch (error) {
      if (this.isFeatureFlagTimeoutError(error)) {
        throw new ServiceUnavailableException(
          'Nao foi possivel salvar a configuracao de lifecycle agora. Tente novamente em instantes.',
        );
      }
      throw error;
    }

    return this.resolveLifecycleFeatureFlagDecision(input.empresaId);
  }

  async getSalesFeatureFlags(empresaId: string): Promise<SalesFeatureFlagsDecision> {
    const normalizedEmpresaId = String(empresaId || '').trim();
    const decisions: Partial<SalesFeatureFlagsDecision> = {};
    const flagKeys = SALES_FEATURE_FLAG_NAME_LIST.map((flagName) => SALES_FEATURE_FLAG_KEY_MAP[flagName]);
    const tenantFlagsByKey = normalizedEmpresaId
      ? await this.resolveTenantFlagConfigs(normalizedEmpresaId, flagKeys)
      : new Map<string, TenantFlagConfig>();

    for (const flagName of SALES_FEATURE_FLAG_NAME_LIST) {
      const flagKey = SALES_FEATURE_FLAG_KEY_MAP[flagName];
      const tenantFlag = tenantFlagsByKey.get(flagKey) || this.buildDefaultTenantFlagConfig();

      decisions[flagName] = this.toSalesFeatureDecision(flagName, tenantFlag);
    }

    return decisions as SalesFeatureFlagsDecision;
  }

  async isSalesFeatureEnabledForTenant(
    empresaId: string | null | undefined,
    flagName: SalesFeatureFlagName,
  ): Promise<boolean> {
    const normalizedEmpresaId = String(empresaId || '').trim();
    if (!normalizedEmpresaId) {
      return this.getSalesFeatureDefaultByName(flagName);
    }

    const tenantFlag = await this.resolveTenantFlagConfig(
      normalizedEmpresaId,
      SALES_FEATURE_FLAG_KEY_MAP[flagName],
    );
    return this.toSalesFeatureDecision(flagName, tenantFlag).enabled;
  }

  async setSalesFeatureFlags(input: {
    empresaId: string;
    pipelineDraftWithoutPlaceholder?: boolean;
    opportunityPreliminaryItems?: boolean;
    strictPropostaTransitions?: boolean;
    discountPolicyPerTenant?: boolean;
    updatedBy?: string | null;
  }): Promise<SalesFeatureFlagsDecision> {
    if (!(await this.isFeatureFlagsTableAvailable())) {
      throw new BadRequestException(
        'Tabela de feature flags indisponivel. Execute as migrations antes de configurar as flags comerciais.',
      );
    }

    const updates: Array<{
      flagName: SalesFeatureFlagName;
      enabled: boolean;
    }> = [];

    const queueUpdate = (flagName: SalesFeatureFlagName, enabled?: boolean) => {
      if (enabled === undefined) {
        return;
      }

      updates.push({
        flagName,
        enabled: Boolean(enabled),
      });
    };

    queueUpdate('pipelineDraftWithoutPlaceholder', input.pipelineDraftWithoutPlaceholder);
    queueUpdate('opportunityPreliminaryItems', input.opportunityPreliminaryItems);
    queueUpdate('strictPropostaTransitions', input.strictPropostaTransitions);
    queueUpdate('discountPolicyPerTenant', input.discountPolicyPerTenant);

    if (updates.length === 0) {
      throw new BadRequestException(
        'Informe pelo menos uma flag comercial para atualizar.',
      );
    }

    try {
      for (const update of updates) {
        await this.upsertTenantFlagConfig({
          empresaId: input.empresaId,
          flagKey: SALES_FEATURE_FLAG_KEY_MAP[update.flagName],
          enabled: update.enabled,
          numericValue: 0,
          updatedBy: input.updatedBy || null,
        });
      }
    } catch (error) {
      if (this.isFeatureFlagTimeoutError(error)) {
        throw new ServiceUnavailableException(
          'Nao foi possivel salvar as flags comerciais agora. Tente novamente em instantes.',
        );
      }
      throw error;
    }

    return this.getSalesFeatureFlags(input.empresaId);
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

  private buildDefaultTenantFlagConfig(): TenantFlagConfig {
    return {
      source: 'default',
      enabled: false,
      numericValue: null,
    };
  }

  private async resolveTenantFlagConfigs(
    empresaId: string,
    flagKeys: string[],
  ): Promise<Map<string, TenantFlagConfig>> {
    const normalizedKeys = Array.from(
      new Set(
        flagKeys
          .map((flagKey) => String(flagKey || '').trim())
          .filter((flagKey) => flagKey.length > 0),
      ),
    );

    const fallbackByKey = new Map<string, TenantFlagConfig>();
    for (const flagKey of normalizedKeys) {
      fallbackByKey.set(flagKey, this.buildDefaultTenantFlagConfig());
    }

    if (!normalizedKeys.length) {
      return fallbackByKey;
    }

    if (!(await this.isFeatureFlagsTableAvailable())) {
      return fallbackByKey;
    }

    try {
      const flags = await this.withTimeout(
        this.featureFlagRepository.find({
          where: {
            empresa_id: empresaId,
            flag_key: In(normalizedKeys),
          },
        }),
        this.getFeatureFlagQueryTimeoutMs(),
        `Timeout ao consultar feature flags comerciais (${normalizedKeys.length})`,
      );

      for (const flag of flags) {
        const flagKey = String(flag.flag_key || '').trim();
        if (!flagKey || !fallbackByKey.has(flagKey)) {
          continue;
        }

        fallbackByKey.set(flagKey, {
          source: 'tenant',
          enabled: Boolean(flag.enabled),
          numericValue: Number.isFinite(Number(flag.rollout_percentage))
            ? Number(flag.rollout_percentage)
            : null,
        });
      }

      return fallbackByKey;
    } catch (error: any) {
      this.logger.warn(
        `Falha ao resolver configuracao das flags comerciais: ${error?.message || error}`,
      );
      return fallbackByKey;
    }
  }

  private async resolveTenantFlagConfig(empresaId: string, flagKey: string): Promise<TenantFlagConfig> {
    const configs = await this.resolveTenantFlagConfigs(empresaId, [flagKey]);
    return configs.get(flagKey) || this.buildDefaultTenantFlagConfig();
  }

  private async upsertTenantFlagConfig(input: {
    empresaId: string;
    flagKey: string;
    enabled: boolean;
    numericValue: number;
    updatedBy?: string | null;
  }): Promise<void> {
    const sql = `
      INSERT INTO feature_flags_tenant (
        empresa_id,
        flag_key,
        enabled,
        rollout_percentage,
        updated_by,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (empresa_id, flag_key)
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        rollout_percentage = EXCLUDED.rollout_percentage,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at
    `;

    const params = [
      input.empresaId,
      input.flagKey,
      input.enabled,
      Math.max(0, Math.floor(Number(input.numericValue) || 0)),
      input.updatedBy || null,
    ];

    try {
      await this.withTimeout(
        this.featureFlagRepository.query(sql, params),
        this.getFeatureFlagQueryTimeoutMs(),
        `Timeout ao persistir feature flag ${input.flagKey}`,
      );
    } catch (error) {
      throw error;
    }
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

    try {
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
    } catch (error) {
      if (this.isFeatureFlagTimeoutError(error)) {
        throw new ServiceUnavailableException(
          'Nao foi possivel salvar a politica de stale deals agora. Tente novamente em instantes.',
        );
      }
      throw error;
    }

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

    if (schema.columns.has('probabilidade')) {
      updatePayload.probabilidade = getDefaultOportunidadeProbabilityByStage(reopenedStage);
    }

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

  private toFiniteNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeItemPreliminarCurrency(value: unknown, fallback = 0): number {
    const normalized = this.toFiniteNumber(value, fallback);
    if (normalized < 0) {
      return 0;
    }
    return Number(normalized.toFixed(2));
  }

  private normalizeItemPreliminarQuantity(value: unknown, fallback = 1): number {
    const normalized = this.toFiniteNumber(value, fallback);
    const safe = normalized > 0 ? normalized : fallback;
    return Number(safe.toFixed(3));
  }

  private normalizeItemPreliminarDiscount(value: unknown, fallback = 0): number {
    const normalized = this.toFiniteNumber(value, fallback);
    const clamped = Math.min(Math.max(normalized, 0), 100);
    return Number(clamped.toFixed(2));
  }

  private normalizeItemPreliminarOrder(value: unknown, fallback = 0): number {
    const normalized = Math.floor(this.toFiniteNumber(value, fallback));
    return normalized >= 0 ? normalized : fallback;
  }

  private calculateItemPreliminarSubtotal(
    precoUnitario: number,
    quantidade: number,
    descontoPercentual: number,
  ): number {
    const bruto = precoUnitario * quantidade;
    const desconto = bruto * (descontoPercentual / 100);
    const liquido = Math.max(bruto - desconto, 0);
    return Number(liquido.toFixed(2));
  }

  private mapItemPreliminarEntityToPayload(
    item: OportunidadeItemPreliminar,
  ): OportunidadeItemPreliminarPayload {
    return {
      id: String(item.id),
      empresa_id: item.empresa_id,
      oportunidade_id: String(item.oportunidade_id),
      produto_id: item.produto_id || null,
      catalog_item_id: item.catalog_item_id || null,
      nome_snapshot: item.nome_snapshot,
      sku_snapshot: item.sku_snapshot || null,
      descricao_snapshot: item.descricao_snapshot || null,
      preco_unitario_estimado: this.normalizeItemPreliminarCurrency(item.preco_unitario_estimado, 0),
      quantidade_estimada: this.normalizeItemPreliminarQuantity(item.quantidade_estimada, 1),
      desconto_percentual: this.normalizeItemPreliminarDiscount(item.desconto_percentual, 0),
      subtotal_estimado: this.normalizeItemPreliminarCurrency(item.subtotal_estimado, 0),
      origem: String(item.origem || 'manual'),
      ordem: this.normalizeItemPreliminarOrder(item.ordem, 0),
      created_at: this.toIsoStringOrNull(item.created_at),
      updated_at: this.toIsoStringOrNull(item.updated_at),
    };
  }

  private async resolveCanonicalOportunidadeId(
    oportunidadeId: string,
    empresaId: string,
  ): Promise<string> {
    const oportunidade = await this.findOne(oportunidadeId, empresaId);
    return String(oportunidade.id);
  }

  private async resolveNextItemPreliminarOrder(
    empresaId: string,
    oportunidadeId: string,
  ): Promise<number> {
    const rows = await this.oportunidadeItemPreliminarRepository.query(
      `
        SELECT COALESCE(MAX(ordem), -1)::int AS max_ordem
        FROM oportunidade_itens_preliminares
        WHERE empresa_id = $1
          AND oportunidade_id = $2
      `,
      [empresaId, oportunidadeId],
    );

    const currentMax = this.toFiniteNumber(rows?.[0]?.max_ordem, -1);
    return Math.max(Math.floor(currentMax) + 1, 0);
  }

  private async findItemPreliminarOrThrow(
    itemId: string,
    empresaId: string,
    oportunidadeId: string,
  ): Promise<OportunidadeItemPreliminar> {
    const item = await this.oportunidadeItemPreliminarRepository.findOne({
      where: {
        id: itemId,
        empresa_id: empresaId,
        oportunidade_id: oportunidadeId,
      },
    });

    if (!item) {
      throw new NotFoundException('Item preliminar nao encontrado para esta oportunidade');
    }

    return item;
  }

  async listarItensPreliminares(
    oportunidadeId: string,
    empresaId: string,
  ): Promise<OportunidadeItemPreliminarPayload[]> {
    const canonicalOportunidadeId = await this.resolveCanonicalOportunidadeId(
      oportunidadeId,
      empresaId,
    );
    if (!(await this.isOpportunityPreliminaryItemsFeatureEnabled(empresaId))) {
      return [];
    }
    if (!(await this.isItensPreliminaresTableAvailable())) {
      return [];
    }

    const itens = await this.oportunidadeItemPreliminarRepository.find({
      where: {
        empresa_id: empresaId,
        oportunidade_id: canonicalOportunidadeId,
      },
      order: {
        ordem: 'ASC',
        created_at: 'ASC',
      },
    });

    return itens.map((item) => this.mapItemPreliminarEntityToPayload(item));
  }

  async criarItemPreliminar(
    oportunidadeId: string,
    createDto: CreateOportunidadeItemPreliminarDto,
    empresaId: string,
  ): Promise<OportunidadeItemPreliminarPayload> {
    await this.assertOpportunityPreliminaryItemsFeatureEnabled(empresaId);
    const canonicalOportunidadeId = await this.resolveCanonicalOportunidadeId(
      oportunidadeId,
      empresaId,
    );
    await this.assertItensPreliminaresTableAvailable();
    const nomeSnapshot = String(createDto.nome_snapshot || '').trim();
    if (!nomeSnapshot) {
      throw new BadRequestException('nome_snapshot e obrigatorio para criar item preliminar');
    }

    const precoUnitario = this.normalizeItemPreliminarCurrency(createDto.preco_unitario_estimado, 0);
    const quantidade = this.normalizeItemPreliminarQuantity(createDto.quantidade_estimada, 1);
    const descontoPercentual = this.normalizeItemPreliminarDiscount(
      createDto.desconto_percentual,
      0,
    );
    const subtotalEstimado = this.calculateItemPreliminarSubtotal(
      precoUnitario,
      quantidade,
      descontoPercentual,
    );

    const ordem =
      createDto.ordem !== undefined
        ? this.normalizeItemPreliminarOrder(createDto.ordem, 0)
        : await this.resolveNextItemPreliminarOrder(empresaId, canonicalOportunidadeId);

    const item = this.oportunidadeItemPreliminarRepository.create({
      empresa_id: empresaId,
      oportunidade_id: canonicalOportunidadeId,
      produto_id: createDto.produto_id || null,
      catalog_item_id: createDto.catalog_item_id || null,
      nome_snapshot: nomeSnapshot,
      sku_snapshot: createDto.sku_snapshot?.trim() || null,
      descricao_snapshot: createDto.descricao_snapshot?.trim() || null,
      preco_unitario_estimado: precoUnitario,
      quantidade_estimada: quantidade,
      desconto_percentual: descontoPercentual,
      subtotal_estimado: subtotalEstimado,
      origem: String(createDto.origem || 'manual').trim() || 'manual',
      ordem,
    });

    const saved = await this.oportunidadeItemPreliminarRepository.save(item);
    return this.mapItemPreliminarEntityToPayload(saved);
  }

  async atualizarItemPreliminar(
    oportunidadeId: string,
    itemId: string,
    updateDto: UpdateOportunidadeItemPreliminarDto,
    empresaId: string,
  ): Promise<OportunidadeItemPreliminarPayload> {
    await this.assertOpportunityPreliminaryItemsFeatureEnabled(empresaId);
    const canonicalOportunidadeId = await this.resolveCanonicalOportunidadeId(
      oportunidadeId,
      empresaId,
    );
    await this.assertItensPreliminaresTableAvailable();
    const item = await this.findItemPreliminarOrThrow(itemId, empresaId, canonicalOportunidadeId);

    if (updateDto.produto_id !== undefined) {
      item.produto_id = updateDto.produto_id || null;
    }

    if (updateDto.catalog_item_id !== undefined) {
      item.catalog_item_id = updateDto.catalog_item_id || null;
    }

    if (updateDto.nome_snapshot !== undefined) {
      const nomeSnapshot = String(updateDto.nome_snapshot || '').trim();
      if (!nomeSnapshot) {
        throw new BadRequestException('nome_snapshot nao pode ser vazio');
      }
      item.nome_snapshot = nomeSnapshot;
    }

    if (updateDto.sku_snapshot !== undefined) {
      item.sku_snapshot = updateDto.sku_snapshot?.trim() || null;
    }

    if (updateDto.descricao_snapshot !== undefined) {
      item.descricao_snapshot = updateDto.descricao_snapshot?.trim() || null;
    }

    if (updateDto.origem !== undefined) {
      item.origem = String(updateDto.origem || 'manual').trim() || 'manual';
    }

    if (updateDto.ordem !== undefined) {
      item.ordem = this.normalizeItemPreliminarOrder(updateDto.ordem, item.ordem || 0);
    }

    const precoUnitario = this.normalizeItemPreliminarCurrency(
      updateDto.preco_unitario_estimado ?? item.preco_unitario_estimado,
      0,
    );
    const quantidade = this.normalizeItemPreliminarQuantity(
      updateDto.quantidade_estimada ?? item.quantidade_estimada,
      1,
    );
    const descontoPercentual = this.normalizeItemPreliminarDiscount(
      updateDto.desconto_percentual ?? item.desconto_percentual,
      0,
    );

    item.preco_unitario_estimado = precoUnitario;
    item.quantidade_estimada = quantidade;
    item.desconto_percentual = descontoPercentual;
    item.subtotal_estimado = this.calculateItemPreliminarSubtotal(
      precoUnitario,
      quantidade,
      descontoPercentual,
    );

    const saved = await this.oportunidadeItemPreliminarRepository.save(item);
    return this.mapItemPreliminarEntityToPayload(saved);
  }

  async removerItemPreliminar(
    oportunidadeId: string,
    itemId: string,
    empresaId: string,
  ): Promise<{ success: true; message: string; id: string }> {
    await this.assertOpportunityPreliminaryItemsFeatureEnabled(empresaId);
    const canonicalOportunidadeId = await this.resolveCanonicalOportunidadeId(
      oportunidadeId,
      empresaId,
    );
    await this.assertItensPreliminaresTableAvailable();
    const item = await this.findItemPreliminarOrThrow(itemId, empresaId, canonicalOportunidadeId);
    await this.oportunidadeItemPreliminarRepository.remove(item);

    return {
      success: true,
      message: 'Item preliminar removido com sucesso',
      id: itemId,
    };
  }

  mapearItensPreliminaresParaProdutosProposta(
    itensPreliminares: OportunidadeItemPreliminarPayload[],
  ): OportunidadePreliminarItemAsPropostaProduto[] {
    if (!Array.isArray(itensPreliminares) || itensPreliminares.length === 0) {
      return [];
    }

    return itensPreliminares.map((item) => ({
      id: item.id,
      itemPreliminarId: item.id,
      produtoId: item.produto_id || undefined,
      catalogItemId: item.catalog_item_id || undefined,
      nome: item.nome_snapshot,
      descricao: item.descricao_snapshot || undefined,
      precoUnitario: this.normalizeItemPreliminarCurrency(item.preco_unitario_estimado, 0),
      quantidade: this.normalizeItemPreliminarQuantity(item.quantidade_estimada, 1),
      desconto: this.normalizeItemPreliminarDiscount(item.desconto_percentual, 0),
      subtotal: Number.isFinite(Number(item.subtotal_estimado))
        ? this.normalizeItemPreliminarCurrency(item.subtotal_estimado, 0)
        : this.calculateItemPreliminarSubtotal(
            this.normalizeItemPreliminarCurrency(item.preco_unitario_estimado, 0),
            this.normalizeItemPreliminarQuantity(item.quantidade_estimada, 1),
            this.normalizeItemPreliminarDiscount(item.desconto_percentual, 0),
          ),
      origem: 'oportunidade_item_preliminar',
    }));
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

    let responsavelAtividadeId: string | null = null;
    if (atividadeSchema.responsavelColumn && createAtividadeDto.responsavel_id) {
      const responsavel = await this.userRepository.findOne({
        where: {
          id: createAtividadeDto.responsavel_id,
          empresa_id: context.empresaId,
        },
        select: ['id'],
      });

      if (!responsavel) {
        throw new BadRequestException(
          'Responsavel informado para a atividade nao pertence a empresa atual.',
        );
      }

      responsavelAtividadeId = responsavel.id;
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

    if (atividadeSchema.statusColumn) {
      columns.push(atividadeSchema.statusColumn);
      values.push(StatusAtividade.PENDENTE);
    }

    if (atividadeSchema.responsavelColumn) {
      columns.push(atividadeSchema.responsavelColumn);
      values.push(responsavelAtividadeId);
    }

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
          ${
            atividadeSchema.statusColumn
              ? `${this.quoteIdentifier(atividadeSchema.statusColumn)} AS "status",`
              : `'${StatusAtividade.PENDENTE}'::varchar AS "status",`
          }
          ${
            atividadeSchema.responsavelColumn
              ? `${this.quoteIdentifier(atividadeSchema.responsavelColumn)} AS "responsavel_id",`
              : 'NULL::uuid AS "responsavel_id",'
          }
          ${
            atividadeSchema.completionResultColumn
              ? `${this.quoteIdentifier(atividadeSchema.completionResultColumn)} AS "resultado_conclusao",`
              : 'NULL::text AS "resultado_conclusao",'
          }
          ${
            atividadeSchema.completedByColumn
              ? `${this.quoteIdentifier(atividadeSchema.completedByColumn)} AS "concluido_por",`
              : 'NULL::uuid AS "concluido_por",'
          }
          ${
            atividadeSchema.completedAtColumn
              ? `${this.quoteIdentifier(atividadeSchema.completedAtColumn)} AS "concluido_em",`
              : 'NULL::timestamptz AS "concluido_em",'
          }
          ${this.quoteIdentifier(atividadeSchema.dateColumn)} AS "dataAtividade",
          ${this.quoteIdentifier(atividadeSchema.createdAtColumn)} AS "createdAt"
      `,
      values,
    );

    const atividade = insertResult?.[0];
    const atividadePayload = {
      id: atividade.id,
      empresa_id: atividade.empresa_id,
      tipo: atividade.tipo,
      descricao: atividade.descricao,
      status: atividade.status || StatusAtividade.PENDENTE,
      resultadoConclusao: atividade.resultado_conclusao ?? null,
      oportunidade_id: atividade.oportunidade_id,
      criado_por_id: atividade.criado_por_id,
      responsavel_id: atividade.responsavel_id,
      concluido_por: atividade.concluido_por ?? null,
      concluidoEm: atividade.concluido_em ?? null,
      dataAtividade: atividade.dataAtividade,
      createdAt: atividade.createdAt,
      criadoPor: undefined,
      responsavel: undefined,
      concluidoPor: undefined,
    } as Atividade;

    await this.notifyAssignedUserOnActivityCreated({
      empresaId: context.empresaId,
      oportunidade,
      atividade: atividadePayload,
      actorUserId: context.userId,
    });

    return atividadePayload;
  }

  async listarAtividades(oportunidadeId: string, empresaId: string): Promise<Atividade[]> {
    const atividadeSchema = await this.resolveAtividadesSchema();
    const usersColumns = await this.getTableColumns('users');
    const oportunidade = await this.findOne(oportunidadeId, empresaId, { include_deleted: true });

    if (!oportunidade) {
      throw new NotFoundException('Oportunidade nao encontrada para esta empresa');
    }

    const userRef = `atividade.${this.quoteIdentifier(atividadeSchema.userColumn)}`;
    const responsavelRef = atividadeSchema.responsavelColumn
      ? `atividade.${this.quoteIdentifier(atividadeSchema.responsavelColumn)}`
      : null;
    const completedByRef = atividadeSchema.completedByColumn
      ? `atividade.${this.quoteIdentifier(atividadeSchema.completedByColumn)}`
      : null;
    const statusRef = atividadeSchema.statusColumn
      ? `atividade.${this.quoteIdentifier(atividadeSchema.statusColumn)}`
      : `'${StatusAtividade.PENDENTE}'`;
    const completionResultRef = atividadeSchema.completionResultColumn
      ? `atividade.${this.quoteIdentifier(atividadeSchema.completionResultColumn)}`
      : 'NULL::text';
    const completedAtRef = atividadeSchema.completedAtColumn
      ? `atividade.${this.quoteIdentifier(atividadeSchema.completedAtColumn)}`
      : 'NULL::timestamptz';
    const dateRef = `atividade.${this.quoteIdentifier(atividadeSchema.dateColumn)}`;
    const createdRef = `atividade.${this.quoteIdentifier(atividadeSchema.createdAtColumn)}`;
    const usuarioAvatarExpr = usersColumns.has('avatar_url') ? 'usuario.avatar_url' : 'NULL';
    const responsavelAvatarExpr = usersColumns.has('avatar_url') ? 'responsavel.avatar_url' : 'NULL';
    const concluidoPorAvatarExpr = usersColumns.has('avatar_url') ? 'concluido_por_user.avatar_url' : 'NULL';

    const queryBuilder = this.atividadeRepository
      .createQueryBuilder('atividade')
      .leftJoin('users', 'usuario', `usuario.id = ${userRef}`)
      .select('atividade.id', 'id')
      .addSelect('atividade.empresa_id', 'empresa_id')
      .addSelect('atividade.tipo', 'tipo')
      .addSelect('atividade.descricao', 'descricao')
      .addSelect(statusRef, 'status')
      .addSelect(completionResultRef, 'resultado_conclusao')
      .addSelect(completedAtRef, 'concluido_em')
      .addSelect('atividade.oportunidade_id', 'oportunidade_id')
      .addSelect(userRef, 'criado_por_id')
      .addSelect(dateRef, 'dataAtividade')
      .addSelect(createdRef, 'createdAt')
      .addSelect('usuario.id', 'usuario__id')
      .addSelect('usuario.nome', 'usuario__nome')
      .addSelect(usuarioAvatarExpr, 'usuario__avatar_url');

    if (responsavelRef) {
      queryBuilder
        .leftJoin('users', 'responsavel', `responsavel.id = ${responsavelRef}`)
        .addSelect(responsavelRef, 'responsavel_id')
        .addSelect('responsavel.id', 'responsavel__id')
        .addSelect('responsavel.nome', 'responsavel__nome')
        .addSelect(responsavelAvatarExpr, 'responsavel__avatar_url');
    } else {
      queryBuilder
        .addSelect('NULL::uuid', 'responsavel_id')
        .addSelect('NULL::uuid', 'responsavel__id')
        .addSelect('NULL', 'responsavel__nome')
        .addSelect('NULL', 'responsavel__avatar_url');
    }

    if (completedByRef) {
      queryBuilder
        .leftJoin('users', 'concluido_por_user', `concluido_por_user.id = ${completedByRef}`)
        .addSelect(completedByRef, 'concluido_por')
        .addSelect('concluido_por_user.id', 'concluido_por_user__id')
        .addSelect('concluido_por_user.nome', 'concluido_por_user__nome')
        .addSelect(concluidoPorAvatarExpr, 'concluido_por_user__avatar_url');
    } else {
      queryBuilder
        .addSelect('NULL::uuid', 'concluido_por')
        .addSelect('NULL::uuid', 'concluido_por_user__id')
        .addSelect('NULL', 'concluido_por_user__nome')
        .addSelect('NULL', 'concluido_por_user__avatar_url');
    }

    const rows = await queryBuilder
      .where('atividade.oportunidade_id::text = :oportunidadeId', { oportunidadeId })
      .andWhere('atividade.empresa_id = :empresaId', { empresaId })
      .orderBy(dateRef, 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      empresa_id: row.empresa_id,
      tipo: row.tipo,
      descricao: row.descricao,
      status: row.status || StatusAtividade.PENDENTE,
      resultadoConclusao: row.resultado_conclusao ?? null,
      oportunidade_id: row.oportunidade_id,
      criado_por_id: row.criado_por_id,
      responsavel_id: row.responsavel_id ?? null,
      concluido_por: row.concluido_por ?? null,
      concluidoEm: row.concluido_em ?? null,
      dataAtividade: row.dataAtividade,
      createdAt: row.createdAt,
      criadoPor: row.usuario__id
        ? {
            id: row.usuario__id,
            nome: row.usuario__nome,
            avatar_url: row.usuario__avatar_url,
          }
        : undefined,
      responsavel: row.responsavel__id
        ? {
            id: row.responsavel__id,
            nome: row.responsavel__nome,
            avatar_url: row.responsavel__avatar_url,
          }
        : undefined,
      concluidoPor: row.concluido_por_user__id
        ? {
            id: row.concluido_por_user__id,
            nome: row.concluido_por_user__nome,
            avatar_url: row.concluido_por_user__avatar_url,
          }
        : undefined,
    })) as Atividade[];
  }

  async concluirAtividade(
    oportunidadeId: string,
    atividadeId: number,
    payload: ConcluirAtividadeDto,
    context: { empresaId: string; userId?: string; userRole?: UserRole | string | null },
  ): Promise<Atividade> {
    const atividadeSchema = await this.resolveAtividadesSchema();
    const actorUserId = (context.userId || '').trim();
    const resultadoConclusaoInformado = (payload?.resultadoConclusao || '').trim();
    const resultadoConclusao = resultadoConclusaoInformado || 'Concluida sem observacoes.';

    if (!actorUserId) {
      throw new ForbiddenException('Sessao invalida para concluir atividade.');
    }

    if (
      !atividadeSchema.statusColumn ||
      !atividadeSchema.completionResultColumn ||
      !atividadeSchema.completedByColumn ||
      !atividadeSchema.completedAtColumn
    ) {
      throw new BadRequestException(
        'Conclusao de atividades indisponivel neste ambiente. Execute as migrations pendentes.',
      );
    }

    await this.findOne(oportunidadeId, context.empresaId, {
      include_deleted: true,
    });

    const atividadeRows = await this.atividadeRepository.query(
      `
        SELECT
          atividade.id,
          atividade.${this.quoteIdentifier(atividadeSchema.statusColumn)} AS status,
          atividade.${this.quoteIdentifier(atividadeSchema.userColumn)} AS criado_por_id,
          ${
            atividadeSchema.responsavelColumn
              ? `atividade.${this.quoteIdentifier(atividadeSchema.responsavelColumn)} AS responsavel_id`
              : 'NULL::uuid AS responsavel_id'
          }
        FROM "atividades" atividade
        WHERE atividade.id = $1
          AND atividade.oportunidade_id::text = $2::text
          AND atividade.empresa_id = $3
        LIMIT 1
      `,
      [atividadeId, oportunidadeId, context.empresaId],
    );

    const atividade = atividadeRows?.[0];
    if (!atividade) {
      throw new NotFoundException('Atividade nao encontrada para esta oportunidade.');
    }

    const statusAtual = String(atividade.status || StatusAtividade.PENDENTE).toLowerCase();
    if (statusAtual === StatusAtividade.CONCLUIDA) {
      throw new BadRequestException('Atividade ja esta concluida.');
    }

    const canOverrideByRole = canBypassOportunidadeStageTransitionByRole(context.userRole);
    const responsavelId = String(atividade.responsavel_id || '').trim();
    const criadoPorId = String(atividade.criado_por_id || '').trim();

    if (responsavelId) {
      if (responsavelId !== actorUserId && !canOverrideByRole) {
        throw new ForbiddenException(
          'Somente o responsavel atribuido pode concluir esta atividade.',
        );
      }
    } else if (criadoPorId && criadoPorId !== actorUserId && !canOverrideByRole) {
      throw new ForbiddenException(
        'Somente o criador da atividade ou gestor pode concluir esta atividade.',
      );
    }

    await this.atividadeRepository.query(
      `
        UPDATE "atividades"
        SET
          ${this.quoteIdentifier(atividadeSchema.statusColumn)} = $1,
          ${this.quoteIdentifier(atividadeSchema.completionResultColumn)} = $2,
          ${this.quoteIdentifier(atividadeSchema.completedByColumn)} = $3,
          ${this.quoteIdentifier(atividadeSchema.completedAtColumn)} = now()
        WHERE id = $4
          AND oportunidade_id::text = $5::text
          AND empresa_id = $6
      `,
      [
        StatusAtividade.CONCLUIDA,
        resultadoConclusao,
        actorUserId,
        atividadeId,
        oportunidadeId,
        context.empresaId,
      ],
    );

    const atividades = await this.listarAtividades(oportunidadeId, context.empresaId);
    const atividadeAtualizada = atividades.find((item) => Number(item.id) === Number(atividadeId));

    if (!atividadeAtualizada) {
      throw new NotFoundException('Atividade concluida, mas nao foi possivel recarregar o item.');
    }

    return atividadeAtualizada;
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
