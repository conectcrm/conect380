import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { In, Like, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Proposta as PropostaEntity } from './proposta.entity';
import { User, UserRole } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Produto as ProdutoEntity } from '../produtos/produto.entity';
import { CatalogItem as CatalogItemEntity } from '../catalogo/entities/catalog-item.entity';
import {
  EstagioOportunidade,
  LifecycleStatusOportunidade,
  MotivoPerdaOportunidade,
} from '../oportunidades/oportunidade.entity';
import {
  OportunidadesService,
  SalesFeatureFlagName,
} from '../oportunidades/oportunidades.service';
import { Permission } from '../../common/permissions/permissions.constants';
import { NotificationService } from '../../notifications/notification.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

type SalesFlowStatus =
  | 'rascunho'
  | 'enviada'
  | 'visualizada'
  | 'negociacao'
  | 'aprovada'
  | 'contrato_gerado'
  | 'contrato_assinado'
  | 'fatura_criada'
  | 'aguardando_pagamento'
  | 'pago'
  | 'rejeitada'
  | 'expirada';

const FLOW_STATUS_FALLBACK: SalesFlowStatus = 'rascunho';
const FLOW_STATUS_VALUES = new Set<SalesFlowStatus>([
  'rascunho',
  'enviada',
  'visualizada',
  'negociacao',
  'aprovada',
  'contrato_gerado',
  'contrato_assinado',
  'fatura_criada',
  'aguardando_pagamento',
  'pago',
  'rejeitada',
  'expirada',
]);

const FLOW_STATUS_ALIAS: Record<string, SalesFlowStatus> = {
  draft: 'rascunho',
  rascunho: 'rascunho',
  sent: 'enviada',
  enviada: 'enviada',
  viewed: 'visualizada',
  visualizada: 'visualizada',
  negociacao: 'negociacao',
  'em_negociacao': 'negociacao',
  emnegociacao: 'negociacao',
  approved: 'aprovada',
  aceita: 'aprovada',
  aprovada: 'aprovada',
  contrato_gerado: 'contrato_gerado',
  contratoassinado: 'contrato_assinado',
  contrato_assinado: 'contrato_assinado',
  fatura_criada: 'fatura_criada',
  aguardando_pagamento: 'aguardando_pagamento',
  pagamento_pendente: 'aguardando_pagamento',
  paid: 'pago',
  pago: 'pago',
  rejected: 'rejeitada',
  rejeitada: 'rejeitada',
  expired: 'expirada',
  expirada: 'expirada',
};

const WON_STATUS_VALUES = new Set<SalesFlowStatus>([
  'aprovada',
  'contrato_gerado',
  'contrato_assinado',
  'fatura_criada',
  'aguardando_pagamento',
  'pago',
]);

const PROPOSTA_SYNC_STATUS_TO_STAGE: Partial<Record<SalesFlowStatus, EstagioOportunidade>> = {
  rascunho: EstagioOportunidade.PROPOSTA,
  enviada: EstagioOportunidade.NEGOCIACAO,
  visualizada: EstagioOportunidade.NEGOCIACAO,
  negociacao: EstagioOportunidade.NEGOCIACAO,
  aprovada: EstagioOportunidade.FECHAMENTO,
  contrato_gerado: EstagioOportunidade.FECHAMENTO,
  contrato_assinado: EstagioOportunidade.GANHO,
  fatura_criada: EstagioOportunidade.GANHO,
  aguardando_pagamento: EstagioOportunidade.GANHO,
  pago: EstagioOportunidade.GANHO,
};

const PROPOSTA_STATUS_SUGERE_PERDA = new Set<SalesFlowStatus>(['rejeitada', 'expirada']);
const PROPOSTA_STATUS_NAO_PERMITE_CANCELAR_VENDA = new Set<SalesFlowStatus>(['pago']);

const FATURA_STATUS_CONCLUIDA_OU_PARCIAL = new Set(['paga', 'parcialmente_paga']);
const FATURA_STATUS_ATIVA_NAO_CANCELADA = new Set([
  'pendente',
  'enviada',
  'vencida',
  'parcialmente_paga',
  'paga',
]);
const FATURA_STATUS_CANCELAMENTO_AUTOMATICO = new Set(['pendente', 'enviada', 'vencida']);

const OPORTUNIDADE_SYNC_FORWARD_ORDER: readonly EstagioOportunidade[] = [
  EstagioOportunidade.LEADS,
  EstagioOportunidade.QUALIFICACAO,
  EstagioOportunidade.PROPOSTA,
  EstagioOportunidade.NEGOCIACAO,
  EstagioOportunidade.FECHAMENTO,
  EstagioOportunidade.GANHO,
];

const FLOW_STATUS_TRANSITIONS: Record<SalesFlowStatus, readonly SalesFlowStatus[]> = {
  rascunho: ['enviada', 'rejeitada', 'expirada'],
  enviada: ['visualizada', 'negociacao', 'aprovada', 'rejeitada', 'expirada'],
  visualizada: ['negociacao', 'aprovada', 'rejeitada', 'expirada'],
  negociacao: ['enviada', 'aprovada', 'rejeitada', 'expirada', 'visualizada'],
  aprovada: ['contrato_gerado', 'contrato_assinado', 'fatura_criada', 'rejeitada'],
  contrato_gerado: ['contrato_assinado', 'rejeitada'],
  contrato_assinado: ['fatura_criada', 'rejeitada'],
  fatura_criada: ['contrato_assinado', 'aguardando_pagamento', 'pago', 'rejeitada'],
  aguardando_pagamento: ['contrato_assinado', 'pago', 'rejeitada'],
  pago: ['aguardando_pagamento'],
  rejeitada: ['negociacao', 'enviada'],
  expirada: ['enviada', 'negociacao'],
};

const SALES_MVP_BLOCKED_FLOW_STATUSES = new Set<SalesFlowStatus>([
  'fatura_criada',
  'aguardando_pagamento',
  'pago',
]);

const parseBooleanEnv = (rawValue: string | undefined, fallback: boolean): boolean => {
  if (!rawValue || typeof rawValue !== 'string') {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'sim'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off', 'nao'].includes(normalized)) {
    return false;
  }

  return fallback;
};

type ApprovalStatus = 'nao_requer' | 'pendente' | 'aprovada' | 'rejeitada';

interface PropostaHistoricoEvento {
  id: string;
  timestamp: string;
  evento: string;
  origem?: string;
  status?: SalesFlowStatus;
  detalhes?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface PropostaVersao {
  versao: number;
  criadaEm: string;
  origem?: string;
  descricao?: string;
  snapshot: {
    titulo?: string;
    cliente?: unknown;
    produtos?: unknown[];
    subtotal: number;
    descontoGlobal: number;
    impostos: number;
    total: number;
    valor: number;
    formaPagamento?: string;
    validadeDias?: number;
    dataVencimento?: string;
    observacoes?: string;
    status: SalesFlowStatus;
  };
}

interface PropostaAprovacaoInterna {
  obrigatoria: boolean;
  status: ApprovalStatus;
  limiteDesconto: number;
  descontoDetectado: number;
  motivo?: string;
  solicitadaEm?: string;
  solicitadaPorId?: string;
  solicitadaPorNome?: string;
  aprovadaEm?: string;
  aprovadaPorId?: string;
  aprovadaPorNome?: string;
  rejeitadaEm?: string;
  rejeitadaPorId?: string;
  rejeitadaPorNome?: string;
  observacoes?: string;
}

interface PropostaLembrete {
  id: string;
  status: 'agendado' | 'enviado' | 'cancelado';
  agendadoPara: string;
  criadoEm: string;
  diasApos: number;
  observacoes?: string;
  origem?: string;
}

type PropostaStatusTransitionContext = {
  actorUserId?: string;
  actorPermissions?: string[];
  allowDirectApprovalOverride?: boolean;
  overrideReason?: string;
};

type PropostaCommercialPolicy = {
  limiteDescontoPercentual: number;
  aprovacaoInternaHabilitada: boolean;
};

type CancelamentoVendaInput = {
  motivo: string;
  observacoes?: string;
  source?: string;
  actorUserId?: string;
};

type PropostaVendaBloqueios = {
  contratosAssinados: number;
  faturasAtivasNaoCanceladas: number;
  faturasPagasOuParciais: number;
};

type PropostaCancelamentoVinculosResultado = {
  contratosCancelados: number;
  faturasCanceladas: number;
};

export interface Proposta {
  id: string;
  numero: string;
  titulo?: string;
  oportunidadeId?: string;
  oportunidade?: {
    id: string;
    titulo: string;
    estagio: string;
    valor: number;
  };
  isPropostaPrincipal?: boolean;
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    documento?: string;
    status?: string;
  };
  produtos: Array<{
    id: string;
    nome: string;
    precoUnitario: number;
    quantidade: number;
    desconto: number;
    subtotal: number;
  }>;
  subtotal: number;
  descontoGlobal: number;
  impostos: number;
  total: number;
  valor: number; // Alias para total (compatibilidade com DTO)
  formaPagamento: 'avista' | 'boleto' | 'cartao' | 'pix' | 'recorrente';
  parcelas?: number;
  validadeDias: number;
  observacoes?: string;
  incluirImpostosPDF: boolean;
  status: SalesFlowStatus;
  motivoPerda?: string;
  dataVencimento?: string;
  criadaEm: string;
  atualizadaEm: string;
  createdAt: string; // Alias para criadaEm (compatibilidade com DTO)
  updatedAt: string; // Alias para atualizadaEm (compatibilidade com DTO)
  source?: string;
  vendedor?:
    | {
        id: string;
        nome: string;
        email: string;
        tipo: string;
        ativo: boolean;
      }
    | string;
  portalAccess?: {
    accessedAt?: string;
    ip?: string;
    userAgent?: string;
  };
  emailDetails?: {
    sentAt?: string;
    emailCliente?: string;
    linkPortal?: string;
    fluxoStatus?: SalesFlowStatus;
    motivoPerda?: string;
    historicoEventos?: PropostaHistoricoEvento[];
    portalEventos?: PropostaHistoricoEvento[];
    versoes?: PropostaVersao[];
    aprovacaoInterna?: PropostaAprovacaoInterna;
    lembretes?: PropostaLembrete[];
  };
  historicoEventos?: PropostaHistoricoEvento[];
  versoes?: PropostaVersao[];
  aprovacaoInterna?: PropostaAprovacaoInterna;
  lembretes?: PropostaLembrete[];
}

@Injectable()
export class PropostasService {
  private readonly logger = new Logger(PropostasService.name);
  private contadorId = 1;
  private contadorInicializado = false;
  private contadorInitPromise: Promise<void>;
  private tableColumnsCache = new Map<string, Set<string>>();
  private tableColumnTypeCache = new Map<string, string | null>();
  private tableColumnNullableCache = new Map<string, boolean | null>();
  private readonly APROVACAO_DESCONTO_PADRAO = 10;
  private readonly APROVACAO_INTERNA_HABILITADA_PADRAO = true;
  private readonly MAX_HISTORICO_EVENTOS = 200;
  private readonly MAX_VERSOES = 50;
  private readonly NEGOCIACAO_FOLLOWUP_DIAS_PADRAO = 2;
  private readonly NEGOCIACAO_FOLLOWUP_DIAS_MAXIMO = 30;
  private readonly salesMvpModeEnabled =
    parseBooleanEnv(process.env.SALES_MVP_MODE, false) ||
    parseBooleanEnv(process.env.MVP_MODE, false) ||
    parseBooleanEnv(process.env.FINANCEIRO_MVP_MODE, false);
  private readonly COMMERCIAL_POLICY_CACHE_TTL_MS = Math.max(
    0,
    Number(process.env.PROPOSTAS_COMMERCIAL_POLICY_CACHE_TTL_MS || 0),
  );
  private commercialPolicyCache = new Map<
    string,
    {
      expiresAt: number;
      policy: PropostaCommercialPolicy;
    }
  >();

  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(ProdutoEntity)
    private produtoRepository: Repository<ProdutoEntity>,
    @InjectRepository(CatalogItemEntity)
    private catalogItemRepository: Repository<CatalogItemEntity>,
    @Inject(forwardRef(() => OportunidadesService))
    private readonly oportunidadesService: OportunidadesService,
    @Optional()
    private readonly notificationService?: NotificationService,
  ) {
    // Inicializar contador baseado nas propostas existentes
    this.contadorInitPromise = this.inicializarContador();
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message.trim();
      if (message) {
        return message;
      }
    }

    return fallbackMessage;
  }

  private sanitizeMotivoAjustes(value: unknown): string | undefined {
    const motivo = String(value || '').trim();
    if (!motivo) {
      return undefined;
    }

    return motivo.slice(0, 600);
  }

  private extractMotivoAjustesFromContext(
    observacoes?: string,
    metadata?: Record<string, unknown>,
  ): string | undefined {
    const fromMetadata = this.sanitizeMotivoAjustes(metadata?.motivoAjustes);
    if (fromMetadata) {
      return fromMetadata;
    }

    const text = String(observacoes || '').trim();
    if (!text) {
      return undefined;
    }

    const match = text.match(/motivo ajustes:\s*(.+)$/i);
    if (!match || !match[1]) {
      return undefined;
    }

    return this.sanitizeMotivoAjustes(match[1]);
  }

  private getNegociacaoFollowupDias(): number {
    const parsed = Number(
      process.env.PROPOSTAS_NEGOCIACAO_FOLLOWUP_DIAS || this.NEGOCIACAO_FOLLOWUP_DIAS_PADRAO,
    );
    if (!Number.isFinite(parsed)) {
      return this.NEGOCIACAO_FOLLOWUP_DIAS_PADRAO;
    }

    return Math.min(this.NEGOCIACAO_FOLLOWUP_DIAS_MAXIMO, Math.max(1, Math.floor(parsed)));
  }

  private formatDateTimePtBr(value?: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString('pt-BR');
  }

  private formatCurrencyPtBr(value: unknown): string {
    const parsed = Number(value ?? 0);
    const safe = Number.isFinite(parsed) ? parsed : 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(safe);
  }

  private async ensureNegociacaoFollowupIfNeeded(
    proposta: PropostaEntity,
    source?: string,
  ): Promise<{ created: boolean; lembrete?: PropostaLembrete }> {
    let emailDetails = this.toObjectRecord(proposta.emailDetails);
    const lembretes = this.getLembretes(emailDetails);
    const hasPendingNegociacaoFollowup = lembretes.some((lembrete) => {
      const origem = String(lembrete.origem || '').toLowerCase();
      return lembrete.status === 'agendado' && origem.includes('followup-negociacao');
    });

    if (hasPendingNegociacaoFollowup) {
      return { created: false };
    }

    const dias = this.getNegociacaoFollowupDias();
    const lembrete: PropostaLembrete = {
      id: randomUUID(),
      status: 'agendado',
      criadoEm: new Date().toISOString(),
      agendadoPara: new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString(),
      diasApos: dias,
      origem: 'followup-negociacao-auto',
      observacoes: `SLA comercial: revisar proposta em negociacao em ate ${dias} dia(s).`,
    };

    emailDetails.lembretes = [...lembretes, lembrete].slice(-this.MAX_HISTORICO_EVENTOS);
    emailDetails = this.appendHistoricoEvento(emailDetails, 'followup_negociacao_agendado', {
      origem: source || 'api',
      status: 'negociacao',
      detalhes: `Follow-up automatico de negociacao agendado para ${dias} dia(s).`,
      metadata: {
        lembreteId: lembrete.id,
        agendadoPara: lembrete.agendadoPara,
        diasApos: dias,
      },
    });

    proposta.emailDetails = emailDetails as any;
    await this.propostaRepository.save(proposta);

    return { created: true, lembrete };
  }

  private async notifyComercialTeamOnNegociacao(input: {
    proposta: PropostaEntity;
    empresaId?: string;
    source?: string;
    actorUserId?: string;
    motivoAjustes?: string;
    followup?: { created: boolean; lembrete?: PropostaLembrete };
  }): Promise<void> {
    if (!this.notificationService) {
      return;
    }

    const empresaId = String(input.empresaId || input.proposta.empresaId || '').trim();
    if (!empresaId) {
      return;
    }

    try {
      const candidateIds = new Set<string>();
      const vendedorId = String(input.proposta.vendedor_id || '').trim();
      if (vendedorId) {
        candidateIds.add(vendedorId);
      }

      const gestores = await this.userRepository.find({
        where: {
          empresa_id: empresaId,
          ativo: true,
          role: In([UserRole.GERENTE, UserRole.ADMIN, UserRole.SUPERADMIN]),
        },
        select: ['id'],
      });

      gestores.forEach((gestor) => {
        const gestorId = String(gestor.id || '').trim();
        if (gestorId) {
          candidateIds.add(gestorId);
        }
      });

      const actorUserId = String(input.actorUserId || '').trim();
      if (actorUserId) {
        candidateIds.delete(actorUserId);
      }

      const candidateList = Array.from(candidateIds);
      if (candidateList.length === 0) {
        return;
      }

      const recipients = await this.userRepository.find({
        where: {
          empresa_id: empresaId,
          ativo: true,
          id: In(candidateList),
        },
        select: ['id'],
      });

      if (recipients.length === 0) {
        return;
      }

      const actor =
        actorUserId.length > 0
          ? await this.userRepository.findOne({
              where: {
                empresa_id: empresaId,
                id: actorUserId,
              },
              select: ['id', 'nome'],
            })
          : null;

      const sourceNormalized = String(input.source || '').toLowerCase();
      const sourceFromPortal = sourceNormalized.includes('portal');
      const actorName = actor?.nome?.trim() || (sourceFromPortal ? 'Cliente (portal)' : 'Equipe comercial');
      const numero = String(input.proposta.numero || input.proposta.id || '').trim();
      const propostaRef = numero ? `#${numero}` : input.proposta.id;
      const clienteNome = String(input.proposta.cliente?.nome || 'Cliente').trim();
      const valor = Number(input.proposta.total ?? input.proposta.valor ?? 0);
      const valorFormatado = this.formatCurrencyPtBr(valor);
      const motivoAjustes = this.sanitizeMotivoAjustes(input.motivoAjustes);

      const title = sourceFromPortal
        ? 'Cliente solicitou ajustes na proposta'
        : 'Proposta em negociacao';

      const messageParts = sourceFromPortal
        ? [`${clienteNome} solicitou ajustes na proposta ${propostaRef}.`]
        : [`A proposta ${propostaRef} entrou em negociacao.`];

      if (motivoAjustes) {
        messageParts.push(`Motivo informado: ${motivoAjustes}.`);
      }
      messageParts.push(`Valor: ${valorFormatado}.`);

      if (input.followup?.created && input.followup.lembrete?.agendadoPara) {
        messageParts.push(
          `Follow-up automatico agendado para ${this.formatDateTimePtBr(input.followup.lembrete.agendadoPara)}.`,
        );
      }

      const message = messageParts.join(' ');

      const jobs = recipients.map((recipient) =>
        this.notificationService!.create({
          empresaId,
          userId: recipient.id,
          type: NotificationType.SISTEMA,
          title,
          message,
          data: {
            category: 'comercial',
            event: 'proposta_negociacao',
            propostaId: input.proposta.id,
            propostaNumero: input.proposta.numero,
            source: input.source || 'api',
            actorUserId: actorUserId || null,
            actorName,
            clienteNome,
            valor: Number.isFinite(valor) ? valor : 0,
            motivoAjustes: motivoAjustes || null,
            followupAgendadoPara: input.followup?.lembrete?.agendadoPara || null,
            followupDias: input.followup?.lembrete?.diasApos ?? null,
          },
        }),
      );

      const settled = await Promise.allSettled(jobs);
      const failed = settled.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        this.logger.warn(
          `Falha ao entregar ${failed} notificacao(oes) de negociacao para proposta ${input.proposta.id}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Falha ao notificar equipe comercial sobre negociacao (${input.proposta.id}): ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
      );
    }
  }

  private async handleNegociacaoTransitionSideEffects(input: {
    propostaId: string;
    empresaId?: string;
    statusAnterior: SalesFlowStatus;
    novoStatus: SalesFlowStatus;
    source?: string;
    observacoes?: string;
    metadata?: Record<string, unknown>;
    actorUserId?: string;
  }): Promise<void> {
    if (input.novoStatus !== 'negociacao' || input.statusAnterior === 'negociacao') {
      return;
    }

    try {
      const proposta = await this.propostaRepository.findOne({
        where: input.empresaId
          ? { id: input.propostaId, empresaId: input.empresaId }
          : { id: input.propostaId },
      });

      if (!proposta) {
        return;
      }

      const followup = await this.ensureNegociacaoFollowupIfNeeded(proposta, input.source);
      const motivoAjustes = this.extractMotivoAjustesFromContext(input.observacoes, input.metadata);

      await this.notifyComercialTeamOnNegociacao({
        proposta,
        empresaId: input.empresaId,
        source: input.source,
        actorUserId: input.actorUserId,
        motivoAjustes,
        followup,
      });
    } catch (error) {
      this.logger.warn(
        `Falha nos efeitos de transicao para negociacao da proposta ${input.propostaId}: ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
      );
    }
  }

  private normalizeOportunidadeId(value: unknown): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private mapPropostaStatusToOportunidadeStage(
    status?: SalesFlowStatus | string | null,
  ): EstagioOportunidade | null {
    const normalized = status ? this.normalizeStatusInput(String(status)) : null;
    if (!normalized) {
      return null;
    }

    return PROPOSTA_SYNC_STATUS_TO_STAGE[normalized] || null;
  }

  private async hydratePropostasOpportunityContext(
    propostas: Proposta[],
    empresaId?: string,
  ): Promise<Proposta[]> {
    if (!Array.isArray(propostas) || propostas.length === 0) {
      return propostas;
    }

    const propostaColumns = await this.getTableColumns('propostas');
    if (!propostaColumns.has('oportunidade_id')) {
      return propostas;
    }

    const oportunidadeColumns = await this.getTableColumns('oportunidades');
    const propostaIds = propostas
      .map((proposta) => String(proposta.id || '').trim())
      .filter((id) => id.length > 0);

    if (propostaIds.length === 0) {
      return propostas;
    }

    const params: unknown[] = [propostaIds];
    const empresaFilter = empresaId ? 'AND p.empresa_id = $2' : '';
    if (empresaId) {
      params.push(empresaId);
    }

    const rowsRaw = await this.propostaRepository.query(
      `
        SELECT
          p.id::text AS proposta_id,
          p.oportunidade_id::text AS oportunidade_id,
          o.titulo AS oportunidade_titulo,
          o.estagio::text AS oportunidade_estagio,
          o.valor AS oportunidade_valor,
          ${
            oportunidadeColumns.has('proposta_principal_id')
              ? 'o.proposta_principal_id::text'
              : 'NULL::text'
          } AS proposta_principal_id
        FROM propostas p
        LEFT JOIN oportunidades o
          ON o.id::text = p.oportunidade_id::text
         AND o.empresa_id::text = p.empresa_id::text
        WHERE p.id::text = ANY($1::text[])
        ${empresaFilter}
      `,
      params,
    );

    const rows = this.extractQueryRows<{
      proposta_id?: string;
      oportunidade_id?: string | null;
      oportunidade_titulo?: string | null;
      oportunidade_estagio?: string | null;
      oportunidade_valor?: number | string | null;
      proposta_principal_id?: string | null;
    }>(rowsRaw);

    const contextMap = new Map<
      string,
      {
        oportunidadeId: string | null;
        oportunidade?: Proposta['oportunidade'];
        isPropostaPrincipal: boolean;
      }
    >();

    rows.forEach((row) => {
      const propostaId = String(row?.proposta_id || '').trim();
      if (!propostaId) {
        return;
      }

      const oportunidadeId = this.normalizeOportunidadeId(row?.oportunidade_id);
      contextMap.set(propostaId, {
        oportunidadeId,
        oportunidade: oportunidadeId
          ? {
              id: oportunidadeId,
              titulo: row?.oportunidade_titulo || 'Oportunidade vinculada',
              estagio: String(row?.oportunidade_estagio || '').trim(),
              valor: Number(row?.oportunidade_valor || 0),
            }
          : undefined,
        isPropostaPrincipal:
          Boolean(row?.proposta_principal_id) &&
          String(row?.proposta_principal_id).trim() === propostaId,
      });
    });

    return propostas.map((proposta) => {
      const context = contextMap.get(String(proposta.id || '').trim());
      if (!context) {
        return proposta;
      }

      return {
        ...proposta,
        oportunidadeId: context.oportunidadeId ?? proposta.oportunidadeId,
        oportunidade: context.oportunidade || proposta.oportunidade,
        isPropostaPrincipal: context.isPropostaPrincipal,
      };
    });
  }

  private async maybeAssignPropostaPrincipalOnCreate(
    propostaId: string,
    oportunidadeId: string | null,
    empresaId?: string,
    options?: { force?: boolean },
  ): Promise<boolean> {
    if (!propostaId || !oportunidadeId || !empresaId) {
      return false;
    }

    const oportunidadeColumns = await this.getTableColumns('oportunidades');
    if (!oportunidadeColumns.has('proposta_principal_id')) {
      return false;
    }

    const rowsRaw = await this.propostaRepository.query(
      `
        SELECT proposta_principal_id::text AS proposta_principal_id
        FROM oportunidades
        WHERE id = $1
          AND empresa_id = $2
        LIMIT 1
      `,
      [oportunidadeId, empresaId],
    );
    const rows = this.extractQueryRows<{ proposta_principal_id?: string | null }>(rowsRaw);
    const propostaPrincipalAtual = String(rows?.[0]?.proposta_principal_id || '').trim();

    if (!options?.force && propostaPrincipalAtual) {
      return propostaPrincipalAtual === propostaId;
    }

    await this.propostaRepository.query(
      `
        UPDATE oportunidades
        SET proposta_principal_id = $1
        WHERE id = $2
          AND empresa_id = $3
      `,
      [propostaId, oportunidadeId, empresaId],
    );

    return true;
  }

  private async resolvePrimaryProposalLink(
    propostaId: string,
    empresaId?: string,
  ): Promise<{ oportunidadeId: string | null; isPrimary: boolean }> {
    const propostaColumns = await this.getTableColumns('propostas');
    if (!propostaColumns.has('oportunidade_id')) {
      return { oportunidadeId: null, isPrimary: false };
    }

    const oportunidadeColumns = await this.getTableColumns('oportunidades');
    const params: unknown[] = [propostaId];
    const empresaFilter = empresaId ? 'AND p.empresa_id = $2' : '';
    if (empresaId) {
      params.push(empresaId);
    }

    const rowsRaw = await this.propostaRepository.query(
      `
        SELECT
          p.oportunidade_id,
          ${
            oportunidadeColumns.has('proposta_principal_id')
              ? 'o.proposta_principal_id::text'
              : 'NULL::text'
          } AS proposta_principal_id
        FROM propostas p
        LEFT JOIN oportunidades o
          ON o.id::text = p.oportunidade_id::text
         AND o.empresa_id::text = p.empresa_id::text
        WHERE p.id = $1
        ${empresaFilter}
        LIMIT 1
      `,
      params,
    );

    const rows = this.extractQueryRows<{
      oportunidade_id?: string | null;
      proposta_principal_id?: string | null;
    }>(rowsRaw);

    const oportunidadeId = this.normalizeOportunidadeId(rows?.[0]?.oportunidade_id);
    const propostaPrincipalId = String(rows?.[0]?.proposta_principal_id || '').trim();

    return {
      oportunidadeId,
      isPrimary: Boolean(propostaPrincipalId) && propostaPrincipalId === propostaId,
    };
  }

  private async syncOportunidadeFromPropostaPrincipal(
    propostaId: string,
    empresaId?: string,
  ): Promise<void> {
    try {
      if (!empresaId) {
        return;
      }

      const link = await this.resolvePrimaryProposalLink(propostaId, empresaId);
      if (!link.oportunidadeId || !link.isPrimary) {
        return;
      }

      const proposta = await this.obterProposta(propostaId, empresaId);
      if (!proposta) {
        return;
      }

      if (PROPOSTA_STATUS_SUGERE_PERDA.has(proposta.status)) {
        await this.syncOportunidadeAsLostFromPropostaPrincipal(
          link.oportunidadeId,
          proposta,
          empresaId,
          proposta.motivoPerda,
          'proposta-perda',
        );
        return;
      }

      const targetStage = this.mapPropostaStatusToOportunidadeStage(proposta.status);
      if (!targetStage) {
        return;
      }

      const oportunidade = await this.oportunidadesService.findOne(
        String(link.oportunidadeId),
        empresaId,
      );
      const lifecycleStatus =
        oportunidade.lifecycle_status ||
        (oportunidade.estagio === EstagioOportunidade.GANHO
          ? LifecycleStatusOportunidade.WON
          : oportunidade.estagio === EstagioOportunidade.PERDIDO
            ? LifecycleStatusOportunidade.LOST
            : LifecycleStatusOportunidade.OPEN);

      if (lifecycleStatus !== LifecycleStatusOportunidade.OPEN) {
        return;
      }

      const currentStageIndex = OPORTUNIDADE_SYNC_FORWARD_ORDER.indexOf(oportunidade.estagio);
      const targetStageIndex = OPORTUNIDADE_SYNC_FORWARD_ORDER.indexOf(targetStage);
      if (
        currentStageIndex === -1 ||
        targetStageIndex === -1 ||
        targetStageIndex <= currentStageIndex
      ) {
        return;
      }

      let oportunidadeAtual = oportunidade;
      for (const stage of OPORTUNIDADE_SYNC_FORWARD_ORDER.slice(
        currentStageIndex + 1,
        targetStageIndex + 1,
      )) {
        oportunidadeAtual = await this.oportunidadesService.updateEstagio(
          String(oportunidadeAtual.id),
          { estagio: stage },
          empresaId,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Falha ao sincronizar oportunidade pela proposta principal ${propostaId}: ${this.resolveErrorMessage(error, 'erro inesperado')}`,
      );
    }
  }

  private mapMotivoPerdaPropostaParaOportunidade(
    motivoPerda?: string,
  ): MotivoPerdaOportunidade {
    const normalized = String(motivoPerda || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (!normalized) {
      return MotivoPerdaOportunidade.OUTRO;
    }

    if (normalized.includes('preco') || normalized.includes('valor')) {
      return MotivoPerdaOportunidade.PRECO;
    }
    if (normalized.includes('concorr')) {
      return MotivoPerdaOportunidade.CONCORRENTE;
    }
    if (
      normalized.includes('timing') ||
      normalized.includes('momento') ||
      normalized.includes('agora nao')
    ) {
      return MotivoPerdaOportunidade.TIMING;
    }
    if (normalized.includes('orcament')) {
      return MotivoPerdaOportunidade.ORCAMENTO;
    }
    if (normalized.includes('produto') || normalized.includes('funcionalidade')) {
      return MotivoPerdaOportunidade.PRODUTO;
    }
    if (normalized.includes('cancelad')) {
      return MotivoPerdaOportunidade.PROJETO_CANCELADO;
    }
    if (
      normalized.includes('sem resposta') ||
      normalized.includes('sem retorno') ||
      normalized.includes('nao respondeu') ||
      normalized.includes('nao responde')
    ) {
      return MotivoPerdaOportunidade.SEM_RESPOSTA;
    }

    return MotivoPerdaOportunidade.OUTRO;
  }

  private async syncOportunidadeAsLostFromPropostaPrincipal(
    oportunidadeId: string,
    proposta: Proposta,
    empresaId: string,
    motivoPerda?: string,
    source: string = 'proposta-perda',
  ): Promise<void> {
    try {
      const oportunidade = await this.oportunidadesService.findOne(String(oportunidadeId), empresaId);
      const lifecycleStatus =
        oportunidade.lifecycle_status ||
        (oportunidade.estagio === EstagioOportunidade.GANHO
          ? LifecycleStatusOportunidade.WON
          : oportunidade.estagio === EstagioOportunidade.PERDIDO
            ? LifecycleStatusOportunidade.LOST
            : LifecycleStatusOportunidade.OPEN);

      if (lifecycleStatus !== LifecycleStatusOportunidade.OPEN) {
        return;
      }

      if (oportunidade.estagio === EstagioOportunidade.PERDIDO) {
        return;
      }

      const motivoNormalizado = this.sanitizeMotivoPerda(motivoPerda);
      const numeroOuId = String(proposta.numero || proposta.id || '').trim();
      const detalheMotivo = motivoNormalizado
        ? `Motivo informado na proposta: ${motivoNormalizado}`
        : 'Motivo informado: nao especificado';

      await this.oportunidadesService.updateEstagio(
        String(oportunidade.id),
        {
          estagio: EstagioOportunidade.PERDIDO,
          motivoPerda: this.mapMotivoPerdaPropostaParaOportunidade(motivoNormalizado),
          motivoPerdaDetalhes: `Sincronizado automaticamente da proposta principal ${numeroOuId} (${source}). ${detalheMotivo}.`,
        },
        empresaId,
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao sincronizar oportunidade como perdida para proposta ${proposta.id}: ${this.resolveErrorMessage(error, 'erro inesperado')}`,
      );
    }
  }

  private async carregarBloqueiosCancelamentoVenda(
    propostaId: string,
    empresaId?: string,
  ): Promise<PropostaVendaBloqueios> {
    const bloqueios: PropostaVendaBloqueios = {
      contratosAssinados: 0,
      faturasAtivasNaoCanceladas: 0,
      faturasPagasOuParciais: 0,
    };

    try {
      const contratoColumns = await this.getTableColumns('contratos');
      const propostaColumn = contratoColumns.has('propostaId')
        ? '"propostaId"'
        : contratoColumns.has('proposta_id')
          ? 'proposta_id'
          : null;
      const empresaColumn = contratoColumns.has('empresa_id')
        ? 'empresa_id'
        : contratoColumns.has('empresaId')
          ? '"empresaId"'
          : null;
      const ativoColumn = contratoColumns.has('ativo') ? 'ativo' : null;

      if (!propostaColumn) {
        return bloqueios;
      }

      const contratoAtivoExpr = ativoColumn ? `COALESCE(c.${ativoColumn}, true) = true` : 'TRUE';
      const contratosParams: unknown[] = [propostaId];
      const filtroEmpresaContratos = empresaId && empresaColumn ? 'AND c.' + empresaColumn + '::text = $2::text' : '';
      if (empresaId && empresaColumn) {
        contratosParams.push(empresaId);
      }

      const contratosRaw = await this.propostaRepository.query(
        `
          SELECT COUNT(*)::int AS total
          FROM contratos c
          WHERE c.${propostaColumn}::text = $1::text
            ${filtroEmpresaContratos}
            AND ${contratoAtivoExpr}
            AND c.status = 'assinado'
        `,
        contratosParams,
      );
      const contratosRows = this.extractQueryRows<{ total?: number | string }>(contratosRaw);
      bloqueios.contratosAssinados = Number(contratosRows?.[0]?.total || 0);

      const faturaColumns = await this.getTableColumns('faturas');
      const contratoFaturaColumn = faturaColumns.has('contratoId')
        ? '"contratoId"'
        : faturaColumns.has('contrato_id')
          ? 'contrato_id'
          : null;

      if (!contratoFaturaColumn) {
        return bloqueios;
      }

      const faturaAtivoColumn = faturaColumns.has('ativo') ? 'ativo' : null;
      const faturaAtivoExpr = faturaAtivoColumn ? `COALESCE(f.${faturaAtivoColumn}, true) = true` : 'TRUE';

      const faturasParams: unknown[] = [propostaId];
      const filtroEmpresaFaturas = empresaId && empresaColumn ? 'AND c.' + empresaColumn + '::text = $2::text' : '';
      if (empresaId && empresaColumn) {
        faturasParams.push(empresaId);
      }
      const idxStatusAtivos = faturasParams.push(Array.from(FATURA_STATUS_ATIVA_NAO_CANCELADA));
      const idxStatusPagos = faturasParams.push(Array.from(FATURA_STATUS_CONCLUIDA_OU_PARCIAL));

      const faturasRaw = await this.propostaRepository.query(
        `
          SELECT
            COUNT(*) FILTER (
              WHERE f.id IS NOT NULL
                AND ${faturaAtivoExpr}
                AND f.status = ANY($${idxStatusAtivos}::text[])
            )::int AS faturas_ativas,
            COUNT(*) FILTER (
              WHERE f.id IS NOT NULL
                AND ${faturaAtivoExpr}
                AND f.status = ANY($${idxStatusPagos}::text[])
            )::int AS faturas_pagas_parciais
          FROM contratos c
          LEFT JOIN faturas f
            ON f.${contratoFaturaColumn}::text = c.id::text
          WHERE c.${propostaColumn}::text = $1::text
            ${filtroEmpresaFaturas}
            AND ${contratoAtivoExpr}
        `,
        faturasParams,
      );
      const faturasRows = this.extractQueryRows<{
        faturas_ativas?: number | string;
        faturas_pagas_parciais?: number | string;
      }>(faturasRaw);
      bloqueios.faturasAtivasNaoCanceladas = Number(faturasRows?.[0]?.faturas_ativas || 0);
      bloqueios.faturasPagasOuParciais = Number(
        faturasRows?.[0]?.faturas_pagas_parciais || 0,
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar bloqueios de cancelamento de venda da proposta ${propostaId}: ${this.resolveErrorMessage(error, 'erro inesperado')}`,
      );
    }

    return bloqueios;
  }

  private buildPropostaNotFoundMessage(propostaId: string): string {
    return `Proposta com ID ${propostaId} nao encontrada`;
  }

  private buildPropostaNotFoundByIdentifierMessage(identifier: string): string {
    return `Proposta com ID/Numero ${identifier} nao encontrada`;
  }

  private propostaTemItensComerciais(produtos: unknown): boolean {
    if (!Array.isArray(produtos) || produtos.length === 0) {
      return false;
    }

    return produtos.some((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const record = item as Record<string, unknown>;
      const produto =
        record.produto && typeof record.produto === 'object'
          ? (record.produto as Record<string, unknown>)
          : null;
      const nome = String(
        record.nome ??
          record.produtoNome ??
          record.descricao ??
          produto?.nome ??
          produto?.titulo ??
          '',
      ).trim();
      const produtoId = String(record.produtoId ?? record.id ?? produto?.id ?? '').trim();
      const quantidade = Number(record.quantidade ?? produto?.quantidade ?? 1);

      return Boolean((produtoId || nome) && Number.isFinite(quantidade) && quantidade > 0);
    });
  }

  private assertItensComerciaisParaFluxo(
    produtos: unknown,
    acao: 'enviar' | 'aprovar' | 'seguir_fluxo' | 'gerar_pdf',
  ): void {
    if (this.propostaTemItensComerciais(produtos)) {
      return;
    }

    const mensagens: Record<typeof acao, string> = {
      enviar: 'A proposta precisa ter ao menos um item/produto antes de ser enviada ao cliente.',
      aprovar: 'A proposta precisa ter ao menos um item/produto antes de ser aprovada.',
      seguir_fluxo:
        'A proposta precisa ter ao menos um item/produto antes de avancar para etapas comerciais finais.',
      gerar_pdf: 'A proposta precisa ter ao menos um item/produto antes de gerar o PDF final.',
    };

    throw new BadRequestException(mensagens[acao]);
  }

  private statusExigeItensComerciais(status: SalesFlowStatus): boolean {
    return [
      'enviada',
      'aprovada',
      'contrato_gerado',
      'contrato_assinado',
      'fatura_criada',
      'aguardando_pagamento',
      'pago',
    ].includes(status);
  }

  private async enrichSnapshotProdutos(produtos: unknown[], empresaId?: string): Promise<unknown[]> {
    if (!empresaId || !Array.isArray(produtos) || produtos.length === 0) {
      return Array.isArray(produtos) ? produtos : [];
    }

    const toId = (value: unknown): string => String(value || '').trim();
    const extractItemId = (record: Record<string, unknown>): string => {
      return toId(
        record.id ??
          record.produtoId ??
          record.produto_id ??
          (record.produto && typeof record.produto === 'object'
            ? (record.produto as Record<string, unknown>).id
            : undefined),
      );
    };
    const collectComponentIds = (value: unknown): string[] => {
      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .map((raw) => {
          if (!raw || typeof raw !== 'object') {
            return '';
          }

          const record = raw as Record<string, unknown>;
          const nome = typeof record.nome === 'string' ? record.nome.trim() : '';
          if (nome) {
            return '';
          }

          return toId(record.childItemId ?? record.child_item_id ?? record.id ?? record.itemId);
        })
        .filter((id) => Boolean(id));
    };

    const ids = Array.from(
      new Set(
        produtos.flatMap((item) => {
            if (!item || typeof item !== 'object') {
              return [];
            }

            const record = item as Record<string, unknown>;
            const nome = typeof record.nome === 'string' ? record.nome.trim() : '';
            const produtoNome =
              typeof record.produtoNome === 'string' ? record.produtoNome.trim() : '';
            const collected: string[] = [];

            if (!nome && !produtoNome) {
              const itemId = extractItemId(record);
              if (itemId) {
                collected.push(itemId);
              }
            }

            collected.push(...collectComponentIds(record.componentesPlano));
            collected.push(...collectComponentIds(record.componentes));

            if (record.produto && typeof record.produto === 'object') {
              const nested = record.produto as Record<string, unknown>;
              const nestedNome = typeof nested.nome === 'string' ? nested.nome.trim() : '';
              if (!nestedNome) {
                const nestedId = extractItemId(nested);
                if (nestedId) {
                  collected.push(nestedId);
                }
              }
              collected.push(...collectComponentIds(nested.componentesPlano));
              collected.push(...collectComponentIds(nested.componentes));
            }

            return collected.filter((id) => Boolean(id));
          }),
      ),
    );

    if (ids.length === 0) {
      return produtos;
    }

    const encontrados = await this.produtoRepository.find({
      select: ['id', 'nome', 'descricao', 'preco', 'tipoItem', 'status'],
      where: {
        empresaId,
        id: In(ids),
      },
    });

    const resolvedItemsMap = new Map<
      string,
      {
        nome: string;
        descricao?: string | null;
        preco?: number;
        tipoItem?: string | null;
        status?: string | null;
      }
    >(
      encontrados.map((item) => [
        item.id,
        {
          nome: item.nome,
          descricao: item.descricao ?? undefined,
          preco: Number(item.preco || 0),
          tipoItem: item.tipoItem ?? undefined,
          status: item.status ?? undefined,
        },
      ]),
    );

    const missingIds = ids.filter((id) => !resolvedItemsMap.has(id));
    if (missingIds.length > 0) {
      const catalogItems = await this.catalogItemRepository.find({
        select: ['id', 'nome', 'descricao', 'salePrice', 'businessType', 'status'],
        where: {
          empresaId,
          id: In(missingIds),
        },
      });

      catalogItems.forEach((item) => {
        resolvedItemsMap.set(item.id, {
          nome: item.nome,
          descricao: item.descricao ?? undefined,
          preco: Number(item.salePrice || 0),
          tipoItem: item.businessType ?? undefined,
          status: item.status ?? undefined,
        });
      });
    }

    const enrichComponentList = (value: unknown): { value: unknown; changed: boolean } => {
      if (!Array.isArray(value)) {
        return { value, changed: false };
      }

      let changed = false;
      const enriched = value.map((raw) => {
        if (!raw || typeof raw !== 'object') {
          return raw;
        }

        const record = raw as Record<string, unknown>;
        const nome = typeof record.nome === 'string' ? record.nome.trim() : '';
        if (nome) {
          return raw;
        }

        const childId = toId(
          record.childItemId ?? record.child_item_id ?? record.id ?? record.itemId,
        );
        if (!childId) {
          return raw;
        }

        const resolved = resolvedItemsMap.get(childId);
        if (!resolved) {
          return raw;
        }

        changed = true;
        return {
          ...record,
          nome: resolved.nome,
          preco:
            record.preco === undefined || record.preco === null
              ? Number(resolved.preco || 0)
              : record.preco,
          tipoItem: record.tipoItem ?? resolved.tipoItem ?? undefined,
          status: record.status ?? resolved.status ?? undefined,
        };
      });

      return { value: changed ? enriched : value, changed };
    };

    return produtos.map((item) => {
      if (!item || typeof item !== 'object') {
        return item;
      }

      const record = item as Record<string, unknown>;
      let changed = false;
      const nextRecord: Record<string, unknown> = { ...record };

      const nome = typeof nextRecord.nome === 'string' ? nextRecord.nome.trim() : '';
      const produtoNome =
        typeof nextRecord.produtoNome === 'string' ? nextRecord.produtoNome.trim() : '';
      if (!nome && !produtoNome) {
        const itemId = extractItemId(nextRecord);
        if (itemId) {
          const resolved = resolvedItemsMap.get(itemId);
          if (resolved) {
            nextRecord.nome = resolved.nome;
            if (nextRecord.descricao === undefined || nextRecord.descricao === null) {
              nextRecord.descricao = resolved.descricao ?? undefined;
            }
            changed = true;
          }
        }
      }

      const componentesPlano = enrichComponentList(record.componentesPlano);
      if (componentesPlano.changed) {
        nextRecord.componentesPlano = componentesPlano.value;
        changed = true;
      }

      const componentes = enrichComponentList(record.componentes);
      if (componentes.changed) {
        nextRecord.componentes = componentes.value;
        changed = true;
      }

      if (record.produto && typeof record.produto === 'object') {
        const nested = record.produto as Record<string, unknown>;
        const nextNested: Record<string, unknown> = { ...nested };
        let nestedChanged = false;

        const nestedNome = typeof nextNested.nome === 'string' ? nextNested.nome.trim() : '';
        if (!nestedNome) {
          const nestedId = extractItemId(nextNested);
          if (nestedId) {
            const resolved = resolvedItemsMap.get(nestedId);
            if (resolved) {
              nextNested.nome = resolved.nome;
              if (nextNested.descricao === undefined || nextNested.descricao === null) {
                nextNested.descricao = resolved.descricao ?? undefined;
              }
              nestedChanged = true;
            }
          }
        }

        const nestedComponentesPlano = enrichComponentList(nested.componentesPlano);
        if (nestedComponentesPlano.changed) {
          nextNested.componentesPlano = nestedComponentesPlano.value;
          nestedChanged = true;
        }

        const nestedComponentes = enrichComponentList(nested.componentes);
        if (nestedComponentes.changed) {
          nextNested.componentes = nestedComponentes.value;
          nestedChanged = true;
        }

        if (nestedChanged) {
          nextRecord.produto = nextNested;
          changed = true;
        }
      }

      return changed ? nextRecord : item;
    });
  }

  private maskEmail(email?: string | null): string {
    if (!email) return '[email]';
    const [local, domain] = String(email).split('@');
    if (!domain) return '[email]';
    const localMasked =
      local.length <= 2 ? `${local[0] || '*'}*` : `${local.slice(0, 2)}***${local.slice(-1)}`;
    return `${localMasked}@${domain}`;
  }

  private summarizeText(text?: string | null, max = 60): string {
    if (!text) return '[vazio]';
    const normalized = String(text).replace(/\s+/g, ' ').trim();
    if (!normalized) return '[vazio]';
    return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
  }

  private isComboSnapshotItem(item: unknown): boolean {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const record = item as Record<string, unknown>;
    const tipo = String(record.tipo ?? record.itemTipo ?? '').trim().toLowerCase();
    if (tipo === 'combo' || tipo.includes('combo')) {
      return true;
    }

    const origem = String(record.origem ?? '').trim().toLowerCase();
    if (origem === 'combo' || origem.includes('combo')) {
      return true;
    }

    const unidade = String(record.unidade ?? '').trim().toLowerCase();
    if (unidade === 'combo' || unidade === 'pacote') {
      return true;
    }

    const categoria = String(record.categoria ?? '').trim().toLowerCase();
    if (categoria === 'combo' || categoria.includes('combo')) {
      return true;
    }

    if (record.comboId || record.combo_id || record.idCombo) {
      return true;
    }

    return Array.isArray(record.produtosCombo) && record.produtosCombo.length > 0;
  }
  
  private getAnoPropostaAtual(): string {
    return String(new Date().getFullYear());
  }

  private extrairSequenciaNumeroProposta(numero: string | undefined, ano: string): number {
    if (!numero) {
      return 0;
    }

    const regexAnoAtual = new RegExp(`^PROP-${ano}-(\\d+)$`, 'i');
    const matchAnoAtual = String(numero).trim().match(regexAnoAtual);
    if (!matchAnoAtual?.[1]) {
      return 0;
    }

    const parsed = Number(matchAnoAtual[1]);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private async inicializarContador() {
    try {
      const anoAtual = this.getAnoPropostaAtual();
      const regexAnoAtual = `^PROP-${anoAtual}-(\\d+)$`;
      const rowsRaw = await this.propostaRepository.query(
        `
          SELECT COALESCE(MAX((regexp_match(numero, $1))[1]::int), 0) AS max_sequencia
          FROM propostas
          WHERE numero ~ $1
        `,
        [regexAnoAtual],
      );

      const rows = this.extractQueryRows<{ max_sequencia?: number | string }>(rowsRaw);
      const sequenciaAtual = Number(rows?.[0]?.max_sequencia ?? 0);
      this.contadorId = Number.isFinite(sequenciaAtual) && sequenciaAtual > 0 ? sequenciaAtual + 1 : 1;
      this.contadorInicializado = true;
    } catch (error) {
      this.contadorId = 1;
      this.contadorInicializado = false;
      this.logger.warn(
        `Erro ao inicializar contador de propostas: ${this.resolveErrorMessage(error, 'falha desconhecida')}`,
      );
    }
  }

  private async ensureContadorInicializado(): Promise<void> {
    if (this.contadorInicializado) {
      return;
    }

    try {
      await this.contadorInitPromise;
    } catch {
      // Recarrega abaixo para manter resiliancia.
    }

    if (this.contadorInicializado) {
      return;
    }

    this.contadorInitPromise = this.inicializarContador();
    await this.contadorInitPromise;
  }

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    const forceRefreshForLegacyE2ECompat =
      process.env.NODE_ENV === 'test' &&
      process.env.E2E_DB_COMPAT_LEGACY_SCHEMA === 'true';

    if (!forceRefreshForLegacyE2ECompat && this.tableColumnsCache.has(tableName)) {
      return this.tableColumnsCache.get(tableName)!;
    }

    const rows: Array<{ column_name?: string }> = await this.propostaRepository.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
      `,
      [tableName],
    );

    const columns = new Set(
      rows
        .map((row) => row.column_name)
        .filter((columnName): columnName is string => Boolean(columnName)),
    );

    this.tableColumnsCache.set(tableName, columns);
    return columns;
  }

  private extractQueryRows<T = any>(result: unknown): T[] {
    if (!result) {
      return [];
    }

    if (Array.isArray(result)) {
      // Some pg/typeorm paths return [rows, rowCount] for write queries.
      if (result.length === 2 && Array.isArray(result[0]) && typeof result[1] === 'number') {
        return result[0] as T[];
      }
      return result as T[];
    }

    const maybeObject = result as { rows?: unknown };
    if (Array.isArray(maybeObject?.rows)) {
      return maybeObject.rows as T[];
    }

    return [];
  }

  private async getTableColumnType(
    tableName: string,
    columnName: string,
  ): Promise<string | null> {
    const cacheKey = `${tableName}.${columnName}`;
    if (this.tableColumnTypeCache.has(cacheKey)) {
      return this.tableColumnTypeCache.get(cacheKey) ?? null;
    }

    const rowsRaw = await this.propostaRepository.query(
      `
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName],
    );

    const rows = this.extractQueryRows<{ data_type?: string; udt_name?: string }>(rowsRaw);
    const dataType = String(rows?.[0]?.udt_name || rows?.[0]?.data_type || '').trim().toLowerCase();
    const normalized = dataType.length > 0 ? dataType : null;
    this.tableColumnTypeCache.set(cacheKey, normalized);
    return normalized;
  }

  private async normalizeOportunidadeIdForPersistence(
    oportunidadeId: string | null,
  ): Promise<string | null> {
    if (!oportunidadeId) {
      return null;
    }

    const columnType = await this.getTableColumnType('propostas', 'oportunidade_id');
    if (!columnType) {
      return oportunidadeId;
    }

    if (columnType.includes('uuid')) {
      return isUUID(oportunidadeId) ? oportunidadeId : null;
    }

    if (
      columnType.includes('int') ||
      columnType.includes('numeric') ||
      columnType.includes('decimal')
    ) {
      const trimmed = oportunidadeId.trim();
      return /^-?\d+$/.test(trimmed) ? trimmed : null;
    }

    return oportunidadeId;
  }

  private async isTableColumnNullable(
    tableName: string,
    columnName: string,
  ): Promise<boolean | null> {
    const cacheKey = `${tableName}.${columnName}`;
    if (this.tableColumnNullableCache.has(cacheKey)) {
      return this.tableColumnNullableCache.get(cacheKey) ?? null;
    }

    const rowsRaw = await this.propostaRepository.query(
      `
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName],
    );

    const rows = this.extractQueryRows<{ is_nullable?: string }>(rowsRaw);
    const rawValue = String(rows?.[0]?.is_nullable || '')
      .trim()
      .toUpperCase();

    const nullable =
      rawValue === 'YES' ? true : rawValue === 'NO' ? false : null;

    this.tableColumnNullableCache.set(cacheKey, nullable);
    return nullable;
  }

  private isLegacyPropostasSchema(columns: Set<string>): boolean {
    return !columns.has('cliente');
  }

  private isLegacyStatusEnumMismatch(error: unknown): boolean {
    const message = String((error as any)?.message || '').toLowerCase();
    return (
      message.includes('invalid input value for enum propostas_status_enum') ||
      (message.includes('propostas_status_enum') && message.includes('invalid input value'))
    );
  }

  private async savePropostaWithStatusFallback(
    proposta: any,
    fluxoStatus: SalesFlowStatus,
  ): Promise<any> {
    try {
      return await this.propostaRepository.save(proposta);
    } catch (error) {
      if (!this.isLegacyStatusEnumMismatch(error)) {
        throw error;
      }

      const fallbackStatus = this.mapFlowStatusToDatabaseStatus(fluxoStatus, true);
      this.logger.warn(
        `Enum legado de status detectado em propostas. Aplicando fallback de status "${fluxoStatus}" -> "${fallbackStatus}".`,
      );
      proposta.status = fallbackStatus as any;

      const emailDetails =
        proposta.emailDetails && typeof proposta.emailDetails === 'object'
          ? { ...(proposta.emailDetails as Record<string, unknown>) }
          : {};
      (emailDetails as Record<string, unknown>).fluxoStatus = fluxoStatus;
      proposta.emailDetails = emailDetails as any;

      return await this.propostaRepository.save(proposta);
    }
  }

  private toIsoString(value: unknown): string {
    if (!value) {
      return new Date().toISOString();
    }

    const parsed = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }

    return parsed.toISOString();
  }

  private normalizeStatusInput(status: string | undefined | null): SalesFlowStatus {
    const normalized = (status || '')
      .toString()
      .trim()
      .toLowerCase();
    if (!normalized) {
      return FLOW_STATUS_FALLBACK;
    }

    const mapped = FLOW_STATUS_ALIAS[normalized];
    if (mapped) {
      return mapped;
    }

    if (FLOW_STATUS_VALUES.has(normalized as SalesFlowStatus)) {
      return normalized as SalesFlowStatus;
    }

    return FLOW_STATUS_FALLBACK;
  }

  private getAllowedStatusTransitions(currentStatus: SalesFlowStatus): readonly SalesFlowStatus[] {
    return FLOW_STATUS_TRANSITIONS[currentStatus] || [];
  }

  private getAllowedStatusTransitionsByPolicy(
    currentStatus: SalesFlowStatus,
    strictTransitionsEnabled: boolean,
  ): readonly SalesFlowStatus[] {
    const baseTransitions = [...this.getAllowedStatusTransitions(currentStatus)];

    if (!strictTransitionsEnabled && currentStatus === 'rascunho') {
      if (!baseTransitions.includes('aprovada')) {
        baseTransitions.push('aprovada');
      }
    }

    if (!this.salesMvpModeEnabled) {
      return baseTransitions;
    }

    return baseTransitions.filter((status) => !SALES_MVP_BLOCKED_FLOW_STATUSES.has(status));
  }

  private assertStatusAllowedBySalesMvp(status: SalesFlowStatus): void {
    if (!this.salesMvpModeEnabled) {
      return;
    }

    if (!SALES_MVP_BLOCKED_FLOW_STATUSES.has(status)) {
      return;
    }

    throw new BadRequestException(
      `Status "${status}" fora do escopo do MVP comercial. O fluxo encerra em contrato_assinado.`,
    );
  }

  private isStatusTransitionAllowed(
    currentStatus: SalesFlowStatus,
    nextStatus: SalesFlowStatus,
  ): boolean {
    if (currentStatus === nextStatus) {
      return true;
    }

    return this.getAllowedStatusTransitions(currentStatus).includes(nextStatus);
  }

  private isStatusTransitionAllowedByPolicy(
    currentStatus: SalesFlowStatus,
    nextStatus: SalesFlowStatus,
    strictTransitionsEnabled: boolean,
  ): boolean {
    if (currentStatus === nextStatus) {
      return true;
    }

    return this.getAllowedStatusTransitionsByPolicy(currentStatus, strictTransitionsEnabled).includes(
      nextStatus,
    );
  }

  private isDirectDraftApprovalTransition(
    currentStatus: SalesFlowStatus,
    nextStatus: SalesFlowStatus,
  ): boolean {
    return currentStatus === 'rascunho' && nextStatus === 'aprovada';
  }

  private normalizeOverrideReason(value: unknown): string | null {
    const normalized = String(value || '').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private hasPermission(
    actorPermissions: unknown,
    targetPermission: Permission,
  ): boolean {
    if (!Array.isArray(actorPermissions) || actorPermissions.length === 0) {
      return false;
    }

    return actorPermissions.some(
      (permission) =>
        typeof permission === 'string' &&
        permission.trim().toLowerCase() === targetPermission.toLowerCase(),
    );
  }

  private async resolveSalesFeatureFlag(
    empresaId: string | undefined,
    flagName: SalesFeatureFlagName,
    fallback: boolean,
  ): Promise<boolean> {
    try {
      return await this.oportunidadesService.isSalesFeatureEnabledForTenant(empresaId, flagName);
    } catch (error) {
      this.logger.warn(
        `Falha ao resolver feature flag ${flagName}. Aplicando fallback=${fallback}. Motivo: ${this.resolveErrorMessage(
          error,
          'erro desconhecido',
        )}`,
      );
      return fallback;
    }
  }

  private async isStrictPropostaTransitionsEnabled(empresaId?: string): Promise<boolean> {
    return this.resolveSalesFeatureFlag(empresaId, 'strictPropostaTransitions', true);
  }

  private async isDiscountPolicyPerTenantEnabled(empresaId?: string): Promise<boolean> {
    return this.resolveSalesFeatureFlag(empresaId, 'discountPolicyPerTenant', true);
  }

  private mapFlowStatusToDatabaseStatus(status: SalesFlowStatus, legacySchema: boolean): string {
    if (legacySchema) {
      switch (status) {
        case 'aprovada':
        case 'contrato_gerado':
        case 'contrato_assinado':
        case 'fatura_criada':
        case 'aguardando_pagamento':
        case 'pago':
          return 'aceita';
        case 'negociacao':
        case 'visualizada':
        case 'enviada':
          return 'enviada';
        case 'rejeitada':
          return 'rejeitada';
        case 'expirada':
          return 'expirada';
        case 'rascunho':
        default:
          return 'rascunho';
      }
    }

    switch (status) {
      case 'contrato_gerado':
      case 'contrato_assinado':
      case 'fatura_criada':
      case 'aguardando_pagamento':
      case 'pago':
        return 'aprovada';
      case 'negociacao':
        return 'visualizada';
      default:
        return status;
    }
  }

  private mapDatabaseStatusToFlowStatus(status: string | undefined): SalesFlowStatus {
    const normalized = (status || '').toString().toLowerCase().trim();
    if (!normalized) {
      return FLOW_STATUS_FALLBACK;
    }
    if (normalized === 'aceita') {
      return 'aprovada';
    }
    return this.normalizeStatusInput(normalized);
  }

  private sanitizeMotivoPerda(value: unknown): string | undefined {
    const motivo = String(value || '').trim();
    return motivo || undefined;
  }

  private toFiniteNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toObjectRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return { ...(value as Record<string, unknown>) };
  }

  private getLegacyEmailDetailsColumn(columns: Set<string>): string | null {
    if (columns.has('emailDetails')) {
      return 'emailDetails';
    }
    if (columns.has('email_details')) {
      return 'email_details';
    }
    return null;
  }

  private async persistLegacyEmailDetails(
    propostaId: string,
    empresaId: string | undefined,
    propostaColumns: Set<string>,
    emailDetails: Record<string, unknown>,
  ): Promise<void> {
    const emailDetailsColumn = this.getLegacyEmailDetailsColumn(propostaColumns);
    if (!emailDetailsColumn) {
      return;
    }

    const params: unknown[] = [JSON.stringify(emailDetails), propostaId];
    let whereClause = 'id = $2';

    if (empresaId) {
      params.push(empresaId);
      whereClause += ' AND empresa_id = $3';
    }

    await this.propostaRepository.query(
      `
        UPDATE propostas
        SET "${emailDetailsColumn}" = $1
        WHERE ${whereClause}
      `,
      params,
    );
  }

  private toJsonRecordOrUndefined(value: unknown): Record<string, unknown> | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private toJsonArrayOrEmpty(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return [...value];
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }

  private parseHistoryEvent(raw: unknown): PropostaHistoricoEvento | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const record = raw as Record<string, unknown>;
    const evento = String(record.evento || '').trim();
    if (!evento) {
      return null;
    }

    const timestamp = this.toIsoString(
      record.timestamp || record.data || record.criadoEm || new Date().toISOString(),
    );
    const metadata =
      record.metadata && typeof record.metadata === 'object'
        ? (record.metadata as Record<string, unknown>)
        : undefined;

    return {
      id: String(record.id || randomUUID()),
      evento,
      timestamp,
      origem: record.origem ? String(record.origem) : undefined,
      status: record.status ? this.normalizeStatusInput(String(record.status)) : undefined,
      detalhes: record.detalhes ? String(record.detalhes) : undefined,
      ip: record.ip ? String(record.ip) : undefined,
      userAgent: record.userAgent ? String(record.userAgent) : undefined,
      metadata,
    };
  }

  private getHistoricoEventos(emailDetails: unknown): PropostaHistoricoEvento[] {
    if (!emailDetails || typeof emailDetails !== 'object') {
      return [];
    }

    const rawEvents = (emailDetails as Record<string, unknown>).historicoEventos;
    if (!Array.isArray(rawEvents)) {
      return [];
    }

    return rawEvents
      .map((event) => this.parseHistoryEvent(event))
      .filter((event): event is PropostaHistoricoEvento => Boolean(event))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private getPortalEventos(emailDetails: unknown): PropostaHistoricoEvento[] {
    if (!emailDetails || typeof emailDetails !== 'object') {
      return [];
    }

    const rawEvents = (emailDetails as Record<string, unknown>).portalEventos;
    if (!Array.isArray(rawEvents)) {
      return [];
    }

    return rawEvents
      .map((event) => this.parseHistoryEvent(event))
      .filter((event): event is PropostaHistoricoEvento => Boolean(event))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private buildHistoryEvent(
    evento: string,
    payload?: Partial<PropostaHistoricoEvento>,
  ): PropostaHistoricoEvento {
    return {
      id: payload?.id || randomUUID(),
      evento,
      timestamp: this.toIsoString(payload?.timestamp || new Date().toISOString()),
      origem: payload?.origem,
      status: payload?.status,
      detalhes: payload?.detalhes,
      ip: payload?.ip,
      userAgent: payload?.userAgent,
      metadata: payload?.metadata,
    };
  }

  private appendHistoricoEvento(
    emailDetails: unknown,
    evento: string,
    payload?: Partial<PropostaHistoricoEvento>,
  ): Record<string, unknown> {
    const details = this.toObjectRecord(emailDetails);
    const historico = this.getHistoricoEventos(details);
    historico.push(this.buildHistoryEvent(evento, payload));
    details.historicoEventos = historico.slice(-this.MAX_HISTORICO_EVENTOS);
    return details;
  }

  private appendPortalEvento(
    emailDetails: unknown,
    evento: string,
    payload?: Partial<PropostaHistoricoEvento>,
  ): Record<string, unknown> {
    const details = this.appendHistoricoEvento(emailDetails, evento, payload);
    const portalEventos = this.getPortalEventos(details);
    portalEventos.push(this.buildHistoryEvent(evento, payload));
    details.portalEventos = portalEventos.slice(-this.MAX_HISTORICO_EVENTOS);
    return details;
  }

  private parseVersion(raw: unknown): PropostaVersao | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const record = raw as Record<string, unknown>;
    const versao = this.toFiniteNumber(record.versao, 0);
    if (!versao) {
      return null;
    }

    const snapshot = this.toObjectRecord(record.snapshot);
    return {
      versao,
      criadaEm: this.toIsoString(record.criadaEm || record.timestamp || new Date().toISOString()),
      origem: record.origem ? String(record.origem) : undefined,
      descricao: record.descricao ? String(record.descricao) : undefined,
      snapshot: {
        titulo: snapshot.titulo ? String(snapshot.titulo) : undefined,
        cliente: snapshot.cliente,
        produtos: Array.isArray(snapshot.produtos) ? (snapshot.produtos as unknown[]) : [],
        subtotal: this.toFiniteNumber(snapshot.subtotal, 0),
        descontoGlobal: this.toFiniteNumber(snapshot.descontoGlobal, 0),
        impostos: this.toFiniteNumber(snapshot.impostos, 0),
        total: this.toFiniteNumber(snapshot.total, 0),
        valor: this.toFiniteNumber(snapshot.valor, 0),
        formaPagamento: snapshot.formaPagamento ? String(snapshot.formaPagamento) : undefined,
        validadeDias: this.toFiniteNumber(snapshot.validadeDias, 0),
        dataVencimento: snapshot.dataVencimento ? this.toIsoString(snapshot.dataVencimento) : undefined,
        observacoes: snapshot.observacoes ? String(snapshot.observacoes) : undefined,
        status: snapshot.status
          ? this.normalizeStatusInput(String(snapshot.status))
          : FLOW_STATUS_FALLBACK,
      },
    };
  }

  private getVersoes(emailDetails: unknown): PropostaVersao[] {
    if (!emailDetails || typeof emailDetails !== 'object') {
      return [];
    }

    const rawVersions = (emailDetails as Record<string, unknown>).versoes;
    if (!Array.isArray(rawVersions)) {
      return [];
    }

    return rawVersions
      .map((version) => this.parseVersion(version))
      .filter((version): version is PropostaVersao => Boolean(version))
      .sort((a, b) => a.versao - b.versao);
  }

  private buildVersionSnapshot(entity: PropostaEntity): PropostaVersao['snapshot'] {
    const status =
      this.extractFlowStatusFromEmailDetails(entity.emailDetails) ||
      this.mapDatabaseStatusToFlowStatus(entity.status);

    return {
      titulo: entity.titulo || undefined,
      cliente: entity.cliente,
      produtos: Array.isArray(entity.produtos) ? entity.produtos : [],
      subtotal: this.toFiniteNumber(entity.subtotal, 0),
      descontoGlobal: this.toFiniteNumber(entity.descontoGlobal, 0),
      impostos: this.toFiniteNumber(entity.impostos, 0),
      total: this.toFiniteNumber(entity.total, 0),
      valor: this.toFiniteNumber(entity.valor, 0),
      formaPagamento: entity.formaPagamento || undefined,
      validadeDias: this.toFiniteNumber(entity.validadeDias, 0),
      dataVencimento: entity.dataVencimento ? entity.dataVencimento.toISOString() : undefined,
      observacoes: entity.observacoes || undefined,
      status,
    };
  }

  private appendVersionSnapshot(
    emailDetails: unknown,
    entity: PropostaEntity,
    origem?: string,
    descricao?: string,
  ): Record<string, unknown> {
    const details = this.toObjectRecord(emailDetails);
    const versoes = this.getVersoes(details);
    const proximaVersao = versoes.length > 0 ? versoes[versoes.length - 1].versao + 1 : 1;

    versoes.push({
      versao: proximaVersao,
      criadaEm: new Date().toISOString(),
      origem,
      descricao,
      snapshot: this.buildVersionSnapshot(entity),
    });

    details.versoes = versoes.slice(-this.MAX_VERSOES);
    return details;
  }

  private getMaxDescontoPercentual(
    descontoGlobal?: unknown,
    produtos?: unknown,
  ): number {
    const descontoGlobalPercentual = Math.max(this.toFiniteNumber(descontoGlobal, 0), 0);
    const descontosProdutos = Array.isArray(produtos)
      ? produtos.map((produto) =>
          Math.max(
            this.toFiniteNumber((produto as Record<string, unknown>)?.desconto, 0),
            0,
          ),
        )
      : [];

    return Math.max(descontoGlobalPercentual, ...descontosProdutos, 0);
  }

  private getDefaultCommercialPolicy(): PropostaCommercialPolicy {
    return {
      limiteDescontoPercentual: this.APROVACAO_DESCONTO_PADRAO,
      aprovacaoInternaHabilitada: this.APROVACAO_INTERNA_HABILITADA_PADRAO,
    };
  }

  private normalizeCommercialDiscountLimit(value: unknown): number {
    const normalized = this.toFiniteNumber(value, this.APROVACAO_DESCONTO_PADRAO);
    return Math.max(0, Math.min(100, normalized));
  }

  private normalizeCommercialApprovalToggle(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }

    return this.APROVACAO_INTERNA_HABILITADA_PADRAO;
  }

  private async resolveCommercialPolicy(empresaId?: string): Promise<PropostaCommercialPolicy> {
    const defaultPolicy = this.getDefaultCommercialPolicy();
    const normalizedEmpresaId = String(empresaId || '').trim();
    if (!normalizedEmpresaId) {
      return defaultPolicy;
    }

    const discountPolicyPerTenantEnabled =
      await this.isDiscountPolicyPerTenantEnabled(normalizedEmpresaId);
    if (!discountPolicyPerTenantEnabled) {
      return defaultPolicy;
    }

    if (this.COMMERCIAL_POLICY_CACHE_TTL_MS > 0) {
      const cached = this.commercialPolicyCache.get(normalizedEmpresaId);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.policy;
      }
    }

    try {
      const configColumns = await this.getTableColumns('empresa_configuracoes');
      if (
        !configColumns.has('comercial_limite_desconto_percentual') ||
        !configColumns.has('comercial_aprovacao_interna_habilitada')
      ) {
        return defaultPolicy;
      }

      const rows = await this.propostaRepository.query(
        `
          SELECT
            comercial_limite_desconto_percentual,
            comercial_aprovacao_interna_habilitada
          FROM empresa_configuracoes
          WHERE empresa_id = $1
          LIMIT 1
        `,
        [normalizedEmpresaId],
      );

      const row = this.extractQueryRows<Record<string, unknown>>(rows)?.[0];
      if (!row) {
        return defaultPolicy;
      }

      const policy: PropostaCommercialPolicy = {
        limiteDescontoPercentual: this.normalizeCommercialDiscountLimit(
          row.comercial_limite_desconto_percentual,
        ),
        aprovacaoInternaHabilitada: this.normalizeCommercialApprovalToggle(
          row.comercial_aprovacao_interna_habilitada,
        ),
      };

      if (this.COMMERCIAL_POLICY_CACHE_TTL_MS > 0) {
        this.commercialPolicyCache.set(normalizedEmpresaId, {
          expiresAt: Date.now() + this.COMMERCIAL_POLICY_CACHE_TTL_MS,
          policy,
        });
      }

      return policy;
    } catch (error) {
      this.logger.warn(
        `Falha ao carregar politica comercial da empresa ${normalizedEmpresaId}. Aplicando padrao. Motivo: ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
      );
      return defaultPolicy;
    }
  }

  private calcularAprovacaoInterna(
    descontoGlobal?: unknown,
    produtos?: unknown,
    atual?: PropostaAprovacaoInterna | null,
    policy?: PropostaCommercialPolicy | null,
  ): PropostaAprovacaoInterna {
    const resolvedPolicy = policy || this.getDefaultCommercialPolicy();
    const limiteDesconto = this.normalizeCommercialDiscountLimit(
      resolvedPolicy.limiteDescontoPercentual,
    );
    const descontoDetectado = this.getMaxDescontoPercentual(descontoGlobal, produtos);
    const aprovacaoInternaHabilitada = this.normalizeCommercialApprovalToggle(
      resolvedPolicy.aprovacaoInternaHabilitada,
    );

    if (!aprovacaoInternaHabilitada) {
      return {
        obrigatoria: false,
        status: 'nao_requer',
        limiteDesconto,
        descontoDetectado,
      };
    }

    const obrigatoria = descontoDetectado > limiteDesconto;
    const motivo = obrigatoria
      ? `Desconto de ${descontoDetectado.toFixed(2)}% acima do limite de ${limiteDesconto.toFixed(2)}%`
      : undefined;

    if (!obrigatoria) {
      return {
        obrigatoria: false,
        status: 'nao_requer',
        limiteDesconto,
        descontoDetectado,
        motivo,
      };
    }

    if (!atual) {
      return {
        obrigatoria: true,
        status: 'pendente',
        limiteDesconto,
        descontoDetectado,
        motivo,
      };
    }

    const manteveAprovacao =
      atual.status === 'aprovada' && descontoDetectado <= this.toFiniteNumber(atual.descontoDetectado, 0);

    if (manteveAprovacao) {
      return {
        ...atual,
        obrigatoria: true,
        status: 'aprovada',
        limiteDesconto,
        descontoDetectado,
        motivo,
      };
    }

    return {
      ...atual,
      obrigatoria: true,
      status: atual.status === 'rejeitada' ? 'rejeitada' : 'pendente',
      limiteDesconto,
      descontoDetectado,
      motivo,
      aprovadaEm: atual.status === 'rejeitada' ? undefined : atual.aprovadaEm,
      aprovadaPorId: atual.status === 'rejeitada' ? undefined : atual.aprovadaPorId,
      aprovadaPorNome: atual.status === 'rejeitada' ? undefined : atual.aprovadaPorNome,
    };
  }

  private parseAprovacaoInterna(emailDetails: unknown): PropostaAprovacaoInterna | null {
    if (!emailDetails || typeof emailDetails !== 'object') {
      return null;
    }

    const raw = (emailDetails as Record<string, unknown>).aprovacaoInterna;
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const data = raw as Record<string, unknown>;
    const statusRaw = String(data.status || '').trim().toLowerCase();
    const status: ApprovalStatus =
      statusRaw === 'pendente' || statusRaw === 'aprovada' || statusRaw === 'rejeitada'
        ? (statusRaw as ApprovalStatus)
        : 'nao_requer';

    return {
      obrigatoria: Boolean(data.obrigatoria),
      status,
      limiteDesconto: this.toFiniteNumber(data.limiteDesconto, this.APROVACAO_DESCONTO_PADRAO),
      descontoDetectado: this.toFiniteNumber(data.descontoDetectado, 0),
      motivo: data.motivo ? String(data.motivo) : undefined,
      solicitadaEm: data.solicitadaEm ? this.toIsoString(data.solicitadaEm) : undefined,
      solicitadaPorId: data.solicitadaPorId ? String(data.solicitadaPorId) : undefined,
      solicitadaPorNome: data.solicitadaPorNome ? String(data.solicitadaPorNome) : undefined,
      aprovadaEm: data.aprovadaEm ? this.toIsoString(data.aprovadaEm) : undefined,
      aprovadaPorId: data.aprovadaPorId ? String(data.aprovadaPorId) : undefined,
      aprovadaPorNome: data.aprovadaPorNome ? String(data.aprovadaPorNome) : undefined,
      rejeitadaEm: data.rejeitadaEm ? this.toIsoString(data.rejeitadaEm) : undefined,
      rejeitadaPorId: data.rejeitadaPorId ? String(data.rejeitadaPorId) : undefined,
      rejeitadaPorNome: data.rejeitadaPorNome ? String(data.rejeitadaPorNome) : undefined,
      observacoes: data.observacoes ? String(data.observacoes) : undefined,
    };
  }

  private getLembretes(emailDetails: unknown): PropostaLembrete[] {
    if (!emailDetails || typeof emailDetails !== 'object') {
      return [];
    }

    const rawLembretes = (emailDetails as Record<string, unknown>).lembretes;
    if (!Array.isArray(rawLembretes)) {
      return [];
    }

    return rawLembretes
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const raw = item as Record<string, unknown>;
        return {
          id: String(raw.id || randomUUID()),
          status:
            String(raw.status || 'agendado') === 'enviado'
              ? 'enviado'
              : String(raw.status || 'agendado') === 'cancelado'
                ? 'cancelado'
                : 'agendado',
          agendadoPara: this.toIsoString(raw.agendadoPara || new Date().toISOString()),
          criadoEm: this.toIsoString(raw.criadoEm || new Date().toISOString()),
          diasApos: this.toFiniteNumber(raw.diasApos, 0),
          observacoes: raw.observacoes ? String(raw.observacoes) : undefined,
          origem: raw.origem ? String(raw.origem) : undefined,
        } as PropostaLembrete;
      })
      .filter((item): item is PropostaLembrete => Boolean(item));
  }

  private extractFlowStatusFromEmailDetails(emailDetails: unknown): SalesFlowStatus | null {
    if (!emailDetails || typeof emailDetails !== 'object') {
      return null;
    }

    const flowRaw = (emailDetails as { fluxoStatus?: unknown }).fluxoStatus;
    if (!flowRaw) {
      return null;
    }
    return this.normalizeStatusInput(String(flowRaw));
  }

  private extractMotivoPerdaFromEmailDetails(emailDetails: unknown): string | undefined {
    if (!emailDetails || typeof emailDetails !== 'object') {
      return undefined;
    }

    const raw = (emailDetails as { motivoPerda?: unknown }).motivoPerda;
    return this.sanitizeMotivoPerda(raw);
  }

  private parseLegacyFlowMetadata(observacoes?: string | null): {
    observacoesLimpa?: string;
    fluxoStatus?: SalesFlowStatus;
    motivoPerda?: string;
  } {
    const texto = String(observacoes || '');
    const marker = '\n\n[FLOW_META]';
    const markerIndex = texto.lastIndexOf(marker);

    if (markerIndex < 0) {
      return {
        observacoesLimpa: texto || undefined,
      };
    }

    const base = texto.slice(0, markerIndex);
    const metaRaw = texto.slice(markerIndex + marker.length).trim();
    try {
      const meta = JSON.parse(metaRaw) as {
        fluxoStatus?: string;
        motivoPerda?: string;
      };
      return {
        observacoesLimpa: base || undefined,
        fluxoStatus: meta.fluxoStatus ? this.normalizeStatusInput(meta.fluxoStatus) : undefined,
        motivoPerda: this.sanitizeMotivoPerda(meta.motivoPerda),
      };
    } catch {
      return {
        observacoesLimpa: texto || undefined,
      };
    }
  }

  private mergeLegacyFlowMetadata(
    observacoesAtual: string | undefined | null,
    payload: {
      fluxoStatus?: SalesFlowStatus;
      motivoPerda?: string;
      observacoes?: string;
    },
  ): string | undefined {
    const atual = this.parseLegacyFlowMetadata(observacoesAtual);
    const observacoesLimpa =
      payload.observacoes !== undefined ? payload.observacoes : atual.observacoesLimpa;
    const fluxoStatus = payload.fluxoStatus ?? atual.fluxoStatus;
    const motivoPerda =
      payload.motivoPerda !== undefined
        ? this.sanitizeMotivoPerda(payload.motivoPerda)
        : atual.motivoPerda;

    const base = String(observacoesLimpa || '').trim();
    if (!fluxoStatus && !motivoPerda) {
      return base || undefined;
    }

    const meta = JSON.stringify({
      fluxoStatus,
      ...(motivoPerda ? { motivoPerda } : {}),
    });

    return base ? `${base}\n\n[FLOW_META]${meta}` : `[FLOW_META]${meta}`;
  }

  private async resolveFallbackUserId(empresaId: string): Promise<string> {
    const usersRows: Array<{ id?: string }> = await this.propostaRepository.query(
      `
        SELECT id
        FROM users
        WHERE empresa_id = $1
        ORDER BY COALESCE(criado_em, NOW()) DESC
        LIMIT 1
      `,
      [empresaId],
    );

    return usersRows?.[0]?.id || randomUUID();
  }

  private isUuid(value?: string | null): boolean {
    return Boolean(value && isUUID(String(value).trim()));
  }

  private async findVendedorIdByNome(
    nomeVendedor: string,
    empresaId?: string,
  ): Promise<string | null> {
    const nomeNormalizado = String(nomeVendedor || '').trim();
    if (!nomeNormalizado) {
      return null;
    }

    const vendedor = await this.userRepository.findOne({
      where: empresaId
        ? { nome: nomeNormalizado, empresa_id: empresaId }
        : { nome: nomeNormalizado },
    });

    return vendedor?.id || null;
  }

  private async resolveVendedorIdFromPayload(
    vendedor: unknown,
    empresaId?: string,
    explicitVendedorId?: unknown,
  ): Promise<string | null> {
    const explicitId = String(explicitVendedorId || '').trim();
    if (this.isUuid(explicitId)) {
      return explicitId;
    }

    if (!vendedor) {
      return null;
    }

    if (typeof vendedor === 'string') {
      const vendedorNormalizado = vendedor.trim();
      if (!vendedorNormalizado) {
        return null;
      }

      if (this.isUuid(vendedorNormalizado)) {
        return vendedorNormalizado;
      }

      return this.findVendedorIdByNome(vendedorNormalizado, empresaId);
    }

    if (typeof vendedor === 'object') {
      const vendedorRecord = vendedor as Record<string, unknown>;
      const vendedorId = String(vendedorRecord.id || '').trim();
      if (this.isUuid(vendedorId)) {
        return vendedorId;
      }

      const nomeVendedor = String(vendedorRecord.nome || '').trim();
      if (nomeVendedor) {
        return this.findVendedorIdByNome(nomeVendedor, empresaId);
      }
    }

    return null;
  }

  private async ensureLegacyOportunidadeId(
    empresaId: string,
    titulo: string,
    valor: number,
    vendedorId: string | null,
  ): Promise<string> {
    const oportunidadeColumns = await this.getTableColumns('oportunidades');
    const hasResponsavelId = oportunidadeColumns.has('responsavel_id');
    const hasUsuarioId = oportunidadeColumns.has('usuario_id');

    const insertColumns: string[] = ['empresa_id', 'titulo', 'valor'];
    const insertValues: unknown[] = [empresaId, titulo, valor];

    const fallbackUserId =
      hasResponsavelId || hasUsuarioId
        ? vendedorId || (await this.resolveFallbackUserId(empresaId))
        : null;

    // Compatibilidade com schemas hibridos: pode existir responsavel_id e usuario_id ao mesmo tempo.
    if (hasResponsavelId) {
      insertColumns.push('responsavel_id');
      insertValues.push(fallbackUserId);
    }

    if (hasUsuarioId) {
      insertColumns.push('usuario_id');
      insertValues.push(fallbackUserId);
    }

    if (oportunidadeColumns.has('estagio')) {
      insertColumns.push('estagio');
      insertValues.push('lead');
    }

    if (oportunidadeColumns.has('probabilidade')) {
      insertColumns.push('probabilidade');
      insertValues.push(0);
    }

    if (oportunidadeColumns.has('lifecycle_status')) {
      insertColumns.push('lifecycle_status');
      insertValues.push('open');
    }

    const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(', ');
    const resultRaw = await this.propostaRepository.query(
      `
        INSERT INTO oportunidades (${insertColumns.map((column) => `"${column}"`).join(', ')})
        VALUES (${placeholders})
        RETURNING id
      `,
      insertValues,
    );
    const result = this.extractQueryRows<{ id: string }>(resultRaw);
    return result?.[0]?.id || randomUUID();
  }

  private buildLegacyInterface(
    row: any,
    overrides: Partial<Proposta> = {},
    defaultClienteNome = 'Cliente nao informado',
  ): Proposta {
    const valor = Number(row?.valor ?? overrides.valor ?? 0);
    const total = Number(overrides.total ?? overrides.valor ?? row?.total ?? valor);
    const subtotal = Number(overrides.subtotal ?? row?.subtotal ?? total);
    const descontoGlobal = Number(overrides.descontoGlobal ?? row?.descontoGlobal ?? 0);
    const impostos = Number(overrides.impostos ?? row?.impostos ?? 0);
    const criadaEmIso = this.toIsoString(
      row?.criado_em ?? row?.criadaEm ?? overrides.criadaEm ?? overrides.createdAt,
    );
    const atualizadaEmIso = this.toIsoString(
      row?.atualizado_em ?? row?.atualizadaEm ?? overrides.atualizadaEm ?? overrides.updatedAt,
    );
    const dataVencimentoIso = this.toIsoString(
      row?.validade ?? row?.dataVencimento ?? overrides.dataVencimento,
    );
    const observacoesRaw =
      overrides.observacoes ??
      row?.observacoes ??
      row?.descricao ??
      (row?.cliente ? row?.cliente.observacoes : undefined);
    const emailDetailsFonte = overrides.emailDetails ?? row?.emailDetails ?? row?.email_details;
    const emailDetails = this.toJsonRecordOrUndefined(emailDetailsFonte);
    const versoes = this.getVersoes(emailDetails);
    const historicoEventos = this.getHistoricoEventos(emailDetails);
    const portalEventos = this.getPortalEventos(emailDetails);
    const aprovacaoInterna = this.parseAprovacaoInterna(emailDetails) || undefined;
    const lembretes = this.getLembretes(emailDetails);
    const legacyMeta = this.parseLegacyFlowMetadata(observacoesRaw);
    const statusFromEmail = this.extractFlowStatusFromEmailDetails(emailDetails);
    const motivoPerdaFromEmail = this.extractMotivoPerdaFromEmailDetails(emailDetails);
    const produtosDaUltimaVersao =
      versoes.length > 0 &&
      Array.isArray(versoes[versoes.length - 1]?.snapshot?.produtos)
        ? (versoes[versoes.length - 1].snapshot.produtos as unknown[])
        : [];
    const statusCalculado = overrides.status
      ? this.normalizeStatusInput(overrides.status as string)
      : statusFromEmail || legacyMeta.fluxoStatus || this.mapDatabaseStatusToFlowStatus(row?.status);
    const motivoPerda = overrides.motivoPerda ?? motivoPerdaFromEmail ?? legacyMeta.motivoPerda;

    const clienteFallback: Proposta['cliente'] = {
      id: 'cliente-legacy',
      nome: defaultClienteNome,
      email: '',
    };

    const clienteFromRow = this.toJsonRecordOrUndefined(row?.cliente);
    const clienteFromOverrides =
      overrides.cliente && typeof overrides.cliente === 'object'
        ? (overrides.cliente as Record<string, unknown>)
        : undefined;
    const clienteRaw = clienteFromOverrides || clienteFromRow;
    const clienteNomeFallback = String(
      row?.clienteNome || row?.cliente_nome || defaultClienteNome || 'Cliente nao informado',
    );
    const cliente: Proposta['cliente'] = clienteRaw
      ? {
          id: String(clienteRaw.id || 'cliente-legacy'),
          nome: String(clienteRaw.nome || clienteNomeFallback),
          email: String(clienteRaw.email || ''),
          telefone:
            clienteRaw.telefone !== undefined ? String(clienteRaw.telefone || '') : undefined,
          documento:
            clienteRaw.documento !== undefined ? String(clienteRaw.documento || '') : undefined,
          status: clienteRaw.status !== undefined ? String(clienteRaw.status || '') : undefined,
        }
      : typeof row?.cliente === 'string' && String(row.cliente).trim()
        ? {
            id: 'cliente-legacy',
            nome: String(row.cliente).trim(),
            email: '',
          }
        : clienteFallback;

    const produtosFromRow = this.toJsonArrayOrEmpty(row?.produtos);
    const parcelas = Number(overrides.parcelas ?? row?.parcelas ?? 0);
    const produtos =
      Array.isArray(overrides.produtos) && overrides.produtos.length > 0
        ? overrides.produtos
        : produtosFromRow.length > 0
          ? produtosFromRow
        : produtosDaUltimaVersao;

    const formaPagamento = String(
      overrides.formaPagamento || row?.formaPagamento || row?.forma_pagamento || 'avista',
    ).trim();
    const validadeDias = Number(
      overrides.validadeDias ?? row?.validadeDias ?? row?.validade_dias ?? 30,
    );
    const incluirImpostosPDF = Boolean(
      overrides.incluirImpostosPDF ??
        row?.incluirImpostosPDF ??
        row?.incluir_impostos_pdf ??
        false,
    );
    const emailDetailsNormalizado = emailDetails
      ? {
          ...emailDetails,
          fluxoStatus: statusCalculado,
          ...(motivoPerda !== undefined ? { motivoPerda } : {}),
          historicoEventos,
          portalEventos,
          versoes,
          aprovacaoInterna,
          lembretes,
        }
      : undefined;

    return {
      id: row?.id ?? overrides.id ?? randomUUID(),
      numero: row?.numero ?? overrides.numero ?? this.gerarNumero(),
      titulo: row?.titulo ?? overrides.titulo,
      oportunidadeId:
        overrides.oportunidadeId ??
        this.normalizeOportunidadeId(row?.oportunidade_id ?? row?.oportunidadeId),
      cliente,
      produtos: produtos as Proposta['produtos'],
      subtotal,
      descontoGlobal,
      impostos,
      total,
      valor,
      formaPagamento: formaPagamento as any,
      parcelas: Number.isFinite(parcelas) && parcelas > 1 ? parcelas : undefined,
      validadeDias: Number.isFinite(validadeDias) && validadeDias > 0 ? validadeDias : 30,
      observacoes: legacyMeta.observacoesLimpa,
      incluirImpostosPDF,
      status: statusCalculado,
      motivoPerda,
      dataVencimento: dataVencimentoIso,
      criadaEm: criadaEmIso,
      atualizadaEm: atualizadaEmIso,
      createdAt: criadaEmIso,
      updatedAt: atualizadaEmIso,
      source: overrides.source ?? row?.source ?? 'api',
      vendedor: overrides.vendedor,
      portalAccess: overrides.portalAccess,
      emailDetails: emailDetailsNormalizado as any,
      historicoEventos,
      versoes,
      aprovacaoInterna,
      lembretes,
    };
  }

  /**
   * Converter entidade para interface de retorno
   */
  private entityToInterface(entity: PropostaEntity): Proposta {
    const fluxoStatus =
      this.extractFlowStatusFromEmailDetails(entity.emailDetails) ||
      this.mapDatabaseStatusToFlowStatus(entity.status);
    const motivoPerda = this.extractMotivoPerdaFromEmailDetails(entity.emailDetails);
    const historicoEventos = this.getHistoricoEventos(entity.emailDetails);
    const versoes = this.getVersoes(entity.emailDetails);
    const aprovacaoInterna = this.parseAprovacaoInterna(entity.emailDetails) || undefined;
    const lembretes = this.getLembretes(entity.emailDetails);

    const parcelasFromEmail = Number((entity.emailDetails as any)?.parcelas ?? 0);
    const parcelas = Number.isFinite(parcelasFromEmail) && parcelasFromEmail > 1 ? parcelasFromEmail : undefined;

    return {
      id: entity.id,
      numero: entity.numero,
      titulo: entity.titulo,
      oportunidadeId: this.normalizeOportunidadeId(entity.oportunidade_id),
      cliente: entity.cliente,
      produtos: entity.produtos,
      subtotal: Number(entity.subtotal),
      descontoGlobal: Number(entity.descontoGlobal),
      impostos: Number(entity.impostos),
      total: Number(entity.total),
      valor: Number(entity.valor),
      formaPagamento: entity.formaPagamento as any,
      parcelas,
      validadeDias: entity.validadeDias,
      observacoes: entity.observacoes,
      incluirImpostosPDF: entity.incluirImpostosPDF,
      status: fluxoStatus,
      motivoPerda,
      dataVencimento: entity.dataVencimento?.toISOString(),
      criadaEm: entity.criadaEm?.toISOString(),
      atualizadaEm: entity.atualizadaEm?.toISOString(),
      createdAt: entity.criadaEm?.toISOString(),
      updatedAt: entity.atualizadaEm?.toISOString(),
      source: entity.source,
      vendedor: entity.vendedor
        ? {
            id: entity.vendedor.id,
            nome: entity.vendedor.nome,
            email: entity.vendedor.email,
            tipo: (() => {
              const vendedorRole = (entity.vendedor.role || '').toString().toLowerCase();
              if (vendedorRole === 'admin' || vendedorRole === 'superadmin') return 'admin';
              if (vendedorRole === 'gerente' || vendedorRole === 'manager') return 'gerente';
              return 'vendedor';
            })(),
            ativo: entity.vendedor.ativo,
          }
        : entity.vendedor_id,
      portalAccess: entity.portalAccess || undefined,
      emailDetails: entity.emailDetails
        ? {
            ...entity.emailDetails,
            fluxoStatus,
            motivoPerda,
            historicoEventos,
            portalEventos: this.getPortalEventos(entity.emailDetails),
            versoes,
            aprovacaoInterna,
            lembretes,
          }
        : undefined,
      historicoEventos,
      versoes,
      aprovacaoInterna,
      lembretes,
    };
  }

  private async buscarPropostasComContratoAssinado(
    propostaIds: string[],
    empresaId?: string,
  ): Promise<Set<string>> {
    const ids = Array.from(
      new Set(
        propostaIds
          .map((id) => String(id || '').trim())
          .filter(Boolean),
      ),
    );

    if (ids.length === 0) {
      return new Set<string>();
    }

    const params: unknown[] = [ids];
    const filtroEmpresa = empresaId ? 'AND c.empresa_id::text = $2::text' : '';
    if (empresaId) {
      params.push(String(empresaId));
    }

    try {
      const rows: Array<{ proposta_id?: string }> = await this.propostaRepository.query(
        `
          SELECT c."propostaId"::text AS proposta_id
          FROM contratos c
          WHERE c."propostaId" IS NOT NULL
            AND c."propostaId"::text = ANY($1::text[])
            AND c.status = 'assinado'
            AND c.ativo = true
            ${filtroEmpresa}
          GROUP BY c."propostaId"
        `,
        params,
      );

      return new Set(
        rows
          .map((row) => String(row?.proposta_id || '').trim())
          .filter(Boolean),
      );
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel consultar contratos assinados para reconciliar status das propostas: ${this.resolveErrorMessage(error, 'falha desconhecida')}`,
      );
      return new Set<string>();
    }
  }

  private isStatusAntesDoContratoAssinado(status: SalesFlowStatus): boolean {
    return [
      'rascunho',
      'enviada',
      'visualizada',
      'negociacao',
      'aprovada',
      'contrato_gerado',
    ].includes(status);
  }

  private aplicarStatusContratoAssinadoSeNecessario(
    proposta: Proposta,
    possuiContratoAssinado: boolean,
  ): Proposta {
    if (!possuiContratoAssinado) {
      return proposta;
    }

    const statusAtual = this.normalizeStatusInput(proposta.status);
    if (!this.isStatusAntesDoContratoAssinado(statusAtual)) {
      return proposta;
    }

    const emailDetails =
      proposta.emailDetails && typeof proposta.emailDetails === 'object'
        ? {
            ...proposta.emailDetails,
            fluxoStatus: 'contrato_assinado' as SalesFlowStatus,
          }
        : {
            fluxoStatus: 'contrato_assinado' as SalesFlowStatus,
          };

    return {
      ...proposta,
      status: 'contrato_assinado',
      emailDetails,
    };
  }

  private gerarId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const anoAtual = this.getAnoPropostaAtual();
    return `PROP-${anoAtual}-${timestamp}-${random}`;
  }

  private gerarNumero(): string {
    const anoAtual = this.getAnoPropostaAtual();
    return `PROP-${anoAtual}-${this.contadorId.toString().padStart(3, '0')}`;
  }

  /**
   * Lista todas as propostas
   */
  async listarPropostas(empresaId?: string): Promise<Proposta[]> {
    try {
      const columns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(columns);

      if (legacySchema) {
        const createdColumn = columns.has('criado_em') ? 'criado_em' : 'criadaEm';
        const updatedColumn = columns.has('atualizado_em') ? 'atualizado_em' : 'atualizadaEm';
        const whereClause = empresaId ? 'WHERE p.empresa_id = $1' : '';
        const params = empresaId ? [empresaId] : [];
        const descricaoExpr = columns.has('descricao')
          ? 'p.descricao'
          : columns.has('observacoes')
            ? 'p.observacoes'
            : 'NULL';
        const validadeExpr = columns.has('validade')
          ? 'p.validade'
          : columns.has('dataVencimento')
            ? 'p."dataVencimento"'
            : 'NULL';
        const emailDetailsExpr = columns.has('emailDetails')
          ? 'p."emailDetails"'
          : columns.has('email_details')
            ? 'p.email_details'
            : 'NULL';
        const subtotalExpr = columns.has('subtotal') ? 'p.subtotal' : 'NULL';
        const descontoGlobalExpr = columns.has('descontoGlobal')
          ? 'p."descontoGlobal"'
          : columns.has('desconto_global')
            ? 'p.desconto_global'
            : 'NULL';
        const impostosExpr = columns.has('impostos') ? 'p.impostos' : 'NULL';
        const totalExpr = columns.has('total') ? 'p.total' : 'NULL';
        const formaPagamentoExpr = columns.has('formaPagamento')
          ? 'p."formaPagamento"'
          : columns.has('forma_pagamento')
            ? 'p.forma_pagamento'
            : 'NULL';
        const validadeDiasExpr = columns.has('validadeDias')
          ? 'p."validadeDias"'
          : columns.has('validade_dias')
            ? 'p.validade_dias'
            : 'NULL';
        const incluirImpostosPDFExpr = columns.has('incluirImpostosPDF')
          ? 'p."incluirImpostosPDF"'
          : columns.has('incluir_impostos_pdf')
            ? 'p.incluir_impostos_pdf'
            : 'NULL';
        const parcelasExpr = columns.has('parcelas') ? 'p.parcelas' : 'NULL';
        const clienteExpr = columns.has('cliente') ? 'p.cliente' : 'NULL';
        const produtosExpr = columns.has('produtos') ? 'p.produtos' : 'NULL';
        const sourceExpr = columns.has('source') ? 'p.source' : 'NULL';

        const rows: any[] = await this.propostaRepository.query(
          `
            SELECT
              p.id,
              p.numero,
              p.titulo,
              p.valor,
              ${totalExpr} AS total,
              ${subtotalExpr} AS subtotal,
              ${descontoGlobalExpr} AS "descontoGlobal",
              ${impostosExpr} AS impostos,
              ${formaPagamentoExpr} AS "formaPagamento",
              ${validadeDiasExpr} AS "validadeDias",
              ${incluirImpostosPDFExpr} AS "incluirImpostosPDF",
              ${parcelasExpr} AS parcelas,
              ${clienteExpr} AS cliente,
              ${produtosExpr} AS produtos,
              ${sourceExpr} AS source,
              p.status,
              ${descricaoExpr} AS descricao,
              ${validadeExpr} AS validade,
              ${emailDetailsExpr} AS email_details,
              p.${createdColumn} AS criado_em,
              p.${updatedColumn} AS atualizado_em
            FROM propostas p
            ${whereClause}
            ORDER BY p.${createdColumn} DESC
          `,
          params,
        );

        const propostas = rows.map((row) => this.buildLegacyInterface(row));
        const propostasComContratoAssinado = await this.buscarPropostasComContratoAssinado(
          propostas.map((proposta) => String(proposta.id || '')),
          empresaId,
        );

        const propostasComStatus = propostas.map((proposta) =>
          this.aplicarStatusContratoAssinadoSeNecessario(
            proposta,
            propostasComContratoAssinado.has(String(proposta.id || '')),
          ),
        );
        return this.hydratePropostasOpportunityContext(propostasComStatus, empresaId);
      }

      const entities = await this.propostaRepository.find({
        where: empresaId ? { empresaId } : undefined,
        order: { criadaEm: 'DESC' },
        relations: columns.has('vendedor_id') ? ['vendedor'] : [],
      });

      this.logger.debug(`${entities.length} propostas encontradas no banco`);
      const propostas = entities.map((entity) => this.entityToInterface(entity));
      const propostasComContratoAssinado = await this.buscarPropostasComContratoAssinado(
        propostas.map((proposta) => String(proposta.id || '')),
        empresaId,
      );

      const propostasComStatus = propostas.map((proposta) =>
        this.aplicarStatusContratoAssinadoSeNecessario(
          proposta,
          propostasComContratoAssinado.has(String(proposta.id || '')),
        ),
      );
      return this.hydratePropostasOpportunityContext(propostasComStatus, empresaId);
    } catch (error) {
      this.logger.error('Erro ao listar propostas', error?.stack || String(error));
      return [];
    }
  }

  /**
   * Obtem uma proposta especifica
   */
  async obterProposta(id: string, empresaId?: string): Promise<Proposta | null> {
    try {
      const columns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(columns);

      if (legacySchema) {
        const createdColumn = columns.has('criado_em') ? 'criado_em' : 'criadaEm';
        const updatedColumn = columns.has('atualizado_em') ? 'atualizado_em' : 'atualizadaEm';
        const whereClause = empresaId
          ? 'WHERE p.id = $1 AND p.empresa_id = $2'
          : 'WHERE p.id = $1';
        const params = empresaId ? [id, empresaId] : [id];
        const descricaoExpr = columns.has('descricao')
          ? 'p.descricao'
          : columns.has('observacoes')
            ? 'p.observacoes'
            : 'NULL';
        const validadeExpr = columns.has('validade')
          ? 'p.validade'
          : columns.has('dataVencimento')
            ? 'p."dataVencimento"'
            : 'NULL';
        const emailDetailsExpr = columns.has('emailDetails')
          ? 'p."emailDetails"'
          : columns.has('email_details')
            ? 'p.email_details'
            : 'NULL';
        const subtotalExpr = columns.has('subtotal') ? 'p.subtotal' : 'NULL';
        const descontoGlobalExpr = columns.has('descontoGlobal')
          ? 'p."descontoGlobal"'
          : columns.has('desconto_global')
            ? 'p.desconto_global'
            : 'NULL';
        const impostosExpr = columns.has('impostos') ? 'p.impostos' : 'NULL';
        const totalExpr = columns.has('total') ? 'p.total' : 'NULL';
        const formaPagamentoExpr = columns.has('formaPagamento')
          ? 'p."formaPagamento"'
          : columns.has('forma_pagamento')
            ? 'p.forma_pagamento'
            : 'NULL';
        const validadeDiasExpr = columns.has('validadeDias')
          ? 'p."validadeDias"'
          : columns.has('validade_dias')
            ? 'p.validade_dias'
            : 'NULL';
        const incluirImpostosPDFExpr = columns.has('incluirImpostosPDF')
          ? 'p."incluirImpostosPDF"'
          : columns.has('incluir_impostos_pdf')
            ? 'p.incluir_impostos_pdf'
            : 'NULL';
        const parcelasExpr = columns.has('parcelas') ? 'p.parcelas' : 'NULL';
        const clienteExpr = columns.has('cliente') ? 'p.cliente' : 'NULL';
        const produtosExpr = columns.has('produtos') ? 'p.produtos' : 'NULL';
        const sourceExpr = columns.has('source') ? 'p.source' : 'NULL';

        const rows: any[] = await this.propostaRepository.query(
          `
            SELECT
              p.id,
              p.numero,
              p.titulo,
              p.valor,
              ${totalExpr} AS total,
              ${subtotalExpr} AS subtotal,
              ${descontoGlobalExpr} AS "descontoGlobal",
              ${impostosExpr} AS impostos,
              ${formaPagamentoExpr} AS "formaPagamento",
              ${validadeDiasExpr} AS "validadeDias",
              ${incluirImpostosPDFExpr} AS "incluirImpostosPDF",
              ${parcelasExpr} AS parcelas,
              ${clienteExpr} AS cliente,
              ${produtosExpr} AS produtos,
              ${sourceExpr} AS source,
              p.status,
              ${descricaoExpr} AS descricao,
              ${validadeExpr} AS validade,
              ${emailDetailsExpr} AS email_details,
              p.${createdColumn} AS criado_em,
              p.${updatedColumn} AS atualizado_em
            FROM propostas p
            ${whereClause}
            LIMIT 1
          `,
          params,
        );

        if (!rows?.[0]) {
          return null;
        }

        const proposta = this.buildLegacyInterface(rows[0]);
        const propostasComContratoAssinado = await this.buscarPropostasComContratoAssinado(
          [String(proposta.id || '')],
          empresaId,
        );

        const propostaComStatus = this.aplicarStatusContratoAssinadoSeNecessario(
          proposta,
          propostasComContratoAssinado.has(String(proposta.id || '')),
        );
        const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
          [propostaComStatus],
          empresaId,
        );
        return propostaHidratada || propostaComStatus;
      }

      const entity = await this.propostaRepository.findOne({
        where: empresaId ? { id, empresaId } : { id },
        relations: columns.has('vendedor_id') ? ['vendedor'] : [],
      });

      if (!entity) {
        return null;
      }

      const proposta = this.entityToInterface(entity);
      const propostasComContratoAssinado = await this.buscarPropostasComContratoAssinado(
        [String(proposta.id || '')],
        empresaId,
      );

      const propostaComStatus = this.aplicarStatusContratoAssinadoSeNecessario(
        proposta,
        propostasComContratoAssinado.has(String(proposta.id || '')),
      );
      const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
        [propostaComStatus],
        empresaId,
      );
      return propostaHidratada || propostaComStatus;
    } catch (error) {
      this.logger.error('Erro ao obter proposta', error?.stack || String(error));
      return null;
    }
  }

  /**
   * Cria uma nova proposta
   */
  async criarProposta(dadosProposta: Partial<Proposta>, empresaId?: string): Promise<Proposta> {
    try {
      await this.ensureContadorInicializado();
      const numero = this.gerarNumero();
      this.contadorId++;
      const empresaIdProposta =
        empresaId ?? (dadosProposta as any).empresaId ?? (dadosProposta as any).empresa_id;
      const commercialPolicy = await this.resolveCommercialPolicy(empresaIdProposta);

      const vendedorId = await this.resolveVendedorIdFromPayload(
        dadosProposta.vendedor,
        empresaIdProposta,
        (dadosProposta as any).vendedorId,
      );

      if (vendedorId) {
        this.logger.debug(
          `Vendedor resolvido para criacao: ${JSON.stringify({
            nome:
              dadosProposta.vendedor && typeof dadosProposta.vendedor === 'object'
                ? this.summarizeText((dadosProposta.vendedor as any).nome, 40)
                : this.summarizeText(dadosProposta.vendedor as string, 40),
            vendedorId,
          })}`,
        );
      } else if (dadosProposta.vendedor !== undefined || (dadosProposta as any).vendedorId !== undefined) {
        this.logger.warn(
          `Vendedor nao resolvido para criacao: ${JSON.stringify({
            vendedor: this.summarizeText(
              typeof dadosProposta.vendedor === 'string'
                ? dadosProposta.vendedor
                : (dadosProposta.vendedor as any)?.nome,
              40,
            ),
            vendedorId: this.summarizeText(String((dadosProposta as any).vendedorId || ''), 40),
          })}`,
        );
      }

      // Processar cliente baseado no tipo de dados recebido
      let clienteProcessado;
      if (typeof dadosProposta.cliente === 'string') {
        // Buscar cliente real no banco ao inves de gerar email ficticio
        const nomeCliente = dadosProposta.cliente as string;
        this.logger.debug(`Buscando cliente real por nome: ${this.summarizeText(nomeCliente, 50)}`);

        try {
          // Buscar cliente real pelo nome (busca flexivel)
          const clienteReal = await this.clienteRepository.findOne({
            where: empresaIdProposta
              ? [
                  { nome: Like(`%${nomeCliente}%`), empresaId: empresaIdProposta },
                  { nome: nomeCliente, empresaId: empresaIdProposta },
                ]
              : [{ nome: Like(`%${nomeCliente}%`) }, { nome: nomeCliente }],
          });

          if (clienteReal) {
            this.logger.debug(`Cliente real encontrado: ${JSON.stringify({ clienteId: clienteReal.id, nome: this.summarizeText(clienteReal.nome, 50), email: this.maskEmail(clienteReal.email) })}`);
            clienteProcessado = {
              id: clienteReal.id,
              nome: clienteReal.nome,
              email: clienteReal.email, // Usar email real
              telefone: clienteReal.telefone, // Usar telefone real
              documento: clienteReal.documento || '',
              status: clienteReal.status || 'lead',
            };
          } else {
            this.logger.warn(`Cliente nao encontrado no cadastro: ${this.summarizeText(nomeCliente, 50)}`);
            // Nao gerar email ficticio - deixar vazio para busca posterior
            clienteProcessado = {
              id: 'cliente-temp',
              nome: nomeCliente,
              email: '', // Deixar vazio ao inves de gerar ficticio
              telefone: '',
              documento: '',
              status: 'lead',
            };
          }
        } catch (error) {
          this.logger.error('Erro ao buscar cliente no banco', error?.stack || String(error));
          // Fallback sem email ficticio
          clienteProcessado = {
            id: 'cliente-temp',
            nome: nomeCliente,
            email: '', // Nao gerar email ficticio
            telefone: '',
            documento: '',
            status: 'lead',
          };
        }
      } else if (dadosProposta.cliente && typeof dadosProposta.cliente === 'object') {
        // Se e objeto, usar como esta
        clienteProcessado = dadosProposta.cliente;
      } else {
        // Fallback para cliente padrao sem email ficticio
        clienteProcessado = {
          id: 'cliente-default',
          nome: 'Cliente Temporario',
          email: '', // Nao gerar email ficticio
          telefone: '',
          documento: '',
          status: 'lead',
        };
      }

      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);
      const fluxoStatus = this.normalizeStatusInput(dadosProposta.status as string | undefined);
      const motivoPerda = this.sanitizeMotivoPerda((dadosProposta as any).motivoPerda);
      const oportunidadeId = this.normalizeOportunidadeId(
        (dadosProposta as any).oportunidadeId ?? (dadosProposta as any).oportunidade_id,
      );
      let oportunidadeIdPersistido = propostaColumns.has('oportunidade_id')
        ? await this.normalizeOportunidadeIdForPersistence(oportunidadeId)
        : null;

      if (
        propostaColumns.has('oportunidade_id') &&
        !oportunidadeIdPersistido &&
        empresaIdProposta
      ) {
        const oportunidadeNullable = await this.isTableColumnNullable(
          'propostas',
          'oportunidade_id',
        );

        if (oportunidadeNullable === false) {
          const tituloFallback = dadosProposta.titulo || `Proposta ${numero}`;
          const valorFallback = Number(dadosProposta.valor || dadosProposta.total || 0);

          oportunidadeIdPersistido = await this.ensureLegacyOportunidadeId(
            empresaIdProposta,
            tituloFallback,
            valorFallback,
            vendedorId,
          );

          this.logger.warn(
            `oportunidade_id obrigatoria detectada no schema. Oportunidade fallback criada automaticamente para proposta ${numero}.`,
          );
        }
      }
      const observacoesComFluxo = this.mergeLegacyFlowMetadata(undefined, {
        observacoes: dadosProposta.observacoes,
        fluxoStatus,
        motivoPerda,
      });
      const validadeDias = Number.isFinite(Number(dadosProposta.validadeDias))
        ? Math.max(1, Number(dadosProposta.validadeDias))
        : 30;
      const dataVencimentoCalculada =
        dadosProposta.dataVencimento ||
        new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toISOString();

      if (legacySchema) {
        const titulo = dadosProposta.titulo || `Proposta ${numero}`;
        const valor = Number(dadosProposta.valor || dadosProposta.total || 0);
        const subtotalCalculado = this.toFiniteNumber(dadosProposta.subtotal, valor);
        const totalCalculado = this.toFiniteNumber(dadosProposta.total ?? dadosProposta.valor, valor);
        const descontoGlobalCalculado = this.toFiniteNumber(dadosProposta.descontoGlobal, 0);
        const impostosCalculados = this.toFiniteNumber(dadosProposta.impostos, 0);
        const formaPagamentoCalculada = String(dadosProposta.formaPagamento || 'avista');
        const parcelasCalculadas =
          formaPagamentoCalculada === 'parcelado'
            ? Math.max(1, Number(dadosProposta.parcelas || 1))
            : undefined;
        const produtosCalculados = Array.isArray(dadosProposta.produtos) ? dadosProposta.produtos : [];
        const descontoGlobalColumn = propostaColumns.has('descontoGlobal')
          ? 'descontoGlobal'
          : propostaColumns.has('desconto_global')
            ? 'desconto_global'
            : null;
        const formaPagamentoColumn = propostaColumns.has('formaPagamento')
          ? 'formaPagamento'
          : propostaColumns.has('forma_pagamento')
            ? 'forma_pagamento'
            : null;
        const validadeDiasColumn = propostaColumns.has('validadeDias')
          ? 'validadeDias'
          : propostaColumns.has('validade_dias')
            ? 'validade_dias'
            : null;
        const incluirImpostosPDFColumn = propostaColumns.has('incluirImpostosPDF')
          ? 'incluirImpostosPDF'
          : propostaColumns.has('incluir_impostos_pdf')
            ? 'incluir_impostos_pdf'
            : null;
        const insertColumns: string[] = ['empresa_id', 'numero', 'titulo', 'valor', 'status'];
        const insertValues: unknown[] = [
          empresaIdProposta,
          numero,
          titulo,
          valor,
          this.mapFlowStatusToDatabaseStatus(fluxoStatus, true),
        ];

        if (propostaColumns.has('oportunidade_id')) {
          insertColumns.push('oportunidade_id');
          insertValues.push(
            oportunidadeIdPersistido ??
              (await this.ensureLegacyOportunidadeId(empresaIdProposta, titulo, valor, vendedorId)),
          );
        }

        if (propostaColumns.has('descricao')) {
          insertColumns.push('descricao');
          insertValues.push(observacoesComFluxo ?? null);
        }

        if (propostaColumns.has('subtotal')) {
          insertColumns.push('subtotal');
          insertValues.push(subtotalCalculado);
        }

        if (descontoGlobalColumn) {
          insertColumns.push(descontoGlobalColumn);
          insertValues.push(descontoGlobalCalculado);
        }

        if (propostaColumns.has('impostos')) {
          insertColumns.push('impostos');
          insertValues.push(impostosCalculados);
        }

        if (propostaColumns.has('total')) {
          insertColumns.push('total');
          insertValues.push(totalCalculado);
        }

        if (formaPagamentoColumn) {
          insertColumns.push(formaPagamentoColumn);
          insertValues.push(formaPagamentoCalculada);
        }

        if (validadeDiasColumn) {
          insertColumns.push(validadeDiasColumn);
          insertValues.push(validadeDias);
        }

        if (incluirImpostosPDFColumn) {
          insertColumns.push(incluirImpostosPDFColumn);
          insertValues.push(Boolean(dadosProposta.incluirImpostosPDF));
        }

        if (propostaColumns.has('produtos')) {
          insertColumns.push('produtos');
          insertValues.push(produtosCalculados);
        }

        if (propostaColumns.has('parcelas') && parcelasCalculadas !== undefined) {
          insertColumns.push('parcelas');
          insertValues.push(parcelasCalculadas);
        }

        if (propostaColumns.has('source')) {
          insertColumns.push('source');
          insertValues.push(dadosProposta.source || 'api');
        }

        if (propostaColumns.has('validade')) {
          insertColumns.push('validade');
          insertValues.push(new Date(dataVencimentoCalculada));
        }

        const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(', ');
        const createdColumn = propostaColumns.has('criado_em') ? 'criado_em' : 'criadaEm';
        const updatedColumn = propostaColumns.has('atualizado_em') ? 'atualizado_em' : 'atualizadaEm';

        const rowsRaw = await this.propostaRepository.query(
          `
            INSERT INTO propostas (${insertColumns.map((column) => `"${column}"`).join(', ')})
            VALUES (${placeholders})
            RETURNING
              id,
              numero,
              titulo,
              valor,
              status,
              ${
                propostaColumns.has('descricao')
                  ? 'descricao'
                  : propostaColumns.has('observacoes')
                    ? 'observacoes'
                    : 'NULL'
              } AS descricao,
              ${
                propostaColumns.has('validade')
                  ? 'validade'
                  : propostaColumns.has('dataVencimento')
                    ? '"dataVencimento"'
                    : 'NULL'
              } AS validade,
              ${createdColumn} AS criado_em,
              ${updatedColumn} AS atualizado_em
          `,
          insertValues,
        );
        const rows = this.extractQueryRows<any>(rowsRaw);

        const propostaCriada = this.buildLegacyInterface(
          rows?.[0],
          {
            cliente: clienteProcessado,
            oportunidadeId: oportunidadeIdPersistido,
            produtos: dadosProposta.produtos || [],
            subtotal: subtotalCalculado,
            descontoGlobal: descontoGlobalCalculado,
            impostos: impostosCalculados,
            total: totalCalculado,
            valor: totalCalculado,
            formaPagamento: dadosProposta.formaPagamento || 'avista',
            parcelas: parcelasCalculadas,
            validadeDias,
            observacoes: observacoesComFluxo,
            incluirImpostosPDF: dadosProposta.incluirImpostosPDF || false,
            status: fluxoStatus,
            motivoPerda,
            source: dadosProposta.source || 'api',
            vendedor: dadosProposta.vendedor,
          },
          typeof dadosProposta.cliente === 'string' ? dadosProposta.cliente : clienteProcessado?.nome,
        );

        if (oportunidadeIdPersistido) {
          const vinculadaComoPrincipal = await this.maybeAssignPropostaPrincipalOnCreate(
            String(propostaCriada.id || ''),
            oportunidadeIdPersistido,
            empresaIdProposta,
            {
              force: (dadosProposta.source || '').toString().trim().toLowerCase() === 'oportunidade',
            },
          );

          if (vinculadaComoPrincipal) {
            await this.syncOportunidadeFromPropostaPrincipal(
              String(propostaCriada.id || ''),
              empresaIdProposta,
            );
          }
        }

        const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
          [propostaCriada],
          empresaIdProposta,
        );
        return propostaHidratada || propostaCriada;
      }

      const emailDetailsIniciais: Record<string, unknown> = {
        fluxoStatus,
        ...(motivoPerda ? { motivoPerda } : {}),
        ...(String(dadosProposta.formaPagamento || '').toLowerCase() === 'parcelado' &&
        Number.isFinite(Number(dadosProposta.parcelas)) &&
        Number(dadosProposta.parcelas) > 1
          ? { parcelas: Math.floor(Number(dadosProposta.parcelas)) }
          : {}),
        aprovacaoInterna: this.calcularAprovacaoInterna(
          dadosProposta.descontoGlobal,
          dadosProposta.produtos,
          null,
          commercialPolicy,
        ) as any,
      };

      const novaProposta = this.propostaRepository.create({
        empresaId: empresaIdProposta,
        numero,
        titulo: dadosProposta.titulo || `Proposta ${numero}`,
        cliente: clienteProcessado,
        produtos: dadosProposta.produtos || [],
        subtotal: dadosProposta.subtotal || 0,
        descontoGlobal: dadosProposta.descontoGlobal || 0,
        impostos: dadosProposta.impostos || 0,
        total: dadosProposta.total || 0,
        valor: dadosProposta.valor || dadosProposta.total || 0,
        formaPagamento: dadosProposta.formaPagamento || 'avista',
        validadeDias,
        observacoes: dadosProposta.observacoes,
        incluirImpostosPDF: dadosProposta.incluirImpostosPDF || false,
        status: this.mapFlowStatusToDatabaseStatus(fluxoStatus, false) as any,
        dataVencimento: dadosProposta.dataVencimento
          ? new Date(dadosProposta.dataVencimento)
          : new Date(dataVencimentoCalculada),
        source: dadosProposta.source || 'api',
        oportunidade_id: propostaColumns.has('oportunidade_id') ? oportunidadeIdPersistido : undefined,
        vendedor_id: vendedorId,
        emailDetails: emailDetailsIniciais as any,
      });

      const detalhesComHistorico = this.appendHistoricoEvento(
        novaProposta.emailDetails,
        'proposta_criada',
        {
          origem: dadosProposta.source || 'api',
          status: fluxoStatus,
          detalhes: 'Proposta criada no sistema',
        },
      );
      novaProposta.emailDetails = this.appendVersionSnapshot(
        detalhesComHistorico,
        novaProposta,
        dadosProposta.source || 'api',
        'Versao inicial da proposta',
      ) as any;

      const propostaSalva = await this.propostaRepository.save(novaProposta);
      this.logger.log(`Proposta criada no banco: ${propostaSalva.id} - ${propostaSalva.numero}`);

      if (oportunidadeIdPersistido) {
        const vinculadaComoPrincipal = await this.maybeAssignPropostaPrincipalOnCreate(
          propostaSalva.id,
          oportunidadeIdPersistido,
          empresaIdProposta,
          {
            force: (dadosProposta.source || '').toString().trim().toLowerCase() === 'oportunidade',
          },
        );

        if (vinculadaComoPrincipal) {
          await this.syncOportunidadeFromPropostaPrincipal(propostaSalva.id, empresaIdProposta);
        }
      }

      const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
        [this.entityToInterface(propostaSalva)],
        empresaIdProposta,
      );
      return propostaHidratada || this.entityToInterface(propostaSalva);
    } catch (error) {
      this.logger.error('Erro ao criar proposta', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Atualiza dados de uma proposta (alem de status)
   */
  async atualizarProposta(
    id: string,
    dadosProposta: Partial<Proposta>,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const commercialPolicy = await this.resolveCommercialPolicy(empresaId);
      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);
      if (legacySchema) {
        const setClauses: string[] = [];
        const params: unknown[] = [];
        let idx = 1;
        const descontoGlobalColumn = propostaColumns.has('descontoGlobal')
          ? 'descontoGlobal'
          : propostaColumns.has('desconto_global')
            ? 'desconto_global'
            : null;
        const formaPagamentoColumn = propostaColumns.has('formaPagamento')
          ? 'formaPagamento'
          : propostaColumns.has('forma_pagamento')
            ? 'forma_pagamento'
            : null;
        const validadeDiasColumn = propostaColumns.has('validadeDias')
          ? 'validadeDias'
          : propostaColumns.has('validade_dias')
            ? 'validade_dias'
            : null;
        const incluirImpostosPDFColumn = propostaColumns.has('incluirImpostosPDF')
          ? 'incluirImpostosPDF'
          : propostaColumns.has('incluir_impostos_pdf')
            ? 'incluir_impostos_pdf'
            : null;

        if (dadosProposta.titulo !== undefined) {
          setClauses.push(`"titulo" = $${idx++}`);
          params.push(dadosProposta.titulo || null);
        }

        const oportunidadeId = this.normalizeOportunidadeId(
          (dadosProposta as any).oportunidadeId ?? (dadosProposta as any).oportunidade_id,
        );
        if (propostaColumns.has('oportunidade_id') && (dadosProposta as any).oportunidadeId !== undefined) {
          setClauses.push(`"oportunidade_id" = $${idx++}`);
          params.push(oportunidadeId);
        }

        const valorAtualizado =
          dadosProposta.valor !== undefined
            ? Number(dadosProposta.valor)
            : dadosProposta.total !== undefined
              ? Number(dadosProposta.total)
              : undefined;
        if (valorAtualizado !== undefined && Number.isFinite(valorAtualizado)) {
          setClauses.push(`"valor" = $${idx++}`);
          params.push(valorAtualizado);
        }

        if (propostaColumns.has('subtotal') && dadosProposta.subtotal !== undefined) {
          const subtotalAtualizado = Number(dadosProposta.subtotal);
          if (Number.isFinite(subtotalAtualizado)) {
            setClauses.push(`"subtotal" = $${idx++}`);
            params.push(subtotalAtualizado);
          }
        }

        if (descontoGlobalColumn && dadosProposta.descontoGlobal !== undefined) {
          const descontoGlobalAtualizado = Number(dadosProposta.descontoGlobal);
          if (Number.isFinite(descontoGlobalAtualizado)) {
            setClauses.push(`"${descontoGlobalColumn}" = $${idx++}`);
            params.push(descontoGlobalAtualizado);
          }
        }

        if (propostaColumns.has('impostos') && dadosProposta.impostos !== undefined) {
          const impostosAtualizados = Number(dadosProposta.impostos);
          if (Number.isFinite(impostosAtualizados)) {
            setClauses.push(`"impostos" = $${idx++}`);
            params.push(impostosAtualizados);
          }
        }

        if (propostaColumns.has('total') && dadosProposta.total !== undefined) {
          const totalAtualizado = Number(dadosProposta.total);
          if (Number.isFinite(totalAtualizado)) {
            setClauses.push(`"total" = $${idx++}`);
            params.push(totalAtualizado);
          }
        }

        if (dadosProposta.status !== undefined) {
          setClauses.push(`"status" = $${idx++}`);
          params.push(
            this.mapFlowStatusToDatabaseStatus(
              this.normalizeStatusInput(dadosProposta.status as string),
              true,
            ),
          );
        }

        if (dadosProposta.source !== undefined && propostaColumns.has('source')) {
          setClauses.push(`"source" = $${idx++}`);
          params.push(dadosProposta.source || null);
        }

        const observacoesColumn = propostaColumns.has('observacoes')
          ? 'observacoes'
          : propostaColumns.has('descricao')
            ? 'descricao'
            : null;
        if (observacoesColumn && dadosProposta.observacoes !== undefined) {
          setClauses.push(`"${observacoesColumn}" = $${idx++}`);
          params.push(dadosProposta.observacoes || null);
        }

        if (formaPagamentoColumn && dadosProposta.formaPagamento !== undefined) {
          setClauses.push(`"${formaPagamentoColumn}" = $${idx++}`);
          params.push(String(dadosProposta.formaPagamento || 'avista'));
        }

        if (propostaColumns.has('parcelas') && dadosProposta.parcelas !== undefined) {
          const parcelasAtualizadas = Number(dadosProposta.parcelas);
          if (Number.isFinite(parcelasAtualizadas) && parcelasAtualizadas > 0) {
            setClauses.push(`"parcelas" = $${idx++}`);
            params.push(parcelasAtualizadas);
          }
        }

        if (validadeDiasColumn && dadosProposta.validadeDias !== undefined) {
          const validadeDiasAtualizada = Number(dadosProposta.validadeDias);
          if (Number.isFinite(validadeDiasAtualizada) && validadeDiasAtualizada > 0) {
            setClauses.push(`"${validadeDiasColumn}" = $${idx++}`);
            params.push(validadeDiasAtualizada);
          }
        }

        if (incluirImpostosPDFColumn && dadosProposta.incluirImpostosPDF !== undefined) {
          setClauses.push(`"${incluirImpostosPDFColumn}" = $${idx++}`);
          params.push(Boolean(dadosProposta.incluirImpostosPDF));
        }

        if (propostaColumns.has('produtos') && dadosProposta.produtos !== undefined) {
          setClauses.push(`"produtos" = $${idx++}`);
          params.push(Array.isArray(dadosProposta.produtos) ? dadosProposta.produtos : []);
        }

        const validadeColumn = propostaColumns.has('validade')
          ? 'validade'
          : propostaColumns.has('dataVencimento')
            ? 'dataVencimento'
            : null;
        const validadeDias =
          dadosProposta.validadeDias !== undefined ? Number(dadosProposta.validadeDias) : undefined;
        const dataVencimentoValue =
          dadosProposta.dataVencimento ??
          (validadeDias && Number.isFinite(validadeDias)
            ? new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toISOString()
            : undefined);
        if (validadeColumn && dataVencimentoValue) {
          setClauses.push(`"${validadeColumn}" = $${idx++}`);
          params.push(new Date(dataVencimentoValue));
        }

        if (setClauses.length === 0) {
          const existente = await this.obterProposta(id, empresaId);
          if (!existente) throw new Error(this.buildPropostaNotFoundMessage(id));
          return existente;
        }

        params.push(id);
        const idParam = `$${idx++}`;
        let whereClause = `id = ${idParam}`;

        if (empresaId) {
          params.push(empresaId);
          whereClause += ` AND empresa_id = $${idx++}`;
        }

        const updateResultRaw = await this.propostaRepository.query(
          `
            UPDATE propostas
            SET ${setClauses.join(', ')}
            WHERE ${whereClause}
            RETURNING id
          `,
          params,
        );
        const updateResult = this.extractQueryRows<{ id: string }>(updateResultRaw);

        if (!updateResult?.[0]?.id) {
          throw new Error(this.buildPropostaNotFoundMessage(id));
        }

        const propostaAtualizada = await this.obterProposta(id, empresaId);
        if (!propostaAtualizada) {
          throw new Error(this.buildPropostaNotFoundMessage(id));
        }
        await this.syncOportunidadeFromPropostaPrincipal(id, empresaId);
        return propostaAtualizada;
      }

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id, empresaId } : { id },
      });

      if (!proposta) {
        throw new Error(this.buildPropostaNotFoundMessage(id));
      }

      if (dadosProposta.titulo !== undefined) {
        proposta.titulo = dadosProposta.titulo || null;
      }

      if ((dadosProposta as any).oportunidadeId !== undefined) {
        proposta.oportunidade_id = this.normalizeOportunidadeId(
          (dadosProposta as any).oportunidadeId ?? (dadosProposta as any).oportunidade_id,
        );
      }

      if (dadosProposta.cliente !== undefined) {
        if (typeof dadosProposta.cliente === 'string') {
          const clienteAtual = proposta.cliente || { id: 'cliente-temp', nome: '', email: '' };
          proposta.cliente = {
            ...clienteAtual,
            nome: dadosProposta.cliente,
            email: clienteAtual.email || '',
          } as any;
        } else if (dadosProposta.cliente && typeof dadosProposta.cliente === 'object') {
          proposta.cliente = dadosProposta.cliente as any;
        }
      }

      if (dadosProposta.produtos !== undefined) {
        proposta.produtos = (dadosProposta.produtos || []) as any;
      }

      if (dadosProposta.subtotal !== undefined) {
        proposta.subtotal = Number(dadosProposta.subtotal);
      }
      if (dadosProposta.descontoGlobal !== undefined) {
        proposta.descontoGlobal = Number(dadosProposta.descontoGlobal);
      }
      if (dadosProposta.impostos !== undefined) {
        proposta.impostos = Number(dadosProposta.impostos);
      }

      const totalFoiEnviado = dadosProposta.total !== undefined;
      const valorFoiEnviado = dadosProposta.valor !== undefined;
      if (totalFoiEnviado) {
        proposta.total = Number(dadosProposta.total);
        if (!valorFoiEnviado) proposta.valor = Number(dadosProposta.total);
      }
      if (valorFoiEnviado) {
        proposta.valor = Number(dadosProposta.valor);
        if (!totalFoiEnviado) proposta.total = Number(dadosProposta.valor);
      }

      if (dadosProposta.formaPagamento !== undefined) {
        proposta.formaPagamento = dadosProposta.formaPagamento as any;
      }

      if (dadosProposta.parcelas !== undefined) {
        const detalhesParcelas = {
          ...(proposta.emailDetails || {}),
        } as Record<string, unknown>;
        const parcelasNormalizadas = Number(dadosProposta.parcelas);
        if (
          String(proposta.formaPagamento || '').toLowerCase() === 'parcelado' &&
          Number.isFinite(parcelasNormalizadas) &&
          parcelasNormalizadas > 1
        ) {
          detalhesParcelas.parcelas = Math.floor(parcelasNormalizadas);
        } else {
          delete detalhesParcelas.parcelas;
        }
        proposta.emailDetails = detalhesParcelas as any;
      } else if (String(proposta.formaPagamento || '').toLowerCase() !== 'parcelado') {
        const detalhesParcelas = {
          ...(proposta.emailDetails || {}),
        } as Record<string, unknown>;
        if ('parcelas' in detalhesParcelas) {
          delete detalhesParcelas.parcelas;
          proposta.emailDetails = detalhesParcelas as any;
        }
      }

      if (dadosProposta.validadeDias !== undefined) {
        proposta.validadeDias = Number(dadosProposta.validadeDias);
      }

      if (dadosProposta.observacoes !== undefined) {
        proposta.observacoes = dadosProposta.observacoes || null;
      }

      if (dadosProposta.incluirImpostosPDF !== undefined) {
        proposta.incluirImpostosPDF = Boolean(dadosProposta.incluirImpostosPDF);
      }

      if (dadosProposta.status !== undefined) {
        const fluxoStatus = this.normalizeStatusInput(dadosProposta.status as string);
        if (this.statusExigeItensComerciais(fluxoStatus)) {
          this.assertItensComerciaisParaFluxo(
            dadosProposta.produtos !== undefined ? dadosProposta.produtos : proposta.produtos,
            fluxoStatus === 'enviada' ? 'enviar' : 'seguir_fluxo',
          );
        }
        proposta.status = this.mapFlowStatusToDatabaseStatus(fluxoStatus, false) as any;
        proposta.emailDetails = {
          ...(proposta.emailDetails || {}),
          fluxoStatus,
        };
      }

      if ((dadosProposta as any).motivoPerda !== undefined) {
        const motivoPerda = this.sanitizeMotivoPerda((dadosProposta as any).motivoPerda);
        const details = {
          ...(proposta.emailDetails || {}),
        } as Record<string, unknown>;
        if (motivoPerda) {
          details.motivoPerda = motivoPerda;
        } else {
          delete details.motivoPerda;
        }
        proposta.emailDetails = details as any;
      }

      if (dadosProposta.dataVencimento !== undefined) {
        proposta.dataVencimento = dadosProposta.dataVencimento
          ? new Date(dadosProposta.dataVencimento)
          : null;
      } else if (dadosProposta.validadeDias !== undefined && Number.isFinite(proposta.validadeDias)) {
        proposta.dataVencimento = new Date(Date.now() + proposta.validadeDias * 24 * 60 * 60 * 1000);
      }

      if (dadosProposta.source !== undefined) {
        proposta.source = dadosProposta.source || null;
      }

      if (dadosProposta.vendedor !== undefined || (dadosProposta as any).vendedorId !== undefined) {
        const vendedorId = await this.resolveVendedorIdFromPayload(
          dadosProposta.vendedor,
          empresaId,
          (dadosProposta as any).vendedorId,
        );

        proposta.vendedor_id = vendedorId;
      }

      let detalhesAtualizados = this.toObjectRecord(proposta.emailDetails);
      detalhesAtualizados.aprovacaoInterna = this.calcularAprovacaoInterna(
        proposta.descontoGlobal,
        proposta.produtos,
        this.parseAprovacaoInterna(detalhesAtualizados),
        commercialPolicy,
      );
      detalhesAtualizados = this.appendHistoricoEvento(
        detalhesAtualizados,
        'proposta_atualizada',
        {
          origem: dadosProposta.source || 'api',
          status: this.extractFlowStatusFromEmailDetails(detalhesAtualizados) || undefined,
          detalhes: 'Dados da proposta atualizados',
        },
      );
      proposta.emailDetails = this.appendVersionSnapshot(
        detalhesAtualizados,
        proposta,
        dadosProposta.source || 'api',
        'Atualizacao de dados da proposta',
      ) as any;

      const fluxoStatusPersistencia: SalesFlowStatus =
        this.extractFlowStatusFromEmailDetails(proposta.emailDetails) ||
        this.mapDatabaseStatusToFlowStatus(proposta.status);

      const propostaAtualizada = await this.savePropostaWithStatusFallback(
        proposta,
        fluxoStatusPersistencia,
      );
      this.logger.log(`Proposta atualizada: ${propostaAtualizada.id}`);
      await this.syncOportunidadeFromPropostaPrincipal(propostaAtualizada.id, empresaId);
      const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
        [this.entityToInterface(propostaAtualizada)],
        empresaId,
      );
      return propostaHidratada || this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao atualizar proposta', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Remove uma proposta
   */
  async removerProposta(id: string, empresaId?: string): Promise<boolean> {
    try {
      const resultado = await this.propostaRepository.delete(
        empresaId ? { id, empresaId } : { id },
      );
      return resultado.affected > 0;
    } catch (error) {
      this.logger.error('Erro ao remover proposta', error?.stack || String(error));
      return false;
    }
  }

  async definirComoPrincipal(propostaId: string, empresaId?: string): Promise<Proposta> {
    const oportunidadeColumns = await this.getTableColumns('oportunidades');
    if (!oportunidadeColumns.has('proposta_principal_id')) {
      throw new BadRequestException(
        'Recurso de proposta principal indisponivel. Execute as migrations pendentes.',
      );
    }

    const link = await this.resolvePrimaryProposalLink(propostaId, empresaId);
    if (!link.oportunidadeId) {
      throw new BadRequestException(
        'Somente propostas vinculadas a uma oportunidade podem ser definidas como principais.',
      );
    }

    if (!empresaId) {
      throw new BadRequestException(
        'Nao foi possivel determinar a empresa da proposta para definir a proposta principal.',
      );
    }

    await this.maybeAssignPropostaPrincipalOnCreate(propostaId, link.oportunidadeId, empresaId, {
      force: true,
    });
    await this.syncOportunidadeFromPropostaPrincipal(propostaId, empresaId);

    const propostaAtualizada = await this.obterProposta(propostaId, empresaId);
    if (!propostaAtualizada) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    return propostaAtualizada;
  }

  /**
   * Cancela comercialmente uma venda/proposta
   */
  async cancelarVenda(
    propostaId: string,
    input: CancelamentoVendaInput,
    empresaId?: string,
  ): Promise<Proposta> {
    const motivoPerda = this.sanitizeMotivoPerda(input?.motivo);
    if (!motivoPerda) {
      throw new BadRequestException('Informe o motivo do cancelamento da venda.');
    }

    const propostaAtual = await this.obterProposta(propostaId, empresaId);
    if (!propostaAtual) {
      throw new BadRequestException(this.buildPropostaNotFoundMessage(propostaId));
    }

    const statusAtual = this.normalizeStatusInput(propostaAtual.status);
    if (PROPOSTA_STATUS_NAO_PERMITE_CANCELAR_VENDA.has(statusAtual)) {
      throw new BadRequestException(
        'Nao e possivel cancelar uma venda com pagamento confirmado. Realize o estorno no financeiro antes de cancelar.',
      );
    }

    const bloqueios = await this.carregarBloqueiosCancelamentoVenda(propostaId, empresaId);
    if (bloqueios.faturasPagasOuParciais > 0) {
      throw new BadRequestException(
        'Nao e possivel cancelar a venda porque existem faturas pagas/parcialmente pagas. Execute o estorno antes de cancelar.',
      );
    }

    const resultadoCancelamentoVinculos =
      await this.cancelarVinculosComerciaisParaCancelamentoVenda(
        propostaId,
        motivoPerda,
        empresaId,
        input?.source || 'cancelamento-venda',
      );

    const observacoesPadrao = `Venda cancelada manualmente. Motivo: ${motivoPerda}.`;
    const observacoes = String(input?.observacoes || '').trim() || observacoesPadrao;
    const observacoesAutomaticas = [
      resultadoCancelamentoVinculos.faturasCanceladas > 0
        ? `Faturas canceladas automaticamente: ${resultadoCancelamentoVinculos.faturasCanceladas}.`
        : '',
      resultadoCancelamentoVinculos.contratosCancelados > 0
        ? `Contratos cancelados automaticamente: ${resultadoCancelamentoVinculos.contratosCancelados}.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');
    const observacoesFinais = [observacoes, observacoesAutomaticas].filter(Boolean).join(' ').trim();

    return this.atualizarStatus(
      propostaId,
      'rejeitada',
      input?.source || 'cancelamento-venda',
      observacoesFinais,
      motivoPerda,
      empresaId,
      {
        tipo: 'cancelamento_venda',
        faturasCanceladasAutomaticamente: resultadoCancelamentoVinculos.faturasCanceladas,
        contratosCanceladosAutomaticamente: resultadoCancelamentoVinculos.contratosCancelados,
        actorUserId: input?.actorUserId || null,
      },
    );
  }

  private async cancelarVinculosComerciaisParaCancelamentoVenda(
    propostaId: string,
    motivoCancelamento: string,
    empresaId?: string,
    source?: string,
  ): Promise<PropostaCancelamentoVinculosResultado> {
    const resultado: PropostaCancelamentoVinculosResultado = {
      contratosCancelados: 0,
      faturasCanceladas: 0,
    };

    const contratoColumns = await this.getTableColumns('contratos');
    const propostaColumn = contratoColumns.has('propostaId')
      ? '"propostaId"'
      : contratoColumns.has('proposta_id')
        ? 'proposta_id'
        : null;
    if (!propostaColumn) {
      return resultado;
    }

    const empresaContratoColumn = contratoColumns.has('empresa_id')
      ? 'empresa_id'
      : contratoColumns.has('empresaId')
        ? '"empresaId"'
        : null;
    const contratoAtivoColumn = contratoColumns.has('ativo') ? 'ativo' : null;
    const contratoObservacoesColumn = contratoColumns.has('observacoes') ? 'observacoes' : null;

    const faturaColumns = await this.getTableColumns('faturas');
    const contratoFaturaColumn = faturaColumns.has('contratoId')
      ? '"contratoId"'
      : faturaColumns.has('contrato_id')
        ? 'contrato_id'
        : null;
    const empresaFaturaColumn = faturaColumns.has('empresa_id')
      ? 'empresa_id'
      : faturaColumns.has('empresaId')
        ? '"empresaId"'
        : null;
    const faturaAtivoColumn = faturaColumns.has('ativo') ? 'ativo' : null;
    const faturaObservacoesColumn = faturaColumns.has('observacoes') ? 'observacoes' : null;

    const detalhesCancelamento = `Cancelado automaticamente via ${source || 'cancelamento-venda'}: ${motivoCancelamento}`;
    const contratoAtivoExpr = contratoAtivoColumn
      ? `COALESCE(c.${contratoAtivoColumn}, true) = true`
      : 'TRUE';

    await this.propostaRepository.manager.transaction(async (manager) => {
      const contratoParams: unknown[] = [propostaId];
      const filtroEmpresaContrato =
        empresaId && empresaContratoColumn
          ? `AND c.${empresaContratoColumn}::text = $2::text`
          : '';
      if (empresaId && empresaContratoColumn) {
        contratoParams.push(empresaId);
      }

      const contratosRaw = await manager.query(
        `
          SELECT c.id::text AS id
          FROM contratos c
          WHERE c.${propostaColumn}::text = $1::text
            ${filtroEmpresaContrato}
            AND ${contratoAtivoExpr}
        `,
        contratoParams,
      );
      const contratosRows = this.extractQueryRows<{ id?: string }>(contratosRaw);
      const contratoIds = Array.from(
        new Set(
          contratosRows
            .map((row) => String(row?.id || '').trim())
            .filter(Boolean),
        ),
      );

      if (contratoIds.length === 0) {
        return;
      }

      if (contratoFaturaColumn) {
        const faturasParams: unknown[] = [contratoIds];
        const idxObs = faturasParams.push(detalhesCancelamento);
        const idxStatusCancelavel = faturasParams.push(
          Array.from(FATURA_STATUS_CANCELAMENTO_AUTOMATICO),
        );
        const filtroEmpresaFatura =
          empresaId && empresaFaturaColumn
            ? `AND f.${empresaFaturaColumn}::text = $${faturasParams.push(empresaId)}::text`
            : '';
        const faturaAtivoExpr = faturaAtivoColumn
          ? `COALESCE(f.${faturaAtivoColumn}, true) = true`
          : 'TRUE';
        const appendObsFatura = faturaObservacoesColumn
          ? `, ${faturaObservacoesColumn} = CASE
               WHEN $${idxObs}::text = '' THEN f.${faturaObservacoesColumn}
               WHEN f.${faturaObservacoesColumn} IS NULL OR BTRIM(f.${faturaObservacoesColumn}) = '' THEN $${idxObs}::text
               ELSE f.${faturaObservacoesColumn} || E'\\n\\n' || $${idxObs}::text
             END`
          : '';

        const faturasRaw = await manager.query(
          `
            UPDATE faturas f
            SET status = 'cancelada'
            ${appendObsFatura}
            WHERE f.${contratoFaturaColumn}::text = ANY($1::text[])
              ${filtroEmpresaFatura}
              AND ${faturaAtivoExpr}
              AND f.status = ANY($${idxStatusCancelavel}::text[])
            RETURNING f.id::text AS id
          `,
          faturasParams,
        );
        const faturasRows = this.extractQueryRows<{ id?: string }>(faturasRaw);
        resultado.faturasCanceladas = faturasRows.length;
      }

      const contratosUpdateParams: unknown[] = [contratoIds, detalhesCancelamento];
      const idxContratoStatusCancelado = contratosUpdateParams.push('cancelado');
      const filtroEmpresaContratoUpdate =
        empresaId && empresaContratoColumn
          ? `AND c.${empresaContratoColumn}::text = $${contratosUpdateParams.push(empresaId)}::text`
          : '';
      const appendObsContrato = contratoObservacoesColumn
        ? `, ${contratoObservacoesColumn} = CASE
             WHEN $2::text = '' THEN c.${contratoObservacoesColumn}
             WHEN c.${contratoObservacoesColumn} IS NULL OR BTRIM(c.${contratoObservacoesColumn}) = '' THEN $2::text
             ELSE c.${contratoObservacoesColumn} || E'\\n\\n' || $2::text
           END`
        : '';

      const contratosAtualizadosRaw = await manager.query(
        `
          UPDATE contratos c
          SET status = 'cancelado'
          ${appendObsContrato}
          WHERE c.id::text = ANY($1::text[])
            ${filtroEmpresaContratoUpdate}
            AND ${contratoAtivoExpr}
            AND c.status <> $${idxContratoStatusCancelado}::text
          RETURNING c.id::text AS id
        `,
        contratosUpdateParams,
      );
      const contratosAtualizados = this.extractQueryRows<{ id?: string }>(contratosAtualizadosRaw);
      resultado.contratosCancelados = contratosAtualizados.length;
    });

    return resultado;
  }

  /**
   * Atualiza o status de uma proposta
   */
  async atualizarStatus(
    propostaId: string,
    status: string,
    source?: string,
    observacoes?: string,
    motivoPerda?: string,
    empresaId?: string,
    metadata?: Record<string, unknown>,
    transitionContext?: PropostaStatusTransitionContext,
  ): Promise<Proposta> {
    try {
      const fluxoStatus = this.normalizeStatusInput(status);
      this.assertStatusAllowedBySalesMvp(fluxoStatus);
      const motivoPerdaLimpo = this.sanitizeMotivoPerda(motivoPerda);
      const strictTransitionsEnabled = await this.isStrictPropostaTransitionsEnabled(empresaId);
      const commercialPolicy = await this.resolveCommercialPolicy(empresaId);
      const requestedDirectDraftApprovalOverride = Boolean(
        transitionContext?.allowDirectApprovalOverride,
      );
      const hasDirectDraftApprovalPermission = this.hasPermission(
        transitionContext?.actorPermissions,
        Permission.COMERCIAL_PROPOSTAS_APPROVE_OVERRIDE,
      );
      const directDraftApprovalOverrideReason = this.normalizeOverrideReason(
        transitionContext?.overrideReason,
      );
      const canDirectDraftApprovalOverride =
        requestedDirectDraftApprovalOverride &&
        hasDirectDraftApprovalPermission &&
        Boolean(directDraftApprovalOverrideReason);
      this.logger.debug(
        `atualizarStatus chamado: ${JSON.stringify({
          propostaId,
          tipoPropostaId: typeof propostaId,
          statusRecebido: status,
          fluxoStatus,
          source: source || null,
          hasObservacoes: Boolean(observacoes),
          hasMotivoPerda: Boolean(motivoPerdaLimpo),
          strictTransitionsEnabled,
        })}`,
      );

      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);
      if (legacySchema) {
        const propostaAtual = await this.obterProposta(propostaId, empresaId);
        if (!propostaAtual) {
          throw new Error(this.buildPropostaNotFoundMessage(propostaId));
        }

        const isDirectDraftApproval = this.isDirectDraftApprovalTransition(
          propostaAtual.status,
          fluxoStatus,
        );
        const directDraftApprovalGoverned = strictTransitionsEnabled && isDirectDraftApproval;

        if (directDraftApprovalGoverned && !canDirectDraftApprovalOverride) {
          if (requestedDirectDraftApprovalOverride && !hasDirectDraftApprovalPermission) {
            throw new ForbiddenException(
              'Sem permissao para override de aprovacao direta de rascunho.',
            );
          }

          if (requestedDirectDraftApprovalOverride && !directDraftApprovalOverrideReason) {
            throw new BadRequestException(
              'Informe overrideReason para aprovar proposta direto de rascunho.',
            );
          }

          throw new BadRequestException(
            'Transicao bloqueada por politica comercial: envie a proposta antes de aprovar.',
          );
        }

        const transitionAllowed =
          this.isStatusTransitionAllowedByPolicy(
            propostaAtual.status,
            fluxoStatus,
            strictTransitionsEnabled,
          ) ||
          (directDraftApprovalGoverned && canDirectDraftApprovalOverride);
        if (!transitionAllowed) {
          const allowed = this.getAllowedStatusTransitionsByPolicy(
            propostaAtual.status,
            strictTransitionsEnabled,
          );
          throw new BadRequestException(
            `Transicao de status invalida: ${propostaAtual.status} -> ${fluxoStatus}. ` +
              `Permitidos: ${allowed.join(', ') || 'nenhum'}`,
          );
        }

        let emailDetailsLegacy = this.toObjectRecord(propostaAtual.emailDetails);
        emailDetailsLegacy.aprovacaoInterna = this.calcularAprovacaoInterna(
          propostaAtual.descontoGlobal,
          propostaAtual.produtos,
          this.parseAprovacaoInterna(emailDetailsLegacy),
          commercialPolicy,
        );
        const aprovacaoInternaLegacy = this.parseAprovacaoInterna(emailDetailsLegacy);

        if (
          fluxoStatus === 'aprovada' &&
          aprovacaoInternaLegacy?.obrigatoria &&
          aprovacaoInternaLegacy.status !== 'aprovada'
        ) {
          emailDetailsLegacy.fluxoStatus = propostaAtual.status;
          emailDetailsLegacy.aprovacaoInterna = {
            ...aprovacaoInternaLegacy,
            status: 'pendente',
            solicitadaEm: aprovacaoInternaLegacy.solicitadaEm || new Date().toISOString(),
            observacoes:
              aprovacaoInternaLegacy.observacoes ||
              'Aguardando aprovacao interna por alcada para concluir a aprovacao comercial.',
          } as PropostaAprovacaoInterna;
          emailDetailsLegacy = this.appendHistoricoEvento(
            emailDetailsLegacy,
            'aprovacao_interna_pendente',
            {
              origem: source || 'api',
              status: propostaAtual.status,
              detalhes:
                'Tentativa de aprovar proposta bloqueada por regra de alcada de desconto.',
              metadata: {
                limiteDesconto: aprovacaoInternaLegacy.limiteDesconto,
                descontoDetectado: aprovacaoInternaLegacy.descontoDetectado,
                ...(metadata || {}),
              },
            },
          );
          await this.persistLegacyEmailDetails(
            propostaId,
            empresaId,
            propostaColumns,
            emailDetailsLegacy,
          );
          throw new BadRequestException(
            'Proposta exige aprovacao interna por alcada antes de ser marcada como aprovada.',
          );
        }

        const observacoesOverride =
          directDraftApprovalGoverned && canDirectDraftApprovalOverride
            ? `Override aprovado para rascunho -> aprovada por ${transitionContext?.actorUserId || 'usuario-sem-id'}. Motivo: ${directDraftApprovalOverrideReason}`
            : '';
        const observacoesComFluxo = this.mergeLegacyFlowMetadata(propostaAtual.observacoes, {
          observacoes: [observacoes, observacoesOverride].filter(Boolean).join('\n') || observacoes,
          fluxoStatus,
          motivoPerda,
        });

        const metadataComOverride =
          directDraftApprovalGoverned && canDirectDraftApprovalOverride
            ? {
                ...(metadata || {}),
                directDraftApprovalOverride: {
                  actorUserId: transitionContext?.actorUserId || null,
                  overrideReason: directDraftApprovalOverrideReason,
                  permission: Permission.COMERCIAL_PROPOSTAS_APPROVE_OVERRIDE,
                },
              }
            : metadata;

        const propostaAtualizada = await this.atualizarProposta(
          propostaId,
          {
            status: fluxoStatus,
            source,
            observacoes: observacoesComFluxo,
            motivoPerda: motivoPerdaLimpo,
          },
          empresaId,
        );

        emailDetailsLegacy = this.toObjectRecord(
          propostaAtualizada.emailDetails || emailDetailsLegacy,
        );
        emailDetailsLegacy.fluxoStatus = fluxoStatus;
        if (motivoPerda !== undefined) {
          if (motivoPerdaLimpo) {
            emailDetailsLegacy.motivoPerda = motivoPerdaLimpo;
          } else {
            delete emailDetailsLegacy.motivoPerda;
          }
        } else if (fluxoStatus !== 'rejeitada') {
          delete emailDetailsLegacy.motivoPerda;
        }
        emailDetailsLegacy.aprovacaoInterna = this.calcularAprovacaoInterna(
          propostaAtualizada.descontoGlobal,
          propostaAtualizada.produtos,
          this.parseAprovacaoInterna(emailDetailsLegacy),
          commercialPolicy,
        );
        emailDetailsLegacy = this.appendHistoricoEvento(emailDetailsLegacy, 'status_alterado', {
          origem: source || 'api',
          status: fluxoStatus,
          detalhes: observacoes || '',
          metadata: metadata || undefined,
        });
        await this.persistLegacyEmailDetails(
          propostaId,
          empresaId,
          propostaColumns,
          emailDetailsLegacy,
        );
        propostaAtualizada.status = fluxoStatus;
        propostaAtualizada.emailDetails = emailDetailsLegacy as any;
        propostaAtualizada.historicoEventos = this.getHistoricoEventos(emailDetailsLegacy);

        if (directDraftApprovalGoverned && canDirectDraftApprovalOverride) {
          emailDetailsLegacy = this.toObjectRecord(
            propostaAtualizada.emailDetails || propostaAtual.emailDetails,
          );
          emailDetailsLegacy = this.appendHistoricoEvento(
            emailDetailsLegacy,
            'override_aprovacao_rascunho',
            {
              origem: source || 'api',
              status: fluxoStatus,
              detalhes: 'Override aplicado para permitir aprovacao direta de rascunho.',
              metadata: metadataComOverride || undefined,
            },
          );
          await this.persistLegacyEmailDetails(
            propostaId,
            empresaId,
            propostaColumns,
            emailDetailsLegacy,
          );
          propostaAtualizada.emailDetails = emailDetailsLegacy as any;
          propostaAtualizada.historicoEventos = this.getHistoricoEventos(emailDetailsLegacy);
        }
        this.logger.log(
          `Status da proposta ${propostaId} atualizado para: ${fluxoStatus} (legacy mode)`,
        );
        await this.syncOportunidadeFromPropostaPrincipal(propostaId, empresaId);
        await this.handleNegociacaoTransitionSideEffects({
          propostaId,
          empresaId,
          statusAnterior: propostaAtual.status,
          novoStatus: fluxoStatus,
          source,
          observacoes,
          metadata,
          actorUserId: transitionContext?.actorUserId,
        });
        return propostaAtualizada;
      }

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(this.buildPropostaNotFoundMessage(propostaId));
      }

      const statusAnterior =
        this.extractFlowStatusFromEmailDetails(proposta.emailDetails) ||
        this.mapDatabaseStatusToFlowStatus(proposta.status);
      const isDirectDraftApproval = this.isDirectDraftApprovalTransition(
        statusAnterior,
        fluxoStatus,
      );
      const directDraftApprovalGoverned = strictTransitionsEnabled && isDirectDraftApproval;

      if (directDraftApprovalGoverned && !canDirectDraftApprovalOverride) {
        if (requestedDirectDraftApprovalOverride && !hasDirectDraftApprovalPermission) {
          throw new ForbiddenException('Sem permissao para override de aprovacao direta de rascunho.');
        }

        if (requestedDirectDraftApprovalOverride && !directDraftApprovalOverrideReason) {
          throw new BadRequestException(
            'Informe overrideReason para aprovar proposta direto de rascunho.',
          );
        }

        throw new BadRequestException(
          'Transicao bloqueada por politica comercial: envie a proposta antes de aprovar.',
        );
      }

      const transitionAllowed =
        this.isStatusTransitionAllowedByPolicy(
          statusAnterior,
          fluxoStatus,
          strictTransitionsEnabled,
        ) ||
        (directDraftApprovalGoverned && canDirectDraftApprovalOverride);
      if (!transitionAllowed) {
        const allowed = this.getAllowedStatusTransitionsByPolicy(
          statusAnterior,
          strictTransitionsEnabled,
        );
        throw new BadRequestException(
          `Transicao de status invalida: ${statusAnterior} -> ${fluxoStatus}. ` +
            `Permitidos: ${allowed.join(', ') || 'nenhum'}`,
        );
      }

      if (this.statusExigeItensComerciais(fluxoStatus)) {
        this.assertItensComerciaisParaFluxo(
          proposta.produtos,
          fluxoStatus === 'enviada'
            ? 'enviar'
            : fluxoStatus === 'aprovada'
              ? 'aprovar'
              : 'seguir_fluxo',
        );
      }

      let emailDetails = {
        ...(proposta.emailDetails || {}),
        fluxoStatus,
      } as Record<string, unknown>;

      if (directDraftApprovalGoverned && canDirectDraftApprovalOverride) {
        emailDetails = this.appendHistoricoEvento(emailDetails, 'override_aprovacao_rascunho', {
          origem: source || 'api',
          status: statusAnterior,
          detalhes: 'Override aplicado para permitir aprovacao direta de rascunho.',
          metadata: {
            actorUserId: transitionContext?.actorUserId || null,
            overrideReason: directDraftApprovalOverrideReason,
            permission: Permission.COMERCIAL_PROPOSTAS_APPROVE_OVERRIDE,
            ...(metadata || {}),
          },
        });
      }

      emailDetails.aprovacaoInterna = this.calcularAprovacaoInterna(
        proposta.descontoGlobal,
        proposta.produtos,
        this.parseAprovacaoInterna(emailDetails),
        commercialPolicy,
      );
      const aprovacaoInterna = this.parseAprovacaoInterna(emailDetails);

      if (
        fluxoStatus === 'aprovada' &&
        aprovacaoInterna?.obrigatoria &&
        aprovacaoInterna.status !== 'aprovada'
      ) {
        // Mantem o fluxo exibido no status anterior quando a aprovacao interna bloqueia
        // a transicao comercial. Sem isso, o frontend pode refletir "aprovada" indevidamente.
        emailDetails.fluxoStatus = statusAnterior;
        emailDetails.aprovacaoInterna = {
          ...aprovacaoInterna,
          status: 'pendente',
          solicitadaEm: aprovacaoInterna.solicitadaEm || new Date().toISOString(),
          observacoes:
            aprovacaoInterna.observacoes ||
            'Aguardando aprovacao interna por alcada para concluir a aprovacao comercial.',
        } as PropostaAprovacaoInterna;
        emailDetails = this.appendHistoricoEvento(emailDetails, 'aprovacao_interna_pendente', {
          origem: source || 'api',
          status: statusAnterior,
          detalhes:
            'Tentativa de aprovar proposta bloqueada por regra de alcada de desconto.',
          metadata: {
            limiteDesconto: aprovacaoInterna.limiteDesconto,
            descontoDetectado: aprovacaoInterna.descontoDetectado,
            ...(metadata || {}),
          },
        });
        proposta.emailDetails = emailDetails as any;
        if (source) proposta.source = source;
        await this.propostaRepository.save(proposta);
        throw new BadRequestException(
          'Proposta exige aprovacao interna por alcada antes de ser marcada como aprovada.',
        );
      }

      proposta.status = this.mapFlowStatusToDatabaseStatus(fluxoStatus, false) as any;
      if (source) proposta.source = source;
      if (observacoes !== undefined) proposta.observacoes = observacoes || null;

      if (motivoPerda !== undefined) {
        if (motivoPerdaLimpo) {
          emailDetails.motivoPerda = motivoPerdaLimpo;
        } else {
          delete emailDetails.motivoPerda;
        }
      } else if (fluxoStatus !== 'rejeitada') {
        delete emailDetails.motivoPerda;
      }

      emailDetails = this.appendHistoricoEvento(emailDetails, 'status_alterado', {
        origem: source || 'api',
        status: fluxoStatus,
        detalhes: `Status alterado de "${statusAnterior}" para "${fluxoStatus}"`,
        metadata:
          directDraftApprovalGoverned && canDirectDraftApprovalOverride
            ? {
                ...(metadata || {}),
                directDraftApprovalOverride: {
                  actorUserId: transitionContext?.actorUserId || null,
                  overrideReason: directDraftApprovalOverrideReason,
                  permission: Permission.COMERCIAL_PROPOSTAS_APPROVE_OVERRIDE,
                },
              }
            : metadata || undefined,
      });

      proposta.emailDetails = emailDetails as any;

      const propostaAtualizada = await this.savePropostaWithStatusFallback(proposta, fluxoStatus);
      this.logger.log(`Status da proposta ${propostaId} atualizado para: ${fluxoStatus}`);
      await this.syncOportunidadeFromPropostaPrincipal(propostaAtualizada.id, empresaId);
      await this.handleNegociacaoTransitionSideEffects({
        propostaId: propostaAtualizada.id,
        empresaId,
        statusAnterior,
        novoStatus: fluxoStatus,
        source,
        observacoes,
        metadata,
        actorUserId: transitionContext?.actorUserId,
      });
      const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
        [this.entityToInterface(propostaAtualizada)],
        empresaId,
      );
      return propostaHidratada || this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao atualizar status', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Atualiza o status de uma proposta com validacao automatica
   */
  async atualizarStatusComValidacao(
    propostaId: string,
    status: string,
    source?: string,
    observacoes?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const fluxoStatus = this.normalizeStatusInput(status);
      const propostaAtual = await this.obterProposta(propostaId, empresaId);
      if (!propostaAtual) {
        throw new Error(this.buildPropostaNotFoundMessage(propostaId));
      }

      if (fluxoStatus === 'aprovada' || fluxoStatus === 'rejeitada') {
        if (propostaAtual.status !== 'visualizada' && propostaAtual.status !== 'enviada') {
          this.logger.warn(
            `Transicao automatica de '${propostaAtual.status}' para '${fluxoStatus}' pode nao ser valida`,
          );
        }
      }

      return this.atualizarStatus(propostaId, fluxoStatus, source, observacoes, undefined, empresaId);
    } catch (error) {
      this.logger.error('Erro ao atualizar status com validacao', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Marca proposta como visualizada via portal
   */
  async marcarComoVisualizada(
    propostaId: string,
    ip?: string,
    userAgent?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const podePromoverParaVisualizada = (statusAtual: SalesFlowStatus): boolean =>
        statusAtual === 'rascunho' || statusAtual === 'enviada' || statusAtual === 'visualizada';

      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);

      if (legacySchema) {
        const proposta = await this.obterProposta(propostaId, empresaId);
        if (!proposta) {
          throw new Error(this.buildPropostaNotFoundMessage(propostaId));
        }

        const statusAtual = this.normalizeStatusInput(proposta.status);
        if (podePromoverParaVisualizada(statusAtual)) {
          const propostaAtualizada = await this.atualizarStatus(
            propostaId,
            'visualizada',
            'portal',
            undefined,
            undefined,
            empresaId,
          );
          this.logger.log(`Proposta ${propostaId} marcada como visualizada (legacy mode)`);
          return propostaAtualizada;
        }

        let emailDetailsLegacy = this.toObjectRecord(proposta.emailDetails);
        emailDetailsLegacy = this.appendPortalEvento(
          {
            ...emailDetailsLegacy,
            fluxoStatus: statusAtual,
          },
          'visualizacao_portal',
          {
            origem: 'portal',
            status: statusAtual,
            detalhes: 'Visualizacao no portal registrada sem alterar status atual da proposta.',
            ip,
            userAgent,
          },
        );
        await this.persistLegacyEmailDetails(
          propostaId,
          empresaId,
          propostaColumns,
          emailDetailsLegacy,
        );

        return {
          ...proposta,
          status: statusAtual,
          emailDetails: emailDetailsLegacy as any,
          portalAccess: {
            accessedAt: new Date().toISOString(),
            ip,
            userAgent,
          },
          historicoEventos: this.getHistoricoEventos(emailDetailsLegacy),
        };
      }

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(this.buildPropostaNotFoundMessage(propostaId));
      }

      const statusAtual = this.extractFlowStatusFromEmailDetails(proposta.emailDetails) ||
        this.mapDatabaseStatusToFlowStatus(proposta.status);
      const statusVisualizacao = podePromoverParaVisualizada(statusAtual)
        ? 'visualizada'
        : statusAtual;

      if (statusVisualizacao === 'visualizada') {
        proposta.status = this.mapFlowStatusToDatabaseStatus('visualizada', false) as any;
      }
      proposta.portalAccess = {
        accessedAt: new Date().toISOString(),
        ip,
        userAgent,
      };
      proposta.emailDetails = this.appendPortalEvento(
        {
          ...(proposta.emailDetails || {}),
          fluxoStatus: statusVisualizacao,
        },
        'visualizacao_portal',
        {
          origem: 'portal',
          status: statusVisualizacao,
          detalhes:
            statusVisualizacao === 'visualizada'
              ? 'Proposta visualizada no portal do cliente'
              : 'Visualizacao no portal registrada sem alterar status atual da proposta.',
          ip,
          userAgent,
        },
      ) as any;

      const propostaAtualizada =
        statusVisualizacao === 'visualizada'
          ? await this.savePropostaWithStatusFallback(proposta, 'visualizada')
          : await this.propostaRepository.save(proposta);

      if (statusVisualizacao === 'visualizada') {
        this.logger.log(`Proposta ${propostaId} marcada como visualizada`);
      } else {
        this.logger.log(
          `Visualizacao de portal registrada para proposta ${propostaId} sem alterar status (${statusAtual})`,
        );
      }

      await this.syncOportunidadeFromPropostaPrincipal(propostaAtualizada.id, empresaId);
      const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
        [this.entityToInterface(propostaAtualizada)],
        empresaId,
      );
      return propostaHidratada || this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao marcar como visualizada', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Registra envio de email
   */
  async registrarEnvioEmail(
    propostaId: string,
    emailCliente: string,
    linkPortal?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(this.buildPropostaNotFoundMessage(propostaId));
      }

      this.assertItensComerciaisParaFluxo(proposta.produtos, 'enviar');
      proposta.status = this.mapFlowStatusToDatabaseStatus('enviada', false) as any;
      let emailDetails = {
        ...(proposta.emailDetails || {}),
        sentAt: new Date().toISOString(),
        emailCliente,
        linkPortal,
        fluxoStatus: 'enviada',
      } as Record<string, unknown>;
      emailDetails = this.appendHistoricoEvento(emailDetails, 'proposta_enviada', {
        origem: 'email',
        status: 'enviada',
        detalhes: `Envio registrado para ${this.maskEmail(emailCliente)}`,
      });

      const lembretes = this.getLembretes(emailDetails);
      const lembreteAutomatico: PropostaLembrete = {
        id: randomUUID(),
        status: 'agendado',
        criadoEm: new Date().toISOString(),
        agendadoPara: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        diasApos: 3,
        origem: 'followup-auto',
        observacoes: 'Lembrete automatico de follow-up apos envio da proposta.',
      };
      emailDetails.lembretes = [...lembretes, lembreteAutomatico].slice(-this.MAX_HISTORICO_EVENTOS);
      proposta.emailDetails = emailDetails as any;

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`Email registrado para proposta ${propostaId} (${this.maskEmail(emailCliente)})`);
      await this.syncOportunidadeFromPropostaPrincipal(propostaAtualizada.id, empresaId);
      const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
        [this.entityToInterface(propostaAtualizada)],
        empresaId,
      );
      return propostaHidratada || this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao registrar envio de email', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Marca proposta como enviada (usado pela sincronizacao automatica)
   */
  async marcarComoEnviada(
    propostaIdOuNumero: string,
    emailCliente: string,
    linkPortal?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      this.logger.debug(`Marcando proposta ${propostaIdOuNumero} como enviada automaticamente`);

      // Tentar encontrar por ID (UUID) primeiro, depois por numero
      let proposta = await this.propostaRepository
        .findOne({
          where: empresaId
            ? { id: propostaIdOuNumero, empresaId }
            : { id: propostaIdOuNumero },
        })
        .catch(() => null); // Capturar erro de UUID invalido

      // Se nao encontrou por ID, tentar por numero
      if (!proposta) {
        proposta = await this.propostaRepository.findOne({
          where: empresaId
            ? { numero: propostaIdOuNumero, empresaId }
            : { numero: propostaIdOuNumero },
        });
      }

      if (!proposta) {
        throw new Error(this.buildPropostaNotFoundByIdentifierMessage(propostaIdOuNumero));
      }

      // Atualizar status para enviada
      this.assertItensComerciaisParaFluxo(proposta.produtos, 'enviar');
      proposta.status = this.mapFlowStatusToDatabaseStatus('enviada', false) as any;
      let emailDetails = {
        ...(proposta.emailDetails || {}),
        sentAt: new Date().toISOString(),
        emailCliente,
        linkPortal,
        fluxoStatus: 'enviada',
      } as Record<string, unknown>;
      emailDetails = this.appendHistoricoEvento(emailDetails, 'proposta_enviada', {
        origem: 'sync-email',
        status: 'enviada',
        detalhes: `Proposta marcada como enviada para ${this.maskEmail(emailCliente)}`,
      });
      proposta.emailDetails = emailDetails as any;

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`Proposta ${proposta.numero} marcada como enviada automaticamente`);
      await this.syncOportunidadeFromPropostaPrincipal(propostaAtualizada.id, empresaId);
      const [propostaHidratada] = await this.hydratePropostasOpportunityContext(
        [this.entityToInterface(propostaAtualizada)],
        empresaId,
      );
      return propostaHidratada || this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao marcar proposta como enviada', error?.stack || String(error));
      throw error;
    }
  }

  async registrarEventoPortal(
    propostaId: string,
    empresaId: string,
    evento: string,
    payload?: Partial<PropostaHistoricoEvento>,
  ): Promise<void> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: { id: propostaId, empresaId },
      });

      if (!proposta) {
        this.logger.warn(`Proposta ${propostaId} nao encontrada para registrar evento de portal.`);
        return;
      }

      proposta.emailDetails = this.appendPortalEvento(proposta.emailDetails, evento, {
        origem: payload?.origem || 'portal',
        status: payload?.status,
        detalhes: payload?.detalhes,
        ip: payload?.ip,
        userAgent: payload?.userAgent,
        metadata: payload?.metadata,
        timestamp: payload?.timestamp,
      }) as any;

      await this.propostaRepository.save(proposta);
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar evento de portal para proposta ${propostaId}: ${String(error?.message || error)}`,
      );
    }
  }

  async obterEstatisticasProposta(propostaId: string, empresaId?: string): Promise<{
    totalVisualizacoes: number;
    ultimaVisualizacao?: string;
    tempoMedioVisualizacao: number;
    dispositivosUtilizados: string[];
    acoes: Array<{
      acao: string;
      timestamp: string;
      ip?: string;
      userAgent?: string;
      observacoes?: string;
    }>;
  }> {
    const proposta = await this.obterProposta(propostaId, empresaId);
    if (!proposta) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    const portalEventos = [
      ...(proposta.emailDetails?.portalEventos || []),
      ...(proposta.historicoEventos || []).filter((evento) =>
        String(evento?.origem || '').toLowerCase().includes('portal'),
      ),
    ]
      .map((evento) => this.parseHistoryEvent(evento))
      .filter((evento): evento is PropostaHistoricoEvento => Boolean(evento))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const visualizacoes = portalEventos.filter((evento) => {
      const chave = String(evento.evento || '').toLowerCase();
      return (
        chave.includes('visualizacao') ||
        chave === 'view' ||
        chave === 'visualizada' ||
        chave.includes('abertura')
      );
    });

    const intervalosVisualizacao: number[] = [];
    for (let i = 1; i < visualizacoes.length; i += 1) {
      const anterior = new Date(visualizacoes[i - 1].timestamp).getTime();
      const atual = new Date(visualizacoes[i].timestamp).getTime();
      if (Number.isFinite(anterior) && Number.isFinite(atual) && atual > anterior) {
        intervalosVisualizacao.push((atual - anterior) / 1000);
      }
    }

    const dispositivos = new Set<string>();
    portalEventos.forEach((evento) => {
      const userAgent = String(evento.userAgent || '').toLowerCase();
      if (!userAgent) return;
      if (userAgent.includes('iphone') || userAgent.includes('ios')) {
        dispositivos.add('iOS');
        return;
      }
      if (userAgent.includes('android')) {
        dispositivos.add('Android');
        return;
      }
      if (userAgent.includes('windows')) {
        dispositivos.add('Windows');
        return;
      }
      if (userAgent.includes('mac')) {
        dispositivos.add('macOS');
        return;
      }
      dispositivos.add('Outro');
    });

    return {
      totalVisualizacoes: visualizacoes.length,
      ultimaVisualizacao:
        visualizacoes.length > 0 ? visualizacoes[visualizacoes.length - 1].timestamp : undefined,
      tempoMedioVisualizacao:
        intervalosVisualizacao.length > 0
          ? Math.round(
              intervalosVisualizacao.reduce((total, atual) => total + atual, 0) /
                intervalosVisualizacao.length,
            )
          : 0,
      dispositivosUtilizados: Array.from(dispositivos),
      acoes: portalEventos.map((evento) => ({
        acao: evento.evento,
        timestamp: evento.timestamp,
        ip: evento.ip,
        userAgent: evento.userAgent,
        observacoes: evento.detalhes,
      })),
    };
  }

  async agendarLembrete(
    propostaId: string,
    diasApos = 7,
    empresaId?: string,
  ): Promise<PropostaLembrete> {
    const proposta = await this.propostaRepository.findOne({
      where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
    });

    if (!proposta) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    const dias = Math.max(1, Math.floor(this.toFiniteNumber(diasApos, 7)));
    const lembrete: PropostaLembrete = {
      id: randomUUID(),
      status: 'agendado',
      criadoEm: new Date().toISOString(),
      agendadoPara: new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString(),
      diasApos: dias,
      origem: 'manual',
    };

    let emailDetails = this.toObjectRecord(proposta.emailDetails);
    const lembretes = this.getLembretes(emailDetails);
    emailDetails.lembretes = [...lembretes, lembrete].slice(-this.MAX_HISTORICO_EVENTOS);
    emailDetails = this.appendHistoricoEvento(emailDetails, 'followup_agendado', {
      origem: 'api',
      status:
        this.extractFlowStatusFromEmailDetails(emailDetails) ||
        this.mapDatabaseStatusToFlowStatus(proposta.status),
      detalhes: `Lembrete agendado para ${dias} dia(s) apos o envio.`,
      metadata: {
        lembreteId: lembrete.id,
        agendadoPara: lembrete.agendadoPara,
        diasApos: dias,
      },
    });

    proposta.emailDetails = emailDetails as any;
    await this.propostaRepository.save(proposta);

    return lembrete;
  }

  async listarPropostasExpiradas(
    empresaId: string,
    vendedorId?: string,
  ): Promise<
    Array<{
      id: string;
      numero: string;
      titulo?: string;
      status: string;
      dataEnvio?: string;
      dataValidade?: string;
      valorTotal: number;
      cliente?: unknown;
      vendedor?: unknown;
      produtos?: unknown[];
    }>
  > {
    const propostas = await this.listarPropostas(empresaId);
    const agora = Date.now();
    return propostas
      .filter((proposta) => {
        const expiradaPorStatus = proposta.status === 'expirada';
        const expiradaPorData = proposta.dataVencimento
          ? new Date(proposta.dataVencimento).getTime() < agora
          : false;
        if (!expiradaPorStatus && !expiradaPorData) {
          return false;
        }

        if (!vendedorId) {
          return true;
        }

        if (typeof proposta.vendedor === 'object' && proposta.vendedor?.id) {
          return String(proposta.vendedor.id) === String(vendedorId);
        }

        return String(proposta.vendedor || '') === String(vendedorId);
      })
      .map((proposta) => ({
        id: proposta.id,
        numero: proposta.numero,
        titulo: proposta.titulo,
        status: 'expirada',
        dataEnvio: proposta.emailDetails?.sentAt || proposta.createdAt,
        dataValidade: proposta.dataVencimento,
        valorTotal: this.toFiniteNumber(proposta.total ?? proposta.valor, 0),
        cliente: proposta.cliente,
        vendedor: proposta.vendedor,
        produtos: proposta.produtos || [],
      }));
  }

  async reativarProposta(
    propostaId: string,
    novaDataValidade: string,
    empresaId?: string,
  ): Promise<Proposta> {
    const proposta = await this.propostaRepository.findOne({
      where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
    });

    if (!proposta) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    const novaData = new Date(novaDataValidade);
    if (Number.isNaN(novaData.getTime())) {
      throw new Error('Data de validade invalida para reativacao da proposta.');
    }

    const hoje = new Date();
    const diffDias = Math.max(
      1,
      Math.ceil((novaData.getTime() - hoje.getTime()) / (24 * 60 * 60 * 1000)),
    );

    this.assertItensComerciaisParaFluxo(proposta.produtos, 'enviar');
    proposta.dataVencimento = novaData;
    proposta.validadeDias = diffDias;
    proposta.status = this.mapFlowStatusToDatabaseStatus('enviada', false) as any;

    let emailDetails = {
      ...(proposta.emailDetails || {}),
      fluxoStatus: 'enviada',
    } as Record<string, unknown>;
    emailDetails = this.appendHistoricoEvento(emailDetails, 'proposta_reativada', {
      origem: 'api',
      status: 'enviada',
      detalhes: `Proposta reativada com validade ate ${novaData.toISOString().split('T')[0]}.`,
      metadata: { novaDataValidade: novaData.toISOString(), validadeDias: diffDias },
    });

    proposta.emailDetails = emailDetails as any;
    const propostaSalva = await this.propostaRepository.save(proposta);
    return this.entityToInterface(propostaSalva);
  }

  async obterHistoricoProposta(propostaId: string, empresaId?: string): Promise<{
    criacaoEm: string;
    envioEm?: string;
    primeiraVisualizacaoEm?: string;
    decisaoEm?: string;
    statusAtual: string;
    ultimoMotivoAjustes?: {
      texto: string;
      data: string;
      origem?: string;
      status?: string;
    };
    aprovacaoInterna?: PropostaAprovacaoInterna;
    versoes: PropostaVersao[];
    log: Array<{
      data: string;
      evento: string;
      detalhes: string;
      ip?: string;
      origem?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    }>;
  }> {
    const proposta = await this.obterProposta(propostaId, empresaId);
    if (!proposta) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    const historico = (proposta.historicoEventos || proposta.emailDetails?.historicoEventos || [])
      .map((evento) => this.parseHistoryEvent(evento))
      .filter((evento): evento is PropostaHistoricoEvento => Boolean(evento))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const portalHistorico = (proposta.emailDetails?.portalEventos || [])
      .map((evento) => this.parseHistoryEvent(evento))
      .filter((evento): evento is PropostaHistoricoEvento => Boolean(evento));

    const envioEvento = historico.find((evento) =>
      ['proposta_enviada', 'status_alterado'].includes(String(evento.evento).toLowerCase()) &&
      evento.status === 'enviada',
    );
    const primeiraVisualizacao = historico.find((evento) => {
      const chave = String(evento.evento || '').toLowerCase();
      return chave.includes('visualizacao') || chave === 'view' || chave === 'visualizada';
    });
    const decisao = historico.find((evento) =>
      evento.status === 'aprovada' || evento.status === 'rejeitada',
    );
    const eventosComPortalOrdenados = [...historico, ...portalHistorico].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    const eventoMotivoAjustes = eventosComPortalOrdenados.find((evento) =>
      Boolean(this.extractMotivoAjustesFromContext(evento.detalhes, evento.metadata)),
    );
    const ultimoMotivoAjustesTexto = eventoMotivoAjustes
      ? this.extractMotivoAjustesFromContext(eventoMotivoAjustes.detalhes, eventoMotivoAjustes.metadata)
      : undefined;

    const versoesEnriquecidas = await Promise.all(
      (proposta.versoes || []).map(async (versao) => {
        const snapshot = versao?.snapshot || ({} as any);
        const produtosSnapshot = Array.isArray(snapshot.produtos) ? snapshot.produtos : [];
        const produtos = await this.enrichSnapshotProdutos(produtosSnapshot, empresaId);
        return {
          ...versao,
          snapshot: {
            ...snapshot,
            produtos,
          },
        };
      }),
    );

    return {
      criacaoEm: proposta.createdAt,
      envioEm: envioEvento?.timestamp,
      primeiraVisualizacaoEm: primeiraVisualizacao?.timestamp,
      decisaoEm: decisao?.timestamp,
      statusAtual: proposta.status,
      ultimoMotivoAjustes:
        eventoMotivoAjustes && ultimoMotivoAjustesTexto
          ? {
              texto: ultimoMotivoAjustesTexto,
              data: eventoMotivoAjustes.timestamp,
              origem: eventoMotivoAjustes.origem,
              status: eventoMotivoAjustes.status,
            }
          : undefined,
      aprovacaoInterna: proposta.aprovacaoInterna,
      versoes: versoesEnriquecidas,
      log: historico.map((evento) => ({
        data: evento.timestamp,
        evento: evento.evento,
        detalhes: evento.detalhes || '',
        ip: evento.ip,
        origem: evento.origem,
        status: evento.status,
        metadata:
          evento.metadata && typeof evento.metadata === 'object' && !Array.isArray(evento.metadata)
            ? (evento.metadata as Record<string, unknown>)
            : undefined,
      })),
    };
  }

  async obterAprovacaoInterna(
    propostaId: string,
    empresaId?: string,
  ): Promise<PropostaAprovacaoInterna> {
    const proposta = await this.obterProposta(propostaId, empresaId);
    if (!proposta) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    const commercialPolicy = await this.resolveCommercialPolicy(empresaId);
    return this.calcularAprovacaoInterna(
      proposta.descontoGlobal,
      proposta.produtos,
      proposta.aprovacaoInterna || this.parseAprovacaoInterna(proposta.emailDetails),
      commercialPolicy,
    );
  }

  async solicitarAprovacaoInterna(
    propostaId: string,
    payload: {
      solicitadaPorId?: string;
      solicitadaPorNome?: string;
      observacoes?: string;
    },
    empresaId?: string,
  ): Promise<PropostaAprovacaoInterna> {
    const proposta = await this.propostaRepository.findOne({
      where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
    });

    if (!proposta) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    const commercialPolicy = await this.resolveCommercialPolicy(empresaId);
    const aprovacaoBase = this.calcularAprovacaoInterna(
      proposta.descontoGlobal,
      proposta.produtos,
      this.parseAprovacaoInterna(proposta.emailDetails),
      commercialPolicy,
    );

    if (!aprovacaoBase.obrigatoria) {
      proposta.emailDetails = {
        ...(proposta.emailDetails || {}),
        aprovacaoInterna: aprovacaoBase,
      } as any;
      await this.propostaRepository.save(proposta);
      return aprovacaoBase;
    }

    const aprovacao: PropostaAprovacaoInterna = {
      ...aprovacaoBase,
      status: 'pendente',
      solicitadaEm: new Date().toISOString(),
      solicitadaPorId: payload?.solicitadaPorId,
      solicitadaPorNome: payload?.solicitadaPorNome,
      observacoes: payload?.observacoes,
      aprovadaEm: undefined,
      aprovadaPorId: undefined,
      aprovadaPorNome: undefined,
      rejeitadaEm: undefined,
      rejeitadaPorId: undefined,
      rejeitadaPorNome: undefined,
    };

    let emailDetails = {
      ...(proposta.emailDetails || {}),
      aprovacaoInterna: aprovacao,
    } as Record<string, unknown>;
    emailDetails = this.appendHistoricoEvento(emailDetails, 'aprovacao_interna_solicitada', {
      origem: 'api',
      status:
        this.extractFlowStatusFromEmailDetails(emailDetails) ||
        this.mapDatabaseStatusToFlowStatus(proposta.status),
      detalhes: 'Aprovacao interna solicitada.',
      metadata: {
        solicitadaPorId: payload?.solicitadaPorId,
        solicitadaPorNome: payload?.solicitadaPorNome,
      },
    });

    proposta.emailDetails = emailDetails as any;
    await this.propostaRepository.save(proposta);
    return aprovacao;
  }

  async decidirAprovacaoInterna(
    propostaId: string,
    payload: {
      aprovada: boolean;
      usuarioId?: string;
      usuarioNome?: string;
      observacoes?: string;
    },
    empresaId?: string,
  ): Promise<PropostaAprovacaoInterna> {
    const proposta = await this.propostaRepository.findOne({
      where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
    });

    if (!proposta) {
      throw new Error(this.buildPropostaNotFoundMessage(propostaId));
    }

    const commercialPolicy = await this.resolveCommercialPolicy(empresaId);
    const aprovacaoBase = this.calcularAprovacaoInterna(
      proposta.descontoGlobal,
      proposta.produtos,
      this.parseAprovacaoInterna(proposta.emailDetails),
      commercialPolicy,
    );

    if (!aprovacaoBase.obrigatoria) {
      return aprovacaoBase;
    }

    const agora = new Date().toISOString();
    const aprovacao: PropostaAprovacaoInterna = payload.aprovada
      ? {
          ...aprovacaoBase,
          status: 'aprovada',
          aprovadaEm: agora,
          aprovadaPorId: payload?.usuarioId,
          aprovadaPorNome: payload?.usuarioNome,
          observacoes: payload?.observacoes,
        }
      : {
          ...aprovacaoBase,
          status: 'rejeitada',
          rejeitadaEm: agora,
          rejeitadaPorId: payload?.usuarioId,
          rejeitadaPorNome: payload?.usuarioNome,
          observacoes: payload?.observacoes,
        };

    let emailDetails = {
      ...(proposta.emailDetails || {}),
      aprovacaoInterna: aprovacao,
    } as Record<string, unknown>;
    emailDetails = this.appendHistoricoEvento(emailDetails, 'aprovacao_interna_decidida', {
      origem: 'api',
      status:
        this.extractFlowStatusFromEmailDetails(emailDetails) ||
        this.mapDatabaseStatusToFlowStatus(proposta.status),
      detalhes: payload.aprovada
        ? 'Aprovacao interna concluida como APROVADA.'
        : 'Aprovacao interna concluida como REJEITADA.',
      metadata: {
        usuarioId: payload?.usuarioId,
        usuarioNome: payload?.usuarioNome,
      },
    });

    proposta.emailDetails = emailDetails as any;
    await this.propostaRepository.save(proposta);
    return aprovacao;
  }

  async obterEstatisticasDashboard(empresaId?: string): Promise<{
    totalPropostas: number;
    valorTotalPipeline: number;
    taxaConversao: number;
    propostasAprovadas: number;
    estatisticasPorStatus: Record<string, number>;
    estatisticasPorVendedor: Record<string, number>;
    motivosPerdaTop: Array<{ motivo: string; quantidade: number }>;
    conversaoPorVendedor: Array<{
      vendedor: string;
      total: number;
      ganhas: number;
      perdidas: number;
      taxaConversao: number;
    }>;
    conversaoPorProduto: Array<{
      produto: string;
      total: number;
      ganhas: number;
      perdidas: number;
      taxaConversao: number;
    }>;
    aprovacoesPendentes: number;
    followupsPendentes: number;
    propostasComVersao: number;
    mediaVersoesPorProposta: number;
    revisoesUltimos7Dias: number;
    usoItensVsCombos: {
      itensAvulsos: number;
      combos: number;
      propostasComItensAvulsos: number;
      propostasComCombos: number;
      propostasMistas: number;
      percentualItensAvulsos: number;
      percentualCombos: number;
    };
  }> {
    const propostas = await this.listarPropostas(empresaId);
    const totalPropostas = propostas.length;
    const valorTotalPipeline = propostas.reduce(
      (total, proposta) => total + this.toFiniteNumber(proposta.total ?? proposta.valor, 0),
      0,
    );
    const propostasAprovadas = propostas.filter((proposta) => WON_STATUS_VALUES.has(proposta.status))
      .length;
    const taxaConversao =
      totalPropostas > 0 ? Number(((propostasAprovadas / totalPropostas) * 100).toFixed(2)) : 0;

    const estatisticasPorStatus: Record<string, number> = {};
    const estatisticasPorVendedor: Record<string, number> = {};
    const motivosPerda: Record<string, number> = {};
    const vendedorMap = new Map<
      string,
      { total: number; ganhas: number; perdidas: number; motivos: Record<string, number> }
    >();
    const produtoMap = new Map<string, { total: number; ganhas: number; perdidas: number }>();
    let aprovacoesPendentes = 0;
    let followupsPendentes = 0;
    let propostasComVersao = 0;
    let totalVersoes = 0;
    let revisoesUltimos7Dias = 0;
    let totalItensAvulsos = 0;
    let totalCombos = 0;
    let propostasComItensAvulsos = 0;
    let propostasComCombos = 0;
    let propostasMistas = 0;
    const limiteRevisaoRecente = Date.now() - 7 * 24 * 60 * 60 * 1000;

    propostas.forEach((proposta) => {
      const status = proposta.status || FLOW_STATUS_FALLBACK;
      estatisticasPorStatus[status] = (estatisticasPorStatus[status] || 0) + 1;

      const vendedorNome =
        typeof proposta.vendedor === 'object'
          ? proposta.vendedor?.nome || 'Sem vendedor'
          : proposta.vendedor || 'Sem vendedor';
      estatisticasPorVendedor[vendedorNome] = (estatisticasPorVendedor[vendedorNome] || 0) + 1;

      if (!vendedorMap.has(vendedorNome)) {
        vendedorMap.set(vendedorNome, { total: 0, ganhas: 0, perdidas: 0, motivos: {} });
      }
      const vendedorStats = vendedorMap.get(vendedorNome)!;
      vendedorStats.total += 1;
      if (WON_STATUS_VALUES.has(status)) {
        vendedorStats.ganhas += 1;
      }
      if (status === 'rejeitada') {
        vendedorStats.perdidas += 1;
        const motivo = this.sanitizeMotivoPerda(proposta.motivoPerda) || 'Nao informado';
        motivosPerda[motivo] = (motivosPerda[motivo] || 0) + 1;
        vendedorStats.motivos[motivo] = (vendedorStats.motivos[motivo] || 0) + 1;
      }

      let propostaTemItemAvulso = false;
      let propostaTemCombo = false;

      (proposta.produtos || []).forEach((produto) => {
        const record = produto as Record<string, unknown>;
        const nomeProduto = String(record?.nome || 'Produto nao informado');
        if (!produtoMap.has(nomeProduto)) {
          produtoMap.set(nomeProduto, { total: 0, ganhas: 0, perdidas: 0 });
        }
        const produtoStats = produtoMap.get(nomeProduto)!;
        produtoStats.total += 1;
        if (WON_STATUS_VALUES.has(status)) {
          produtoStats.ganhas += 1;
        }
        if (status === 'rejeitada') {
          produtoStats.perdidas += 1;
        }

        if (this.isComboSnapshotItem(record)) {
          totalCombos += 1;
          propostaTemCombo = true;
          return;
        }

        totalItensAvulsos += 1;
        propostaTemItemAvulso = true;
      });

      if (propostaTemItemAvulso) {
        propostasComItensAvulsos += 1;
      }
      if (propostaTemCombo) {
        propostasComCombos += 1;
      }
      if (propostaTemItemAvulso && propostaTemCombo) {
        propostasMistas += 1;
      }

      if (proposta.aprovacaoInterna?.status === 'pendente') {
        aprovacoesPendentes += 1;
      }

      followupsPendentes += (proposta.lembretes || []).filter(
        (lembrete) => lembrete.status === 'agendado',
      ).length;

      const versoesProposta = Array.isArray(proposta.versoes)
        ? proposta.versoes
        : Array.isArray((proposta.emailDetails as any)?.versoes)
          ? ((proposta.emailDetails as any).versoes as Array<Record<string, unknown>>)
          : [];
      const quantidadeVersoes = versoesProposta.length;

      if (quantidadeVersoes > 1) {
        propostasComVersao += 1;
      }
      totalVersoes += Math.max(quantidadeVersoes, 1);

      const possuiRevisaoRecente = versoesProposta.some((versao) => {
        const timestamp = new Date(
          (versao as any)?.criadaEm || (versao as any)?.timestamp || '',
        ).getTime();
        return Number.isFinite(timestamp) && timestamp >= limiteRevisaoRecente;
      });

      if (possuiRevisaoRecente) {
        revisoesUltimos7Dias += 1;
      }
    });

    const motivosPerdaTop = Object.entries(motivosPerda)
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    const conversaoPorVendedor = Array.from(vendedorMap.entries())
      .map(([vendedor, stats]) => ({
        vendedor,
        total: stats.total,
        ganhas: stats.ganhas,
        perdidas: stats.perdidas,
        taxaConversao: stats.total > 0 ? Number(((stats.ganhas / stats.total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const conversaoPorProduto = Array.from(produtoMap.entries())
      .map(([produto, stats]) => ({
        produto,
        total: stats.total,
        ganhas: stats.ganhas,
        perdidas: stats.perdidas,
        taxaConversao: stats.total > 0 ? Number(((stats.ganhas / stats.total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const totalRegistrosCatalogo = totalItensAvulsos + totalCombos;
    const percentualItensAvulsos =
      totalRegistrosCatalogo > 0
        ? Number(((totalItensAvulsos / totalRegistrosCatalogo) * 100).toFixed(2))
        : 0;
    const percentualCombos =
      totalRegistrosCatalogo > 0 ? Number(((totalCombos / totalRegistrosCatalogo) * 100).toFixed(2)) : 0;

    return {
      totalPropostas,
      valorTotalPipeline,
      taxaConversao,
      propostasAprovadas,
      estatisticasPorStatus,
      estatisticasPorVendedor,
      motivosPerdaTop,
      conversaoPorVendedor,
      conversaoPorProduto,
      aprovacoesPendentes,
      followupsPendentes,
      propostasComVersao,
      mediaVersoesPorProposta:
        totalPropostas > 0 ? Number((totalVersoes / totalPropostas).toFixed(2)) : 0,
      revisoesUltimos7Dias,
      usoItensVsCombos: {
        itensAvulsos: totalItensAvulsos,
        combos: totalCombos,
        propostasComItensAvulsos,
        propostasComCombos,
        propostasMistas,
        percentualItensAvulsos,
        percentualCombos,
      },
    };
  }
}
