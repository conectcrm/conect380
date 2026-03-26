import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, ExternalLink, Gauge, Sparkles } from 'lucide-react';
import { DashboardV2Insight } from '../useDashboardV2';

type InsightsPanelProps = {
  insights: DashboardV2Insight[];
  headerAction?: React.ReactNode;
  onInsightClick?: (insight: DashboardV2Insight) => void;
  onShareClick?: () => void;
};

type InsightCardTone = {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  iconSurface: string;
};

const toneMap: Record<DashboardV2Insight['type'], InsightCardTone> = {
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-[#D29414]',
    iconSurface: 'bg-[#FFF6E8]',
  },
  opportunity: {
    icon: Sparkles,
    iconClass: 'text-[#1A9B84]',
    iconSurface: 'bg-[#ECF8F3]',
  },
  info: {
    icon: AlertCircle,
    iconClass: 'text-[#4E8296]',
    iconSurface: 'bg-[#EDF5F8]',
  },
};

const impactLabel: Record<DashboardV2Insight['impact'], string> = {
  alto: 'Alta prioridade',
  medio: 'Média prioridade',
  baixo: 'Baixa prioridade',
};

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  headerAction,
  onInsightClick,
  onShareClick,
}) => {
  const primaryInsights = insights.slice(0, 3);
  const isInsightInteractive = typeof onInsightClick === 'function';
  const shareDisabled = typeof onShareClick !== 'function';
  const summary = useMemo(
    () => ({
      warning: insights.filter((insight) => insight.type === 'warning').length,
      opportunity: insights.filter((insight) => insight.type === 'opportunity').length,
      highImpact: insights.filter((insight) => insight.impact === 'alto').length,
    }),
    [insights],
  );

  const reportInsights = useMemo(() => insights.slice(3, 5), [insights]);

  return (
    <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Insights</h3>
          <p className="mt-1 text-[13px] text-[#6B8591]">Leituras prioritárias e sinais de decisão do período.</p>
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          <button
            type="button"
            onClick={onShareClick}
            disabled={shareDisabled}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D7E4E8] text-[#5E7A88] transition ${
              shareDisabled
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-[#F4FBF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35'
            }`}
            aria-label="Compartilhar insights"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[#E1EBEE] bg-[#FBFEFF] px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
            Oportunidades
          </p>
          <p className="mt-1 text-[22px] font-semibold leading-none text-[#17384B]">{summary.opportunity}</p>
        </div>
        <div className="rounded-[14px] border border-[#E1EBEE] bg-[#FBFEFF] px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
            Alertas
          </p>
          <p className="mt-1 text-[22px] font-semibold leading-none text-[#17384B]">{summary.warning}</p>
        </div>
        <div className="rounded-[14px] border border-[#E1EBEE] bg-[#FBFEFF] px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
            Alta prioridade
          </p>
          <p className="mt-1 text-[22px] font-semibold leading-none text-[#17384B]">{summary.highImpact}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {primaryInsights.length ? (
          primaryInsights.map((insight) => {
            const tone = toneMap[insight.type] || toneMap.info;
            const Icon = tone.icon;
            const Container: React.ElementType = isInsightInteractive ? 'button' : 'article';

            return (
              <Container
                key={insight.id}
                {...(isInsightInteractive
                  ? {
                      type: 'button' as const,
                      onClick: () => onInsightClick?.(insight),
                      'aria-label': `Abrir insight: ${insight.title}`,
                    }
                  : {})}
                className={`group w-full rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 text-left ${
                  isInsightInteractive
                    ? 'transition hover:border-[#D1E1E6] hover:bg-[#FBFEFD] hover:shadow-[0_10px_18px_-18px_rgba(16,62,83,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${tone.iconSurface}`}>
                        <Icon className={`h-3.5 w-3.5 ${tone.iconClass}`} />
                      </span>
                      <p className="text-[16px] font-semibold leading-tight text-[#173548]">
                        {insight.title}
                      </p>
                    </div>
                    <p className="mt-1.5 pl-8 text-[14px] leading-relaxed text-[#5F7C89]">{insight.description}</p>
                    <p className="mt-1 pl-8 text-[13px] text-[#8BA0AA]">{insight.action || impactLabel[insight.impact]}</p>
                  </div>
                  <ArrowRight className="mt-2 h-4 w-4 flex-shrink-0 text-[#7A93A0] transition group-hover:translate-x-0.5" />
                </div>
              </Container>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#CFE0E6] bg-[#F7FBFC] px-3 py-3.5 text-[11px] text-[#5E7A88]">
            Sem insights para o período selecionado.
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#E3ECEF] pt-4">
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <div>
            <h4 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Leituras adicionais</h4>
            <p className="mt-1 text-[13px] text-[#6B8591]">Contextos complementares para validar a leitura principal.</p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#6E8996]">
            <Gauge className="h-[19px] w-[19px]" />
          </span>
        </div>

        <div className="space-y-2.5">
          {reportInsights.length ? (
            reportInsights.map((insight) => {
              const tone = toneMap[insight.type] || toneMap.info;
              const Icon = tone.icon;
              const Container: React.ElementType = isInsightInteractive ? 'button' : 'article';

              return (
                <Container
                  key={`report-${insight.id}`}
                  {...(isInsightInteractive
                    ? {
                        type: 'button' as const,
                        onClick: () => onInsightClick?.(insight),
                        'aria-label': `Abrir insight: ${insight.title}`,
                      }
                    : {})}
                  className={`group w-full rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 text-left ${
                    isInsightInteractive
                      ? 'transition hover:border-[#D1E1E6] hover:bg-[#FBFEFD] hover:shadow-[0_10px_18px_-18px_rgba(16,62,83,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${tone.iconSurface}`}>
                          <Icon className={`h-3.5 w-3.5 ${tone.iconClass}`} />
                        </span>
                        <p className="text-[16px] font-semibold leading-tight text-[#173548]">
                          {insight.title}
                        </p>
                      </div>
                      <p className="mt-1.5 pl-8 text-[14px] text-[#209D86]">{insight.description}</p>
                    </div>
                    <ArrowRight className="mt-2 h-4 w-4 flex-shrink-0 text-[#7A93A0] transition group-hover:translate-x-0.5" />
                  </div>
                </Container>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-[#CFE0E6] bg-[#F7FBFC] px-3 py-3.5 text-[11px] text-[#5E7A88]">
              Sem leituras adicionais para o período selecionado.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(InsightsPanel);
