import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Package,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
  X,
  DollarSign,
  ShoppingCart,
  Settings
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ModalCadastroProduto } from '../../components/modals/ModalCadastroProdutoLandscape';
import { produtosService, Produto, ProdutoEstatisticas } from '../../services/produtosService';
import toast from 'react-hot-toast';

// Interface para o novo modal
interface ProdutoFormData {
  nome: string;
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'aplicativo';
  categoria: string;
  precoUnitario: number;
  frequencia: 'unico' | 'mensal' | 'anual';
  unidadeMedida: 'unidade' | 'saca' | 'hectare' | 'pacote' | 'licenca';
  status: boolean;
  descricao?: string;
  tags?: string[];
  variacoes?: string[];
}

// Interface para compatibilidade com o componente atual
interface ProdutoLegacy {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  custoUnitario: number;
  estoque: {
    atual: number;
    minimo: number;
    maximo: number;
  };
  status: 'ativo' | 'inativo' | 'descontinuado';
  vendas: {
    mes: number;
    total: number;
  };
  fornecedor: string;
  sku: string;
  descricao: string;
  criadoEm: string;
  atualizadoEm: string;
}

const statusConfig = {
  ativo: { 
    label: 'Ativo', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Check
  },
  inativo: { 
    label: 'Inativo', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: X
  },
  descontinuado: { 
    label: 'Descontinuado', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle
  }
};

const ProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados principais
  const [produtos, setProdutos] = useState<ProdutoLegacy[]>([]);
  const [estatisticas, setEstatisticas] = useState<ProdutoEstatisticas>({
    totalProdutos: 0,
    produtosAtivos: 0,
    vendasMes: 0,
    valorTotal: 0,
    estoquesBaixos: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [selectedProduto, setSelectedProduto] = useState<ProdutoLegacy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para o modal de cadastro
  const [showModalAvancado, setShowModalAvancado] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<ProdutoFormData & { produtoId?: string } | null>(null);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  
  // Estados para confirmação de exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<ProdutoLegacy | null>(null);

  // Função para carregar produtos do backend
  const carregarProdutos = async () => {
    try {
      setIsLoading(true);
      const produtosAPI = await produtosService.findAll();
      const produtosFormatados = produtosAPI.map(produtosService.transformApiToLegacy);
      setProdutos(produtosFormatados);
      
      // Carregar estatísticas
      const estatisticasAPI = await produtosService.getEstatisticas();
      setEstatisticas(estatisticasAPI);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos. Verifique se o backend está funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarProdutos();
  }, []);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           produto.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || produto.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'todas' || produto.categoria === categoriaFilter;
      
      return matchesSearch && matchesStatus && matchesCategoria;
    });
  }, [produtos, searchTerm, statusFilter, categoriaFilter]);

  const categorias = Array.from(new Set(produtos.map(produto => produto.categoria)));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEstoqueStatus = (produto: ProdutoLegacy) => {
    if (produto.categoria === 'Serviços') return null;
    
    if (produto.estoque.atual <= produto.estoque.minimo) {
      return { label: 'Baixo', color: 'text-red-600', icon: AlertTriangle };
    } else if (produto.estoque.atual >= produto.estoque.maximo * 0.8) {
      return { label: 'Alto', color: 'text-green-600', icon: Check };
    } else {
      return { label: 'Normal', color: 'text-yellow-600', icon: Check };
    }
  };

  const openModal = (produto: ProdutoLegacy) => {
    setSelectedProduto(produto);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduto(null);
    setIsModalOpen(false);
  };
  
  // Funções para o modal de cadastro
  const handleNovoProduto = () => {
    setProdutoParaEditar(null);
    setShowModalAvancado(true);
  };
  
  const handleEditarProduto = (produto: ProdutoLegacy) => {
    // Converter produto existente para formato do novo modal
    setProdutoParaEditar({
      produtoId: produto.id,
      nome: produto.nome,
      tipoItem: 'produto', // Mapear para as opções do novo modal
      categoria: produto.categoria,
      precoUnitario: produto.preco,
      frequencia: 'unico',
      unidadeMedida: 'unidade',
      status: produto.status === 'ativo',
      descricao: produto.descricao,
      tags: [],
      variacoes: []
    });
    setShowModalAvancado(true);
  };
  
  const handleExcluirProduto = (produto: ProdutoLegacy) => {
    setProdutoParaExcluir(produto);
    setShowConfirmDelete(true);
  };
  
  const confirmarExclusao = async () => {
    if (produtoParaExcluir) {
      try {
        await produtosService.delete(produtoParaExcluir.id);
        await carregarProdutos(); // Recarregar lista
        toast.success(`Produto "${produtoParaExcluir.nome}" excluído com sucesso!`);
        setShowConfirmDelete(false);
        setProdutoParaExcluir(null);
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        toast.error('Erro ao excluir produto');
      }
    }
  };
  
  const cancelarExclusao = () => {
    setShowConfirmDelete(false);
    setProdutoParaExcluir(null);
  };

  const handleSaveProduto = async (data: ProdutoFormData) => {
    setIsLoadingSave(true);
    
    try {
      // Converter formato do modal para API
      const produtoData = produtosService.transformFormToApi(data);
      
      if (produtoParaEditar && produtoParaEditar.produtoId) {
        // Atualizar produto existente
        await produtosService.update(produtoParaEditar.produtoId, produtoData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        await produtosService.create(produtoData);
        toast.success('Produto criado com sucesso!');
      }
      
      // Recarregar lista
      await carregarProdutos();
      
      setShowModalAvancado(false);
      setProdutoParaEditar(null);
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
      throw error; // Modal tratará o erro
    } finally {
      setIsLoadingSave(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#DEEFE7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex-1 min-w-0">
              <BackToNucleus 
                nucleusName="Produtos"
                nucleusPath="/nuclei/produtos"
                currentModuleName="Produtos"
              />
              <p className="mt-1 text-sm text-gray-500">
                Gestão completa do catálogo de produtos e serviços
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => navigate('/produtos/categorias')}
                className="inline-flex items-center px-4 py-2 border border-[#159A9C] text-sm font-medium rounded-lg text-[#159A9C] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Categorias
              </button>
              
              <button className="inline-flex items-center px-4 py-2 border border-[#159A9C] text-sm font-medium rounded-lg text-[#159A9C] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#159A9C] hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors"
                onClick={handleNovoProduto}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Produtos</p>
                <p className="text-2xl font-bold text-[#002333]">{estatisticas.totalProdutos}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-bold text-[#002333]">{estatisticas.produtosAtivos}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas Mês</p>
                <p className="text-2xl font-bold text-[#002333]">{estatisticas.vendasMes}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold text-[#002333]">{formatCurrency(estatisticas.valorTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoques Baixos</p>
                <p className="text-2xl font-bold text-[#002333]">{estatisticas.estoquesBaixos}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, SKU ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="descontinuado">Descontinuado</option>
              </select>
              
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
              >
                <option value="todas">Todas as Categorias</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Produtos ({produtosFiltrados.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendas (Mês)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosFiltrados.map((produto) => {
                  const statusInfo = statusConfig[produto.status];
                  const estoqueStatus = getEstoqueStatus(produto);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {produto.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {produto.sku}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{produto.categoria}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(produto.preco)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Custo: {formatCurrency(produto.custoUnitario)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {produto.categoria === 'Serviços' ? (
                          <span className="text-sm text-gray-500">N/A</span>
                        ) : (
                          <div className="text-sm">
                            <div className={`font-medium ${estoqueStatus?.color}`}>
                              {produto.estoque.atual} un.
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {produto.estoque.minimo} | Max: {produto.estoque.maximo}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          {produto.vendas.mes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openModal(produto)}
                            className="text-[#159A9C] hover:text-[#0d7a7d] p-1 rounded hover:bg-gray-100"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditarProduto(produto)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-gray-100"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExcluirProduto(produto)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-gray-100"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {produtosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {produtos.length === 0 
                    ? 'Comece criando seu primeiro produto.'
                    : 'Tente ajustar os filtros ou termos de busca.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Visualização */}
      {isModalOpen && selectedProduto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes do Produto
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Nome</h4>
                  <p className="text-sm text-gray-900">{selectedProduto.nome}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">SKU</h4>
                    <p className="text-sm text-gray-900">{selectedProduto.sku}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Categoria</h4>
                    <p className="text-sm text-gray-900">{selectedProduto.categoria}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Preço</h4>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedProduto.preco)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Custo</h4>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedProduto.custoUnitario)}</p>
                  </div>
                </div>
                
                {selectedProduto.categoria !== 'Serviços' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Estoque</h4>
                    <p className="text-sm text-gray-900">
                      Atual: {selectedProduto.estoque.atual} | 
                      Mínimo: {selectedProduto.estoque.minimo} | 
                      Máximo: {selectedProduto.estoque.maximo}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Descrição</h4>
                  <p className="text-sm text-gray-900">{selectedProduto.descricao || 'Sem descrição'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Criado em</h4>
                    <p className="text-sm text-gray-900">{formatDate(selectedProduto.criadoEm)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Atualizado em</h4>
                    <p className="text-sm text-gray-900">{formatDate(selectedProduto.atualizadoEm)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição - Landscape */}
      <ModalCadastroProduto
        isOpen={showModalAvancado}
        onClose={() => {
          setShowModalAvancado(false);
          setProdutoParaEditar(null);
        }}
        onSubmit={handleSaveProduto}
        produtoEditando={produtoParaEditar}
        loading={isLoadingSave}
      />

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmDelete && produtoParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
                  <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-6">
                Tem certeza que deseja excluir o produto <strong>"{produtoParaExcluir.nome}"</strong>?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelarExclusao}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutosPage;
