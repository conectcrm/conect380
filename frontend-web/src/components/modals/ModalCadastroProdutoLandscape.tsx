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
import { X, Tag, Package, DollarSign, AlertTriangle, Keyboard, Plus, Trash2 } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';
import { useModalKeyboardShortcuts } from '../../hooks/useModalKeyboardShortcuts';
import { SaveStatus } from '../SaveStatus';
import { useProdutoSoftware } from '../../hooks/useProdutoSoftware';
import { produtosService, Produto, ProdutoComponente } from '../../services/produtosService';
import {
  catalogoService,
  CatalogTemplate,
  CatalogTemplateField,
} from '../../services/catalogoService';
import { categoriasProdutosService } from '../../services/categoriasProdutosService';
import { CategoriaProduto } from '../../types/produtos';
import { useAuth } from '../../hooks/useAuth';
import { isCatalogApiEnabledForTenant } from '../../config/catalogoFeaturesFlags';

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
  tipoItem:
    | 'produto'
    | 'servico'
    | 'licenca'
    | 'modulo'
    | 'plano'
    | 'aplicativo'
    | 'peca'
    | 'acessorio'
    | 'pacote'
    | 'garantia';
  categoria: string;
  categoriaId?: string;
  subcategoriaId?: string;
  configuracaoId?: string;
  precoUnitario: number;
  custoUnitario?: number;
  frequencia: 'unico' | 'mensal' | 'anual' | 'trimestral' | 'sob_consulta';
  unidadeMedida:
    | 'unidade'
    | 'saca'
    | 'hectare'
    | 'pacote'
    | 'licenca'
    | 'hora'
    | 'dia'
    | 'mensal'
    | 'assinatura';
  status: 'ativo' | 'inativo' | 'descontinuado';
  descricao?: string;
  sku?: string;
  fornecedor?: string;
  estoqueAtual?: number;
  estoqueMinimo?: number;
  estoqueMaximo?: number;
  tags?: string[];
  variacoes?: string[];
  templateCode?: string;
  atributosTemplate?: Record<string, unknown>;
  // Campos específicos para software
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
  componentes?: ProdutoComponente[];
}

interface ModalCadastroProdutoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProdutoFormData) => void | Promise<void>;
  produtoEditando?: (ProdutoFormData & { produtoId?: string }) | null;
  defaultTipoItem?: ProdutoFormData['tipoItem'];
  loading?: boolean;
}

const tiposItemPermitidos = new Set<ProdutoFormData['tipoItem']>([
  'produto',
  'servico',
  'licenca',
  'modulo',
  'plano',
  'aplicativo',
  'peca',
  'acessorio',
  'pacote',
  'garantia',
]);

const resolveTipoItemPadrao = (tipoItem?: string | null): ProdutoFormData['tipoItem'] => {
  if (tipoItem && tiposItemPermitidos.has(tipoItem as ProdutoFormData['tipoItem'])) {
    return tipoItem as ProdutoFormData['tipoItem'];
  }

  return 'produto';
};

const componenteRoleOptions: Array<{
  value: ProdutoComponente['componentRole'];
  label: string;
}> = [
  { value: 'included', label: 'Incluído' },
  { value: 'required', label: 'Obrigatório' },
  { value: 'optional', label: 'Opcional' },
  { value: 'recommended', label: 'Recomendado' },
  { value: 'addon', label: 'Add-on' },
];

// Schema de validação
const schema = yup.object().shape({
  nome: yup
    .string()
    .required('Nome do item é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipoItem: yup
    .string()
    .required('Tipo do item é obrigatório')
    .oneOf(
      [
        'produto',
        'servico',
        'licenca',
        'modulo',
        'plano',
        'aplicativo',
        'peca',
        'acessorio',
        'pacote',
        'garantia',
      ],
      'Tipo inválido',
    ),
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
    .oneOf(['unico', 'mensal', 'anual', 'trimestral', 'sob_consulta'], 'Frequência inválida'),
  unidadeMedida: yup
    .string()
    .required('Unidade de medida é obrigatória')
    .oneOf(
      ['unidade', 'saca', 'hectare', 'pacote', 'licenca', 'hora', 'dia', 'mensal', 'assinatura'],
      'Unidade inválida',
    ),
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
  componentes: yup.array().default([]),
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
const tiposItemBase = [
  { value: 'produto', label: 'Produto' },
  { value: 'servico', label: 'Serviço' },
  { value: 'licenca', label: 'Licença' },
  { value: 'modulo', label: 'Módulo' },
  { value: 'plano', label: 'Plano' },
  { value: 'aplicativo', label: 'Aplicativo' },
];

const tiposItemCatalogo = [
  { value: 'peca', label: 'Peca' },
  { value: 'acessorio', label: 'Acessorio' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'garantia', label: 'Garantia' },
];

const frequenciasBase = [
  { value: 'unico', label: 'Único' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
];

const frequenciasCatalogo = [
  ...frequenciasBase,
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'sob_consulta', label: 'Sob consulta' },
];

const unidadesMedida = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'saca', label: 'Saca' },
  { value: 'hectare', label: 'Hectare' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'hora', label: 'Hora' },
  { value: 'dia', label: 'Dia' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'licenca', label: 'Licença' },
  { value: 'assinatura', label: 'Assinatura' },
];

const inferTemplateCodeByTipoItem = (tipoItem: ProdutoFormData['tipoItem']): string => {
  if (tipoItem === 'plano') return 'software_plan';
  if (tipoItem === 'modulo' || tipoItem === 'licenca' || tipoItem === 'aplicativo') {
    return 'software_module';
  }
  if (tipoItem === 'pacote') return 'service_package';
  if (tipoItem === 'peca') return 'autoparts_item';
  if (tipoItem === 'acessorio' || tipoItem === 'garantia' || tipoItem === 'servico') {
    return 'retail_accessory_or_service';
  }

  return '';
};

export const ModalCadastroProduto: React.FC<ModalCadastroProdutoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  produtoEditando,
  defaultTipoItem = 'produto',
  loading = false,
}) => {
  // Hook de internacionalização
  const { t } = useI18n();
  const { user } = useAuth();

  const [tagInput, setTagInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [itensComposicao, setItensComposicao] = useState<Produto[]>([]);
  const [loadingItensComposicao, setLoadingItensComposicao] = useState(false);
  const [novoComponenteItemId, setNovoComponenteItemId] = useState('');
  const [novoComponenteRole, setNovoComponenteRole] =
    useState<ProdutoComponente['componentRole']>('included');
  const [activeStep, setActiveStep] = useState(1);
  const [catalogTemplates, setCatalogTemplates] = useState<CatalogTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('');
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, unknown>>({});
  const [templateFieldErrors, setTemplateFieldErrors] = useState<Record<string, string>>({});
  const [showCustoField, setShowCustoField] = useState(false);
  const empresaId = user?.empresa?.id || null;
  const catalogApiEnabled = useMemo(
    () => isCatalogApiEnabledForTenant(empresaId),
    [empresaId],
  );
  const initialTipoItem = resolveTipoItemPadrao(defaultTipoItem);

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
    trigger,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      tipoItem: initialTipoItem,
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
      templateCode: undefined,
      atributosTemplate: undefined,
      // Valores padrão para campos de software
      tipoLicenciamento: '',
      periodicidadeLicenca: '',
      renovacaoAutomatica: false,
      quantidadeLicencas: 1,
      componentes: [],
    },
  });

  // Hook para produtos de software (após declaração do watch)
  const tipoAtual = watch('tipoItem') || initialTipoItem;
  const tipoGeral = watch('tipo'); // Para capturar se tipo === "software"
  const { campos, isSoftware, TIPOS_LICENCIAMENTO, PERIODICIDADES_LICENCA } = useProdutoSoftware(
    tipoAtual,
    tipoGeral,
  );

  const watchedFields = watch();
  const tiposItem = useMemo(
    () => (catalogApiEnabled ? [...tiposItemBase, ...tiposItemCatalogo] : tiposItemBase),
    [catalogApiEnabled],
  );
  const frequencias = useMemo(
    () => (catalogApiEnabled ? frequenciasCatalogo : frequenciasBase),
    [catalogApiEnabled],
  );
  const composicaoPlanoHabilitada = catalogApiEnabled && tipoAtual === 'plano';
  const itemComEstoque = ['produto', 'peca', 'acessorio'].includes(tipoAtual);
  const componentesSelecionados = watchedFields.componentes || [];
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const isItemRecorrente = ['plano', 'licenca', 'modulo', 'aplicativo', 'pacote'].includes(
    tipoAtual,
  );
  const precoLabel = 'Preço de Venda *';
  const custoLabel = isSoftware
    ? 'Custo Operacional Estimado'
    : tipoAtual === 'servico' || tipoAtual === 'pacote'
      ? 'Custo de Entrega'
      : tipoAtual === 'garantia'
        ? 'Custo de Cobertura'
        : 'Custo de Aquisição';
  const custoHint = isSoftware
    ? 'Opcional. Use para estimar o custo interno de atender esse item.'
    : tipoAtual === 'garantia'
      ? 'Opcional. Use para provisionamento interno da garantia.'
      : 'Opcional. Use para margem e acompanhamento interno.';
  const custoOpcionalPorContexto =
    isSoftware || tipoAtual === 'servico' || tipoAtual === 'pacote' || tipoAtual === 'garantia';
  const custoUnitarioPreenchido =
    watchedFields.custoUnitario !== undefined && watchedFields.custoUnitario !== null;
  const exibirCampoCusto = !custoOpcionalPorContexto || custoUnitarioPreenchido || showCustoField;
  const fornecedorLabel = 'Fornecedor';
  const fornecedorHint = isSoftware
    ? 'Opcional. Para item proprio (plano/modulo interno), pode deixar em branco.'
    : 'Opcional. Informe apenas quando existir parceiro ou fornecedor externo.';
  const steps = useMemo(
    () => [
      { id: 1, title: 'Classificacao' },
      { id: 2, title: 'Comercial' },
      { id: 3, title: composicaoPlanoHabilitada ? 'Operacao e composicao' : 'Operacao' },
    ],
    [composicaoPlanoHabilitada],
  );
  const totalSteps = steps.length;
  const isFirstStep = activeStep === 1;
  const isLastStep = activeStep === totalSteps;

  const selectedTemplate = useMemo(
    () => catalogTemplates.find((template) => template.code === selectedTemplateCode) || null,
    [catalogTemplates, selectedTemplateCode],
  );
  const templateFields = selectedTemplate?.fields || [];

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

  const itensDisponiveisParaAdicionar = useMemo(() => {
    const componentesIds = new Set(
      componentesSelecionados.map((componente) => componente.childItemId),
    );

    return itensComposicao.filter(
      (item) =>
        item.id !== produtoEditando?.produtoId &&
        item.status === 'ativo' &&
        item.tipoItem !== 'plano' &&
        !componentesIds.has(item.id),
    );
  }, [componentesSelecionados, itensComposicao, produtoEditando?.produtoId]);

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

  const updateTemplateFieldValue = (fieldKey: string, value: unknown) => {
    setTemplateFieldValues((currentValues) => ({
      ...currentValues,
      [fieldKey]: value,
    }));

    setTemplateFieldErrors((currentErrors) => {
      if (!currentErrors[fieldKey]) {
        return currentErrors;
      }

      const { [fieldKey]: _removed, ...remainingErrors } = currentErrors;
      return remainingErrors;
    });
  };

  const isTemplateFieldEmpty = (field: CatalogTemplateField, value: unknown): boolean => {
    if (field.fieldType === 'boolean') {
      return value === null || value === undefined;
    }

    if (field.fieldType === 'multiselect') {
      return !Array.isArray(value) || value.length === 0;
    }

    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim().length === 0;
    }

    return false;
  };

  const validateTemplateRequiredFields = (): boolean => {
    if (!selectedTemplate || templateFields.length === 0) {
      setTemplateFieldErrors({});
      return true;
    }

    const nextErrors: Record<string, string> = {};

    for (const field of templateFields) {
      if (!field.required) {
        continue;
      }

      const value = templateFieldValues[field.fieldKey];
      if (isTemplateFieldEmpty(field, value)) {
        nextErrors[field.fieldKey] = 'Campo obrigatório';
      }
    }

    setTemplateFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const renderTemplateFieldInput = (field: CatalogTemplateField) => {
    const fieldValue = templateFieldValues[field.fieldKey];
    const fieldError = templateFieldErrors[field.fieldKey];

    if (field.fieldType === 'boolean') {
      return (
        <label className="flex items-center gap-2 rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455]">
          <input
            type="checkbox"
            checked={Boolean(fieldValue)}
            onChange={(event) => updateTemplateFieldValue(field.fieldKey, event.target.checked)}
            className="rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
          />
          {field.label}
          {field.required ? ' *' : ''}
        </label>
      );
    }

    if (field.fieldType === 'textarea' || field.fieldType === 'json') {
      return (
        <textarea
          rows={3}
          value={typeof fieldValue === 'string' ? fieldValue : fieldValue ? String(fieldValue) : ''}
          onChange={(event) => updateTemplateFieldValue(field.fieldKey, event.target.value)}
          className={fieldError ? inputErrorClass : inputClass}
          placeholder={field.label}
        />
      );
    }

    if (field.fieldType === 'select') {
      return (
        <select
          value={typeof fieldValue === 'string' ? fieldValue : ''}
          onChange={(event) => updateTemplateFieldValue(field.fieldKey, event.target.value)}
          className={fieldError ? inputErrorClass : inputClass}
        >
          <option value="">Selecione</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.fieldType === 'multiselect') {
      return (
        <select
          multiple
          value={Array.isArray(fieldValue) ? fieldValue.map(String) : []}
          onChange={(event) =>
            updateTemplateFieldValue(
              field.fieldKey,
              Array.from(event.target.selectedOptions).map((option) => option.value),
            )
          }
          className={fieldError ? inputErrorClass : inputClass}
        >
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.fieldType === 'money') {
      const value =
        typeof fieldValue === 'number'
          ? fieldValue
          : typeof fieldValue === 'string' && fieldValue.trim() !== ''
            ? Number(fieldValue)
            : undefined;

      return (
        <MoneyInput
          value={Number.isFinite(value as number) ? (value as number) : undefined}
          onChange={(nextValue) => updateTemplateFieldValue(field.fieldKey, nextValue)}
          placeholder="R$ 0,00"
          className={fieldError ? inputErrorClass : inputClass}
        />
      );
    }

    return (
      <input
        type={field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text'}
        value={fieldValue === null || fieldValue === undefined ? '' : String(fieldValue)}
        onChange={(event) => {
          if (field.fieldType === 'number') {
            updateTemplateFieldValue(
              field.fieldKey,
              event.target.value === '' ? undefined : Number(event.target.value),
            );
            return;
          }

          updateTemplateFieldValue(field.fieldKey, event.target.value);
        }}
        className={fieldError ? inputErrorClass : inputClass}
        placeholder={field.label}
      />
    );
  };

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

      if (!validateTemplateRequiredFields()) {
        setActiveStep(2);
        return;
      }

      const payload: ProdutoFormData = {
        ...data,
        templateCode: selectedTemplateCode,
        atributosTemplate:
          Object.keys(templateFieldValues).length > 0 ? templateFieldValues : undefined,
      };

      await onSubmit(payload);
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

  const getFieldsToValidateByStep = (step: number): Array<keyof ProdutoFormData> => {
    if (step === 1) {
      return ['nome', 'tipoItem', 'categoria'];
    }

    if (step === 2) {
      const baseFields: Array<keyof ProdutoFormData> = [
        'precoUnitario',
        'frequencia',
        'unidadeMedida',
        'status',
      ];

      if (isSoftware) {
        baseFields.push('tipoLicenciamento', 'periodicidadeLicenca', 'quantidadeLicencas');
      }

      return baseFields;
    }

    return [];
  };

  const handleNextStep = async () => {
    if (isLastStep) {
      return;
    }

    const fieldsToValidate = getFieldsToValidateByStep(activeStep);
    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate);
      if (!isStepValid) {
        return;
      }
    }

    if (activeStep === 2 && !validateTemplateRequiredFields()) {
      return;
    }

    setActiveStep((currentStep) => Math.min(totalSteps, currentStep + 1));
  };

  const handlePreviousStep = () => {
    setActiveStep((currentStep) => Math.max(1, currentStep - 1));
  };

  // Hook de Atalhos de Teclado
  useModalKeyboardShortcuts({
    isOpen,
    onSave: () => {
      if (isSubmitting) {
        return;
      }

      if (!isLastStep) {
        void handleNextStep();
        return;
      }

      if (isValid) {
        handleSubmit(onFormSubmit)();
      }
    },
    onClose: handleClose,
    canSave: (isLastStep ? isValid : true) && !isSubmitting,
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

  useEffect(() => {
    if (!isOpen || !catalogApiEnabled) {
      setCatalogTemplates([]);
      setSelectedTemplateCode('');
      setTemplateFieldValues({});
      setTemplateFieldErrors({});
      setLoadingTemplates(false);
      return;
    }

    let isMounted = true;

    const carregarTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const templatesCatalogo = await catalogoService.listTemplates();
        const templateInferido = inferTemplateCodeByTipoItem(tipoAtual);
        const templateEditandoCode = produtoEditando?.templateCode || '';
        const templates = templatesCatalogo.filter(
          (template) =>
            template.businessType === tipoAtual ||
            template.code === templateInferido ||
            template.code === templateEditandoCode,
        );

        if (!isMounted) {
          return;
        }

        setCatalogTemplates(templates);

        const codigoPreferencial =
          produtoEditando?.templateCode || inferTemplateCodeByTipoItem(tipoAtual);
        const templateValido =
          templates.find((template) => template.code === codigoPreferencial)?.code || '';
        const fallbackTemplate = templateValido || templates[0]?.code || '';

        setSelectedTemplateCode(fallbackTemplate);
        setTemplateFieldValues(
          produtoEditando?.atributosTemplate && typeof produtoEditando.atributosTemplate === 'object'
            ? produtoEditando.atributosTemplate
            : {},
        );
        setTemplateFieldErrors({});
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Erro ao carregar templates de catalogo:', error);
        setCatalogTemplates([]);
        setSelectedTemplateCode('');
      } finally {
        if (isMounted) {
          setLoadingTemplates(false);
        }
      }
    };

    void carregarTemplates();

    return () => {
      isMounted = false;
    };
  }, [
    catalogApiEnabled,
    isOpen,
    produtoEditando?.atributosTemplate,
    produtoEditando?.templateCode,
    tipoAtual,
  ]);

  useEffect(() => {
    if (!isOpen || !catalogApiEnabled || tipoAtual !== 'plano') {
      setItensComposicao([]);
      setLoadingItensComposicao(false);
      setNovoComponenteItemId('');
      setNovoComponenteRole('included');
      return;
    }

    let isMounted = true;

    const carregarItensComposicao = async () => {
      try {
        setLoadingItensComposicao(true);
        const itens = await produtosService.findAll({ status: 'ativo' });

        if (!isMounted) {
          return;
        }

        setItensComposicao(itens);
      } catch (error) {
        if (isMounted) {
          console.error('Erro ao carregar itens para composicao do plano:', error);
          setItensComposicao([]);
        }
      } finally {
        if (isMounted) {
          setLoadingItensComposicao(false);
        }
      }
    };

    void carregarItensComposicao();

    return () => {
      isMounted = false;
    };
  }, [catalogApiEnabled, isOpen, tipoAtual]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const allowedFieldKeys = new Set(templateFields.map((field) => field.fieldKey));

    setTemplateFieldValues((currentValues) =>
      Object.fromEntries(
        Object.entries(currentValues).filter(([fieldKey]) => allowedFieldKeys.has(fieldKey)),
      ),
    );

    setTemplateFieldErrors((currentErrors) =>
      Object.fromEntries(
        Object.entries(currentErrors).filter(([fieldKey]) => allowedFieldKeys.has(fieldKey)),
      ),
    );
  }, [selectedTemplate, templateFields]);

  // Efeito para preencher dados na edição
  useEffect(() => {
    if (isOpen) {
      const tipoInicialFormulario = resolveTipoItemPadrao(
        produtoEditando?.tipoItem || initialTipoItem,
      );

      setHasUnsavedChanges(false);
      setIsFormInitialized(false);
      setActiveStep(1);
      setTemplateFieldErrors({});
      setTemplateFieldValues(
        produtoEditando?.atributosTemplate && typeof produtoEditando.atributosTemplate === 'object'
          ? produtoEditando.atributosTemplate
          : {},
      );
      setSelectedTemplateCode(
        produtoEditando?.templateCode ||
          inferTemplateCodeByTipoItem(tipoInicialFormulario),
      );
      setShowCustoField(
        produtoEditando?.custoUnitario !== undefined && produtoEditando?.custoUnitario !== null,
      );

      if (produtoEditando) {
        reset({
          nome: produtoEditando.nome || '',
          tipoItem: tipoInicialFormulario,
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
          templateCode: produtoEditando.templateCode,
          atributosTemplate: produtoEditando.atributosTemplate,
          tipoLicenciamento: produtoEditando.tipoLicenciamento || '',
          periodicidadeLicenca: produtoEditando.periodicidadeLicenca || '',
          renovacaoAutomatica: produtoEditando.renovacaoAutomatica ?? false,
          quantidadeLicencas: produtoEditando.quantidadeLicencas ?? 1,
          componentes: produtoEditando.componentes || [],
        });
      } else {
        reset({
          nome: '',
          tipoItem: initialTipoItem,
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
          templateCode: undefined,
          atributosTemplate: undefined,
          tipoLicenciamento: '',
          periodicidadeLicenca: '',
          renovacaoAutomatica: false,
          quantidadeLicencas: 1,
          componentes: [],
        });
      }

      // Marca como inicializado após um pequeno delay para evitar detecção de mudança
      setTimeout(() => setIsFormInitialized(true), 100);
    }
  }, [initialTipoItem, isOpen, produtoEditando, reset]);

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

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || !Number.isFinite(value)) {
      return null;
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const obterRotuloTipoItem = (tipoItem?: string) =>
    tiposItem.find((tipo) => tipo.value === tipoItem)?.label || 'Item';

  const adicionarComponente = () => {
    if (!novoComponenteItemId) {
      return;
    }

    const itemSelecionado = itensComposicao.find((item) => item.id === novoComponenteItemId);
    if (!itemSelecionado) {
      return;
    }

    const novoComponente: ProdutoComponente = {
      childItemId: itemSelecionado.id,
      componentRole: novoComponenteRole,
      quantity: 1,
      sortOrder: componentesSelecionados.length,
      affectsPrice: ['optional', 'addon'].includes(novoComponenteRole),
      isDefault: !['optional', 'addon'].includes(novoComponenteRole),
      nome: itemSelecionado.nome,
      preco: itemSelecionado.preco,
      tipoItem: itemSelecionado.tipoItem,
      status: itemSelecionado.status,
    };

    setValue('componentes', [...componentesSelecionados, novoComponente], {
      shouldDirty: true,
    });
    setNovoComponenteItemId('');
    setNovoComponenteRole('included');
  };

  const atualizarComponente = (
    index: number,
    patch: Partial<ProdutoComponente>,
  ) => {
    const proximosComponentes = componentesSelecionados.map((componente, componenteIndex) =>
      componenteIndex === index
        ? {
            ...componente,
            ...patch,
            sortOrder: componenteIndex,
          }
        : componente,
    );

    setValue('componentes', proximosComponentes, {
      shouldDirty: true,
    });
  };

  const removerComponente = (childItemId: string) => {
    const proximosComponentes = componentesSelecionados
      .filter((componente) => componente.childItemId !== childItemId)
      .map((componente, index) => ({
        ...componente,
        sortOrder: index,
      }));

    setValue('componentes', proximosComponentes, {
      shouldDirty: true,
    });
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
                <SaveStatus isDirty={hasUnsavedChanges} isSaving={isSubmitting} />
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
              <div className="mb-6 rounded-xl border border-[#DEE8EC] bg-white p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {steps.map((step) => {
                    const isCurrentStep = step.id === activeStep;
                    const isCompletedStep = step.id < activeStep;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => {
                          if (step.id <= activeStep) {
                            setActiveStep(step.id);
                          }
                        }}
                        disabled={step.id > activeStep}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                          isCurrentStep
                            ? 'border-[#159A9C] bg-[#EFF8F8] text-[#0F7B7D]'
                            : isCompletedStep
                              ? 'border-[#CFE7E8] bg-[#F7FCFA] text-[#35616D] hover:bg-[#EFF8F8]'
                              : 'border-[#D4E2E7] bg-[#F9FCFD] text-[#7A8D99]'
                        } disabled:cursor-not-allowed disabled:opacity-80`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isCurrentStep || isCompletedStep
                              ? 'bg-[#159A9C] text-white'
                              : 'bg-[#D4E2E7] text-[#607B89]'
                          }`}
                        >
                          {step.id}
                        </span>
                        <span className="font-medium">{step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeStep === 1 && (
                <div className="grid grid-cols-1 gap-6">
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
                      {precoLabel}
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
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label htmlFor="custoUnitario" className="text-sm font-medium text-[#244455]">
                        {custoLabel}
                      </label>
                      {custoOpcionalPorContexto && exibirCampoCusto && (
                        <button
                          type="button"
                          onClick={() => {
                            setValue('custoUnitario', undefined, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setShowCustoField(false);
                          }}
                          className="text-xs font-medium text-[#607B89] transition hover:text-[#35538A]"
                        >
                          Remover custo
                        </button>
                      )}
                    </div>

                    {!exibirCampoCusto ? (
                      <div className="rounded-lg border border-dashed border-[#D4E2E7] bg-[#F9FCFD] p-3">
                        <p className="text-xs text-[#607B89]">{custoHint}</p>
                        <button
                          type="button"
                          onClick={() => setShowCustoField(true)}
                          className="mt-2 inline-flex h-8 items-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                        >
                          Adicionar custo interno
                        </button>
                      </div>
                    ) : (
                      <>
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
                        <p className="mt-1 text-xs text-[#607B89]">{custoHint}</p>
                        {errors.custoUnitario && (
                          <p className="mt-1 text-sm text-red-600">{errors.custoUnitario.message}</p>
                        )}
                      </>
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
                      {fornecedorLabel}
                    </label>
                    <input
                      {...register('fornecedor')}
                      type="text"
                      id="fornecedor"
                      className={errors.fornecedor ? inputErrorClass : inputClass}
                      placeholder="Nome do fornecedor"
                    />
                    <p className="mt-1 text-xs text-[#607B89]">{fornecedorHint}</p>
                    {errors.fornecedor && (
                      <p className="mt-1 text-sm text-red-600">{errors.fornecedor.message}</p>
                    )}
                  </div>
                </div>

                </div>
            )}

              {activeStep === 2 && (
                <div className={`grid grid-cols-1 gap-6 ${isSoftware ? 'lg:grid-cols-2' : ''}`}>
                {/* Coluna 2: Configurações */}
                <div className="space-y-4 rounded-xl border border-[#DEE8EC] bg-white p-4">
                  <h3 className={sectionTitleClass}>
                    <DollarSign className="mr-2 h-5 w-5 text-[#159A9C]" />
                    Configurações
                  </h3>

                  <div className="rounded-lg border border-[#DEEFE7] bg-[#F7FCFA] p-3 text-sm text-[#35616D]">
                    {isItemRecorrente
                      ? 'Item recorrente: configure mensal, trimestral, anual ou sob consulta conforme o ciclo comercial.'
                      : 'Item de cobrança única: mantenha frequência em unico para evitar distorção no catálogo.'}
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

                  {catalogApiEnabled && (
                    <div className="space-y-3 rounded-lg border border-[#DEEFE7] bg-[#F7FCFA] p-3">
                      <div>
                        <p className="text-sm font-medium text-[#244455]">Template do catalogo</p>
                        <p className="mt-1 text-xs text-[#607B89]">
                          Defina os campos especializados por nicho sem inflar o cadastro base.
                        </p>
                      </div>

                      <div>
                        <label className={labelClass}>Template aplicado</label>
                        <select
                          value={selectedTemplateCode}
                          onChange={(event) => {
                            const nextTemplateCode = event.target.value;
                            setSelectedTemplateCode(nextTemplateCode);
                            if (!nextTemplateCode) {
                              setTemplateFieldValues({});
                            }
                            setTemplateFieldErrors({});
                          }}
                          className={inputClass}
                          disabled={loadingTemplates}
                        >
                          <option value="">
                            {loadingTemplates
                              ? 'Carregando templates...'
                              : 'Sem template especializado'}
                          </option>
                          {catalogTemplates.map((template) => (
                            <option key={template.code} value={template.code}>
                              {template.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedTemplate ? (
                        <div className="space-y-3 rounded-lg border border-[#D4E2E7] bg-white p-3">
                          <p className="text-sm font-medium text-[#19384C]">
                            Campos dinamicos: {selectedTemplate.nome}
                          </p>

                          {templateFields.length === 0 ? (
                            <p className="text-xs text-[#607B89]">
                              Este template nao possui campos extras configurados.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              {templateFields.map((field) => {
                                const fieldError = templateFieldErrors[field.fieldKey];
                                const helperText = fieldError || field.helpText;

                                return (
                                  <div key={field.id}>
                                    {field.fieldType !== 'boolean' && (
                                      <label className={labelClass}>
                                        {field.label}
                                        {field.required ? ' *' : ''}
                                      </label>
                                    )}
                                    {renderTemplateFieldInput(field)}
                                    {helperText && (
                                      <p className={fieldError ? 'mt-1 text-xs text-red-600' : 'mt-1 text-xs text-[#607B89]'}>
                                        {helperText}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#607B89]">
                          Nenhum template especializado selecionado para este item.
                        </p>
                      )}
                    </div>
                  )}

                  {itemComEstoque && (
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

              </div>
            )}

              {activeStep === 3 && (
                <div className="grid grid-cols-1 gap-6">
                {/* Coluna 3: Tags e Variações */}
                <div className="space-y-4 rounded-xl border border-[#DEE8EC] bg-white p-4">
                  <h3 className={sectionTitleClass}>
                    <Tag className="mr-2 h-5 w-5 text-[#159A9C]" />
                    Tags e Variações
                  </h3>

                  {composicaoPlanoHabilitada && (
                    <div className="space-y-3 rounded-lg border border-[#DEEFE7] bg-[#F7FCFA] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#244455]">Composicao do plano</p>
                          <p className="mt-1 text-xs text-[#607B89]">
                            Vincule modulos, licencas, aplicativos e servicos incluidos na oferta.
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#0F7B7D]">
                          {componentesSelecionados.length} item(ns)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
                        <div>
                          <label className={labelClass}>Adicionar item</label>
                          <select
                            value={novoComponenteItemId}
                            onChange={(event) => setNovoComponenteItemId(event.target.value)}
                            className={inputClass}
                            disabled={loadingItensComposicao}
                          >
                            <option value="">
                              {loadingItensComposicao
                                ? 'Carregando itens...'
                                : 'Selecione um item do catalogo'}
                            </option>
                            {itensDisponiveisParaAdicionar.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.nome} · {obterRotuloTipoItem(item.tipoItem)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Relacao</label>
                          <select
                            value={novoComponenteRole}
                            onChange={(event) =>
                              setNovoComponenteRole(
                                event.target.value as ProdutoComponente['componentRole'],
                              )
                            }
                            className={inputClass}
                          >
                            {componenteRoleOptions.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={adicionarComponente}
                            disabled={!novoComponenteItemId}
                            className={primaryButtonClass}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Incluir
                          </button>
                        </div>
                      </div>

                      {!loadingItensComposicao && itensDisponiveisParaAdicionar.length === 0 && (
                        <div className="rounded-lg border border-dashed border-[#CFE7E8] bg-white px-3 py-3 text-sm text-[#607B89]">
                          {componentesSelecionados.length > 0
                            ? 'Todos os itens ativos disponiveis ja foram vinculados a este plano.'
                            : 'Nenhum item elegivel encontrado para compor o plano.'}
                        </div>
                      )}

                      {componentesSelecionados.length > 0 && (
                        <div className="space-y-3">
                          {componentesSelecionados.map((componente, index) => {
                            const itemRelacionado = itensComposicao.find(
                              (item) => item.id === componente.childItemId,
                            );
                            const nomeComponente =
                              componente.nome || itemRelacionado?.nome || 'Item do catalogo';
                            const tipoComponente =
                              componente.tipoItem || itemRelacionado?.tipoItem || 'produto';
                            const precoComponente = formatCurrency(
                              componente.preco ?? itemRelacionado?.preco,
                            );

                            return (
                              <div
                                key={`${componente.childItemId}-${index}`}
                                className="rounded-lg border border-[#D4E2E7] bg-white p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-[#19384C]">
                                      {nomeComponente}
                                    </p>
                                    <p className="mt-1 text-xs text-[#607B89]">
                                      {obterRotuloTipoItem(tipoComponente)}
                                      {precoComponente ? ` · ${precoComponente}` : ''}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removerComponente(componente.childItemId)}
                                    className="rounded-lg p-2 text-[#7A8D99] transition hover:bg-[#F6FAFB] hover:text-[#244455]"
                                    aria-label={`Remover ${nomeComponente} da composicao`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div>
                                    <label className={labelClass}>Relacao</label>
                                    <select
                                      value={componente.componentRole}
                                      onChange={(event) =>
                                        atualizarComponente(index, {
                                          componentRole:
                                            event.target.value as ProdutoComponente['componentRole'],
                                        })
                                      }
                                      className={inputClass}
                                    >
                                      {componenteRoleOptions.map((role) => (
                                        <option key={role.value} value={role.value}>
                                          {role.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className={labelClass}>Quantidade padrao</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={componente.quantity ?? 1}
                                      onChange={(event) =>
                                        atualizarComponente(index, {
                                          quantity: Number(event.target.value || 1),
                                        })
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <label className="flex items-center gap-2 rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455]">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(componente.affectsPrice)}
                                      onChange={(event) =>
                                        atualizarComponente(index, {
                                          affectsPrice: event.target.checked,
                                        })
                                      }
                                      className="rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                                    />
                                    Afeta o preco final da oferta
                                  </label>

                                  <label className="flex items-center gap-2 rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455]">
                                    <input
                                      type="checkbox"
                                      checked={componente.isDefault !== false}
                                      onChange={(event) =>
                                        atualizarComponente(index, {
                                          isDefault: event.target.checked,
                                        })
                                      }
                                      className="rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                                    />
                                    Incluido por padrao
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

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
            )}

              {/* Botões de Ação */}
              <div className="mt-6 flex flex-col gap-3 border-t border-[#DEE8EC] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-[#607B89]">
                  Etapa {activeStep} de {totalSteps}
                </p>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className={secondaryButtonClass}
                  >
                    {t('common.cancel')}
                  </button>

                  {!isFirstStep && (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      disabled={isSubmitting || loading}
                      className={secondaryButtonClass}
                    >
                      Voltar
                    </button>
                  )}

                  {!isLastStep && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleNextStep();
                      }}
                      disabled={isSubmitting || loading}
                      className={primaryButtonClass}
                    >
                      Próximo
                    </button>
                  )}

                  {isLastStep && (
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
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
