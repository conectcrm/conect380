import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Calendar,
  Filter,
  LineChart,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import fluxoCaixaService from '../../../services/fluxoCaixaService';
import { AgrupamentoFluxoCaixa, ProjecaoFluxoCaixa, ResumoFluxoCaixa } from '../../../types/financeiro';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const makeMonthBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const toDateValue = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    dataInicio: toDateValue(start),
    dataFim: toDateValue(end),
  };
};

const resumoInicial: ResumoFluxoCaixa = {
  periodoInicio: '',
  periodoFim: '',
  agrupamento: 'dia',
  totais: {
    entradasRealizadas: 0,
    saidasRealizadas: 0,
    entradasPrevistas: 0,
    saidasPrevistas: 0,
    saldoLiquidoRealizado: 0,
    saldoLiquidoPrevisto: 0,
  },
  serie: [],
};

const projecaoInicial: ProjecaoFluxoCaixa = {
  baseEm: '',
  ate: '',
  dias: 30,
  totalEntradasPrevistas: 0,
  totalSaidasPrevistas: 0,
  saldoProjetado: 0,
  itens: [],
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
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
      const firstMessage = message.find((item) => typeof item === 'string' && item.trim());
      if (firstMessage) {
        return firstMessage.trim();
      }
    }
  }

  return fallback;
};

export default function FluxoCaixaPage() {
  const monthBounds = useMemo(() => makeMonthBounds(), []);

  const [dataInicio, setDataInicio] = useState(monthBounds.dataInicio);
  const [dataFim, setDataFim] = useState(monthBounds.dataFim);
  const [agrupamento, setAgrupamento] = useState<AgrupamentoFluxoCaixa>('dia');
  const [janelaDias, setJanelaDias] = useState(30);

  const [resumo, setResumo] = useState<ResumoFluxoCaixa>(resumoInicial);
  const [projecao, setProjecao] = useState<ProjecaoFluxoCaixa>(projecaoInicial);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = async (overrides?: {
    dataInicio?: string;
    dataFim?: string;
    agrupamento?: AgrupamentoFluxoCaixa;
    janelaDias?: number;
  }) => {
    const filtrosResumo = {
      dataInicio: overrides?.dataInicio ?? dataInicio,
      dataFim: overrides?.dataFim ?? dataFim,
      agrupamento: overrides?.agrupamento ?? agrupamento,
    };

    const filtrosProjecao = {
      janelaDias: overrides?.janelaDias ?? janelaDias,
    };

    try {
      setLoading(true);
      setErro(null);

      const [dadosResumo, dadosProjecao] = await Promise.all([
        fluxoCaixaService.obterResumo(filtrosResumo),
        fluxoCaixaService.obterProjecao(filtrosProjecao),
      ]);

      setResumo(dadosResumo || resumoInicial);
      setProjecao(dadosProjecao || projecaoInicial);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel carregar o fluxo de caixa');
      setErro(mensagem);
      setResumo(resumoInicial);
      setProjecao(projecaoInicial);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Saldo realizado',
        value: moneyFmt.format(resumo.totais.saldoLiquidoRealizado),
        tone: resumo.totais.saldoLiquidoRealizado >= 0 ? ('accent' as const) : ('warning' as const),
      },
      {
        label: 'Saldo previsto',
        value: moneyFmt.format(resumo.totais.saldoLiquidoPrevisto),
        tone: resumo.totais.saldoLiquidoPrevisto >= 0 ? ('accent' as const) : ('warning' as const),
      },
      {
        label: 'Entradas previstas',
        value: moneyFmt.format(projecao.totalEntradasPrevistas),
        tone: 'neutral' as const,
      },
      {
        label: 'Saidas previstas',
        value: moneyFmt.format(projecao.totalSaidasPrevistas),
        tone: 'neutral' as const,
      },
    ],
    [resumo, projecao],
  );

  const hasFilters =
    dataInicio !== monthBounds.dataInicio ||
    dataFim !== monthBounds.dataFim ||
    agrupamento !== 'dia' ||
    janelaDias !== 30;

  const buscar = async () => {
    await carregarDados();
  };

  const limparFiltros = async () => {
    const defaults = makeMonthBounds();
    setDataInicio(defaults.dataInicio);
    setDataFim(defaults.dataFim);
    setAgrupamento('dia');
    setJanelaDias(30);
    await carregarDados({
      dataInicio: defaults.dataInicio,
      dataFim: defaults.dataFim,
      agrupamento: 'dia',
      janelaDias: 30,
    });
  };

  return (
    <div className="space-y-5">
      <SectionCard className="space-y-4 p-5">
        <PageHeader
          title="Fluxo de Caixa"
          description="Consolidado de entradas e saidas realizadas, previstas e projecao de curto prazo."
          actions={
            <button type="button" onClick={() => void carregarDados()} className={btnSecondary}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          }
        />

        {!loading && !erro ? <InlineStats stats={stats} /> : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Data inicio</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(event) => setDataInicio(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Data fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(event) => setDataFim(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Agrupamento</label>
            <select
              value={agrupamento}
              onChange={(event) => setAgrupamento(event.target.value as AgrupamentoFluxoCaixa)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[150px]"
            >
              <option value="dia">Dia</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Janela projecao</label>
            <select
              value={String(janelaDias)}
              onChange={(event) => setJanelaDias(Number(event.target.value))}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[150px]"
            >
              <option value="7">7 dias</option>
              <option value="15">15 dias</option>
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
            </select>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => void buscar()} className={btnPrimary}>
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button
              type="button"
              onClick={() => void limparFiltros()}
              className={btnSecondary}
              disabled={!hasFilters}
            >
              <Filter className="h-4 w-4" />
              Limpar
            </button>
          </div>
        </div>
      </FiltersBar>

      {loading ? <LoadingSkeleton lines={8} /> : null}

      {!loading && erro ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar fluxo de caixa"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarDados()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!loading && !erro && resumo.serie.length === 0 ? (
        <EmptyState
          icon={<LineChart className="h-5 w-5" />}
          title="Nenhum dado encontrado para o periodo"
          description="Ajuste o intervalo para consultar movimentacoes de caixa."
          action={
            hasFilters ? (
              <button type="button" onClick={() => void limparFiltros()} className={btnSecondary}>
                <Filter className="h-4 w-4" />
                Limpar filtros
              </button>
            ) : undefined
          }
        />
      ) : null}

      {!loading && !erro && resumo.serie.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DataTableCard>
            <div className="border-b border-[#E1EAEE] bg-[#F8FBFC] px-5 py-3">
              <h3 className="text-sm font-semibold text-[#173A4D]">Resumo por periodo</h3>
              <p className="mt-0.5 text-xs text-[#5F7B89]">
                {resumo.periodoInicio} ate {resumo.periodoFim} ({resumo.agrupamento})
              </p>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Periodo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Entr. realizadas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saidas realizadas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Entr. previstas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saidas previstas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.serie.map((item) => (
                    <tr
                      key={`${item.periodoInicio}-${item.periodoFim}`}
                      className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]"
                    >
                      <td className="px-4 py-3 text-sm text-[#173A4D]">
                        {item.periodoInicio === item.periodoFim
                          ? item.periodoInicio
                          : `${item.periodoInicio} - ${item.periodoFim}`}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#137A42]">
                        {moneyFmt.format(item.entradasRealizadas)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#B4233A]">
                        {moneyFmt.format(item.saidasRealizadas)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#1E66B4]">
                        {moneyFmt.format(item.entradasPrevistas)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#A86400]">
                        {moneyFmt.format(item.saidasPrevistas)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold ${
                          item.saldoLiquido >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]'
                        }`}
                      >
                        {moneyFmt.format(item.saldoLiquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataTableCard>

          <DataTableCard>
            <div className="border-b border-[#E1EAEE] bg-[#F8FBFC] px-5 py-3">
              <h3 className="text-sm font-semibold text-[#173A4D]">Projecao diaria</h3>
              <p className="mt-0.5 text-xs text-[#5F7B89]">
                De {projecao.baseEm} ate {projecao.ate} ({projecao.dias} dias)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-[#EDF3F5] bg-white p-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="text-xs text-[#6A8794]">Entradas previstas</p>
                <p className="mt-1 text-sm font-semibold text-[#137A42]">
                  {moneyFmt.format(projecao.totalEntradasPrevistas)}
                </p>
              </div>
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="text-xs text-[#6A8794]">Saidas previstas</p>
                <p className="mt-1 text-sm font-semibold text-[#B4233A]">
                  {moneyFmt.format(projecao.totalSaidasPrevistas)}
                </p>
              </div>
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="text-xs text-[#6A8794]">Saldo projetado</p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    projecao.saldoProjetado >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]'
                  }`}
                >
                  {moneyFmt.format(projecao.saldoProjetado)}
                </p>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Data
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Entradas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saidas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saldo acumulado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projecao.itens.map((item) => (
                    <tr key={item.data} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                      <td className="px-4 py-3 text-sm text-[#173A4D]">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-[#7C97A4]" />
                          {item.data}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#137A42]">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {moneyFmt.format(item.entradasPrevistas)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#B4233A]">
                        <span className="inline-flex items-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {moneyFmt.format(item.saidasPrevistas)}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold ${
                          item.saldoProjetadoAcumulado >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]'
                        }`}
                      >
                        {moneyFmt.format(item.saldoProjetadoAcumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataTableCard>
        </div>
      ) : null}
    </div>
  );
}
