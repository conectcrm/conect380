import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import HeaderOtimizado from '@/components/layout/HeaderOtimizado';
import { ModalCadastroProduto } from './ModalCadastroProduto';

interface Produto {
  id: string;
  nome: string;
  codigo: string;
  preco: number;
  categoria: string;
  status: string;
  descricao?: string;
}

/**
 * Página Completa de Produtos com Header Otimizado
 * Demonstra como resolver problemas de overflow e densidade de informação
 */
export const PaginaProdutosOtimizada: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dados de exemplo
  const [produtos] = useState<Produto[]>([
    {
      id: '1',
      nome: 'Smartphone Galaxy S24',
      codigo: 'PHONE001',
      preco: 2499.99,
      categoria: 'eletrônicos',
      status: 'ativo',
      descricao: 'Smartphone premium com câmera de alta qualidade'
    },
    {
      id: '2',
      nome: 'Notebook Dell Inspiron',
      codigo: 'LAPTOP001',
      preco: 3299.99,
      categoria: 'eletrônicos',
      status: 'ativo',
      descricao: 'Notebook para uso profissional'
    },
    {
      id: '3',
      nome: 'Camiseta Nike',
      codigo: 'SHIRT001',
      preco: 89.99,
      categoria: 'roupas',
      status: 'inativo',
      descricao: 'Camiseta esportiva de alta qualidade'
    }
  ]);

  const handleSaveProduto = async (data: any) => {
    setIsLoading(true);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Salvando produto:', data);
    
    setIsLoading(false);
  };

  const handleEditProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setShowModal(true);
  };

  const handleNovoProduto = () => {
    setProdutoSelecionado(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setProdutoSelecionado(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-yellow-100 text-yellow-800',
      descontinuado: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status as keyof typeof statusConfig]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Otimizado - Sem Overflow */}
      <HeaderOtimizado 
        userInfo={{ 
          name: 'João Silva', 
          role: 'Administrador' 
        }}
      />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Cabeçalho da Página */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="heading-responsive text-gray-900">
                Produtos
              </h1>
              <p className="text-responsive text-gray-600 mt-1">
                Gerencie o catálogo de produtos do seu CRM
              </p>
            </div>
            
            <button
              onClick={handleNovoProduto}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption-responsive text-gray-500 uppercase tracking-wide">
                  Total de Produtos
                </p>
                <p className="metric-value text-2xl text-gray-900">
                  {produtos.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption-responsive text-gray-500 uppercase tracking-wide">
                  Produtos Ativos
                </p>
                <p className="metric-value text-2xl text-green-600">
                  {produtos.filter(p => p.status === 'ativo').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption-responsive text-gray-500 uppercase tracking-wide">
                  Valor Médio
                </p>
                <p className="metric-value text-2xl text-purple-600">
                  R$ {(produtos.reduce((acc, p) => acc + p.preco, 0) / produtos.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption-responsive text-gray-500 uppercase tracking-wide">
                  Categorias
                </p>
                <p className="metric-value text-2xl text-orange-600">
                  {new Set(produtos.map(p => p.categoria)).size}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="subheading-responsive text-gray-900">
              Lista de Produtos
            </h2>
          </div>

          {/* Versão Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header text-left p-4">Produto</th>
                  <th className="table-header text-left p-4">Código</th>
                  <th className="table-header text-left p-4">Categoria</th>
                  <th className="table-header text-right p-4">Preço</th>
                  <th className="table-header text-center p-4">Status</th>
                  <th className="table-header text-center p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="table-cell font-medium">{produto.nome}</p>
                        <p className="caption-responsive text-gray-500 mt-1">
                          {produto.descricao}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell-numeric p-4">{produto.codigo}</td>
                    <td className="table-cell p-4 capitalize">{produto.categoria}</td>
                    <td className="table-cell-numeric text-right p-4">
                      R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(produto.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditProduto(produto)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-blue-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile */}
          <div className="md:hidden">
            {produtos.map((produto) => (
              <div key={produto.id} className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="table-cell font-medium truncate">{produto.nome}</p>
                    <p className="caption-responsive text-gray-500">{produto.codigo}</p>
                  </div>
                  {getStatusBadge(produto.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="table-cell-numeric font-medium">
                      R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="caption-responsive text-gray-500 capitalize">
                      {produto.categoria}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditProduto(produto)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal de Cadastro */}
      <ModalCadastroProduto
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveProduto}
        produto={produtoSelecionado}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PaginaProdutosOtimizada;
