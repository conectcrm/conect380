import React, { useState } from 'react';
import { ModalCadastroProduto } from '@/examples/ModalCadastroProduto';
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard } from '@/components/layout/ResponsiveLayout';
import { useResponsive } from '@/hooks/useResponsive';
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react';

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
 * Exemplo de página de produtos completamente responsiva
 * Demonstra o sistema de responsividade sem scroll horizontal
 */
export const ExemploProdutosResponsivo: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const [showModal, setShowModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([
    {
      id: '1',
      nome: 'Smartphone Galaxy S23',
      codigo: 'PROD001',
      preco: 2999.99,
      categoria: 'eletrônicos',
      status: 'ativo',
      descricao: 'Smartphone top de linha com câmera profissional'
    },
    {
      id: '2',
      nome: 'Camiseta Básica',
      codigo: 'PROD002',
      preco: 49.90,
      categoria: 'roupas',
      status: 'ativo'
    },
    {
      id: '3',
      nome: 'Sofá 3 Lugares',
      codigo: 'PROD003',
      preco: 1299.00,
      categoria: 'casa',
      status: 'descontinuado'
    }
  ]);

  const handleSaveProduto = async (data: any) => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (produtoSelecionado) {
      // Atualizar produto existente
      setProdutos(prev => prev.map(p => 
        p.id === produtoSelecionado.id 
          ? { ...p, ...data }
          : p
      ));
    } else {
      // Criar novo produto
      const novoProduto = {
        id: Date.now().toString(),
        ...data
      };
      setProdutos(prev => [...prev, novoProduto]);
    }
    
    setProdutoSelecionado(null);
  };

  const handleEditProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setShowModal(true);
  };

  const handleNovoProduto = () => {
    setProdutoSelecionado(null);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-yellow-100 text-yellow-800';
      case 'descontinuado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  return (
    <ResponsiveLayout maxWidth="1600px">
      {/* Header responsivo */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="heading-responsive font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Produtos
            </h1>
            <p className="text-responsive text-gray-600 mt-1">
              Gerencie o catálogo de produtos
            </p>
          </div>
          
          <button
            onClick={handleNovoProduto}
            className={`btn bg-blue-600 text-white hover:bg-blue-700 ${isMobile ? 'w-full' : ''}`}
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Barra de pesquisa responsiva */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Estatísticas responsivas */}
      <ResponsiveGrid 
        columns={{ mobile: 1, tablet: 2, desktop: 4 }}
        className="mb-6"
      >
        <ResponsiveCard className="text-center">
          <div className="text-2xl font-bold text-blue-600">{produtos.length}</div>
          <div className="text-sm text-gray-600">Total de Produtos</div>
        </ResponsiveCard>
        
        <ResponsiveCard className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {produtos.filter(p => p.status === 'ativo').length}
          </div>
          <div className="text-sm text-gray-600">Produtos Ativos</div>
        </ResponsiveCard>
        
        <ResponsiveCard className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {produtos.filter(p => p.status === 'inativo').length}
          </div>
          <div className="text-sm text-gray-600">Produtos Inativos</div>
        </ResponsiveCard>
        
        <ResponsiveCard className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {produtos.filter(p => p.status === 'descontinuado').length}
          </div>
          <div className="text-sm text-gray-600">Descontinuados</div>
        </ResponsiveCard>
      </ResponsiveGrid>

      {/* Lista de produtos responsiva */}
      {isMobile ? (
        // Layout de cards para mobile
        <div className="space-y-4">
          {produtos.map((produto) => (
            <ResponsiveCard key={produto.id}>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 break-words">
                      {produto.nome}
                    </h3>
                    <p className="text-sm text-gray-600">{produto.codigo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(produto.status)}`}>
                    {produto.status}
                  </span>
                </div>
                
                <div className="text-lg font-bold text-green-600">
                  {formatPreco(produto.preco)}
                </div>
                
                <div className="text-sm text-gray-600 capitalize">
                  {produto.categoria}
                </div>
                
                {produto.descricao && (
                  <p className="text-sm text-gray-700 break-words">
                    {produto.descricao}
                  </p>
                )}
                
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleEditProduto(produto)}
                    className="flex-1 btn bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    className="flex-1 btn bg-red-600 text-white hover:bg-red-700 text-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </div>
              </div>
            </ResponsiveCard>
          ))}
        </div>
      ) : (
        // Layout de tabela para tablet/desktop
        <ResponsiveCard>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 break-words max-w-xs">
                          {produto.nome}
                        </div>
                        {produto.descricao && (
                          <div className="text-sm text-gray-500 break-words max-w-xs">
                            {produto.descricao.length > 50 
                              ? `${produto.descricao.slice(0, 50)}...` 
                              : produto.descricao
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {produto.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatPreco(produto.preco)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {produto.categoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(produto.status)}`}>
                        {produto.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditProduto(produto)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Editar produto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Excluir produto"
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
        </ResponsiveCard>
      )}

      {/* Modal responsivo */}
      <ModalCadastroProduto
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setProdutoSelecionado(null);
        }}
        onSave={handleSaveProduto}
        produto={produtoSelecionado}
      />
    </ResponsiveLayout>
  );
};
