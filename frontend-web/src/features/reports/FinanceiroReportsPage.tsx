import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import faturamentoService, { type Fatura, StatusFatura } from '../../services/faturamentoService';

type FinanceiroStatusFilter = 'all' | StatusFatura;

const formatCurrency = (value: number): string =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatNumber = (value: number): string =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDefaultRange = (): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return {
    startDate: toDateInput(start),
    endDate: toDateInput(end),
  };
};

const safeDateLabel = (value?: string): string => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
};

const statusLabel: Record<StatusFatura, string> = {
  [StatusFatura.PENDENTE]: 'Pendente',
  [StatusFatura.ENVIADA]: 'Enviada',
  [StatusFatura.PAGA]: 'Paga',
  [StatusFatura.VENCIDA]: 'Vencida',
  [StatusFatura.CANCELADA]: 'Cancelada',
  [StatusFatura.PARCIALMENTE_PAGA]: 'Parcialmente paga',
};

const resolveClienteName = (fatura: Fatura): string => {
  const clienteRaw = (fatura.cliente || {}) as Record<string, unknown>;
  const name =
    typeof clienteRaw.nome === 'string'
      ? clienteRaw.nome
      : typeof clienteRaw.name === 'string'
        ? clienteRaw.name
        : '';
  return name.trim() || '-';
};

const FinanceiroReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const defaults = useMemo(() => buildDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [statusFilter, setStatusFilter] = useState<FinanceiroStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalFaturas: number;
    valorTotal: number;
    valorRecebido: number;
    valorEmAberto: number;
    faturasPagas: number;
    faturasPendentes: number;
    faturasVencidas: number;
  } | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);

  const loadData = useCallback(async () => {
    setWarning(null);
    try {
      const [summaryResult, faturasResult] = await Promise.all([
        faturamentoService.obterEstatisticas({
          inicio: startDate,
          fim: endDate,
        }),
        faturamentoService.listarFaturasPaginadas({
          dataInicial: startDate,
          dataFinal: endDate,
          page: 1,
          pageSize: 300,
          sortBy: 'dataVencimento',
          sortOrder: 'ASC',
        }),
      ]);

      setSummary(summaryResult);
      setFaturas(faturasResult.data || []);
    } catch {
      setSummary(null);
      setFaturas([]);
      setWarning('Nao foi possivel carregar os dados financeiros para o periodo informado.');
    }
  }, [endDate, startDate]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    void bootstrap();
  }, [loadData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...faturas]
      .filter((invoice) => (statusFilter === 'all' ? true : invoice.status === statusFilter))
      .filter((invoice) => {
        if (!normalizedSearch) return true;
        const source = `${invoice.numero} ${resolveClienteName(invoice)} ${invoice.observacoes || ''}`.toLowerCase();
        return source.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const first = new Date(a.dataVencimento).getTime();
        const second = new Date(b.dataVencimento).getTime();
        return first - second;
      });
  }, [faturas, search, statusFilter]);

  const statusTotals = useMemo(() => {
    return filteredInvoices.reduce<Record<string, number>>((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});
  }, [filteredInvoices]);

  const overdueAmount = useMemo(() => {
    const now = Date.now();
    return filteredInvoices.reduce((acc, invoice) => {
      const due = new Date(invoice.dataVencimento).getTime();
      const isOpenStatus =
        invoice.status === StatusFatura.PENDENTE ||
        invoice.status === StatusFatura.ENVIADA ||
        invoice.status === StatusFatura.PARCIALMENTE_PAGA ||
        invoice.status === StatusFatura.VENCIDA;

      if (isOpenStatus && Number.isFinite(due) && due < now) {
        return acc + Number(invoice.valorTotal || 0);
      }
      return acc;
    }, 0);
  }, [filteredInvoices]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Relatorio financeiro
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              Fluxo de faturamento e cobranca
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Visao operacional de faturas, recebimento, aberto e risco de atraso.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/relatorios')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para relatorios
            </button>
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Fim</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FinanceiroStatusFilter)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todos</option>
              <option value={StatusFatura.PENDENTE}>Pendente</option>
              <option value={StatusFatura.ENVIADA}>Enviada</option>
              <option value={StatusFatura.PAGA}>Paga</option>
              <option value={StatusFatura.VENCIDA}>Vencida</option>
              <option value={StatusFatura.PARCIALMENTE_PAGA}>Parcialmente paga</option>
              <option value={StatusFatura.CANCELADA}>Cancelada</option>
            </select>
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Busca</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Numero, cliente ou observacao"
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
        </div>

        {warning ? (
          <div className="mt-3 rounded-xl border border-[#F4D7A5] bg-[#FFF8E8] px-3 py-2 text-sm text-[#8D5A12]">
            {warning}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-6">
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Valor recebido</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatCurrency(Number(summary?.valorRecebido || 0))}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Em aberto</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatCurrency(Number(summary?.valorEmAberto || 0))}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Atrasado no filtro</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">{formatCurrency(overdueAmount)}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Total de faturas</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(summary?.totalFaturas || filteredInvoices.length)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">No periodo selecionado</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Pagas</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(summary?.faturasPagas || statusTotals[StatusFatura.PAGA] || 0)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            Pendentes: {formatNumber(summary?.faturasPendentes || 0)}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Vencidas</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(summary?.faturasVencidas || statusTotals[StatusFatura.VENCIDA] || 0)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            Valor total: {formatCurrency(Number(summary?.valorTotal || 0))}
          </p>
        </article>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1C8A8D]" />
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Faturas do recorte
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/financeiro/faturamento')}
              className="rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Abrir faturamento
            </button>
            <button
              type="button"
              onClick={() => navigate('/financeiro/contas-pagar')}
              className="rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Abrir contas a pagar
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Numero</th>
                <th className="px-2 py-2 font-semibold">Cliente</th>
                <th className="px-2 py-2 font-semibold">Emissao</th>
                <th className="px-2 py-2 font-semibold">Vencimento</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-[#E7EFF2] text-[#244556]">
                    <td className="px-2 py-2 font-medium text-[#15384A]">{invoice.numero}</td>
                    <td className="px-2 py-2">{resolveClienteName(invoice)}</td>
                    <td className="px-2 py-2">{safeDateLabel(invoice.dataEmissao)}</td>
                    <td className="px-2 py-2">{safeDateLabel(invoice.dataVencimento)}</td>
                    <td className="px-2 py-2">{statusLabel[invoice.status]}</td>
                    <td className="px-2 py-2">{formatCurrency(Number(invoice.valorTotal || 0))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-5 text-[#6B8591]">
                    Nenhuma fatura encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FinanceiroReportsPage;
