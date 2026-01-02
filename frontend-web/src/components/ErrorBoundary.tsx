import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary capturou um erro:', error);
    console.error('📍 Stack trace completo:', errorInfo.componentStack);
    console.error('📊 Detalhes do erro:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold">!</span>
              </div>
              <h1 className="text-xl font-bold text-red-800">Erro de Renderização Detectado</h1>
            </div>

            <div className="space-y-4">
              <div className="bg-red-100 border border-red-300 rounded p-3">
                <h3 className="font-semibold text-red-800 mb-2">Mensagem do Erro:</h3>
                <p className="text-red-700 font-mono text-sm">{this.state.error?.message}</p>
              </div>

              {this.state.errorInfo && (
                <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                  <h3 className="font-semibold text-yellow-800 mb-2">Stack do Componente:</h3>
                  <pre className="text-yellow-700 text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="bg-blue-100 border border-blue-300 rounded p-3">
                <h3 className="font-semibold text-blue-800 mb-2">Possível Solução:</h3>
                <p className="text-blue-700 text-sm">
                  Este erro geralmente ocorre quando um objeto é renderizado diretamente no JSX.
                  Verifique se há algo como{' '}
                  <code className="bg-blue-200 px-1 rounded">{'<div>{objeto}</div>'}</code>
                  ao invés de{' '}
                  <code className="bg-blue-200 px-1 rounded">
                    {'<div>{objeto.propriedade}</div>'}
                  </code>
                </p>
              </div>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                  window.location.reload();
                }}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
