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
      const mensagem = getApiErrorMessage(error, 'Não foi possível carregar o fluxo de caixa');
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

  const painelMetricas = useMemo(
    () => [
      {
        label: 'Saldo realizado',
        value: moneyFmt.format(resumo.totais.saldoLiquidoRealizado),
        highlightClass:
          resumo.totais.saldoLiquidoRealizado >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]',
        hint: `Entradas ${moneyFmt.format(resumo.totais.entradasRealizadas)}`,
      },
      {
        label: 'Saldo previsto',
        value: moneyFmt.format(resumo.totais.saldoLiquidoPrevisto),
        highlightClass:
          resumo.totais.saldoLiquidoPrevisto >= 0 ? 'text-[#137A42]' : 'text-[#B4233A]',
        hint: `Saídas ${moneyFmt.format(resumo.totais.saidasPrevistas)}`,
      },
      {
        label: 'Entradas previstas',
        value: moneyFmt.format(projecao.totalEntradasPrevistas),
        highlightClass: 'text-[#1E66B4]',
        hint: `Horizonte ${projecao.dias} dias`,
      },
      {
        label: 'Saídas previstas',
        value: moneyFmt.format(projecao.totalSaidasPrevistas),
        highlightClass: 'text-[#A86400]',
        hint: `Saldo projetado ${moneyFmt.format(projecao.saldoProjetado)}`,
      },
    ],
    [projecao, resumo],
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
      <SectionCard className="space-y-[18px] border-[#CBDAE2] bg-gradient-to-br from-white via-white to-[#F3FAF8] shadow-[0_24px_46px_-34px_rgba(16,57,74,0.38)] p-5">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center rounded-full border border-[#BFD9E2] bg-[#EFF8FB] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3F6A7C]">
              Núcleo Financeiro
            </span>
          }
          title={
            <span className="text-[27px] font-bold leading-[1.03] tracking-[-0.018em] text-[#002333] sm:text-[28px]">
              Fluxo de <span className="text-[#0F7B7D]">Caixa</span>
            </span>
          }
          titleClassName="leading-none sm:inline-flex sm:items-center"
          description="Visão consolidada de entradas, saídas e projeções de curto prazo."
          descriptionClassName="max-w-[64ch] text-[12px] leading-[1.4] text-[#5B7A89] sm:border-l sm:border-[#D7E5EC] sm:pl-3 sm:text-[13px]"
          inlineDescriptionOnDesktop
          actions={
            <button type="button" onClick={() => void carregarDados()} className={btnSecondary}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {painelMetricas.map((item) => (
            <div key={item.label} className="rounded-xl border border-[#D2E1E8] bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5F7B89]">
                {item.label}
              </p>
              <p className={`mt-1 text-lg font-semibold ${item.highlightClass}`}>
                {loading ? '--' : item.value}
              </p>
              <p className="mt-1 text-xs text-[#688390]">{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="pt-1">
          <FiltersBar className="space-y-4 rounded-2xl border border-[#D4E1E8] bg-gradient-to-br from-[#F7FBFD] to-[#F1F7FA] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <div className="flex w-full flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[170px_170px_150px_150px_auto]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Data início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(event) => setDataInicio(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Data fim</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(event) => setDataFim(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Agrupamento</label>
                  <select
                    value={agrupamento}
                    onChange={(event) => setAgrupamento(event.target.value as AgrupamentoFluxoCaixa)}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    <option value="dia">Dia</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mês</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#385A6A]">Janela projeção</label>
                  <select
                    value={String(janelaDias)}
                    onChange={(event) => setJanelaDias(Number(event.target.value))}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    <option value="7">7 dias</option>
                    <option value="15">15 dias</option>
                    <option value="30">30 dias</option>
                    <option value="60">60 dias</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
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
            </div>
          </FiltersBar>
        </div>
      </SectionCard>

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
          title="Nenhum dado encontrado para o período"
          description="Ajuste o intervalo para consultar movimentações de caixa."
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
              <h3 className="text-sm font-semibold text-[#173A4D]">Resumo por período</h3>
              <p className="mt-0.5 text-xs text-[#5F7B89]">
                {resumo.periodoInicio} até {resumo.periodoFim} ({resumo.agrupamento})
              </p>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Período
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Entr. realizadas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saídas realizadas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Entr. previstas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saídas previstas
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
              <h3 className="text-sm font-semibold text-[#173A4D]">Projeção diária</h3>
              <p className="mt-0.5 text-xs text-[#5F7B89]">
                De {projecao.baseEm} até {projecao.ate} ({projecao.dias} dias)
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
                <p className="text-xs text-[#6A8794]">Saídas previstas</p>
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
                      Saídas
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
