import React from 'react';
import {
  FileText,
  Send,
  Eye,
  CheckCircle,
  FileSignature,
  CreditCard,
  DollarSign,
  Clock,
  ArrowRight,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface StatusFluxoProps {
  status: string;
  showProgress?: boolean;
  compact?: boolean;
}

type EtapaFluxo = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'neutral' | 'primary' | 'info' | 'warning' | 'success' | 'accent' | 'danger';
};

const ETAPAS_FLUXO: EtapaFluxo[] = [
  { id: 'rascunho', label: 'Rascunho', icon: FileText, tone: 'neutral' },
  { id: 'enviada', label: 'Enviada', icon: Send, tone: 'primary' },
  { id: 'visualizada', label: 'Visualizada', icon: Eye, tone: 'info' },
  { id: 'negociacao', label: 'Negociacao', icon: Clock, tone: 'warning' },
  { id: 'aprovada', label: 'Aprovada', icon: CheckCircle, tone: 'success' },
  {
    id: 'contrato_gerado',
    label: 'Aguardando assinatura do contrato',
    icon: FileSignature,
    tone: 'accent',
  },
  { id: 'contrato_assinado', label: 'Contrato assinado', icon: CheckCircle, tone: 'success' },
  { id: 'fatura_criada', label: 'Fatura criada', icon: CreditCard, tone: 'accent' },
  {
    id: 'aguardando_pagamento',
    label: 'Aguardando pagamento',
    icon: Clock,
    tone: 'warning',
  },
  { id: 'pago', label: 'Pago', icon: DollarSign, tone: 'success' },
];

const STATUS_TERMINAIS: Record<string, EtapaFluxo> = {
  rejeitada: { id: 'rejeitada', label: 'Rejeitada', icon: XCircle, tone: 'danger' },
  expirada: { id: 'expirada', label: 'Expirada', icon: AlertCircle, tone: 'danger' },
};

const ETAPAS_RAMIFICACAO_PERDA = ['rascunho', 'enviada', 'negociacao'];

const TONE_CLASSES: Record<EtapaFluxo['tone'], { active: string; soft: string; line: string }> = {
  neutral: {
    active: 'bg-[#EEF3F5] text-[#607B89]',
    soft: 'bg-[#F6FAFB] text-[#607B89]',
    line: 'bg-[#D4E2E7]',
  },
  primary: {
    active: 'bg-[#DDF6F4] text-[#0F7B7D]',
    soft: 'bg-[#F2FBFA] text-[#159A9C]',
    line: 'bg-[#159A9C]',
  },
  info: {
    active: 'bg-[#E8F1FF] text-[#2563EB]',
    soft: 'bg-[#EFF6FF] text-[#3B82F6]',
    line: 'bg-[#60A5FA]',
  },
  warning: {
    active: 'bg-[#FFF1D6] text-[#B45309]',
    soft: 'bg-[#FFF7ED] text-[#C2410C]',
    line: 'bg-[#F59E0B]',
  },
  success: {
    active: 'bg-[#DCFCE7] text-[#166534]',
    soft: 'bg-[#F0FDF4] text-[#16A34A]',
    line: 'bg-[#22C55E]',
  },
  accent: {
    active: 'bg-[#F3E8FF] text-[#7C3AED]',
    soft: 'bg-[#FAF5FF] text-[#8B5CF6]',
    line: 'bg-[#A855F7]',
  },
  danger: {
    active: 'bg-[#FEE2E2] text-[#B91C1C]',
    soft: 'bg-[#FEF2F2] text-[#DC2626]',
    line: 'bg-[#EF4444]',
  },
};

const getToneClasses = (tone: EtapaFluxo['tone'], active: boolean = false) => {
  const config = TONE_CLASSES[tone] || TONE_CLASSES.neutral;
  return active ? config.active : config.soft;
};

const StatusFluxo: React.FC<StatusFluxoProps> = ({
  status,
  showProgress = false,
  compact = false,
}) => {
  const statusAtual = String(status || '').toLowerCase();
  const etapaTerminal = STATUS_TERMINAIS[statusAtual];
  const isTerminal = Boolean(etapaTerminal);

  const etapaAtual =
    etapaTerminal || ETAPAS_FLUXO.find((etapa) => etapa.id === statusAtual) || ETAPAS_FLUXO[0];

  const indiceAtual = ETAPAS_FLUXO.findIndex((etapa) => etapa.id === statusAtual);

  const proximaEtapa =
    !isTerminal && indiceAtual >= 0 && indiceAtual < ETAPAS_FLUXO.length - 1
      ? ETAPAS_FLUXO[indiceAtual + 1]
      : null;

  if (compact) {
    const IconeAtual = etapaAtual.icon;
    return (
      <div className="flex items-center space-x-2">
        <div className={`rounded-full p-1.5 ${getToneClasses(etapaAtual.tone, true)}`}>
          <IconeAtual className="h-3 w-3" />
        </div>
        <span className="text-sm font-medium text-[#355166]">{etapaAtual.label}</span>
        {proximaEtapa ? (
          <>
            <ArrowRight className="h-3 w-3 text-[#9AAEB8]" />
            <span className="text-xs text-[#607B89]">{proximaEtapa.label}</span>
          </>
        ) : isTerminal ? (
          <span className="text-xs text-[#DC2626]">Fluxo encerrado</span>
        ) : null}
      </div>
    );
  }

  if (showProgress) {
    if (isTerminal) {
      const trilhaPerda = ETAPAS_RAMIFICACAO_PERDA
        .map((id) => ETAPAS_FLUXO.find((e) => e.id === id))
        .filter(Boolean) as EtapaFluxo[];
      const trilhaCompleta = [...trilhaPerda, etapaAtual];

      return (
        <div className="w-full">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-[#19384C]">Fluxo encerrado</h4>
            <span className="text-xs text-[#DC2626]">Ramificacao de perda</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {trilhaCompleta.map((etapa, index) => {
              const Icone = etapa.icon;
              const isCurrent = index === trilhaCompleta.length - 1;

              return (
                <React.Fragment key={etapa.id}>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4E2E7] bg-white px-2 py-1">
                    <div
                      className={`rounded-full p-1 ${getToneClasses(etapa.tone, isCurrent || etapa.id !== 'rejeitada')}`}
                    >
                      <Icone className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium text-[#355166]">{etapa.label}</span>
                  </div>
                  {index < trilhaCompleta.length - 1 && <ArrowRight className="h-3 w-3 text-[#9AAEB8]" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-[#19384C]">Progresso do fluxo</h4>
          <span className="text-xs text-[#607B89]">
            {Math.max(indiceAtual + 1, 1)} de {ETAPAS_FLUXO.length} etapas
          </span>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between">
            {ETAPAS_FLUXO.map((etapa, index) => {
              const completed = index < indiceAtual;
              const current = index === indiceAtual;
              const Icone = etapa.icon;

              return (
                <div key={etapa.id} className="flex flex-col items-center">
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      completed
                        ? 'border-[#22C55E] bg-[#22C55E] text-white'
                        : current
                          ? `${getToneClasses(etapa.tone, true)} border-current`
                          : 'border-[#D4E2E7] bg-[#EEF3F5] text-[#9AAEB8]'
                    }`}
                  >
                    <Icone className="h-4 w-4" />
                  </div>

                  <span
                    className={`mt-2 max-w-20 text-center text-xs ${
                      current ? 'font-medium text-[#19384C]' : 'text-[#607B89]'
                    }`}
                  >
                    {etapa.label}
                  </span>

                  {index < ETAPAS_FLUXO.length - 1 && (
                    <div
                      className={`absolute top-4 h-0.5 w-full -z-10 ${completed ? 'bg-[#22C55E]' : 'bg-[#E2ECF0]'}`}
                      style={{
                        left: `${(100 / (ETAPAS_FLUXO.length - 1)) * index + 50 / ETAPAS_FLUXO.length}%`,
                        width: `${100 / (ETAPAS_FLUXO.length - 1)}%`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[#E2ECF0] bg-[#F7FBFC] p-3">
          <div className="flex items-center space-x-2">
            <div className={`rounded-full p-2 ${getToneClasses(etapaAtual.tone, true)}`}>
              <etapaAtual.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#19384C]">Etapa atual: {etapaAtual.label}</p>
              {proximaEtapa && <p className="text-xs text-[#607B89]">Proxima: {proximaEtapa.label}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const IconeAtual = etapaAtual.icon;
  return (
    <div className="inline-flex items-center space-x-2 rounded-full border border-[#D4E2E7] bg-white px-3 py-1.5">
      <div className={`rounded-full p-1 ${getToneClasses(etapaAtual.tone, true)}`}>
        <IconeAtual className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-[#355166]">{etapaAtual.label}</span>
    </div>
  );
};

export default StatusFluxo;
