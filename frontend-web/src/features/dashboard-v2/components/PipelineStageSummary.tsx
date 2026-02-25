import React, { useMemo } from 'react';
import { PackageOpen } from 'lucide-react';
import { DashboardV2PipelineSummary } from '../useDashboardV2';

type PipelineStageSummaryProps = {
  data: DashboardV2PipelineSummary;
};

type StageCard = {
  key: string;
  label: string;
  value: number;
  quantity: number;
};

const stageLabelMap: Record<string, string> = {
  leads: 'Prospeccao',
  qualification: 'Contato Realizado',
  proposal: 'Proposta Enviada',
  negotiation: 'Negociacao',
  closing: 'Fechamento',
  won: 'Ganho',
};

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const preferredOrder = ['leads', 'qualification', 'proposal', 'negotiation'];

const PipelineStageSummary: React.FC<PipelineStageSummaryProps> = ({ data }) => {
  const stageCards = useMemo<StageCard[]>(() => {
    const stageMap = new Map(data.stages.map((stage) => [stage.stage, stage]));

    const ordered = preferredOrder
      .map((stageKey) => {
        const stage = stageMap.get(stageKey);
        if (!stage) return null;

        return {
          key: stageKey,
          label: stageLabelMap[stageKey] || stageKey,
          value: Number(stage.valor || 0),
          quantity: Number(stage.quantidade || 0),
        };
      })
      .filter((stage): stage is StageCard => Boolean(stage));

    if (ordered.length >= 4) return ordered;

    const fallback = data.stages
      .filter((stage) => !ordered.some((current) => current.key === stage.stage))
      .slice(0, Math.max(0, 4 - ordered.length))
      .map((stage) => ({
        key: stage.stage,
        label: stageLabelMap[stage.stage] || stage.stage,
        value: Number(stage.valor || 0),
        quantity: Number(stage.quantidade || 0),
      }));

    return [...ordered, ...fallback].slice(0, 4);
  }, [data.stages]);

  const totalQuantidade = useMemo(
    () => data.stages.reduce((acc, stage) => acc + Number(stage.quantidade || 0), 0),
    [data.stages],
  );

  if (!data.stages.length) {
    return (
      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
        <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Pipeline de Vendas</h3>
        <p className="mt-3 text-[14px] text-[#607C89]">Sem dados de pipeline para o periodo selecionado.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h3 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Pipeline de Vendas</h3>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F2F6F8] px-4 py-1.5 text-[14px] text-[#2D4A5A]">
          <strong className="font-semibold text-[#17384B]">{formatCurrency(data.totalValor)}</strong>
          Total do Pipeline
        </span>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#DFE8ED] bg-[#FCFDFE]">
        <div className="grid grid-cols-1 divide-y divide-[#DFE8ED] md:grid-cols-5 md:divide-x md:divide-y-0">
          {stageCards.map((stage) => (
            <article key={stage.key} className="p-[18px]">
              <p className="text-[15px] font-medium leading-tight text-[#304E5D]">{stage.label}</p>
              <p className="mt-2.5 text-[31px] font-semibold leading-none tracking-[-0.02em] text-[#19384C]">{formatCurrency(stage.value)}</p>
              <p className="mt-2.5 inline-flex items-center gap-1 text-[14px] text-[#607B89]">
                <PackageOpen className="h-3.5 w-3.5 text-[#718A97]" />
                {stage.quantity} vendas
              </p>
            </article>
          ))}

          <article className="p-[18px]">
            <p className="text-[15px] font-medium leading-tight text-[#304E5D]">Total</p>
            <p className="mt-2.5 text-[31px] font-semibold leading-none tracking-[-0.02em] text-[#19384C]">{formatCurrency(data.totalValor)}</p>
            <p className="mt-2.5 text-[14px] text-[#607B89]">{totalQuantidade} oportunidades</p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default React.memo(PipelineStageSummary);
