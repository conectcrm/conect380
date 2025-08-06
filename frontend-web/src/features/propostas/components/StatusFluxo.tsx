import React from 'react';
import {
  FileText,
  Send,
  CheckCircle,
  FileSignature,
  CreditCard,
  DollarSign,
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface StatusFluxoProps {
  status: string;
  showProgress?: boolean;
  compact?: boolean;
}

// Mapeamento dos status para as etapas do fluxo
const ETAPAS_FLUXO = [
  {
    id: 'rascunho',
    label: 'Rascunho',
    icon: FileText,
    color: 'gray'
  },
  {
    id: 'enviada',
    label: 'Enviada',
    icon: Send,
    color: 'blue'
  },
  {
    id: 'negociacao',
    label: 'Negociação',
    icon: Clock,
    color: 'yellow'
  },
  {
    id: 'aprovada',
    label: 'Aprovada',
    icon: CheckCircle,
    color: 'green'
  },
  {
    id: 'contrato_gerado',
    label: 'Contrato Gerado',
    icon: FileSignature,
    color: 'purple'
  },
  {
    id: 'contrato_assinado',
    label: 'Contrato Assinado',
    icon: CheckCircle,
    color: 'indigo'
  },
  {
    id: 'fatura_criada',
    label: 'Fatura Criada',
    icon: CreditCard,
    color: 'pink'
  },
  {
    id: 'aguardando_pagamento',
    label: 'Aguardando Pagamento',
    icon: Clock,
    color: 'orange'
  },
  {
    id: 'pago',
    label: 'Pago',
    icon: DollarSign,
    color: 'emerald'
  },
  {
    id: 'rejeitada',
    label: 'Rejeitada',
    icon: AlertCircle,
    color: 'red'
  }
];

const StatusFluxo: React.FC<StatusFluxoProps> = ({
  status,
  showProgress = false,
  compact = false
}) => {
  // Encontrar a etapa atual
  const etapaAtual = ETAPAS_FLUXO.find(etapa => etapa.id === status) || ETAPAS_FLUXO[0];
  const indiceAtual = ETAPAS_FLUXO.findIndex(etapa => etapa.id === status);

  // Definir próxima etapa
  const proximaEtapa = indiceAtual >= 0 && indiceAtual < ETAPAS_FLUXO.length - 1
    ? ETAPAS_FLUXO[indiceAtual + 1]
    : null;

  // Cores para cada status
  const getColorClasses = (color: string, ativo: boolean = false) => {
    const intensity = ativo ? '600' : '400';
    switch (color) {
      case 'gray': return `text-gray-${intensity} bg-gray-100`;
      case 'blue': return `text-blue-${intensity} bg-blue-100`;
      case 'yellow': return `text-yellow-${intensity} bg-yellow-100`;
      case 'green': return `text-green-${intensity} bg-green-100`;
      case 'purple': return `text-purple-${intensity} bg-purple-100`;
      case 'indigo': return `text-indigo-${intensity} bg-indigo-100`;
      case 'pink': return `text-pink-${intensity} bg-pink-100`;
      case 'orange': return `text-orange-${intensity} bg-orange-100`;
      case 'emerald': return `text-emerald-${intensity} bg-emerald-100`;
      case 'red': return `text-red-${intensity} bg-red-100`;
      default: return `text-gray-${intensity} bg-gray-100`;
    }
  };

  if (compact) {
    const IconeAtual = etapaAtual.icon;
    return (
      <div className="flex items-center space-x-2">
        <div className={`p-1.5 rounded-full ${getColorClasses(etapaAtual.color, true)}`}>
          <IconeAtual className="w-3 h-3" />
        </div>
        <span className="text-sm font-medium text-gray-700">
          {etapaAtual.label}
        </span>
        {proximaEtapa && (
          <>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {proximaEtapa.label}
            </span>
          </>
        )}
      </div>
    );
  }

  if (showProgress) {
    return (
      <div className="w-full">
        {/* Título */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">
            Progresso do Fluxo Automatizado
          </h4>
          <span className="text-xs text-gray-500">
            {indiceAtual + 1} de {ETAPAS_FLUXO.length} etapas
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {ETAPAS_FLUXO.map((etapa, index) => {
              const completed = index < indiceAtual;
              const current = index === indiceAtual;
              const future = index > indiceAtual;

              const Icone = etapa.icon;

              return (
                <div key={etapa.id} className="flex flex-col items-center">
                  {/* Ícone */}
                  <div className={`
                    relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2
                    ${completed ? 'bg-green-500 border-green-500 text-white' :
                      current ? `${getColorClasses(etapa.color, true)} border-current` :
                        'bg-gray-200 border-gray-300 text-gray-400'}
                  `}>
                    <Icone className="w-4 h-4" />
                  </div>

                  {/* Label */}
                  <span className={`
                    mt-2 text-xs text-center max-w-16
                    ${current ? 'font-medium text-gray-900' : 'text-gray-500'}
                  `}>
                    {etapa.label}
                  </span>

                  {/* Linha conectora */}
                  {index < ETAPAS_FLUXO.length - 1 && (
                    <div className={`
                      absolute top-4 w-full h-0.5 -z-10
                      ${completed ? 'bg-green-500' : 'bg-gray-200'}
                    `} style={{
                        left: `${(100 / (ETAPAS_FLUXO.length - 1)) * index + 50 / ETAPAS_FLUXO.length}%`,
                        width: `${100 / (ETAPAS_FLUXO.length - 1)}%`
                      }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status atual */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${getColorClasses(etapaAtual.color, true)}`}>
              <etapaAtual.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Etapa Atual: {etapaAtual.label}
              </p>
              {proximaEtapa && (
                <p className="text-xs text-gray-500">
                  Próxima: {proximaEtapa.label}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Versão normal - apenas o status atual
  const IconeAtual = etapaAtual.icon;
  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border">
      <div className={`p-1 rounded-full ${getColorClasses(etapaAtual.color, true)}`}>
        <IconeAtual className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">
        {etapaAtual.label}
      </span>
    </div>
  );
};

export default StatusFluxo;
