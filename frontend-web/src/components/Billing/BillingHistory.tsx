import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useSubscription } from '../../hooks/useSubscription';
import { formatCurrency } from '../../utils/formatters';
import { CalendarDays, Filter, Receipt, RefreshCw, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type BillingHistoryType = 'all' | 'faturas' | 'pagamentos';

type BillingHistoryFilters = {
  tipo: BillingHistoryType;
  status: string;
  dataInicio: string;
  dataFim: string;
  limit: number;
};

type BillingHistoryEntry = {
  id: string;
  faturaId: number | null;
  tipo: 'fatura' | 'pagamento';
  titulo: string;
  status: string;
  valorPrincipal: number;
  valorSecundario?: number;
  data: string;
  subtitle: string;
};

const DEFAULT_FILTERS: BillingHistoryFilters = {
  tipo: 'all',
  status: '',
  dataInicio: '',
  dataFim: '',
  limit: 20,
};

const FATURA_STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'paga', label: 'Paga' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'parcialmente_paga', label: 'Parcialmente paga' },
];

const PAGAMENTO_STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'processando', label: 'Processando' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'estornado', label: 'Estornado' },
];

const toLocalDate = (value?: string | null) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }
  return parsed.toLocaleDateString('pt-BR');
};

const toLocalDateTime = (value?: string | null) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }
  return parsed.toLocaleString('pt-BR');
};

const toStatusLabel = (rawStatus: string) => {
  const normalized = String(rawStatus || '')
    .trim()
    .toLowerCase();

  if (normalized === 'parcialmente_paga') return 'Parcialmente paga';
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Pendente';
};

const toStatusClass = (rawStatus: string) => {
  const normalized = String(rawStatus || '')
    .trim()
    .toLowerCase();

  if (normalized === 'aprovado' || normalized === 'paga') return 'bg-green-100 text-green-700';
  if (normalized === 'vencida' || normalized === 'rejeitado') return 'bg-red-100 text-red-700';
  if (normalized === 'cancelado' || normalized === 'cancelada') return 'bg-gray-100 text-gray-700';
  if (normalized === 'processando' || normalized === 'enviada') return 'bg-blue-100 text-blue-700';
  if (normalized === 'estornado') return 'bg-orange-100 text-orange-700';
  return 'bg-yellow-100 text-yellow-700';
};

export const BillingHistory: React.FC = () => {
  const navigate = useNavigate();
  const { billingHistorico, billingHistoricoLoading, buscarHistoricoBilling, isOwnerTenant } =
    useSubscription();
  const [filtersDraft, setFiltersDraft] = useState<BillingHistoryFilters>(DEFAULT_FILTERS);
  const [filtersApplied, setFiltersApplied] = useState<BillingHistoryFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isOwnerTenant) {
      return;
    }

    void buscarHistoricoBilling({
      tipo: filtersApplied.tipo,
      status: filtersApplied.status || null,
      dataInicio: filtersApplied.dataInicio || null,
      dataFim: filtersApplied.dataFim || null,
      page,
      limit: filtersApplied.limit,
    });
  }, [buscarHistoricoBilling, filtersApplied, isOwnerTenant, page]);

  const statusOptions = useMemo(() => {
    if (filtersDraft.tipo === 'faturas') {
      return FATURA_STATUS_OPTIONS;
    }
    if (filtersDraft.tipo === 'pagamentos') {
      return PAGAMENTO_STATUS_OPTIONS;
    }

    const map = new Map<string, string>();
    [...FATURA_STATUS_OPTIONS, ...PAGAMENTO_STATUS_OPTIONS].forEach((option) => {
      map.set(option.value, option.label);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [filtersDraft.tipo]);

  const entries = useMemo(() => {
    if (!billingHistorico) {
      return [] as BillingHistoryEntry[];
    }

    const merged: BillingHistoryEntry[] = [];
    const includeFaturas = filtersApplied.tipo !== 'pagamentos';
    const includePagamentos = filtersApplied.tipo !== 'faturas';

    if (includeFaturas) {
      billingHistorico.faturas.forEach((fatura) => {
        merged.push({
          id: `fatura-${fatura.id}`,
          faturaId: fatura.id,
          tipo: 'fatura',
          titulo: fatura.numero || `Fatura #${fatura.id}`,
          status: fatura.status,
          valorPrincipal: fatura.valorTotal,
          valorSecundario: fatura.valorRestante,
          data: fatura.createdAt || fatura.dataEmissao,
          subtitle: `Emissao ${toLocalDate(fatura.dataEmissao)} - Vencimento ${toLocalDate(fatura.dataVencimento)}`,
        });
      });
    }

    if (includePagamentos) {
      billingHistorico.pagamentos.forEach((pagamento) => {
        merged.push({
          id: `pagamento-${pagamento.id}`,
          faturaId: pagamento.faturaId > 0 ? pagamento.faturaId : null,
          tipo: 'pagamento',
          titulo: pagamento.transacaoId || `Pagamento #${pagamento.id}`,
          status: pagamento.status,
          valorPrincipal: pagamento.valor,
          valorSecundario: pagamento.valorLiquido,
          data: pagamento.dataAprovacao || pagamento.createdAt,
          subtitle: `${pagamento.metodoPagamento || 'Metodo nao informado'} - ${pagamento.gateway || 'gateway'}`,
        });
      });
    }

    return merged.sort((left, right) => {
      const leftDate = new Date(left.data).getTime();
      const rightDate = new Date(right.data).getTime();
      return rightDate - leftDate;
    });
  }, [billingHistorico, filtersApplied.tipo]);

  const totalLabel = useMemo(() => {
    if (!billingHistorico) return '0';
    if (filtersApplied.tipo === 'faturas') return String(billingHistorico.totalFaturas || 0);
    if (filtersApplied.tipo === 'pagamentos') return String(billingHistorico.totalPagamentos || 0);
    return String((billingHistorico.totalFaturas || 0) + (billingHistorico.totalPagamentos || 0));
  }, [billingHistorico, filtersApplied.tipo]);

  const hasNext = useMemo(() => {
    if (!billingHistorico) return false;
    if (filtersApplied.tipo === 'faturas') return billingHistorico.hasNextFaturas;
    if (filtersApplied.tipo === 'pagamentos') return billingHistorico.hasNextPagamentos;
    return billingHistorico.hasNextFaturas || billingHistorico.hasNextPagamentos;
  }, [billingHistorico, filtersApplied.tipo]);

  const applyFilters = () => {
    setPage(1);
    setFiltersApplied(filtersDraft);
  };

  const clearFilters = () => {
    setPage(1);
    setFiltersDraft(DEFAULT_FILTERS);
    setFiltersApplied(DEFAULT_FILTERS);
  };

  if (isOwnerTenant) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-[#5A7582]">
            Historico de cobranca nao se aplica ao tenant proprietario.
          </p>
        </CardContent>
      </Card>
    );
  }

  const openFinanceiroDetail = (entry: BillingHistoryEntry) => {
    if (entry.faturaId && entry.faturaId > 0) {
      navigate(`/faturamento?faturaId=${entry.faturaId}`);
      return;
    }
    navigate('/faturamento');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-[#159A9C]" />
            Filtros de historico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1 text-xs font-medium text-[#385A6A]">
              Tipo
              <select
                value={filtersDraft.tipo}
                onChange={(event) =>
                  setFiltersDraft((current) => ({ ...current, tipo: event.target.value as BillingHistoryType, status: '' }))
                }
                className="h-10 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455]"
              >
                <option value="all">Todos</option>
                <option value="faturas">Faturas</option>
                <option value="pagamentos">Pagamentos</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[#385A6A]">
              Status
              <select
                value={filtersDraft.status}
                onChange={(event) =>
                  setFiltersDraft((current) => ({ ...current, status: event.target.value }))
                }
                className="h-10 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455]"
              >
                <option value="">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[#385A6A]">
              Data inicio
              <input
                type="date"
                value={filtersDraft.dataInicio}
                onChange={(event) =>
                  setFiltersDraft((current) => ({ ...current, dataInicio: event.target.value }))
                }
                className="h-10 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455]"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[#385A6A]">
              Data fim
              <input
                type="date"
                value={filtersDraft.dataFim}
                onChange={(event) =>
                  setFiltersDraft((current) => ({ ...current, dataFim: event.target.value }))
                }
                className="h-10 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455]"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-[#385A6A]">
              Itens por pagina
              <select
                value={filtersDraft.limit}
                onChange={(event) =>
                  setFiltersDraft((current) => ({ ...current, limit: Number(event.target.value) || 20 }))
                }
                className="h-10 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={applyFilters}
              className="bg-[#159A9C] hover:bg-[#0F7B7D]"
              disabled={billingHistoricoLoading}
            >
              <Filter className="mr-2 h-4 w-4" />
              Aplicar filtros
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={billingHistoricoLoading}
              className="border-[#D4E2E7] text-[#244455]"
            >
              Limpar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void buscarHistoricoBilling({
                  tipo: filtersApplied.tipo,
                  status: filtersApplied.status || null,
                  dataInicio: filtersApplied.dataInicio || null,
                  dataFim: filtersApplied.dataFim || null,
                  page,
                  limit: filtersApplied.limit,
                })
              }
              disabled={billingHistoricoLoading}
              className="border-[#D4E2E7] text-[#244455]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${billingHistoricoLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#159A9C]" />
              Historico completo
            </span>
            <span className="text-xs font-medium text-[#5A7582]">{totalLabel} registro(s)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingHistoricoLoading ? (
            <p className="text-sm text-[#5A7582]">Carregando historico...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[#5A7582]">Nenhum registro encontrado para os filtros selecionados.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-[#D4E2E7] bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.tipo === 'fatura' ? (
                          <Receipt className="h-4 w-4 text-[#159A9C]" />
                        ) : (
                          <Wallet className="h-4 w-4 text-[#159A9C]" />
                        )}
                        <p className="truncate text-sm font-semibold text-[#002333]">{entry.titulo}</p>
                        <span className="rounded-full bg-[#EEF5F8] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#385A6A]">
                          {entry.tipo}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5A7582]">{entry.subtitle}</p>
                    </div>

                    <div className="text-right">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${toStatusClass(entry.status)}`}>
                        {toStatusLabel(entry.status)}
                      </span>
                      <p className="mt-1 text-xs text-[#5A7582]">{toLocalDateTime(entry.data)}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#385A6A]">
                    <span>Valor: {formatCurrency(entry.valorPrincipal)}</span>
                    {entry.tipo === 'fatura' && (
                      <span>Em aberto: {formatCurrency(entry.valorSecundario || 0)}</span>
                    )}
                    {entry.tipo === 'pagamento' && (
                      <span>Liquido: {formatCurrency(entry.valorSecundario || 0)}</span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openFinanceiroDetail(entry)}
                      className="ml-auto h-7 border-[#D4E2E7] px-2 text-[11px] text-[#244455]"
                    >
                      Ver detalhe
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[#E6EEF2] pt-4">
            <p className="text-xs text-[#5A7582]">Pagina {page}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || billingHistoricoLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="border-[#D4E2E7] text-[#244455]"
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasNext || billingHistoricoLoading}
                onClick={() => setPage((current) => current + 1)}
                className="border-[#D4E2E7] text-[#244455]"
              >
                Proxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

