/**
 * Estilos padronizados para todos os modais do sistema
 * Baseados no design do ModalNovaProposta otimizado
 */

export const ModalStyles = {
  // Container externo
  overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4',

  // Container do modal
  container: {
    small:
      'bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto max-h-[85vh] overflow-hidden flex flex-col',
    medium:
      'bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col',
    large:
      'bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[85vh] overflow-hidden flex flex-col',
    extraLarge:
      'bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-auto h-[85vh] max-h-[95vh] overflow-hidden flex flex-col',
  },

  // Header do modal
  header: {
    container: 'bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white p-3 md:p-4 flex-shrink-0',
    content: 'flex items-center justify-between',
    title: 'text-lg md:text-xl font-bold',
    subtitle: 'text-blue-100 text-xs md:text-sm',
    closeButton: 'text-white hover:text-gray-200 transition-colors p-1',
  },

  // Progress bar (para modais com etapas)
  progressBar: {
    container: 'mt-3 md:mt-4',
    wrapper: 'flex items-center justify-between gap-1 md:gap-2 mb-2',
    step: {
      container: 'flex items-center flex-1 min-w-0',
      icon: {
        base: 'flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors flex-shrink-0',
        completed: 'bg-white text-[#159A9C] border-white',
        current: 'bg-white text-[#159A9C] border-white',
        pending: 'bg-transparent text-white border-white/50',
      },
      label: {
        base: 'ml-1 md:ml-2 text-xs font-medium truncate',
        current: 'text-white',
        other: 'text-blue-100',
      },
      separator: {
        base: 'w-3 md:w-6 h-0.5 mx-1 md:mx-2 transition-colors flex-shrink-0',
        completed: 'bg-white',
        pending: 'bg-white/30',
      },
    },
  },

  // Conteúdo do modal
  content: {
    container: 'flex-1 overflow-y-auto',
    wrapper: 'p-3 md:p-4',
    spacing: {
      small: 'space-y-2 md:space-y-3',
      medium: 'space-y-3 md:space-y-4',
      large: 'space-y-4 md:space-y-6',
    },
  },

  // Tipografia
  typography: {
    title: 'text-base md:text-lg font-semibold text-gray-900',
    subtitle: 'text-base font-semibold text-gray-900',
    label: 'block text-sm font-medium text-gray-700',
    helpText: 'text-xs text-gray-500 font-normal',
    error: 'text-red-500 text-xs',
    success: 'text-green-600 text-xs',
  },

  // Formulários
  form: {
    grid: {
      single: 'grid grid-cols-1 gap-4',
      double: 'grid grid-cols-1 xl:grid-cols-2 gap-4',
      triple: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4',
    },
    input:
      'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm',
    select:
      'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm',
    textarea:
      'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm',
    fieldSpacing: 'mb-1',
    helpSpacing: 'ml-1',
    errorSpacing: 'mt-1',
  },

  // Cards e containers
  card: {
    base: 'p-3 rounded border',
    selected: 'border-[#159A9C] bg-[#159A9C]/5 shadow-sm',
    default: 'border-gray-200 bg-white hover:border-gray-300',
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
  },

  // Botões
  button: {
    primary:
      'flex items-center px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm',
    secondary:
      'flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm',
    success:
      'flex items-center px-3 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm',
    warning:
      'flex items-center px-3 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors text-sm',
    danger:
      'flex items-center px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm',
    info: 'flex items-center px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm',
    small: 'flex items-center px-2 py-1.5 rounded text-xs',
    icon: 'h-4 w-4',
    iconSmall: 'h-3 w-3',
  },

  // Footer
  footer: {
    container: 'border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex-shrink-0',
    content: 'flex items-center justify-between',
    stepInfo: 'text-xs text-gray-500',
    buttonGroup: 'flex items-center space-x-2',
    actionGroup: 'flex flex-wrap items-center gap-2',
    quickActions: 'flex items-center space-x-1',
  },

  // Cores temáticas
  colors: {
    primary: '#159A9C',
    primaryDark: '#0F7B7D',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Utilitários
  utils: {
    loading: 'animate-spin rounded-full border-b-2',
    truncate: 'truncate',
    separator: 'border-gray-200',
    shadow: 'shadow-sm',
    transition: 'transition-all',
    flexCenter: 'flex items-center justify-center',
    flexBetween: 'flex items-center justify-between',
  },
} as const;

export type ModalSize = keyof typeof ModalStyles.container;
export type CardVariant = keyof typeof ModalStyles.card;
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
