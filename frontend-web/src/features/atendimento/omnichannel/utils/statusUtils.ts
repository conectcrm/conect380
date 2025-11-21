/**
 * 🎨 Utilitários de Status - Visual e Lógica
 * 
 * Gerencia cores, ícones, labels e transições de estado dos tickets
 */

import { StatusAtendimentoType } from '../types';

/**
 * Configuração visual de cada status
 */
export interface StatusConfig {
  label: string;
  color: string; // Classe Tailwind para texto
  bgColor: string; // Classe Tailwind para background
  icon: string; // Emoji ou ícone
  description: string;
  allowedTransitions: StatusAtendimentoType[]; // Próximos estados válidos
}

/**
 * Mapeamento completo de todos os status
 */
export const STATUS_CONFIG: Record<StatusAtendimentoType, StatusConfig> = {
  aberto: {
    label: 'Aberto',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '🆕',
    description: 'Ticket novo aguardando atribuição',
    allowedTransitions: ['em_atendimento', 'fechado']
  },
  em_atendimento: {
    label: 'Em Atendimento',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '💬',
    description: 'Atendente trabalhando no ticket',
    allowedTransitions: ['aguardando', 'resolvido', 'aberto']
  },
  aguardando: {
    label: 'Aguardando',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '⏳',
    description: 'Aguardando resposta do cliente ou informações',
    allowedTransitions: ['em_atendimento', 'resolvido', 'fechado']
  },
  resolvido: {
    label: 'Resolvido',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '✅',
    description: 'Problema resolvido, aguardando confirmação',
    allowedTransitions: ['fechado', 'aberto'] // Pode reabrir se cliente reclamar
  },
  fechado: {
    label: 'Fechado',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '🔒',
    description: 'Ticket arquivado e finalizado',
    allowedTransitions: ['aberto'] // Só pode reabrir
  }
};

/**
 * Obter configuração visual de um status
 */
export const getStatusConfig = (status: StatusAtendimentoType): StatusConfig => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.aberto;
};

/**
 * Verificar se transição de status é válida
 */
export const isTransitionAllowed = (
  from: StatusAtendimentoType,
  to: StatusAtendimentoType
): boolean => {
  const config = STATUS_CONFIG[from];
  return config.allowedTransitions.includes(to);
};

/**
 * Obter próximas ações disponíveis para um status
 */
export const getAvailableActions = (
  currentStatus: StatusAtendimentoType
): Array<{
  status: StatusAtendimentoType;
  label: string;
  buttonLabel: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> => {
  const transitions = STATUS_CONFIG[currentStatus].allowedTransitions;

  const actionMap: Record<StatusAtendimentoType, {
    label: string;
    buttonLabel: string;
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }> = {
    aberto: {
      label: 'Assumir ticket',
      buttonLabel: 'Assumir',
      variant: 'primary'
    },
    em_atendimento: {
      label: 'Marcar em atendimento',
      buttonLabel: 'Em Atendimento',
      variant: 'success'
    },
    aguardando: {
      label: 'Colocar em espera',
      buttonLabel: 'Aguardar Cliente',
      variant: 'warning'
    },
    resolvido: {
      label: 'Marcar como resolvido',
      buttonLabel: 'Resolver',
      variant: 'success'
    },
    fechado: {
      label: 'Fechar ticket',
      buttonLabel: 'Fechar',
      variant: 'secondary'
    }
  };

  return transitions.map(status => ({
    status,
    ...actionMap[status]
  }));
};

/**
 * Obter cor do badge (para usar inline ou com Tailwind)
 */
export const getStatusBadgeClasses = (status: StatusAtendimentoType): string => {
  const config = getStatusConfig(status);
  return `${config.bgColor} ${config.color}`;
};

/**
 * Componente Badge (pode ser usado como função ou JSX)
 */
export const renderStatusBadge = (
  status: StatusAtendimentoType,
  options?: {
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
): { classes: string; icon: string; label: string } => {
  const { showIcon = true, size = 'md', className = '' } = options || {};
  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return {
    classes: `inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`,
    icon: showIcon ? config.icon : '',
    label: config.label
  };
};
