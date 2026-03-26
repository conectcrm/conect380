import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { PlanosService } from './planos.service';
import { AssinaturasService } from './assinaturas.service';
import { Fatura, StatusFatura } from '../faturamento/entities/fatura.entity';
import { Pagamento, StatusPagamento } from '../faturamento/entities/pagamento.entity';
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

@Injectable()
export class BillingSelfServiceService {
  constructor(
    private readonly assinaturasService: AssinaturasService,
    private readonly planosService: PlanosService,
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(Pagamento)
    private readonly pagamentoRepository: Repository<Pagamento>,
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

    const faturaWhere: FindOptionsWhere<Fatura> = { empresaId };
    const pagamentoWhere: FindOptionsWhere<Pagamento> = { empresaId };

    if (statusFilter) {
      (faturaWhere as Record<string, unknown>).status = statusFilter;
      (pagamentoWhere as Record<string, unknown>).status = statusFilter;
    }

    if (dataInicio && dataFim) {
      (faturaWhere as Record<string, unknown>).dataEmissao = Between(dataInicio, dataFim);
      (pagamentoWhere as Record<string, unknown>).createdAt = Between(dataInicio, dataFim);
    } else if (dataInicio) {
      const maxDate = new Date(8640000000000000);
      (faturaWhere as Record<string, unknown>).dataEmissao = Between(dataInicio, maxDate);
      (pagamentoWhere as Record<string, unknown>).createdAt = Between(dataInicio, maxDate);
    } else if (dataFim) {
      const minDate = new Date(-8640000000000000);
      (faturaWhere as Record<string, unknown>).dataEmissao = Between(minDate, dataFim);
      (pagamentoWhere as Record<string, unknown>).createdAt = Between(minDate, dataFim);
    }

    const [faturasWithCount, pagamentosWithCount] = await Promise.all([
      shouldFetchFaturas
        ? this.faturaRepository.findAndCount({
            where: faturaWhere,
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
          })
        : Promise.resolve([[], 0] as [Fatura[], number]),
      shouldFetchPagamentos
        ? this.pagamentoRepository.findAndCount({
            where: pagamentoWhere,
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
          })
        : Promise.resolve([[], 0] as [Pagamento[], number]),
    ]);

    const [faturas, totalFaturas] = faturasWithCount;
    const [pagamentos, totalPagamentos] = pagamentosWithCount;
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
      pagamentos: pagamentos.map((item) => ({
        id: item.id,
        faturaId: item.faturaId,
        transacaoId: item.transacaoId,
        status: item.status,
        tipo: item.tipo,
        valor: toNumber(item.valor),
        valorLiquido: toNumber(item.valorLiquido),
        metodoPagamento: item.metodoPagamento,
        gateway: item.gateway,
        dataAprovacao: item.dataAprovacao,
        createdAt: item.createdAt,
      })),
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
