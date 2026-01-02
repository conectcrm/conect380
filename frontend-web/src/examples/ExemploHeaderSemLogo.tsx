import React, { useState } from 'react';
import HeaderSemLogo from '@/components/layout/HeaderSemLogo';
import { ModalCadastroProduto } from './ModalCadastroProduto';
import { Package, Plus, Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';

/**
 * Exemplo Completo: Header Sem Logo
 *
 * Demonstra como o header otimizado se comporta em uma página real
 * com conteúdo dinâmico e diferentes resoluções
 */
export const ExemploHeaderSemLogo: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Dados de exemplo
  const produtos = [
    {
      id: 1,
      nome: 'Smartphone Galaxy S23',
      codigo: 'PROD001',
      preco: 2899.9,
      categoria: 'eletrônicos',
      status: 'ativo',
      descricao: 'Smartphone premium com câmera avançada',
    },
    {
      id: 2,
      nome: 'Notebook Dell Inspiron',
      codigo: 'PROD002',
      preco: 3299.9,
      categoria: 'eletrônicos',
      status: 'ativo',
      descricao: 'Notebook para uso profissional',
    },
    {
      id: 3,
      nome: 'Camiseta Polo',
      codigo: 'PROD003',
      preco: 89.9,
      categoria: 'roupas',
      status: 'inativo',
      descricao: 'Camiseta polo em algodão',
    },
  ];

  const handleSaveProduto = async (data: any) => {
    // Simular chamada da API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log('Produto salvo:', data);
    // Aqui você faria a chamada real para a API
  };

  const handleEditProduto = (produto: any) => {
    setProdutoSelecionado(produto);
    setShowModal(true);
  };

  const handleNewProduto = () => {
    setProdutoSelecionado(null);
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ativo: 'bg-green-100 text-green-800 border-green-200',
      inativo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      descontinuado: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${styles[status as keyof typeof styles]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header Sem Logo - Ultra Compacto */}
      <HeaderSemLogo
        userInfo={{
          name: 'João Silva',
          role: 'Administrador',
          email: 'joao.silva@empresa.com',
        }}
        companyName="Fênix CRM Demo"
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />

      {/* Sidebar Simulada (com logo) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30">
        <div className="p-4">
          {/* Logo na Sidebar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Fênix CRM</h1>
              <p className="text-xs text-gray-500">Sistema de Gestão</p>
            </div>
          </div>

          {/* Menu da Sidebar */}
          <nav className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Principal
            </div>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-blue-600 bg-blue-50 border border-blue-200"
            >
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Produtos</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <span className="w-4 h-4">👥</span>
              <span className="text-sm">Clientes</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <span className="w-4 h-4">📋</span>
              <span className="text-sm">Propostas</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="ml-64 pt-16">
        <div className="p-6">
          {/* Cabeçalho da Página */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Produtos
                </h1>
                <p className="text-gray-600 text-sm mt-1">Gerencie seu catálogo de produtos</p>
              </div>

              <button
                onClick={handleNewProduto}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Novo Produto
              </button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Filter className="w-4 h-4 text-gray-500" />
                Filtros
              </button>
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Cabeçalho da Tabela */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-3">Produto</div>
                <div className="col-span-2">Código</div>
                <div className="col-span-2">Categoria</div>
                <div className="col-span-2">Preço</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Ações</div>
              </div>
            </div>

            {/* Linhas da Tabela */}
            <div className="divide-y divide-gray-200">
              {produtos.map((produto) => (
                <div key={produto.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{produto.nome}</p>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                          {produto.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                        {produto.codigo}
                      </code>
                    </div>

                    <div className="col-span-2">
                      <span className="text-sm text-gray-700 capitalize">{produto.categoria}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="font-medium text-gray-900 text-sm">
                        R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="col-span-2">{getStatusBadge(produto.status)}</div>

                    <div className="col-span-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditProduto(produto)}
                          className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer da Tabela */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {produtos.length} de {produtos.length} produtos
                </span>
                <div className="flex items-center gap-2">
                  <span>Linhas por página:</span>
                  <select className="border border-gray-200 rounded px-2 py-1 text-xs">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Produto */}
      <ModalCadastroProduto
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveProduto}
        produto={produtoSelecionado}
      />
    </div>
  );
};

export default ExemploHeaderSemLogo;
