import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import { toastService } from '../services/toastService';
import { useAuth } from '../hooks/useAuth';
import { userHasPermission } from '../config/menuConfig';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  X,
  UserPlus,
  Target,
  Mail,
  Phone,
  Briefcase,
  ArrowRight,
  Upload,
  FileText,
  AlertCircle,
  User,
  Building2,
  Loader2,
  Save,
  DollarSign,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';
import { FiltersBar, PageHeader, SectionCard } from '../components/layout-v2';
import leadsService, {
  Lead,
  StatusLead,
  OrigemLead,
  LeadEstatisticas,
  CreateLeadDto,
  UpdateLeadDto,
  ImportLeadResult,
} from '../services/leadsService';
import usersService, { User as UsuarioResponsavel } from '../services/usersService';
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  getPhoneCountryByIso,
  isValidE164Phone,
  parsePhoneValue,
  sanitizePhoneDigits,
  toE164,
} from '../utils/phone';
import SearchSelect from '../components/common/SearchSelect';

type SearchSelectOptionValue = {
  id: string | number;
  label: string;
  subtitle?: string;
  extra?: string;
};
type LeadOriginOption = {
  value: OrigemLead;
  label: string;
  allowManualSelection: boolean;
};

const LEAD_ORIGIN_OPTIONS: LeadOriginOption[] = [
  { value: OrigemLead.MANUAL, label: 'Manual', allowManualSelection: true },
  { value: OrigemLead.FORMULARIO, label: 'Formulário', allowManualSelection: true },
  { value: OrigemLead.WHATSAPP, label: 'WhatsApp', allowManualSelection: true },
  { value: OrigemLead.INDICACAO, label: 'Indicação', allowManualSelection: true },
  { value: OrigemLead.OUTRO, label: 'Outro', allowManualSelection: true },
  { value: OrigemLead.IMPORTACAO, label: 'Importação', allowManualSelection: false },
  { value: OrigemLead.API, label: 'API', allowManualSelection: false },
];

const LEAD_ORIGIN_LABELS = LEAD_ORIGIN_OPTIONS.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {},
);

const getLeadOriginFormOptions = (
  currentOrigin?: OrigemLead | string | null,
): LeadOriginOption[] => {
  const baseOptions = LEAD_ORIGIN_OPTIONS.filter((option) => option.allowManualSelection);
  const normalizedOrigin = String(currentOrigin || '').trim().toLowerCase();

  if (!normalizedOrigin) {
    return baseOptions;
  }

  const alreadyExists = baseOptions.some((option) => option.value === normalizedOrigin);
  if (alreadyExists) {
    return baseOptions;
  }

  const systemOption = LEAD_ORIGIN_OPTIONS.find((option) => option.value === normalizedOrigin);
  if (systemOption) {
    return [...baseOptions, systemOption];
  }

  return baseOptions;
};

// Schema de validação para o modal de Lead
const leadSchema = yup
  .object()
  .shape({
    nome: yup
      .string()
      .transform((value) => (typeof value === 'string' ? value.trim() : value))
      .required('Nome é obrigatório')
      .min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: yup
      .string()
      .transform((value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      })
      .email('Email inválido')
      .optional(),
    telefone: yup
      .string()
      .transform((value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      })
      .test(
        'telefone-formato',
        'Telefone internacional inválido para o país selecionado.',
        (value) => !value || isValidE164Phone(value),
      )
      .optional(),
    empresa_nome: yup
      .string()
      .transform((value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      })
      .optional(),
    origem: yup.string().required('Origem é obrigatória'),
    observacoes: yup
      .string()
      .transform((value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      })
      .optional(),
  })
  .test(
    'contato-obrigatorio',
    'Informe pelo menos um contato: e-mail ou telefone.',
    function validateContato(value) {
      if (value?.email?.trim() || value?.telefone?.trim()) {
        return true;
      }

      return this.createError({
        path: 'telefone',
        message: 'Informe pelo menos um contato: e-mail ou telefone.',
      });
    },
  );
// Schema de validação para conversão
const convertSchema = yup.object().shape({
  titulo_oportunidade: yup
    .string()
    .required('Título da oportunidade é obrigatório')
    .min(5, 'Título deve ter pelo menos 5 caracteres'),
  valor_estimado: yup
    .number()
    .optional()
    .transform((value, originalValue) => {
      return originalValue === '' ? undefined : value;
    })
    .positive('Valor deve ser positivo'),
  data_fechamento_prevista: yup.string().optional(),
  observacoes: yup.string().optional(),
});

const LEADS_SAVED_VIEWS_STORAGE_KEY = 'conectcrm_leads_saved_views_v1';
const LEAD_UNASSIGNED_OPTION_VALUE = '__sem_responsavel__';
const LEAD_UNASSIGNED_OPTION_LABEL = 'Sem responsável';
const CLIENTE_OU_CONTATO_RULE_MESSAGE =
  'Informe um cliente (cliente_id) ou pelo menos o nome do contato (nomeContato).';

interface LeadsSavedView {
  id: string;
  nome: string;
  busca: string;
  status: string;
  origem: string;
  responsavelCriacao: string;
  dataInicio: string;
  dataFim: string;
  itensPorPagina: number;
}

const readLeadsSavedViews = (): LeadsSavedView[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEADS_SAVED_VIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (view) =>
          typeof view?.id === 'string' &&
          typeof view?.nome === 'string' &&
          typeof view?.busca === 'string' &&
          typeof view?.status === 'string' &&
          typeof view?.origem === 'string' &&
          typeof view?.dataInicio === 'string' &&
          typeof view?.dataFim === 'string' &&
          typeof view?.itensPorPagina === 'number',
      )
      .map((view) => ({
        id: view.id,
        nome: view.nome,
        busca: view.busca,
        status: view.status,
        origem: view.origem,
        responsavelCriacao:
          typeof view?.responsavelCriacao === 'string' ? view.responsavelCriacao : 'todos',
        dataInicio: view.dataInicio,
        dataFim: view.dataFim,
        itensPorPagina: view.itensPorPagina,
      }));
  } catch {
    return [];
  }
};

const LeadsPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateLead = userHasPermission(user, 'crm.leads.create');
  const canUpdateLead = userHasPermission(user, 'crm.leads.update');
  const canDeleteLead = userHasPermission(user, 'crm.leads.delete');
  const canManageLeadLifecycle = canUpdateLead;
  const canAssignLead = canUpdateLead;
  const canConvertLead = canUpdateLead && userHasPermission(user, 'crm.oportunidades.create');
  const hasBulkLeadActions = canAssignLead || canManageLeadLifecycle;
  const hasDetailActionPermissions =
    canManageLeadLifecycle || canConvertLead || canUpdateLead || canDeleteLead;

  const notifyPermissionDenied = (actionLabel: string) => {
    toastService.error(`Você não tem permissão para ${actionLabel}.`);
  };

  const normalizeClienteOuContatoRuleMessage = (message?: string): string | undefined => {
    if (!message) return undefined;
    const normalized = message.toLowerCase();
    const mentionsCliente = normalized.includes('cliente_id') || normalized.includes('cliente');
    const mentionsContato =
      normalized.includes('nomecontato') ||
      normalized.includes('nome contato') ||
      normalized.includes('nome do contato');

    if (mentionsCliente && mentionsContato) {
      return CLIENTE_OU_CONTATO_RULE_MESSAGE;
    }

    return undefined;
  };
  // Estados principais
  const [leads, setLeads] = useState<Lead[]>([]);
  const [estatisticas, setEstatisticas] = useState<LeadEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('operacionais');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('todas');
  const [filtroResponsavelCriacao, setFiltroResponsavelCriacao] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(12);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [responsaveis, setResponsaveis] = useState<UsuarioResponsavel[]>([]);
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false);
  const [processingLeadId, setProcessingLeadId] = useState<string | null>(null);
  const [atribuindoLeadId, setAtribuindoLeadId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkResponsavelId, setBulkResponsavelId] = useState('');
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<LeadsSavedView[]>(() => readLeadsSavedViews());
  const [activeViewId, setActiveViewId] = useState('');
  const [viewNameInput, setViewNameInput] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<'compacto' | 'detalhado'>('compacto');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showInteracaoDialog, setShowInteracaoDialog] = useState(false);
  const [leadParaInteracao, setLeadParaInteracao] = useState<Lead | null>(null);
  const [interacaoObservacao, setInteracaoObservacao] = useState('');
  const [leadDetalhesAberto, setLeadDetalhesAberto] = useState<Lead | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportLeadResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const previousBuscaDebouncedRef = useRef('');
  const [leadPhoneCountryIso, setLeadPhoneCountryIso] = useState(DEFAULT_PHONE_COUNTRY_ISO);
  const [leadPhoneNationalNumber, setLeadPhoneNationalNumber] = useState('');

  // React Hook Form para modal de Lead
  const {
    register,
    handleSubmit: handleLeadSubmit,
    formState: { errors: leadErrors, isValid: isLeadValid },
    reset: resetLeadForm,
    setValue: setLeadValue,
    watch: watchLeadForm,
  } = useForm<CreateLeadDto>({
    resolver: yupResolver(leadSchema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      empresa_nome: '',
      origem: OrigemLead.MANUAL,
      observacoes: '',
    },
  });

  const watchedLeadEmail = watchLeadForm('email') || '';
  const watchedLeadTelefone = watchLeadForm('telefone') || '';

  const selectedLeadPhoneCountry = useMemo(
    () => getPhoneCountryByIso(leadPhoneCountryIso),
    [leadPhoneCountryIso],
  );

  const leadOriginFormOptions = useMemo(
    () => getLeadOriginFormOptions(editingLead?.origem),
    [editingLead?.origem],
  );

  const responsavelCriacaoOptions = useMemo<SearchSelectOptionValue[]>(
    () => [
      {
        id: LEAD_UNASSIGNED_OPTION_VALUE,
        label: LEAD_UNASSIGNED_OPTION_LABEL,
        subtitle: 'Leads sem responsável atribuído',
        extra: LEAD_UNASSIGNED_OPTION_VALUE,
      },
      ...responsaveis
        .filter((responsavel) => Boolean(responsavel?.id))
        .map((responsavel) => {
          const nome = (responsavel.nome || responsavel.username || responsavel.email || '').trim();
          const email = (responsavel.email || '').trim();
          const username = (responsavel.username || '').trim();

          return {
            id: responsavel.id,
            label: nome || email || username || String(responsavel.id),
            subtitle:
              username && email
                ? `${username} • ${email}`
                : username || email || undefined,
            extra: responsavel.id,
          };
        }),
    ],
    [responsaveis],
  );

  const responsavelCriacaoSelecionado = useMemo<SearchSelectOptionValue | null>(() => {
    if (filtroResponsavelCriacao === 'todos') {
      return null;
    }

    return (
      responsavelCriacaoOptions.find(
        (option) => String(option.id) === String(filtroResponsavelCriacao),
      ) || null
    );
  }, [filtroResponsavelCriacao, responsavelCriacaoOptions]);

  // React Hook Form para modal de Conversão
  const {
    register: registerConvert,
    control: controlConvert,
    handleSubmit: handleConvertSubmit,
    formState: { errors: convertErrors, isValid: isConvertValid },
    reset: resetConvertForm,
  } = useForm({
    resolver: yupResolver(convertSchema),
    mode: 'onChange',
    defaultValues: {
      titulo_oportunidade: '',
      valor_estimado: '',
      data_fechamento_prevista: '',
      observacoes: '',
    },
  });


  const carregarResponsaveis = async () => {
    try {
      setLoadingResponsaveis(true);
      const usuarios = await usersService.listarAtivos();
      setResponsaveis((usuarios || []).filter((usuario) => Boolean(usuario?.id)));
    } catch (err) {
      console.error('Erro ao carregar responsáveis:', err);
      setResponsaveis([]);
    } finally {
      setLoadingResponsaveis(false);
    }
  };

  const carregarDados = async () => {
    const usarCarregamentoSuave = hasLoadedOnceRef.current;
    try {
      if (usarCarregamentoSuave) {
        setIsFiltering(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filtros: any = {
        page: paginaAtual,
        limit: itensPorPagina,
      };


      if (filtroStatus !== 'todos') {
        filtros.status = filtroStatus;
      }

      if (filtroOrigem !== 'todas') {
        filtros.origem = filtroOrigem;
      }

      if (filtroResponsavelCriacao !== 'todos') {
        filtros.responsavel_id = filtroResponsavelCriacao;
      }

      if (filtroDataInicio) {
        filtros.dataInicio = `${filtroDataInicio}T00:00:00.000Z`;
      }

      if (filtroDataFim) {
        filtros.dataFim = `${filtroDataFim}T23:59:59.999Z`;
      }

      if (buscaDebounced) {
        filtros.busca = buscaDebounced;
      }

      // Carregar leads e estatísticas em paralelo
      const [leadsData, statsData] = await Promise.all([
        leadsService.listar(filtros),
        leadsService.getEstatisticas(),
      ]);

      setLeads(leadsData.data || []);
      setTotalRegistros(leadsData.total || 0);
      setTotalPaginas(leadsData.totalPages || 1);
      setEstatisticas(statsData);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar leads');
      setLeads([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
    } finally {
      if (usarCarregamentoSuave) {
        setIsFiltering(false);
      } else {
        setLoading(false);
      }
      hasLoadedOnceRef.current = true;
    }
  };

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBuscaDebounced(busca.trim());
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [busca]);

  useEffect(() => {
    const buscaMudou = previousBuscaDebouncedRef.current !== buscaDebounced;
    previousBuscaDebouncedRef.current = buscaDebounced;

    if (buscaMudou && paginaAtual !== 1) {
      setPaginaAtual(1);
      return;
    }

    carregarDados();
  }, [
    paginaAtual,
    itensPorPagina,
    buscaDebounced,
    filtroStatus,
    filtroOrigem,
    filtroResponsavelCriacao,
    filtroDataInicio,
    filtroDataFim,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(LEADS_SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    setSelectedLeadIds((prev) => prev.filter((leadId) => leads.some((lead) => lead.id === leadId)));
  }, [leads]);

  useEffect(() => {
    if (!leadDetalhesAberto) return;

    const leadAtualizado = leads.find((lead) => lead.id === leadDetalhesAberto.id);
    if (!leadAtualizado) {
      setLeadDetalhesAberto(null);
      return;
    }

    if (leadAtualizado !== leadDetalhesAberto) {
      setLeadDetalhesAberto(leadAtualizado);
    }
  }, [leads, leadDetalhesAberto]);

  const handleOpenDialog = (lead?: Lead) => {
    if (lead && !canUpdateLead) {
      notifyPermissionDenied('editar leads');
      return;
    }

    if (!lead && !canCreateLead) {
      notifyPermissionDenied('criar leads');
      return;
    }

    if (lead) {
      setEditingLead(lead);
      const safeOrigin =
        lead.origem && Object.values(OrigemLead).includes(lead.origem as OrigemLead)
          ? (lead.origem as OrigemLead)
          : OrigemLead.MANUAL;
      const parsedPhone = parsePhoneValue(lead.telefone ?? '');
      setLeadPhoneCountryIso(parsedPhone.country.iso2);
      setLeadPhoneNationalNumber(parsedPhone.nationalNumber);
      resetLeadForm({
        nome: lead.nome ?? '',
        email: lead.email ?? '',
        telefone: toE164(parsedPhone.country, parsedPhone.nationalNumber),
        empresa_nome: lead.empresa_nome ?? '',
        origem: safeOrigin,
        observacoes: lead.observacoes ?? '',
      });
    } else {
      setEditingLead(null);
      setLeadPhoneCountryIso(DEFAULT_PHONE_COUNTRY_ISO);
      setLeadPhoneNationalNumber('');
      resetLeadForm({
        nome: '',
        email: '',
        telefone: '',
        empresa_nome: '',
        origem: OrigemLead.MANUAL,
        observacoes: '',
      });
    }
    setShowDialog(true);
  };

  const onSubmitLead = async (data: CreateLeadDto) => {
    if (editingLead && !canUpdateLead) {
      notifyPermissionDenied('editar leads');
      return;
    }

    if (!editingLead && !canCreateLead) {
      notifyPermissionDenied('criar leads');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingLead) {
        await leadsService.atualizar(editingLead.id, data);
        toastService.success('Lead atualizado com sucesso!');
      } else {
        await leadsService.criar(data);
        toastService.success('Lead criado com sucesso!');
      }

      setShowDialog(false);
      setEditingLead(null);
      setLeadPhoneCountryIso(DEFAULT_PHONE_COUNTRY_ISO);
      setLeadPhoneNationalNumber('');
      resetLeadForm();
      await carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao salvar lead';
      setError(errorMsg);
      toastService.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingLead(null);
    setLeadPhoneCountryIso(DEFAULT_PHONE_COUNTRY_ISO);
    setLeadPhoneNationalNumber('');
    resetLeadForm();
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteLead) {
      notifyPermissionDenied('excluir leads');
      return;
    }

    if (!(await confirm('Tem certeza que deseja excluir este lead?'))) {
      return;
    }

    try {
      setError(null);
      await leadsService.deletar(id);
      if (leadDetalhesAberto?.id === id) {
        setLeadDetalhesAberto(null);
      }
      await carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar lead');
    }
  };

  const handleQualificar = async (id: string) => {
    if (!canManageLeadLifecycle) {
      notifyPermissionDenied('qualificar leads');
      return;
    }

    try {
      setProcessingLeadId(id);
      setError(null);
      await leadsService.qualificar(id, 'Lead qualificado manualmente');
      await carregarDados();
      toastService.success('Lead qualificado com sucesso!');
    } catch (err: unknown) {
      console.error('Erro ao qualificar:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao qualificar lead';
      setError(errorMsg);
      toastService.error(errorMsg);
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleRegistrarContato = async (id: string, observacoes?: string): Promise<boolean> => {
    if (!canManageLeadLifecycle) {
      notifyPermissionDenied('registrar interação em leads');
      return false;
    }

    try {
      setProcessingLeadId(id);
      setError(null);
      const observacaoFinal = observacoes?.trim() || 'Contato registrado manualmente';
      await leadsService.registrarPrimeiroContato(id, observacaoFinal);
      await carregarDados();
      toastService.success('Contato registrado com sucesso!');
      return true;
    } catch (err: unknown) {
      console.error('Erro ao registrar contato:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao registrar contato';
      setError(errorMsg);
      toastService.error(errorMsg);
      return false;
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleDesqualificar = async (id: string) => {
    if (!canManageLeadLifecycle) {
      notifyPermissionDenied('desqualificar leads');
      return;
    }

    if (!(await confirm('Tem certeza que deseja desqualificar este lead?'))) {
      return;
    }

    try {
      setProcessingLeadId(id);
      setError(null);
      await leadsService.desqualificar(id, 'Lead desqualificado manualmente');
      await carregarDados();
      toastService.success('Lead desqualificado com sucesso!');
    } catch (err: unknown) {
      console.error('Erro ao desqualificar:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao desqualificar lead';
      setError(errorMsg);
      toastService.error(errorMsg);
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleAtribuirResponsavel = async (lead: Lead, responsavelId: string | null) => {
    if (!canAssignLead) {
      notifyPermissionDenied('atribuir responsável aos leads');
      return;
    }

    const normalizeResponsavelId = (value?: string | null): string | null => {
      if (typeof value !== 'string') return null;
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    };

    const novoResponsavelId = responsavelId?.trim() || null;
    const responsavelAtualId = lead.responsavel_id?.trim() || null;

    if (novoResponsavelId === responsavelAtualId) {
      return;
    }

    try {
      setAtribuindoLeadId(lead.id);
      setError(null);
      const leadAtualizado = await leadsService.atribuirResponsavel(lead.id, novoResponsavelId);
      const responsavelRetornadoId = normalizeResponsavelId(
        leadAtualizado?.responsavel_id || leadAtualizado?.responsavel?.id || null,
      );

      if (responsavelRetornadoId !== novoResponsavelId) {
        console.warn('[LeadsPage] divergencia na atribuicao de responsavel', {
          leadId: lead.id,
          esperado: novoResponsavelId,
          retornado: responsavelRetornadoId,
        });
        throw new Error(
          'A atualização não foi confirmada pelo servidor. Recarregue a tela e tente novamente.',
        );
      }

      await carregarDados();
      toastService.success(
        novoResponsavelId ? 'Responsável atualizado com sucesso!' : 'Responsável removido com sucesso!',
      );
    } catch (err: unknown) {
      console.error('Erro ao atribuir responsável:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao atribuir responsável';
      setError(errorMsg);
      toastService.error(errorMsg);
    } finally {
      setAtribuindoLeadId(null);
    }
  };

  const handleOpenInteracaoDialog = (lead: Lead) => {
    if (!canManageLeadLifecycle) {
      notifyPermissionDenied('registrar interação em leads');
      return;
    }

    setLeadParaInteracao(lead);
    setInteracaoObservacao('');
    setShowInteracaoDialog(true);
  };

  const handleOpenLeadDetalhes = (lead: Lead) => {
    setLeadDetalhesAberto(lead);
  };

  const handleCloseLeadDetalhes = () => {
    setLeadDetalhesAberto(null);
  };

  const handleCloseInteracaoDialog = () => {
    if (leadParaInteracao?.id && processingLeadId === leadParaInteracao.id) {
      return;
    }

    setShowInteracaoDialog(false);
    setLeadParaInteracao(null);
    setInteracaoObservacao('');
  };

  const handleConfirmarInteracao = async () => {
    if (!leadParaInteracao?.id) {
      return;
    }

    const sucesso = await handleRegistrarContato(leadParaInteracao.id, interacaoObservacao);
    if (!sucesso) {
      return;
    }

    setShowInteracaoDialog(false);
    setLeadParaInteracao(null);
    setInteracaoObservacao('');
  };

  const handleOpenConvertDialog = (lead: Lead) => {
    if (!canConvertLead) {
      notifyPermissionDenied('converter lead em oportunidade');
      return;
    }

    setLeadToConvert(lead);
    resetConvertForm({
      titulo_oportunidade: `Oportunidade - ${lead.nome}`,
      valor_estimado: '',
      data_fechamento_prevista: '',
      observacoes: lead.observacoes || '',
    });
    setShowConvertDialog(true);
  };

  const getLeadOportunidadeId = (lead?: Lead | null): string | null => {
    if (!lead) return null;
    const oportunidadeId = lead.oportunidade_id || lead.convertido_oportunidade_id;
    if (!oportunidadeId || typeof oportunidadeId !== 'string') return null;
    const normalized = oportunidadeId.trim();
    return normalized.length > 0 ? normalized : null;
  };

  const abrirLeadNoPipeline = (lead?: Lead | null) => {
    const oportunidadeId = getLeadOportunidadeId(lead);
    if (oportunidadeId) {
      navigate(`/crm/pipeline/oportunidades/${encodeURIComponent(oportunidadeId)}`);
      return;
    }

    navigate('/crm/pipeline');
  };

  const onSubmitConvert = async (data: any) => {
    if (!canConvertLead) {
      notifyPermissionDenied('converter lead em oportunidade');
      return;
    }

    if (!leadToConvert) return;

    const leadNomeContato = String(leadToConvert.nome || '').trim();
    if (!leadNomeContato) {
      setError(CLIENTE_OU_CONTATO_RULE_MESSAGE);
      toastService.error(CLIENTE_OU_CONTATO_RULE_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const convertData: any = {
        titulo_oportunidade: data.titulo_oportunidade,
        titulo: data.titulo_oportunidade,
      };

      if (data.valor_estimado) {
        const valor = parseFloat(data.valor_estimado);
        convertData.valor_estimado = valor;
        convertData.valor = valor;
      }

      if (data.data_fechamento_prevista) {
        convertData.data_fechamento_prevista = data.data_fechamento_prevista;
        convertData.dataFechamentoEsperado = data.data_fechamento_prevista;
      }

      if (data.observacoes) {
        convertData.observacoes = data.observacoes;
        convertData.descricao = data.observacoes;
      }

      const oportunidade = await leadsService.converter(leadToConvert.id, convertData);
      const oportunidadeIdRaw = String((oportunidade as any)?.id || '').trim();

      toastService.success('Lead convertido em oportunidade com sucesso!');
      setShowConvertDialog(false);
      setLeadToConvert(null);
      resetConvertForm();

      if (oportunidadeIdRaw) {
        navigate(`/crm/pipeline/oportunidades/${encodeURIComponent(oportunidadeIdRaw)}`);
        return;
      }

      navigate('/crm/pipeline');
    } catch (err: unknown) {
      console.error('Erro ao converter lead:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const rawErrorMessage = normalizedMessage || fallbackMessage;
      const normalizedRuleMessage = normalizeClienteOuContatoRuleMessage(rawErrorMessage);
      const errorMsg = normalizedRuleMessage || rawErrorMessage || 'Erro ao converter lead';
      setError(errorMsg);
      toastService.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConvertDialog = () => {
    setShowConvertDialog(false);
    setLeadToConvert(null);
    resetConvertForm();
  };

  // Handlers de import CSV
  const handleOpenImportDialog = () => {
    if (!canCreateLead) {
      notifyPermissionDenied('importar leads');
      return;
    }

    setShowImportDialog(true);
    setImportFile(null);
    setImportResult(null);
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    setImportFile(null);
    setImportResult(null);
    setImporting(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.name.endsWith('.csv')) {
        setError('Por favor, selecione um arquivo CSV');
        setImportFile(null);
        return;
      }

      const tamanhoMaximoBytes = 10 * 1024 * 1024;
      if (file.size > tamanhoMaximoBytes) {
        setError('Arquivo CSV deve ter no máximo 10MB');
        setImportFile(null);
        return;
      }

      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!canCreateLead) {
      notifyPermissionDenied('importar leads');
      return;
    }

    if (!importFile) {
      setError('Selecione um arquivo CSV');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const result = await leadsService.importarCSV(importFile);
      setImportResult(result);

      // Recarregar leads se houver importações bem-sucedidas
      if (result.importados > 0) {
        await carregarDados();
      }
    } catch (err: unknown) {
      console.error('Erro ao importar CSV:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao importar leads');
    } finally {
      setImporting(false);
    }
  };

  const leadsFiltrados = leads;

  // Labels de status
  const getStatusLabel = (status: StatusLead) => {
    const labels: Record<StatusLead, string> = {
      [StatusLead.NOVO]: 'Novo',
      [StatusLead.CONTATADO]: 'Contatado',
      [StatusLead.QUALIFICADO]: 'Qualificado',
      [StatusLead.DESQUALIFICADO]: 'Desqualificado',
      [StatusLead.CONVERTIDO]: 'Convertido',
    };
    return labels[status] || status;
  };

  // Labels de origem
  const getOrigemLabel = (origem?: OrigemLead | string | null) => {
    if (!origem) {
      return 'Origem não informada';
    }

    const normalized = String(origem).trim().toLowerCase();
    return LEAD_ORIGIN_LABELS[normalized] || origem;
  };

  // Cores de status
  const getStatusColor = (status: StatusLead) => {
    const colors: Record<StatusLead, string> = {
      [StatusLead.NOVO]: 'bg-blue-100 text-blue-800',
      [StatusLead.CONTATADO]: 'bg-yellow-100 text-yellow-800',
      [StatusLead.QUALIFICADO]: 'bg-green-100 text-green-800',
      [StatusLead.DESQUALIFICADO]: 'bg-red-100 text-red-800',
      [StatusLead.CONVERTIDO]: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Sem registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sem registro';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getResponsavelLabel = (lead: Lead) =>
    lead.responsavel?.nome || lead.responsavel?.username || 'Sem responsável';

  const getNextActionLabel = (lead: Lead) => {
    switch (lead.status) {
      case StatusLead.NOVO:
        return 'Qualificar lead';
      case StatusLead.CONTATADO:
        return 'Registrar qualificação';
      case StatusLead.QUALIFICADO:
        return 'Converter em oportunidade';
      case StatusLead.DESQUALIFICADO:
        return 'Revisar oportunidade futura';
      case StatusLead.CONVERTIDO:
        return 'Acompanhar no pipeline';
      default:
        return 'Acompanhar lead';
    }
  };

  const getObservacaoResumo = (lead: Lead) => {
    if (!lead.observacoes) return null;
    const normalized = lead.observacoes.replace(/\s+/g, ' ').trim();
    if (!normalized) return null;
    return normalized.length > 88 ? `${normalized.slice(0, 88)}...` : normalized;
  };

  const getUltimaInteracaoLabel = (lead: Lead) =>
    lead.data_ultima_interacao
      ? formatDateTime(lead.data_ultima_interacao)
      : 'Sem interação registrada';

  const totalLeadsAbertos = Math.max(
    (estatisticas?.total || 0) - (estatisticas?.convertidos || 0),
    0,
  );
  const leadsNovos = estatisticas?.novos || 0;
  const leadsProntosParaConversao = estatisticas?.qualificados || 0;
  const leadsSemResponsavel = estatisticas?.semResponsavel || 0;
  const leadsSemContato = estatisticas?.semContato || 0;
  const taxaConversao = estatisticas?.taxaConversao || 0;
  const scoreMedio = estatisticas?.scoreMedio || 0;

  const pageDescription = loading
    ? 'Carregando...'
    : 'Acompanhe o funil de pré-venda, trate gargalos e acelere a passagem para oportunidades';
  const hasFilters =
    Boolean(busca.trim()) ||
    filtroStatus !== 'operacionais' ||
    filtroOrigem !== 'todas' ||
    filtroResponsavelCriacao !== 'todos' ||
    Boolean(filtroDataInicio) ||
    Boolean(filtroDataFim);
  const hasAdvancedFilters =
    filtroOrigem !== 'todas' ||
    filtroResponsavelCriacao !== 'todos' ||
    Boolean(filtroDataInicio) ||
    Boolean(filtroDataFim) ||
    itensPorPagina !== 12 ||
    Boolean(activeViewId);
  const advancedFiltersCount = [
    filtroOrigem !== 'todas',
    filtroResponsavelCriacao !== 'todos',
    Boolean(filtroDataInicio),
    Boolean(filtroDataFim),
    itensPorPagina !== 12,
    Boolean(activeViewId),
  ].filter(Boolean).length;
  const isDetailedCardView = cardViewMode === 'detalhado';

  const handleClearFilters = () => {
    setBusca('');
    setFiltroStatus('operacionais');
    setFiltroOrigem('todas');
    setFiltroResponsavelCriacao('todos');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setItensPorPagina(12);
    setPaginaAtual(1);
    setSelectedLeadIds([]);
    setActiveViewId('');
    setViewNameInput('');
    setShowAdvancedFilters(false);
  };

  const handleResponsavelCriacaoSelectChange = (option: SearchSelectOptionValue | null) => {
    const nextValue = option ? String(option.id) : 'todos';
    if (nextValue === filtroResponsavelCriacao) {
      return;
    }

    setFiltroResponsavelCriacao(nextValue);
    setPaginaAtual(1);
  };

  const activeSavedView = savedViews.find((view) => view.id === activeViewId) || null;
  const totalRegistrosVisiveis = totalRegistros;
  const totalPaginasVisiveis = totalPaginas;
  const bulkSelectedCount = selectedLeadIds.length;
  const allVisibleSelected =
    leadsFiltrados.length > 0 && leadsFiltrados.every((lead) => selectedLeadIds.includes(lead.id));

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId],
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedLeadIds([]);
      return;
    }
    setSelectedLeadIds(leadsFiltrados.map((lead) => lead.id));
  };

  const executeBulkAction = async (
    actionId: string,
    actionLabel: string,
    callback: (leadId: string) => Promise<unknown>,
    targetLeadIds?: string[],
  ) => {
    const leadIds = targetLeadIds?.length ? targetLeadIds : selectedLeadIds;

    if (leadIds.length === 0) {
      toastService.error('Selecione pelo menos um lead.');
      return;
    }

    setBulkActionLoading(actionId);
    setError(null);

    try {
      const results = await Promise.allSettled(leadIds.map((leadId) => callback(leadId)));
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const errorCount = results.length - successCount;

      if (successCount > 0) {
        toastService.success(
          `${actionLabel}: ${successCount} ${successCount > 1 ? 'leads atualizados' : 'lead atualizado'}.`,
        );
      }

      if (errorCount > 0) {
        toastService.error(`${errorCount} ${errorCount > 1 ? 'falhas' : 'falha'} ao processar.`);
      }

      await carregarDados();
      setSelectedLeadIds([]);
      setBulkResponsavelId('');
    } catch (err: unknown) {
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao executar ação em lote';
      setError(errorMsg);
      toastService.error(errorMsg);
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleBulkQualificar = async () => {
    if (!canManageLeadLifecycle) {
      notifyPermissionDenied('qualificar leads');
      return;
    }

    const leadIdsElegiveis = leadsFiltrados
      .filter(
        (lead) =>
          selectedLeadIds.includes(lead.id) &&
          (lead.status === StatusLead.NOVO || lead.status === StatusLead.CONTATADO),
      )
      .map((lead) => lead.id);
    const ignorados = selectedLeadIds.length - leadIdsElegiveis.length;

    if (leadIdsElegiveis.length === 0) {
      toastService.error('Selecione ao menos um lead novo ou contatado para qualificar.');
      return;
    }

    if (ignorados > 0) {
      toastService.warning(
        `${ignorados} lead${ignorados > 1 ? 's foram ignorados' : ' foi ignorado'} por não estar em status elegível.`,
      );
    }

    await executeBulkAction(
      'qualificar',
      'Qualificação em lote',
      (leadId) => leadsService.qualificar(leadId, 'Lead qualificado em lote'),
      leadIdsElegiveis,
    );
  };

  const handleBulkDesqualificar = async () => {
    if (!canManageLeadLifecycle) {
      notifyPermissionDenied('desqualificar leads');
      return;
    }

    const leadIdsElegiveis = leadsFiltrados
      .filter(
        (lead) =>
          selectedLeadIds.includes(lead.id) &&
          lead.status !== StatusLead.DESQUALIFICADO &&
          lead.status !== StatusLead.CONVERTIDO,
      )
      .map((lead) => lead.id);
    const ignorados = selectedLeadIds.length - leadIdsElegiveis.length;

    if (leadIdsElegiveis.length === 0) {
      toastService.error('Selecione ao menos um lead elegível para desqualificar.');
      return;
    }

    if (ignorados > 0) {
      toastService.warning(
        `${ignorados} lead${ignorados > 1 ? 's foram ignorados' : ' foi ignorado'} por não estar em status elegível.`,
      );
    }

    if (!(await confirm('Deseja desqualificar os leads selecionados?'))) {
      return;
    }

    await executeBulkAction(
      'desqualificar',
      'Desqualificação em lote',
      (leadId) => leadsService.desqualificar(leadId, 'Lead desqualificado em lote'),
      leadIdsElegiveis,
    );
  };

  const handleBulkAtribuirResponsavel = async () => {
    if (!canAssignLead) {
      notifyPermissionDenied('atribuir responsável aos leads');
      return;
    }

    if (!bulkResponsavelId) {
      toastService.error('Selecione um responsável para aplicar em lote.');
      return;
    }

    await executeBulkAction('atribuir', 'Atribuição em lote', (leadId) =>
      leadsService.atribuirResponsavel(leadId, bulkResponsavelId),
    );
  };

  const applySavedView = (view: LeadsSavedView) => {
    setBusca(view.busca);
    setFiltroStatus(view.status || 'operacionais');
    setFiltroOrigem(view.origem || 'todas');
    setFiltroResponsavelCriacao(view.responsavelCriacao || 'todos');
    setFiltroDataInicio(view.dataInicio || '');
    setFiltroDataFim(view.dataFim || '');
    setItensPorPagina(view.itensPorPagina || 12);
    setPaginaAtual(1);
    setViewNameInput(view.nome);
    setShowAdvancedFilters(true);
  };

  const handleSavedViewChange = (viewId: string) => {
    setActiveViewId(viewId);

    if (!viewId) {
      setViewNameInput('');
      return;
    }

    const view = savedViews.find((item) => item.id === viewId);
    if (!view) {
      return;
    }

    applySavedView(view);
  };

  const handleSaveCurrentView = () => {
    const nome = viewNameInput.trim();
    if (!nome) {
      toastService.error('Informe um nome para salvar a view.');
      return;
    }

    const viewId = activeViewId || `leads-view-${Date.now()}`;
    const nextView: LeadsSavedView = {
      id: viewId,
      nome,
      busca: busca.trim(),
      status: filtroStatus,
      origem: filtroOrigem,
      responsavelCriacao: filtroResponsavelCriacao,
      dataInicio: filtroDataInicio,
      dataFim: filtroDataFim,
      itensPorPagina,
    };

    setSavedViews((prev) => [nextView, ...prev.filter((item) => item.id !== viewId)]);
    setActiveViewId(viewId);
    toastService.success(activeSavedView ? 'View atualizada.' : 'View salva.');
  };

  const handleDeleteSavedView = async () => {
    if (!activeSavedView) {
      toastService.error('Selecione uma view salva para excluir.');
      return;
    }

    if (!(await confirm(`Deseja remover a view "${activeSavedView.nome}"?`))) {
      return;
    }

    setSavedViews((prev) => prev.filter((view) => view.id !== activeSavedView.id));
    setActiveViewId('');
    setViewNameInput('');
    toastService.success('View removida.');
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-[18px] border-[#CBDAE2] bg-gradient-to-br from-white via-white to-[#F4FAFF] p-5 shadow-[0_24px_46px_-34px_rgba(16,57,74,0.38)]">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center rounded-full border border-[#BFD9E2] bg-[#EFF8FB] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3F6A7C]">
              Núcleo Comercial
            </span>
          }
          title={
            <span className="inline-flex items-center gap-2 text-[27px] font-bold leading-[1.03] tracking-[-0.018em] text-[#002333] sm:text-[28px]">
              <UserPlus className="h-6 w-6 text-[#159A9C]" />
              Leads
            </span>
          }
          titleClassName="leading-none sm:inline-flex sm:items-center"
          description={pageDescription}
          descriptionClassName="max-w-[74ch] text-[12px] leading-[1.4] text-[#5B7A89] sm:border-l sm:border-[#D7E5EC] sm:pl-3 sm:text-[13px]"
          inlineDescriptionOnDesktop
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={carregarDados}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:opacity-50"
                title="Atualizar leads"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {canCreateLead && (
                <button
                  onClick={handleOpenImportDialog}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#159A9C] bg-white px-3 text-sm font-medium text-[#159A9C] transition-colors hover:bg-[#F4FBF9]"
                >
                  <Upload className="h-4 w-4" />
                  Importar CSV
                </button>
              )}
              {canCreateLead && (
                <button
                  onClick={() => handleOpenDialog()}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
                >
                  <Plus className="h-4 w-4" />
                  Novo Lead
                </button>
              )}
            </div>
          }
        />

        <section className="space-y-3 rounded-2xl border border-[#D4E1E8] bg-white/95 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5F7B89]">
              Resumo essencial:
            </span>
            <span className="inline-flex items-center rounded-full border border-[#D7E6EC] bg-[#F5FAFC] px-2.5 py-1 text-xs font-semibold text-[#345362]">
              Base ativa: {loading ? '--' : totalLeadsAbertos}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#BEE6CF] bg-[#F1FBF5] px-2.5 py-1 text-xs font-semibold text-[#137A42]">
              Novos sem abordagem: {loading ? '--' : leadsNovos}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#BFE8E9] bg-[#EEFBFB] px-2.5 py-1 text-xs font-semibold text-[#0F7B7D]">
              Maduros para virar oportunidade: {loading ? '--' : leadsProntosParaConversao}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#F4C7CF] bg-[#FFF4F6] px-2.5 py-1 text-xs font-semibold text-[#B4233A]">
              Sem dono comercial: {loading ? '--' : leadsSemResponsavel}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#F5D7A7] bg-[#FFF7EA] px-2.5 py-1 text-xs font-semibold text-[#A86400]">
              Sem canal de contato: {loading ? '--' : leadsSemContato}
            </span>
          </div>

          <div className="rounded-xl border border-[#D7E6EC] bg-[#F9FCFE] px-3 py-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
              <span>Taxa de conversão da carteira</span>
              <span>{loading ? '--' : `${taxaConversao.toFixed(1)}%`}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DDEBF0]">
              <div
                className="h-full rounded-full bg-[#1E66B4] transition-all"
                style={{ width: `${Math.max(0, Math.min(100, taxaConversao))}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-[#5B7A89]">
              Qualificação média dos leads: {loading ? '--' : scoreMedio.toFixed(1)}
            </div>
          </div>
        </section>

        <FiltersBar className="space-y-4 rounded-2xl border border-[#D4E1E8] bg-gradient-to-br from-[#F7FBFD] to-[#F1F7FA] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end">
              <div className="w-full xl:min-w-[320px] xl:flex-1">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                  Buscar leads
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou empresa..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-9 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                  {isFiltering ? (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#9AAEB8]" />
                  ) : null}
                </div>
              </div>

              <div className="w-full xl:w-auto">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => {
                    setFiltroStatus(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 xl:w-[220px]"
                >
                  <option value="operacionais">Pré-venda (ativos)</option>
                  <option value="todos">Todos os status</option>
                  <option value={StatusLead.NOVO}>Novos</option>
                  <option value={StatusLead.CONTATADO}>Contatados</option>
                  <option value={StatusLead.QUALIFICADO}>Qualificados</option>
                  <option value={StatusLead.DESQUALIFICADO}>Desqualificados</option>
                  <option value={StatusLead.CONVERTIDO}>Convertidos</option>
                </select>
              </div>

              <div className="flex w-full flex-wrap items-end gap-2 xl:w-auto xl:justify-end">
                <div className="inline-flex h-10 overflow-hidden rounded-lg border border-[#B4BEC9] bg-white">
                  <button
                    type="button"
                    data-testid="leads-view-compact"
                    onClick={() => setCardViewMode('compacto')}
                    className={`px-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      cardViewMode === 'compacto'
                        ? 'bg-[#E9F6F3] text-[#0F7B7D]'
                        : 'text-[#5E7987] hover:bg-[#F6FAF9]'
                    }`}
                  >
                    Compacto
                  </button>
                  <button
                    type="button"
                    data-testid="leads-view-detailed"
                    onClick={() => setCardViewMode('detalhado')}
                    className={`px-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      cardViewMode === 'detalhado'
                        ? 'bg-[#E9F6F3] text-[#0F7B7D]'
                        : 'text-[#5E7987] hover:bg-[#F6FAF9]'
                    }`}
                  >
                    Detalhado
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="leads-advanced-filters-toggle"
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
                >
                  <Filter className="h-4 w-4" />
                  Filtros avancados
                  {hasAdvancedFilters ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E9F6F3] px-1.5 text-xs font-semibold text-[#0F7B7D]">
                      {advancedFiltersCount}
                    </span>
                  ) : null}
                  <ChevronDown
                    className={`h-4 w-4 text-[#5D7A88] transition-transform ${
                      showAdvancedFilters ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!hasFilters && !activeSavedView}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="w-full">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                      Origem
                    </label>
                    <select
                      value={filtroOrigem}
                      onChange={(e) => {
                        setFiltroOrigem(e.target.value);
                        setPaginaAtual(1);
                      }}
                      data-testid="leads-filter-origem"
                      className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                    >
                      <option value="todas">Todas as origens</option>
                      {LEAD_ORIGIN_OPTIONS.map((originOption) => (
                        <option key={originOption.value} value={originOption.value}>
                          {originOption.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                      Responsável da criação
                    </label>
                    <SearchSelect
                      options={responsavelCriacaoOptions}
                      value={responsavelCriacaoSelecionado}
                      onChange={handleResponsavelCriacaoSelectChange}
                      placeholder="Busque por nome, usuário ou email..."
                      disabled={loadingResponsaveis}
                      loading={loadingResponsaveis}
                      icon="user"
                      emptyMessage="Nenhum responsável encontrado"
                      inputTestId="leads-filter-responsavel-criacao"
                      className="w-full"
                      inputClassName="h-10 rounded-xl border-[#D4E2E7] bg-white text-sm text-[#244455] focus:border-[#1A9E87]/45 focus:ring-[#1A9E87]/15"
                      dropdownClassName="max-h-64 rounded-xl border-[#D4E2E7]"
                    />
                  </div>

                  <div className="w-full">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                      De
                    </label>
                    <input
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => {
                        setFiltroDataInicio(e.target.value);
                        setPaginaAtual(1);
                      }}
                      data-testid="leads-filter-data-inicio"
                      className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>

                  <div className="w-full">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                      Ate
                    </label>
                    <input
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => {
                        setFiltroDataFim(e.target.value);
                        setPaginaAtual(1);
                      }}
                      data-testid="leads-filter-data-fim"
                      className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>

                  <div className="w-full">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                      Itens por pagina
                    </label>
                    <select
                      value={itensPorPagina}
                      onChange={(e) => {
                        setItensPorPagina(Number(e.target.value));
                        setPaginaAtual(1);
                      }}
                      data-testid="leads-filter-limit"
                      className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                    >
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 border-t border-[#DFEAEE] pt-3">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                    Views salvas
                  </label>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <select
                        value={activeViewId}
                        onChange={(e) => handleSavedViewChange(e.target.value)}
                        data-testid="leads-saved-views-select"
                        className="h-9 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                      >
                        <option value="">Sem view salva</option>
                        {savedViews.map((view) => (
                          <option key={view.id} value={view.id}>
                            {view.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={viewNameInput}
                          onChange={(e) => setViewNameInput(e.target.value)}
                          placeholder="Ex.: Leads de marco"
                          data-testid="leads-saved-view-name"
                          className="h-9 min-w-[220px] flex-1 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCurrentView}
                          data-testid="leads-save-view-button"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#159A9C] px-3 text-sm font-medium text-[#159A9C] transition-colors hover:bg-[#F4FBF9]"
                        >
                          <Save className="h-4 w-4" />
                          {activeSavedView ? 'Atualizar' : 'Salvar'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSavedView}
                          disabled={!activeSavedView}
                          data-testid="leads-delete-view-button"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E8C8CB] px-3 text-sm font-medium text-[#B03A48] transition-colors hover:bg-[#FFF5F5] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {leadsFiltrados.length > 0 && hasBulkLeadActions && (
              <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[#244455]">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="h-4 w-4 rounded border-[#BFD2DB] text-[#159A9C] focus:ring-[#159A9C]/30"
                      />
                      Selecionar página
                    </label>
                    <span className="rounded-full bg-[#F2F8FA] px-3 py-1 text-xs font-medium text-[#4C6575]">
                      {bulkSelectedCount} selecionado(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canAssignLead && (
                      <>
                        <select
                          value={bulkResponsavelId}
                          onChange={(e) => setBulkResponsavelId(e.target.value)}
                          disabled={loadingResponsaveis || bulkActionLoading !== null}
                          className="h-9 min-w-[220px] rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">Atribuir responsável em lote</option>
                          {responsaveis.map((responsavel) => (
                            <option key={responsavel.id} value={responsavel.id}>
                              {responsavel.nome || responsavel.username}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleBulkAtribuirResponsavel}
                          disabled={
                            !bulkSelectedCount || !bulkResponsavelId || bulkActionLoading !== null
                          }
                          className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] px-3 text-xs font-medium text-[#244455] transition-colors hover:bg-[#F8FCFC] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {bulkActionLoading === 'atribuir' ? 'Aplicando...' : 'Aplicar responsável'}
                        </button>
                      </>
                    )}
                    {canManageLeadLifecycle && (
                      <button
                        type="button"
                        onClick={handleBulkQualificar}
                        disabled={!bulkSelectedCount || bulkActionLoading !== null}
                        className="inline-flex h-9 items-center rounded-lg bg-green-600 px-3 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {bulkActionLoading === 'qualificar' ? 'Processando...' : 'Qualificar em lote'}
                      </button>
                    )}
                    {canManageLeadLifecycle && (
                      <button
                        type="button"
                        onClick={handleBulkDesqualificar}
                        disabled={!bulkSelectedCount || bulkActionLoading !== null}
                        className="inline-flex h-9 items-center rounded-lg border border-[#F3CFD1] bg-[#FFF5F5] px-3 text-xs font-medium text-[#B03A48] transition-colors hover:bg-[#FFE9EA] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {bulkActionLoading === 'desqualificar'
                          ? 'Processando...'
                          : 'Desqualificar em lote'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </FiltersBar>
      </SectionCard>

      <div className="w-full space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Estado Vazio */}
        {!loading && leadsFiltrados.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="text-center py-12 px-6">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasFilters ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {hasFilters
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie seu primeiro lead para começar'}
              </p>
              {!hasFilters && canCreateLead && (
                <button
                  onClick={() => handleOpenDialog()}
                  className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Lead
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid de Cards */}
        <div
          className={`grid gap-3 ${
            isDetailedCardView
              ? 'grid-cols-[repeat(auto-fill,minmax(340px,1fr))]'
              : 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]'
          }`}
        >
          {leadsFiltrados.map((lead) => (
            <article
              key={lead.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenLeadDetalhes(lead)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleOpenLeadDetalhes(lead);
                }
              }}
              className={`group relative overflow-hidden border border-[#D4E2E7] bg-white shadow-[0_10px_28px_-24px_rgba(6,60,70,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-26px_rgba(6,60,70,0.6)] ${
                isDetailedCardView ? 'rounded-2xl' : 'rounded-xl'
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#159A9C] via-[#1FA77D] to-[#4F87A8]" />
              <div className={isDetailedCardView ? 'p-4' : 'p-3'}>
                <div className={`${isDetailedCardView ? 'mb-3 gap-3' : 'mb-2.5 gap-2'} flex items-start justify-between`}>
                  <div className={`${isDetailedCardView ? 'gap-3' : 'gap-2'} flex min-w-0 flex-1 items-start`}>
                    <div
                      className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-[#159A9C] text-white shadow-sm ${
                        isDetailedCardView ? 'h-10 w-10' : 'h-9 w-9'
                      }`}
                    >
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate font-semibold text-[#143548] ${
                          isDetailedCardView ? 'text-base' : 'text-[15px]'
                        }`}
                      >
                        {lead.nome}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                            lead.status,
                          )}`}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#EFF5F7] px-2.5 py-0.5 text-[11px] font-medium text-[#4C6575]">
                          {getOrigemLabel(lead.origem)}
                        </span>
                      </div>
                      {lead.email && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#5D7887]">
                          <Mail className="h-3.5 w-3.5 text-[#88A0AD]" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-1 flex flex-shrink-0 items-center gap-1">
                    <label className="inline-flex cursor-pointer items-center rounded-lg p-2 hover:bg-[#F4FBF9]">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 rounded border-[#BFD2DB] text-[#159A9C] focus:ring-[#159A9C]/30"
                      />
                    </label>
                    {canUpdateLead && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDialog(lead);
                        }}
                        className="rounded-lg p-2 transition-colors hover:bg-[#EEF3F6]"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-[#5D7887]" />
                      </button>
                    )}
                    {canDeleteLead && lead.status !== StatusLead.CONVERTIDO && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(lead.id);
                        }}
                        className="rounded-lg p-2 transition-colors hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#E3EDF1] bg-[#FAFCFD] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B8492]">
                      Responsável
                    </p>
                    <p
                      className={`mt-1 truncate text-xs font-medium ${
                        getResponsavelLabel(lead) === 'Sem responsável'
                          ? 'text-amber-700'
                          : 'text-[#28495A]'
                      }`}
                    >
                      {getResponsavelLabel(lead)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E3EDF1] bg-[#FAFCFD] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B8492]">
                      Score
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#234A5A]">{lead.score}</p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-[#E3EDF1] bg-[#FAFCFD] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B8492]">
                      Última interação
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#3F5E6E]">
                      {getUltimaInteracaoLabel(lead)}
                    </p>
                  </div>
                </div>

                {isDetailedCardView && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-[#E3EDF1] bg-white px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B8492]">
                          Telefone
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-[#28495A]">
                          {lead.telefone || 'Não informado'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#E3EDF1] bg-white px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B8492]">
                          Empresa
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-[#28495A]">
                          {lead.empresa_nome || 'Não informada'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B8492]">
                        Atribuição rápida
                      </label>
                      <select
                        value={lead.responsavel_id || LEAD_UNASSIGNED_OPTION_VALUE}
                        onChange={(event) =>
                          handleAtribuirResponsavel(
                            lead,
                            event.target.value === LEAD_UNASSIGNED_OPTION_VALUE
                              ? null
                              : event.target.value,
                          )
                        }
                        onClick={(event) => event.stopPropagation()}
                        disabled={
                          !canAssignLead ||
                          loadingResponsaveis ||
                          atribuindoLeadId === lead.id
                        }
                        data-testid={`lead-card-responsavel-${lead.id}`}
                        className="h-9 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-xs text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value={LEAD_UNASSIGNED_OPTION_VALUE}>Sem responsável</option>
                        {lead.responsavel_id &&
                          !responsaveis.some(
                            (responsavel) => responsavel.id === lead.responsavel_id,
                          ) && (
                            <option value={lead.responsavel_id}>{getResponsavelLabel(lead)}</option>
                          )}
                        {responsaveis.map((responsavel) => (
                          <option key={responsavel.id} value={responsavel.id}>
                            {responsavel.nome || responsavel.username}
                          </option>
                        ))}
                      </select>
                    </div>

                    {getObservacaoResumo(lead) && (
                      <div className="rounded-lg border border-[#EAF1F4] bg-[#FAFCFD] px-3 py-2 text-xs text-[#4C6575]">
                        {getObservacaoResumo(lead)}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E8EFF3] pt-3">
                  <span className="text-xs font-medium text-[#597887]">{getNextActionLabel(lead)}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenLeadDetalhes(lead);
                    }}
                    className="inline-flex items-center rounded-lg border border-[#BCD0D9] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#2A566A] transition-colors hover:bg-[#F1F7FA]"
                  >
                    Ver detalhes
                  </button>
                </div>

                <div className="mt-3">
                  {canManageLeadLifecycle &&
                    (lead.status === StatusLead.NOVO || lead.status === StatusLead.CONTATADO) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleQualificar(lead.id);
                      }}
                      disabled={processingLeadId === lead.id}
                      className="w-full rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processingLeadId === lead.id ? 'Processando...' : 'Qualificar lead'}
                    </button>
                  )}

                  {canConvertLead && lead.status === StatusLead.QUALIFICADO && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenConvertDialog(lead);
                      }}
                      className="w-full rounded-lg bg-[#159A9C] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
                    >
                      Converter em oportunidade
                    </button>
                  )}

                  {lead.status === StatusLead.CONVERTIDO && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        abrirLeadNoPipeline(lead);
                      }}
                      className="w-full rounded-lg border border-[#159A9C] px-3 py-2 text-xs font-semibold text-[#0F7B7D] transition-colors hover:bg-[#F4FBF9]"
                    >
                      Abrir no pipeline
                    </button>
                  )}

                  {canUpdateLead && lead.status === StatusLead.DESQUALIFICADO && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenDialog(lead);
                      }}
                      className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-xs font-semibold text-[#244455] transition-colors hover:bg-[#F8FCFC]"
                    >
                      Revisar lead
                    </button>
                  )}

                  {isDetailedCardView && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {canManageLeadLifecycle &&
                        (lead.status === StatusLead.NOVO ||
                          lead.status === StatusLead.CONTATADO) && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenInteracaoDialog(lead);
                          }}
                          disabled={processingLeadId === lead.id}
                          data-testid={`lead-card-registrar-interacao-${lead.id}`}
                          className="rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-xs font-medium text-[#244455] transition-colors hover:bg-[#F8FCFC] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Registrar interação
                        </button>
                        )}

                      {canManageLeadLifecycle &&
                        lead.status !== StatusLead.DESQUALIFICADO &&
                        lead.status !== StatusLead.CONVERTIDO && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDesqualificar(lead.id);
                            }}
                            disabled={processingLeadId === lead.id}
                            className="rounded-lg border border-[#F3CFD1] bg-[#FFF5F5] px-3 py-2 text-xs font-medium text-[#B03A48] transition-colors hover:bg-[#FFE9EA] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Desqualificar
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {leadDetalhesAberto && (
          <div className="fixed inset-0 z-50 flex">
            <button
              type="button"
              aria-label="Fechar detalhes"
              className="h-full flex-1 bg-black/35"
              onClick={handleCloseLeadDetalhes}
            />
            <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-[#CFE0E7] bg-white shadow-2xl">
              <div className="sticky top-0 z-10 border-b border-[#DCE8EC] bg-white/95 px-5 py-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8492]">
                      Detalhes do lead
                    </p>
                    <h3 className="truncate text-xl font-bold text-[#123245]">
                      {leadDetalhesAberto.nome}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          leadDetalhesAberto.status,
                        )}`}
                      >
                        {getStatusLabel(leadDetalhesAberto.status)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[#EFF5F7] px-2.5 py-0.5 text-[11px] font-medium text-[#4C6575]">
                        {getOrigemLabel(leadDetalhesAberto.origem)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseLeadDetalhes}
                    className="rounded-lg p-2 text-[#516F7D] transition-colors hover:bg-[#EEF4F7]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="rounded-xl border border-[#DCE8EC] bg-[#FAFCFD] p-4">
                  <h4 className="mb-3 text-sm font-semibold text-[#1A3E52]">Contato</h4>
                  <div className="space-y-2 text-sm text-[#3E5D6D]">
                    {leadDetalhesAberto.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#7A94A2]" />
                        <span>{leadDetalhesAberto.email}</span>
                      </div>
                    ) : null}
                    {leadDetalhesAberto.telefone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#7A94A2]" />
                        <span>{leadDetalhesAberto.telefone}</span>
                      </div>
                    ) : null}
                    {leadDetalhesAberto.empresa_nome ? (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#7A94A2]" />
                        <span>{leadDetalhesAberto.empresa_nome}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-[#DCE8EC] p-4">
                  <h4 className="mb-3 text-sm font-semibold text-[#1A3E52]">Responsável</h4>
                  <select
                    value={leadDetalhesAberto.responsavel_id || LEAD_UNASSIGNED_OPTION_VALUE}
                    onChange={(event) =>
                      handleAtribuirResponsavel(
                        leadDetalhesAberto,
                        event.target.value === LEAD_UNASSIGNED_OPTION_VALUE
                          ? null
                          : event.target.value,
                      )
                    }
                    disabled={
                      !canAssignLead ||
                      loadingResponsaveis ||
                      atribuindoLeadId === leadDetalhesAberto.id
                    }
                    data-testid={`lead-card-responsavel-${leadDetalhesAberto.id}`}
                    className="h-10 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value={LEAD_UNASSIGNED_OPTION_VALUE}>Sem responsável</option>
                    {leadDetalhesAberto.responsavel_id &&
                      !responsaveis.some(
                        (responsavel) => responsavel.id === leadDetalhesAberto.responsavel_id,
                      ) && (
                        <option value={leadDetalhesAberto.responsavel_id}>
                          {getResponsavelLabel(leadDetalhesAberto)}
                        </option>
                      )}
                    {responsaveis.map((responsavel) => (
                      <option key={responsavel.id} value={responsavel.id}>
                        {responsavel.nome || responsavel.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#E0EBEF] bg-[#F8FCFC] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6C8695]">
                      Última interação
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#244455]">
                      {getUltimaInteracaoLabel(leadDetalhesAberto)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E0EBEF] bg-[#F8FCFC] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6C8695]">
                      Criado em
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#244455]">
                      {formatDateTime(leadDetalhesAberto.created_at)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#DCE8EC] p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#1A3E52]">Qualificação</h4>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F5266]">
                      <Target className="h-4 w-4 text-yellow-500" />
                      Score: {leadDetalhesAberto.score}
                    </div>
                  </div>
                </div>
                {getObservacaoResumo(leadDetalhesAberto) && (
                  <div className="rounded-xl border border-[#EAF1F4] bg-[#FAFCFD] px-4 py-3 text-sm text-[#4C6575]">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6A8492]">
                      Última observação
                    </p>
                    {getObservacaoResumo(leadDetalhesAberto)}
                  </div>
                )}

                <div className="rounded-xl border border-[#DCE8EC] p-4">
                  <h4 className="mb-3 text-sm font-semibold text-[#1A3E52]">Ações</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {canManageLeadLifecycle &&
                      (leadDetalhesAberto.status === StatusLead.NOVO ||
                        leadDetalhesAberto.status === StatusLead.CONTATADO) && (
                      <button
                        type="button"
                        onClick={() => handleQualificar(leadDetalhesAberto.id)}
                        disabled={processingLeadId === leadDetalhesAberto.id}
                        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processingLeadId === leadDetalhesAberto.id
                          ? 'Processando...'
                          : 'Qualificar lead'}
                      </button>
                    )}

                    {canConvertLead && leadDetalhesAberto.status === StatusLead.QUALIFICADO && (
                      <button
                        type="button"
                        onClick={() => handleOpenConvertDialog(leadDetalhesAberto)}
                        className="rounded-lg bg-[#159A9C] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
                      >
                        Converter em oportunidade
                      </button>
                    )}

                    {leadDetalhesAberto.status === StatusLead.CONVERTIDO && (
                      <button
                        type="button"
                        onClick={() => abrirLeadNoPipeline(leadDetalhesAberto)}
                        className="rounded-lg border border-[#159A9C] px-3 py-2 text-sm font-medium text-[#0F7B7D] transition-colors hover:bg-[#F4FBF9]"
                      >
                        Abrir no pipeline
                      </button>
                    )}

                    {canUpdateLead && leadDetalhesAberto.status === StatusLead.DESQUALIFICADO && (
                      <button
                        type="button"
                        onClick={() => handleOpenDialog(leadDetalhesAberto)}
                        className="rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm font-medium text-[#244455] transition-colors hover:bg-[#F8FCFC]"
                      >
                        Revisar lead
                      </button>
                    )}

                    {canManageLeadLifecycle &&
                      (leadDetalhesAberto.status === StatusLead.NOVO ||
                        leadDetalhesAberto.status === StatusLead.CONTATADO) && (
                      <button
                        type="button"
                        onClick={() => handleOpenInteracaoDialog(leadDetalhesAberto)}
                        disabled={processingLeadId === leadDetalhesAberto.id}
                        data-testid={`lead-card-registrar-interacao-${leadDetalhesAberto.id}`}
                        className="rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm font-medium text-[#244455] transition-colors hover:bg-[#F8FCFC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Registrar interação
                      </button>
                      )}

                    {canManageLeadLifecycle &&
                      leadDetalhesAberto.status !== StatusLead.DESQUALIFICADO &&
                      leadDetalhesAberto.status !== StatusLead.CONVERTIDO && (
                        <button
                          type="button"
                          onClick={() => handleDesqualificar(leadDetalhesAberto.id)}
                          disabled={processingLeadId === leadDetalhesAberto.id}
                          className="rounded-lg border border-[#F3CFD1] bg-[#FFF5F5] px-3 py-2 text-sm font-medium text-[#B03A48] transition-colors hover:bg-[#FFE9EA] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Desqualificar
                        </button>
                      )}

                    {canUpdateLead && leadDetalhesAberto.status !== StatusLead.DESQUALIFICADO && (
                      <button
                        type="button"
                        onClick={() => handleOpenDialog(leadDetalhesAberto)}
                        className="rounded-lg border border-[#C9DAE2] px-3 py-2 text-sm font-medium text-[#365C6F] transition-colors hover:bg-[#F4FAFC]"
                      >
                        Editar lead
                      </button>
                    )}

                    {canDeleteLead && leadDetalhesAberto.status !== StatusLead.CONVERTIDO && (
                      <button
                        type="button"
                        onClick={() => handleDelete(leadDetalhesAberto.id)}
                        className="rounded-lg border border-[#F3CFD1] bg-[#FFF5F5] px-3 py-2 text-sm font-medium text-[#B03A48] transition-colors hover:bg-[#FFE9EA]"
                      >
                        Excluir lead
                      </button>
                    )}
                  </div>
                  {!hasDetailActionPermissions && (
                    <p className="mt-2 text-xs text-[#5E7A88]">
                      Este perfil possui acesso somente leitura para este módulo.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {!loading && totalPaginasVisiveis > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D4E2E7] bg-white px-4 py-3">
            <span className="text-sm text-[#4C6575]">
              Exibindo {leadsFiltrados.length} de {totalRegistrosVisiveis} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                disabled={paginaAtual <= 1}
                className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] px-3 text-sm text-[#244455] transition-colors hover:bg-[#F8FCFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm font-medium text-[#244455]">
                Página {paginaAtual} de {totalPaginasVisiveis}
              </span>
              <button
                onClick={() => setPaginaAtual((prev) => Math.min(totalPaginasVisiveis, prev + 1))}
                disabled={paginaAtual >= totalPaginasVisiveis}
                className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] px-3 text-sm text-[#244455] transition-colors hover:bg-[#F8FCFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição - REFATORADO */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingLead ? 'Editar Lead' : 'Novo Lead'}
                    </h2>
                    <p className="text-sm text-white/80 mt-0.5">
                      {editingLead
                        ? 'Atualize as informações do lead'
                        : 'Preencha os dados do novo lead'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <form
              onSubmit={handleLeadSubmit(onSubmitLead)}
              className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUNA 1: Dados Básicos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User className="w-5 h-5 text-[#159A9C]" />
                    <h3 className="text-lg font-semibold text-[#002333]">Dados Básicos</h3>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      {...register('nome')}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                        leadErrors.nome ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Digite o nome completo"
                      disabled={isSubmitting}
                    />
                    {leadErrors.nome && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {leadErrors.nome.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('email')}
                        type="email"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          leadErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="email@exemplo.com"
                        disabled={isSubmitting}
                      />
                    </div>
                    {leadErrors.email && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {leadErrors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input type="hidden" {...register('telefone')} />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[190px_1fr]">
                      <select
                        value={leadPhoneCountryIso}
                        onChange={(event) => {
                          const nextCountry = getPhoneCountryByIso(event.target.value);
                          setLeadPhoneCountryIso(nextCountry.iso2);
                          setLeadValue('telefone', toE164(nextCountry, leadPhoneNationalNumber), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        disabled={isSubmitting}
                      >
                        {PHONE_COUNTRIES.map((country) => (
                          <option key={country.iso2} value={country.iso2}>
                            {country.flag ? `${country.flag} ` : ''}+{country.dialCode} {country.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={leadPhoneNationalNumber}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          leadErrors.telefone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={selectedLeadPhoneCountry.sample}
                        onChange={(event) => {
                          const onlyDigits = sanitizePhoneDigits(event.target.value).slice(
                            0,
                            selectedLeadPhoneCountry.maxLength,
                          );
                          setLeadPhoneNationalNumber(onlyDigits);
                          setLeadValue('telefone', toE164(selectedLeadPhoneCountry, onlyDigits), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                    {leadErrors.telefone && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {leadErrors.telefone.message}
                      </p>
                    )}
                    {!leadErrors.telefone &&
                    leadPhoneNationalNumber.length > 0 &&
                    leadPhoneNationalNumber.length < selectedLeadPhoneCountry.minLength ? (
                      <p className="mt-1 text-xs text-[#8A6D3B]">
                        Número incompleto para {selectedLeadPhoneCountry.name}.
                      </p>
                    ) : null}
                    {!leadErrors.telefone && watchedLeadTelefone ? (
                      <p className="mt-1 text-xs text-[#607B89]">
                        Formato salvo: {watchedLeadTelefone}
                      </p>
                    ) : null}
                    {!leadErrors.telefone && !watchedLeadTelefone && !watchedLeadEmail.trim() ? (
                      <p className="mt-1 text-xs text-[#8A6D3B]">
                        Informe pelo menos um contato: e-mail ou telefone.
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* COLUNA 2: Informações Profissionais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Briefcase className="w-5 h-5 text-[#159A9C]" />
                    <h3 className="text-lg font-semibold text-[#002333]">
                      Informações Profissionais
                    </h3>
                  </div>

                  {/* Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('empresa_nome')}
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Nome da empresa"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Origem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origem *</label>
                    <select
                      {...register('origem')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                        leadErrors.origem ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      {leadOriginFormOptions.map((originOption) => (
                        <option key={originOption.value} value={originOption.value}>
                          {originOption.allowManualSelection
                            ? originOption.label
                            : `${originOption.label} (sistema)`}
                        </option>
                      ))}
                    </select>
                    {leadErrors.origem && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {leadErrors.origem.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Observações (Full Width) */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  {...register('observacoes')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors resize-none"
                  placeholder="Informações adicionais sobre o lead"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleLeadSubmit(onSubmitLead)}
                disabled={!isLeadValid || isSubmitting}
                className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingLead ? 'Salvar Alterações' : 'Criar Lead'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conversão para Oportunidade - REFATORADO */}
      {showConvertDialog && leadToConvert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Converter Lead em Oportunidade</h2>
                    <p className="text-sm text-white/80 mt-0.5">
                      {leadToConvert.nome} ({leadToConvert.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseConvertDialog}
                  disabled={isSubmitting}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <form
              onSubmit={handleConvertSubmit(onSubmitConvert)}
              className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]"
            >
              <div className="space-y-6">
                {/* Informações do Lead */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-900">Informações do Lead</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
                    <div>
                      <strong>Score:</strong> {leadToConvert.score}/100
                    </div>
                    {leadToConvert.telefone && (
                      <div>
                        <strong>Telefone:</strong> {leadToConvert.telefone}
                      </div>
                    )}
                    {leadToConvert.empresa_nome && (
                      <div>
                        <strong>Empresa:</strong> {leadToConvert.empresa_nome}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-blue-700">
                    Regra de vínculo: {CLIENTE_OU_CONTATO_RULE_MESSAGE}
                  </p>
                </div>

                {/* Título da Oportunidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Oportunidade *
                  </label>
                  <input
                    {...registerConvert('titulo_oportunidade')}
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                      convertErrors.titulo_oportunidade ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Venda de software para Empresa X"
                    disabled={isSubmitting}
                  />
                  {convertErrors.titulo_oportunidade && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {convertErrors.titulo_oportunidade.message}
                    </p>
                  )}
                </div>

                {/* Grid: Valor e Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Valor Estimado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Estimado (R$)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Controller
                        name="valor_estimado"
                        control={controlConvert}
                        render={({ field }) => (
                          <NumericFormat
                            value={field.value || ''}
                            onValueChange={(values) => {
                              field.onChange(values.value || '');
                            }}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            fixedDecimalScale
                            allowNegative={false}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                              convertErrors.valor_estimado ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="0,00"
                            disabled={isSubmitting}
                            inputMode="decimal"
                          />
                        )}
                      />
                    </div>
                    {convertErrors.valor_estimado && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {convertErrors.valor_estimado.message}
                      </p>
                    )}
                  </div>

                  {/* Data Prevista */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Fechamento Prevista
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...registerConvert('data_fechamento_prevista')}
                        type="date"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    {...registerConvert('observacoes')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors resize-none"
                    placeholder="Informações adicionais sobre a oportunidade"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={handleCloseConvertDialog}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleConvertSubmit(onSubmitConvert)}
                disabled={!isConvertValid || isSubmitting}
                className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Converter em Oportunidade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Interação */}
      {showInteracaoDialog && leadParaInteracao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Registrar interação</h2>
                  <p className="mt-0.5 text-sm text-white/85">
                    {leadParaInteracao.nome}
                    {leadParaInteracao.email ? ` (${leadParaInteracao.email})` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseInteracaoDialog}
                  disabled={processingLeadId === leadParaInteracao.id}
                  className="rounded-lg p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 px-6 py-5">
              <label
                htmlFor="lead-interacao-observacao"
                className="block text-sm font-medium text-gray-700"
              >
                Observação da interação (opcional)
              </label>
              <textarea
                id="lead-interacao-observacao"
                value={interacaoObservacao}
                onChange={(event) => setInteracaoObservacao(event.target.value)}
                rows={4}
                maxLength={1200}
                data-testid="lead-interacao-observacao"
                placeholder="Ex.: Conversei com o lead, confirmou interesse e pediu retorno na próxima semana."
                disabled={processingLeadId === leadParaInteracao.id}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Se vazio, será registrado como "Contato registrado manualmente".
              </p>
            </div>

            <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseInteracaoDialog}
                disabled={processingLeadId === leadParaInteracao.id}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarInteracao}
                disabled={processingLeadId === leadParaInteracao.id}
                data-testid="lead-interacao-confirmar"
                className="flex-1 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {processingLeadId === leadParaInteracao.id ? 'Registrando...' : 'Registrar interação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Import CSV */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#159A9C]/10 rounded-lg">
                    <Upload className="h-6 w-6 text-[#159A9C]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#002333]">Importar Leads via CSV</h2>
                    <p className="text-sm text-[#B4BEC9] mt-1">
                      Envie um arquivo CSV com seus leads para importação em massa
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseImportDialog}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Instruções */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-2">Formato do arquivo CSV:</p>
                    <p className="text-blue-800 mb-2">
                      O arquivo deve conter as seguintes colunas (cabeçalho obrigatório):
                    </p>
                    <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2">
                      <li>
                        <strong>nome</strong> (obrigatório)
                      </li>
                      <li>email</li>
                      <li>telefone</li>
                      <li>empresa_nome</li>
                      <li>
                        origem (manual, formulario, whatsapp, importacao, indicacao, api, outro)
                      </li>
                      <li>observacoes</li>
                      <li>responsavel_email (email do usuário responsável)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload de Arquivo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Selecione o arquivo CSV
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#159A9C] transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                    disabled={importing}
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Clique para selecionar ou arraste o arquivo
                    </p>
                    <p className="text-xs text-gray-500">Apenas arquivos .csv (máximo 10MB)</p>
                  </label>
                </div>
                {importFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">{importFile.name}</span>
                    <span className="text-gray-500">
                      ({(importFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>

              {/* Resultado da Importação */}
              {importResult && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-[#002333] mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Resultado da Importação
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-700">{importResult.total}</p>
                      <p className="text-xs text-gray-500">Total Processados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{importResult.importados}</p>
                      <p className="text-xs text-gray-500">Importados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{importResult.erros}</p>
                      <p className="text-xs text-gray-500">Erros</p>
                    </div>
                  </div>

                  {/* Detalhes de Erros */}
                  {importResult.detalhes && importResult.detalhes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Detalhes dos Erros:
                      </p>
                      <div className="max-h-40 overflow-y-auto bg-white rounded border border-red-200 p-3 space-y-2">
                        {importResult.detalhes.slice(0, 10).map((detalhe, index) => (
                          <div
                            key={index}
                            className="text-xs text-red-600 border-b border-red-100 pb-1 last:border-b-0"
                          >
                            <strong>Linha {detalhe.linha}:</strong> {detalhe.erro}
                          </div>
                        ))}
                        {importResult.detalhes.length > 10 && (
                          <p className="text-xs text-red-500 italic">
                            ... e mais {importResult.detalhes.length - 10} erros
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de Erro Geral */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseImportDialog}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={importing}
                >
                  {importResult ? 'Fechar' : 'Cancelar'}
                </button>
                {!importResult && (
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Importar Leads
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
