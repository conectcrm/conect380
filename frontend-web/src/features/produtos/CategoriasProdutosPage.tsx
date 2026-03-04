import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Tag,
  Settings,
  Layers,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useNavigate } from 'react-router-dom';
import ModalCategoria from '../../components/modals/ModalCategoria';
import ModalSubcategoria from '../../components/modals/ModalSubcategoria';
import ModalConfiguracao from '../../components/modais/ModalConfiguracao';
import { categoriasProdutosService } from '../../services/categoriasProdutosService';
import { getCatalogoFeaturesConfig } from '../../config/catalogoFeaturesFlags';
import { normalizeOptionalMojibakeText } from '../../utils/textEncoding';
import toast from 'react-hot-toast';

// Interfaces
interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  ativa: boolean;
  subcategorias: Subcategoria[];
}

interface Subcategoria {
  id: string;
  nome: string;
  descricao: string;
  categoriaId: string;
  precoBase: number;
  unidade: string;
  camposPersonalizados?: {
    duracao?: boolean;
    usuarios?: boolean;
    modalidade?: boolean;
    recursos?: boolean;
  };
  ativa: boolean;
  configuracoes: Configuracao[];
}

interface Configuracao {
  id: string;
  nome: string;
  descricao: string;
  subcategoriaId: string;
  multiplicador: number;
  ativa: boolean;
}

const CATEGORY_COLOR_CLASS_MAP: Record<string, { border: string; dot: string }> = {
  blue: { border: 'border-blue-500', dot: 'bg-blue-500' },
  green: { border: 'border-green-500', dot: 'bg-green-500' },
  purple: { border: 'border-purple-500', dot: 'bg-purple-500' },
  orange: { border: 'border-orange-500', dot: 'bg-orange-500' },
  red: { border: 'border-red-500', dot: 'bg-red-500' },
  yellow: { border: 'border-yellow-500', dot: 'bg-yellow-500' },
};

const SUBCATEGORIA_CAMPO_LABELS: Record<string, string> = {
  duracao: 'Duração',
  usuarios: 'Usuários',
  modalidade: 'Modalidade',
  recursos: 'Recursos',
};

const catalogoFeatures = getCatalogoFeaturesConfig();

const actionButtonClass =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E]';
const iconButtonEditClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#0F7B7D] transition hover:bg-[#ECF7F3]';
const iconButtonDeleteClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] transition hover:bg-[#FFF2F4]';

const CategoriasProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  const categoriasAvancadasEnabled = catalogoFeatures.categoriasAvancadasEnabled;
  const { confirmationState, showConfirmation } = useConfirmation();

  // Estados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'categorias' | 'subcategorias' | 'configuracoes'>(
    'categorias',
  );
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<Subcategoria | null>(null);

  // Estados do modal
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [showModalSubcategoria, setShowModalSubcategoria] = useState(false);
  const [showModalConfiguracao, setShowModalConfiguracao] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Carregar categorias do service
  useEffect(() => {
    if (!categoriasAvancadasEnabled && activeTab !== 'categorias') {
      setActiveTab('categorias');
    }
    if (!categoriasAvancadasEnabled) {
      setShowModalSubcategoria(false);
      setShowModalConfiguracao(false);
    }
  }, [categoriasAvancadasEnabled, activeTab]);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const categoriasData = await categoriasProdutosService.listarCategorias();
      const categoriaSelecionadaId = selectedCategoria?.id;
      const subcategoriaSelecionadaId = selectedSubcategoria?.id;

      // Converter para formato da interface local
      const categoriasConvertidas: Categoria[] = categoriasData.map((cat) => ({
        id: cat.id,
        nome: normalizeOptionalMojibakeText(cat.nome) || '',
        descricao: normalizeOptionalMojibakeText(cat.descricao) || '',
        cor: cat.cor || 'blue',
        ativa: cat.ativo ?? true,
        subcategorias: cat.subcategorias
          ? cat.subcategorias.map((sub) => ({
              id: sub.id,
              nome: normalizeOptionalMojibakeText(sub.nome) || '',
              descricao: normalizeOptionalMojibakeText(sub.descricao) || '',
              categoriaId: sub.categoria_id || cat.id,
              precoBase: Number(sub.precoBase || 0),
              unidade: sub.unidade || 'unidade',
              camposPersonalizados: sub.camposPersonalizados || undefined,
              ativa: sub.ativo ?? true,
              configuracoes: sub.configuracoes
                ? sub.configuracoes.map((conf) => ({
                    id: conf.id,
                    nome: normalizeOptionalMojibakeText(conf.nome) || '',
                    descricao: normalizeOptionalMojibakeText(conf.descricao) || '',
                    subcategoriaId: sub.id,
                    multiplicador: Number(conf.multiplicador ?? 1),
                    ativa: conf.ativo ?? true,
                  }))
                : [],
            }))
          : [],
      }));

      setCategorias(categoriasConvertidas);

      if (categoriaSelecionadaId) {
        const categoriaAtualizada = categoriasConvertidas.find(
          (categoria) => categoria.id === categoriaSelecionadaId,
        );
        setSelectedCategoria(categoriaAtualizada || null);

        if (categoriaAtualizada && subcategoriaSelecionadaId) {
          const subcategoriaAtualizada = categoriaAtualizada.subcategorias.find(
            (subcategoria) => subcategoria.id === subcategoriaSelecionadaId,
          );
          setSelectedSubcategoria(subcategoriaAtualizada || null);
        } else if (!categoriaAtualizada) {
          setSelectedSubcategoria(null);
        }
      }

      // Se nao ha categorias, adicionar algumas padrao
      if (categoriasConvertidas.length === 0) {
        await criarCategoriasIniciais();
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const criarCategoriasIniciais = async () => {
    try {
      const categoriasIniciais = [
        { nome: 'Software', descricao: 'Produtos de software', icone: 'software', cor: 'blue' },
        { nome: 'Hardware', descricao: 'Equipamentos e hardware', icone: 'hardware', cor: 'green' },
        { nome: 'Consultoria', descricao: 'Serviços de consultoria', icone: 'consultoria', cor: 'purple' },
        { nome: 'Treinamento', descricao: 'Cursos e treinamentos', icone: 'treinamento', cor: 'orange' },
      ];

      for (const categoria of categoriasIniciais) {
        await categoriasProdutosService.criarCategoria(categoria);
      }

      toast.success('Categorias iniciais criadas!');
      await carregarCategorias();
    } catch (error) {
      console.error('Erro ao criar categorias iniciais:', error);
    }
  };

  // Formatacao de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCategoryColorClasses = (cor?: string) => {
    if (!cor) {
      return CATEGORY_COLOR_CLASS_MAP.blue;
    }

    return CATEGORY_COLOR_CLASS_MAP[cor] || CATEGORY_COLOR_CLASS_MAP.blue;
  };

  // Funcoes de manipulacao
  const handleNovaCategoria = () => {
    setEditingItem(null);
    setShowModalCategoria(true);
  };

  const handleEditarCategoria = (categoria: Categoria) => {
    setEditingItem(categoria);
    setShowModalCategoria(true);
  };

  const handleNovaSubcategoria = () => {
    if (!selectedCategoria) {
      toast.error('Selecione uma categoria primeiro');
      return;
    }
    setEditingItem(null);
    setShowModalSubcategoria(true);
  };

  const handleEditarSubcategoria = (subcategoria: Subcategoria) => {
    setEditingItem(subcategoria);
    setShowModalSubcategoria(true);
  };

  const handleNovaConfiguracao = () => {
    if (!selectedSubcategoria) {
      toast.error('Selecione uma subcategoria primeiro');
      return;
    }
    setEditingItem(null);
    setShowModalConfiguracao(true);
  };

  const handleEditarConfiguracao = (configuracao: Configuracao) => {
    setEditingItem(configuracao);
    setShowModalConfiguracao(true);
  };

  const handleExcluirCategoria = (categoria: Categoria) => {
    showConfirmation({
      title: 'Excluir categoria',
      message: `Tem certeza que deseja excluir a categoria "${categoria.nome}"? Todas as subcategorias e configurações vinculadas também serão removidas.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: () => {
        void (async () => {
          try {
            await categoriasProdutosService.excluirCategoria(categoria.id);

            if (selectedCategoria?.id === categoria.id) {
              setSelectedCategoria(null);
              setSelectedSubcategoria(null);
            }

            toast.success('Categoria excluída com sucesso');
            await carregarCategorias();
          } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            toast.error('Erro ao excluir categoria');
          }
        })();
      },
    });
  };

  const handleExcluirSubcategoria = (subcategoria: Subcategoria) => {
    showConfirmation({
      title: 'Excluir subcategoria',
      message: `Tem certeza que deseja excluir a subcategoria "${subcategoria.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: () => {
        void (async () => {
          try {
            await categoriasProdutosService.excluirSubcategoria(subcategoria.id);

            if (selectedSubcategoria?.id === subcategoria.id) {
              setSelectedSubcategoria(null);
            }

            toast.success('Subcategoria excluída com sucesso');
            await carregarCategorias();
          } catch (error) {
            console.error('Erro ao excluir subcategoria:', error);
            toast.error('Erro ao excluir subcategoria');
          }
        })();
      },
    });
  };

  const handleExcluirConfiguracao = (configuracao: Configuracao) => {
    showConfirmation({
      title: 'Excluir configuração',
      message: `Tem certeza que deseja excluir a configuração "${configuracao.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: () => {
        void (async () => {
          try {
            await categoriasProdutosService.excluirConfiguracao(configuracao.id);
            toast.success('Configuração excluída com sucesso');
            await carregarCategorias();
          } catch (error) {
            console.error('Erro ao excluir configuração:', error);
            toast.error('Erro ao excluir configuração');
          }
        })();
      },
    });
  };

  // Funcoes de salvar
  const handleSalvarCategoria = async (categoriaData: any) => {
    try {
      if (editingItem) {
        await categoriasProdutosService.atualizarCategoria({
          id: editingItem.id,
          nome: categoriaData.nome,
          descricao: categoriaData.descricao,
          icone: categoriaData.icone,
          cor: categoriaData.cor,
          ativo: categoriaData.ativa,
        });
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await categoriasProdutosService.criarCategoria({
          nome: categoriaData.nome,
          descricao: categoriaData.descricao,
          icone: categoriaData.icone || 'categoria',
          cor: categoriaData.cor || 'blue',
          ativo: categoriaData.ativa,
        });
        toast.success('Categoria criada com sucesso!');
      }

      await carregarCategorias();
      setShowModalCategoria(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleSalvarSubcategoria = async (subcategoriaData: any) => {
    try {
      const categoriaId = subcategoriaData.categoriaId || subcategoriaData.categoria_id;
      const payload = {
        categoria_id: categoriaId,
        nome: subcategoriaData.nome,
        descricao: subcategoriaData.descricao,
        precoBase: Number(subcategoriaData.precoBase || 0),
        unidade: subcategoriaData.unidade || 'unidade',
        camposPersonalizados: subcategoriaData.camposPersonalizados,
        ativo: subcategoriaData.ativa ?? subcategoriaData.ativo,
      };

      if (editingItem) {
        await categoriasProdutosService.atualizarSubcategoria({
          id: editingItem.id,
          ...payload,
        });
        toast.success('Subcategoria atualizada com sucesso!');
      } else {
        await categoriasProdutosService.criarSubcategoria(payload);
        toast.success('Subcategoria criada com sucesso!');
      }

      await carregarCategorias();
      setShowModalSubcategoria(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
      toast.error('Erro ao salvar subcategoria');
    }
  };

  const handleSalvarConfiguracao = async (configuracaoData: any) => {
    try {
      const subcategoriaId = configuracaoData.subcategoriaId || configuracaoData.subcategoria_id;
      const payload = {
        subcategoria_id: subcategoriaId,
        nome: configuracaoData.nome,
        descricao: configuracaoData.descricao,
        multiplicador: Number(configuracaoData.multiplicador || 1),
        ativo: configuracaoData.ativa ?? configuracaoData.ativo,
      };

      if (editingItem) {
        await categoriasProdutosService.atualizarConfiguracao({
          id: editingItem.id,
          ...payload,
        });
        toast.success('Configuração atualizada com sucesso!');
      } else {
        await categoriasProdutosService.criarConfiguracao(payload);
        toast.success('Configuração criada com sucesso!');
      }

      await carregarCategorias();
      setShowModalConfiguracao(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  // Renderizacao do conteudo por aba
    const categoriasFiltradas = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) {
      return categorias;
    }

    return categorias.filter(
      (categoria) =>
        categoria.nome.toLowerCase().includes(termo) ||
        categoria.descricao.toLowerCase().includes(termo),
    );
  }, [categorias, searchTerm]);

  const totalSubcategorias = useMemo(
    () => categorias.reduce((acc, categoria) => acc + categoria.subcategorias.length, 0),
    [categorias],
  );

  const totalConfiguracoes = useMemo(
    () =>
      categorias.reduce(
        (acc, categoria) =>
          acc +
          categoria.subcategorias.reduce(
            (subAcc, subcategoria) => subAcc + subcategoria.configuracoes.length,
            0,
          ),
        0,
      ),
    [categorias],
  );

  const statsCards = useMemo(() => {
    const cards: Array<{ key: string; label: string; value: number }> = [
      { key: 'categorias', label: 'Categorias', value: categorias.length },
    ];

    // Niveis avancados so aparecem quando estao efetivamente em uso.
    if (categoriasAvancadasEnabled && totalSubcategorias > 0) {
      cards.push({ key: 'subcategorias', label: 'Subcategorias', value: totalSubcategorias });
    }

    if (categoriasAvancadasEnabled && totalConfiguracoes > 0) {
      cards.push({ key: 'configuracoes', label: 'Configurações', value: totalConfiguracoes });
    }

    return cards;
  }, [categorias.length, categoriasAvancadasEnabled, totalSubcategorias, totalConfiguracoes]);

  const statsGridClass =
    statsCards.length === 1
      ? 'grid grid-cols-1 gap-3'
      : statsCards.length === 2
        ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
        : 'grid grid-cols-1 gap-3 md:grid-cols-3';

  const tabs = useMemo(
    () => [
      { id: 'categorias' as const, label: 'Categorias', icon: Package, count: categorias.length },
      ...(categoriasAvancadasEnabled
        ? [
            {
              id: 'subcategorias' as const,
              label: 'Subcategorias',
              icon: Tag,
              count: totalSubcategorias,
            },
            {
              id: 'configuracoes' as const,
              label: 'Configurações',
              icon: Settings,
              count: totalConfiguracoes,
            },
          ]
        : []),
    ],
    [categorias.length, categoriasAvancadasEnabled, totalConfiguracoes, totalSubcategorias],
  );

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  const primaryActionLabel =
    activeTab === 'categorias'
      ? 'Nova categoria'
      : activeTab === 'subcategorias'
        ? 'Nova subcategoria'
        : 'Nova configuração';

  const handlePrimaryAction =
    activeTab === 'categorias'
      ? handleNovaCategoria
      : activeTab === 'subcategorias'
        ? handleNovaSubcategoria
        : handleNovaConfiguracao;

  const getStatusBadgeClass = (ativo: boolean) =>
    ativo
      ? 'rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2.5 py-1 text-xs font-medium text-[#0F7B7D]'
      : 'rounded-full border border-[#E7C4CB] bg-[#FFF2F4] px-2.5 py-1 text-xs font-medium text-[#B4233A]';

  const renderCategorias = () => {
    if (categoriasFiltradas.length === 0) {
      return (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="Nenhuma categoria encontrada"
          description={
            categorias.length === 0
              ? 'Comece criando sua primeira categoria para organizar o catálogo.'
              : 'Ajuste os filtros para localizar a categoria desejada.'
          }
          action={
            <button type="button" onClick={handleNovaCategoria} className={actionButtonClass}>
              <Plus className="h-4 w-4" />
              Nova categoria
            </button>
          }
        />
      );
    }

    return (
      <div className="space-y-3">
        {categoriasFiltradas.map((categoria) => {
          const isSelected = selectedCategoria?.id === categoria.id;
          const categoryColors = getCategoryColorClasses(categoria.cor);

          return (
            <article
              key={categoria.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Selecionar categoria ${categoria.nome}`}
              onClick={() => {
                setSelectedCategoria(categoria);
                setSelectedSubcategoria(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedCategoria(categoria);
                  setSelectedSubcategoria(null);
                }
              }}
              className={`rounded-xl border px-4 py-4 transition sm:px-5 ${
                isSelected
                  ? 'border-[#159A9C] bg-[#F2FBF8] shadow-[0_12px_24px_-24px_rgba(21,154,156,0.8)] focus-visible:ring-2 focus-visible:ring-[#1A9E87]/35'
                  : 'border-[#E1EAEE] bg-white hover:border-[#CDE0E8] hover:bg-[#FAFCFD] focus-visible:ring-2 focus-visible:ring-[#1A9E87]/35'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${categoryColors.dot}`} />
                    <h3 className="truncate text-sm font-semibold text-[#1B3B4E]">{categoria.nome}</h3>
                  </div>
                  <p className="mt-1 text-sm text-[#607B89]">{categoria.descricao || 'Sem descrição'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#DCE8EC] bg-[#F7FBFC] px-2.5 py-1 text-xs font-medium text-[#486978]">
                      {categoria.subcategorias.length} subcategorias
                    </span>
                    <span className={getStatusBadgeClass(categoria.ativa)}>
                      {categoria.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditarCategoria(categoria);
                    }}
                    className={iconButtonEditClass}
                    title="Editar categoria"
                    aria-label={`Editar categoria ${categoria.nome}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleExcluirCategoria(categoria);
                    }}
                    className={iconButtonDeleteClass}
                    title="Excluir categoria"
                    aria-label={`Excluir categoria ${categoria.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderSubcategorias = () => {
    if (!selectedCategoria) {
      return (
        <EmptyState
          icon={<Tag className="h-5 w-5" />}
          title="Selecione uma categoria"
          description="Escolha uma categoria para listar e editar as subcategorias vinculadas."
          action={
            <button
              type="button"
              onClick={() => setActiveTab('categorias')}
              className={actionButtonClass}
            >
              Ver categorias
            </button>
          }
        />
      );
    }

    const termo = searchTerm.trim().toLowerCase();
    const subcategoriasFiltradas = selectedCategoria.subcategorias.filter(
      (subcategoria) =>
        !termo ||
        subcategoria.nome.toLowerCase().includes(termo) ||
        subcategoria.descricao.toLowerCase().includes(termo),
    );

    if (subcategoriasFiltradas.length === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] px-4 py-3">
            <p className="text-sm font-medium text-[#1E3A4B]">Categoria selecionada: {selectedCategoria.nome}</p>
            <p className="mt-1 text-xs text-[#607B89]">Nenhuma subcategoria encontrada para o filtro atual.</p>
          </div>

          <EmptyState
            icon={<Tag className="h-5 w-5" />}
            title="Nenhuma subcategoria encontrada"
            description="Crie a primeira subcategoria para detalhar os tipos de item desta categoria."
            action={
              <button type="button" onClick={handleNovaSubcategoria} className={actionButtonClass}>
                <Plus className="h-4 w-4" />
                Nova subcategoria
              </button>
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1E3A4B]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${getCategoryColorClasses(selectedCategoria.cor).dot}`}
            />
            Categoria selecionada: {selectedCategoria.nome}
          </div>
          <p className="mt-1 text-xs text-[#607B89]">
            {selectedCategoria.subcategorias.length} subcategorias cadastradas.
          </p>
        </div>

        {subcategoriasFiltradas.map((subcategoria) => {
          const isSelected = selectedSubcategoria?.id === subcategoria.id;
          const camposAtivos = Object.entries(subcategoria.camposPersonalizados || {})
            .filter(([, enabled]) => Boolean(enabled))
            .map(([campo]) => SUBCATEGORIA_CAMPO_LABELS[campo] || campo);

          return (
            <article
              key={subcategoria.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Selecionar subcategoria ${subcategoria.nome}`}
              onClick={() => setSelectedSubcategoria(subcategoria)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedSubcategoria(subcategoria);
                }
              }}
              className={`rounded-xl border px-4 py-4 transition sm:px-5 ${
                isSelected
                  ? 'border-[#159A9C] bg-[#F2FBF8] shadow-[0_12px_24px_-24px_rgba(21,154,156,0.8)] focus-visible:ring-2 focus-visible:ring-[#1A9E87]/35'
                  : 'border-[#E1EAEE] bg-white hover:border-[#CDE0E8] hover:bg-[#FAFCFD] focus-visible:ring-2 focus-visible:ring-[#1A9E87]/35'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-[#1B3B4E]">{subcategoria.nome}</h4>
                  <p className="mt-1 text-sm text-[#607B89]">{subcategoria.descricao || 'Sem descrição'}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#486978]">
                    <span className="rounded-full border border-[#DCE8EC] bg-[#F7FBFC] px-2.5 py-1 font-medium">
                      {subcategoria.configuracoes.length} configurações
                    </span>
                    <span className="rounded-full border border-[#DCE8EC] bg-[#F7FBFC] px-2.5 py-1 font-medium">
                      Base {formatCurrency(subcategoria.precoBase)} / {subcategoria.unidade}
                    </span>
                    <span className={getStatusBadgeClass(subcategoria.ativa)}>
                      {subcategoria.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  {camposAtivos.length > 0 && (
                    <p className="mt-2 text-xs text-[#607B89]">Campos dinâmicos: {camposAtivos.join(', ')}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditarSubcategoria(subcategoria);
                    }}
                    className={iconButtonEditClass}
                    title="Editar subcategoria"
                    aria-label={`Editar subcategoria ${subcategoria.nome}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleExcluirSubcategoria(subcategoria);
                    }}
                    className={iconButtonDeleteClass}
                    title="Excluir subcategoria"
                    aria-label={`Excluir subcategoria ${subcategoria.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderConfiguracoes = () => {
    if (!selectedSubcategoria) {
      return (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="Selecione uma subcategoria"
          description="Escolha uma subcategoria para visualizar as configurações e os multiplicadores."
          action={
            <button
              type="button"
              onClick={() => setActiveTab('subcategorias')}
              className={actionButtonClass}
            >
              Ver subcategorias
            </button>
          }
        />
      );
    }

    const termo = searchTerm.trim().toLowerCase();
    const configuracoesFiltradas = selectedSubcategoria.configuracoes.filter(
      (configuracao) =>
        !termo ||
        configuracao.nome.toLowerCase().includes(termo) ||
        configuracao.descricao.toLowerCase().includes(termo),
    );

    if (configuracoesFiltradas.length === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] px-4 py-3">
            <p className="text-sm font-medium text-[#1E3A4B]">
              Subcategoria selecionada: {selectedSubcategoria.nome}
            </p>
            <p className="mt-1 text-xs text-[#607B89]">Nenhuma configuração encontrada para o filtro atual.</p>
          </div>

          <EmptyState
            icon={<Settings className="h-5 w-5" />}
            title="Nenhuma configuração encontrada"
            description="Crie configurações para variações comerciais e cálculo de preço final."
            action={
              <button type="button" onClick={handleNovaConfiguracao} className={actionButtonClass}>
                <Plus className="h-4 w-4" />
                Nova configuração
              </button>
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] px-4 py-3">
          <p className="text-sm font-medium text-[#1E3A4B]">
            Subcategoria selecionada: {selectedSubcategoria.nome}
          </p>
          <p className="mt-1 text-xs text-[#607B89]">
            Preço base de referência: {formatCurrency(selectedSubcategoria.precoBase)}
          </p>
        </div>

        {configuracoesFiltradas.map((configuracao) => {
          const precoFinal = selectedSubcategoria.precoBase * configuracao.multiplicador;

          return (
            <article
              key={configuracao.id}
              className="rounded-xl border border-[#E1EAEE] bg-white px-4 py-4 transition hover:border-[#CDE0E8] hover:bg-[#FAFCFD] sm:px-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h5 className="truncate text-sm font-semibold text-[#1B3B4E]">{configuracao.nome}</h5>
                  <p className="mt-1 text-sm text-[#607B89]">{configuracao.descricao || 'Sem descrição'}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#486978]">
                    <span className="rounded-full border border-[#DCE8EC] bg-[#F7FBFC] px-2.5 py-1 font-medium">
                      Multiplicador {configuracao.multiplicador}x
                    </span>
                    <span className="rounded-full border border-[#DCE8EC] bg-[#F7FBFC] px-2.5 py-1 font-medium">
                      Preço final {formatCurrency(precoFinal)}
                    </span>
                    <span className={getStatusBadgeClass(configuracao.ativa)}>
                      {configuracao.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEditarConfiguracao(configuracao)}
                    className={iconButtonEditClass}
                    title="Editar configuração"
                    aria-label={`Editar configuração ${configuracao.nome}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcluirConfiguracao(configuracao)}
                    className={iconButtonDeleteClass}
                    title="Excluir configuração"
                    aria-label={`Excluir configuração ${configuracao.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  if (loading) {
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
              Gestão de categorias do catálogo
            </span>
          }
          description="Estruture categorias, níveis de subcategoria e configurações de composição conforme o perfil de cada operação."
          actions={
            <>
              <button
                type="button"
                onClick={() => navigate('/produtos')}
                aria-label="Voltar para o catálogo de itens"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9E87]/35"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="button"
                className={`${actionButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9E87]/35`}
                onClick={handlePrimaryAction}
              >
                <Plus className="h-4 w-4" />
                {primaryActionLabel}
              </button>
            </>
          }
        />

        <div className={statsGridClass}>
          {statsCards.map((card) => (
            <div key={card.key} className="rounded-xl border border-[#DCE8EC] bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B8693]">{card.label}</p>
              <p className="mt-1 text-xl font-semibold text-[#1E3A4B]">{card.value}</p>
            </div>
          ))}
        </div>

      </SectionCard>

      <FiltersBar className="p-4">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="relative">
            <label htmlFor="filtro-busca-categorias" className="sr-only">
              Buscar categorias, subcategorias e configurações
            </label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8FA6B2]" />
            <input
              id="filtro-busca-categorias"
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
            />
          </div>

          <div
            role="tablist"
            aria-label="Níveis do catálogo"
            className="inline-flex w-full flex-wrap items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#F7FBFC] p-1.5 sm:w-auto sm:justify-end sm:justify-self-end"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-[#0F7B7D] shadow-sm'
                      : 'text-[#5D7887] hover:bg-white hover:text-[#244455]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className="rounded-full border border-[#DCE8EC] bg-[#F7FBFC] px-2 py-0.5 text-xs text-[#607B89]">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </FiltersBar>

      <DataTableCard>
        <div className="border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#516F7D]">
            <h3 className="text-sm font-semibold text-[#1B3B4E]">
              {activeTabMeta?.label} ({activeTabMeta?.count ?? 0})
            </h3>

            {searchTerm.trim() && (
              <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                filtro ativo
              </span>
            )}

            {activeTab === 'subcategorias' && selectedCategoria && (
              <span className="rounded-full border border-[#DCE8EC] bg-white px-2 py-0.5 text-xs text-[#486978]">
                Categoria: {selectedCategoria.nome}
              </span>
            )}

            {activeTab === 'configuracoes' && selectedSubcategoria && (
              <span className="rounded-full border border-[#DCE8EC] bg-white px-2 py-0.5 text-xs text-[#486978]">
                Subcategoria: {selectedSubcategoria.nome}
              </span>
            )}
          </div>
        </div>

        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="p-4 sm:p-5"
        >
          {activeTab === 'categorias' && renderCategorias()}
          {categoriasAvancadasEnabled && activeTab === 'subcategorias' && renderSubcategorias()}
          {categoriasAvancadasEnabled && activeTab === 'configuracoes' && renderConfiguracoes()}
        </div>
      </DataTableCard>

      <ModalCategoria
        isOpen={showModalCategoria}
        onClose={() => {
          setShowModalCategoria(false);
          setEditingItem(null);
        }}
        onSave={handleSalvarCategoria}
        categoria={editingItem}
      />

      {categoriasAvancadasEnabled && (
        <ModalSubcategoria
          isOpen={showModalSubcategoria}
          onClose={() => {
            setShowModalSubcategoria(false);
            setEditingItem(null);
          }}
          onSave={handleSalvarSubcategoria}
          subcategoria={editingItem}
          categoriaAtual={selectedCategoria}
          categorias={categorias}
        />
      )}

      {categoriasAvancadasEnabled && (
        <ModalConfiguracao
          isOpen={showModalConfiguracao}
          onClose={() => {
            setShowModalConfiguracao(false);
            setEditingItem(null);
          }}
          onSave={handleSalvarConfiguracao}
          configuracao={editingItem}
          subcategoriaAtual={
            selectedSubcategoria
              ? {
                  ...selectedSubcategoria,
                  categoria: selectedCategoria
                    ? { nome: selectedCategoria.nome, cor: selectedCategoria.cor }
                    : undefined,
                }
              : null
          }
          subcategorias={categorias.flatMap((cat) =>
            cat.subcategorias.map((sub) => ({
              ...sub,
              categoria: { nome: cat.nome, cor: cat.cor },
            })),
          )}
        />
      )}

      <ConfirmationModal confirmationState={confirmationState} />
    </div>
  );
};
export default CategoriasProdutosPage;
