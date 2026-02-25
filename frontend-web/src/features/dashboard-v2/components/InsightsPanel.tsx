import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, ExternalLink, Gauge, Sparkles } from 'lucide-react';
import { DashboardV2Insight } from '../useDashboardV2';

type InsightsPanelProps = {
  insights: DashboardV2Insight[];
  headerAction?: React.ReactNode;
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
  medio: 'Media prioridade',
  baixo: 'Baixa prioridade',
};

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, headerAction }) => {
  const primaryInsights = insights.slice(0, 3);

  const reportInsights = useMemo(() => {
    const source = insights.slice(3, 5);
    if (source.length >= 2) return source;

    if (!insights.length) {
      return [
        {
          id: 'fallback-report-1',
          type: 'info' as const,
          title: 'Conversao media',
          description: 'Sem variacao registrada no periodo atual.',
          impact: 'medio' as const,
          action: 'Aguardando novos dados',
        },
        {
          id: 'fallback-report-2',
          type: 'info' as const,
          title: 'Follow-ups pendentes',
          description: 'Nao ha pendencias criticas neste momento.',
          impact: 'baixo' as const,
          action: 'Sem acoes urgentes',
        },
      ];
    }

    const duplicated = [...source];
    while (duplicated.length < 2) {
      duplicated.push(insights[duplicated.length % insights.length]);
    }

    return duplicated.slice(0, 2);
  }, [insights]);

  return (
    <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Insights</h3>
        <div className="flex items-center gap-2">
          {headerAction}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D7E4E8] text-[#5E7A88] transition hover:bg-[#F4FBF8]"
            aria-label="Compartilhar insights"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {primaryInsights.length ? (
          primaryInsights.map((insight) => {
            const tone = toneMap[insight.type] || toneMap.info;
            const Icon = tone.icon;

            return (
              <button
                key={insight.id}
                type="button"
                className="group w-full rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 text-left transition hover:border-[#D1E1E6] hover:bg-[#FBFEFD] hover:shadow-[0_10px_18px_-18px_rgba(16,62,83,0.36)]"
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
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#CFE0E6] bg-[#F7FBFC] px-3 py-3.5 text-[11px] text-[#5E7A88]">
            Sem insights para o periodo selecionado.
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#E3ECEF] pt-4">
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <h4 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Informe</h4>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#6E8996]">
            <Gauge className="h-[19px] w-[19px]" />
          </span>
        </div>

        <div className="space-y-2.5">
          {reportInsights.map((insight) => {
            const tone = toneMap[insight.type] || toneMap.info;
            const Icon = tone.icon;

            return (
              <button
                key={`report-${insight.id}`}
                type="button"
                className="group w-full rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 text-left transition hover:border-[#D1E1E6] hover:bg-[#FBFEFD] hover:shadow-[0_10px_18px_-18px_rgba(16,62,83,0.36)]"
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
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default React.memo(InsightsPanel);

