import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanosService } from './planos.service';
import { AssinaturasService } from './assinaturas.service';
import { Fatura, StatusFatura } from '../faturamento/entities/fatura.entity';
import { Pagamento, StatusPagamento } from '../faturamento/entities/pagamento.entity';
import { BillingEvent } from '../faturamento/entities/billing-event.entity';
import { GatewayProvider } from '../pagamentos/entities/configuracao-gateway.entity';
import { getEnabledGatewayProvidersFromEnv } from '../pagamentos/services/gateway-provider-support.util';

const HISTORY_LIMIT_DEFAULT = 20;
const HISTORY_LIMIT_MAX = 100;
const HISTORY_PAGE_DEFAULT = 1;

type BillingHistoryType = 'all' | 'faturas' | 'pagamentos';
type BillingHistoryQueryInput = {
  limit?: string | number;
  page?: string | number;
  tipo?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
};

type SubscriptionPaymentHistoryRow = {
  id: number;
  payment_id: string | null;
  payment_status: string | null;
  payment_action: string | null;
  occurred_at: string | Date | null;
  created_at: string | Date | null;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const clampHistoryLimit = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number(value) : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return HISTORY_LIMIT_DEFAULT;
  }
  return Math.min(Math.floor(parsed), HISTORY_LIMIT_MAX);
};

const clampHistoryPage = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number(value) : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return HISTORY_PAGE_DEFAULT;
  }
  return Math.floor(parsed);
};

const normalizeHistoryType = (value: unknown): BillingHistoryType => {
  const parsed = String(value || '')
    .trim()
    .toLowerCase();

  if (parsed === 'faturas' || parsed === 'pagamentos') {
    return parsed;
  }

  return 'all';
};

const parseDateForRange = (value: unknown, endOfDay: boolean): Date | null => {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
};

const mapMercadoPagoStatusToInternal = (statusRaw: unknown): string => {
  const status = String(statusRaw || '')
    .trim()
    .toLowerCase();

  if (!status) return StatusPagamento.PENDENTE;
  if (status === 'approved') return StatusPagamento.APROVADO;
  if (status === 'pending' || status === 'in_process') return StatusPagamento.PENDENTE;
  if (status === 'authorized') return StatusPagamento.PROCESSANDO;
  if (status === 'rejected') return StatusPagamento.REJEITADO;
  if (status === 'cancelled' || status === 'cancelled_by_user') return StatusPagamento.CANCELADO;
  if (status === 'refunded' || status === 'charged_back') return StatusPagamento.ESTORNADO;

  return status;
};

const mapInternalStatusToMercadoPago = (statusRaw: string | null): string | null => {
  const status = String(statusRaw || '')
    .trim()
    .toLowerCase();

  if (!status) return null;
  if (status === StatusPagamento.APROVADO) return 'approved';
  if (status === StatusPagamento.PENDENTE || status === StatusPagamento.PROCESSANDO)
    return 'pending';
  if (status === StatusPagamento.REJEITADO) return 'rejected';
  if (status === StatusPagamento.CANCELADO) return 'cancelled';
  if (status === StatusPagamento.ESTORNADO) return 'refunded';

  return status;
};

@Injectable()
export class BillingSelfServiceService {
  constructor(
    private readonly assinaturasService: AssinaturasService,
    private readonly planosService: PlanosService,
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(Pagamento)
    private readonly pagamentoRepository: Repository<Pagamento>,
    @InjectRepository(BillingEvent)
    private readonly billingEventRepository: Repository<BillingEvent>,
  ) {}

  async getOverview(empresaId: string) {
    const [assinatura, planos, resumoFinanceiro, policy] = await Promise.all([
      this.assinaturasService.buscarPorEmpresa(empresaId),
      this.planosService.listarTodos(),
      this.getFinancialSummary(empresaId),
      this.assinaturasService.obterPoliticaTenant(empresaId),
    ]);

    const limites = assinatura ? await this.assinaturasService.verificarLimites(empresaId) : null;
    const enabledGatewayProviders = Array.from(getEnabledGatewayProvidersFromEnv()).sort();

    return {
      assinatura,
      limites,
      planos,
      resumoFinanceiro,
      capabilities: {
        isPlatformOwner: policy.isPlatformOwner,
        billingExempt: policy.billingExempt,
        monitorOnlyLimits: policy.monitorOnlyLimits,
        allowCheckout: policy.allowCheckout,
        allowPlanMutation: policy.allowPlanMutation,
        enforceLifecycleTransitions: policy.enforceLifecycleTransitions,
        enabledGatewayProviders,
        checkoutEnabled: policy.allowCheckout && enabledGatewayProviders.length > 0,
      },
    };
  }

  async getHistory(empresaId: string, queryInput?: string | BillingHistoryQueryInput) {
    const parsedInput =
      typeof queryInput === 'string' ? ({ limit: queryInput } as BillingHistoryQueryInput) : queryInput || {};

    const limit = clampHistoryLimit(parsedInput.limit);
    const page = clampHistoryPage(parsedInput.page);
    const tipo = normalizeHistoryType(parsedInput.tipo);
    const status = String(parsedInput.status || '')
      .trim()
      .toLowerCase();
    const statusFilter = status && status !== 'todos' && status !== 'all' ? status : null;
    const dataInicio = parseDateForRange(parsedInput.dataInicio, false);
    const dataFim = parseDateForRange(parsedInput.dataFim, true);
    const offset = (page - 1) * limit;

    const shouldFetchFaturas = tipo !== 'pagamentos';
    const shouldFetchPagamentos = tipo !== 'faturas';
    const assinatura = await this.assinaturasService.buscarPorEmpresa(empresaId);
    const assinaturaId = String(assinatura?.id || '').trim();

    if (!assinaturaId) {
      return {
        faturas: [],
        pagamentos: [],
        limit,
        page,
        tipo,
        status: statusFilter,
        dataInicio: dataInicio ? dataInicio.toISOString() : null,
        dataFim: dataFim ? dataFim.toISOString() : null,
        totalFaturas: 0,
        totalPagamentos: 0,
        hasNextFaturas: false,
        hasNextPagamentos: false,
      };
    }

    const [faturasWithCount, pagamentosWithCount] = await Promise.all([
      shouldFetchFaturas
        ? this.fetchSubscriptionInvoicesHistory({
            empresaId,
            assinaturaId,
            limit,
            offset,
            statusFilter,
            dataInicio,
            dataFim,
          })
        : Promise.resolve([[], 0] as [Fatura[], number]),
      shouldFetchPagamentos
        ? this.fetchSubscriptionPaymentsHistory({
            empresaId,
            assinaturaId,
            limit,
            offset,
            statusFilter,
            dataInicio,
            dataFim,
          })
        : Promise.resolve([[], 0] as [SubscriptionPaymentHistoryRow[], number]),
    ]);

    const [faturas, totalFaturas] = faturasWithCount;
    const [pagamentosEventos, totalPagamentos] = pagamentosWithCount;
    const hasNextFaturas = shouldFetchFaturas ? page * limit < totalFaturas : false;
    const hasNextPagamentos = shouldFetchPagamentos ? page * limit < totalPagamentos : false;

    return {
      faturas: faturas.map((item) => ({
        id: item.id,
        numero: item.numero,
        status: item.status,
        valorTotal: toNumber(item.valorTotal),
        valorPago: toNumber(item.valorPago),
        valorRestante: Math.max(0, toNumber(item.valorTotal) - toNumber(item.valorPago)),
        dataEmissao: item.dataEmissao,
        dataVencimento: item.dataVencimento,
        createdAt: item.createdAt,
      })),
      pagamentos: pagamentosEventos.map((item) => {
        const statusNormalizado = mapMercadoPagoStatusToInternal(item.payment_status);
        const createdAt = item.occurred_at || item.created_at || null;
        return {
          id: toNumber(item.id),
          faturaId: 0,
          transacaoId: String(item.payment_id || `mp-${item.id}`),
          status: statusNormalizado,
          tipo: String(item.payment_action || 'pagamento'),
          valor: 0,
          valorLiquido: 0,
          metodoPagamento: 'checkout_assinatura',
          gateway: GatewayProvider.MERCADO_PAGO,
          dataAprovacao: statusNormalizado === StatusPagamento.APROVADO ? createdAt : null,
          createdAt,
        };
      }),
      limit,
      page,
      tipo,
      status: statusFilter,
      dataInicio: dataInicio ? dataInicio.toISOString() : null,
      dataFim: dataFim ? dataFim.toISOString() : null,
      totalFaturas,
      totalPagamentos,
      hasNextFaturas,
      hasNextPagamentos,
    };
  }

  private async fetchSubscriptionInvoicesHistory(params: {
    empresaId: string;
    assinaturaId: string;
    limit: number;
    offset: number;
    statusFilter: string | null;
    dataInicio: Date | null;
    dataFim: Date | null;
  }): Promise<[Fatura[], number]> {
    const query = this.faturaRepository
      .createQueryBuilder('fatura')
      .where('fatura.empresa_id = :empresaId', { empresaId: params.empresaId })
      .andWhere(
        `(
          (fatura.metadados->>'assinaturaId') = :assinaturaId
          OR lower(coalesce(fatura.metadados->>'origem', '')) = 'assinatura'
          OR lower(coalesce(fatura.metadados->>'contexto', '')) = 'assinatura'
        )`,
        { assinaturaId: params.assinaturaId },
      );

    if (params.statusFilter) {
      query.andWhere('lower(fatura.status) = :statusFilter', {
        statusFilter: params.statusFilter,
      });
    }

    if (params.dataInicio) {
      query.andWhere(`fatura."dataEmissao" >= :dataInicio`, { dataInicio: params.dataInicio });
    }

    if (params.dataFim) {
      query.andWhere(`fatura."dataEmissao" <= :dataFim`, { dataFim: params.dataFim });
    }

    return query
      .orderBy(`fatura."createdAt"`, 'DESC')
      .take(params.limit)
      .skip(params.offset)
      .getManyAndCount();
  }

  private async fetchSubscriptionPaymentsHistory(params: {
    empresaId: string;
    assinaturaId: string;
    limit: number;
    offset: number;
    statusFilter: string | null;
    dataInicio: Date | null;
    dataFim: Date | null;
  }): Promise<[SubscriptionPaymentHistoryRow[], number]> {
    const paymentStatusFilter = mapInternalStatusToMercadoPago(params.statusFilter);
    const whereClauses: string[] = [
      'event.empresa_id = $1',
      "event.aggregate_type = 'mercadopago.payment.webhook'",
      "COALESCE(event.payload->>'assinaturaId', '') = $2",
      "COALESCE(event.payload->>'paymentId', '') <> ''",
    ];
    const paramsCount: unknown[] = [params.empresaId, params.assinaturaId];

    if (paymentStatusFilter) {
      whereClauses.push(`LOWER(COALESCE(event.payload->>'paymentStatus', '')) = $${paramsCount.length + 1}`);
      paramsCount.push(paymentStatusFilter);
    }

    if (params.dataInicio) {
      whereClauses.push(`event.occurred_at >= $${paramsCount.length + 1}`);
      paramsCount.push(params.dataInicio.toISOString());
    }

    if (params.dataFim) {
      whereClauses.push(`event.occurred_at <= $${paramsCount.length + 1}`);
      paramsCount.push(params.dataFim.toISOString());
    }

    const whereClause = whereClauses.join(' AND ');

    const totalRows = await this.billingEventRepository.query(
      `
        SELECT COUNT(DISTINCT (event.payload->>'paymentId'))::int AS total
        FROM billing_events event
        WHERE ${whereClause}
      `,
      paramsCount,
    );
    const total = toNumber(totalRows?.[0]?.total, 0);

    const listParams: unknown[] = [...paramsCount, params.limit, params.offset];
    const limitParam = paramsCount.length + 1;
    const offsetParam = paramsCount.length + 2;
    const rows = await this.billingEventRepository.query(
      `
        WITH latest AS (
          SELECT DISTINCT ON (event.payload->>'paymentId')
            event.id,
            event.payload->>'paymentId' AS payment_id,
            event.payload->>'paymentStatus' AS payment_status,
            event.payload->>'action' AS payment_action,
            event.occurred_at,
            event.created_at
          FROM billing_events event
          WHERE ${whereClause}
          ORDER BY event.payload->>'paymentId', event.occurred_at DESC
        )
        SELECT *
        FROM latest
        ORDER BY occurred_at DESC
        LIMIT $${limitParam}
        OFFSET $${offsetParam}
      `,
      listParams,
    );

    return [rows as SubscriptionPaymentHistoryRow[], total];
  }

  private async getFinancialSummary(empresaId: string) {
    const invoiceStatuses = [
      StatusFatura.PENDENTE,
      StatusFatura.ENVIADA,
      StatusFatura.VENCIDA,
      StatusFatura.PARCIALMENTE_PAGA,
    ];

    const [totals, open, lastPayment] = await Promise.all([
      this.faturaRepository
        .createQueryBuilder('fatura')
        .select('COUNT(*)', 'totalFaturas')
        .addSelect(
          `COALESCE(SUM(CASE WHEN fatura.status != :cancelada THEN fatura."valorTotal" ELSE 0 END), 0)`,
          'valorFaturadoTotal',
        )
        .setParameter('cancelada', StatusFatura.CANCELADA)
        .where('fatura.empresa_id = :empresaId', { empresaId })
        .getRawOne<{ totalFaturas: string; valorFaturadoTotal: string }>(),
      this.faturaRepository
        .createQueryBuilder('fatura')
        .select(
          `COALESCE(SUM(GREATEST(fatura."valorTotal" - fatura."valorPago", 0)), 0)`,
          'valorEmAberto',
        )
        .where('fatura.empresa_id = :empresaId', { empresaId })
        .andWhere('fatura.status IN (:...statuses)', { statuses: invoiceStatuses })
        .getRawOne<{ valorEmAberto: string }>(),
      this.pagamentoRepository
        .createQueryBuilder('pagamento')
        .select('COUNT(*)', 'totalPagamentos')
        .addSelect(
          `COALESCE(SUM(CASE WHEN pagamento.status = :statusAprovado THEN pagamento.valor ELSE 0 END), 0)`,
          'valorRecebidoTotal',
        )
        .addSelect(
          `MAX(CASE WHEN pagamento.status = :statusAprovado THEN pagamento."createdAt" ELSE NULL END)`,
          'ultimoPagamentoEm',
        )
        .setParameter('statusAprovado', StatusPagamento.APROVADO)
        .where('pagamento.empresa_id = :empresaId', { empresaId })
        .getRawOne<{
          totalPagamentos: string;
          valorRecebidoTotal: string;
          ultimoPagamentoEm: string | null;
        }>(),
    ]);

    return {
      totalFaturas: toNumber(totals?.totalFaturas),
      totalPagamentos: toNumber(lastPayment?.totalPagamentos),
      valorFaturadoTotal: toNumber(totals?.valorFaturadoTotal),
      valorRecebidoTotal: toNumber(lastPayment?.valorRecebidoTotal),
      valorEmAberto: toNumber(open?.valorEmAberto),
      ultimoPagamentoEm: lastPayment?.ultimoPagamentoEm || null,
      hasGatewayEnabled: Array.from(getEnabledGatewayProvidersFromEnv()).length > 0,
      gatewaysEnabled: Array.from(getEnabledGatewayProvidersFromEnv()) as GatewayProvider[],
    };
  }
}
