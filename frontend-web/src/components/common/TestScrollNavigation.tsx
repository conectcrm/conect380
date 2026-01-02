import React from 'react';
import { Link } from 'react-router-dom';
import { scrollToTop } from '../../hooks/useScrollToTop';

/**
 * Demonstração do comportamento de scroll automático
 * entre navegações de páginas.
 */
const TestScrollNavigation: React.FC = () => {
  const testarScrollProgramatico = () => {
    scrollToTop(); // Teste manual do scroll
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          ✅ Scroll Automático Implementado!
        </h2>
        <p className="text-blue-700 text-sm">
          Navegue entre as páginas usando os links abaixo. Você verá que cada página sempre inicia
          no topo.
        </p>
      </div>

      {/* Links de teste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/dashboard"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="font-medium text-gray-900">Dashboard</div>
          <div className="text-sm text-gray-500">Página principal</div>
        </Link>

        <Link
          to="/nuclei/vendas"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="font-medium text-gray-900">Núcleo Vendas</div>
          <div className="text-sm text-gray-500">Propostas e vendas</div>
        </Link>

        <Link
          to="/nuclei/financeiro"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="font-medium text-gray-900">Núcleo Financeiro</div>
          <div className="text-sm text-gray-500">Controle financeiro</div>
        </Link>

        <Link
          to="/nuclei/crm"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="font-medium text-gray-900">Núcleo CRM</div>
          <div className="text-sm text-gray-500">Clientes e relacionamento</div>
        </Link>

        <Link
          to="/nuclei/configuracoes"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="font-medium text-gray-900">Configurações</div>
          <div className="text-sm text-gray-500">Ajustes do sistema</div>
        </Link>

        <Link
          to="/billing"
          className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="font-medium text-gray-900">Billing</div>
          <div className="text-sm text-gray-500">Assinaturas e pagamentos</div>
        </Link>
      </div>

      {/* Botão de teste manual */}
      <div className="mt-8 p-4 bg-gray-50 border rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Teste Manual</h3>
        <p className="text-sm text-gray-600 mb-3">
          Role esta página para baixo e clique no botão para testar o scroll programático:
        </p>
        <button
          onClick={testarScrollProgramatico}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Voltar ao Topo
        </button>
      </div>

      {/* Conteúdo longo para demonstrar o scroll */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Demonstração de Scroll</h3>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-700">
              Parágrafo de demonstração #{i + 1}. Role para baixo para ver mais conteúdo e depois
              navegue para outra página para testar o scroll automático.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">✅ Funcionalidades Implementadas:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Scroll automático em todas as navegações</li>
          <li>• Animação suave (smooth scrolling)</li>
          <li>• Hook personalizado para uso manual</li>
          <li>• Função scrollToTop() para casos específicos</li>
          <li>• Zero impacto na performance</li>
          <li>• Compatível com todas as páginas existentes</li>
        </ul>
      </div>
    </div>
  );
};

export default TestScrollNavigation;
