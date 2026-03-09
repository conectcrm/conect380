/**
 * Modal de Cadastro de Item - Layout Paisagem
 * Otimizado para caber todos os campos na mesma tela
 * Versão com modal customizado para alterações não salvas
 */

import React, { useState, useEffect, useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useI18n } from '../../contexts/I18nContext';
import { X, Tag, Package, DollarSign, AlertTriangle, Keyboard } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';
import { useProdutosParaPropostas } from '../../shared/produtosAdapter';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useModalKeyboardShortcuts } from '../../hooks/useModalKeyboardShortcuts';
import { SaveStatus } from '../SaveStatus';
import { useProdutoSoftware } from '../../hooks/useProdutoSoftware';
import {
  camposSoftware,
  precisaCamposSoftware,
  validarDadosSoftware,
} from '../../config/camposSoftware';
import { categoriasProdutosService } from '../../services/categoriasProdutosService';
import { CategoriaProduto } from '../../types/produtos';

const normalizeCatalogName = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

// Tipos de dados
interface ProdutoFormData {
  nome: string;
  tipo?: 'produto' | 'servico' | 'software'; // Novo campo para detectar software
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
  // Campos específicos para software
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
}

interface ModalCadastroProdutoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProdutoFormData) => void;
  produtoEditando?: ProdutoFormData | null;
  loading?: boolean;
}

// Schema de validação
const schema = yup.object().shape({
  nome: yup
    .string()
    .required('Nome do item é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipoItem: yup
    .string()
    .required('Tipo do item é obrigatório')
    .oneOf(['produto', 'servico', 'licenca', 'modulo', 'plano', 'aplicativo'], 'Tipo inválido'),
  categoria: yup.string().required('Categoria é obrigatória'),
  categoriaId: yup.string().optional(),
  subcategoriaId: yup.string().optional(),
  configuracaoId: yup.string().optional(),
  precoUnitario: yup
    .number()
    .required('Preço unitário é obrigatório')
    .min(0, 'Preço deve ser maior que zero'),
  custoUnitario: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .optional()
    .min(0, 'Custo deve ser maior ou igual a zero'),
  frequencia: yup
    .string()
    .required('Frequência é obrigatória')
    .oneOf(['unico', 'mensal', 'anual'], 'Frequência inválida'),
  unidadeMedida: yup
    .string()
    .required('Unidade de medida é obrigatória')
    .oneOf(['unidade', 'saca', 'hectare', 'pacote', 'licenca'], 'Unidade inválida'),
  status: yup
    .string()
    .required('Status é obrigatório')
    .oneOf(['ativo', 'inativo', 'descontinuado'], 'Status inválido'),
  descricao: yup.string().optional(),
  sku: yup.string().optional(),
  fornecedor: yup.string().optional(),
  estoqueAtual: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .optional()
    .min(0, 'Estoque atual deve ser maior ou igual a zero'),
  estoqueMinimo: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .optional()
    .min(0, 'Estoque mínimo deve ser maior ou igual a zero'),
  estoqueMaximo: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .optional()
    .min(0, 'Estoque máximo deve ser maior ou igual a zero'),
  tags: yup.array().of(yup.string()).default([]),
  variacoes: yup.array().of(yup.string()).default([]),
  // Validação condicional para campos de software
  tipoLicenciamento: yup.string().when('tipoItem', {
    is: (tipoItem: string) => ['licenca', 'modulo', 'aplicativo'].includes(tipoItem),
    then: (schema) =>
      schema.required('Tipo de licenciamento é obrigatório para itens de software'),
    otherwise: (schema) => schema.optional(),
  }),
  periodicidadeLicenca: yup.string().when('tipoItem', {
    is: (tipoItem: string) => ['licenca', 'modulo', 'aplicativo'].includes(tipoItem),
    then: (schema) =>
      schema.required('Periodicidade da licença é obrigatória para itens de software'),
    otherwise: (schema) => schema.optional(),
  }),
  renovacaoAutomatica: yup.boolean().optional(),
  quantidadeLicencas: yup.number().when('tipoItem', {
    is: (tipoItem: string) => ['licenca', 'modulo', 'aplicativo'].includes(tipoItem),
    then: (schema) => schema.min(1, 'Quantidade de licenças deve ser maior que zero'),
    otherwise: (schema) => schema.optional(),
  }),
});

// Opções
const tiposItem = [
  { value: 'produto', label: 'Produto' },
  { value: 'servico', label: 'Serviço' },
  { value: 'licenca', label: 'Licença' },
  { value: 'modulo', label: 'Módulo' },
  { value: 'plano', label: 'Plano' },
  { value: 'aplicativo', label: 'Aplicativo' },
];

const frequencias = [
  { value: 'unico', label: 'Único' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
];

const unidadesMedida = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'saca', label: 'Saca' },
  { value: 'hectare', label: 'Hectare' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'licenca', label: 'Licença' },
];

export const ModalCadastroProduto: React.FC<ModalCadastroProdutoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  produtoEditando,
  loading = false,
}) => {
  // Hook de internacionalização
  const { t } = useI18n();

  const [tagInput, setTagInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Estado para categorias carregadas do backend
  const [categoriasCatalogo, setCategoriasCatalogo] = useState<CategoriaProduto[]>([]);
  const [categoriasFallback, setCategoriasFallback] = useState<string[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Carregar categorias do backend quando o modal abrir
  useEffect(() => {
    const carregarCategorias = async () => {
      if (!isOpen) return;

      try {
        setLoadingCategorias(true);
        const categoriasData = await categoriasProdutosService.listarCategorias();
        const categoriasNomes = categoriasData.map((cat) => cat.nome);

        // Se há categorias cadastradas, usa elas
        if (categoriasNomes.length > 0) {
          setCategoriasCatalogo(categoriasData);
          setCategoriasFallback([]);
        } else {
          // Senão, usa categorias padrão como fallback
          setCategoriasCatalogo([]);
          setCategoriasFallback([
            'Software',
            'Hardware',
            'Consultoria',
            'Marketing',
            'Vendas',
            'Suporte',
            'Treinamento',
            'Licenciamento',
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Em caso de erro, usa categorias padrão
        setCategoriasCatalogo([]);
        setCategoriasFallback([
          'Software',
          'Hardware',
          'Consultoria',
          'Marketing',
          'Vendas',
          'Suporte',
          'Treinamento',
          'Licenciamento',
        ]);
      } finally {
        setLoadingCategorias(false);
      }
    };

    carregarCategorias();
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<ProdutoFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      tipoItem: 'produto',
      categoria: '',
      categoriaId: undefined,
      subcategoriaId: undefined,
      configuracaoId: undefined,
      precoUnitario: 0,
      custoUnitario: undefined,
      frequencia: 'unico',
      unidadeMedida: 'unidade',
      status: 'ativo',
      descricao: '',
      sku: '',
      fornecedor: '',
      estoqueAtual: undefined,
      estoqueMinimo: undefined,
      estoqueMaximo: undefined,
      tags: [],
      variacoes: [],
      // Valores padrão para campos de software
      tipoLicenciamento: '',
      periodicidadeLicenca: '',
      renovacaoAutomatica: false,
      quantidadeLicencas: 1,
    },
  });

  // Hook para produtos de software (após declaração do watch)
  const tipoAtual = watch('tipoItem') || 'produto';
  const tipoGeral = watch('tipo'); // Para capturar se tipo === "software"
  const { campos, isSoftware, TIPOS_LICENCIAMENTO, PERIODICIDADES_LICENCA } = useProdutoSoftware(
    tipoAtual,
    tipoGeral,
  );

  const watchedFields = watch();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const isItemRecorrente = ['plano', 'licenca', 'modulo', 'aplicativo'].includes(tipoAtual);
  const categoriaSelecionada = useMemo(() => {
    const categoriaPorId = categoriasCatalogo.find((categoria) => categoria.id === watchedFields.categoriaId);
    if (categoriaPorId) {
      return categoriaPorId;
    }

    const categoriaNormalizada = normalizeCatalogName(watchedFields.categoria);
    return (
      categoriasCatalogo.find(
        (categoria) => normalizeCatalogName(categoria.nome) === categoriaNormalizada,
      ) || null
    );
  }, [categoriasCatalogo, watchedFields.categoria, watchedFields.categoriaId]);

  const subcategoriasDisponiveis = useMemo(
    () => categoriaSelecionada?.subcategorias?.filter((subcategoria) => subcategoria.ativo !== false) || [],
    [categoriaSelecionada],
  );

  const categoriaTemSubcategorias = subcategoriasDisponiveis.length > 0;

  const subcategoriaSelecionada = useMemo(
    () =>
      subcategoriasDisponiveis.find(
        (subcategoria) => subcategoria.id === watchedFields.subcategoriaId,
      ) || null,
    [subcategoriasDisponiveis, watchedFields.subcategoriaId],
  );

  const configuracoesDisponiveis = useMemo(
    () => subcategoriaSelecionada?.configuracoes?.filter((configuracao) => configuracao.ativo !== false) || [],
    [subcategoriaSelecionada],
  );

  const subcategoriaTemConfiguracoes = configuracoesDisponiveis.length > 0;

  const categorias = useMemo(() => {
    const nomes = new Set<string>([
      ...categoriasCatalogo.map((categoria) => categoria.nome),
      ...categoriasFallback,
      ...(watchedFields.categoria ? [watchedFields.categoria] : []),
    ]);

    return Array.from(nomes).sort((left, right) => left.localeCompare(right, 'pt-BR'));
  }, [categoriasCatalogo, categoriasFallback, watchedFields.categoria]);

  const labelClass = 'mb-1 block text-sm font-medium text-[#244455]';
  const inputClass =
    'w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-[#159A9C] focus:outline-none focus:ring-2 focus:ring-[#159A9C]/25';
  const inputErrorClass =
    'w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200';
  const sectionTitleClass = 'flex items-center text-lg font-semibold text-[#19384C]';
  const primaryButtonClass =
    'inline-flex items-center rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60';
  const secondaryButtonClass =
    'inline-flex items-center rounded-lg border border-[#D4E2E7] bg-white px-4 py-2 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60';
  const helperLinkButtonClass =
    'mt-3 inline-flex items-center rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]';

  const handleOpenCatalogStructure = (targetTab: 'categorias' | 'subcategorias' | 'configuracoes') => {
    const params = new URLSearchParams();
    params.set('tab', targetTab);

    if (categoriaSelecionada?.id) {
      params.set('categoriaId', categoriaSelecionada.id);
    }

    if (subcategoriaSelecionada?.id) {
      params.set('subcategoriaId', subcategoriaSelecionada.id);
    }

    window.open(`/produtos/categorias?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  // Primeiro vou declarar as funções que serão usadas nos hooks
  const onFormSubmit = async (data: ProdutoFormData) => {
    try {
      if (loading) return;

      await onSubmit(data);
      setHasUnsavedChanges(false);
      setIsFormInitialized(false);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && isFormInitialized) {
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };

  // Hook de Auto-Save
  const { lastSaveAttempt } = useAutoSave({
    delay: 30000, // 30 segundos
    enabled: isOpen && !loading,
    onSave: async () => {
      if (isValid && hasUnsavedChanges) {
        const data = watchedFields as ProdutoFormData;
        await onSubmit(data);
        setHasUnsavedChanges(false);
      }
    },
    hasUnsavedChanges,
    isFormValid: isValid,
  });

  // Hook de Atalhos de Teclado
  useModalKeyboardShortcuts({
    isOpen,
    onSave: () => {
      if (isValid && !isSubmitting) {
        handleSubmit(onFormSubmit)();
      }
    },
    onClose: handleClose,
    canSave: isValid && !isSubmitting,
  });

  // Efeito para detectar mudanças - só após inicialização
  useEffect(() => {
    if (isFormInitialized && isOpen) {
      const subscription = watch((value, { name, type }) => {
        if (type === 'change') {
          setHasUnsavedChanges(true);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isFormInitialized, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const categoriaNormalizada = normalizeCatalogName(watchedFields.categoria);
    const categoriaRelacionada =
      categoriasCatalogo.find(
        (categoria) => normalizeCatalogName(categoria.nome) === categoriaNormalizada,
      ) || null;

    const nextCategoriaId = categoriaRelacionada?.id;
    if ((watchedFields.categoriaId || undefined) !== nextCategoriaId) {
      setValue('categoriaId', nextCategoriaId, {
        shouldValidate: true,
        shouldDirty: false,
      });
    }

    if (
      watchedFields.subcategoriaId &&
      !categoriaRelacionada?.subcategorias?.some(
        (subcategoria) => subcategoria.id === watchedFields.subcategoriaId,
      )
    ) {
      setValue('subcategoriaId', undefined, { shouldValidate: true, shouldDirty: false });
      setValue('configuracaoId', undefined, { shouldValidate: true, shouldDirty: false });
    }
  }, [
    categoriasCatalogo,
    isOpen,
    setValue,
    watchedFields.categoria,
    watchedFields.categoriaId,
    watchedFields.subcategoriaId,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (
      watchedFields.configuracaoId &&
      !configuracoesDisponiveis.some(
        (configuracao) => configuracao.id === watchedFields.configuracaoId,
      )
    ) {
      setValue('configuracaoId', undefined, { shouldValidate: true, shouldDirty: false });
    }
  }, [configuracoesDisponiveis, isOpen, setValue, watchedFields.configuracaoId]);

  // Efeito para preencher dados na edição
  useEffect(() => {
    if (isOpen) {
      setHasUnsavedChanges(false);
      setIsFormInitialized(false);

      if (produtoEditando) {
        reset({
          nome: produtoEditando.nome || '',
          tipoItem: produtoEditando.tipoItem || 'produto',
          categoria: produtoEditando.categoria || '',
          categoriaId: produtoEditando.categoriaId,
          subcategoriaId: produtoEditando.subcategoriaId,
          configuracaoId: produtoEditando.configuracaoId,
          precoUnitario: produtoEditando.precoUnitario || 0,
          custoUnitario: produtoEditando.custoUnitario,
          frequencia: produtoEditando.frequencia || 'unico',
          unidadeMedida: produtoEditando.unidadeMedida || 'unidade',
          status:
            (produtoEditando as any).status === true
              ? 'ativo'
              : (produtoEditando as any).status === false
                ? 'inativo'
                : produtoEditando.status || 'ativo',
          descricao: produtoEditando.descricao || '',
          sku: produtoEditando.sku || '',
          fornecedor: produtoEditando.fornecedor || '',
          estoqueAtual: produtoEditando.estoqueAtual,
          estoqueMinimo: produtoEditando.estoqueMinimo,
          estoqueMaximo: produtoEditando.estoqueMaximo,
          tags: produtoEditando.tags || [],
          variacoes: produtoEditando.variacoes || [],
          tipoLicenciamento: produtoEditando.tipoLicenciamento || '',
          periodicidadeLicenca: produtoEditando.periodicidadeLicenca || '',
          renovacaoAutomatica: produtoEditando.renovacaoAutomatica ?? false,
          quantidadeLicencas: produtoEditando.quantidadeLicencas ?? 1,
        });
      } else {
        reset({
          nome: '',
          tipoItem: 'produto',
          categoria: '',
          categoriaId: undefined,
          subcategoriaId: undefined,
          configuracaoId: undefined,
          precoUnitario: 0,
          custoUnitario: undefined,
          frequencia: 'unico',
          unidadeMedida: 'unidade',
          status: 'ativo',
          descricao: '',
          sku: '',
          fornecedor: '',
          estoqueAtual: undefined,
          estoqueMinimo: undefined,
          estoqueMaximo: undefined,
          tags: [],
          variacoes: [],
          tipoLicenciamento: '',
          periodicidadeLicenca: '',
          renovacaoAutomatica: false,
          quantidadeLicencas: 1,
        });
      }

      // Marca como inicializado após um pequeno delay para evitar detecção de mudança
      setTimeout(() => setIsFormInitialized(true), 100);
    }
  }, [produtoEditando, isOpen, reset]);

  const handleConfirmClose = () => {
    setHasUnsavedChanges(false);
    setIsFormInitialized(false);
    setShowUnsavedChangesModal(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowUnsavedChangesModal(false);
  };

  const adicionarTag = () => {
    if (tagInput.trim() && !watchedFields.tags?.includes(tagInput.trim())) {
      const novasTags = [...(watchedFields.tags || []), tagInput.trim()];
      setValue('tags', novasTags, { shouldValidate: true });
      setTagInput('');
    }
  };

  const removerTag = (tagParaRemover: string) => {
    const tagsFiltradas = watchedFields.tags?.filter((tag) => tag !== tagParaRemover) || [];
    setValue('tags', tagsFiltradas, { shouldValidate: true });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal de Confirmação de Alterações Não Salvas */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1F2A]/45 p-4 backdrop-blur-[1px]">
          <div
            className="w-[calc(100%-2rem)] max-w-[500px] rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_70px_-36px_rgba(16,57,74,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-product-title"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="mr-3 h-6 w-6 text-[#D97706]" />
                <h3 id="unsaved-product-title" className="text-lg font-semibold text-[#19384C]">
                  Alterações não salvas
                </h3>
              </div>
              <p className="mb-6 text-sm text-[#4F6470]">
                Você tem alterações não salvas no item. Deseja realmente sair sem salvar?
              </p>
              <div className="flex justify-end space-x-3">
                <button onClick={handleCancelClose} className={secondaryButtonClass}>
                  Continuar editando
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Sair sem salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Principal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#0B1F2A]/45 transition-opacity backdrop-blur-[1px]"
          onClick={handleClose}
        />

        {/* Modal - Layout Paisagem */}
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
          <div
            className="relative w-[calc(100%-2rem)] max-w-[1400px] rounded-[20px] border border-[#DCE7EB] bg-white shadow-[0_30px_70px_-36px_rgba(16,57,74,0.45)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1200px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#DEE8EC] p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-xl bg-[#F2F8FB] p-2">
                  <Package className="h-6 w-6 text-[#159A9C]" />
                </div>
                <div>
                  <h2 id={dialogTitleId} className="text-xl font-semibold text-[#19384C]">
                    {produtoEditando ? 'Editar Item' : 'Novo Item'}
                  </h2>
                  <p id={dialogDescriptionId} className="text-sm text-[#5F7380]">
                    Preencha as informações do item do catálogo
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <SaveStatus
                  isDirty={hasUnsavedChanges}
                  isSaving={isSubmitting}
                  lastSaved={
                    isFormInitialized
                      ? undefined
                      : lastSaveAttempt
                        ? new Date(lastSaveAttempt)
                        : undefined
                  }
                />
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-lg p-2 text-[#7A8D99] transition-colors hover:bg-[#F6FAFB] hover:text-[#244455] disabled:cursor-not-allowed"
                  aria-label="Fechar modal de cadastro de item"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Formulário em Grid */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="bg-[#F6FAFB] p-4 sm:p-6">
              <div
                className={`grid grid-cols-1 gap-6 ${isSoftware ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
              >
                {/* Coluna 1: Informações Básicas */}
                <div className="space-y-4 rounded-xl border border-[#DEE8EC] bg-white p-4">
                  <h3 className={sectionTitleClass}>
                    <Package className="mr-2 h-5 w-5 text-[#159A9C]" />
                    Informações Básicas
                  </h3>

                  {/* Nome */}
                  <div>
                    <label htmlFor="nome" className={labelClass}>
                      Nome do Item *
                    </label>
                    <input
                      {...register('nome')}
                      type="text"
                      id="nome"
                      className={errors.nome ? inputErrorClass : inputClass}
                      placeholder="Digite o nome do item"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    <label htmlFor="tipoItem" className={labelClass}>
                      Tipo *
                    </label>
                    <select
                      {...register('tipoItem')}
                      id="tipoItem"
                      className={errors.tipoItem ? inputErrorClass : inputClass}
                    >
                      {tiposItem.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipoItem && (
                      <p className="mt-1 text-sm text-red-600">{errors.tipoItem.message}</p>
                    )}
                  </div>

                  {/* Categoria */}
                  <div>
                    <label htmlFor="categoria" className={labelClass}>
                      Categoria *
                    </label>
                    {loadingCategorias ? (
                      <div className="w-full rounded-lg border border-[#D4E2E7] bg-[#F9FCFD] px-3 py-2 text-sm text-[#7A8D99]">
                        Carregando categorias...
                      </div>
                    ) : (
                      <Controller
                        name="categoria"
                        control={control}
                        render={({ field }) => (
                          <select
                            id="categoria"
                            value={field.value || ''}
                            onChange={(event) => {
                              const categoria = event.target.value;
                              field.onChange(categoria);
                              const categoriaRelacionada =
                                categoriasCatalogo.find(
                                  (item) => normalizeCatalogName(item.nome) === normalizeCatalogName(categoria),
                                ) || null;
                              setValue('categoriaId', categoriaRelacionada?.id, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue('subcategoriaId', undefined, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue('configuracaoId', undefined, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                            className={errors.categoria ? inputErrorClass : inputClass}
                          >
                            <option value="">Selecione uma categoria</option>
                            {categorias.map((categoria, index) => (
                              <option key={`${categoria}-${index}`} value={categoria}>
                                {categoria}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    )}
                    {errors.categoria && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
                    )}
                  </div>

                  {categoriaSelecionada && categoriaTemSubcategorias ? (
                    <div>
                      <label htmlFor="subcategoriaId" className={labelClass}>
                        Subcategoria
                      </label>
                      <Controller
                        name="subcategoriaId"
                        control={control}
                        render={({ field }) => (
                          <select
                            id="subcategoriaId"
                            value={field.value || ''}
                            onChange={(event) => {
                              const subcategoriaId = event.target.value || undefined;
                              field.onChange(subcategoriaId);
                              setValue('configuracaoId', undefined, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              const subcategoria =
                                subcategoriasDisponiveis.find((item) => item.id === subcategoriaId) || null;
                              if (subcategoria?.unidade) {
                                setValue('unidadeMedida', subcategoria.unidade as ProdutoFormData['unidadeMedida'], {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }
                            }}
                            className={errors.subcategoriaId ? inputErrorClass : inputClass}
                          >
                            <option value="">Selecione uma subcategoria</option>
                            {subcategoriasDisponiveis.map((subcategoria) => (
                              <option key={subcategoria.id} value={subcategoria.id}>
                                {subcategoria.nome}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.subcategoriaId && (
                        <p className="mt-1 text-sm text-red-600">{errors.subcategoriaId.message}</p>
                      )}
                    </div>
                  ) : categoriaSelecionada ? (
                    <div className="rounded-lg border border-[#D4E2E7] bg-[#F9FCFD] px-3 py-2 text-sm text-[#607B89]">
                      <p>
                        Esta categoria não exige subcategoria. Você pode seguir com o cadastro usando apenas a classificação principal.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenCatalogStructure('subcategorias')}
                        className={helperLinkButtonClass}
                      >
                        Gerenciar estrutura do catálogo
                      </button>
                    </div>
                  ) : null}

                  {subcategoriaSelecionada && subcategoriaTemConfiguracoes ? (
                    <div>
                      <label htmlFor="configuracaoId" className={labelClass}>
                        Configuração
                      </label>
                      <Controller
                        name="configuracaoId"
                        control={control}
                        render={({ field }) => (
                          <select
                            id="configuracaoId"
                            value={field.value || ''}
                            onChange={(event) => field.onChange(event.target.value || undefined)}
                            className={errors.configuracaoId ? inputErrorClass : inputClass}
                          >
                            <option value="">Selecione uma configuração</option>
                            {configuracoesDisponiveis.map((configuracao) => (
                              <option key={configuracao.id} value={configuracao.id}>
                                {configuracao.nome}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.configuracaoId && (
                        <p className="mt-1 text-sm text-red-600">{errors.configuracaoId.message}</p>
                      )}
                    </div>
                  ) : subcategoriaSelecionada ? (
                    <div className="rounded-lg border border-[#D4E2E7] bg-[#F9FCFD] px-3 py-2 text-sm text-[#607B89]">
                      <p>Esta subcategoria não possui configurações adicionais. O item já está no nível mais detalhado.</p>
                      <button
                        type="button"
                        onClick={() => handleOpenCatalogStructure('configuracoes')}
                        className={helperLinkButtonClass}
                      >
                        Criar configuração nesta estrutura
                      </button>
                    </div>
                  ) : null}

                  {/* Preço */}
                  <div>
                    <label htmlFor="precoUnitario" className={labelClass}>
                      Preço Unitário *
                    </label>
                    <Controller
                      name="precoUnitario"
                      control={control}
                      render={({ field }) => (
                        <MoneyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="R$ 0,00"
                          className={errors.precoUnitario ? inputErrorClass : inputClass}
                        />
                      )}
                    />
                    {errors.precoUnitario && (
                      <p className="mt-1 text-sm text-red-600">{errors.precoUnitario.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="custoUnitario" className={labelClass}>
                      Custo Unitário
                    </label>
                    <Controller
                      name="custoUnitario"
                      control={control}
                      render={({ field }) => (
                        <MoneyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="R$ 0,00"
                          className={errors.custoUnitario ? inputErrorClass : inputClass}
                        />
                      )}
                    />
                    {errors.custoUnitario && (
                      <p className="mt-1 text-sm text-red-600">{errors.custoUnitario.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="sku" className={labelClass}>
                      SKU
                    </label>
                    <input
                      {...register('sku')}
                      type="text"
                      id="sku"
                      className={errors.sku ? inputErrorClass : inputClass}
                      placeholder="Código interno do item"
                    />
                    {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="fornecedor" className={labelClass}>
                      Fornecedor
                    </label>
                    <input
                      {...register('fornecedor')}
                      type="text"
                      id="fornecedor"
                      className={errors.fornecedor ? inputErrorClass : inputClass}
                      placeholder="Nome do fornecedor"
                    />
                    {errors.fornecedor && (
                      <p className="mt-1 text-sm text-red-600">{errors.fornecedor.message}</p>
                    )}
                  </div>
                </div>

                {/* Coluna 2: Configurações */}
                <div className="space-y-4 rounded-xl border border-[#DEE8EC] bg-white p-4">
                  <h3 className={sectionTitleClass}>
                    <DollarSign className="mr-2 h-5 w-5 text-[#159A9C]" />
                    Configurações
                  </h3>

                  <div className="rounded-lg border border-[#DEEFE7] bg-[#F7FCFA] p-3 text-sm text-[#35616D]">
                    {isItemRecorrente
                      ? 'Item recorrente: configure frequência mensal ou anual para refletir o ciclo comercial.'
                      : 'Item de cobrança única: mantenha frequência em único para evitar distorção no catálogo.'}
                  </div>

                  {/* Frequência */}
                  <div>
                    <label htmlFor="frequencia" className={labelClass}>
                      {t('common.frequency')} *
                    </label>
                    <select
                      {...register('frequencia')}
                      id="frequencia"
                      className={errors.frequencia ? inputErrorClass : inputClass}
                    >
                      {frequencias.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                    {errors.frequencia && (
                      <p className="mt-1 text-sm text-red-600">{errors.frequencia.message}</p>
                    )}
                  </div>

                  {/* Unidade de Medida */}
                  <div>
                    <label htmlFor="unidadeMedida" className={labelClass}>
                      Unidade de Medida *
                    </label>
                    <select
                      {...register('unidadeMedida')}
                      id="unidadeMedida"
                      className={errors.unidadeMedida ? inputErrorClass : inputClass}
                    >
                      {unidadesMedida.map((unidade) => (
                        <option key={unidade.value} value={unidade.value}>
                          {unidade.label}
                        </option>
                      ))}
                    </select>
                    {errors.unidadeMedida && (
                      <p className="mt-1 text-sm text-red-600">{errors.unidadeMedida.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className={labelClass}>Status *</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <select
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                          className={errors.status ? inputErrorClass : inputClass}
                        >
                          <option value="ativo">Ativo</option>
                          <option value="inativo">Inativo</option>
                          <option value="descontinuado">Descontinuado</option>
                        </select>
                      )}
                    />
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div>
                    <label htmlFor="descricao" className={labelClass}>
                      Descrição
                    </label>
                    <textarea
                      {...register('descricao')}
                      id="descricao"
                      rows={4}
                      className={errors.descricao ? inputErrorClass : inputClass}
                      placeholder="Descrição detalhada do item..."
                    />
                    {errors.descricao && (
                      <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
                    )}
                  </div>

                  {tipoAtual === 'produto' && (
                    <div className="space-y-3 rounded-lg border border-[#DEEFE7] bg-[#F7FCFA] p-3">
                      <p className="text-sm font-medium text-[#244455]">Controle de estoque</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label htmlFor="estoqueAtual" className={labelClass}>
                            Estoque atual
                          </label>
                          <input
                            {...register('estoqueAtual', {
                              valueAsNumber: true,
                              setValueAs: (value) => (value === '' ? undefined : Number(value)),
                            })}
                            type="number"
                            min="0"
                            id="estoqueAtual"
                            className={errors.estoqueAtual ? inputErrorClass : inputClass}
                            placeholder="0"
                          />
                          {errors.estoqueAtual && (
                            <p className="mt-1 text-sm text-red-600">{errors.estoqueAtual.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="estoqueMinimo" className={labelClass}>
                            Estoque mínimo
                          </label>
                          <input
                            {...register('estoqueMinimo', {
                              valueAsNumber: true,
                              setValueAs: (value) => (value === '' ? undefined : Number(value)),
                            })}
                            type="number"
                            min="0"
                            id="estoqueMinimo"
                            className={errors.estoqueMinimo ? inputErrorClass : inputClass}
                            placeholder="0"
                          />
                          {errors.estoqueMinimo && (
                            <p className="mt-1 text-sm text-red-600">{errors.estoqueMinimo.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="estoqueMaximo" className={labelClass}>
                            Estoque máximo
                          </label>
                          <input
                            {...register('estoqueMaximo', {
                              valueAsNumber: true,
                              setValueAs: (value) => (value === '' ? undefined : Number(value)),
                            })}
                            type="number"
                            min="0"
                            id="estoqueMaximo"
                            className={errors.estoqueMaximo ? inputErrorClass : inputClass}
                            placeholder="0"
                          />
                          {errors.estoqueMaximo && (
                            <p className="mt-1 text-sm text-red-600">{errors.estoqueMaximo.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coluna 2.5: Campos Específicos para Software (Condicional) */}
                {isSoftware && (
                  <div className="space-y-4 rounded-xl border border-[#DEE8EC] bg-white p-4 lg:col-span-1">
                    <h3 className={sectionTitleClass}>
                      <Keyboard className="mr-2 h-5 w-5 text-[#159A9C]" />
                      Configurações de Software
                    </h3>

                    {/* Alerta informativo */}
                    {campos.alertaEspecial && (
                      <div className="rounded-lg border border-[#CDE4F5] bg-[#F4F9FD] p-3">
                        <p className="text-sm text-[#2A5C86]">{campos.alertaEspecial}</p>
                      </div>
                    )}

                    {/* Tipo de Licenciamento */}
                    <div>
                      <label htmlFor="tipoLicenciamento" className={labelClass}>
                        Tipo de Licenciamento *
                      </label>
                      <select
                        {...register('tipoLicenciamento')}
                        id="tipoLicenciamento"
                        className={errors.tipoLicenciamento ? inputErrorClass : inputClass}
                      >
                        <option value="">Selecione o tipo</option>
                        {TIPOS_LICENCIAMENTO.map((tipo) => (
                          <option key={tipo.value} value={tipo.value} title={tipo.descricao}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                      {errors.tipoLicenciamento && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.tipoLicenciamento.message}
                        </p>
                      )}
                    </div>

                    {/* Periodicidade da Licença */}
                    <div>
                      <label htmlFor="periodicidadeLicenca" className={labelClass}>
                        Periodicidade da Licença *
                      </label>
                      <select
                        {...register('periodicidadeLicenca')}
                        id="periodicidadeLicenca"
                        className={errors.periodicidadeLicenca ? inputErrorClass : inputClass}
                      >
                        <option value="">Selecione a periodicidade</option>
                        {PERIODICIDADES_LICENCA.map((periodo) => (
                          <option
                            key={periodo.value}
                            value={periodo.value}
                            title={periodo.descricao}
                          >
                            {periodo.label}
                          </option>
                        ))}
                      </select>
                      {errors.periodicidadeLicenca && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.periodicidadeLicenca.message}
                        </p>
                      )}
                    </div>

                    {/* Quantidade de Licenças */}
                    <div>
                      <label htmlFor="quantidadeLicencas" className={labelClass}>
                        {campos.labelQuantidade}
                      </label>
                      <input
                        {...register('quantidadeLicencas', {
                          valueAsNumber: true,
                          setValueAs: (value) => (value === '' ? undefined : Number(value)),
                        })}
                        type="number"
                        id="quantidadeLicencas"
                        min="1"
                        className={errors.quantidadeLicencas ? inputErrorClass : inputClass}
                        placeholder="Ex: 10"
                      />
                      {errors.quantidadeLicencas && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.quantidadeLicencas.message}
                        </p>
                      )}
                      {campos.tooltipInfo && (
                        <p className="mt-1 text-xs text-gray-500">{campos.tooltipInfo}</p>
                      )}
                    </div>

                    {/* Renovação Automática */}
                    <div>
                      <label className={labelClass}>
                        {t('common.automaticRenewal')}
                      </label>
                      <Controller
                        name="renovacaoAutomatica"
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={field.value === true}
                                onChange={() => field.onChange(true)}
                                className="mr-2 text-[#159A9C] focus:ring-[#159A9C]"
                              />
                              <span className="text-sm text-[#244455]">{t('common.yes')}</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={field.value === false}
                                onChange={() => field.onChange(false)}
                                className="mr-2 text-[#B4BEC9] focus:ring-[#B4BEC9]"
                              />
                              <span className="text-sm text-[#244455]">{t('common.no')}</span>
                            </label>
                          </div>
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Define se a licença será renovada automaticamente no vencimento
                      </p>
                    </div>
                  </div>
                )}

                {/* Coluna 3: Tags e Variações */}
                <div className="space-y-4 rounded-xl border border-[#DEE8EC] bg-white p-4">
                  <h3 className={sectionTitleClass}>
                    <Tag className="mr-2 h-5 w-5 text-[#159A9C]" />
                    Tags e Variações
                  </h3>

                  {/* Tags */}
                  <div>
                    <label className={labelClass}>Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), adicionarTag())
                        }
                        className={inputClass}
                        placeholder="Digite uma tag e pressione Enter"
                      />
                      <button
                        type="button"
                        onClick={adicionarTag}
                        className={primaryButtonClass}
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {watchedFields.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full border border-[#CFE7E8] bg-[#EFF8F8] px-3 py-1 text-sm text-[#0F7B7D]"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removerTag(tag)}
                            className="ml-2 text-[#0F7B7D] hover:text-[#0A5F61]"
                            aria-label={`Remover tag ${tag}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-6 flex justify-end space-x-3 border-t border-[#DEE8EC] pt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className={secondaryButtonClass}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting || loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Salvando...
                    </>
                  ) : (
                    <>{produtoEditando ? t('common.update') : 'Salvar item'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
