import React from 'react';

interface ProgressoPagamentoProps {
  valorTotal: number;
  valorPago: number;
  className?: string;
  showValues?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressoPagamento: React.FC<ProgressoPagamentoProps> = ({
  valorTotal,
  valorPago,
  className = '',
  showValues = true,
  size = 'md'
}) => {
  const porcentagem = valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0;
  const valorRestante = valorTotal - valorPago;

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBarColor = () => {
    if (porcentagem === 0) return 'bg-gray-200';
    if (porcentagem < 50) return 'bg-red-400';
    if (porcentagem < 100) return 'bg-orange-400';
    return 'bg-green-400';
  };

  const getBarHeight = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-4';
      default: return 'h-3';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-sm';
      default: return 'text-xs';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Barra de Progresso */}
      <div className="relative">
        <div className={`w-full bg-gray-200 rounded-full ${getBarHeight()}`}>
          <div
            className={`${getBarColor()} ${getBarHeight()} rounded-full transition-all duration-300 ease-in-out`}
            style={{ width: `${Math.min(porcentagem, 100)}%` }}
          ></div>
        </div>

        {/* Porcentagem sobre a barra */}
        {size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-medium text-white text-xs drop-shadow-sm`}>
              {porcentagem.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Valores */}
      {showValues && (
        <div className={`flex justify-between ${getTextSize()} text-gray-600`}>
          <span>
            Pago: <span className="font-medium text-green-600">{formatMoney(valorPago)}</span>
          </span>
          {valorRestante > 0 && (
            <span>
              Restante: <span className="font-medium text-red-600">{formatMoney(valorRestante)}</span>
            </span>
          )}
        </div>
      )}

      {/* Status Badge */}
      {size !== 'sm' && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getBarColor().replace('bg-', 'bg-')}`}></div>
          <span className={`${getTextSize()} font-medium`}>
            {porcentagem === 100 ? 'Pago integralmente' :
              porcentagem > 0 ? 'Pagamento parcial' :
                'Não pago'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressoPagamento;
