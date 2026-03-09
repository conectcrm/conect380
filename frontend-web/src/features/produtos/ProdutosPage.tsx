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
import { categoriasProdutosService } from '../../services/categoriasProdutosService';
import { CategoriaProduto } from '../../types/produtos';
import toast from 'react-hot-toast';

// Interface para o novo modal
interface ProdutoFormData {
  nome: string;
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'plano' | 'aplicativo';
  categoria: string;
  categoriaId?: string;
  subcategoriaId?: string;
  configuracaoId?: string;
  precoUnitario: number;
  custoUnitario?: number;
  frequencia: 'unico' | 'mensal' | 'anual';
  unidadeMedida: 'unidade' | 'saca' | 'hectare' | 'pacote' | 'licenca';
  status: 'ativo' | 'inativo' | 'descontinuado';
  descricao?: string;
  sku?: string;
  fornecedor?: string;
  estoqueAtual?: number;
  estoqueMinimo?: number;
  estoqueMaximo?: number;
  tags?: string[];
  variacoes?: string[];
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
}

// Interface para compatibilidade com o componente atual
interface ProdutoLegacy {
  id: string;
  nome: string;
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'plano' | 'aplicativo';
  categoria: string;
  categoriaId?: string;
  subcategoriaId?: string;
  configuracaoId?: string;
  subcategoriaNome?: string;
  configuracaoNome?: string;
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
  tags?: string[];
  variacoes?: string[];
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
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
  plano: 'Plano',
  aplicativo: 'Aplicativo',
};

const normalizeCatalogName = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [subcategoriaFilter, setSubcategoriaFilter] = useState<string>('todas');
  const [configuracaoFilter, setConfiguracaoFilter] = useState<string>('todas');
  const [sortOption, setSortOption] = useState<string>('nome-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState<CategoriaProduto[]>([]);
  const [selectedProduto, setSelectedProduto] = useState<ProdutoLegacy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para o modal de cadastro
  const [showModalAvancado, setShowModalAvancado] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<
    (ProdutoFormData & { produtoId?: string }) | null
  >(null);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const resolveSortParams = useCallback(() => {
    switch (sortOption) {
      case 'nome-desc':
        return { sortBy: 'nome' as const, sortOrder: 'DESC' as const };
      case 'preco-desc':
        return { sortBy: 'preco' as const, sortOrder: 'DESC' as const };
      case 'preco-asc':
        return { sortBy: 'preco' as const, sortOrder: 'ASC' as const };
      case 'recentes':
        return { sortBy: 'atualizadoEm' as const, sortOrder: 'DESC' as const };
      default:
        return { sortBy: 'nome' as const, sortOrder: 'ASC' as const };
    }
  }, [sortOption]);

  const carregarCategorias = useCallback(async () => {
    try {
      const categorias = await categoriasProdutosService.listarCategorias({
        ativo: true,
        ordenacao: 'nome',
        direcao: 'asc',
      });
      setCategoriasCatalogo(categorias);
    } catch (error) {
      console.error('Erro ao carregar categorias do catálogo:', error);
    }
  }, []);

  // Função para carregar produtos do backend
  const carregarProdutos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { sortBy, sortOrder } = resolveSortParams();
      const resposta = await produtosService.listPaginated({
        categoria: categoriaFilter !== 'todas' ? categoriaFilter : undefined,
        subcategoriaId: subcategoriaFilter !== 'todas' ? subcategoriaFilter : undefined,
        configuracaoId: configuracaoFilter !== 'todas' ? configuracaoFilter : undefined,
        status: statusFilter !== 'todos' ? statusFilter : undefined,
        tipoItem: tipoFilter !== 'todos' ? tipoFilter : undefined,
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
      });

      const produtosFormatados = resposta.data.map(produtosService.transformApiToLegacy);
      setProdutos(produtosFormatados);
      setTotalItems(resposta.meta.total);
      setTotalPages(resposta.meta.totalPages);

      // Carregar estatísticas
      const estatisticasAPI = await produtosService.getEstatisticas();
      setEstatisticas(estatisticasAPI);
    } catch (error) {
      console.error('Erro ao carregar itens do catálogo:', error);
      setError('Erro ao carregar itens do catálogo. Tente novamente.');
      toast.error('Erro ao carregar itens do catálogo. Verifique se o backend está funcionando.');
    } finally {
      setIsLoading(false);
    }
  }, [categoriaFilter, configuracaoFilter, currentPage, debouncedSearchTerm, itemsPerPage, resolveSortParams, statusFilter, subcategoriaFilter, tipoFilter]);

  useEffect(() => {
    void carregarCategorias();
  }, [carregarCategorias]);

  useEffect(() => {
    void carregarProdutos();
  }, [carregarProdutos]);

  const categorias = useMemo(() => {
    if (categoriasCatalogo.length > 0) {
      return Array.from(
        new Set(
          categoriasCatalogo
            .map((categoria) => categoria.nome?.trim())
            .filter((categoria): categoria is string => Boolean(categoria)),
        ),
      );
    }

    return Array.from(new Set(produtos.map((produto) => produto.categoria)));
  }, [categoriasCatalogo, produtos]);

  const categoriaSelecionada = useMemo(() => {
    if (categoriaFilter === 'todas') {
      return null;
    }

    const categoriaNormalizada = normalizeCatalogName(categoriaFilter);
    return (
      categoriasCatalogo.find(
        (categoria) => normalizeCatalogName(categoria.nome) === categoriaNormalizada,
      ) || null
    );
  }, [categoriaFilter, categoriasCatalogo]);

  const subcategoriasDisponiveis = useMemo(
    () => categoriaSelecionada?.subcategorias?.filter((subcategoria) => subcategoria.ativo !== false) || [],
    [categoriaSelecionada],
  );

  const categoriaTemSubcategorias = subcategoriasDisponiveis.length > 0;

  const subcategoriaSelecionada = useMemo(() => {
    if (subcategoriaFilter === 'todas') {
      return null;
    }

    return (
      subcategoriasDisponiveis.find((subcategoria) => subcategoria.id === subcategoriaFilter) || null
    );
  }, [subcategoriaFilter, subcategoriasDisponiveis]);

  const configuracoesDisponiveis = useMemo(
    () => subcategoriaSelecionada?.configuracoes?.filter((configuracao) => configuracao.ativo !== false) || [],
    [subcategoriaSelecionada],
  );

  const subcategoriaTemConfiguracoes = configuracoesDisponiveis.length > 0;

  const categoriaDoProdutoSelecionado = useMemo(() => {
    if (!selectedProduto) {
      return null;
    }

    if (selectedProduto.categoriaId) {
      return categoriasCatalogo.find((categoria) => categoria.id === selectedProduto.categoriaId) || null;
    }

    const categoriaNormalizada = normalizeCatalogName(selectedProduto.categoria);
    return (
      categoriasCatalogo.find(
        (categoria) => normalizeCatalogName(categoria.nome) === categoriaNormalizada,
      ) || null
    );
  }, [categoriasCatalogo, selectedProduto]);

  const resumoCategoriaSelecionada = useMemo(() => {
    if (!categoriaSelecionada) {
      return null;
    }

    const totalConfiguracoes = categoriaSelecionada.subcategorias.reduce(
      (total, subcategoria) => total + (subcategoria.configuracoes?.length || 0),
      0,
    );

    return {
      totalSubcategorias: categoriaSelecionada.subcategorias.length,
      totalConfiguracoes,
    };
  }, [categoriaSelecionada]);

  const tipos = useMemo(
    () => Object.keys(tipoItemConfig) as Array<keyof typeof tipoItemConfig>,
    [],
  );

  useEffect(() => {
    if (categoriaFilter === 'todas') {
      if (subcategoriaFilter !== 'todas') {
        setSubcategoriaFilter('todas');
      }
      if (configuracaoFilter !== 'todas') {
        setConfiguracaoFilter('todas');
      }
      return;
    }

    if (
      subcategoriaFilter !== 'todas' &&
      !subcategoriasDisponiveis.some((subcategoria) => subcategoria.id === subcategoriaFilter)
    ) {
      setSubcategoriaFilter('todas');
      setConfiguracaoFilter('todas');
    }
  }, [categoriaFilter, configuracaoFilter, subcategoriaFilter, subcategoriasDisponiveis]);

  useEffect(() => {
    if (subcategoriaFilter === 'todas') {
      if (configuracaoFilter !== 'todas') {
        setConfiguracaoFilter('todas');
      }
      return;
    }

    if (
      configuracaoFilter !== 'todas' &&
      !configuracoesDisponiveis.some((configuracao) => configuracao.id === configuracaoFilter)
    ) {
      setConfiguracaoFilter('todas');
    }
  }, [configuracaoFilter, configuracoesDisponiveis, subcategoriaFilter]);

  const hasFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== 'todos' ||
    tipoFilter !== 'todos' ||
    categoriaFilter !== 'todas' ||
    subcategoriaFilter !== 'todas' ||
    configuracaoFilter !== 'todas';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, tipoFilter, categoriaFilter, subcategoriaFilter, configuracaoFilter, itemsPerPage, sortOption]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setTipoFilter('todos');
    setCategoriaFilter('todas');
    setSubcategoriaFilter('todas');
    setConfiguracaoFilter('todas');
    setCurrentPage(1);
  };

  const handleExport = useCallback(async () => {
    if (totalItems === 0) {
      toast.error('Nenhum item disponível para exportação.');
      return;
    }

    try {
      setIsExporting(true);

      const { sortBy, sortOrder } = resolveSortParams();
      const csvBlob = await produtosService.exportCsv({
        categoria: categoriaFilter !== 'todas' ? categoriaFilter : undefined,
        subcategoriaId: subcategoriaFilter !== 'todas' ? subcategoriaFilter : undefined,
        configuracaoId: configuracaoFilter !== 'todas' ? configuracaoFilter : undefined,
        status: statusFilter !== 'todos' ? statusFilter : undefined,
        tipoItem: tipoFilter !== 'todos' ? tipoFilter : undefined,
        search: debouncedSearchTerm || undefined,
        sortBy,
        sortOrder,
      });

      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `produtos_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Exportação concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar itens do catálogo:', error);
      toast.error('Não foi possível exportar os itens do catálogo.');
    } finally {
      setIsExporting(false);
    }
  }, [categoriaFilter, configuracaoFilter, debouncedSearchTerm, resolveSortParams, statusFilter, subcategoriaFilter, tipoFilter, totalItems]);

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
      categoriaId: produto.categoriaId,
      subcategoriaId: produto.subcategoriaId,
      configuracaoId: produto.configuracaoId,
      precoUnitario: produto.preco,
      custoUnitario: produto.custoUnitario,
      frequencia: produto.frequencia,
      unidadeMedida: produto.unidadeMedida,
      status: produto.status,
      descricao: produto.descricao,
      sku: produto.sku,
      fornecedor: produto.fornecedor,
      estoqueAtual: produto.estoque.atual,
      estoqueMinimo: produto.estoque.minimo,
      estoqueMaximo: produto.estoque.maximo,
      tags: produto.tags || [],
      variacoes: produto.variacoes || [],
      tipoLicenciamento: produto.tipoLicenciamento,
      periodicidadeLicenca: produto.periodicidadeLicenca,
      renovacaoAutomatica: produto.renovacaoAutomatica,
      quantidadeLicencas: produto.quantidadeLicencas,
    });
    setShowModalAvancado(true);
  };

  const handleExcluirProduto = (produto: ProdutoLegacy) => {
    showConfirmation({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o item "${produto.nome}"?\n\nEsta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: async () => {
        try {
          await produtosService.delete(produto.id);
          await carregarProdutos();
          toast.success(`Item "${produto.nome}" excluído com sucesso!`);
        } catch (error) {
          console.error('Erro ao excluir item:', error);
          toast.error('Erro ao excluir item');
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
        toast.success('Item atualizado com sucesso!');
      } else {
        // Criar novo produto
        await produtosService.create(produtoData);
        toast.success('Item criado com sucesso!');
      }

      // Recarregar lista
      await carregarProdutos();

      setShowModalAvancado(false);
      setProdutoParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast.error('Erro ao salvar item');
      throw error; // Modal tratará o erro
    } finally {
      setIsLoadingSave(false);
    }
  };

  const statCards = useMemo(
    () => [
      {
        key: 'total-produtos',
        label: 'Total de Itens',
        value: estatisticas.totalProdutos,
        description: 'Itens cadastrados no catálogo',
        iconWrapper: 'bg-[#159A9C]',
        iconColor: 'text-white',
        Icon: Package,
      },
      {
        key: 'produtos-ativos',
        label: 'Itens Ativos',
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
                Estrutura do catálogo
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || totalItems === 0}
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
            <h2 className="text-sm font-semibold text-[#244455]">Guia rápido do catálogo</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#607B89]">
              <li>Use categorias para organizar o catálogo por contexto comercial e operacional.</li>
              <li>Use subcategorias e configurações apenas nas categorias que exigem esse detalhamento.</li>
              <li>Mantenha SKU, fornecedor e estoque atualizados para facilitar proposta, venda e reposição.</li>
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

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-2 xl:col-span-2">
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

            {categoriaSelecionada && categoriaTemSubcategorias ? (
              <select
                value={subcategoriaFilter}
                onChange={(e) => setSubcategoriaFilter(e.target.value)}
                className="h-10 rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value="todas">Todas as Subcategorias</option>
                {subcategoriasDisponiveis.map((subcategoria) => (
                  <option key={subcategoria.id} value={subcategoria.id}>
                    {subcategoria.nome}
                  </option>
                ))}
              </select>
            ) : null}

            {subcategoriaSelecionada && subcategoriaTemConfiguracoes ? (
              <select
                value={configuracaoFilter}
                onChange={(e) => setConfiguracaoFilter(e.target.value)}
                className="h-10 rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value="todas">Todas as Configurações</option>
                {configuracoesDisponiveis.map((configuracao) => (
                  <option key={configuracao.id} value={configuracao.id}>
                    {configuracao.nome}
                  </option>
                ))}
              </select>
            ) : null}

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-10 rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
            >
              <option value="nome-asc">Ordenar: Nome A-Z</option>
              <option value="nome-desc">Ordenar: Nome Z-A</option>
              <option value="preco-desc">Ordenar: Maior preço</option>
              <option value="preco-asc">Ordenar: Menor preço</option>
              <option value="recentes">Ordenar: Mais recentes</option>
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

        {categoriaSelecionada && !categoriaTemSubcategorias ? (
          <p className="mt-3 text-xs text-[#607B89]">
            A categoria selecionada usa apenas classificação principal. Não há subcategorias ou configurações para refinar nesta etapa.
          </p>
        ) : null}

        {subcategoriaSelecionada && !subcategoriaTemConfiguracoes ? (
          <p className="mt-2 text-xs text-[#607B89]">
            A subcategoria selecionada não possui configurações adicionais. O filtro atual já está no nível mais detalhado.
          </p>
        ) : null}
      </FiltersBar>

      {categoriaSelecionada && resumoCategoriaSelecionada && (
        <SectionCard className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE7E8] bg-[#EFF8F8] px-3 py-1 text-xs font-medium text-[#0F7B7D]">
                <Settings className="h-3.5 w-3.5" />
                Estrutura oficial da categoria
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#19384C]">{categoriaSelecionada.nome}</h3>
                <p className="mt-1 text-sm text-[#607B89]">
                  {categoriaSelecionada.descricao || 'Categoria sem descrição cadastrada.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[#D4E2E7] bg-white px-3 py-1 font-medium text-[#244455]">
                {resumoCategoriaSelecionada.totalSubcategorias} subcategorias
              </span>
              <span className="rounded-full border border-[#D4E2E7] bg-white px-3 py-1 font-medium text-[#244455]">
                {resumoCategoriaSelecionada.totalConfiguracoes} configurações
              </span>
            </div>
          </div>

          {resumoCategoriaSelecionada.totalSubcategorias === 0 ? (
            <div className="rounded-2xl border border-[#DEEFE7] bg-[#FCFEFE] p-4 text-sm text-[#607B89]">
              Essa categoria não possui subcategorias cadastradas. Para esse tipo de item, a categoria principal já é suficiente.
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {categoriaSelecionada.subcategorias.map((subcategoria) => (
              <div
                key={subcategoria.id}
                className="rounded-2xl border border-[#DEEFE7] bg-[#FCFEFE] p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#19384C]">{subcategoria.nome}</h4>
                    <p className="mt-1 text-xs text-[#607B89]">
                      {subcategoria.descricao || 'Subcategoria sem descrição cadastrada.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-[#DEEFE7] px-2.5 py-1 font-medium text-[#0F7B7D]">
                      {subcategoria.configuracoes?.length || 0} configurações
                    </span>
                    <span className="rounded-full bg-[#F3F8FA] px-2.5 py-1 font-medium text-[#516F7D]">
                      Unidade: {subcategoria.unidade}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {subcategoria.configuracoes && subcategoria.configuracoes.length > 0 ? (
                    subcategoria.configuracoes.map((configuracao) => (
                      <span
                        key={configuracao.id}
                        className="rounded-full border border-[#D4E2E7] bg-white px-2.5 py-1 text-[11px] font-medium text-[#244455]"
                      >
                        {configuracao.nome}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#7A95A3]">
                      Nenhuma configuração cadastrada para esta subcategoria.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </SectionCard>
      )}

      <DataTableCard>
        <div className="border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#516F7D]">
            <h3 className="text-sm font-semibold text-[#1B3B4E]">
              Lista de Itens ({totalItems})
            </h3>
            {hasFilters && (
              <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                filtros ativos
              </span>
            )}
          </div>
          {hasFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categoriaFilter !== 'todas' && (
                <span className="rounded-full border border-[#D4E2E7] bg-white px-3 py-1 text-xs font-medium text-[#244455]">
                  Categoria: {categoriaFilter}
                </span>
              )}
              {subcategoriaSelecionada && (
                <span className="rounded-full border border-[#CFE7E8] bg-[#EFF8F8] px-3 py-1 text-xs font-medium text-[#0F7B7D]">
                  Subcategoria: {subcategoriaSelecionada.nome}
                </span>
              )}
              {configuracaoFilter !== 'todas' && (
                <span className="rounded-full border border-[#DCE6F8] bg-[#F4F8FF] px-3 py-1 text-xs font-medium text-[#35538A]">
                  Configuração:{' '}
                  {configuracoesDisponiveis.find((configuracao) => configuracao.id === configuracaoFilter)?.nome ||
                    'Selecionada'}
                </span>
              )}
            </div>
          )}
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

        {produtos.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="Nenhum item encontrado"
              description={
                totalItems === 0 && !hasFilters
                  ? 'Comece criando seu primeiro item.'
                  : 'Tente ajustar os filtros ou termos de busca.'
              }
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#EAF0F2] lg:hidden">
              {produtos.map((produto) => {
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
                        {produto.subcategoriaNome && (
                          <p className="mt-0.5 text-[11px] text-[#6B8693]">{produto.subcategoriaNome}</p>
                        )}
                        {produto.configuracaoNome && (
                          <p className="mt-1 inline-flex rounded-full border border-[#DCE6F8] bg-[#F4F8FF] px-2 py-0.5 text-[11px] font-medium text-[#35538A]">
                            {produto.configuracaoNome}
                          </p>
                        )}
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
                  {produtos.map((produto) => {
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
                          <div>
                            <span className="text-sm text-[#002333] font-medium">{produto.categoria}</span>
                            {produto.subcategoriaNome && (
                              <div className="mt-1 text-xs text-[#002333]/70">{produto.subcategoriaNome}</div>
                            )}
                            {produto.configuracaoNome && (
                              <div className="mt-1 inline-flex rounded-full border border-[#DCE6F8] bg-[#F4F8FF] px-2 py-0.5 text-[11px] font-medium text-[#35538A]">
                                {produto.configuracaoNome}
                              </div>
                            )}
                          </div>
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

        {totalItems > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F7B89] sm:text-sm">
              <span>
                {produtos.length} de {totalItems} registros
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
              <h3 className="text-lg font-semibold text-[#19384C]">Detalhes do item</h3>
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
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Subcategoria</h4>
                    <p className="text-sm text-[#002333]/70">
                      {selectedProduto.subcategoriaNome || 'Não informada'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Configuração</h4>
                    <p className="text-sm text-[#002333]/70">
                      {selectedProduto.configuracaoNome || 'Não informada'}
                    </p>
                  </div>
                </div>

                {categoriaDoProdutoSelecionado && (
                  <div className="rounded-2xl border border-[#DEEFE7] bg-[#FCFEFE] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#002333]">
                          Estrutura relacionada da categoria
                        </h4>
                        <p className="mt-1 text-sm text-[#002333]/70">
                          {categoriaDoProdutoSelecionado.descricao || 'Categoria sem descrição cadastrada.'}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#D4E2E7] bg-white px-3 py-1 text-xs font-medium text-[#244455]">
                        {categoriaDoProdutoSelecionado.subcategorias.length} subcategorias oficiais
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {categoriaDoProdutoSelecionado.subcategorias.map((subcategoria) => (
                        <span
                          key={subcategoria.id}
                          className="rounded-full border border-[#CFE7E8] bg-[#EFF8F8] px-3 py-1 text-xs text-[#0F7B7D]"
                        >
                          {subcategoria.nome}
                          {subcategoria.configuracoes?.length
                            ? ` • ${subcategoria.configuracoes.length} config.`
                            : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                    <h4 className="text-sm font-semibold text-[#002333]">Fornecedor</h4>
                    <p className="text-sm text-[#002333]/70">
                      {selectedProduto.fornecedor || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Status</h4>
                    <p className="text-sm text-[#002333]/70">
                      {statusConfig[selectedProduto.status]?.label || selectedProduto.status}
                    </p>
                  </div>
                </div>

                {selectedProduto.tags && selectedProduto.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#002333]">Tags</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedProduto.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-[#CFE7E8] bg-[#EFF8F8] px-3 py-1 text-xs text-[#0F7B7D]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedProduto.tipoLicenciamento ||
                  selectedProduto.periodicidadeLicenca ||
                  selectedProduto.quantidadeLicencas) && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[#002333]">Licenciamento</h4>
                      <p className="text-sm text-[#002333]/70">
                        {selectedProduto.tipoLicenciamento || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#002333]">Periodicidade</h4>
                      <p className="text-sm text-[#002333]/70">
                        {selectedProduto.periodicidadeLicenca || 'Não informada'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#002333]">Licenças</h4>
                      <p className="text-sm text-[#002333]/70">
                        {selectedProduto.quantidadeLicencas ?? 'Não informada'}
                      </p>
                    </div>
                  </div>
                )}

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
