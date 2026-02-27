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
  color: string;
};

const ETAPAS_FLUXO: EtapaFluxo[] = [
  { id: 'rascunho', label: 'Rascunho', icon: FileText, color: 'gray' },
  { id: 'enviada', label: 'Enviada', icon: Send, color: 'blue' },
  { id: 'visualizada', label: 'Visualizada', icon: Eye, color: 'cyan' },
  { id: 'negociacao', label: 'Negociacao', icon: Clock, color: 'yellow' },
  { id: 'aprovada', label: 'Aprovada', icon: CheckCircle, color: 'green' },
  { id: 'contrato_gerado', label: 'Contrato gerado', icon: FileSignature, color: 'purple' },
  { id: 'contrato_assinado', label: 'Contrato assinado', icon: CheckCircle, color: 'indigo' },
  { id: 'fatura_criada', label: 'Fatura criada', icon: CreditCard, color: 'pink' },
  {
    id: 'aguardando_pagamento',
    label: 'Aguardando pagamento',
    icon: Clock,
    color: 'orange',
  },
  { id: 'pago', label: 'Pago', icon: DollarSign, color: 'emerald' },
];

const STATUS_TERMINAIS: Record<string, EtapaFluxo> = {
  rejeitada: { id: 'rejeitada', label: 'Rejeitada', icon: XCircle, color: 'red' },
  expirada: { id: 'expirada', label: 'Expirada', icon: AlertCircle, color: 'red' },
};

const ETAPAS_RAMIFICACAO_PERDA = ['rascunho', 'enviada', 'negociacao'];

const getColorClasses = (color: string, ativo: boolean = false) => {
  const intensity = ativo ? '600' : '400';
  switch (color) {
    case 'gray':
      return `text-gray-${intensity} bg-gray-100`;
    case 'blue':
      return `text-blue-${intensity} bg-blue-100`;
    case 'cyan':
      return `text-cyan-${intensity} bg-cyan-100`;
    case 'yellow':
      return `text-yellow-${intensity} bg-yellow-100`;
    case 'green':
      return `text-green-${intensity} bg-green-100`;
    case 'purple':
      return `text-purple-${intensity} bg-purple-100`;
    case 'indigo':
      return `text-indigo-${intensity} bg-indigo-100`;
    case 'pink':
      return `text-pink-${intensity} bg-pink-100`;
    case 'orange':
      return `text-orange-${intensity} bg-orange-100`;
    case 'emerald':
      return `text-emerald-${intensity} bg-emerald-100`;
    case 'red':
      return `text-red-${intensity} bg-red-100`;
    default:
      return `text-gray-${intensity} bg-gray-100`;
  }
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
        <div className={`rounded-full p-1.5 ${getColorClasses(etapaAtual.color, true)}`}>
          <IconeAtual className="h-3 w-3" />
        </div>
        <span className="text-sm font-medium text-gray-700">{etapaAtual.label}</span>
        {proximaEtapa ? (
          <>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">{proximaEtapa.label}</span>
          </>
        ) : isTerminal ? (
          <span className="text-xs text-red-600">Fluxo encerrado</span>
        ) : null}
      </div>
    );
  }

  if (showProgress) {
    if (isTerminal) {
      const trilhaPerda = ETAPAS_RAMIFICACAO_PERDA.map((id) => ETAPAS_FLUXO.find((e) => e.id === id)).filter(
        (etapa): etapa is EtapaFluxo => Boolean(etapa),
      );
      const trilhaCompleta = [...trilhaPerda, etapaAtual];

      return (
        <div className="w-full">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Fluxo encerrado</h4>
            <span className="text-xs text-red-600">Ramificacao de perda</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {trilhaCompleta.map((etapa, index) => {
              const Icone = etapa.icon;
              const isCurrent = index === trilhaCompleta.length - 1;

              return (
                <React.Fragment key={etapa.id}>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2 py-1">
                    <div
                      className={`rounded-full p-1 ${getColorClasses(etapa.color, isCurrent || etapa.id !== 'rejeitada')}`}
                    >
                      <Icone className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{etapa.label}</span>
                  </div>
                  {index < trilhaCompleta.length - 1 && <ArrowRight className="h-3 w-3 text-gray-400" />}
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
          <h4 className="text-sm font-medium text-gray-900">Progresso do fluxo</h4>
          <span className="text-xs text-gray-500">
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
                        ? 'border-green-500 bg-green-500 text-white'
                        : current
                          ? `${getColorClasses(etapa.color, true)} border-current`
                          : 'border-gray-300 bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icone className="h-4 w-4" />
                  </div>

                  <span
                    className={`mt-2 max-w-20 text-center text-xs ${
                      current ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {etapa.label}
                  </span>

                  {index < ETAPAS_FLUXO.length - 1 && (
                    <div
                      className={`absolute top-4 h-0.5 w-full -z-10 ${completed ? 'bg-green-500' : 'bg-gray-200'}`}
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

        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <div className="flex items-center space-x-2">
            <div className={`rounded-full p-2 ${getColorClasses(etapaAtual.color, true)}`}>
              <etapaAtual.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Etapa atual: {etapaAtual.label}</p>
              {proximaEtapa && <p className="text-xs text-gray-500">Proxima: {proximaEtapa.label}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const IconeAtual = etapaAtual.icon;
  return (
    <div className="inline-flex items-center space-x-2 rounded-full border px-3 py-1.5">
      <div className={`rounded-full p-1 ${getColorClasses(etapaAtual.color, true)}`}>
        <IconeAtual className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{etapaAtual.label}</span>
    </div>
  );
};

export default StatusFluxo;
