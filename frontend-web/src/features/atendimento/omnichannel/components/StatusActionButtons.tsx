/**
 * 🎯 StatusActionButtons - Botões de ação rápida para transição de status
 *
 * Permite que atendente mude status do ticket com um clique
 */

import React from 'react';
import { CheckCircle, Clock, MessageSquare, RotateCcw } from 'lucide-react';
import { StatusAtendimentoType } from '../types';
import { getAvailableActions } from '../utils/statusUtils';
import { ThemePalette } from '../../../../contexts/ThemeContext';

interface StatusActionButtonsProps {
  currentStatus: StatusAtendimentoType;
  onChangeStatus: (newStatus: StatusAtendimentoType) => Promise<void>;
  theme: ThemePalette;
  disabled?: boolean;
  loading?: boolean;
}

export const StatusActionButtons: React.FC<StatusActionButtonsProps> = ({
  currentStatus,
  onChangeStatus,
  theme,
  disabled = false,
  loading = false,
}) => {
  const [loadingStatus, setLoadingStatus] = React.useState<StatusAtendimentoType | null>(null);

  const actions = getAvailableActions(currentStatus);

  // Ícones para cada ação
  const getActionIcon = (status: StatusAtendimentoType) => {
    switch (status) {
      case 'em_atendimento':
        return MessageSquare;
      case 'envio_ativo':
        return Clock;
      case 'encerrado':
        return CheckCircle;
            case 'fila':
        return RotateCcw;
      default:
        return MessageSquare;
    }
  };

  // Cores para cada variante
  const getButtonClasses = (variant: string) => {
    const base =
      'flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed';

    switch (variant) {
      case 'primary':
        return `${base} bg-[#159A9C] text-white hover:bg-[#0F7B7D]`;
      case 'success':
        return `${base} bg-green-600 text-white hover:bg-green-700`;
      case 'warning':
        return `${base} bg-yellow-500 text-white hover:bg-yellow-600`;
      case 'danger':
        return `${base} bg-red-600 text-white hover:bg-red-700`;
      default:
        return `${base} bg-gray-200 text-gray-700 hover:bg-gray-300`;
    }
  };

  const handleClick = async (status: StatusAtendimentoType) => {
    if (disabled || loading || loadingStatus) return;

    try {
      setLoadingStatus(status);
      await onChangeStatus(status);
    } catch (error) {
      console.error('Erro ao mudar status:', error);
    } finally {
      setLoadingStatus(null);
    }
  };

  // Se não há ações disponíveis, não renderiza nada
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((action) => {
        const Icon = getActionIcon(action.status);
        const isLoading = loadingStatus === action.status;

        return (
          <button
            key={action.status}
            onClick={() => handleClick(action.status)}
            disabled={disabled || loading || isLoading}
            className={getButtonClasses(action.variant)}
            title={action.label}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            <span>{action.buttonLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Versão compacta (só ícones) para usar em espaços pequenos
 */
export const StatusActionButtonsCompact: React.FC<StatusActionButtonsProps> = ({
  currentStatus,
  onChangeStatus,
  theme,
  disabled = false,
  loading = false,
}) => {
  const [loadingStatus, setLoadingStatus] = React.useState<StatusAtendimentoType | null>(null);

  const actions = getAvailableActions(currentStatus);

  const getActionIcon = (status: StatusAtendimentoType) => {
    switch (status) {
      case 'em_atendimento':
        return MessageSquare;
      case 'envio_ativo':
        return Clock;
      case 'encerrado':
        return CheckCircle;
            case 'fila':
        return RotateCcw;
      default:
        return MessageSquare;
    }
  };

  const getIconColor = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'text-[#159A9C] hover:bg-[#159A9C]/10';
      case 'success':
        return 'text-green-600 hover:bg-green-50';
      case 'warning':
        return 'text-yellow-600 hover:bg-yellow-50';
      case 'danger':
        return 'text-red-600 hover:bg-red-50';
      default:
        return 'text-gray-600 hover:bg-gray-100';
    }
  };

  const handleClick = async (status: StatusAtendimentoType) => {
    if (disabled || loading || loadingStatus) return;

    try {
      setLoadingStatus(status);
      await onChangeStatus(status);
    } catch (error) {
      console.error('Erro ao mudar status:', error);
    } finally {
      setLoadingStatus(null);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => {
        const Icon = getActionIcon(action.status);
        const isLoading = loadingStatus === action.status;

        return (
          <button
            key={action.status}
            onClick={() => handleClick(action.status)}
            disabled={disabled || loading || isLoading}
            className={`p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getIconColor(action.variant)}`}
            title={action.label}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
          </button>
        );
      })}
    </div>
  );
};
