import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Proposta as PropostaEntity } from './proposta.entity';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Produto as ProdutoEntity } from '../produtos/produto.entity';

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

const FLOW_STATUS_TRANSITIONS: Record<SalesFlowStatus, readonly SalesFlowStatus[]> = {
  rascunho: ['enviada', 'aprovada', 'rejeitada', 'expirada'],
  enviada: ['visualizada', 'negociacao', 'aprovada', 'rejeitada', 'expirada'],
  visualizada: ['negociacao', 'aprovada', 'rejeitada', 'expirada'],
  negociacao: ['aprovada', 'rejeitada', 'expirada', 'visualizada'],
  aprovada: ['contrato_gerado', 'rejeitada'],
  contrato_gerado: ['contrato_assinado'],
  contrato_assinado: ['fatura_criada'],
  fatura_criada: ['contrato_assinado', 'aguardando_pagamento', 'pago'],
  aguardando_pagamento: ['contrato_assinado', 'pago', 'rejeitada'],
  pago: ['aguardando_pagamento'],
  rejeitada: ['negociacao', 'enviada'],
  expirada: ['enviada', 'negociacao'],
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

export interface Proposta {
  id: string;
  numero: string;
  titulo?: string;
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
  private tableColumnsCache = new Map<string, Set<string>>();
  private readonly APROVACAO_DESCONTO_PADRAO = 10;
  private readonly MAX_HISTORICO_EVENTOS = 200;
  private readonly MAX_VERSOES = 50;

  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(ProdutoEntity)
    private produtoRepository: Repository<ProdutoEntity>,
  ) {
    // Inicializar contador baseado nas propostas existentes
    this.inicializarContador();
  }

  private async enrichSnapshotProdutos(produtos: unknown[], empresaId?: string): Promise<unknown[]> {
    if (!empresaId || !Array.isArray(produtos) || produtos.length === 0) {
      return Array.isArray(produtos) ? produtos : [];
    }

    const ids = Array.from(
      new Set(
        produtos
          .map((item) => {
            if (!item || typeof item !== 'object') {
              return '';
            }
            const record = item as Record<string, unknown>;
            const nome = typeof record.nome === 'string' ? record.nome.trim() : '';
            const produtoNome =
              typeof record.produtoNome === 'string' ? record.produtoNome.trim() : '';
            if (nome || produtoNome) {
              return '';
            }

            const id =
              record.id ??
              record.produtoId ??
              record.produto_id ??
              (record.produto && typeof record.produto === 'object'
                ? (record.produto as Record<string, unknown>).id
                : undefined);
            return id ? String(id) : '';
          })
          .filter((id) => Boolean(id)),
      ),
    );

    if (ids.length === 0) {
      return produtos;
    }

    const encontrados = await this.produtoRepository.find({
      select: ['id', 'nome', 'descricao'],
      where: {
        empresaId,
        id: In(ids),
      },
    });

    const map = new Map(encontrados.map((p) => [p.id, p]));

    return produtos.map((item) => {
      if (!item || typeof item !== 'object') {
        return item;
      }

      const record = item as Record<string, unknown>;
      const nome = typeof record.nome === 'string' ? record.nome.trim() : '';
      const produtoNome = typeof record.produtoNome === 'string' ? record.produtoNome.trim() : '';
      if (nome || produtoNome) {
        return item;
      }

      const id =
        record.id ??
        record.produtoId ??
        record.produto_id ??
        (record.produto && typeof record.produto === 'object'
          ? (record.produto as Record<string, unknown>).id
          : undefined);
      const resolved = id ? map.get(String(id)) : undefined;
      if (!resolved) {
        return item;
      }

      return {
        ...record,
        nome: resolved.nome,
        descricao: record.descricao ?? resolved.descricao ?? undefined,
      };
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

  private async inicializarContador() {
    try {
      // Importante: não usar findOne() aqui.
      // Em ambientes com schema legado, o entity atual pode conter colunas ainda não existentes
      // (ex.: cliente/produtos em JSONB). Então buscamos apenas o campo `numero`.
      const ultima = await this.propostaRepository
        .createQueryBuilder('p')
        .select('p.numero', 'numero')
        .orderBy('p.numero', 'DESC')
        .limit(1)
        .getRawOne<{ numero?: string }>();

      if (ultima?.numero) {
        const numeroMatch = ultima.numero.match(/(\d+)$/);
        if (numeroMatch) {
          this.contadorId = parseInt(numeroMatch[1]) + 1;
        }
      }
    } catch (error) {
      this.logger.warn(`Erro ao inicializar contador de propostas: ${error.message}`);
    }
  }

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    if (this.tableColumnsCache.has(tableName)) {
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

  private isStatusTransitionAllowed(
    currentStatus: SalesFlowStatus,
    nextStatus: SalesFlowStatus,
  ): boolean {
    if (currentStatus === nextStatus) {
      return true;
    }

    return this.getAllowedStatusTransitions(currentStatus).includes(nextStatus);
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

  private calcularAprovacaoInterna(
    descontoGlobal?: unknown,
    produtos?: unknown,
    atual?: PropostaAprovacaoInterna | null,
  ): PropostaAprovacaoInterna {
    const limiteDesconto = this.APROVACAO_DESCONTO_PADRAO;
    const descontoDetectado = this.getMaxDescontoPercentual(descontoGlobal, produtos);
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

  private async ensureLegacyOportunidadeId(
    empresaId: string,
    titulo: string,
    valor: number,
    vendedorId: string | null,
  ): Promise<string> {
    const oportunidadeColumns = await this.getTableColumns('oportunidades');
    const userColumn = oportunidadeColumns.has('usuario_id')
      ? 'usuario_id'
      : oportunidadeColumns.has('responsavel_id')
        ? 'responsavel_id'
        : null;

    const insertColumns: string[] = ['empresa_id', 'titulo', 'valor'];
    const insertValues: unknown[] = [empresaId, titulo, valor];

    if (userColumn) {
      insertColumns.push(userColumn);
      insertValues.push(vendedorId || (await this.resolveFallbackUserId(empresaId)));
    }

    if (oportunidadeColumns.has('estagio')) {
      insertColumns.push('estagio');
      insertValues.push('lead');
    }

    if (oportunidadeColumns.has('probabilidade')) {
      insertColumns.push('probabilidade');
      insertValues.push(0);
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
    const subtotal = Number(overrides.subtotal ?? total);
    const descontoGlobal = Number(overrides.descontoGlobal ?? row?.descontoGlobal ?? 0);
    const impostos = Number(overrides.impostos ?? row?.impostos ?? 0);
    const criadaEmIso = this.toIsoString(
      row?.criado_em ?? row?.criadaEm ?? overrides.criadaEm ?? overrides.createdAt,
    );
    const atualizadaEmIso = this.toIsoString(
      row?.atualizado_em ?? row?.atualizadaEm ?? overrides.atualizadaEm ?? overrides.updatedAt,
    );
    const dataVencimentoIso = row?.validade
      ? this.toIsoString(row.validade)
      : overrides.dataVencimento;
    const observacoesRaw =
      overrides.observacoes ??
      row?.observacoes ??
      row?.descricao ??
      (row?.cliente ? row?.cliente.observacoes : undefined);
    const legacyMeta = this.parseLegacyFlowMetadata(observacoesRaw);
    const statusCalculado = overrides.status
      ? this.normalizeStatusInput(overrides.status as string)
      : legacyMeta.fluxoStatus || this.mapDatabaseStatusToFlowStatus(row?.status);
    const motivoPerda = overrides.motivoPerda ?? legacyMeta.motivoPerda;

    const clienteFallback: Proposta['cliente'] = {
      id: 'cliente-legacy',
      nome: defaultClienteNome,
      email: '',
    };

    const cliente =
      overrides.cliente && typeof overrides.cliente === 'object' ? overrides.cliente : clienteFallback;

    return {
      id: row?.id ?? overrides.id ?? randomUUID(),
      numero: row?.numero ?? overrides.numero ?? this.gerarNumero(),
      titulo: row?.titulo ?? overrides.titulo,
      cliente,
      produtos: overrides.produtos ?? [],
      subtotal,
      descontoGlobal,
      impostos,
      total,
      valor,
      formaPagamento: overrides.formaPagamento ?? 'avista',
      validadeDias: overrides.validadeDias ?? 30,
      observacoes: legacyMeta.observacoesLimpa,
      incluirImpostosPDF: overrides.incluirImpostosPDF ?? false,
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
      emailDetails: overrides.emailDetails,
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

    return {
      id: entity.id,
      numero: entity.numero,
      titulo: entity.titulo,
      cliente: entity.cliente,
      produtos: entity.produtos,
      subtotal: Number(entity.subtotal),
      descontoGlobal: Number(entity.descontoGlobal),
      impostos: Number(entity.impostos),
      total: Number(entity.total),
      valor: Number(entity.valor),
      formaPagamento: entity.formaPagamento as any,
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

  private gerarId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `PROP-2025-${timestamp}-${random}`;
  }

  private gerarNumero(): string {
    return `PROP-2025-${this.contadorId.toString().padStart(3, '0')}`;
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

        const rows: any[] = await this.propostaRepository.query(
          `
            SELECT
              p.id,
              p.numero,
              p.titulo,
              p.valor,
              p.status,
              ${descricaoExpr} AS descricao,
              ${validadeExpr} AS validade,
              p.${createdColumn} AS criado_em,
              p.${updatedColumn} AS atualizado_em
            FROM propostas p
            ${whereClause}
            ORDER BY p.${createdColumn} DESC
          `,
          params,
        );

        return rows.map((row) => this.buildLegacyInterface(row));
      }

      const entities = await this.propostaRepository.find({
        where: empresaId ? { empresaId } : undefined,
        order: { criadaEm: 'DESC' },
        relations: columns.has('vendedor_id') ? ['vendedor'] : [],
      });

      this.logger.debug(`${entities.length} propostas encontradas no banco`);
      return entities.map((entity) => this.entityToInterface(entity));
    } catch (error) {
      this.logger.error('Erro ao listar propostas', error?.stack || String(error));
      return [];
    }
  }

  /**
   * Obtém uma proposta específica
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

        const rows: any[] = await this.propostaRepository.query(
          `
            SELECT
              p.id,
              p.numero,
              p.titulo,
              p.valor,
              p.status,
              ${descricaoExpr} AS descricao,
              ${validadeExpr} AS validade,
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

        return this.buildLegacyInterface(rows[0]);
      }

      const entity = await this.propostaRepository.findOne({
        where: empresaId ? { id, empresaId } : { id },
        relations: columns.has('vendedor_id') ? ['vendedor'] : [],
      });

      return entity ? this.entityToInterface(entity) : null;
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
      const numero = this.gerarNumero();
      this.contadorId++;
      const empresaIdProposta =
        empresaId ?? (dadosProposta as any).empresaId ?? (dadosProposta as any).empresa_id;

      // Buscar vendedor pelo nome para obter o UUID
      let vendedorId = null;
      if (dadosProposta.vendedor) {
        // Se vendedor for um objeto, usar o ID direto
        if (typeof dadosProposta.vendedor === 'object' && dadosProposta.vendedor.id) {
          vendedorId = dadosProposta.vendedor.id;
          this.logger.debug(`Vendedor recebido (objeto): ${JSON.stringify({ nome: this.summarizeText((dadosProposta.vendedor as any).nome, 40), vendedorId })}`);
        } else {
          // Se vendedor for uma string, buscar pelo nome
          const nomeVendedor =
            typeof dadosProposta.vendedor === 'string'
              ? dadosProposta.vendedor
              : dadosProposta.vendedor.nome;

          const vendedor = await this.userRepository.findOne({
            where: empresaIdProposta
              ? { nome: nomeVendedor, empresa_id: empresaIdProposta }
              : { nome: nomeVendedor },
          });

          if (vendedor) {
            vendedorId = vendedor.id;
            this.logger.debug(`Vendedor encontrado por nome: ${JSON.stringify({ nome: this.summarizeText(nomeVendedor, 40), vendedorId })}`);
          } else {
            this.logger.warn(`Vendedor nao encontrado: ${this.summarizeText(nomeVendedor, 40)}`);
          }
        }
      }

      // Processar cliente baseado no tipo de dados recebido
      let clienteProcessado;
      if (typeof dadosProposta.cliente === 'string') {
        // 🔍 BUSCAR CLIENTE REAL NO BANCO ao invés de gerar email fictício
        const nomeCliente = dadosProposta.cliente as string;
        this.logger.debug(`Buscando cliente real por nome: ${this.summarizeText(nomeCliente, 50)}`);

        try {
          // Buscar cliente real pelo nome (busca flexível)
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
              email: clienteReal.email, // ✅ USAR EMAIL REAL
              telefone: clienteReal.telefone, // ✅ USAR TELEFONE REAL
              documento: clienteReal.documento || '',
              status: clienteReal.status || 'lead',
            };
          } else {
            this.logger.warn(`Cliente nao encontrado no cadastro: ${this.summarizeText(nomeCliente, 50)}`);
            // ✅ NÃO gerar email fictício - deixar vazio para busca posterior
            clienteProcessado = {
              id: 'cliente-temp',
              nome: nomeCliente,
              email: '', // ← DEIXAR VAZIO ao invés de gerar fictício
              telefone: '',
              documento: '',
              status: 'lead',
            };
          }
        } catch (error) {
          this.logger.error('Erro ao buscar cliente no banco', error?.stack || String(error));
          // Fallback sem email fictício
          clienteProcessado = {
            id: 'cliente-temp',
            nome: nomeCliente,
            email: '', // ← NÃO gerar email fictício
            telefone: '',
            documento: '',
            status: 'lead',
          };
        }
      } else if (dadosProposta.cliente && typeof dadosProposta.cliente === 'object') {
        // Se é objeto, usar como está
        clienteProcessado = dadosProposta.cliente;
      } else {
        // Fallback para cliente padrão SEM EMAIL FICTÍCIO
        clienteProcessado = {
          id: 'cliente-default',
          nome: 'Cliente Temporário',
          email: '', // ✅ NÃO gerar email fictício
          telefone: '',
          documento: '',
          status: 'lead',
        };
      }

      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);
      const fluxoStatus = this.normalizeStatusInput(dadosProposta.status as string | undefined);
      const motivoPerda = this.sanitizeMotivoPerda((dadosProposta as any).motivoPerda);
      const observacoesComFluxo = this.mergeLegacyFlowMetadata(undefined, {
        observacoes: dadosProposta.observacoes,
        fluxoStatus,
        motivoPerda,
      });

      if (legacySchema) {
        const titulo = dadosProposta.titulo || `Proposta ${numero}`;
        const valor = Number(dadosProposta.valor || dadosProposta.total || 0);
        const validadeDias = dadosProposta.validadeDias || 30;
        const dataVencimento =
          dadosProposta.dataVencimento ||
          new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toISOString();
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
            await this.ensureLegacyOportunidadeId(empresaIdProposta, titulo, valor, vendedorId),
          );
        }

        if (propostaColumns.has('descricao')) {
          insertColumns.push('descricao');
          insertValues.push(observacoesComFluxo ?? null);
        }

        if (propostaColumns.has('validade')) {
          insertColumns.push('validade');
          insertValues.push(new Date(dataVencimento));
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

        return this.buildLegacyInterface(
          rows?.[0],
          {
            cliente: clienteProcessado,
            produtos: dadosProposta.produtos || [],
            subtotal: dadosProposta.subtotal || 0,
            descontoGlobal: dadosProposta.descontoGlobal || 0,
            impostos: dadosProposta.impostos || 0,
            total: dadosProposta.total || valor,
            valor,
            formaPagamento: dadosProposta.formaPagamento || 'avista',
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
      }

      const emailDetailsIniciais: Record<string, unknown> = {
        fluxoStatus,
        ...(motivoPerda ? { motivoPerda } : {}),
        aprovacaoInterna: this.calcularAprovacaoInterna(
          dadosProposta.descontoGlobal,
          dadosProposta.produtos,
          null,
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
        validadeDias: dadosProposta.validadeDias || 30,
        observacoes: dadosProposta.observacoes,
        incluirImpostosPDF: dadosProposta.incluirImpostosPDF || false,
        status: this.mapFlowStatusToDatabaseStatus(fluxoStatus, false) as any,
        dataVencimento: dadosProposta.dataVencimento
          ? new Date(dadosProposta.dataVencimento)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: dadosProposta.source || 'api',
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
      this.logger.log(`✅ Proposta criada no banco: ${propostaSalva.id} - ${propostaSalva.numero}`);

      return this.entityToInterface(propostaSalva);
    } catch (error) {
      this.logger.error('Erro ao criar proposta', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Atualiza dados de uma proposta (além de status)
   */
  async atualizarProposta(
    id: string,
    dadosProposta: Partial<Proposta>,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);
      if (legacySchema) {
        const setClauses: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        if (dadosProposta.titulo !== undefined) {
          setClauses.push(`"titulo" = $${idx++}`);
          params.push(dadosProposta.titulo || null);
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
          if (!existente) throw new Error(`Proposta com ID ${id} nao encontrada`);
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
          throw new Error(`Proposta com ID ${id} nao encontrada`);
        }

        const propostaAtualizada = await this.obterProposta(id, empresaId);
        if (!propostaAtualizada) {
          throw new Error(`Proposta com ID ${id} nao encontrada`);
        }
        return propostaAtualizada;
      }

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id, empresaId } : { id },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${id} nao encontrada`);
      }

      if (dadosProposta.titulo !== undefined) {
        proposta.titulo = dadosProposta.titulo || null;
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

      if (dadosProposta.vendedor !== undefined) {
        let vendedorId: string | null = null;

        if (dadosProposta.vendedor && typeof dadosProposta.vendedor === 'object') {
          vendedorId = (dadosProposta.vendedor as any).id || null;
        } else if (typeof dadosProposta.vendedor === 'string') {
          const vendedor = await this.userRepository.findOne({
            where: empresaId ? { nome: dadosProposta.vendedor, empresa_id: empresaId } : { nome: dadosProposta.vendedor },
          });
          vendedorId = vendedor?.id || null;
        }

        proposta.vendedor_id = vendedorId;
      }

      let detalhesAtualizados = this.toObjectRecord(proposta.emailDetails);
      detalhesAtualizados.aprovacaoInterna = this.calcularAprovacaoInterna(
        proposta.descontoGlobal,
        proposta.produtos,
        this.parseAprovacaoInterna(detalhesAtualizados),
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

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`✅ Proposta atualizada: ${propostaAtualizada.id}`);
      return this.entityToInterface(propostaAtualizada);
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
  ): Promise<Proposta> {
    try {
      const fluxoStatus = this.normalizeStatusInput(status);
      const motivoPerdaLimpo = this.sanitizeMotivoPerda(motivoPerda);
      this.logger.debug(
        `atualizarStatus chamado: ${JSON.stringify({
          propostaId,
          tipoPropostaId: typeof propostaId,
          statusRecebido: status,
          fluxoStatus,
          source: source || null,
          hasObservacoes: Boolean(observacoes),
          hasMotivoPerda: Boolean(motivoPerdaLimpo),
        })}`,
      );

      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);
      if (legacySchema) {
        const propostaAtual = await this.obterProposta(propostaId, empresaId);
        if (!propostaAtual) {
          throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
        }

        if (!this.isStatusTransitionAllowed(propostaAtual.status, fluxoStatus)) {
          const allowed = this.getAllowedStatusTransitions(propostaAtual.status);
          throw new BadRequestException(
            `Transicao de status invalida: ${propostaAtual.status} -> ${fluxoStatus}. ` +
              `Permitidos: ${allowed.join(', ') || 'nenhum'}`,
          );
        }

        const observacoesComFluxo = this.mergeLegacyFlowMetadata(propostaAtual.observacoes, {
          observacoes,
          fluxoStatus,
          motivoPerda,
        });

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
        this.logger.log(
          `Status da proposta ${propostaId} atualizado para: ${fluxoStatus} (legacy mode)`,
        );
        return propostaAtualizada;
      }

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      const statusAnterior =
        this.extractFlowStatusFromEmailDetails(proposta.emailDetails) ||
        this.mapDatabaseStatusToFlowStatus(proposta.status);
      if (!this.isStatusTransitionAllowed(statusAnterior, fluxoStatus)) {
        const allowed = this.getAllowedStatusTransitions(statusAnterior);
        throw new BadRequestException(
          `Transicao de status invalida: ${statusAnterior} -> ${fluxoStatus}. ` +
            `Permitidos: ${allowed.join(', ') || 'nenhum'}`,
        );
      }

      let emailDetails = {
        ...(proposta.emailDetails || {}),
        fluxoStatus,
      } as Record<string, unknown>;
      emailDetails.aprovacaoInterna = this.calcularAprovacaoInterna(
        proposta.descontoGlobal,
        proposta.produtos,
        this.parseAprovacaoInterna(emailDetails),
      );
      const aprovacaoInterna = this.parseAprovacaoInterna(emailDetails);

      if (
        fluxoStatus === 'aprovada' &&
        aprovacaoInterna?.obrigatoria &&
        aprovacaoInterna.status !== 'aprovada'
      ) {
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
        throw new Error(
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
        metadata: metadata || undefined,
      });

      proposta.emailDetails = emailDetails as any;

      const propostaAtualizada = await this.savePropostaWithStatusFallback(proposta, fluxoStatus);
      this.logger.log(`Status da proposta ${propostaId} atualizado para: ${fluxoStatus}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao atualizar status', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Atualiza o status de uma proposta com validação automática
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
        throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
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
      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);

      if (legacySchema) {
        const proposta = await this.obterProposta(propostaId, empresaId);
        if (!proposta) {
          throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
        }

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

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = this.mapFlowStatusToDatabaseStatus('visualizada', false) as any;
      proposta.portalAccess = {
        accessedAt: new Date().toISOString(),
        ip,
        userAgent,
      };
      proposta.emailDetails = this.appendPortalEvento(
        {
          ...(proposta.emailDetails || {}),
          fluxoStatus: 'visualizada',
        },
        'visualizacao_portal',
        {
          origem: 'portal',
          status: 'visualizada',
          detalhes: 'Proposta visualizada no portal do cliente',
          ip,
          userAgent,
        },
      ) as any;

      const propostaAtualizada = await this.savePropostaWithStatusFallback(proposta, 'visualizada');
      this.logger.log(`👁️ Proposta ${propostaId} marcada como visualizada`);

      return this.entityToInterface(propostaAtualizada);
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
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

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

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao registrar envio de email', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Marca proposta como enviada (usado pela sincronização automática)
   */
  async marcarComoEnviada(
    propostaIdOuNumero: string,
    emailCliente: string,
    linkPortal?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      this.logger.debug(`Marcando proposta ${propostaIdOuNumero} como enviada automaticamente`);

      // Tentar encontrar por ID (UUID) primeiro, depois por número
      let proposta = await this.propostaRepository
        .findOne({
          where: empresaId
            ? { id: propostaIdOuNumero, empresaId }
            : { id: propostaIdOuNumero },
        })
        .catch(() => null); // Capturar erro de UUID inválido

      // Se não encontrou por ID, tentar por número
      if (!proposta) {
        proposta = await this.propostaRepository.findOne({
          where: empresaId
            ? { numero: propostaIdOuNumero, empresaId }
            : { numero: propostaIdOuNumero },
        });
      }

      if (!proposta) {
        throw new Error(`Proposta com ID/Número ${propostaIdOuNumero} não encontrada`);
      }

      // Atualizar status para enviada
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
      this.logger.log(`✅ Proposta ${proposta.numero} marcada como enviada automaticamente`);

      return this.entityToInterface(propostaAtualizada);
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
      throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
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
      throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
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
      throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
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
    aprovacaoInterna?: PropostaAprovacaoInterna;
    versoes: PropostaVersao[];
    log: Array<{
      data: string;
      evento: string;
      detalhes: string;
      ip?: string;
    }>;
  }> {
    const proposta = await this.obterProposta(propostaId, empresaId);
    if (!proposta) {
      throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
    }

    const historico = (proposta.historicoEventos || proposta.emailDetails?.historicoEventos || [])
      .map((evento) => this.parseHistoryEvent(evento))
      .filter((evento): evento is PropostaHistoricoEvento => Boolean(evento))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

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
      aprovacaoInterna: proposta.aprovacaoInterna,
      versoes: versoesEnriquecidas,
      log: historico.map((evento) => ({
        data: evento.timestamp,
        evento: evento.evento,
        detalhes: evento.detalhes || '',
        ip: evento.ip,
      })),
    };
  }

  async obterAprovacaoInterna(
    propostaId: string,
    empresaId?: string,
  ): Promise<PropostaAprovacaoInterna> {
    const proposta = await this.obterProposta(propostaId, empresaId);
    if (!proposta) {
      throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
    }

    if (proposta.aprovacaoInterna) {
      return proposta.aprovacaoInterna;
    }

    return this.calcularAprovacaoInterna(proposta.descontoGlobal, proposta.produtos, null);
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
      throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
    }

    const aprovacaoBase = this.calcularAprovacaoInterna(
      proposta.descontoGlobal,
      proposta.produtos,
      this.parseAprovacaoInterna(proposta.emailDetails),
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
      throw new Error(`Proposta com ID ${propostaId} nao encontrada`);
    }

    const aprovacaoBase = this.calcularAprovacaoInterna(
      proposta.descontoGlobal,
      proposta.produtos,
      this.parseAprovacaoInterna(proposta.emailDetails),
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

      (proposta.produtos || []).forEach((produto) => {
        const nomeProduto = String((produto as Record<string, unknown>)?.nome || 'Produto nao informado');
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
      });

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
    };
  }
}

