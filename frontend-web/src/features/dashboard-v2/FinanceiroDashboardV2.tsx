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

const periodButtons: Array<{ key: PeriodoFiltro; label: string }> = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
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

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

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
      setWarningAlertas('Nao foi possivel carregar alertas operacionais agora.');
    }

    if (falhasCriticas > 0) {
      setWarning('Alguns indicadores nao puderam ser carregados. Exibindo dados parciais.');
    }
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
  const pendenciasValor = pendenciasAprovacao.reduce(
    (acc, conta) => acc + Number(conta.valorRestante || conta.valorTotal || 0),
    0,
  );
  const taxaRecebimento = valorFaturado > 0 ? (valorRecebido / valorFaturado) * 100 : 0;
  const caixaPercent = clampPercent(totalMes > 0 ? (saldoBancarioTotal / totalMes) * 100 : 100);

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
            setWarningAlertas(resultado.mensagem || 'Nao foi possivel reprocessar o alerta.');
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
          setWarningAlertas('Nao foi possivel atualizar o alerta selecionado.');
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
        title: 'Fila de aprovacao financeira',
        description: `${formatNumber(pendenciasAprovacao.length)} itens somando ${formatCurrency(pendenciasValor)}.`,
        impact: pendenciasAprovacao.length > 0 ? 'medio' : 'baixo',
        action: 'Liberar aprovacoes pendentes conforme alcada.',
      },
      {
        id: 'conciliacao',
        type: importacoesConciliacao.length > 0 ? 'opportunity' : 'info',
        title: 'Conciliacao bancaria',
        description: `${formatNumber(importacoesConciliacao.length)} importacoes recentes.`,
        impact: 'medio',
        action: 'Executar matching automatico para reduzir pendencias.',
      },
    ],
    [importacoesConciliacao.length, pendenciasAprovacao.length, pendenciasValor, taxaRecebimento, totalAtrasado],
  );

  if (loading) {
    return <div className="h-60 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-white px-5 py-4 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] font-semibold text-[#18374B]">Dashboard Financeiro</h2>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-[11px] border border-[#DCE8EC] bg-[#ECF3F0] p-1">
              {periodButtons.map((button) => (
                <button
                  key={button.key}
                  type="button"
                  onClick={() => setPeriodo(button.key)}
                  className={`rounded-[9px] px-3 py-1 text-[13px] font-semibold ${
                    periodo === button.key ? 'bg-white text-[#213D4B]' : 'text-[#6B8390]'
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D4E4E8] px-3 py-1.5 text-[13px] font-semibold text-[#23465A]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
        {warning ? <p className="mt-2 text-[13px] text-[#A56B13]">{warning}</p> : null}
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-5">
        <KpiTrendCard title="Faturado" value={formatCurrency(valorFaturado)} sparkline={sparkFaturado} icon={<Wallet className="h-5 w-5" />} />
        <KpiTrendCard title="Recebido" value={formatCurrency(valorRecebido)} progressPercent={taxaRecebimento} sparkline={sparkRecebido} icon={<Wallet className="h-5 w-5" />} />
        <KpiTrendCard title="Em aberto" value={formatCurrency(valorEmAberto)} progressPercent={clampPercent(100 - taxaRecebimento)} progressTone="amber" sparkline={sparkAtrasado} icon={<Wallet className="h-5 w-5" />} />
        <KpiTrendCard title="Aprovacoes" value={formatNumber(pendenciasAprovacao.length)} valueSuffix="itens" progressPercent={clampPercent(pendenciasAprovacao.length * 12)} progressTone="amber" icon={<ShieldCheck className="h-5 w-5" />} />
        <GoalProgressCard title="Posicao de caixa" primaryValue={formatCurrency(saldoBancarioTotal)} secondaryValue={formatCurrency(totalMes)} progressPercent={caixaPercent} icon={<Landmark className="h-5 w-5" />} />
      </section>

      <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-12">
        <article className="space-y-3.5 xl:col-span-9">
          <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BellRing className="h-4.5 w-4.5 text-[#2A5C70]" />
                <h3 className="text-[18px] font-semibold text-[#18374B]">Alertas operacionais</h3>
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

            <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-[12px] border border-[#F2D4D4] bg-[#FFF5F5] px-3 py-2 text-[13px] text-[#8A3030]">
                Criticos: {formatNumber(contadoresAlertas.critical)}
              </div>
              <div className="rounded-[12px] border border-[#F4E1BF] bg-[#FFF8EB] px-3 py-2 text-[13px] text-[#8A5D11]">
                Warning: {formatNumber(contadoresAlertas.warning)}
              </div>
              <div className="rounded-[12px] border border-[#DDEAF0] bg-[#F4FAFD] px-3 py-2 text-[13px] text-[#2F5C72]">
                Informativos: {formatNumber(contadoresAlertas.info)}
              </div>
              <div className="rounded-[12px] border border-[#DDE7EC] bg-[#F8FBFD] px-3 py-2 text-[13px] text-[#436273]">
                Ativos: {formatNumber(contadoresAlertas.total)}
              </div>
            </div>

            {warningAlertas ? <p className="mb-3 text-[13px] text-[#A56B13]">{warningAlertas}</p> : null}

            {alertasPriorizados.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-[#DCE7EB] bg-[#FAFCFD] px-3 py-4 text-[14px] text-[#5D7785]">
                Sem alertas operacionais ativos no momento.
              </p>
            ) : (
              <div className="space-y-2.5">
                {alertasPriorizados.slice(0, 6).map((alerta) => {
                  const currentAction = alertaActionById[alerta.id];
                  const isProcessing = Boolean(currentAction);
                  return (
                    <div
                      key={alerta.id}
                      className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-semibold text-[#1C3B4E]">{alerta.titulo}</p>
                          {alerta.descricao ? (
                            <p className="mt-1 text-[13px] text-[#5F7C89]">{alerta.descricao}</p>
                          ) : null}
                          {alerta.referencia ? (
                            <p className="mt-1 text-[12px] text-[#7E96A2]">Ref: {alerta.referencia}</p>
                          ) : null}
                        </div>
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
                          {alerta.severidade}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {alerta.status === 'ativo' ? (
                          <button
                            type="button"
                            onClick={() => void atualizarAlerta(alerta, 'ack')}
                            disabled={isProcessing}
                            className="rounded-[10px] border border-[#D9E7EB] px-2.5 py-1 text-[12px] font-semibold text-[#305C70] disabled:opacity-60"
                          >
                            {currentAction === 'ack' ? 'Processando...' : 'Reconhecer'}
                          </button>
                        ) : null}
                        {isAlertaReprocessavel(alerta.tipo) ? (
                          <button
                            type="button"
                            onClick={() => void atualizarAlerta(alerta, 'reprocessar')}
                            disabled={isProcessing}
                            className="rounded-[10px] border border-[#D9E7EB] px-2.5 py-1 text-[12px] font-semibold text-[#305C70] disabled:opacity-60"
                          >
                            {currentAction === 'reprocessar' ? 'Reprocessando...' : 'Reprocessar'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void atualizarAlerta(alerta, 'resolver')}
                          disabled={isProcessing}
                          className="rounded-[10px] border border-[#D9E7EB] px-2.5 py-1 text-[12px] font-semibold text-[#305C70] disabled:opacity-60"
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
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#18374B]">Resumo operacional</h3>
              <button type="button" onClick={() => navigate('/financeiro/contas-pagar')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2A5C70]">
                Contas a pagar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <div className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3 py-2.5 text-[14px] text-[#1C3B4E]">Atrasado: {formatCurrency(totalAtrasado)}</div>
              <div className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3 py-2.5 text-[14px] text-[#1C3B4E]">Pendencias: {formatCurrency(pendenciasValor)}</div>
              <div className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3 py-2.5 text-[14px] text-[#1C3B4E]">Importacoes: {formatNumber(importacoesConciliacao.length)}</div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#18374B]">Acoes rapidas</h3>
              <button type="button" onClick={() => navigate('/financeiro/conciliacao')} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2A5C70]">
                Conciliacao
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <button type="button" onClick={() => navigate('/financeiro/aprovacoes')} className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3 py-2.5 text-left text-[14px] font-semibold text-[#1C3B4E]">Fila de aprovacoes</button>
              <button type="button" onClick={() => navigate('/financeiro/contas-bancarias')} className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3 py-2.5 text-left text-[14px] font-semibold text-[#1C3B4E]">Contas bancarias</button>
              <button type="button" onClick={() => navigate('/financeiro/contas-receber')} className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3 py-2.5 text-left text-[14px] font-semibold text-[#1C3B4E]">Contas a receber</button>
            </div>
          </div>
        </article>

        <div className="xl:col-span-3">
          <InsightsPanel insights={insights} />
        </div>
      </section>
    </div>
  );
};

export default FinanceiroDashboardV2;
