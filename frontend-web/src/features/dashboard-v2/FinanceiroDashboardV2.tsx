import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import faturamentoService, {
  EstatisticasPagamentos,
  FaturasPaginadasResponse,
  StatusFatura,
} from '../../services/faturamentoService';
import contasPagarService from '../../services/contasPagarService';
import contaBancariaService from '../../services/contaBancariaService';
import conciliacaoBancariaService from '../../services/conciliacaoBancariaService';
import alertasOperacionaisFinanceiroService from '../../services/alertasOperacionaisFinanceiroService';
import {
  AlertaOperacionalFinanceiro,
  ContaPagar,
  ImportacaoExtrato,
  ResumoFinanceiro,
} from '../../types/financeiro';
import type { DashboardV2Insight } from './useDashboardV2';
import GoalProgressCard from './components/GoalProgressCard';
import InsightsPanel from './components/InsightsPanel';
import KpiTrendCard from './components/KpiTrendCard';
import {
  aplicarAtualizacaoAlertaOperacional,
  contarAlertasOperacionais,
  priorizarAlertasOperacionais,
} from './financeiro-alertas-state';
import {
  isAlertaReprocessavel,
  montarPayloadReprocessamento,
  REPROCESSAMENTO_CANCELADO,
} from './financeiro-alertas-reprocessamento';

type PeriodoFiltro = '7d' | '30d' | '90d';

const periodOptions: Array<{ value: PeriodoFiltro; label: string }> = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatNumber = (value: number): string =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Atualizado agora';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const alertSeverityLabelMap = {
  critical: 'Crítico',
  warning: 'Atenção',
  info: 'Informativo',
} as const;

const alertStatusLabelMap = {
  ativo: 'Ativo',
  acknowledged: 'Reconhecido',
  resolvido: 'Resolvido',
} as const;

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const formatCompactCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `R$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `R$${(value / 1_000).toFixed(0)}K`;
  }

  return formatCurrency(value);
};

const periodRange = (periodo: PeriodoFiltro): { dataInicioIso: string; dataFimIso: string } => {
  const dataFim = new Date();
  const dataInicio = new Date(dataFim);
  dataInicio.setDate(dataInicio.getDate() - (periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90));
  return { dataInicioIso: dataInicio.toISOString(), dataFimIso: dataFim.toISOString() };
};

const FinanceiroDashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const [faturasData, setFaturasData] = useState<FaturasPaginadasResponse | null>(null);
  const [pagamentosStats, setPagamentosStats] = useState<EstatisticasPagamentos | null>(null);
  const [resumoContasPagar, setResumoContasPagar] = useState<ResumoFinanceiro | null>(null);
  const [pendenciasAprovacao, setPendenciasAprovacao] = useState<ContaPagar[]>([]);
  const [importacoesConciliacao, setImportacoesConciliacao] = useState<ImportacaoExtrato[]>([]);
  const [alertasOperacionais, setAlertasOperacionais] = useState<AlertaOperacionalFinanceiro[]>([]);
  const [saldoBancarioTotal, setSaldoBancarioTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [warningAlertas, setWarningAlertas] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [alertaActionById, setAlertaActionById] = useState<
    Record<string, 'ack' | 'resolver' | 'reprocessar' | undefined>
  >({});

  const carregarDados = useCallback(async () => {
    setWarning(null);
    setWarningAlertas(null);
    const range = periodRange(periodo);
    const dataInicio = range.dataInicioIso.slice(0, 10);
    const dataFim = range.dataFimIso.slice(0, 10);

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
      contasPagarService.obterResumo({ dataInicio, dataFim }),
      contasPagarService.listarPendenciasAprovacao(),
      contaBancariaService.listarAtivas(),
      conciliacaoBancariaService.listarImportacoes({ limite: 10 }),
      alertasOperacionaisFinanceiroService
        .recalcular()
        .then(() => alertasOperacionaisFinanceiroService.listar({ limite: 12 })),
    ]);

    let falhasCriticas = 0;
    if (resultados[0].status === 'fulfilled') setFaturasData(resultados[0].value);
    else falhasCriticas += 1;
    if (resultados[1].status === 'fulfilled') setPagamentosStats(resultados[1].value);
    else falhasCriticas += 1;
    if (resultados[2].status === 'fulfilled') setResumoContasPagar(resultados[2].value);
    else falhasCriticas += 1;
    if (resultados[3].status === 'fulfilled') setPendenciasAprovacao(resultados[3].value);
    else falhasCriticas += 1;
    if (resultados[4].status === 'fulfilled') {
      const saldo = resultados[4].value.reduce((acc, conta) => acc + Number(conta.saldo || 0), 0);
      setSaldoBancarioTotal(Number(saldo.toFixed(2)));
    } else falhasCriticas += 1;
    if (resultados[5].status === 'fulfilled') {
      setImportacoesConciliacao(resultados[5].value);
    }
    if (resultados[6].status === 'fulfilled') {
      setAlertasOperacionais(resultados[6].value);
    } else {
      setWarningAlertas('Não foi possível carregar alertas operacionais agora.');
    }

    if (falhasCriticas > 0) {
      setWarning('Alguns indicadores não puderam ser carregados. Exibindo dados parciais.');
    }

    setLastUpdatedAt(new Date().toISOString());
  }, [periodo]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await carregarDados();
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [carregarDados]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await carregarDados();
    } finally {
      setRefreshing(false);
    }
  };

  const faturas = faturasData?.data || [];
  const valorFaturado = Number(faturasData?.aggregates?.valorTotal || 0);
  const valorRecebido = Number(faturasData?.aggregates?.valorRecebido || pagamentosStats?.valorTotal || 0);
  const valorEmAberto = Number(faturasData?.aggregates?.valorEmAberto || 0);
  const totalAtrasado = Number(resumoContasPagar?.totalAtrasado || 0);
  const totalMes = Number(resumoContasPagar?.totalMes || 0);
  const totalQuantidadeFaturas = Number(faturasData?.total || faturas.length || 0);
  const pendenciasValor = pendenciasAprovacao.reduce(
    (acc, conta) => acc + Number(conta.valorRestante || conta.valorTotal || 0),
    0,
  );
  const taxaRecebimento = valorFaturado > 0 ? (valorRecebido / valorFaturado) * 100 : 0;
  const caixaPercent = clampPercent(totalMes > 0 ? (saldoBancarioTotal / totalMes) * 100 : 100);
  const faturadoMedioPorFatura = totalQuantidadeFaturas > 0 ? valorFaturado / totalQuantidadeFaturas : 0;
  const recebidasCount = faturas.filter((item) => item.status === StatusFatura.PAGA).length;
  const vencidasCount = faturas.filter((item) => item.status === StatusFatura.VENCIDA).length;
  const importacoesRecentesCount = importacoesConciliacao.length;
  const coberturaCaixaMeses = totalMes > 0 ? saldoBancarioTotal / totalMes : 0;
  const caixaCoverageLabel =
    totalMes > 0
      ? `${coberturaCaixaMeses.toFixed(1)}x do desembolso mensal`
      : 'Sem desembolso mensal de referência';

  const sparkFaturado = useMemo(() => faturas.slice(-12).map((item) => Number(item.valorTotal || 0)), [faturas]);
  const sparkRecebido = useMemo(
    () =>
      faturas
        .slice(-12)
        .map((item) => (item.status === StatusFatura.PAGA ? Number(item.valorTotal || 0) : 0)),
    [faturas],
  );
  const sparkAtrasado = useMemo(
    () =>
      faturas
        .slice(-12)
        .map((item) => (item.status === StatusFatura.VENCIDA ? Number(item.valorTotal || 0) : 0)),
    [faturas],
  );

  const alertasPriorizados = useMemo(
    () => priorizarAlertasOperacionais(alertasOperacionais),
    [alertasOperacionais],
  );

  const contadoresAlertas = useMemo(
    () => contarAlertasOperacionais(alertasPriorizados),
    [alertasPriorizados],
  );
  const alertasAtivosCount = useMemo(
    () => alertasPriorizados.filter((alerta) => alerta.status === 'ativo').length,
    [alertasPriorizados],
  );
  const alertasReconhecidosCount = useMemo(
    () => alertasPriorizados.filter((alerta) => alerta.status === 'acknowledged').length,
    [alertasPriorizados],
  );
  const alertasReprocessaveisCount = useMemo(
    () => alertasPriorizados.filter((alerta) => isAlertaReprocessavel(alerta.tipo)).length,
    [alertasPriorizados],
  );
  const hasActiveFilters = periodo !== '30d';
  const lastUpdatedLabel = lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'Atualizado agora';

  const atualizarAlerta = useCallback(
    async (alerta: AlertaOperacionalFinanceiro, acao: 'ack' | 'resolver' | 'reprocessar') => {
      const id = alerta.id;
      setAlertaActionById((prev) => ({ ...prev, [id]: acao }));

      try {
        let atualizado: AlertaOperacionalFinanceiro;
        let limparWarning = true;

        if (acao === 'ack') {
          atualizado = await alertasOperacionaisFinanceiroService.ack(id, {
            observacao: 'Atualizado pelo painel financeiro',
          });
        } else if (acao === 'resolver') {
          atualizado = await alertasOperacionaisFinanceiroService.resolver(id, {
            observacao: 'Resolvido pelo painel financeiro',
          });
        } else {
          const dados = montarPayloadReprocessamento(alerta);
          if (!dados) {
            throw new Error(REPROCESSAMENTO_CANCELADO);
          }
          const resultado = await alertasOperacionaisFinanceiroService.reprocessar(id, dados);
          atualizado = resultado.alerta;
          if (!resultado.sucesso) {
            limparWarning = false;
            setWarningAlertas(resultado.mensagem || 'Não foi possível reprocessar o alerta.');
          }
        }

        setAlertasOperacionais((prev) => aplicarAtualizacaoAlertaOperacional(prev, atualizado));
        if (limparWarning) {
          setWarningAlertas(null);
        }
      } catch (error) {
        if (error instanceof Error && error.message === REPROCESSAMENTO_CANCELADO) {
          return;
        }
        if (acao === 'reprocessar' && error instanceof Error && error.message) {
          setWarningAlertas(error.message);
        } else {
          setWarningAlertas('Não foi possível atualizar o alerta selecionado.');
        }
      } finally {
        setAlertaActionById((prev) => ({ ...prev, [id]: undefined }));
      }
    },
    [],
  );

  const insights = useMemo<DashboardV2Insight[]>(
    () => [
      {
        id: 'recebimento',
        type: taxaRecebimento < 75 ? 'warning' : 'opportunity',
        title: taxaRecebimento < 75 ? 'Recebimento abaixo da meta' : 'Recebimento em linha com a meta',
        description: `${taxaRecebimento.toFixed(1)}% do faturado foi recebido.`,
        impact: taxaRecebimento < 75 ? 'alto' : 'medio',
        action: 'Revisar fila de cobranca e vencimentos.',
      },
      {
        id: 'atrasos',
        type: totalAtrasado > 0 ? 'warning' : 'info',
        title: totalAtrasado > 0 ? 'Contas atrasadas' : 'Sem atrasos relevantes',
        description: `${formatCurrency(totalAtrasado)} em contas vencidas.`,
        impact: totalAtrasado > 0 ? 'alto' : 'baixo',
        action: 'Priorizar pagamentos com juros e multa.',
      },
      {
        id: 'aprovacoes',
        type: pendenciasAprovacao.length > 0 ? 'info' : 'opportunity',
        title: 'Fila de aprovação financeira',
        description: `${formatNumber(pendenciasAprovacao.length)} itens somando ${formatCurrency(pendenciasValor)}.`,
        impact: pendenciasAprovacao.length > 0 ? 'medio' : 'baixo',
        action: 'Liberar aprovações pendentes conforme alçada.',
      },
      {
        id: 'conciliacao',
        type: importacoesConciliacao.length > 0 ? 'opportunity' : 'info',
        title: 'Conciliação bancária',
        description: `${formatNumber(importacoesConciliacao.length)} importações recentes.`,
        impact: 'medio',
        action: 'Executar matching automático para reduzir pendências.',
      },
    ],
    [importacoesConciliacao.length, pendenciasAprovacao.length, pendenciasValor, taxaRecebimento, totalAtrasado],
  );

  if (loading) {
    return <div className="h-60 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Dashboard Financeiro
            </h2>
            <p className="mt-1 text-[13px] text-[#617D89]">
              Controle de faturamento, recebimentos, caixa e operações financeiras.
            </p>
            <p className="mt-1 text-[12px] text-[#7A929E]">Última sincronização: {lastUpdatedLabel}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
            <label htmlFor="dashboard-financeiro-periodo" className="text-[13px] font-medium text-[#567583]">
              Período
            </label>
            <select
              id="dashboard-financeiro-periodo"
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value as PeriodoFiltro)}
              className="w-full min-w-0 rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none sm:w-auto sm:min-w-[180px]"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPeriodo('30d')}
              disabled={!hasActiveFilters}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpar filtros
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
        {warning ? <p className="mt-2 text-[13px] text-[#A56B13]">{warning}</p> : null}
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-5">
        <KpiTrendCard
          title="Faturado"
          value={formatCurrency(valorFaturado)}
          sparkline={sparkFaturado}
          progressPercent={clampPercent(totalQuantidadeFaturas > 0 ? (recebidasCount / totalQuantidadeFaturas) * 100 : 0)}
          footerLeft={`${formatNumber(totalQuantidadeFaturas)} faturas no período`}
          footerRight={
            faturadoMedioPorFatura > 0
              ? `Ticket médio: ${formatCompactCurrency(faturadoMedioPorFatura)}`
              : 'Sem ticket calculado'
          }
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiTrendCard
          title="Recebido"
          value={formatCurrency(valorRecebido)}
          progressPercent={taxaRecebimento}
          sparkline={sparkRecebido}
          footerLeft={`${taxaRecebimento.toFixed(0)}% de conversão financeira`}
          footerRight={`${formatNumber(recebidasCount)} faturas pagas`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiTrendCard
          title="Em aberto"
          value={formatCurrency(valorEmAberto)}
          progressPercent={clampPercent(100 - taxaRecebimento)}
          progressTone="amber"
          sparkline={sparkAtrasado}
          footerLeft={`${formatNumber(vencidasCount)} faturas vencidas`}
          footerRight={
            totalAtrasado > 0 ? `Atrasado: ${formatCompactCurrency(totalAtrasado)}` : 'Sem atraso relevante'
          }
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiTrendCard
          title="Fila de aprovações"
          value={formatNumber(pendenciasAprovacao.length)}
          valueSuffix="itens"
          progressPercent={clampPercent(pendenciasAprovacao.length * 12)}
          progressTone="amber"
          footerLeft={
            pendenciasValor > 0 ? `Fila: ${formatCompactCurrency(pendenciasValor)}` : 'Sem valor pendente'
          }
          footerRight={`${formatNumber(importacoesRecentesCount)} importações recentes`}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <GoalProgressCard
          title="Posicao de caixa"
          primaryValue={formatCurrency(saldoBancarioTotal)}
          primaryLabel="Saldo bancário"
          secondaryValue={formatCurrency(totalMes)}
          secondaryLabel="Desembolso mensal"
          progressPercent={caixaPercent}
          projectionLabel={caixaCoverageLabel}
          icon={<Landmark className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-3.5 2xl:grid-cols-12">
        <article className="space-y-3.5 2xl:col-span-9">
          <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BellRing className="h-4.5 w-4.5 text-[#2A5C70]" />
                  <h3 className="text-[18px] font-semibold text-[#18374B]">Alertas operacionais</h3>
                </div>
                <p className="mt-1 text-[13px] text-[#617D89]">
                  Priorização de risco e ações imediatas para o time financeiro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2A5C70]"
              >
                Revalidar alertas
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-[14px] border border-[#F2D4D4] bg-[#FFF5F5] px-3.5 py-3 text-[#8A3030]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Críticos</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">{formatNumber(contadoresAlertas.critical)}</p>
                <p className="mt-2 text-[12px] text-[#9C5454]">Itens que exigem resposta imediata.</p>
              </div>
              <div className="rounded-[14px] border border-[#F4E1BF] bg-[#FFF8EB] px-3.5 py-3 text-[#8A5D11]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Em atenção</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">{formatNumber(contadoresAlertas.warning)}</p>
                <p className="mt-2 text-[12px] text-[#9A7A34]">Demandas com potencial de escalada.</p>
              </div>
              <div className="rounded-[14px] border border-[#DDEAF0] bg-[#F4FAFD] px-3.5 py-3 text-[#2F5C72]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Ativos</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">{formatNumber(alertasAtivosCount)}</p>
                <p className="mt-2 text-[12px] text-[#5E8397]">Alertas ainda sem resolução final.</p>
              </div>
              <div className="rounded-[14px] border border-[#DDE7EC] bg-[#F8FBFD] px-3.5 py-3 text-[#436273]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Cobertura</p>
                <p className="mt-1 text-[22px] font-semibold leading-none">{formatNumber(alertasReprocessaveisCount)}</p>
                <p className="mt-2 text-[12px] text-[#69808C]">
                  reprocessáveis • {formatNumber(alertasReconhecidosCount)} reconhecidos
                </p>
              </div>
            </div>

            {warningAlertas ? <p className="mb-3 text-[13px] text-[#A56B13]">{warningAlertas}</p> : null}

            {alertasPriorizados.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-[#DCE7EB] bg-[#FAFCFD] px-3 py-4 text-[14px] text-[#5D7785]">
                Sem alertas operacionais ativos no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {alertasPriorizados.slice(0, 6).map((alerta) => {
                  const currentAction = alertaActionById[alerta.id];
                  const isProcessing = Boolean(currentAction);
                  return (
                    <div
                      key={alerta.id}
                      className="rounded-[16px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                alerta.severidade === 'critical'
                                  ? 'bg-[#FFE9E9] text-[#A93B3B]'
                                  : alerta.severidade === 'warning'
                                    ? 'bg-[#FFF2DD] text-[#A16A16]'
                                    : 'bg-[#EAF4F8] text-[#436B80]'
                              }`}
                            >
                              {alerta.severidade === 'critical' ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {alertSeverityLabelMap[alerta.severidade]}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-[#D8E5EA] bg-white px-2 py-1 text-[11px] font-semibold text-[#5D7885]">
                              {alertStatusLabelMap[alerta.status]}
                            </span>
                            <span className="text-[11px] text-[#7E96A2]">
                              Criado em {formatDateTime(alerta.createdAt)}
                            </span>
                          </div>

                          <p className="text-[14px] font-semibold text-[#1C3B4E]">{alerta.titulo}</p>
                          {alerta.descricao ? (
                            <p className="mt-1 text-[13px] text-[#5F7C89]">{alerta.descricao}</p>
                          ) : null}

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#7E96A2]">
                            {alerta.referencia ? <span>Ref.: {alerta.referencia}</span> : null}
                            <span>Atualizado: {formatDateTime(alerta.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {alerta.status === 'ativo' ? (
                          <button
                            type="button"
                            onClick={() => void atualizarAlerta(alerta, 'ack')}
                            disabled={isProcessing}
                            className="rounded-[10px] border border-[#D9E7EB] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#305C70] disabled:opacity-60"
                          >
                            {currentAction === 'ack' ? 'Processando...' : 'Reconhecer'}
                          </button>
                        ) : null}
                        {isAlertaReprocessavel(alerta.tipo) ? (
                          <button
                            type="button"
                            onClick={() => void atualizarAlerta(alerta, 'reprocessar')}
                            disabled={isProcessing}
                            className="rounded-[10px] border border-[#D9E7EB] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#305C70] disabled:opacity-60"
                          >
                            {currentAction === 'reprocessar' ? 'Reprocessando...' : 'Reprocessar'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void atualizarAlerta(alerta, 'resolver')}
                          disabled={isProcessing}
                          className="rounded-[10px] border border-[#159A9C] bg-[#159A9C] px-2.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
                        >
                          {currentAction === 'resolver' ? 'Processando...' : 'Resolver'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[18px] font-semibold text-[#18374B]">Resumo operacional</h3>
                <p className="mt-1 text-[13px] text-[#617D89]">
                  Itens que merecem acompanhamento diário do financeiro.
                </p>
              </div>
              <button type="button" onClick={() => navigate('/financeiro/contas-pagar')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2A5C70]">
                Contas a pagar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <div className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">Atrasado</p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-[#1C3B4E]">{formatCurrency(totalAtrasado)}</p>
                <p className="mt-2 text-[12px] text-[#738B97]">Montante vencido aguardando tratamento.</p>
              </div>
              <div className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">Pendencias</p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-[#1C3B4E]">{formatCurrency(pendenciasValor)}</p>
                <p className="mt-2 text-[12px] text-[#738B97]">Fila financeira aguardando aprovação.</p>
              </div>
              <div className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">Importações</p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-[#1C3B4E]">{formatNumber(importacoesConciliacao.length)}</p>
                <p className="mt-2 text-[12px] text-[#738B97]">Arquivos recentes para conciliação bancária.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[18px] font-semibold text-[#18374B]">Ações rápidas</h3>
                <p className="mt-1 text-[13px] text-[#617D89]">
                  Atalhos com contexto para reduzir clique e decisão desnecessária.
                </p>
              </div>
              <button type="button" onClick={() => navigate('/financeiro/conciliacao')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2A5C70]">
                Conciliação
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <button
                type="button"
                onClick={() => navigate('/financeiro/aprovacoes')}
                className="rounded-[16px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3 text-left transition hover:border-[#D0E0E6] hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1C3B4E]">Fila de aprovações</p>
                    <p className="mt-1 text-[12px] text-[#708894]">
                      {formatNumber(pendenciasAprovacao.length)} itens somando {formatCompactCurrency(pendenciasValor)}.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6F8894]" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/financeiro/contas-bancarias')}
                className="rounded-[16px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3 text-left transition hover:border-[#D0E0E6] hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1C3B4E]">Contas bancárias</p>
                    <p className="mt-1 text-[12px] text-[#708894]">
                      Saldo consolidado de {formatCompactCurrency(saldoBancarioTotal)}.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6F8894]" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate('/financeiro/contas-receber')}
                className="rounded-[16px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3 text-left transition hover:border-[#D0E0E6] hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1C3B4E]">Contas a receber</p>
                    <p className="mt-1 text-[12px] text-[#708894]">
                      {formatNumber(totalQuantidadeFaturas)} faturas e {formatCompactCurrency(valorEmAberto)} em aberto.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#6F8894]" />
                </div>
              </button>
            </div>
          </div>
        </article>

        <div className="2xl:col-span-3">
          <InsightsPanel insights={insights} />
        </div>
      </section>
    </div>
  );
};

export default FinanceiroDashboardV2;
