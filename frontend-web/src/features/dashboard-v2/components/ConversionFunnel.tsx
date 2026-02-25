import React, { useMemo } from 'react';
import { ChevronRight, Shuffle } from 'lucide-react';
import { DashboardV2FunnelStep } from '../useDashboardV2';

type ConversionFunnelProps = {
  steps: DashboardV2FunnelStep[];
};

const stageLabel = (value: string): string => {
  const labels: Record<string, string> = {
    leads: 'Propostas enviadas',
    qualification: 'Qualificacao',
    proposal: 'Proposta',
    negotiation: 'Negociacao',
    closing: 'Fechamento',
    won: 'Ganho',
  };

  return labels[value] || value;
};

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ steps }) => {
  const funnelRows = useMemo(() => {
    const normalized = steps
      .filter((step) => step.entered > 0)
      .slice(0, 3)
      .map((step) => ({
        key: `${step.fromStage}-${step.toStage}`,
        title: stageLabel(step.toStage),
        entered: step.entered,
        progressed: step.progressed,
        rate: Number(step.conversionRate || 0),
      }));

    return normalized;
  }, [steps]);

  if (!funnelRows.length) {
    return (
      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Taxa de Conversao</h3>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EDF6F3] text-[#2AA397]">
            <Shuffle className="h-[18px] w-[18px]" />
          </span>
        </div>
        <p className="mt-4 text-[14px] text-[#607C89]">Sem dados para o periodo selecionado.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Taxa de Conversao</h3>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EDF6F3] text-[#2AA397]">
          <Shuffle className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {funnelRows.map((row, index) => {
          const width = 100 - index * 7;

          if (index === 0) {
            return (
              <div key={row.key} className="mx-auto" style={{ width: `${width}%` }}>
                <div
                  className="flex h-[70px] items-center rounded-[16px] bg-[#EAF3EF] px-4"
                  style={{ clipPath: 'polygon(2% 0%, 100% 0%, 97% 100%, 0% 100%)' }}
                >
                  <p className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-[#1E4151]">{row.entered}</p>
                  <p className="ml-2.5 text-[15px] text-[#2F5260]">{row.title}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={row.key} className="mx-auto" style={{ width: `${width}%` }}>
              <div
                className="flex h-[70px] overflow-hidden rounded-[16px]"
                style={{ clipPath: 'polygon(2% 0%, 100% 0%, 97% 100%, 0% 100%)' }}
              >
                <div className="flex min-w-0 flex-1 items-center bg-[#CCE3D9] px-4">
                  <p className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-[#1E4151]">{row.progressed}</p>
                </div>

                <div className="flex w-[48%] items-center justify-center gap-1.5 bg-gradient-to-r from-[#7DD8CD] via-[#6FD3C5] to-[#60C8B8] px-3 text-white">
                  <span className="text-[45px] font-semibold leading-none tracking-[-0.02em]">{Math.max(0, row.rate).toFixed(0)}%</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[14px] text-[#607C89]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-3.5 rounded-full bg-[#CDE4DB]" />
          Ac. Fechada
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-3.5 rounded-full bg-[#3CA895]" />
          {funnelRows[funnelRows.length - 1]?.progressed || 0} vendas
        </span>
      </div>
    </section>
  );
};

export default React.memo(ConversionFunnel);
