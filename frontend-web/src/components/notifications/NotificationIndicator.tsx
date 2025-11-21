/**
 * Componente NotificationIndicator
 * 
 * Indicador visual de conexão WebSocket e notificações
 * Exibe status da conexão (conectado/desconectado/erro)
 * 
 * Features:
 * - Badge de status com cores (verde/cinza/vermelho)
 * - Animação de pulso quando conectado
 * - Tooltip com informações
 * - Click para reconectar manualmente
 * 
 * @author ConectCRM
 * @date 2025-11-18
 */

import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface NotificationIndicatorProps {
  isConnected: boolean;
  error: string | null;
  onReconnect?: () => void;
}

const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  isConnected,
  error,
  onReconnect,
}) => {
  // Determinar cor e ícone baseado no estado
  const getStatusConfig = () => {
    if (error) {
      return {
        color: 'red',
        icon: AlertCircle,
        text: 'Erro de conexão',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        iconColor: 'text-red-600',
      };
    }

    if (isConnected) {
      return {
        color: 'green',
        icon: Wifi,
        text: 'Conectado',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        iconColor: 'text-green-600',
      };
    }

    return {
      color: 'gray',
      icon: WifiOff,
      text: 'Desconectado',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      iconColor: 'text-gray-600',
    };
  };

  const status = getStatusConfig();
  const Icon = status.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
        ${status.bgColor} ${status.borderColor} border
        ${onReconnect && !isConnected ? 'cursor-pointer hover:opacity-80' : ''}
        transition-all
      `}
      onClick={() => {
        if (onReconnect && !isConnected) {
          onReconnect();
        }
      }}
      title={error || status.text}
    >
      {/* Ícone com animação de pulso se conectado */}
      <div className="relative">
        <Icon className={`h-4 w-4 ${status.iconColor}`} />
        {isConnected && (
          <span className="absolute top-0 left-0 h-4 w-4 animate-ping bg-green-400 rounded-full opacity-75"></span>
        )}
      </div>

      {/* Texto do status */}
      <span className={`text-xs font-medium ${status.textColor}`}>
        {status.text}
      </span>

      {/* Indicador de erro */}
      {error && (
        <span className="text-xs text-red-600 max-w-xs truncate" title={error}>
          ({error})
        </span>
      )}
    </div>
  );
};

export default NotificationIndicator;
