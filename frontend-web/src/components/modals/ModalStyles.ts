/**
 * Sistema de Design Tokens para Modais
 * Baseado no ModalNovaProposta otimizado
 */

export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

export const ModalStyles = {
  // Overlay do modal
  overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',

  // Container principal do modal
  container: {
    small: 'bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden',
    medium: 'bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden',
    large: 'bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden',
    xlarge: 'bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden',
  },

  // Header do modal
  header: {
    container: 'border-b border-gray-200 bg-white',
    content: 'flex items-center justify-between p-4',
    title: 'text-lg font-semibold text-gray-900',
    subtitle: 'text-sm text-gray-500 mt-1',
    closeButton:
      'text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100',
  },

  // Progress bar (para modais com etapas)
  progressBar: {
    container: 'px-4 pb-4',
    wrapper: 'flex items-center justify-center space-x-2 overflow-x-auto',
    step: {
      container: 'flex items-center',
      icon: {
        base: 'w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all',
        current: 'bg-blue-100 text-blue-600 border-2 border-blue-200',
        completed: 'bg-green-100 text-green-600 border-2 border-green-200',
        pending: 'bg-gray-100 text-gray-400 border-2 border-gray-200',
      },
      label: {
        base: 'text-xs font-medium ml-2 transition-colors',
        current: 'text-blue-600',
        other: 'text-gray-500',
      },
      separator: {
        base: 'w-8 h-0.5 mx-2 transition-colors',
        completed: 'bg-green-200',
        pending: 'bg-gray-200',
      },
    },
  },

  // Conteúdo do modal
  content: {
    container: 'overflow-y-auto max-h-[calc(90vh-120px)]',
    wrapper: 'p-4',
  },

  // Footer do modal
  footer: {
    container: 'border-t border-gray-200 bg-gray-50 p-4',
  },

  // Tipografia
  typography: {
    h1: 'text-lg font-semibold text-gray-900',
    h2: 'text-base font-medium text-gray-900',
    h3: 'text-sm font-medium text-gray-900',
    label: 'block text-xs font-medium text-gray-700',
    body: 'text-sm text-gray-700',
    small: 'text-xs text-gray-600',
    helpText: 'text-xs text-gray-500',
    error: 'text-xs text-red-600',
  },

  // Formulários
  form: {
    fieldSpacing: 'mb-1',
    helpSpacing: 'block mt-1',
    errorSpacing: 'mt-1',
    input:
      'w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
    select:
      'w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white',
    textarea:
      'w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none',
  },

  // Botões
  button: {
    primary:
      'inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    secondary:
      'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    success:
      'inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    warning:
      'inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    danger:
      'inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    info: 'inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    small: 'px-2 py-1 text-xs',
    icon: 'w-4 h-4',
    iconSmall: 'w-3 h-3',
  },

  // Cards
  card: {
    base: 'rounded-lg border p-3 transition-all',
    default: 'border-gray-200 bg-white',
    selected: 'border-blue-300 bg-blue-50',
    info: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
  },

  // Espaçamentos padrão
  spacing: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  },

  // Utilidades
  utils: {
    loading: 'animate-spin rounded-full border-2 border-current border-t-transparent',
    fadeIn: 'animate-fadeIn',
    slideIn: 'animate-slideIn',
  },
};
