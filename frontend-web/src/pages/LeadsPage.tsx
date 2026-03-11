import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toastService } from '../services/toastService';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
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
} from 'lucide-react';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';
import { FiltersBar, InlineStats, PageHeader, SectionCard } from '../components/layout-v2';
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
import { matchesLocalSearchTerm, normalizeSearchValue } from '../utils/localSearch';

// Schema de validação para o modal de Lead
const leadSchema = yup.object().shape({
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
});

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

interface LeadsSavedView {
  id: string;
  nome: string;
  busca: string;
  status: string;
  origem: string;
  responsavelId: string;
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

    return parsed.filter((view) => {
      return (
        typeof view?.id === 'string' &&
        typeof view?.nome === 'string' &&
        typeof view?.busca === 'string' &&
        typeof view?.status === 'string' &&
        typeof view?.origem === 'string' &&
        typeof view?.responsavelId === 'string' &&
        typeof view?.dataInicio === 'string' &&
        typeof view?.dataFim === 'string' &&
        typeof view?.itensPorPagina === 'number'
      );
    });
  } catch {
    return [];
  }
};

const LeadsPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const navigate = useNavigate();
  // Estados principais
  const [leads, setLeads] = useState<Lead[]>([]);
  const [estatisticas, setEstatisticas] = useState<LeadEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('operacionais');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('todas');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
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

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportLeadResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form para modal de Lead
  const {
    register,
    handleSubmit: handleLeadSubmit,
    formState: { errors: leadErrors, isValid: isLeadValid },
    reset: resetLeadForm,
    setValue: setLeadValue,
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

  // React Hook Form para modal de Conversão
  const {
    register: registerConvert,
    handleSubmit: handleConvertSubmit,
    formState: { errors: convertErrors, isValid: isConvertValid },
    reset: resetConvertForm,
    setValue: setConvertValue,
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
    try {
      setLoading(true);
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

      if (filtroResponsavel !== 'todos') {
        filtros.responsavel_id = filtroResponsavel;
      }

      if (filtroDataInicio) {
        filtros.dataInicio = `${filtroDataInicio}T00:00:00.000Z`;
      }

      if (filtroDataFim) {
        filtros.dataFim = `${filtroDataFim}T23:59:59.999Z`;
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
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [
    paginaAtual,
    itensPorPagina,
    filtroStatus,
    filtroOrigem,
    filtroResponsavel,
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

  const handleOpenDialog = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      const safeOrigin =
        lead.origem && Object.values(OrigemLead).includes(lead.origem as OrigemLead)
          ? (lead.origem as OrigemLead)
          : OrigemLead.MANUAL;
      resetLeadForm({
        nome: lead.nome ?? '',
        email: lead.email ?? '',
        telefone: lead.telefone ?? '',
        empresa_nome: lead.empresa_nome ?? '',
        origem: safeOrigin,
        observacoes: lead.observacoes ?? '',
      });
    } else {
      setEditingLead(null);
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
    resetLeadForm();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Tem certeza que deseja excluir este lead?'))) {
      return;
    }

    try {
      setError(null);
      await leadsService.deletar(id);
      carregarDados();
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

  const handleRegistrarContato = async (id: string) => {
    try {
      setProcessingLeadId(id);
      setError(null);
      await leadsService.registrarPrimeiroContato(id, 'Contato registrado manualmente');
      await carregarDados();
      toastService.success('Contato registrado com sucesso!');
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
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleDesqualificar = async (id: string) => {
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

  const handleAtribuirResponsavel = async (lead: Lead, responsavelId: string) => {
    if (!responsavelId || responsavelId === lead.responsavel_id) {
      return;
    }

    try {
      setAtribuindoLeadId(lead.id);
      setError(null);
      await leadsService.atribuirResponsavel(lead.id, responsavelId);
      await carregarDados();
      toastService.success('Responsável atualizado com sucesso!');
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

  const handleOpenConvertDialog = (lead: Lead) => {
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
      navigate(`/crm/pipeline?oportunidadeId=${oportunidadeId}`);
      return;
    }

    navigate('/crm/pipeline');
  };

  const onSubmitConvert = async (data: any) => {
    if (!leadToConvert) return;

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
      const oportunidadeId = Number((oportunidade as any)?.id);

      toastService.success('Lead convertido em oportunidade com sucesso!');
      setShowConvertDialog(false);
      setLeadToConvert(null);
      resetConvertForm();

      if (Number.isFinite(oportunidadeId) && oportunidadeId > 0) {
        navigate(`/crm/pipeline?oportunidadeId=${oportunidadeId}`);
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
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao converter lead';
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
        return;
      }
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
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

  const normalizedBusca = normalizeSearchValue(busca);
  const leadsFiltrados = useMemo(() => {
    if (!normalizedBusca) {
      return leads;
    }

    return leads.filter((lead) =>
      matchesLocalSearchTerm(normalizedBusca, [
        lead.nome,
        lead.email,
        lead.telefone,
        lead.empresa_nome,
        lead.responsavel?.nome,
        lead.responsavel?.username,
      ]),
    );
  }, [leads, normalizedBusca]);

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
    const labels: Record<OrigemLead, string> = {
      [OrigemLead.FORMULARIO]: 'Formulário',
      [OrigemLead.IMPORTACAO]: 'Importação',
      [OrigemLead.API]: 'API',
      [OrigemLead.WHATSAPP]: 'WhatsApp',
      [OrigemLead.MANUAL]: 'Manual',
      [OrigemLead.INDICACAO]: 'Indicação',
      [OrigemLead.OUTRO]: 'Outro',
    };
    return labels[origem as OrigemLead] || origem;
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

  const totalLeadsAbertos = Math.max(
    (estatisticas?.total || 0) - (estatisticas?.convertidos || 0),
    0,
  );
  const leadsProntosParaConversao = estatisticas?.qualificados || 0;
  const taxaConversao = estatisticas?.taxaConversao || 0;

  const pageDescription = loading
    ? 'Carregando...'
    : `Gerencie seus ${totalRegistros} leads na pré-venda e converta em oportunidades`;
  const hasFilters =
    Boolean(busca.trim()) ||
    filtroStatus !== 'operacionais' ||
    filtroOrigem !== 'todas' ||
    filtroResponsavel !== 'todos' ||
    Boolean(filtroDataInicio) ||
    Boolean(filtroDataFim);

  const handleClearFilters = () => {
    setBusca('');
    setFiltroStatus('operacionais');
    setFiltroOrigem('todas');
    setFiltroResponsavel('todos');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPaginaAtual(1);
    setSelectedLeadIds([]);
  };

  const activeSavedView = savedViews.find((view) => view.id === activeViewId) || null;
  const totalRegistrosVisiveis = normalizedBusca ? leadsFiltrados.length : totalRegistros;
  const totalPaginasVisiveis = normalizedBusca ? 1 : totalPaginas;
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
  ) => {
    if (selectedLeadIds.length === 0) {
      toastService.error('Selecione pelo menos um lead.');
      return;
    }

    setBulkActionLoading(actionId);
    setError(null);

    try {
      const results = await Promise.allSettled(selectedLeadIds.map((leadId) => callback(leadId)));
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
    await executeBulkAction('qualificar', 'Qualificação em lote', (leadId) =>
      leadsService.qualificar(leadId, 'Lead qualificado em lote'),
    );
  };

  const handleBulkDesqualificar = async () => {
    if (!(await confirm('Deseja desqualificar os leads selecionados?'))) {
      return;
    }

    await executeBulkAction('desqualificar', 'Desqualificação em lote', (leadId) =>
      leadsService.desqualificar(leadId, 'Lead desqualificado em lote'),
    );
  };

  const handleBulkAtribuirResponsavel = async () => {
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
    setFiltroResponsavel(view.responsavelId || 'todos');
    setFiltroDataInicio(view.dataInicio || '');
    setFiltroDataFim(view.dataFim || '');
    setItensPorPagina(view.itensPorPagina || 12);
    setPaginaAtual(1);
    setViewNameInput(view.nome);
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
      responsavelId: filtroResponsavel,
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
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#159A9C]" />
              <span>Leads</span>
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" /> : null}
            </span>
          }
          description={pageDescription}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={carregarDados}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#B4BEC9] bg-white px-3 text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:opacity-50"
                title="Atualizar leads"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleOpenImportDialog}
                className="inline-flex items-center gap-2 rounded-lg border border-[#159A9C] bg-white px-4 py-2 text-sm font-medium text-[#159A9C] transition-colors hover:bg-[#F4FBF9]"
              >
                <Upload className="h-4 w-4" />
                Importar CSV
              </button>
              <button
                onClick={() => handleOpenDialog()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Novo Lead
              </button>
            </div>
          }
        />

        {!loading && (
          <InlineStats
            stats={[
              {
                label: 'Em aberto',
                value: String(totalLeadsAbertos),
                tone: 'accent',
              },
              {
                label: 'Prontos para converter',
                value: String(leadsProntosParaConversao),
                tone: 'accent',
              },
              {
                label: 'Taxa de conversão',
                value: `${taxaConversao.toFixed(1)}%`,
                tone: 'accent',
              },
            ]}
          />
        )}
      </SectionCard>

      <div className="max-w-7xl mx-auto space-y-6">
        <FiltersBar className="p-4">
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Buscar leads
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou empresa..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value);
                  setPaginaAtual(1);
                }}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value="operacionais">Pré-venda (abertos)</option>
                <option value="todos">Todos os status</option>
                <option value={StatusLead.NOVO}>Novos</option>
                <option value={StatusLead.CONTATADO}>Contatados</option>
                <option value={StatusLead.QUALIFICADO}>Qualificados</option>
                <option value={StatusLead.DESQUALIFICADO}>Desqualificados</option>
                <option value={StatusLead.CONVERTIDO}>Convertidos</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Origem
              </label>
              <select
                value={filtroOrigem}
                onChange={(e) => {
                  setFiltroOrigem(e.target.value);
                  setPaginaAtual(1);
                }}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value="todas">Todas as origens</option>
                <option value={OrigemLead.MANUAL}>Manual</option>
                <option value={OrigemLead.FORMULARIO}>Formulário</option>
                <option value={OrigemLead.WHATSAPP}>WhatsApp</option>
                <option value={OrigemLead.IMPORTACAO}>Importação</option>
                <option value={OrigemLead.INDICACAO}>Indicação</option>
                <option value={OrigemLead.API}>API</option>
                <option value={OrigemLead.OUTRO}>Outro</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Responsável
              </label>
              <select
                value={filtroResponsavel}
                onChange={(e) => {
                  setFiltroResponsavel(e.target.value);
                  setPaginaAtual(1);
                }}
                disabled={loadingResponsaveis}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="todos">Todos os responsáveis</option>
                {responsaveis.map((responsavel) => (
                  <option key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome || responsavel.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
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
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Até
              </label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => {
                  setFiltroDataFim(e.target.value);
                  setPaginaAtual(1);
                }}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Itens por página
              </label>
              <select
                value={itensPorPagina}
                onChange={(e) => {
                  setItensPorPagina(Number(e.target.value));
                  setPaginaAtual(1);
                }}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Ações
              </label>
              <button
                type="button"
                onClick={handleClearFilters}
                disabled={!hasFilters}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Limpar
              </button>
            </div>
          </div>
        </FiltersBar>

        <div className="flex flex-col gap-3 rounded-xl border border-[#D4E2E7] bg-white p-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-3 lg:w-auto lg:min-w-[680px]">
            <div className="md:col-span-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Views salvas
              </label>
              <select
                value={activeViewId}
                onChange={(e) => handleSavedViewChange(e.target.value)}
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
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Nome da view
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={viewNameInput}
                  onChange={(e) => setViewNameInput(e.target.value)}
                  placeholder="Ex.: Leads sem responsável"
                  className="h-9 flex-1 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentView}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#159A9C] px-3 text-sm font-medium text-[#159A9C] transition-colors hover:bg-[#F4FBF9]"
                >
                  <Save className="h-4 w-4" />
                  {activeSavedView ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSavedView}
                  disabled={!activeSavedView}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E8C8CB] px-3 text-sm font-medium text-[#B03A48] transition-colors hover:bg-[#FFF5F5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>

        {leadsFiltrados.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#D4E2E7] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
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
                disabled={!bulkSelectedCount || !bulkResponsavelId || bulkActionLoading !== null}
                className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] px-3 text-xs font-medium text-[#244455] transition-colors hover:bg-[#F8FCFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkActionLoading === 'atribuir' ? 'Aplicando...' : 'Aplicar responsável'}
              </button>
              <button
                type="button"
                onClick={handleBulkQualificar}
                disabled={!bulkSelectedCount || bulkActionLoading !== null}
                className="inline-flex h-9 items-center rounded-lg bg-green-600 px-3 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkActionLoading === 'qualificar' ? 'Processando...' : 'Qualificar em lote'}
              </button>
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
            </div>
          </div>
        )}

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
              {!hasFilters && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leadsFiltrados.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-[#D4E2E7] bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#159A9C] flex items-center justify-center text-white shadow-md flex-shrink-0">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{lead.nome}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
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
                    </div>
                  </div>

                  <div className="ml-2 flex flex-shrink-0 gap-1">
                    <label className="inline-flex cursor-pointer items-center rounded-lg p-2 hover:bg-[#F4FBF9]">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="h-4 w-4 rounded border-[#BFD2DB] text-[#159A9C] focus:ring-[#159A9C]/30"
                      />
                    </label>
                    <button
                      onClick={() => handleOpenDialog(lead)}
                      className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="rounded-lg p-2 transition-colors hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{lead.telefone}</span>
                    </div>
                  )}
                  {lead.empresa_nome && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{lead.empresa_nome}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span
                      className={
                        getResponsavelLabel(lead) === 'Sem responsável'
                          ? 'font-medium text-amber-700'
                          : 'text-gray-600'
                      }
                    >
                      {getResponsavelLabel(lead)}
                    </span>
                  </div>

                  <div className="pt-1">
                    <select
                      value={lead.responsavel_id || ''}
                      onChange={(event) => handleAtribuirResponsavel(lead, event.target.value)}
                      disabled={loadingResponsaveis || atribuindoLeadId === lead.id}
                      className="h-9 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-xs text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Sem responsável
                      </option>
                      {lead.responsavel_id &&
                        !responsaveis.some((responsavel) => responsavel.id === lead.responsavel_id) && (
                          <option value={lead.responsavel_id}>{getResponsavelLabel(lead)}</option>
                        )}
                      {responsaveis.map((responsavel) => (
                        <option key={responsavel.id} value={responsavel.id}>
                          {responsavel.nome || responsavel.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#E0EBEF] bg-[#F8FCFC] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6C8695]">
                      Última interação
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#244455]">
                      {formatDateTime(lead.data_ultima_interacao || lead.updated_at)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E0EBEF] bg-[#F8FCFC] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6C8695]">
                      Criado em
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#244455]">
                      {formatDateTime(lead.created_at)}
                    </p>
                  </div>
                </div>

                {getObservacaoResumo(lead) && (
                  <div className="mb-4 rounded-lg border border-[#EAF1F4] bg-[#FAFCFD] px-3 py-2 text-xs text-[#4C6575]">
                    {getObservacaoResumo(lead)}
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Score: {lead.score}</span>
                  </div>
                  <div className="text-xs font-medium text-[#5E7987]">{getNextActionLabel(lead)}</div>
                </div>

                {(lead.status === StatusLead.NOVO || lead.status === StatusLead.CONTATADO) && (
                  <button
                    onClick={() => handleQualificar(lead.id)}
                    disabled={processingLeadId === lead.id}
                    className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {processingLeadId === lead.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {processingLeadId === lead.id ? 'Processando...' : 'Qualificar Lead'}
                    </span>
                  </button>
                )}

                {lead.status === StatusLead.QUALIFICADO && (
                  <button
                    onClick={() => handleOpenConvertDialog(lead)}
                    disabled={processingLeadId === lead.id}
                    className="mt-4 w-full rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Converter em Oportunidade
                    </span>
                  </button>
                )}

                {lead.status === StatusLead.CONVERTIDO && (
                  <button
                    onClick={() => abrirLeadNoPipeline(lead)}
                    className="mt-4 w-full rounded-lg border border-[#159A9C] px-4 py-2 text-sm font-medium text-[#0F7B7D] transition-colors hover:bg-[#F4FBF9]"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Abrir no Pipeline
                    </span>
                  </button>
                )}

                {lead.status === StatusLead.DESQUALIFICADO && (
                  <button
                    onClick={() => handleOpenDialog(lead)}
                    disabled={processingLeadId === lead.id}
                    className="mt-4 w-full rounded-lg border border-[#D4E2E7] px-4 py-2 text-sm font-medium text-[#244455] transition-colors hover:bg-[#F8FCFC]"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      Revisar Lead
                    </span>
                  </button>
                )}

                {lead.status !== StatusLead.CONVERTIDO && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lead.status === StatusLead.NOVO && (
                      <button
                        onClick={() => handleRegistrarContato(lead.id)}
                        disabled={processingLeadId === lead.id}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-xs font-medium text-[#244455] transition-colors hover:bg-[#F8FCFC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Registrar contato
                      </button>
                    )}
                    {lead.status !== StatusLead.DESQUALIFICADO && (
                      <button
                        onClick={() => handleDesqualificar(lead.id)}
                        disabled={processingLeadId === lead.id}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#F3CFD1] bg-[#FFF5F5] px-3 py-2 text-xs font-medium text-[#B03A48] transition-colors hover:bg-[#FFE9EA] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Desqualificar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('telefone')}
                        type="tel"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="(00) 00000-0000"
                        disabled={isSubmitting}
                      />
                    </div>
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
                      <option value={OrigemLead.MANUAL}>Manual</option>
                      <option value={OrigemLead.FORMULARIO}>Formulário</option>
                      <option value={OrigemLead.IMPORTACAO}>Importação</option>
                      <option value={OrigemLead.API}>API</option>
                      <option value={OrigemLead.WHATSAPP}>WhatsApp</option>
                      <option value={OrigemLead.INDICACAO}>Indicação</option>
                      <option value={OrigemLead.OUTRO}>Outro</option>
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
                      <input
                        {...registerConvert('valor_estimado')}
                        type="number"
                        step="0.01"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          convertErrors.valor_estimado ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        disabled={isSubmitting}
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
                        origem (site, formulario, email, telefone, redes_sociais, indicacao, outros)
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
