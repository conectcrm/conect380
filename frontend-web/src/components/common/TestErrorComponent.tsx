import React, { useState } from 'react';
import { AlertCircle, Bug, XCircle, Info } from 'lucide-react';

/**
 * Componente de Teste de Erros
 * 
 * Permite testar diferentes tipos de erros para validar integração com Sentry
 * 
 * ⚠️ ATENÇÃO: Este componente é APENAS para desenvolvimento/testing!
 * NÃO incluir em produção ou deixar acessível em rotas públicas.
 * 
 * Uso:
 * - Adicionar em rota admin/dev only
 * - Testar cada tipo de erro
 * - Verificar Sentry dashboard se erros foram capturados
 */
const TestErrorComponent: React.FC = () => {
  const [shouldThrowRender, setShouldThrowRender] = useState(false);

  // Erro 1: Erro em evento de click (tratado por ErrorBoundary)
  const handleThrowClickError = () => {
    throw new Error('Test Error (Click Handler) - ' + new Date().toISOString());
  };

  // Erro 2: Erro assíncrono (Promise rejection)
  const handleThrowAsyncError = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error('Test Error (Async Promise) - ' + new Date().toISOString());
  };

  // Erro 3: Erro de rede simulado
  const handleThrowNetworkError = async () => {
    try {
      const response = await fetch('https://api.example.com/nonexistent-endpoint-12345');
      if (!response.ok) {
        throw new Error(`Network Error: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      // Re-throw para Sentry capturar
      throw new Error('Test Error (Network) - ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Erro 4: Erro de null/undefined
  const handleThrowNullError = () => {
    const obj: any = null;
    // Vai lançar "Cannot read property 'nonExistent' of null"
    console.log(obj.nonExistent.property);
  };

  // Erro 5: Erro em render (componentDidCatch captura)
  if (shouldThrowRender) {
    throw new Error('Test Error (Render) - ' + new Date().toISOString());
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header de aviso */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                ⚠️ Componente de Teste - Apenas Desenvolvimento
              </h3>
              <p className="text-sm text-yellow-700">
                Este componente permite testar erros para validar a integração com Sentry.
                <strong> NÃO usar em produção!</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-6">
            <Bug className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Test Error Component
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Clique nos botões abaixo para testar diferentes tipos de erros
              </p>
            </div>
          </div>

          {/* Info sobre Sentry */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como validar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abra o console do navegador (F12)</li>
                  <li>Clique em um dos botões de erro</li>
                  <li>Verifique a mensagem "📤 [Sentry] Enviando erro..." no console</li>
                  <li>Acesse o dashboard do Sentry para ver o erro capturado</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Grid de botões de teste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Erro 1: Click Handler */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                Erro em Click Handler
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Lança erro síncrono em evento de click
              </p>
              <button
                onClick={handleThrowClickError}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Testar Erro de Click
              </button>
            </div>

            {/* Erro 2: Async Error */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <XCircle className="h-4 w-4 text-orange-600 mr-2" />
                Erro Assíncrono (Promise)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Rejeita uma Promise após 500ms
              </p>
              <button
                onClick={() => {
                  handleThrowAsyncError().catch((err) => {
                    console.error('Caught async error:', err);
                    throw err; // Re-throw para Sentry
                  });
                }}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                Testar Erro Async
              </button>
            </div>

            {/* Erro 3: Network Error */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <XCircle className="h-4 w-4 text-purple-600 mr-2" />
                Erro de Rede (Fetch)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Tenta fazer fetch em endpoint inexistente
              </p>
              <button
                onClick={() => {
                  handleThrowNetworkError().catch((err) => {
                    console.error('Caught network error:', err);
                    throw err;
                  });
                }}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Testar Erro de Rede
              </button>
            </div>

            {/* Erro 4: Null Reference */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <XCircle className="h-4 w-4 text-pink-600 mr-2" />
                Erro de Null Reference
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Tenta acessar propriedade de objeto null
              </p>
              <button
                onClick={handleThrowNullError}
                className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
              >
                Testar Erro Null
              </button>
            </div>

            {/* Erro 5: Render Error */}
            <div className="border rounded-lg p-4 md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <XCircle className="h-4 w-4 text-red-800 mr-2" />
                Erro em Render (componentDidCatch)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Lança erro durante renderização - <strong>vai quebrar a tela!</strong>
                <br />
                ErrorBoundary vai capturar e mostrar UI de fallback.
              </p>
              <button
                onClick={() => setShouldThrowRender(true)}
                className="w-full px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors text-sm font-medium"
              >
                ⚠️ Testar Erro de Render (vai quebrar a página)
              </button>
            </div>
          </div>

          {/* Instruções adicionais */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-2">
              📝 Checklist de Validação
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                Console mostra mensagem "📤 [Sentry] Enviando erro..."
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                Sentry dashboard recebe o evento
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                Stack trace está completo no Sentry
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                Erro de render mostra ErrorBoundary UI
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                Tags de environment/release estão corretas
              </li>
            </ul>
          </div>
        </div>

        {/* Link para Sentry */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Após testar, acesse o{' '}
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#159A9C] hover:underline font-medium"
          >
            Dashboard do Sentry
          </a>
          {' '}para ver os erros capturados
        </div>
      </div>
    </div>
  );
};

export default TestErrorComponent;
