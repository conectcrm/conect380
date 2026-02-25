import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import faturamentoService, {
  EstatisticasPagamentos,
  Fatura,
  FaturasPaginadasResponse,
  StatusFatura,
} from '../../services/faturamentoService';

type PeriodoFiltro = '7d' | '30d' | '90d';

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

const getPeriodoDates = (periodo: PeriodoFiltro): { dataInicio: string; dataFim: string } => {
  const fim = new Date();
  const inicio = new Date(fim);

  if (periodo === '7d') {
    inicio.setDate(inicio.getDate() - 7);
  } else if (periodo === '30d') {
    inicio.setDate(inicio.getDate() - 30);
  } else {
    inicio.setDate(inicio.getDate() - 90);
  }

  return {
    dataInicio: inicio.toISOString(),
    dataFim: fim.toISOString(),
  };
};

const statusLabelMap: Record<string, string> = {
  [StatusFatura.PENDENTE]: 'Pendente',
  [StatusFatura.ENVIADA]: 'Enviada',
  [StatusFatura.PAGA]: 'Paga',
  [StatusFatura.VENCIDA]: 'Vencida',
  [StatusFatura.CANCELADA]: 'Cancelada',
  [StatusFatura.PARCIALMENTE_PAGA]: 'Parcial',
};

const statusColorMap: Record<string, string> = {
  [StatusFatura.PAGA]: 'bg-green-100 text-green-700',
  [StatusFatura.PENDENTE]: 'bg-yellow-100 text-yellow-700',
  [StatusFatura.VENCIDA]: 'bg-red-100 text-red-700',
  [StatusFatura.ENVIADA]: 'bg-blue-100 text-blue-700',
  [StatusFatura.PARCIALMENTE_PAGA]: 'bg-orange-100 text-orange-700',
  [StatusFatura.CANCELADA]: 'bg-gray-100 text-gray-700',
};

const FinanceiroDashboard: React.FC = () => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const [faturasData, setFaturasData] = useState<FaturasPaginadasResponse | null>(null);
  const [pagamentosStats, setPagamentosStats] = useState<EstatisticasPagamentos | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const range = getPeriodoDates(periodo);

      const [faturasResponse, pagamentosResponse] = await Promise.all([
        faturamentoService.listarFaturasPaginadas({
          page: 1,
          pageSize: 200,
          dataInicial: range.dataInicio,
          dataFinal: range.dataFim,
          sortBy: 'dataVencimento',
          sortOrder: 'ASC',
        }),
        faturamentoService.obterEstatisticasPagamentos({
          dataInicio: range.dataInicio,
          dataFim: range.dataFim,
        }),
      ]);

      setFaturasData(faturasResponse);
      setPagamentosStats(pagamentosResponse);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dashboard financeiro';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  const faturas = faturasData?.data || [];
  const aggregates = faturasData?.aggregates || {};

  const {
    totalFaturas,
    faturasPagas,
    faturasVencidas,
    taxaRecebimento,
    proximosVencimentos,
    distribuicaoStatus,
  } = useMemo(() => {
    const pagas = faturas.filter((fatura) => fatura.status === StatusFatura.PAGA).length;
    const vencidas = faturas.filter((fatura) => fatura.status === StatusFatura.VENCIDA).length;
    const taxa = faturas.length > 0 ? (pagas / faturas.length) * 100 : 0;

    const hoje = new Date();
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 14);

    const vencimentos = faturas
      .filter((fatura) => {
        const vencimento = new Date(fatura.dataVencimento);
        return vencimento >= hoje && vencimento <= limite && fatura.status !== StatusFatura.PAGA;
      })
      .sort(
        (a, b) =>
          new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime(),
      )
      .slice(0, 6);

    const statusCount = faturas.reduce<Record<string, number>>((acc, fatura) => {
      const key = String(fatura.status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const distribuicao = Object.entries(statusCount)
      .map(([status, quantidade]) => ({
        status,
        quantidade,
        percentual: faturas.length > 0 ? (quantidade / faturas.length) * 100 : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return {
      totalFaturas: faturas.length,
      faturasPagas: pagas,
      faturasVencidas: vencidas,
      taxaRecebimento: taxa,
      proximosVencimentos: vencimentos,
      distribuicaoStatus: distribuicao,
    };
  }, [faturas]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-[#DEEFE7] shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#002333]">Dashboard Financeiro</h1>
              <p className="text-[#002333]/70 mt-1">
                Visao de faturamento, recebimento e exposicao de inadimplencia.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as PeriodoFiltro)}
                className="px-3 py-2 border border-[#B4BEC9] rounded-lg text-sm focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Falha ao carregar dados financeiros</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-8 text-center mb-6">
            <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mx-auto mb-3" />
            <p className="text-[#002333]/70">Carregando indicadores financeiros...</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">
                      Valor faturado
                    </p>
                    <p className="text-2xl font-bold text-[#002333] mt-2">
                      {formatCurrency(Number(aggregates.valorTotal || 0))}
                    </p>
                    <p className="text-sm text-[#002333]/70 mt-2">{totalFaturas} faturas no periodo</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-[#159A9C]/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#159A9C]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">
                      Valor recebido
                    </p>
                    <p className="text-2xl font-bold text-[#002333] mt-2">
                      {formatCurrency(Number(aggregates.valorRecebido || pagamentosStats?.valorTotal || 0))}
                    </p>
                    <p className="text-sm text-[#002333]/70 mt-2">
                      {faturasPagas} faturas liquidadas
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-700" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">
                      Em aberto
                    </p>
                    <p className="text-2xl font-bold text-[#002333] mt-2">
                      {formatCurrency(Number(aggregates.valorEmAberto || 0))}
                    </p>
                    <p className="text-sm text-[#002333]/70 mt-2">{faturasVencidas} faturas vencidas</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5 text-orange-700" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">
                      Taxa de recebimento
                    </p>
                    <p className="text-2xl font-bold text-[#002333] mt-2">
                      {taxaRecebimento.toFixed(1)}%
                    </p>
                    <p className="text-sm text-[#002333]/70 mt-2">
                      {pagamentosStats?.totalPagamentos || 0} pagamentos processados
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#002333] mb-4">Distribuicao por status</h2>
                {distribuicaoStatus.length === 0 ? (
                  <p className="text-sm text-[#002333]/70">Sem faturas no periodo selecionado.</p>
                ) : (
                  <div className="space-y-3">
                    {distribuicaoStatus.map((item) => (
                      <div key={item.status}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-[#002333] font-medium">
                            {statusLabelMap[item.status] || item.status}
                          </span>
                          <span className="text-[#002333]/70">
                            {item.quantidade} ({item.percentual.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#DEEFE7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#159A9C]"
                            style={{ width: `${Math.max(4, item.percentual)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#002333] mb-4">Proximos vencimentos (14 dias)</h2>
                {proximosVencimentos.length === 0 ? (
                  <p className="text-sm text-[#002333]/70">Nenhum vencimento no horizonte imediato.</p>
                ) : (
                  <div className="space-y-3">
                    {proximosVencimentos.map((fatura: Fatura) => (
                      <div key={fatura.id} className="p-3 rounded-lg border border-[#DEEFE7] bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#002333]">#{fatura.numero}</p>
                            <p className="text-sm text-[#002333]/70">
                              Vencimento {formatDate(fatura.dataVencimento)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[#002333]">{formatCurrency(fatura.valorTotal)}</p>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs ${
                                statusColorMap[fatura.status] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {statusLabelMap[fatura.status] || fatura.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm mt-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-[#159A9C]" />
                <h2 className="text-lg font-semibold text-[#002333]">Pagamentos por metodo</h2>
              </div>

              {!pagamentosStats || Object.keys(pagamentosStats.porMetodo || {}).length === 0 ? (
                <p className="text-sm text-[#002333]/70">Sem dados de pagamentos para o periodo.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {Object.entries(pagamentosStats.porMetodo).map(([metodo, dados]) => (
                    <div key={metodo} className="p-4 border border-[#DEEFE7] rounded-lg bg-gray-50">
                      <p className="text-xs uppercase tracking-wide text-[#002333]/60">{metodo}</p>
                      <p className="text-xl font-bold text-[#002333] mt-1">{formatCurrency(dados.valor)}</p>
                      <p className="text-sm text-[#002333]/70">{dados.quantidade} pagamentos</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinanceiroDashboard;
