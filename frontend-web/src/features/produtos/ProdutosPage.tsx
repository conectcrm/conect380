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
  Settings,
  Lightbulb,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { useConfirmation } from '../../hooks/useConfirmation';
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
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'aplicativo';
  categoria: string;
  preco: number;
  custoUnitario: number;
  frequencia: 'unico' | 'mensal' | 'anual';
  unidadeMedida: 'unidade' | 'saca' | 'hectare' | 'pacote' | 'licenca';
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
    icon: Check,
  },
  inativo: {
    label: 'Inativo',
    color: 'bg-white text-[#B4BEC9] border-[#B4BEC9]',
    icon: X,
  },
  descontinuado: {
    label: 'Descontinuado',
    color: 'bg-[#B4BEC9]/40 text-[#002333] border-[#B4BEC9]',
    icon: AlertTriangle,
  },
};

const tipoItemConfig = {
  produto: 'Produto',
  servico: 'Serviço',
  licenca: 'Licença',
  modulo: 'Módulo',
  aplicativo: 'Aplicativo',
};

const ProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirmationState, showConfirmation } = useConfirmation();

  // Estados principais
  const [produtos, setProdutos] = useState<ProdutoLegacy[]>([]);
  const [estatisticas, setEstatisticas] = useState<ProdutoEstatisticas>({
    totalProdutos: 0,
    produtosAtivos: 0,
    vendasMes: 0,
    valorTotal: 0,
    estoquesBaixos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProduto, setSelectedProduto] = useState<ProdutoLegacy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para o modal de cadastro
  const [showModalAvancado, setShowModalAvancado] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<
    (ProdutoFormData & { produtoId?: string }) | null
  >(null);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Função para carregar produtos do backend
  const carregarProdutos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const produtosAPI = await produtosService.findAll();
      const produtosFormatados = produtosAPI.map(produtosService.transformApiToLegacy);
      setProdutos(produtosFormatados);

      // Carregar estatísticas
      const estatisticasAPI = await produtosService.getEstatisticas();
      setEstatisticas(estatisticasAPI);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setError('Erro ao carregar produtos. Tente novamente.');
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
    return produtos.filter((produto) => {
      const matchesSearch =
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || produto.status === statusFilter;
      const matchesTipo = tipoFilter === 'todos' || produto.tipoItem === tipoFilter;
      const matchesCategoria = categoriaFilter === 'todas' || produto.categoria === categoriaFilter;

      return matchesSearch && matchesStatus && matchesTipo && matchesCategoria;
    });
  }, [produtos, searchTerm, statusFilter, tipoFilter, categoriaFilter]);

  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((produto) => produto.categoria))),
    [produtos],
  );

  const tipos = useMemo(() => Array.from(new Set(produtos.map((produto) => produto.tipoItem))), [produtos]);

  const hasFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== 'todos' ||
    tipoFilter !== 'todos' ||
    categoriaFilter !== 'todas';

  const totalPages = Math.max(1, Math.ceil(produtosFiltrados.length / itemsPerPage));

  const produtosPagina = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return produtosFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [produtosFiltrados, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, tipoFilter, categoriaFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setTipoFilter('todos');
    setCategoriaFilter('todas');
    setCurrentPage(1);
  };

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
        'Atualizado em',
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

      const formatNumber = (value: number | null | undefined) =>
        typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '';

      const rows = produtosFiltrados.map((produto) =>
        [
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
          produto.atualizadoEm,
        ].map(sanitize),
      );

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
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEstoqueStatus = (produto: ProdutoLegacy) => {
    if (produto.tipoItem !== 'produto') return null;

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
      tipoItem: produto.tipoItem,
      categoria: produto.categoria,
      precoUnitario: produto.preco,
      frequencia: produto.frequencia,
      unidadeMedida: produto.unidadeMedida,
      status: produto.status === 'ativo',
      descricao: produto.descricao,
      tags: [],
      variacoes: [],
    });
    setShowModalAvancado(true);
  };

  const handleExcluirProduto = (produto: ProdutoLegacy) => {
    showConfirmation({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o produto "${produto.nome}"?\n\nEsta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: async () => {
        try {
          await produtosService.delete(produto.id);
          await carregarProdutos();
          toast.success(`Produto "${produto.nome}" excluído com sucesso!`);
        } catch (error) {
          console.error('Erro ao excluir produto:', error);
          toast.error('Erro ao excluir produto');
        }
      },
    });
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

  const statCards = useMemo(
    () => [
      {
        key: 'total-produtos',
        label: 'Total de Produtos',
        value: estatisticas.totalProdutos,
        description: 'Itens cadastrados no catálogo',
        iconWrapper: 'bg-[#159A9C]',
        iconColor: 'text-white',
        Icon: Package,
      },
      {
        key: 'produtos-ativos',
        label: 'Produtos Ativos',
        value: estatisticas.produtosAtivos,
        description: 'Disponíveis para venda',
        iconWrapper: 'bg-[#0F7B7D]',
        iconColor: 'text-white',
        Icon: Check,
      },
      {
        key: 'faturamento',
        label: 'Faturamento Total',
        value: formatCurrency(estatisticas.valorTotal),
        description: 'Receita acumulada',
        iconWrapper: 'bg-[#002333]',
        iconColor: 'text-white',
        Icon: DollarSign,
      },
      {
        key: 'estoques-baixos',
        label: 'Estoques Baixos',
        value: estatisticas.estoquesBaixos,
        description: 'Itens exigindo reposição',
        iconWrapper: 'bg-white border border-[#B4BEC9]',
        iconColor: 'text-[#002333]',
        Icon: AlertTriangle,
      },
    ],
    [estatisticas],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <LoadingSkeleton lines={7} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Package className="h-6 w-6 text-[#159A9C]" />
              Catálogo de Itens
            </span>
          }
          description="Gestão completa de produtos, serviços, planos, licenças, módulos e aplicativos"
          actions={
            <>
              <button
                onClick={() => navigate('/produtos/categorias')}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
              >
                <Settings className="h-4 w-4" />
                Categorias
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || produtosFiltrados.length === 0}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E]"
                onClick={handleNovoProduto}
              >
                <Plus className="h-4 w-4" />
                Novo Item
              </button>
            </>
          }
        />

        <InlineStats
          stats={statCards.map((card, index) => ({
            label: card.label,
            value: String(card.value),
            tone: index === 3 ? 'warning' : index === 1 ? 'accent' : 'neutral',
          }))}
        />
      </SectionCard>

      <SectionCard className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2F8FB]">
            <Lightbulb className="h-4 w-4 text-[#0F7B7D]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#244455]">Guia rapido: quando usar item ou combo</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#607B89]">
              <li>Use item avulso quando o preco e a negociacao forem independentes.</li>
              <li>Use combo quando dois ou mais itens sempre saem juntos com condicao comercial unica.</li>
              <li>Prefira combo para padronizar proposta recorrente e reduzir erro de montagem.</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8FA6B2]" />
              <input
                type="text"
                placeholder="Buscar por nome, SKU ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2 xl:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="descontinuado">Descontinuado</option>
            </select>

            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
            >
              <option value="todos">Todos os Tipos</option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipoItemConfig[tipo as keyof typeof tipoItemConfig] || tipo}
                </option>
              ))}
            </select>

            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
            >
              <option value="todas">Todas as Categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </FiltersBar>

      <DataTableCard>
        <div className="border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#516F7D]">
            <h3 className="text-sm font-semibold text-[#1B3B4E]">
              Lista de Itens ({produtosFiltrados.length})
            </h3>
            {hasFilters && (
              <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                filtros ativos
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="border-b border-[#E1EAEE] bg-[#FFF7F7] px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#B4233A]">{error}</p>
              <button
                onClick={() => void carregarProdutos()}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#E7C4CB] bg-white px-3 text-xs font-medium text-[#B4233A] transition hover:bg-[#FFF2F4]"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {produtosFiltrados.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="Nenhum item encontrado"
              description={
                produtos.length === 0
                  ? 'Comece criando seu primeiro item.'
                  : 'Tente ajustar os filtros ou termos de busca.'
              }
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#EAF0F2] lg:hidden">
              {produtosPagina.map((produto) => {
                const statusInfo = statusConfig[produto.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={produto.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#19384C]">{produto.nome}</p>
                        <p className="mt-0.5 text-xs text-[#6B8693]">SKU: {produto.sku}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-[#486978]">
                      <div>
                        <p className="text-[#6B8693]">Tipo</p>
                        <p className="font-medium text-[#1E3A4B]">
                          {tipoItemConfig[produto.tipoItem] || produto.tipoItem}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#6B8693]">Categoria</p>
                        <p className="font-medium text-[#1E3A4B]">{produto.categoria}</p>
                      </div>
                      <div>
                        <p className="text-[#6B8693]">Preço</p>
                        <p className="font-medium text-[#1E3A4B]">{formatCurrency(produto.preco)}</p>
                      </div>
                      <div>
                        <p className="text-[#6B8693]">Estoque</p>
                        <p className="font-medium text-[#1E3A4B]">
                          {produto.tipoItem === 'produto' ? `${produto.estoque.atual} un.` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#6B8693]">Vendas (Mês)</p>
                        <p className="font-medium text-[#1E3A4B]">{produto.vendas.mes}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(produto)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#ECF7F3]"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditarProduto(produto)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#0F7B7D] hover:bg-[#ECF7F3]"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExcluirProduto(produto)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-full divide-y divide-[#DEEFE7]">
                <thead className="sticky top-0 z-10 bg-[#DEEFE7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#002333] uppercase tracking-wider">
                      Tipo
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
                  {produtosPagina.map((produto) => {
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
                            <div className="text-xs text-[#002333]/70">SKU: {produto.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-[#002333] font-medium">
                            {tipoItemConfig[produto.tipoItem] || produto.tipoItem}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-[#002333] font-medium">
                            {produto.categoria}
                          </span>
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
                          {produto.tipoItem !== 'produto' ? (
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                          >
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
            </div>
          </>
        )}

        {produtosFiltrados.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F7B89] sm:text-sm">
              <span>
                {produtosPagina.length} de {produtosFiltrados.length} registros
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 rounded-lg border border-[#D4E2E7] bg-white px-2 text-xs text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value={10}>Exibir: 10</option>
                <option value={25}>Exibir: 25</option>
                <option value={50}>Exibir: 50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Anterior
              </button>
              <span className="text-xs text-[#5F7B89] sm:text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </DataTableCard>

      {/* Modal de Visualização */}
      {isModalOpen && selectedProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div className="max-h-[90vh] w-full max-w-[980px] overflow-y-auto rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]">
            <div className="flex items-center justify-between border-b border-[#E1EAEE] px-6 py-4">
              <h3 className="text-lg font-semibold text-[#19384C]">Detalhes do Produto</h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-[#7A95A3] transition-colors hover:bg-[#F3F8FA] hover:text-[#19384C]"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
                <div>
                  <h4 className="text-sm font-semibold text-[#002333]">Nome</h4>
                  <p className="text-sm text-[#002333]/70">{selectedProduto.nome}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Tipo</h4>
                    <p className="text-sm text-[#002333]/70">
                      {tipoItemConfig[selectedProduto.tipoItem] || selectedProduto.tipoItem}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">SKU</h4>
                    <p className="text-sm text-[#002333]/70">{selectedProduto.sku}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Categoria</h4>
                    <p className="text-sm text-[#002333]/70">{selectedProduto.categoria}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Preço</h4>
                    <p className="text-sm text-[#002333]/70">
                      {formatCurrency(selectedProduto.preco)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Custo</h4>
                    <p className="text-sm text-[#002333]/70">
                      {formatCurrency(selectedProduto.custoUnitario)}
                    </p>
                  </div>
                </div>

                {selectedProduto.tipoItem === 'produto' && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Estoque</h4>
                    <p className="text-sm text-[#002333]/70">
                      Atual: {selectedProduto.estoque.atual} | Mínimo:{' '}
                      {selectedProduto.estoque.minimo} | Máximo: {selectedProduto.estoque.maximo}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-[#002333]">Descrição</h4>
                  <p className="text-sm text-[#002333]/70">
                    {selectedProduto.descricao || 'Sem descrição'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Criado em</h4>
                    <p className="text-sm text-[#002333]/70">
                      {formatDate(selectedProduto.criadoEm)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Atualizado em</h4>
                    <p className="text-sm text-[#002333]/70">
                      {formatDate(selectedProduto.atualizadoEm)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-[#E1EAEE] px-6 py-4">
                <button
                  onClick={closeModal}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                >
                  Fechar
                </button>
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
        onSubmit={(data) => {
          void handleSaveProduto(data as any);
        }}
        produtoEditando={produtoParaEditar}
        loading={isLoadingSave}
      />
      <ConfirmationModal confirmationState={confirmationState} />
    </div>
  );
};

export default ProdutosPage;
