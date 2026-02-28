import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileDown,
  Landmark,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import faturamentoService, {
  EstatisticasPagamentos,
  FaturasPaginadasResponse,
  StatusFatura,
} from '../../services/faturamentoService';
import contasPagarService from '../../services/contasPagarService';
import contaBancariaService from '../../services/contaBancariaService';
import conciliacaoBancariaService from '../../services/conciliacaoBancariaService';
import { ContaPagar, ImportacaoExtrato, ResumoFinanceiro } from '../../types/financeiro';

type PeriodoFiltro = '7d' | '30d' | '90d';

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string): string => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('pt-BR');
};

const getPeriodoDates = (periodo: PeriodoFiltro): { dataInicioIso: string; dataFimIso: string } => {
  const dataFim = new Date();
  const dataInicio = new Date(dataFim);

  if (periodo === '7d') {
    dataInicio.setDate(dataInicio.getDate() - 7);
  } else if (periodo === '30d') {
    dataInicio.setDate(dataInicio.getDate() - 30);
  } else {
    dataInicio.setDate(dataInicio.getDate() - 90);
  }

  return {
    dataInicioIso: dataInicio.toISOString(),
    dataFimIso: dataFim.toISOString(),
  };
};

const toDateOnly = (value: string): string => value.slice(0, 10);

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') return fallback;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    if (Array.isArray(message)) {
      const first = message.find((item) => typeof item === 'string' && item.trim());
      if (first) return first.trim();
    }
  }

  return fallback;
};

const statusFaturaLabelMap: Record<string, string> = {
  [StatusFatura.PENDENTE]: 'Pendente',
  [StatusFatura.ENVIADA]: 'Enviada',
  [StatusFatura.PAGA]: 'Paga',
  [StatusFatura.VENCIDA]: 'Vencida',
  [StatusFatura.CANCELADA]: 'Cancelada',
  [StatusFatura.PARCIALMENTE_PAGA]: 'Parcial',
};

const statusContaLabelMap: Record<string, string> = {
  em_aberto: 'Em aberto',
  vencido: 'Vencido',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

const statusContaColorMap: Record<string, string> = {
  em_aberto: 'bg-yellow-100 text-yellow-700',
  vencido: 'bg-red-100 text-red-700',
  pago: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-700',
};

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon }) => (
  <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">{title}</p>
        <p className="text-2xl font-bold text-[#002333] mt-2">{value}</p>
        <p className="text-sm text-[#002333]/70 mt-2">{subtitle}</p>
      </div>
      <div className="h-11 w-11 rounded-xl bg-[#159A9C]/10 flex items-center justify-center">{icon}</div>
    </div>
  </div>
);

const FinanceiroDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const [faturasData, setFaturasData] = useState<FaturasPaginadasResponse | null>(null);
  const [pagamentosStats, setPagamentosStats] = useState<EstatisticasPagamentos | null>(null);
  const [resumoContasPagar, setResumoContasPagar] = useState<ResumoFinanceiro | null>(null);
  const [pendenciasAprovacao, setPendenciasAprovacao] = useState<ContaPagar[]>([]);
  const [importacoesConciliacao, setImportacoesConciliacao] = useState<ImportacaoExtrato[]>([]);
  const [saldoBancarioTotal, setSaldoBancarioTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const carregarDados = useCallback(async () => {
    setError(null);
    setWarning(null);

    const range = getPeriodoDates(periodo);
    const dataInicio = toDateOnly(range.dataInicioIso);
    const dataFim = toDateOnly(range.dataFimIso);

    const resultados = await Promise.allSettled([
      faturamentoService.listarFaturasPaginadas({
        page: 1,
        pageSize: 250,
        dataInicial: range.dataInicioIso,
        dataFinal: range.dataFimIso,
        sortBy: 'dataVencimento',
        sortOrder: 'ASC',
      }),
      faturamentoService.obterEstatisticasPagamentos({
        dataInicio: range.dataInicioIso,
        dataFim: range.dataFimIso,
      }),
      contasPagarService.obterResumo({
        dataInicio,
        dataFim,
      }),
      contasPagarService.listarPendenciasAprovacao(),
      contaBancariaService.listarAtivas(),
      conciliacaoBancariaService.listarImportacoes({ limite: 20 }),
    ]);

    let totalFalhas = 0;

    if (resultados[0].status === 'fulfilled') {
      setFaturasData(resultados[0].value);
    } else {
      totalFalhas += 1;
    }

    if (resultados[1].status === 'fulfilled') {
      setPagamentosStats(resultados[1].value);
    } else {
      totalFalhas += 1;
    }

    if (resultados[2].status === 'fulfilled') {
      setResumoContasPagar(resultados[2].value);
    } else {
      totalFalhas += 1;
    }

    if (resultados[3].status === 'fulfilled') {
      setPendenciasAprovacao(resultados[3].value);
    } else {
      totalFalhas += 1;
    }

    if (resultados[4].status === 'fulfilled') {
      const saldoTotal = resultados[4].value.reduce((acc, conta) => acc + Number(conta.saldo || 0), 0);
      setSaldoBancarioTotal(Number(saldoTotal.toFixed(2)));
    } else {
      totalFalhas += 1;
    }

    if (resultados[5].status === 'fulfilled') {
      setImportacoesConciliacao(resultados[5].value);
    } else {
      totalFalhas += 1;
    }

    if (totalFalhas === resultados.length) {
      const mensagem =
        resultados[0].status === 'rejected'
          ? getErrorMessage(resultados[0].reason, 'Falha ao carregar dashboard financeiro')
          : 'Falha ao carregar dashboard financeiro';
      setError(mensagem);
    } else if (totalFalhas > 0) {
      setWarning(
        `Alguns blocos do dashboard nao puderam ser carregados (${totalFalhas}/${resultados.length}).`,
      );
    }

    setUpdatedAt(new Date());
  }, [periodo]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        await carregarDados();
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [carregarDados]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await carregarDados();
    } finally {
      setRefreshing(false);
    }
  };

  const faturas = faturasData?.data || [];
  const aggregates = faturasData?.aggregates || {};

  const distribuicaoStatusFaturas = useMemo(() => {
    const total = faturas.length;
    const count = faturas.reduce<Record<string, number>>((acc, item) => {
      const key = String(item.status || 'desconhecido');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(count)
      .map(([status, quantidade]) => ({
        status,
        quantidade,
        percentual: total > 0 ? (quantidade / total) * 100 : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [faturas]);

  const pagamentosPorMetodo = useMemo(
    () =>
      Object.entries(pagamentosStats?.porMetodo || {})
        .map(([metodo, dados]) => ({
          metodo,
          quantidade: dados.quantidade,
          valor: dados.valor,
        }))
        .sort((a, b) => b.valor - a.valor),
    [pagamentosStats],
  );

  const valorFaturado = Number(aggregates.valorTotal || 0);
  const valorRecebido = Number(aggregates.valorRecebido || pagamentosStats?.valorTotal || 0);
  const valorEmAberto = Number(aggregates.valorEmAberto || 0);
  const taxaRecebimento = valorFaturado > 0 ? (valorRecebido / valorFaturado) * 100 : 0;

  const valorPendenciasAprovacao = pendenciasAprovacao.reduce(
    (acc, conta) => acc + Number(conta.valorRestante || conta.valorTotal || 0),
    0,
  );

  const resumoImportacoes = useMemo(() => {
    return importacoesConciliacao.reduce(
      (acc, item) => {
        acc.totalLancamentos += Number(item.totalLancamentos || 0);
        acc.totalEntradas += Number(item.totalEntradas || 0);
        acc.totalSaidas += Number(item.totalSaidas || 0);
        return acc;
      },
      {
        totalLancamentos: 0,
        totalEntradas: 0,
        totalSaidas: 0,
      },
    );
  }, [importacoesConciliacao]);

  if (loading && !faturasData && !resumoContasPagar && !pagamentosStats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-8 text-center">
            <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mx-auto mb-3" />
            <p className="text-[#002333]/70">Carregando indicadores financeiros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-[#DEEFE7] shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#002333]">Dashboard Financeiro</h1>
              <p className="text-[#002333]/70 mt-1">
                Visao consolidada de recebiveis, contas a pagar, aprovacoes e conciliacao bancaria.
              </p>
              {updatedAt ? (
                <p className="text-xs text-[#002333]/55 mt-2">
                  Ultima atualizacao: {updatedAt.toLocaleTimeString('pt-BR')}
                </p>
              ) : null}
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
                onClick={() => void handleRefresh()}
                disabled={refreshing}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Falha ao carregar dados financeiros</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        {warning ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">Carregamento parcial do dashboard</p>
              <p className="text-amber-700 text-sm">{warning}</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <KpiCard
            title="Faturado no periodo"
            value={formatCurrency(valorFaturado)}
            subtitle={`${faturas.length} faturas monitoradas`}
            icon={<DollarSign className="h-5 w-5 text-[#159A9C]" />}
          />
          <KpiCard
            title="Recebido no periodo"
            value={formatCurrency(valorRecebido)}
            subtitle={`${pagamentosStats?.totalPagamentos || 0} pagamentos processados`}
            icon={<CheckCircle2 className="h-5 w-5 text-[#159A9C]" />}
          />
          <KpiCard
            title="Em aberto (receber)"
            value={formatCurrency(valorEmAberto)}
            subtitle={`${distribuicaoStatusFaturas.find((item) => item.status === StatusFatura.VENCIDA)?.quantidade || 0} faturas vencidas`}
            icon={<CalendarClock className="h-5 w-5 text-[#159A9C]" />}
          />
          <KpiCard
            title="Contas a pagar atrasadas"
            value={formatCurrency(Number(resumoContasPagar?.totalAtrasado || 0))}
            subtitle={`${resumoContasPagar?.quantidadeAtrasado || 0} titulos atrasados`}
            icon={<CreditCard className="h-5 w-5 text-[#159A9C]" />}
          />
          <KpiCard
            title="Pendencias de aprovacao"
            value={String(pendenciasAprovacao.length)}
            subtitle={`${formatCurrency(valorPendenciasAprovacao)} aguardando decisao`}
            icon={<ShieldCheck className="h-5 w-5 text-[#159A9C]" />}
          />
          <KpiCard
            title="Saldo em contas bancarias"
            value={formatCurrency(saldoBancarioTotal)}
            subtitle="Soma das contas ativas"
            icon={<Landmark className="h-5 w-5 text-[#159A9C]" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">Taxa de recebimento</p>
            <p className="text-3xl font-bold text-[#002333] mt-2">{taxaRecebimento.toFixed(1)}%</p>
            <p className="text-sm text-[#002333]/70 mt-2">Recebido / faturado no periodo selecionado</p>
          </div>
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">Vencendo hoje</p>
            <p className="text-3xl font-bold text-[#002333] mt-2">
              {formatCurrency(Number(resumoContasPagar?.totalVencendoHoje || 0))}
            </p>
            <p className="text-sm text-[#002333]/70 mt-2">
              {resumoContasPagar?.quantidadeVencendoHoje || 0} contas a pagar com vencimento hoje
            </p>
          </div>
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide font-semibold text-[#002333]/60">Extratos importados</p>
            <p className="text-3xl font-bold text-[#002333] mt-2">{importacoesConciliacao.length}</p>
            <p className="text-sm text-[#002333]/70 mt-2">
              {resumoImportacoes.totalLancamentos} lancamentos em {formatCurrency(resumoImportacoes.totalSaidas)} de saidas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#002333]">Proximos vencimentos (contas a pagar)</h2>
              <button
                type="button"
                onClick={() => navigate('/financeiro/contas-pagar')}
                className="text-sm text-[#159A9C] hover:text-[#0F7B7D] font-medium inline-flex items-center gap-1"
              >
                Ver contas
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {!resumoContasPagar?.proximosVencimentos?.length ? (
              <p className="text-sm text-[#002333]/70">Nenhuma conta em aberto com vencimento proximo.</p>
            ) : (
              <div className="space-y-3">
                {resumoContasPagar.proximosVencimentos.map((conta) => (
                  <div key={conta.id} className="p-3 rounded-lg border border-[#DEEFE7] bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#002333]">{conta.descricao}</p>
                        <p className="text-sm text-[#002333]/70">
                          {conta.fornecedor?.nome || 'Fornecedor'} • Vencimento {formatDate(conta.dataVencimento)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#002333]">{formatCurrency(Number(conta.valorRestante || conta.valorTotal || 0))}</p>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs ${statusContaColorMap[conta.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {statusContaLabelMap[conta.status] || conta.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#002333]">Fila de aprovacoes financeiras</h2>
              <button
                type="button"
                onClick={() => navigate('/financeiro/aprovacoes')}
                className="text-sm text-[#159A9C] hover:text-[#0F7B7D] font-medium inline-flex items-center gap-1"
              >
                Abrir fila
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {pendenciasAprovacao.length === 0 ? (
              <p className="text-sm text-[#002333]/70">Nenhuma pendencia de aprovacao no momento.</p>
            ) : (
              <div className="space-y-3">
                {pendenciasAprovacao.slice(0, 6).map((conta) => (
                  <div key={conta.id} className="p-3 rounded-lg border border-[#DEEFE7] bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#002333]">{conta.numero || conta.numeroDocumento || conta.id.slice(0, 8)}</p>
                        <p className="text-sm text-[#002333]/70">{conta.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#002333]">{formatCurrency(Number(conta.valorTotal || 0))}</p>
                        <p className="text-xs text-[#002333]/60">{formatDate(conta.dataVencimento)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#002333] mb-4">Distribuicao de faturas por status</h2>
            {distribuicaoStatusFaturas.length === 0 ? (
              <p className="text-sm text-[#002333]/70">Sem faturas para o periodo selecionado.</p>
            ) : (
              <div className="space-y-3">
                {distribuicaoStatusFaturas.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#002333] font-medium">{statusFaturaLabelMap[item.status] || item.status}</span>
                      <span className="text-[#002333]/70">
                        {item.quantidade} ({item.percentual.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#DEEFE7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#159A9C]"
                        style={{ width: `${Math.max(3, item.percentual)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#002333] mb-4">Pagamentos por metodo</h2>
            {pagamentosPorMetodo.length === 0 ? (
              <p className="text-sm text-[#002333]/70">Sem dados de pagamentos para o periodo.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pagamentosPorMetodo.slice(0, 6).map((item) => (
                  <div key={item.metodo} className="p-4 border border-[#DEEFE7] rounded-lg bg-gray-50">
                    <p className="text-xs uppercase tracking-wide text-[#002333]/60">{item.metodo}</p>
                    <p className="text-xl font-bold text-[#002333] mt-1">{formatCurrency(item.valor)}</p>
                    <p className="text-sm text-[#002333]/70">{item.quantidade} pagamentos</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#002333]">Importacoes de extrato recentes</h2>
            <button
              type="button"
              onClick={() => navigate('/financeiro/conciliacao')}
              className="text-sm text-[#159A9C] hover:text-[#0F7B7D] font-medium inline-flex items-center gap-1"
            >
              Ir para conciliacao
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {importacoesConciliacao.length === 0 ? (
            <p className="text-sm text-[#002333]/70">Nenhuma importacao registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F7FAFB] text-xs uppercase tracking-wide text-[#6B8794]">
                  <tr>
                    <th className="px-3 py-3">Arquivo</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Lancamentos</th>
                    <th className="px-3 py-3">Entradas</th>
                    <th className="px-3 py-3">Saidas</th>
                    <th className="px-3 py-3">Importado em</th>
                  </tr>
                </thead>
                <tbody>
                  {importacoesConciliacao.slice(0, 6).map((item) => (
                    <tr key={item.id} className="border-t border-[#EDF2F4] text-[#244455]">
                      <td className="px-3 py-3 font-medium">{item.nomeArquivo}</td>
                      <td className="px-3 py-3 uppercase">{item.tipoArquivo}</td>
                      <td className="px-3 py-3">{item.totalLancamentos}</td>
                      <td className="px-3 py-3">{formatCurrency(item.totalEntradas)}</td>
                      <td className="px-3 py-3">{formatCurrency(item.totalSaidas)}</td>
                      <td className="px-3 py-3">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-[#DEEFE7] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#002333] mb-4">Acoes rapidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate('/financeiro/contas-pagar')}
              className="text-left p-4 rounded-lg border border-[#DEEFE7] hover:bg-[#F4FBFB] transition"
            >
              <CreditCard className="h-5 w-5 text-[#159A9C] mb-2" />
              <p className="font-semibold text-[#002333]">Contas a pagar</p>
              <p className="text-sm text-[#002333]/70">Gestao de pagamentos e vencimentos</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/financeiro/aprovacoes')}
              className="text-left p-4 rounded-lg border border-[#DEEFE7] hover:bg-[#F4FBFB] transition"
            >
              <ShieldCheck className="h-5 w-5 text-[#159A9C] mb-2" />
              <p className="font-semibold text-[#002333]">Aprovacoes</p>
              <p className="text-sm text-[#002333]/70">Fila de aprovacoes financeiras</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/financeiro/conciliacao')}
              className="text-left p-4 rounded-lg border border-[#DEEFE7] hover:bg-[#F4FBFB] transition"
            >
              <FileDown className="h-5 w-5 text-[#159A9C] mb-2" />
              <p className="font-semibold text-[#002333]">Conciliacao bancaria</p>
              <p className="text-sm text-[#002333]/70">Importacao e matching de extratos</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/financeiro/contas-bancarias')}
              className="text-left p-4 rounded-lg border border-[#DEEFE7] hover:bg-[#F4FBFB] transition"
            >
              <TrendingUp className="h-5 w-5 text-[#159A9C] mb-2" />
              <p className="font-semibold text-[#002333]">Contas bancarias</p>
              <p className="text-sm text-[#002333]/70">Saldos e configuracoes de contas</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroDashboard;
