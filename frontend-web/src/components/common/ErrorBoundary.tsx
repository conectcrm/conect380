import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 * 
 * Captura erros não tratados em componentes React e envia para Sentry
 * Exibe UI de fallback amigável quando erro ocorre
 * 
 * Uso:
 * <ErrorBoundary>
 *   <MinhaApp />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualizar estado para renderizar UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro no console
    console.error('🚨 [ErrorBoundary] Erro capturado:', error);
    console.error('📍 [ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Enviar para Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback padrão
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              {/* Ícone de erro */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Título */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Algo deu errado
              </h1>

              {/* Mensagem */}
              <p className="text-gray-600 mb-6">
                Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e
                estamos trabalhando para corrigir o problema.
              </p>

              {/* Detalhes do erro (apenas em dev) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-800 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleGoBack}
                  className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  Recarregar Página
                </button>
              </div>

              {/* Link para suporte */}
              <div className="mt-6 text-sm text-gray-500">
                Precisa de ajuda?{' '}
                <a
                  href="mailto:suporte@conectsuite.com.br"
                  className="text-[#159A9C] hover:underline"
                >
                  Entre em contato com o suporte
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-Order Component para adicionar Error Boundary
 * 
 * Uso:
 * const MeuComponenteSeguro = withErrorBoundary(MeuComponente);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function ComponentWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
