import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Package,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
  X,
  DollarSign,
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
    color: 'bg-[#DEEFE7] text-[#0F7B7D] border-[#159A9C]/40',
    icon: Check
  },
  inativo: {
    label: 'Inativo',
    color: 'bg-white text-[#B4BEC9] border-[#B4BEC9]',
    icon: X
  },
  descontinuado: {
    label: 'Descontinuado',
    color: 'bg-[#B4BEC9]/40 text-[#002333] border-[#B4BEC9]',
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
  const [isExporting, setIsExporting] = useState(false);

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

  const categorias = useMemo(() => Array.from(new Set(produtos.map(produto => produto.categoria))), [produtos]);

  const handleExport = useCallback(async () => {
    if (produtosFiltrados.length === 0) {
      toast.error('Nenhum produto disponível para exportação.');
      return;
    }

    try {
      setIsExporting(true);

      const headers = [
        'Nome',
        'SKU',
        'Categoria',
        'Status',
        'Preço',
        'Custo',
        'Estoque Atual',
        'Estoque Mínimo',
        'Estoque Máximo',
        'Fornecedor',
        'Vendas (Mês)',
        'Vendas (Total)',
        'Criado em',
        'Atualizado em'
      ];

      const sanitize = (value: unknown) => {
        if (value === null || value === undefined) {
          return '';
        }

        if (value instanceof Date) {
          return value.toISOString();
        }

        const text = String(value);
        return text.includes('"') ? text.split('"').join('""') : text;
      };

      const formatNumber = (value: number | null | undefined) => (
        typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : ''
      );

      const rows = produtosFiltrados.map((produto) => ([
        produto.nome,
        produto.sku,
        produto.categoria,
        statusConfig[produto.status]?.label ?? produto.status,
        formatNumber(produto.preco),
        formatNumber(produto.custoUnitario),
        produto.estoque.atual,
        produto.estoque.minimo,
        produto.estoque.maximo,
        produto.fornecedor,
        produto.vendas.mes,
        produto.vendas.total,
        produto.criadoEm,
        produto.atualizadoEm
      ].map(sanitize)));

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(';'))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `produtos_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Exportação concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar produtos:', error);
      toast.error('Não foi possível exportar os produtos.');
    } finally {
      setIsExporting(false);
    }
  }, [produtosFiltrados]);

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
      return { label: 'Baixo', color: 'text-[#002333]', icon: AlertTriangle };
    } else if (produto.estoque.atual >= produto.estoque.maximo * 0.8) {
      return { label: 'Alto', color: 'text-[#0F7B7D]', icon: Check };
    } else {
      return { label: 'Normal', color: 'text-[#159A9C]', icon: Check };
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

  const statCards = useMemo(() => ([
    {
      key: 'total-produtos',
      label: 'Total de Produtos',
      value: estatisticas.totalProdutos,
      description: 'Itens cadastrados no catálogo',
      iconWrapper: 'bg-[#159A9C]',
      iconColor: 'text-white',
      Icon: Package
    },
    {
      key: 'produtos-ativos',
      label: 'Produtos Ativos',
      value: estatisticas.produtosAtivos,
      description: 'Disponíveis para venda',
      iconWrapper: 'bg-[#0F7B7D]',
      iconColor: 'text-white',
      Icon: Check
    },
    {
      key: 'faturamento',
      label: 'Faturamento Total',
      value: formatCurrency(estatisticas.valorTotal),
      description: 'Receita acumulada',
      iconWrapper: 'bg-[#002333]',
      iconColor: 'text-white',
      Icon: DollarSign
    },
    {
      key: 'estoques-baixos',
      label: 'Estoques Baixos',
      value: estatisticas.estoquesBaixos,
      description: 'Itens exigindo reposição',
      iconWrapper: 'bg-white border border-[#B4BEC9]',
      iconColor: 'text-[#002333]',
      Icon: AlertTriangle
    }
  ]), [estatisticas]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto"></div>
          <p className="mt-4 text-[#002333]/70">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Padronizado */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Produtos"
          nucleusPath="/nuclei/produtos"
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Package className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Produtos
                </h1>
                <p className="mt-2 text-[#002333]/70">
                  Gestão completa do catálogo de produtos e serviços
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/produtos/categorias')}
                  className="inline-flex items-center px-4 py-2 border border-[#B4BEC9] text-sm font-medium rounded-lg text-[#002333] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C]/40 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Categorias
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting || produtosFiltrados.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-[#B4BEC9] text-sm font-medium rounded-lg text-[#002333] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exportando...' : 'Exportar'}
                </button>

                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] hover:from-[#0F7B7D] hover:to-[#0C6062] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C]/40 transition-all shadow-sm hover:shadow-md"
                  onClick={handleNovoProduto}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </button>
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map(({ key, label, value, description, iconWrapper, iconColor, Icon }) => (
              <div
                key={key}
                className="rounded-xl p-6 shadow-sm border border-[#DEEFE7] bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#002333]/70 uppercase tracking-wide">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">{value}</p>
                    <p className="mt-3 text-xs text-[#002333]/70">{description}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${iconWrapper}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, SKU ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C]/40 focus:border-[#159A9C] text-[#002333] placeholder-[#B4BEC9]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C]/40 focus:border-[#159A9C] text-[#002333]"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="descontinuado">Descontinuado</option>
                </select>

                <select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C]/40 focus:border-[#159A9C] text-[#002333]"
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
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7]">
            <div className="px-6 py-4 border-b border-[#DEEFE7]">
              <h3 className="text-lg font-semibold text-[#002333]">
                Lista de Produtos ({produtosFiltrados.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#DEEFE7]">
                <thead className="bg-[#DEEFE7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Vendas (Mês)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#DEEFE7]">
                  {produtosFiltrados.map((produto) => {
                    const statusInfo = statusConfig[produto.status];
                    const estoqueStatus = getEstoqueStatus(produto);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={produto.id} className="hover:bg-[#DEEFE7]/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-[#002333]">
                              {produto.nome}
                            </div>
                            <div className="text-xs text-[#002333]/70">
                              SKU: {produto.sku}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-[#002333] font-medium">{produto.categoria}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#002333] font-semibold">
                            {formatCurrency(produto.preco)}
                          </div>
                          <div className="text-xs text-[#002333]/70">
                            Custo: {formatCurrency(produto.custoUnitario)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {produto.categoria === 'Serviços' ? (
                            <span className="text-sm text-[#002333]/70">N/A</span>
                          ) : (
                            <div className="text-sm">
                              <div className={`font-medium ${estoqueStatus?.color}`}>
                                {produto.estoque.atual} un.
                              </div>
                              <div className="text-xs text-[#002333]/70">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 text-[#159A9C] mr-1" />
                            {produto.vendas.mes}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openModal(produto)}
                              className="text-[#159A9C] hover:text-[#0F7B7D] p-1 rounded hover:bg-[#DEEFE7] transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditarProduto(produto)}
                              className="text-[#0F7B7D] hover:text-[#159A9C] p-1 rounded hover:bg-[#DEEFE7] transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExcluirProduto(produto)}
                              className="text-[#002333] hover:text-[#0F7B7D] p-1 rounded hover:bg-[#B4BEC9]/30 transition-colors"
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
                  <Package className="mx-auto h-12 w-12 text-[#B4BEC9]" />
                  <h3 className="mt-2 text-sm font-semibold text-[#002333]">Nenhum produto encontrado</h3>
                  <p className="mt-1 text-sm text-[#002333]/70">
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
      </div>

      {/* Modal de Visualização */}
      {isModalOpen && selectedProduto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-[#002333]">
                  Detalhes do Produto
                </h3>
                <button
                  onClick={closeModal}
                  className="text-[#B4BEC9] hover:text-[#002333] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#002333]">Nome</h4>
                  <p className="text-sm text-[#002333]/70">{selectedProduto.nome}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">SKU</h4>
                    <p className="text-sm text-[#002333]/70">{selectedProduto.sku}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Categoria</h4>
                    <p className="text-sm text-[#002333]/70">{selectedProduto.categoria}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Preço</h4>
                    <p className="text-sm text-[#002333]/70">{formatCurrency(selectedProduto.preco)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Custo</h4>
                    <p className="text-sm text-[#002333]/70">{formatCurrency(selectedProduto.custoUnitario)}</p>
                  </div>
                </div>

                {selectedProduto.categoria !== 'Serviços' && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Estoque</h4>
                    <p className="text-sm text-[#002333]/70">
                      Atual: {selectedProduto.estoque.atual} |
                      Mínimo: {selectedProduto.estoque.minimo} |
                      Máximo: {selectedProduto.estoque.maximo}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-[#002333]">Descrição</h4>
                  <p className="text-sm text-[#002333]/70">{selectedProduto.descricao || 'Sem descrição'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Criado em</h4>
                    <p className="text-sm text-[#002333]/70">{formatDate(selectedProduto.criadoEm)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Atualizado em</h4>
                    <p className="text-sm text-[#002333]/70">{formatDate(selectedProduto.atualizadoEm)}</p>
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
                <div className="w-12 h-12 bg-[#DEEFE7] rounded-full flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-[#002333]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#002333]">Confirmar Exclusão</h3>
                  <p className="text-sm text-[#002333]/70">Esta ação não pode ser desfeita.</p>
                </div>
              </div>

              <p className="text-sm text-[#002333] mb-6">
                Tem certeza que deseja excluir o produto <strong>"{produtoParaExcluir.nome}"</strong>?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelarExclusao}
                  className="px-4 py-2 border border-[#B4BEC9] text-sm font-medium rounded-lg text-[#002333] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C]/40"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  className="px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#002333] hover:bg-[#0F7B7D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C]/40"
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
