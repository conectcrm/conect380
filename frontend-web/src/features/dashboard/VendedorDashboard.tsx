import React, { useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  Clock3,
  Flame,
  Gauge,
  Mail,
  Phone,
  RefreshCw,
  Snowflake,
  Star,
  Target,
  ThermometerSun,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import {
  useVendedorDashboard,
  type VendedorDashboardPeriodo,
} from '../../hooks/useVendedorDashboard';
import { useAuth } from '../../contexts/AuthContext';
import GoalProgressCard from '../dashboard-v2/components/GoalProgressCard';
import KpiTrendCard from '../dashboard-v2/components/KpiTrendCard';

const vendedorPeriodOptions: Array<{ value: VendedorDashboardPeriodo; label: string }> = [
  { value: 'semanal', label: 'Semana atual' },
  { value: 'mensal', label: 'Mes atual' },
  { value: 'trimestral', label: 'Trimestre atual' },
  { value: 'semestral', label: 'Semestre atual' },
  { value: 'anual', label: 'Ano atual' },
];

const vendedorQuickPeriodChips: Array<{ value: VendedorDashboardPeriodo; label: string }> = [
  { value: 'semanal', label: 'Semana' },
  { value: 'mensal', label: 'Mes' },
  { value: 'trimestral', label: 'Trimestre' },
  { value: 'anual', label: 'Ano' },
];

const vendedorPeriodLabels: Record<VendedorDashboardPeriodo, string> = {
  semanal: 'Semana atual',
  mensal: 'Mes atual',
  trimestral: 'Trimestre atual',
  semestral: 'Semestre atual',
  anual: 'Ano atual',
};

const statusMetaLabelMap: Record<string, string> = {
  superada: 'Meta superada',
  quase_la: 'Quase la',
  caminho_certo: 'Em caminho certo',
  atencao: 'Em atencao',
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

const formatNumber = (value: number): string =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatNullableNumber = (value: number | null | undefined): string =>
  typeof value === 'number' ? formatNumber(value) : 'N/D';

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

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

const propostaStyleByTemperature = (
  temperatura: 'quente' | 'morno' | 'frio',
): {
  wrapper: string;
  badge: string;
  value: string;
  progress: string;
} => {
  if (temperatura === 'quente') {
    return {
      wrapper: 'border-[#CFE8D5] bg-[#F2FBF5]',
      badge: 'bg-[#2D8D57] text-white',
      value: 'text-[#1E6D41]',
      progress: 'bg-[#3CA66A]',
    };
  }
  if (temperatura === 'morno') {
    return {
      wrapper: 'border-[#F0DEB7] bg-[#FFF9EE]',
      badge: 'bg-[#C68A2A] text-white',
      value: 'text-[#9E6618]',
      progress: 'bg-[#E0A63B]',
    };
  }
  return {
    wrapper: 'border-[#DCE7EB] bg-[#F8FBFC]',
    badge: 'bg-[#6F8591] text-white',
    value: 'text-[#506876]',
    progress: 'bg-[#8AA1AD]',
  };
};

const alertaSeverityColor = (severity: 'baixa' | 'media' | 'alta' | 'critica'): string => {
  if (severity === 'critica') return 'bg-[#FCEAEC] text-[#B4364D]';
  if (severity === 'alta') return 'bg-[#FFF2E5] text-[#B86417]';
  if (severity === 'media') return 'bg-[#FFF8E2] text-[#9A7411]';
  return 'bg-[#EAF5FA] text-[#2C708D]';
};

type VendedorInsights = {
  statusMeta?: string;
  produtividadeDiaria?: number;
  efetividadePipeline?: number;
  projecaoMensal?: number;
  performanceGeral?: number;
};

const VendedorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<VendedorDashboardPeriodo>('mensal');
  const { data, loading, error, refresh, insights, lastUpdatedAt } = useVendedorDashboard({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000,
    periodo,
  });

  if (loading && !data.kpis.meta) {
    return (
      <div className="rounded-[20px] border border-[#DCE6EA] bg-white p-5 shadow-[0_10px_28px_-22px_rgba(15,55,71,0.45)]">
        <RefreshCw className="mb-3 h-8 w-8 animate-spin text-[#159A9C]" />
        <h3 className="text-xl font-semibold text-[#173548]">Carregando dashboard</h3>
        <p className="mt-2 text-sm text-[#5E7A88]">Buscando indicadores do vendedor...</p>
      </div>
    );
  }

  if (error && !data.kpis.meta) {
    return (
      <section className="rounded-[20px] border border-[#F1D3D8] bg-[#FFF5F7] p-5">
        <h2 className="text-xl font-semibold text-[#8A2335]">Falha ao carregar dashboard</h2>
        <p className="mt-2 text-sm text-[#8A2335]">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C53A53] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A93247]"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!data.kpis.meta) {
    return (
      <section className="rounded-[20px] border border-[#DCE6EA] bg-white p-5 shadow-[0_10px_28px_-22px_rgba(15,55,71,0.45)]">
        <h2 className="text-xl font-semibold text-[#173548]">Sem dados no Dashboard Vendedor</h2>
        <p className="mt-2 text-sm text-[#5E7A88]">
          Sincronize os dados para gerar os indicadores comerciais.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3.5">
        <div className="h-9 w-40 animate-pulse rounded-xl bg-[#E6EFF0]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1850px]:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[232px] animate-pulse rounded-[20px] bg-[#E6EFF0]" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, propostas, agenda, leads, alertas } = data;
  const insightData = insights as VendedorInsights;

  const totalAtividadesHoje =
    (kpis.atividades?.hoje?.calls || 0) +
    (kpis.atividades?.hoje?.reunioes || 0) +
    (kpis.atividades?.hoje?.followups || 0);

  const totalAtividadesHojeCompleto =
    totalAtividadesHoje +
    (kpis.atividades?.hoje?.emails || 0) +
    (kpis.atividades?.hoje?.propostas || 0);

  const totalAtividadesSemana =
    (kpis.atividades?.semana?.calls || 0) +
    (kpis.atividades?.semana?.reunioes || 0) +
    (kpis.atividades?.semana?.followups || 0);

  const totalAtividadesSemanaCompleto =
    totalAtividadesSemana +
    (kpis.atividades?.semana?.emails || 0) +
    (kpis.atividades?.semana?.propostas || 0);

  const callsMetaDiaria = kpis.atividades?.metas?.callsDiarias;
  const followupsMetaDiaria = kpis.atividades?.metas?.followupsDiarios;
  const reunioesMetaSemanal = kpis.atividades?.metas?.reunioesSemana;
  const hasMetaAtividade =
    typeof callsMetaDiaria === 'number' ||
    typeof followupsMetaDiaria === 'number' ||
    typeof reunioesMetaSemanal === 'number';
  const atividadeMetaHoje =
    (callsMetaDiaria || 0) + (followupsMetaDiaria || 0) + (reunioesMetaSemanal || 0) / 5;
  const atividadeExecutionPercent =
    hasMetaAtividade && atividadeMetaHoje > 0 ? (totalAtividadesHoje / atividadeMetaHoje) * 100 : 0;

  const ritmoDiarioTrendPercent =
    (kpis.meta?.metaDiaria || 0) > 0
      ? (((kpis.meta?.mediaVendasDiarias || 0) - (kpis.meta?.metaDiaria || 0)) /
          (kpis.meta?.metaDiaria || 1)) *
        100
      : 0;

  const rankingMeta = kpis.ranking?.meta || 0;
  const rankingProgressPercent = rankingMeta > 0 ? (kpis.ranking?.vendas / rankingMeta) * 100 : 0;

  const pipelineDistribRows = [
    {
      id: 'quente',
      label: 'Quente',
      icon: <Flame className="h-3.5 w-3.5 text-[#2D8D57]" />,
      color: 'bg-[#3CA66A]',
      quantidade: kpis.pipeline?.distribuicao?.quente?.quantidade || 0,
      valor: kpis.pipeline?.distribuicao?.quente?.valor || 0,
    },
    {
      id: 'morno',
      label: 'Morno',
      icon: <ThermometerSun className="h-3.5 w-3.5 text-[#C68A2A]" />,
      color: 'bg-[#E0A63B]',
      quantidade: kpis.pipeline?.distribuicao?.morno?.quantidade || 0,
      valor: kpis.pipeline?.distribuicao?.morno?.valor || 0,
    },
    {
      id: 'frio',
      label: 'Frio',
      icon: <Snowflake className="h-3.5 w-3.5 text-[#5B839A]" />,
      color: 'bg-[#8AA1AD]',
      quantidade: kpis.pipeline?.distribuicao?.frio?.quantidade || 0,
      valor: kpis.pipeline?.distribuicao?.frio?.valor || 0,
    },
  ];

  const totalPipelineDistribuicao = pipelineDistribRows.reduce(
    (total, row) => total + row.quantidade,
    0,
  );
  const statusMetaKey = String(insightData.statusMeta || 'atencao');
  const statusMetaLabel = statusMetaLabelMap[statusMetaKey] || 'Sem dados';
  const statusMetaTone =
    statusMetaKey === 'superada'
      ? 'bg-[#E8F6F4] text-[#166A6B]'
      : statusMetaKey === 'quase_la' || statusMetaKey === 'caminho_certo'
        ? 'bg-[#EAF5FA] text-[#2C708D]'
        : 'bg-[#FFF4E9] text-[#A06213]';

  const desempenhoSemanalPercent = clampPercent((kpis.performance?.nota || 0) * 10);
  const taxaConversao = kpis.performance?.taxaConversao || 0;
  const metaProgress = clampPercent(kpis.meta?.percentual || 0);
  const faltamMeta = Math.max(0, (kpis.meta?.mensal || 0) - (kpis.meta?.atual || 0));
  const hasActiveFilters = periodo !== 'mensal';
  const ultimaAtualizacaoLabel = lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'Atualizado agora';
  const horaAtual = new Date().getHours();
  const saudacaoPeriodo = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome =
    user?.nome && user.nome.trim().length > 0 ? user.nome.trim().split(/\s+/)[0] : 'vendedor';
  const empresaLabel = user?.empresa?.nome || 'sua carteira';
  const saudacaoTitulo = `${saudacaoPeriodo}, ${primeiroNome}`;

  return (
    <div className="space-y-4">
      <section className="mb-6 rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Dashboard Comercial
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              {saudacaoTitulo}
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Painel individual de vendas em{' '}
              <span className="font-semibold text-[#1D4F63]">{empresaLabel}</span>.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                Atualizado: {ultimaAtualizacaoLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D3E4E8] bg-white px-2.5 py-1 text-[12px] font-medium text-[#466777]">
                {vendedorPeriodLabels[periodo]}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusMetaTone}`}
              >
                {statusMetaLabel}
              </span>
            </div>
          </div>

          <div className="w-full rounded-[14px] border border-[#D5E3E8] bg-white/80 p-3.5 xl:w-auto xl:min-w-[470px]">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="dashboard-vendedor-periodo"
                className="text-[13px] font-medium text-[#567583]"
              >
                Periodo
              </label>
              <select
                id="dashboard-vendedor-periodo"
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as VendedorDashboardPeriodo)}
                className="rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] text-[#244556] focus:border-[#159A9C] focus:outline-none"
              >
                {vendedorPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setPeriodo('mensal')}
                disabled={!hasActiveFilters}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar filtros
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#D5E3E8] bg-white px-3 py-2 text-[13px] font-semibold text-[#26495C] hover:bg-[#F3F9F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            <div
              className="mt-2.5 flex w-full flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Atalhos de periodo"
            >
              {vendedorQuickPeriodChips.map((chip) => {
                const isActive = periodo === chip.value;

                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setPeriodo(chip.value)}
                    className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                      isActive
                        ? 'border-[#159A9C] bg-[#E8F6F4] text-[#186A6B]'
                        : 'border-[#D5E3E8] bg-white text-[#5E7A88] hover:border-[#BFD5DD] hover:text-[#244556]'
                    }`}
                    aria-pressed={isActive}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Ranking</p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                #{kpis.ranking?.posicao || 0} de {kpis.ranking?.total || 0}
              </p>
            </div>
            <Trophy className="h-5 w-5 text-[#159A9C]" />
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">Meta concluida</p>
              <p className="text-[16px] font-semibold text-[#18374B]">{metaProgress.toFixed(0)}%</p>
            </div>
            <Target className="h-5 w-5 text-[#159A9C]" />
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[#DCE7EB] bg-white/90 px-3 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A929E]">
                Performance geral
              </p>
              <p className="text-[16px] font-semibold text-[#18374B]">
                {formatNumber(insightData.performanceGeral || 0)} pts
              </p>
            </div>
            <Gauge className="h-5 w-5 text-[#159A9C]" />
          </div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[#DEEFE7]">
          <div
            className="bg-[#159A9C] h-2 rounded-full transition-all"
            style={{ width: `${metaProgress}%` }}
          />
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <KpiTrendCard
          title="Meta atual"
          featureHint="Mostra o progresso da meta no periodo e quanto ainda falta para bater o objetivo."
          value={formatCurrency(kpis.meta?.atual || 0)}
          trendPercent={ritmoDiarioTrendPercent}
          trendLabel="ritmo diario vs meta diaria"
          sparkline={[
            kpis.meta?.metaDiaria || 0,
            kpis.meta?.mediaVendasDiarias || 0,
            kpis.meta?.atual || 0,
          ]}
          progressPercent={metaProgress}
          progressTone="amber"
          footerLeft={`Meta do periodo: ${formatCurrency(kpis.meta?.mensal || 0)}`}
          footerRight={`Faltam ${formatCurrency(faltamMeta)}`}
          icon={<Target className="h-5 w-5" />}
        />

        <KpiTrendCard
          title="Pipeline em negociacao"
          featureHint="Mostra o valor em negociacao, volume de propostas ativas e chance media de conversao."
          value={formatCurrency(kpis.pipeline?.valor || 0)}
          trendPercent={taxaConversao}
          trendLabel="chance media de conversao"
          progressPercent={clampPercent(kpis.pipeline?.probabilidade || 0)}
          progressTone="teal"
          footerLeft={`${formatNumber(kpis.pipeline?.quantidade || 0)} propostas ativas`}
          footerRight={`Ponderado: ${formatCurrency(insightData.efetividadePipeline || 0)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <KpiTrendCard
          title="Ranking"
          featureHint="Mostra sua posicao no ranking comercial, variacao e comparativo com a meta."
          value={`#${formatNumber(kpis.ranking?.posicao || 0)}`}
          trendPercent={kpis.ranking?.variacao || 0}
          trendLabel={kpis.ranking?.nivel || 'sem badge'}
          progressPercent={clampPercent(rankingProgressPercent)}
          progressTone="teal"
          footerLeft={`Vendas: ${formatCurrency(kpis.ranking?.vendas || 0)}`}
          footerRight={
            (kpis.ranking?.meta || 0) > 0
              ? `Meta: ${formatCurrency(kpis.ranking?.meta || 0)}`
              : 'Meta: N/D'
          }
          icon={<Trophy className="h-5 w-5" />}
        />

        <KpiTrendCard
          title="Atividades hoje"
          featureHint="Mostra execucao diaria de atividades comerciais versus meta definida."
          value={formatNumber(totalAtividadesHoje)}
          valueSuffix="acoes"
          trendPercent={hasMetaAtividade ? atividadeExecutionPercent - 100 : 0}
          trendLabel={hasMetaAtividade ? 'execucao vs meta diaria' : 'sem meta diaria definida'}
          progressPercent={hasMetaAtividade ? clampPercent(atividadeExecutionPercent) : 0}
          progressTone="teal"
          footerLeft={`Calls ${formatNumber(kpis.atividades?.hoje?.calls || 0)} | Reunioes ${formatNumber(kpis.atividades?.hoje?.reunioes || 0)}`}
          footerRight={`Follow-ups ${formatNumber(kpis.atividades?.hoje?.followups || 0)}`}
          icon={<Calendar className="h-5 w-5" />}
        />

        <GoalProgressCard
          title="Performance semanal"
          featureHint="Resume nota semanal, taxa de conversao e ticket medio para acompanhar qualidade comercial."
          primaryValue={(kpis.performance?.nota || 0).toFixed(1)}
          primaryLabel="Nota"
          secondaryValue={`${(kpis.performance?.taxaConversao || 0).toFixed(1)}%`}
          secondaryLabel="Taxa conversao"
          trendPercent={desempenhoSemanalPercent - 70}
          progressPercent={desempenhoSemanalPercent}
          projectionLabel={`Ticket medio: ${formatCurrency(kpis.performance?.ticketMedio || 0)}`}
          icon={<Activity className="h-5 w-5" />}
        />
      </section>

      <section className="mb-8 rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Propostas em negociacao</h3>
          <span className="text-sm text-gray-500">{propostas.length} propostas ativas</span>
        </div>

        {propostas.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhuma proposta ativa no momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {propostas.map((proposta) => {
              const styles = propostaStyleByTemperature(proposta.temperatura);
              return (
                <div key={proposta.id} className={`p-4 border rounded-lg ${styles.wrapper}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${styles.badge}`}>
                      {proposta.temperatura.toUpperCase()}
                    </span>
                    <span className={`text-sm font-bold ${styles.value}`}>
                      {formatCurrency(proposta.valor)}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">{proposta.cliente}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Prazo {proposta.prazo ? formatDate(proposta.prazo) : 'N/D'}{' '}
                    {typeof proposta.diasAteVencimento === 'number'
                      ? `(${proposta.diasAteVencimento}d)`
                      : ''}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full ${styles.progress}`}
                      style={{ width: `${clampPercent(proposta.probabilidade || 0)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600">Prob. {proposta.probabilidade}%</span>
                    <span className="text-xs font-medium text-[#159A9C]">
                      {proposta.proximaAcao}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
          Indicadores adicionais
        </h3>
        <p className="mt-1 text-[13px] text-[#617D89]">
          KPIs que faltavam no painel do vendedor, agora no padrao do dashboard global.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-[14px] border border-[#E1EBEE] bg-[#FBFEFF] p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
              Ritmo de meta
            </p>
            <p className="mt-2 text-[13px] text-[#5E7A88]">
              Meta diaria:{' '}
              <span className="font-semibold text-[#17384B]">
                {formatCurrency(kpis.meta?.metaDiaria || 0)}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#5E7A88]">
              Media diaria:{' '}
              <span className="font-semibold text-[#17384B]">
                {formatCurrency(kpis.meta?.mediaVendasDiarias || 0)}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#5E7A88]">
              Dias restantes:{' '}
              <span className="font-semibold text-[#17384B]">
                {formatNumber(kpis.meta?.diasRestantes || 0)}
              </span>
            </p>
          </div>

          <div className="rounded-[14px] border border-[#E1EBEE] bg-[#FBFEFF] p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
              Distribuicao do pipeline
            </p>
            <div className="mt-3 space-y-2.5">
              {totalPipelineDistribuicao === 0 && (kpis.pipeline?.quantidade || 0) > 0 ? (
                <p className="text-[12px] text-[#6D8793]">
                  Sem detalhamento real por temperatura para este periodo.
                </p>
              ) : (
                pipelineDistribRows.map((row) => {
                  const rowPercent =
                    totalPipelineDistribuicao > 0
                      ? (row.quantidade / totalPipelineDistribuicao) * 100
                      : 0;

                  return (
                    <div key={row.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#264A5E]">
                          {row.icon}
                          {row.label}
                        </span>
                        <span className="text-[#5E7A88]">
                          {formatNumber(row.quantidade)} ({formatCurrency(row.valor)})
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#E4ECEF]">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${Math.max(rowPercent, rowPercent > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E1EBEE] bg-[#FBFEFF] p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
              Qualidade comercial
            </p>
            <p className="mt-2 text-[13px] text-[#5E7A88]">
              Ticket medio:{' '}
              <span className="font-semibold text-[#17384B]">
                {formatCurrency(kpis.performance?.ticketMedio || 0)}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#5E7A88]">
              Ciclo medio:{' '}
              <span className="font-semibold text-[#17384B]">
                {(kpis.performance?.tempoMedioCiclo || 0).toFixed(1)} dias
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#5E7A88]">
              Satisfacao:{' '}
              <span className="font-semibold text-[#17384B]">
                {typeof kpis.performance?.satisfacaoCliente === 'number'
                  ? `${kpis.performance.satisfacaoCliente.toFixed(1)}/5`
                  : 'N/D'}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#5E7A88]">
              Projecao mensal:{' '}
              <span className="font-semibold text-[#17384B]">
                {formatCurrency(insightData.projecaoMensal || 0)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[12px] border border-[#E1EBEE] bg-[#FBFEFF] p-3 text-[12px] text-[#5E7A88]">
            Hoje (completo):{' '}
            <span className="font-semibold text-[#17384B]">
              {formatNumber(totalAtividadesHojeCompleto)}
            </span>
          </div>
          <div className="rounded-[12px] border border-[#E1EBEE] bg-[#FBFEFF] p-3 text-[12px] text-[#5E7A88]">
            Semana (completo):{' '}
            <span className="font-semibold text-[#17384B]">
              {formatNumber(totalAtividadesSemanaCompleto)}
            </span>
          </div>
          <div className="rounded-[12px] border border-[#E1EBEE] bg-[#FBFEFF] p-3 text-[12px] text-[#5E7A88]">
            Meta calls/dia:{' '}
            <span className="font-semibold text-[#17384B]">
              {formatNullableNumber(kpis.atividades?.metas?.callsDiarias)}
            </span>
          </div>
          <div className="rounded-[12px] border border-[#E1EBEE] bg-[#FBFEFF] p-3 text-[12px] text-[#5E7A88]">
            Meta follow-up/dia:{' '}
            <span className="font-semibold text-[#17384B]">
              {formatNullableNumber(kpis.atividades?.metas?.followupsDiarios)}
            </span>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Agenda comercial</h3>
            <span className="text-sm text-gray-500">{agenda.length} eventos</span>
          </div>

          {agenda.length === 0 ? (
            <p className="text-sm text-gray-600">
              Sem compromissos cadastrados para os proximos dias.
            </p>
          ) : (
            <div className="space-y-3">
              {agenda.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-center p-3 bg-gray-50 rounded-lg border-l-4 border-[#159A9C]"
                >
                  <div className="p-2 bg-[#159A9C]/10 rounded-full mr-3">
                    {evento.tipo === 'call' && <Phone className="w-4 h-4 text-[#159A9C]" />}
                    {evento.tipo === 'reuniao' && <Users className="w-4 h-4 text-[#159A9C]" />}
                    {evento.tipo === 'email' && <Mail className="w-4 h-4 text-[#159A9C]" />}
                    {evento.tipo !== 'call' &&
                      evento.tipo !== 'reuniao' &&
                      evento.tipo !== 'email' && <Clock3 className="w-4 h-4 text-[#159A9C]" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{evento.titulo}</p>
                    <p className="text-sm text-gray-600">
                      {evento.horario} - {evento.duracao} min
                    </p>
                  </div>
                  <span className="text-xs text-[#159A9C] font-medium uppercase">
                    {evento.prioridade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Leads para atuar</h3>
            <span className="text-sm text-gray-500">{leads.length} leads</span>
          </div>

          {leads.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum lead pendente para este vendedor.</p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{lead.nome}</p>
                    <p className="text-sm text-gray-600">
                      {lead.empresa} - score {lead.score}
                    </p>
                  </div>
                  <span className="text-xs bg-[#159A9C] text-white px-3 py-1 rounded">
                    {lead.proximaAcao}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-[#159A9C]" />
            <h3 className="text-lg font-semibold text-gray-900">Alertas inteligentes</h3>
          </div>
          {alertas.length === 0 ? (
            <p className="text-sm text-gray-600">Sem alertas ativos para este periodo.</p>
          ) : (
            <div className="space-y-3">
              {alertas.slice(0, 5).map((alerta) => (
                <div key={alerta.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{alerta.titulo}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${alertaSeverityColor(alerta.severidade)}`}
                    >
                      {alerta.severidade}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{alerta.descricao}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance da semana</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Atividades na semana</p>
              <p className="text-2xl font-bold text-[#002333]">{totalAtividadesSemana}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Taxa de conversao</p>
              <p className="text-2xl font-bold text-[#002333]">{taxaConversao.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Emails na semana</p>
              <p className="text-2xl font-bold text-[#002333]">
                {kpis.atividades?.semana?.emails || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Propostas na semana</p>
              <p className="text-2xl font-bold text-[#002333]">
                {kpis.atividades?.semana?.propostas || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nota geral</p>
              <p className="text-3xl font-bold text-[#002333]">{kpis.performance?.nota || 0}</p>
            </div>
            <div className="flex items-center gap-1 text-[#159A9C]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`w-5 h-5 ${
                    index < (kpis.performance?.estrelas || 0) ? 'fill-current' : 'opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">Status da meta: {statusMetaLabel}</p>
        </div>
      </section>
    </div>
  );
};

export default VendedorDashboard;
