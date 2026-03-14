import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toastService } from '../services/toastService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Target,
  Plus,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Search,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Grid3X3,
  List,
  BarChart3,
  Download,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Save,
  Bookmark,
  Archive,
  RotateCcw,
  CheckCircle,
  Settings2,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import { oportunidadesService } from '../services/oportunidadesService';
import usuariosService from '../services/usuariosService';
import { Usuario } from '../types/usuarios';
import {
  Oportunidade,
  NovaOportunidade,
  FiltrosOportunidade,
  EstatisticasOportunidades,
  StaleDealsResult,
  StalePolicyDecision,
} from '../types/oportunidades';
import {
  EstagioOportunidade,
  LifecycleStatusOportunidade,
  LifecycleViewOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
  TipoAtividade,
} from '../types/oportunidades/enums';
import ModalOportunidadeRefatorado from '../components/oportunidades/ModalOportunidadeRefatorado';
import ModalMudancaEstagio from '../components/oportunidades/ModalMudancaEstagio';
import ModalDetalhesOportunidade from '../components/oportunidades/ModalDetalhesOportunidade';
import ModalExport from '../components/oportunidades/ModalExport';
import ModalMotivoPerda from '../components/oportunidades/ModalMotivoPerda';
import { useAuth } from '../contexts/AuthContext';
import { userHasPermission } from '../config/menuConfig';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';
import { DataTableCard, InlineStats, PageHeader, SectionCard } from '../components/layout-v2';

// Configuração do localizador do calendário (date-fns)
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Tipos de visualização
type VisualizacaoPipeline = 'kanban' | 'lista' | 'calendario' | 'grafico';
type WorkspaceTab = 'pipeline' | 'parametros';

type EstagioConfig = {
  id: EstagioOportunidade;
  nome: string;
  headerClass: string;
  legendClass: string;
  badgeTextClass: string;
  badgeBgClass: string;
  accentColor: string;
};

// Configuração dos estágios do pipeline alinhada ao tema Crevasse
const ESTAGIOS_CONFIG: EstagioConfig[] = [
  {
    id: EstagioOportunidade.LEADS,
    nome: 'Leads',
    headerClass:
      'bg-white border border-[#B4BEC9]/40 border-b-0 border-t-4 border-t-[#002333]',
    legendClass: 'bg-[#002333]',
    badgeTextClass: 'text-[#002333]',
    badgeBgClass: 'bg-[#DEEFE7]',
    accentColor: '#002333',
  },
  {
    id: EstagioOportunidade.QUALIFICACAO,
    nome: 'Qualificação',
    headerClass:
      'bg-white border border-[#B4BEC9]/40 border-b-0 border-t-4 border-t-[#0F7B7D]',
    legendClass: 'bg-[#0F7B7D]',
    badgeTextClass: 'text-[#0F7B7D]',
    badgeBgClass: 'bg-[#DEEFE7]',
    accentColor: '#0F7B7D',
  },
  {
    id: EstagioOportunidade.PROPOSTA,
    nome: 'Proposta',
    headerClass:
      'bg-white border border-[#B4BEC9]/40 border-b-0 border-t-4 border-t-[#159A9C]',
    legendClass: 'bg-[#159A9C]',
    badgeTextClass: 'text-[#0F7B7D]',
    badgeBgClass: 'bg-[#DEEFE7]',
    accentColor: '#159A9C',
  },
  {
    id: EstagioOportunidade.NEGOCIACAO,
    nome: 'Negociação',
    headerClass:
      'bg-white border border-[#B4BEC9]/40 border-b-0 border-t-4 border-t-[#0F7B7D]',
    legendClass: 'bg-[#0F7B7D]',
    badgeTextClass: 'text-[#0F7B7D]',
    badgeBgClass: 'bg-[#DEEFE7]',
    accentColor: '#0F7B7D',
  },
  {
    id: EstagioOportunidade.FECHAMENTO,
    nome: 'Fechamento',
    headerClass:
      'bg-white border border-[#B4BEC9]/40 border-b-0 border-t-4 border-t-[#159A9C]',
    legendClass: 'bg-[#159A9C]',
    badgeTextClass: 'text-[#0F7B7D]',
    badgeBgClass: 'bg-[#DEEFE7]',
    accentColor: '#159A9C',
  },
  {
    id: EstagioOportunidade.GANHO,
    nome: 'Ganho',
    headerClass:
      'bg-white border border-[#B4BEC9]/40 border-b-0 border-t-4 border-t-green-600',
    legendClass: 'bg-green-600',
    badgeTextClass: 'text-green-700',
    badgeBgClass: 'bg-green-50',
    accentColor: '#16A34A',
  },
  {
    id: EstagioOportunidade.PERDIDO,
    nome: 'Perdido',
    headerClass: 'bg-white border border-[#B4BEC9]/40 border-b-0 border-t-4 border-t-red-600',
    legendClass: 'bg-red-600',
    badgeTextClass: 'text-red-700',
    badgeBgClass: 'bg-red-50',
    accentColor: '#DC2626',
  },
];

// Paleta de apoio para gráficos (seguindo tema Crevasse + cores contextuais)
const ALLOWED_STAGE_TRANSITIONS: Record<EstagioOportunidade, readonly EstagioOportunidade[]> = {
  [EstagioOportunidade.LEADS]: [EstagioOportunidade.QUALIFICACAO, EstagioOportunidade.PERDIDO],
  [EstagioOportunidade.QUALIFICACAO]: [
    EstagioOportunidade.LEADS,
    EstagioOportunidade.PROPOSTA,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.PROPOSTA]: [
    EstagioOportunidade.QUALIFICACAO,
    EstagioOportunidade.NEGOCIACAO,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.NEGOCIACAO]: [
    EstagioOportunidade.PROPOSTA,
    EstagioOportunidade.FECHAMENTO,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.FECHAMENTO]: [
    EstagioOportunidade.NEGOCIACAO,
    EstagioOportunidade.GANHO,
    EstagioOportunidade.PERDIDO,
  ],
  [EstagioOportunidade.GANHO]: [],
  [EstagioOportunidade.PERDIDO]: [],
};

const LIFECYCLE_VIEW_OPTIONS: Array<{
  id: LifecycleViewOportunidade;
  label: string;
}> = [
  { id: LifecycleViewOportunidade.OPEN, label: 'Abertas' },
  { id: LifecycleViewOportunidade.CLOSED, label: 'Fechadas' },
  { id: LifecycleViewOportunidade.ARCHIVED, label: 'Arquivadas' },
  { id: LifecycleViewOportunidade.DELETED, label: 'Lixeira' },
];

const LIFECYCLE_VIEW_DESCRIPTIONS: Record<LifecycleViewOportunidade, string> = {
  [LifecycleViewOportunidade.OPEN]: 'Apenas oportunidades ativas no funil comercial.',
  [LifecycleViewOportunidade.CLOSED]: 'Negocios encerrados como ganho ou perdido.',
  [LifecycleViewOportunidade.ARCHIVED]: 'Registros arquivados para referencia.',
  [LifecycleViewOportunidade.DELETED]: 'Itens enviados para a lixeira (exclusao logica).',
  [LifecycleViewOportunidade.ALL_ACTIVE]: 'Todos os registros ativos.',
  [LifecycleViewOportunidade.ALL]: 'Todos os registros, incluindo lixeira.',
};

const STALE_THRESHOLD_MIN = 7;
const STALE_THRESHOLD_MAX = 120;
const STALE_AUTO_ARCHIVE_MIN = 7;
const STALE_AUTO_ARCHIVE_MAX = 365;

const CORES_GRAFICOS = [
  '#002333',
  '#0F7B7D',
  '#159A9C',
  '#B4BEC9',
  '#DEEFE7',
  '#16A34A',
  '#FBBF24',
  '#DC2626',
];

const PipelinePage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasOportunidades | null>(null);
  const [lifecycleFeatureEnabled, setLifecycleFeatureEnabled] = useState(false);
  const [lifecycleView, setLifecycleView] = useState<LifecycleViewOportunidade>(
    LifecycleViewOportunidade.OPEN,
  );
  const [stalePolicy, setStalePolicy] = useState<StalePolicyDecision | null>(null);
  const [stalePolicyDraft, setStalePolicyDraft] = useState({
    enabled: false,
    thresholdDays: 30,
    autoArchiveEnabled: false,
    autoArchiveAfterDays: 60,
  });
  const [stalePolicyLoading, setStalePolicyLoading] = useState(false);
  const [stalePolicySaving, setStalePolicySaving] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('pipeline');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [visualizacao, setVisualizacao] = useState<VisualizacaoPipeline>('kanban');
  const [kanbanExpanded, setKanbanExpanded] = useState(false);
  const [filtros, setFiltros] = useState({
    busca: '',
    estagio: '',
    prioridade: '',
    origem: '',
    valorMin: '',
    valorMax: '',
    responsavel: '',
  });
  const [draggedItem, setDraggedItem] = useState<Oportunidade | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModalExport, setShowModalExport] = useState(false);
  const [showModalMudancaEstagio, setShowModalMudancaEstagio] = useState(false);
  const [mudancaEstagioData, setMudancaEstagioData] = useState<{
    oportunidade: Oportunidade;
    novoEstagio: EstagioOportunidade;
  } | null>(null);
  const [loadingMudancaEstagio, setLoadingMudancaEstagio] = useState(false);
  const [erroMudancaEstagio, setErroMudancaEstagio] = useState<string | null>(null);

  // ✅ Estados para Modal de Motivo de Perda
  const [showModalMotivoPerda, setShowModalMotivoPerda] = useState(false);
  const [oportunidadeParaPerder, setOportunidadeParaPerder] = useState<Oportunidade | null>(null);
  const [erroMotivoPerda, setErroMotivoPerda] = useState<string | null>(null);
  const [showModalDeletar, setShowModalDeletar] = useState(false);
  const [oportunidadeDeletar, setOportunidadeDeletar] = useState<Oportunidade | null>(null);
  const [deleteMode, setDeleteMode] = useState<'soft' | 'permanente'>('soft');
  const [loadingDeletar, setLoadingDeletar] = useState(false);
  const [oportunidadeDetalhes, setOportunidadeDetalhes] = useState<Oportunidade | null>(null);
  const [oportunidadeEditando, setOportunidadeEditando] = useState<Oportunidade | null>(null);
  const [estagioNovaOportunidade, setEstagioNovaOportunidade] = useState<EstagioOportunidade>(
    EstagioOportunidade.LEADS,
  );
  const [calendarView, setCalendarView] = useState<View>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [openCardActionsMenuId, setOpenCardActionsMenuId] = useState<string | null>(null);
  const [openListActionsMenuId, setOpenListActionsMenuId] = useState<string | null>(null);
  const canManageStalePolicy = userHasPermission(user as any, 'config.automacoes.manage');
  const showPipelineWorkspace = !lifecycleFeatureEnabled || workspaceTab === 'pipeline';

  useEffect(() => {
    if (visualizacao !== 'kanban' && kanbanExpanded) {
      setKanbanExpanded(false);
    }
  }, [visualizacao, kanbanExpanded]);

  useEffect(() => {
    if (!kanbanExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [kanbanExpanded]);

  useEffect(() => {
    if (!openCardActionsMenuId && !openListActionsMenuId) return;

    const closeMenu = () => {
      setOpenCardActionsMenuId(null);
      setOpenListActionsMenuId(null);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openCardActionsMenuId, openListActionsMenuId]);

  useEffect(() => {
    if (!kanbanExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setKanbanExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [kanbanExpanded]);

  // Estados para ordenação e paginação
  const [ordenacao, setOrdenacao] = useState<{
    campo: 'valor' | 'dataFechamentoEsperado' | 'probabilidade' | 'estagio' | 'titulo';
    direcao: 'asc' | 'desc';
  }>({ campo: 'dataFechamentoEsperado', direcao: 'asc' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Estados para filtros salvos
  const [filtrosSalvos, setFiltrosSalvos] = useState<
    Array<{
      id: string;
      nome: string;
      filtros: typeof filtros;
    }>
  >([]);
  const [showModalSalvarFiltro, setShowModalSalvarFiltro] = useState(false);
  const [nomeFiltroSalvar, setNomeFiltroSalvar] = useState('');
  const [filtroSelecionado, setFiltroSelecionado] = useState<string | null>(null);

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const filtrosSalvosStorage = localStorage.getItem('conectcrm-pipeline-filtros-salvos');
    if (filtrosSalvosStorage) {
      try {
        setFiltrosSalvos(JSON.parse(filtrosSalvosStorage));
      } catch (err) {
        console.error('Erro ao carregar filtros salvos:', err);
      }
    }
  }, []);

  const normalizeIntegerWithinRange = (value: number, min: number, max: number) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return min;
    }
    return Math.min(max, Math.max(min, Math.round(numericValue)));
  };

  const stalePolicyHasChanges = useMemo(() => {
    if (!stalePolicy) return false;
    return (
      stalePolicy.enabled !== stalePolicyDraft.enabled ||
      stalePolicy.thresholdDays !==
        normalizeIntegerWithinRange(
          stalePolicyDraft.thresholdDays,
          STALE_THRESHOLD_MIN,
          STALE_THRESHOLD_MAX,
        ) ||
      stalePolicy.autoArchiveEnabled !== stalePolicyDraft.autoArchiveEnabled ||
      stalePolicy.autoArchiveAfterDays !==
        normalizeIntegerWithinRange(
          stalePolicyDraft.autoArchiveAfterDays,
          STALE_AUTO_ARCHIVE_MIN,
          STALE_AUTO_ARCHIVE_MAX,
        )
    );
  }, [stalePolicy, stalePolicyDraft]);

  const syncStalePolicyDraft = useCallback((policy: StalePolicyDecision) => {
    setStalePolicyDraft({
      enabled: Boolean(policy.enabled),
      thresholdDays: policy.thresholdDays,
      autoArchiveEnabled: Boolean(policy.autoArchiveEnabled),
      autoArchiveAfterDays: policy.autoArchiveAfterDays,
    });
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    if (!isAuthenticated) {
      setError('Você precisa estar autenticado para acessar esta página.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      setLoading(false);
      return;
    }
    void carregarDados();
  }, [isAuthenticated, navigate, lifecycleView]);

  useEffect(() => {
    const oportunidadeIdParam = searchParams.get('oportunidadeId');
    if (!oportunidadeIdParam || loading) {
      return;
    }

    const oportunidade = oportunidades.find((item) => String(item.id) === oportunidadeIdParam);
    if (!oportunidade) {
      return;
    }

    setOportunidadeDetalhes(oportunidade);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('oportunidadeId');
    setSearchParams(nextParams, { replace: true });
  }, [loading, oportunidades, searchParams, setSearchParams]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const lifecycleDecision = await oportunidadesService
        .obterLifecycleFeatureFlag()
        .catch(() => ({ enabled: false, source: 'disabled', rolloutPercentage: 0 }));
      const lifecycleEnabled = Boolean(lifecycleDecision.enabled);
      setLifecycleFeatureEnabled(lifecycleEnabled);

      if (!lifecycleEnabled && lifecycleView !== LifecycleViewOportunidade.OPEN) {
        setLifecycleView(LifecycleViewOportunidade.OPEN);
      }

      const lifecycleFilters: Partial<FiltrosOportunidade> = lifecycleEnabled
        ? {
            lifecycle_view: lifecycleView,
            include_deleted: lifecycleView === LifecycleViewOportunidade.DELETED,
          }
        : {};

      const staleDealsPromise: Promise<StaleDealsResult | null> =
        lifecycleEnabled && lifecycleView === LifecycleViewOportunidade.OPEN
          ? oportunidadesService.listarOportunidadesParadas({ limit: 2000 }).catch(() => null)
          : Promise.resolve(null);

      let stalePolicyPromise: Promise<StalePolicyDecision | null> = Promise.resolve(null);
      if (lifecycleEnabled) {
        setStalePolicyLoading(true);
        stalePolicyPromise = oportunidadesService.obterStalePolicy().catch(() => null);
      } else {
        setStalePolicy(null);
      }

      // Carregar oportunidades e usuários em paralelo
      const [dados, stats, usuariosData, staleDealsResult, stalePolicyData] = await Promise.all([
        oportunidadesService.listarOportunidades(lifecycleFilters),
        oportunidadesService.obterEstatisticas(lifecycleFilters),
        carregarUsuarios(),
        staleDealsPromise,
        stalePolicyPromise,
      ]);

      const staleById = new Map(
        (staleDealsResult?.stale || []).map((oportunidade: Oportunidade) => [
          String(oportunidade.id),
          oportunidade,
        ]),
      );
      const dadosComStale =
        staleById.size > 0
          ? dados.map((oportunidade) => {
              const stale = staleById.get(String(oportunidade.id));
              if (!stale) return oportunidade;
              return {
                ...oportunidade,
                is_stale: stale.is_stale,
                stale_days: stale.stale_days,
                stale_since: stale.stale_since,
                last_interaction_at: stale.last_interaction_at,
              };
            })
          : dados;

      setOportunidades(dadosComStale);
      setEstatisticas(stats);
      setUsuarios(usuariosData);
      if (stalePolicyData) {
        setStalePolicy(stalePolicyData);
        syncStalePolicyDraft(stalePolicyData);
      } else if (lifecycleEnabled) {
        setStalePolicy(null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);

      // Tratamento específico para erro 401 (Unauthorized)
      if (err?.response?.status === 401) {
        setError('Sua sessão expirou. Por favor, faça login novamente.');
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          localStorage.removeItem('authToken'); // ✅ Corrigido para 'authToken'
          localStorage.removeItem('refreshToken');
          navigate('/login');
        }, 2000);
      } else {
        const errorMessage =
          err?.response?.data?.message || err.message || 'Erro ao carregar oportunidades';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setStalePolicyLoading(false);
    }
  };

  // Carregar lista de usuários para os selects
  const handleSalvarStalePolicy = async () => {
    if (!canManageStalePolicy) {
      toastService.warning('Você não possui permissão para alterar essa configuração.');
      return;
    }

    const payload = {
      enabled: stalePolicyDraft.enabled,
      thresholdDays: normalizeIntegerWithinRange(
        stalePolicyDraft.thresholdDays,
        STALE_THRESHOLD_MIN,
        STALE_THRESHOLD_MAX,
      ),
      autoArchiveEnabled: stalePolicyDraft.enabled ? stalePolicyDraft.autoArchiveEnabled : false,
      autoArchiveAfterDays: normalizeIntegerWithinRange(
        stalePolicyDraft.autoArchiveAfterDays,
        STALE_AUTO_ARCHIVE_MIN,
        STALE_AUTO_ARCHIVE_MAX,
      ),
    };

    try {
      setStalePolicySaving(true);
      const updatedPolicy = await oportunidadesService.atualizarStalePolicy(payload);
      setStalePolicy(updatedPolicy);
      syncStalePolicyDraft(updatedPolicy);
      toastService.success('Política de oportunidades paradas atualizada.');
      await carregarDados();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toastService.error('Sem permissão para atualizar a política stale.');
      } else {
        toastService.error('Não foi possível atualizar a política stale.');
      }
    } finally {
      setStalePolicySaving(false);
    }
  };

  const handleResetStalePolicyDraft = () => {
    if (!stalePolicy) return;
    syncStalePolicyDraft(stalePolicy);
  };

  const carregarUsuarios = async (): Promise<Usuario[]> => {
    try {
      setLoadingUsuarios(true);
      const response = await usuariosService.listarUsuarios({ ativo: true });
      return response.usuarios || [];
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      return [];
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Abrir modal para criar nova oportunidade
  const handleNovaOportunidade = (estagio: EstagioOportunidade = EstagioOportunidade.LEADS) => {
    if (lifecycleFeatureEnabled && lifecycleView !== LifecycleViewOportunidade.OPEN) {
      toastService.warning('Para criar oportunidade, altere para a visão "Abertas".');
      return;
    }

    setOportunidadeEditando(null);
    setEstagioNovaOportunidade(estagio);
    setShowModal(true);
  };

  const getLifecycleStatus = (oportunidade: Oportunidade): LifecycleStatusOportunidade => {
    if (oportunidade.lifecycle_status) return oportunidade.lifecycle_status;
    if (oportunidade.estagio === EstagioOportunidade.GANHO) return LifecycleStatusOportunidade.WON;
    if (oportunidade.estagio === EstagioOportunidade.PERDIDO)
      return LifecycleStatusOportunidade.LOST;
    return LifecycleStatusOportunidade.OPEN;
  };

  const isTerminalStage = (estagio: EstagioOportunidade): boolean =>
    estagio === EstagioOportunidade.GANHO || estagio === EstagioOportunidade.PERDIDO;

  const canMarkOpportunityAsWon = (oportunidade: Oportunidade): boolean =>
    lifecycleFeatureEnabled &&
    getLifecycleStatus(oportunidade) === LifecycleStatusOportunidade.OPEN &&
    oportunidade.estagio === EstagioOportunidade.FECHAMENTO;

  const canMarkOpportunityAsLost = (oportunidade: Oportunidade): boolean =>
    lifecycleFeatureEnabled &&
    getLifecycleStatus(oportunidade) === LifecycleStatusOportunidade.OPEN &&
    !isTerminalStage(oportunidade.estagio);

  const isOpportunityOpenForProcess = (oportunidade: Oportunidade): boolean =>
    !lifecycleFeatureEnabled || getLifecycleStatus(oportunidade) === LifecycleStatusOportunidade.OPEN;

  const canEditOpportunity = (oportunidade: Oportunidade): boolean =>
    isOpportunityOpenForProcess(oportunidade) && !isTerminalStage(oportunidade.estagio);

  const canDuplicateOpportunity = (oportunidade: Oportunidade): boolean =>
    isOpportunityOpenForProcess(oportunidade) && !isTerminalStage(oportunidade.estagio);

  const canCreateProposalDraft = (oportunidade: Oportunidade): boolean => {
    if (!isOpportunityOpenForProcess(oportunidade)) {
      return false;
    }

    return (
      oportunidade.estagio === EstagioOportunidade.PROPOSTA ||
      oportunidade.estagio === EstagioOportunidade.NEGOCIACAO ||
      oportunidade.estagio === EstagioOportunidade.FECHAMENTO
    );
  };

  const canManipulateKanban =
    !lifecycleFeatureEnabled || lifecycleView === LifecycleViewOportunidade.OPEN;

  // Abrir modal para editar oportunidade existente
  const handleEditarOportunidade = (oportunidade: Oportunidade) => {
    if (!canEditOpportunity(oportunidade)) {
      toastService.warning(
        'Edicao disponivel apenas para oportunidades abertas e fora dos estagios Ganho/Perdido.',
      );
      return;
    }

    setOportunidadeEditando(oportunidade);
    setShowModal(true);
  };

  // Abrir modal de detalhes
  const handleVerDetalhes = (oportunidade: Oportunidade) => {
    setOportunidadeDetalhes(oportunidade);
  };

  // Abrir modal para confirmar exclusao
  const handleDeletarOportunidade = (oportunidade: Oportunidade) => {
    setDeleteMode(getDeleteModeForOpportunity(oportunidade));
    setOportunidadeDeletar(oportunidade);
    setShowModalDeletar(true);
  };

  // Confirmar exclusao
  const handleConfirmarDelecao = async () => {
    if (!oportunidadeDeletar) return;

    try {
      setLoadingDeletar(true);
      if (deleteMode === 'permanente') {
        await oportunidadesService.excluirOportunidadePermanente(oportunidadeDeletar.id);
        toastService.success('Oportunidade excluida permanentemente.');
      } else {
        await oportunidadesService.excluirOportunidade(oportunidadeDeletar.id);
        toastService.success('Oportunidade enviada para a lixeira.');
      }
      if (oportunidadeDetalhes?.id === oportunidadeDeletar.id) {
        setOportunidadeDetalhes(null);
      }

      // Recarregar estatísticas
      await carregarDados();
    } catch (err) {
      console.error('Erro ao deletar oportunidade:', err);
      toastService.error('Erro ao deletar oportunidade');
    } finally {
      setLoadingDeletar(false);
      setShowModalDeletar(false);
      setOportunidadeDeletar(null);
      setDeleteMode('soft');
    }
  };

  const handleArquivarOportunidade = async (oportunidade: Oportunidade) => {
    await oportunidadesService.arquivarOportunidade(oportunidade.id);
    toastService.success('Oportunidade arquivada com sucesso.');
    await carregarDados();
  };

  const handleRestaurarOportunidade = async (oportunidade: Oportunidade) => {
    await oportunidadesService.restaurarOportunidade(oportunidade.id);
    toastService.success('Oportunidade restaurada com sucesso.');
    await carregarDados();
  };

  const handleReabrirOportunidade = async (oportunidade: Oportunidade) => {
    await oportunidadesService.reabrirOportunidade(oportunidade.id);
    toastService.success('Oportunidade reaberta com sucesso.');
    await carregarDados();
  };

  const handlePrepararPerdaOportunidade = (oportunidade: Oportunidade) => {
    if (!canMarkOpportunityAsLost(oportunidade)) {
      toastService.warning('Apenas oportunidades abertas podem ser marcadas como perdidas.');
      return;
    }

    setOpenCardActionsMenuId(null);
    setOpenListActionsMenuId(null);
    setErroMotivoPerda(null);
    setDraggedItem(null);
    setOportunidadeParaPerder(oportunidade);
    setShowModalMotivoPerda(true);
  };

  const handleMarcarOportunidadeComoGanha = async (oportunidade: Oportunidade) => {
    if (!canMarkOpportunityAsWon(oportunidade)) {
      toastService.warning(
        'Somente oportunidades abertas em Fechamento podem ser marcadas como ganho.',
      );
      return;
    }

    const confirmou = await confirm({
      title: 'Marcar oportunidade como ganha',
      message:
        'Ao confirmar, a oportunidade sera encerrada como ganha e saira da visao Abertas.',
      confirmText: 'Marcar como ganho',
      cancelText: 'Cancelar',
      confirmButtonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      icon: 'success',
    });

    if (!confirmou) {
      return;
    }

    try {
      setLoadingMudancaEstagio(true);
      setErroMudancaEstagio(null);
      setOpenCardActionsMenuId(null);
      setOpenListActionsMenuId(null);
      setDraggedItem(null);

      await oportunidadesService.atualizarEstagio(oportunidade.id, {
        estagio: EstagioOportunidade.GANHO,
      });

      if (oportunidadeDetalhes?.id === oportunidade.id) {
        setOportunidadeDetalhes(null);
      }

      await carregarDados();
      toastService.success('Oportunidade marcada como ganha com sucesso!');
    } catch (err) {
      console.error('Erro ao marcar oportunidade como ganha:', err);
      const errorMessage = extrairMensagemErroApi(
        err,
        'Erro ao marcar oportunidade como ganha',
      );
      toastService.error(errorMessage);
      setErroMudancaEstagio(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingMudancaEstagio(false);
    }
  };

  const handleExcluirPermanenteOportunidade = async (oportunidade: Oportunidade) => {
    await oportunidadesService.excluirOportunidadePermanente(oportunidade.id);
    toastService.success('Oportunidade excluida permanentemente.');
    await carregarDados();
  };

  const getDeleteModeForOpportunity = (oportunidade: Oportunidade): 'soft' | 'permanente' => {
    const lifecycleStatus = getLifecycleStatus(oportunidade);
    const shouldDeletePermanently =
      lifecycleFeatureEnabled &&
      (lifecycleView === LifecycleViewOportunidade.DELETED ||
        lifecycleStatus === LifecycleStatusOportunidade.DELETED);

    return shouldDeletePermanently ? 'permanente' : 'soft';
  };

  const handleLifecyclePrimaryAction = async (oportunidade: Oportunidade) => {
    if (!lifecycleFeatureEnabled) return;

    const lifecycleStatus = getLifecycleStatus(oportunidade);

    try {
      if (
        lifecycleStatus === LifecycleStatusOportunidade.ARCHIVED ||
        lifecycleStatus === LifecycleStatusOportunidade.DELETED
      ) {
        await handleRestaurarOportunidade(oportunidade);
        return;
      }

      if (
        oportunidade.estagio === EstagioOportunidade.GANHO ||
        oportunidade.estagio === EstagioOportunidade.PERDIDO
      ) {
        await handleReabrirOportunidade(oportunidade);
        return;
      }

      await handleArquivarOportunidade(oportunidade);
    } catch (err) {
      console.error('Erro ao executar acao de ciclo de vida:', err);
      toastService.error('Não foi possível concluir a ação de ciclo de vida.');
    }
  };

  // Clonar oportunidade
  const handleClonarOportunidade = (oportunidade: Oportunidade) => {
    if (!canDuplicateOpportunity(oportunidade)) {
      toastService.warning(
        'Duplicacao disponivel apenas para oportunidades abertas e fora dos estagios Ganho/Perdido.',
      );
      return;
    }
    // Criar cópia dos dados (sem ID e datas)
    const oportunidadeClonada = {
      titulo: `${oportunidade.titulo} (Cópia)`,
      descricao: oportunidade.descricao,
      valor: oportunidade.valor,
      estagio: oportunidade.estagio,
      probabilidade: oportunidade.probabilidade,
      prioridade: oportunidade.prioridade,
      origem: oportunidade.origem,
      dataFechamentoEsperado: oportunidade.dataFechamentoEsperado,
      nomeContato: oportunidade.nomeContato,
      emailContato: oportunidade.emailContato,
      telefoneContato: oportunidade.telefoneContato,
      empresaContato: oportunidade.empresaContato,
      clienteId: (oportunidade as any).clienteId || (oportunidade as any).cliente_id,
      responsavelId: (oportunidade as any).responsavelId || (oportunidade as any).responsavel_id,
    };

    // Abrir modal de edição com dados clonados
    setOportunidadeEditando(oportunidadeClonada as any);
    setShowModal(true);
    toastService.success('Oportunidade duplicada! Edite e salve para criar a cópia.');
  };

  // Gerar proposta a partir da oportunidade
  const handleGerarProposta = async (oportunidade: Oportunidade, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canCreateProposalDraft(oportunidade)) {
      toastService.warning(
        'Rascunho de proposta disponivel apenas para oportunidades abertas em Proposta, Negociacao ou Fechamento.',
      );
      return;
    }

    try {
      const response = await oportunidadesService.gerarProposta(oportunidade.id);
      toastService.success('Rascunho de proposta criado. Complete os itens na tela de Propostas.');

      // Redirecionar para a página de propostas com a proposta recém-criada
      navigate(`/vendas/propostas?proposta=${response.proposta.id}&mode=edit&origem=pipeline`);
    } catch (err: unknown) {
      console.error('Erro ao gerar proposta:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar proposta';
      toastService.error(errorMessage);
    }
  };

  // Salvar filtro atual
  const handleSalvarFiltro = () => {
    if (!nomeFiltroSalvar.trim()) {
      toastService.error('Digite um nome para o filtro');
      return;
    }

    const novoFiltro = {
      id: Date.now().toString(),
      nome: nomeFiltroSalvar.trim(),
      filtros: { ...filtros },
    };

    const novosFiltros = [...filtrosSalvos, novoFiltro];
    setFiltrosSalvos(novosFiltros);
    localStorage.setItem('conectcrm-pipeline-filtros-salvos', JSON.stringify(novosFiltros));

    setShowModalSalvarFiltro(false);
    setNomeFiltroSalvar('');
    toastService.success('Filtro salvo com sucesso!');
  };

  // Aplicar filtro salvo
  const handleAplicarFiltroSalvo = (filtroId: string) => {
    const filtro = filtrosSalvos.find((f) => f.id === filtroId);
    if (filtro) {
      setFiltros(filtro.filtros);
      setFiltroSelecionado(filtroId);
      setPaginaAtual(1);
      toastService.success(`Filtro "${filtro.nome}" aplicado`);
    }
  };

  // Deletar filtro salvo
  const handleDeletarFiltroSalvo = (filtroId: string) => {
    const novosFiltros = filtrosSalvos.filter((f) => f.id !== filtroId);
    setFiltrosSalvos(novosFiltros);
    localStorage.setItem('conectcrm-pipeline-filtros-salvos', JSON.stringify(novosFiltros));

    if (filtroSelecionado === filtroId) {
      setFiltroSelecionado(null);
    }

    toastService.success('Filtro deletado');
  };

  // Limpar filtros
  const handleLimparFiltros = () => {
    setFiltros({
      busca: '',
      estagio: '',
      prioridade: '',
      origem: '',
      valorMin: '',
      valorMax: '',
      responsavel: '',
    });
    setFiltroSelecionado(null);
    setPaginaAtual(1);
  };

  // Função de ordenação
  const handleOrdenar = (campo: typeof ordenacao.campo) => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
    setPaginaAtual(1); // Reset para primeira página ao ordenar
  };

  // Função para obter ícone de ordenação
  const getIconeOrdenacao = (campo: typeof ordenacao.campo) => {
    if (ordenacao.campo !== campo) return null;
    return ordenacao.direcao === 'asc' ? '↑' : '↓';
  };

  // Salvar oportunidade (criar ou atualizar)
  const handleSalvarOportunidade = async (data: NovaOportunidade) => {
    try {
      const estagioAlterado =
        !oportunidadeEditando || oportunidadeEditando.estagio !== data.estagio;
      if (lifecycleFeatureEnabled && estagioAlterado && isTerminalStage(data.estagio)) {
        const mensagem =
          data.estagio === EstagioOportunidade.GANHO
            ? 'Use a acao "Marcar como ganho" para encerrar a oportunidade.'
            : 'Use a acao "Marcar como perdido" para registrar a perda com motivo.';
        toastService.warning(mensagem);
        throw new Error(mensagem);
      }

      if (oportunidadeEditando) {
        // Atualizar existente
        await oportunidadesService.atualizarOportunidade({ id: oportunidadeEditando.id, ...data });
      } else {
        // Criar nova
        await oportunidadesService.criarOportunidade(data);
      }

      // Recarregar dados
      await carregarDados();
      setShowModal(false);
      setOportunidadeEditando(null);
      toastService.success(
        oportunidadeEditando
          ? 'Oportunidade atualizada com sucesso!'
          : 'Oportunidade criada com sucesso!',
      );
    } catch (err) {
      console.error('Erro ao salvar oportunidade:', err);
      toastService.error('Erro ao salvar oportunidade');
      throw err; // Deixar o modal tratar o erro
    }
  };

  // Exportar oportunidades
  // Exportar oportunidades
  const handleExport = async (formato: 'csv' | 'excel' | 'pdf') => {
    try {
      console.log(
        `Exportando ${oportunidadesFiltradas.length} oportunidades no formato ${formato}`,
      );

      const dataAtual = new Date().toISOString().split('T')[0];

      if (formato === 'csv') {
        // CSV Export
        const csv = [
          'Título,Estágio,Valor,Probabilidade,Prioridade,Origem,Contato,Email,Telefone,Empresa,Responsável,Data Esperada',
          ...oportunidadesFiltradas.map(
            (op) =>
              `"${op.titulo}","${op.estagio}","${formatarMoeda(op.valor)}","${op.probabilidade}%","${op.prioridade || ''}","${op.origem || ''}","${op.nomeContato || ''}","${op.emailContato || ''}","${op.telefoneContato || ''}","${op.empresaContato || ''}","${op.responsavel?.nome || ''}","${op.dataFechamentoEsperado || ''}"`,
          ),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `oportunidades_${dataAtual}.csv`;
        link.click();
      } else if (formato === 'excel') {
        // Excel Export usando xlsx
        const dadosExcel = oportunidadesFiltradas.map((op) => ({
          Título: op.titulo,
          Estágio: op.estagio,
          Valor: op.valor,
          'Probabilidade (%)': op.probabilidade,
          Prioridade: op.prioridade || '',
          Origem: op.origem || '',
          Contato: op.nomeContato || '',
          Email: op.emailContato || '',
          Telefone: op.telefoneContato || '',
          Empresa: op.empresaContato || '',
          Responsável: op.responsavel?.nome || '',
          'Data Esperada': op.dataFechamentoEsperado || '',
          Descrição: op.descricao || '',
        }));

        // Criar workbook
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();

        // Ajustar largura das colunas
        const colWidths = [
          { wch: 30 }, // Título
          { wch: 15 }, // Estágio
          { wch: 15 }, // Valor
          { wch: 12 }, // Probabilidade
          { wch: 12 }, // Prioridade
          { wch: 15 }, // Origem
          { wch: 25 }, // Contato
          { wch: 30 }, // Email
          { wch: 18 }, // Telefone
          { wch: 25 }, // Empresa
          { wch: 20 }, // Responsável
          { wch: 15 }, // Data Esperada
          { wch: 50 }, // Descrição
        ];
        ws['!cols'] = colWidths;

        // Adicionar aba de Oportunidades
        XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');

        // Adicionar aba de Estatísticas
        if (estatisticas) {
          const statsData = [
            { Métrica: 'Total de Oportunidades', Valor: estatisticas.totalOportunidades },
            {
              Métrica: 'Valor Total do Pipeline',
              Valor: formatarMoeda(estatisticas.valorTotalPipeline),
            },
            { Métrica: 'Ticket Médio', Valor: formatarMoeda(estatisticas.valorMedio) },
            { Métrica: 'Taxa de Conversão', Valor: `${estatisticas.taxaConversao.toFixed(1)}%` },
          ];
          const wsStats = XLSX.utils.json_to_sheet(statsData);
          wsStats['!cols'] = [{ wch: 30 }, { wch: 25 }];
          XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas');
        }

        // Adicionar aba por Estágio
        const stagingData = ESTAGIOS_CONFIG.map((estagio) => {
          const opsEstagio = oportunidadesFiltradas.filter((op) => op.estagio === estagio.id);
          const valorTotal = opsEstagio.reduce((sum, op) => sum + op.valor, 0);
          return {
            Estágio: estagio.nome,
            Quantidade: opsEstagio.length,
            'Valor Total': formatarMoeda(valorTotal),
            'Valor Médio':
              opsEstagio.length > 0 ? formatarMoeda(valorTotal / opsEstagio.length) : 'R$ 0,00',
          };
        });
        const wsStaging = XLSX.utils.json_to_sheet(stagingData);
        wsStaging['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, wsStaging, 'Por Estágio');

        // Salvar arquivo
        XLSX.writeFile(wb, `oportunidades_${dataAtual}.xlsx`);
      } else if (formato === 'pdf') {
        // PDF Export usando jspdf
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 35, 51); // #002333
        doc.text('Pipeline de Vendas', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
        doc.text(`Total de oportunidades: ${oportunidadesFiltradas.length}`, 14, 34);

        // Estatísticas (se houver)
        if (estatisticas) {
          let yPos = 45;
          doc.setFontSize(14);
          doc.setTextColor(0, 35, 51);
          doc.text('Resumo Executivo', 14, yPos);

          yPos += 8;
          doc.setFontSize(10);
          doc.setTextColor(64, 64, 64);
          doc.text(
            `• Valor Total do Pipeline: ${formatarMoeda(estatisticas.valorTotalPipeline)}`,
            14,
            yPos,
          );
          yPos += 6;
          doc.text(`• Ticket Médio: ${formatarMoeda(estatisticas.valorMedio)}`, 14, yPos);
          yPos += 6;
          doc.text(`• Taxa de Conversão: ${estatisticas.taxaConversao.toFixed(1)}%`, 14, yPos);
          yPos += 10;
        }

        // Tabela de Oportunidades
        const tableData = oportunidadesFiltradas.map((op) => [
          op.titulo,
          op.estagio,
          formatarMoeda(op.valor),
          `${op.probabilidade}%`,
          op.nomeContato || '-',
          op.responsavel?.nome || '-',
        ]);

        autoTable(doc, {
          startY: estatisticas ? 75 : 45,
          head: [['Título', 'Estágio', 'Valor', 'Prob.', 'Contato', 'Responsável']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [21, 154, 156], // #159A9C
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
          },
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 35 },
            5: { cellWidth: 30 },
          },
          margin: { top: 10 },
        });

        // Rodapé
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' },
          );
        }

        // Salvar PDF
        doc.save(`oportunidades_${dataAtual}.pdf`);
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      throw err;
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (oportunidade: Oportunidade) => {
    if (!canManipulateKanban) return;

    const lifecycleStatus = getLifecycleStatus(oportunidade);
    if (lifecycleFeatureEnabled && lifecycleStatus !== LifecycleStatusOportunidade.OPEN) {
      return;
    }

    setDraggedItem(oportunidade);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getNomeEstagio = (estagio: EstagioOportunidade): string =>
    ESTAGIOS_CONFIG.find((item) => item.id === estagio)?.nome || estagio;

  const handleDrop = async (novoEstagio: EstagioOportunidade) => {
    if (!draggedItem) return;

    if (!canManipulateKanban) {
      toastService.warning('Movimentação no Kanban está disponível apenas na visão "Abertas".');
      setDraggedItem(null);
      return;
    }

    const lifecycleStatus = getLifecycleStatus(draggedItem);
    if (lifecycleFeatureEnabled && lifecycleStatus !== LifecycleStatusOportunidade.OPEN) {
      toastService.warning('Somente oportunidades abertas podem ser movimentadas no Kanban.');
      setDraggedItem(null);
      return;
    }

    const estagioAtual = draggedItem.estagio;

    // Não faz nada se soltar no mesmo estágio
    if (estagioAtual === novoEstagio) {
      setDraggedItem(null);
      return;
    }

    if (
      lifecycleFeatureEnabled &&
      (novoEstagio === EstagioOportunidade.GANHO || novoEstagio === EstagioOportunidade.PERDIDO)
    ) {
      toastService.warning(
        'Use as acoes "Marcar como ganho" ou "Marcar como perdido" para encerrar a oportunidade.',
      );
      setDraggedItem(null);
      return;
    }

    // ✅ Se for movido para PERDIDO, abrir modal de motivo de perda
    const permitidos = ALLOWED_STAGE_TRANSITIONS[estagioAtual] || [];
    if (!permitidos.includes(novoEstagio)) {
      const listaPermitidos = permitidos.map((stage) => getNomeEstagio(stage)).join(', ');
      toastService.warning(
        `Transicao invalida: ${getNomeEstagio(estagioAtual)} -> ${getNomeEstagio(novoEstagio)}. Permitidos: ${listaPermitidos || 'nenhum'}.`,
      );
      setDraggedItem(null);
      return;
    }

    if (novoEstagio === EstagioOportunidade.PERDIDO) {
      setOportunidadeParaPerder(draggedItem);
      setErroMotivoPerda(null);
      setShowModalMotivoPerda(true);
      return;
    }

    // Para outros estágios, abrir modal para registrar motivo da mudança
    setMudancaEstagioData({
      oportunidade: draggedItem,
      novoEstagio: novoEstagio,
    });
    setErroMudancaEstagio(null);
    setShowModalMudancaEstagio(true);
  };

  const extrairMensagemErroApi = (err: any, fallback: string) => {
    const message = err?.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  // Confirmar mudança de estágio com motivo registrado
  const handleConfirmarMudancaEstagio = async (
    motivo: string,
    comentario: string,
    proximaAcao?: Date,
  ) => {
    if (!mudancaEstagioData) return;

    try {
      setLoadingMudancaEstagio(true);
      setErroMotivoPerda(null);
      setErroMudancaEstagio(null);

      const { oportunidade, novoEstagio } = mudancaEstagioData;

      // Atualizar estágio no backend
      await oportunidadesService.atualizarEstagio(oportunidade.id, {
        estagio: novoEstagio,
      });

      // Criar atividade de histórico
      const descricaoAtividade = [
        `Oportunidade movida de "${ESTAGIOS_CONFIG.find((e) => e.id === oportunidade.estagio)?.nome}" para "${ESTAGIOS_CONFIG.find((e) => e.id === novoEstagio)?.nome}"`,
        `Motivo: ${motivo}`,
        comentario ? `\nDetalhes: ${comentario}` : '',
        proximaAcao
          ? `\nPróxima ação agendada para: ${new Date(proximaAcao).toLocaleDateString('pt-BR')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await oportunidadesService.criarAtividade({
          oportunidadeId: oportunidade.id,
          tipo: TipoAtividade.NOTA,
          descricao: descricaoAtividade,
          dataAtividade: new Date(),
        });
      } catch (err) {
        console.warn('Erro ao criar atividade de histórico:', err);
        // Continua mesmo se falhar ao criar atividade
      }

      // Atualizar estado local
      await carregarDados();

      // Recarregar estatísticas

      // Fechar modal
      setShowModalMudancaEstagio(false);
      setMudancaEstagioData(null);
      setDraggedItem(null);
      setErroMudancaEstagio(null);

      // Toast de sucesso (você pode usar uma lib de toast aqui)
      toastService.success('Oportunidade movida com sucesso!');
    } catch (err) {
      console.error('Erro ao mover oportunidade:', err);
      const errorMessage = extrairMensagemErroApi(err, 'Erro ao mover oportunidade');
      toastService.error(errorMessage);
      setErroMudancaEstagio(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingMudancaEstagio(false);
    }
  };

  // ✅ Confirmar perda com motivo obrigatório
  const handleConfirmarPerda = async (dados: {
    motivoPerda: string;
    motivoPerdaDetalhes?: string;
    concorrenteNome?: string;
    dataRevisao?: string;
  }) => {
    if (!oportunidadeParaPerder) return;

    try {
      setLoadingMudancaEstagio(true);

      // Atualizar estágio para PERDIDO com motivo
      await oportunidadesService.atualizarEstagio(oportunidadeParaPerder.id, {
        estagio: EstagioOportunidade.PERDIDO,
        motivoPerda: dados.motivoPerda,
        motivoPerdaDetalhes: dados.motivoPerdaDetalhes,
        concorrenteNome: dados.concorrenteNome,
        dataRevisao: dados.dataRevisao,
      });

      // Atualizar estado local
      await carregarDados();

      // Recarregar estatísticas

      // Fechar modal
      setShowModalMotivoPerda(false);
      setOportunidadeParaPerder(null);
      setDraggedItem(null);
      setErroMotivoPerda(null);
      if (oportunidadeDetalhes?.id === oportunidadeParaPerder.id) {
        setOportunidadeDetalhes(null);
      }

      toastService.success('Oportunidade marcada como perdida com sucesso!');
    } catch (err: any) {
      console.error('Erro ao marcar oportunidade como perdida:', err);
      const errorMessage = extrairMensagemErroApi(
        err,
        'Erro ao marcar oportunidade como perdida',
      );
      toastService.error(errorMessage);
      setErroMotivoPerda(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingMudancaEstagio(false);
    }
  };

  // Filtrar oportunidades com filtros avançados
  const oportunidadesFiltradas = oportunidades.filter((op) => {
    // Filtro por busca (texto)
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const matchBusca =
        op.titulo.toLowerCase().includes(busca) ||
        op.descricao?.toLowerCase().includes(busca) ||
        op.nomeContato?.toLowerCase().includes(busca) ||
        op.empresaContato?.toLowerCase().includes(busca) ||
        op.emailContato?.toLowerCase().includes(busca) ||
        op.telefoneContato?.toLowerCase().includes(busca);
      if (!matchBusca) return false;
    }

    // Filtro por estágio
    if (filtros.estagio && op.estagio !== filtros.estagio) {
      return false;
    }

    // Filtro por prioridade
    if (filtros.prioridade && op.prioridade !== filtros.prioridade) {
      return false;
    }

    // Filtro por origem
    if (filtros.origem && op.origem !== filtros.origem) {
      return false;
    }

    // Filtro por responsável
    if (filtros.responsavel && op.responsavel?.id !== filtros.responsavel) {
      return false;
    }

    // Filtro por valor mínimo
    if (filtros.valorMin) {
      const valorMin = parseFloat(filtros.valorMin);
      if (!isNaN(valorMin) && op.valor < valorMin) {
        return false;
      }
    }

    // Filtro por valor máximo
    if (filtros.valorMax) {
      const valorMax = parseFloat(filtros.valorMax);
      if (!isNaN(valorMax) && op.valor > valorMax) {
        return false;
      }
    }

    return true;
  });

  // Aplicar ordenação
  const oportunidadesOrdenadas = [...oportunidadesFiltradas].sort((a, b) => {
    const multiplicador = ordenacao.direcao === 'asc' ? 1 : -1;

    switch (ordenacao.campo) {
      case 'valor':
        return (Number(a.valor) - Number(b.valor)) * multiplicador;

      case 'dataFechamentoEsperado':
        const dataA = a.dataFechamentoEsperado ? new Date(a.dataFechamentoEsperado).getTime() : 0;
        const dataB = b.dataFechamentoEsperado ? new Date(b.dataFechamentoEsperado).getTime() : 0;
        return (dataA - dataB) * multiplicador;

      case 'probabilidade':
        return (Number(a.probabilidade) - Number(b.probabilidade)) * multiplicador;

      case 'estagio':
        const ordemEstagios = Object.values(EstagioOportunidade);
        const indexA = ordemEstagios.indexOf(a.estagio);
        const indexB = ordemEstagios.indexOf(b.estagio);
        return (indexA - indexB) * multiplicador;

      case 'titulo':
        return a.titulo.localeCompare(b.titulo) * multiplicador;

      default:
        return 0;
    }
  });

  // Aplicar paginação
  const totalPaginas = Math.ceil(oportunidadesOrdenadas.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const oportunidadesPaginadas = oportunidadesOrdenadas.slice(indexInicio, indexFim);

  // Transformar oportunidades em eventos de calendário
  const eventosCalendario = useMemo(() => {
    return oportunidadesFiltradas.map((op) => {
      // Usar dataFechamentoEsperado se existir, senão usar updatedAt
      const dataEvento = op.dataFechamentoEsperado
        ? new Date(op.dataFechamentoEsperado)
        : new Date(op.updatedAt);

      // Encontrar cor do estágio
      const estagioConfig = ESTAGIOS_CONFIG.find((e) => e.id === op.estagio);
      const cor = estagioConfig?.accentColor || '#159A9C';

      return {
        id: op.id,
        title: op.titulo,
        start: dataEvento,
        end: dataEvento,
        resource: op,
        color: cor,
      };
    });
  }, [oportunidadesFiltradas]);

  // Dados para gráficos
  const dadosGraficos = useMemo(() => {
    // 1. Funil de conversão (Oportunidades por estágio)
    const funil = ESTAGIOS_CONFIG.map((estagio) => {
      const oportunidadesEstagio = oportunidadesFiltradas.filter((op) => op.estagio === estagio.id);
      return {
        nome: estagio.nome,
        quantidade: oportunidadesEstagio.length,
        valor: oportunidadesEstagio.reduce((acc, op) => acc + Number(op.valor || 0), 0),
        cor: estagio.accentColor,
      };
    });

    // 2. Valor por estágio (para gráfico de barras horizontal)
    const valorPorEstagio = funil.map((item) => ({
      nome: item.nome,
      valor: item.valor,
      cor: item.cor,
    }));

    // 3. Taxa de conversão (% entre estágios)
    const totalLeads = funil[0]?.quantidade || 1;
    const taxaConversao = ESTAGIOS_CONFIG.map((estagio, index) => {
      const qtd = funil[index]?.quantidade || 0;
      return {
        nome: estagio.nome,
        taxa: totalLeads > 0 ? ((qtd / totalLeads) * 100).toFixed(1) : 0,
        quantidade: qtd,
      };
    });

    // 4. Origem das oportunidades (pizza)
    const origemCount: Record<string, number> = {};
    oportunidadesFiltradas.forEach((op) => {
      const origem = op.origem || 'Não informado';
      origemCount[origem] = (origemCount[origem] || 0) + 1;
    });
    const origens = Object.entries(origemCount).map(([nome, value]) => ({
      nome,
      value,
    }));

    // 5. Performance por responsável (top 5)
    const responsavelStats: Record<string, { nome: string; quantidade: number; valor: number }> =
      {};
    oportunidadesFiltradas.forEach((op) => {
      const respId = op.responsavel?.id || 'sem-responsavel';
      const respNome = op.responsavel?.nome || 'Sem responsável';
      if (!responsavelStats[respId]) {
        responsavelStats[respId] = { nome: respNome, quantidade: 0, valor: 0 };
      }
      responsavelStats[respId].quantidade++;
      responsavelStats[respId].valor += Number(op.valor || 0);
    });
    const performance = Object.values(responsavelStats)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return {
      funil,
      valorPorEstagio,
      taxaConversao,
      origens,
      performance,
    };
  }, [oportunidadesFiltradas]);

  // Agrupar por estágio
  const estagiosKanbanVisiveis = useMemo(() => {
    if (!lifecycleFeatureEnabled) return ESTAGIOS_CONFIG;

    if (lifecycleView === LifecycleViewOportunidade.OPEN) {
      return ESTAGIOS_CONFIG.filter(
        (estagio) =>
          estagio.id !== EstagioOportunidade.GANHO && estagio.id !== EstagioOportunidade.PERDIDO,
      );
    }

    if (lifecycleView === LifecycleViewOportunidade.CLOSED) {
      return ESTAGIOS_CONFIG.filter(
        (estagio) =>
          estagio.id === EstagioOportunidade.GANHO || estagio.id === EstagioOportunidade.PERDIDO,
      );
    }

    return ESTAGIOS_CONFIG;
  }, [lifecycleFeatureEnabled, lifecycleView]);

  useEffect(() => {
    if (!filtros.estagio) {
      return;
    }

    const estagioSelecionado = filtros.estagio as EstagioOportunidade;
    const estagioPermitido = estagiosKanbanVisiveis.some((estagio) => estagio.id === estagioSelecionado);

    if (!estagioPermitido) {
      setFiltros((prev) => ({ ...prev, estagio: '' }));
    }
  }, [filtros.estagio, estagiosKanbanVisiveis]);

  const agrupadoPorEstagio = useMemo(() => {
    return estagiosKanbanVisiveis.map((estagio) => ({
      ...estagio,
      oportunidades: oportunidadesFiltradas.filter((op) => op.estagio === estagio.id),
    }));
  }, [estagiosKanbanVisiveis, oportunidadesFiltradas]);

  // Calcular métricas
  const calcularValorTotal = (oportunidades: Oportunidade[]) => {
    return oportunidades.reduce((acc, op) => acc + Number(op.valor || 0), 0);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const hasActiveFilters = Boolean(
    filtros.responsavel ||
      filtros.busca ||
      filtros.estagio ||
      filtros.prioridade ||
      filtros.origem ||
      filtros.valorMin ||
      filtros.valorMax,
  );

  const activeKanbanFilterChips = useMemo(() => {
    const chips: Array<{ label: string; value: string }> = [];

    const busca = filtros.busca?.trim();
    if (busca) chips.push({ label: 'Busca', value: busca });

    if (lifecycleFeatureEnabled) {
      const lifecycleLabel =
        LIFECYCLE_VIEW_OPTIONS.find((option) => option.id === lifecycleView)?.label || 'Abertas';
      chips.push({ label: 'Carteira', value: lifecycleLabel });
    }

    if (filtros.estagio) {
      const estagioNome = ESTAGIOS_CONFIG.find((e) => e.id === filtros.estagio)?.nome || filtros.estagio;
      chips.push({ label: 'Estágio', value: estagioNome });
    }

    if (filtros.prioridade) {
      const prioridadeLabelMap: Record<string, string> = {
        [PrioridadeOportunidade.BAIXA]: 'Baixa',
        [PrioridadeOportunidade.MEDIA]: 'Média',
        [PrioridadeOportunidade.ALTA]: 'Alta',
      };
      chips.push({
        label: 'Prioridade',
        value: prioridadeLabelMap[filtros.prioridade] || filtros.prioridade,
      });
    }

    if (filtros.origem) {
      const origemLabelMap: Record<string, string> = {
        [OrigemOportunidade.WEBSITE]: 'Website',
        [OrigemOportunidade.INDICACAO]: 'Indicação',
        [OrigemOportunidade.REDES_SOCIAIS]: 'Redes Sociais',
        [OrigemOportunidade.EVENTO]: 'Evento',
        [OrigemOportunidade.CAMPANHA]: 'Campanha',
        [OrigemOportunidade.TELEFONE]: 'Telefone',
        [OrigemOportunidade.EMAIL]: 'Email',
        [OrigemOportunidade.PARCEIRO]: 'Parceiro',
      };
      chips.push({ label: 'Origem', value: origemLabelMap[filtros.origem] || filtros.origem });
    }

    const valorMin = filtros.valorMin?.trim();
    const valorMax = filtros.valorMax?.trim();
    if (valorMin || valorMax) {
      const minNumber = valorMin ? Number(valorMin) : null;
      const maxNumber = valorMax ? Number(valorMax) : null;
      const formatOrRaw = (value: number | null, raw: string | undefined) => {
        if (value === null) return raw || '';
        if (Number.isFinite(value)) return formatarMoeda(value);
        return raw || '';
      };

      const minLabel = formatOrRaw(minNumber, valorMin);
      const maxLabel = formatOrRaw(maxNumber, valorMax);

      if (minLabel && maxLabel) chips.push({ label: 'Valor', value: `${minLabel}–${maxLabel}` });
      else if (minLabel) chips.push({ label: 'Valor ≥', value: minLabel });
      else if (maxLabel) chips.push({ label: 'Valor ≤', value: maxLabel });
    }

    if (filtros.responsavel) {
      const responsavelNome =
        usuarios.find((u) => u.id === filtros.responsavel)?.nome || filtros.responsavel;
      chips.push({ label: 'Responsável', value: responsavelNome });
    }

    return chips;
  }, [filtros, lifecycleFeatureEnabled, lifecycleView, usuarios]);

  if (loading) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <SectionCard className="p-6 sm:p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
              <p className="text-[#002333]/60">Carregando pipeline...</p>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1 sm:pt-2">
      <SectionCard className="space-y-3 p-3 sm:p-4">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Target className="h-5 w-5 text-[#159A9C]" />
              <span>Pipeline de Vendas</span>
            </span>
          }
          description="Gerencie suas oportunidades de venda atraves de um funil visual"
          actions={
            <button
              onClick={() => handleNovaOportunidade()}
              disabled={lifecycleFeatureEnabled && lifecycleView !== LifecycleViewOportunidade.OPEN}
              title={
                lifecycleFeatureEnabled && lifecycleView !== LifecycleViewOportunidade.OPEN
                  ? 'Troque para "Abertas" para criar oportunidades'
                  : 'Nova Oportunidade'
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Nova Oportunidade
            </button>
          }
        />

        {estatisticas && (
          <InlineStats
            stats={[
              { label: 'Oportunidades', value: String(estatisticas.totalOportunidades), tone: 'neutral' },
              { label: 'Pipeline', value: formatarMoeda(estatisticas.valorTotalPipeline), tone: 'accent' },
              { label: 'Conversão', value: `${estatisticas.taxaConversao.toFixed(1)}%`, tone: 'accent' },
            ]}
          />
        )}

        {lifecycleFeatureEnabled && (
          <div className="space-y-3 rounded-lg border border-[#B4BEC9]/40 bg-[#DEEFE7]/30 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#214251]">
                <Archive className="h-3.5 w-3.5 text-[#159A9C]" />
                <span>Carteira do Pipeline</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setWorkspaceTab((prev) => (prev === 'parametros' ? 'pipeline' : 'parametros'))
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  workspaceTab === 'parametros'
                    ? 'border-[#159A9C] bg-[#DEEFE7]/80 text-[#0F7B7D]'
                    : 'border-[#B4BEC9]/70 bg-white text-[#002333] hover:bg-[#DEEFE7]/60'
                }`}
                title={
                  workspaceTab === 'parametros'
                    ? 'Fechar configuracoes da pagina'
                    : 'Abrir configuracoes da pagina'
                }
              >
                <Settings2 className="h-3.5 w-3.5" />
                Configurar
              </button>
            </div>
            {workspaceTab === 'parametros' && (
              <div className="space-y-3 rounded-lg border border-[#B4BEC9]/35 bg-white/80 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#002333]">
                      Política de oportunidades paradas
                    </p>
                    <p className="text-xs text-[#002333]/65">
                      Define quando mostrar o alerta "Parada Xd" e quando arquivar automaticamente.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#B4BEC9]/45 bg-[#DEEFE7]/50 px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                      {stalePolicyLoading
                        ? 'Carregando...'
                        : stalePolicy
                          ? `Política: ${stalePolicy.source === 'tenant' ? 'tenant' : 'default'}`
                          : 'Política indisponível'}
                    </span>
                    {stalePolicy && (
                      <span className="rounded-full border border-[#B4BEC9]/45 bg-white px-2 py-0.5 text-xs font-medium text-[#002333]/70">
                        Auto: {stalePolicy.autoArchiveSource === 'tenant' ? 'tenant' : 'default'}
                      </span>
                    )}
                    {stalePolicyHasChanges && (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Alterações não salvas
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9]/50 bg-white px-3 py-2 text-sm text-[#002333]">
                    <input
                      type="checkbox"
                      checked={stalePolicyDraft.enabled}
                      onChange={(event) =>
                        setStalePolicyDraft((prev) => ({
                          ...prev,
                          enabled: event.target.checked,
                        }))
                      }
                      disabled={!canManageStalePolicy || stalePolicyLoading || stalePolicySaving}
                      className="h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                    />
                    Ativar detecção de oportunidades paradas
                  </label>

                  <div className="rounded-lg border border-[#B4BEC9]/50 bg-white px-3 py-2">
                    <label className="mb-1 block text-xs font-medium text-[#002333]/70">
                      Limite para marcar parada (dias)
                    </label>
                    <input
                      type="number"
                      min={STALE_THRESHOLD_MIN}
                      max={STALE_THRESHOLD_MAX}
                      value={stalePolicyDraft.thresholdDays}
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        if (!Number.isFinite(parsed)) return;
                        setStalePolicyDraft((prev) => ({ ...prev, thresholdDays: parsed }));
                      }}
                      onBlur={(event) => {
                        const normalized = normalizeIntegerWithinRange(
                          Number(event.target.value),
                          STALE_THRESHOLD_MIN,
                          STALE_THRESHOLD_MAX,
                        );
                        setStalePolicyDraft((prev) => ({ ...prev, thresholdDays: normalized }));
                      }}
                      disabled={
                        !canManageStalePolicy ||
                        stalePolicyLoading ||
                        stalePolicySaving ||
                        !stalePolicyDraft.enabled
                      }
                      className="w-full rounded-lg border border-[#B4BEC9]/70 px-3 py-1.5 text-sm text-[#002333] focus:border-[#159A9C] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8FAFB] disabled:opacity-70"
                    />
                    <p className="mt-1 text-[11px] text-[#002333]/55">
                      Faixa permitida: {STALE_THRESHOLD_MIN} a {STALE_THRESHOLD_MAX} dias.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9]/50 bg-white px-3 py-2 text-sm text-[#002333]">
                    <input
                      type="checkbox"
                      checked={stalePolicyDraft.autoArchiveEnabled}
                      onChange={(event) =>
                        setStalePolicyDraft((prev) => ({
                          ...prev,
                          autoArchiveEnabled: event.target.checked,
                        }))
                      }
                      disabled={
                        !canManageStalePolicy ||
                        stalePolicyLoading ||
                        stalePolicySaving ||
                        !stalePolicyDraft.enabled
                      }
                      className="h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                    />
                    Autoarquivar oportunidades paradas
                  </label>

                  <div className="rounded-lg border border-[#B4BEC9]/50 bg-white px-3 py-2">
                    <label className="mb-1 block text-xs font-medium text-[#002333]/70">
                      Dias para autoarquivar
                    </label>
                    <input
                      type="number"
                      min={STALE_AUTO_ARCHIVE_MIN}
                      max={STALE_AUTO_ARCHIVE_MAX}
                      value={stalePolicyDraft.autoArchiveAfterDays}
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        if (!Number.isFinite(parsed)) return;
                        setStalePolicyDraft((prev) => ({
                          ...prev,
                          autoArchiveAfterDays: parsed,
                        }));
                      }}
                      onBlur={(event) => {
                        const normalized = normalizeIntegerWithinRange(
                          Number(event.target.value),
                          STALE_AUTO_ARCHIVE_MIN,
                          STALE_AUTO_ARCHIVE_MAX,
                        );
                        setStalePolicyDraft((prev) => ({
                          ...prev,
                          autoArchiveAfterDays: normalized,
                        }));
                      }}
                      disabled={
                        !canManageStalePolicy ||
                        stalePolicyLoading ||
                        stalePolicySaving ||
                        !stalePolicyDraft.enabled ||
                        !stalePolicyDraft.autoArchiveEnabled
                      }
                      className="w-full rounded-lg border border-[#B4BEC9]/70 px-3 py-1.5 text-sm text-[#002333] focus:border-[#159A9C] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8FAFB] disabled:opacity-70"
                    />
                    <p className="mt-1 text-[11px] text-[#002333]/55">
                      Faixa permitida: {STALE_AUTO_ARCHIVE_MIN} a {STALE_AUTO_ARCHIVE_MAX} dias.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[#002333]/60">
                    {canManageStalePolicy
                      ? 'Apenas usuários com permissão de automações conseguem salvar alterações.'
                      : 'Somente leitura: sem permissão para alterar esta política.'}
                  </p>
                  {canManageStalePolicy && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetStalePolicyDraft}
                        disabled={!stalePolicy || stalePolicySaving || !stalePolicyHasChanges}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-1.5 text-sm font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reverter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSalvarStalePolicy();
                        }}
                        disabled={
                          !stalePolicy ||
                          stalePolicyLoading ||
                          stalePolicySaving ||
                          !stalePolicyHasChanges
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {stalePolicySaving ? 'Salvando...' : 'Salvar política'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
      {showPipelineWorkspace && (
        <>
      {/* Barra de trabalho sticky */}
            <SectionCard className="sticky top-2 z-10 border border-[#B4BEC9]/40 bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:p-4">
        <div className="flex flex-col gap-3">
          {lifecycleFeatureEnabled && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#607B89]">
                Carteira
              </span>
              {LIFECYCLE_VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setLifecycleView(option.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    lifecycleView === option.id
                      ? 'border-[#159A9C] bg-[#159A9C] text-white'
                      : 'border-[#B4BEC9]/70 bg-white text-[#002333] hover:bg-[#DEEFE7]/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <span className="text-xs text-[#002333]/60">
                {LIFECYCLE_VIEW_DESCRIPTIONS[lifecycleView]}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full flex flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <span className="text-sm font-medium text-[#002333]">Visualização:</span>
            <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1 sm:flex sm:flex-wrap sm:items-center sm:gap-1">
              <button
                data-testid="pipeline-view-kanban"
                onClick={() => setVisualizacao('kanban')}
                type="button"
                aria-pressed={visualizacao === 'kanban'}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                  visualizacao === 'kanban'
                    ? 'bg-white text-[#159A9C] shadow-sm'
                    : 'text-[#002333]/60 hover:text-[#002333]'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Kanban
              </button>
              <button
                data-testid="pipeline-view-lista"
                onClick={() => setVisualizacao('lista')}
                type="button"
                aria-pressed={visualizacao === 'lista'}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                  visualizacao === 'lista'
                    ? 'bg-white text-[#159A9C] shadow-sm'
                    : 'text-[#002333]/60 hover:text-[#002333]'
                }`}
              >
                <List className="h-4 w-4" />
                Lista
              </button>
              <button
                data-testid="pipeline-view-calendario"
                onClick={() => setVisualizacao('calendario')}
                type="button"
                aria-pressed={visualizacao === 'calendario'}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                  visualizacao === 'calendario'
                    ? 'bg-white text-[#159A9C] shadow-sm'
                    : 'text-[#002333]/60 hover:text-[#002333]'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Calendário
              </button>
              <button
                data-testid="pipeline-view-grafico"
                onClick={() => setVisualizacao('grafico')}
                type="button"
                aria-pressed={visualizacao === 'grafico'}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                  visualizacao === 'grafico'
                    ? 'bg-white text-[#159A9C] shadow-sm'
                    : 'text-[#002333]/60 hover:text-[#002333]'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Gráficos
              </button>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            {visualizacao === 'kanban' && (
              <button
                type="button"
                onClick={() => setKanbanExpanded((prev) => !prev)}
                className="p-2 text-[#002333]/60 hover:text-[#002333] hover:bg-[#DEEFE7]/60 rounded-lg transition-colors"
                title={kanbanExpanded ? 'Sair da visualização ampliada' : 'Ampliar Kanban'}
                aria-label={kanbanExpanded ? 'Sair da visualização ampliada' : 'Ampliar Kanban'}
              >
                {kanbanExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              data-testid="pipeline-refresh"
              onClick={() => carregarDados()}
              disabled={loading}
              type="button"
              className="p-2 text-[#002333]/60 hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar"
              aria-label="Atualizar dados do pipeline"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              data-testid="pipeline-export"
              onClick={() => setShowModalExport(true)}
              type="button"
              className="p-2 text-[#002333]/60 hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors"
              title="Exportar"
              aria-label="Exportar oportunidades"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="w-full sm:flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
            <input
              type="text"
              placeholder="Buscar oportunidades..."
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium ${
                showFiltros
                  ? 'bg-[#159A9C] text-white border-[#159A9C]'
                  : 'bg-white text-[#002333] border-[#B4BEC9] hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
            {hasActiveFilters && (
              <>
                <button
                  onClick={handleLimparFiltros}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </button>
                <button
                  onClick={() => setShowModalSalvarFiltro(true)}
                  className="px-4 py-2 bg-[#159A9C]/10 text-[#0F7B7D] hover:bg-[#159A9C]/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Save className="h-4 w-4" />
                  Salvar Filtro
                </button>
              </>
            )}

            {/* Dropdown de Filtros Salvos */}
            {filtrosSalvos.length > 0 && (
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() =>
                    document.getElementById('dropdown-filtros')?.classList.toggle('hidden')
                  }
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                    filtroSelecionado
                      ? 'bg-[#159A9C]/10 text-[#0F7B7D] border-transparent'
                      : 'bg-white text-[#002333] border-[#B4BEC9] hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                  Filtros ({filtrosSalvos.length})
                </button>
                <div
                  id="dropdown-filtros"
                  className="hidden absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                >
                  <div className="p-2">
                    <p className="text-xs font-semibold text-[#002333]/60 uppercase tracking-wide px-3 py-2">
                      Filtros Salvos
                    </p>
                    {filtrosSalvos.map((filtro) => (
                      <div
                        key={filtro.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg group"
                      >
                        <button
                          onClick={() => {
                            handleAplicarFiltroSalvo(filtro.id);
                            document.getElementById('dropdown-filtros')?.classList.add('hidden');
                          }}
                          className="flex-1 text-left text-sm text-[#002333] font-medium"
                        >
                          {filtroSelecionado === filtro.id && '✓ '}
                          {filtro.nome}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (await confirm(`Deletar filtro "${filtro.nome}"?`)) {
                              handleDeletarFiltroSalvo(filtro.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        </div>

        {/* Painel de Filtros Expandido */}
        {showFiltros && (
          <div className="mt-4 w-full border-t pt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Estágio */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">Estágio</label>
              <select
                value={filtros.estagio}
                onChange={(e) => setFiltros({ ...filtros, estagio: e.target.value })}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
              >
                <option value="">Todos os estágios</option>
                {estagiosKanbanVisiveis.map((estagio) => (
                  <option key={estagio.id} value={estagio.id}>
                    {estagio.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">Prioridade</label>
              <select
                value={filtros.prioridade}
                onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
              >
                <option value="">Todas as prioridades</option>
                <option value={PrioridadeOportunidade.BAIXA}>Baixa</option>
                <option value={PrioridadeOportunidade.MEDIA}>Média</option>
                <option value={PrioridadeOportunidade.ALTA}>Alta</option>
              </select>
            </div>

            {/* Origem */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">Origem</label>
              <select
                value={filtros.origem}
                onChange={(e) => setFiltros({ ...filtros, origem: e.target.value })}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
              >
                <option value="">Todas as origens</option>
                <option value={OrigemOportunidade.WEBSITE}>Website</option>
                <option value={OrigemOportunidade.INDICACAO}>Indicação</option>
                <option value={OrigemOportunidade.REDES_SOCIAIS}>Redes Sociais</option>
                <option value={OrigemOportunidade.EVENTO}>Evento</option>
                <option value={OrigemOportunidade.CAMPANHA}>Campanha</option>
                <option value={OrigemOportunidade.TELEFONE}>Telefone</option>
                <option value={OrigemOportunidade.EMAIL}>Email</option>
                <option value={OrigemOportunidade.PARCEIRO}>Parceiro</option>
              </select>
            </div>

            {/* Valor Mínimo */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Valor Mínimo (R$)
              </label>
              <input
                type="number"
                placeholder="Ex: 1000"
                value={filtros.valorMin}
                onChange={(e) => setFiltros({ ...filtros, valorMin: e.target.value })}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                min="0"
                step="100"
              />
            </div>

            {/* Valor Máximo */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Valor Máximo (R$)
              </label>
              <input
                type="number"
                placeholder="Ex: 50000"
                value={filtros.valorMax}
                onChange={(e) => setFiltros({ ...filtros, valorMax: e.target.value })}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                min="0"
                step="100"
              />
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">Responsável</label>
              <select
                value={filtros.responsavel}
                onChange={(e) => setFiltros({ ...filtros, responsavel: e.target.value })}
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                disabled={loadingUsuarios}
              >
                <option value="">
                  {loadingUsuarios ? 'Carregando...' : 'Todos os responsáveis'}
                </option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">Erro ao Carregar Dados</h3>
              <p className="text-red-800 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => carregarDados()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Tentar Novamente
                </button>
                {error.includes('sessão expirou') || error.includes('autenticado') ? (
                  <button
                    onClick={() => {
                      localStorage.removeItem('authToken'); // ✅ Corrigido para 'authToken'
                      localStorage.removeItem('refreshToken');
                      navigate('/login');
                    }}
                    className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Fazer Login
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualização Kanban */}
      {visualizacao === 'kanban' && (
        <div className={kanbanExpanded ? 'fixed inset-0 z-50 bg-[#F3F6F7] text-[#1E3A4B]' : undefined}>
          {kanbanExpanded && (
            <div className="min-h-14 px-4 sm:px-5 py-2 flex flex-col gap-2 border-b border-[#D6E2E6] bg-white/95 backdrop-blur-[2px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#19384C]">
                  <Grid3X3 className="h-4 w-4 text-[#159A9C]" />
                  <span className="text-sm font-semibold">Pipeline • Kanban</span>
                </div>
                <button
                  type="button"
                  onClick={() => setKanbanExpanded(false)}
                  className="p-2 rounded-lg text-[#002333]/70 hover:text-[#002333] hover:bg-[#DEEFE7]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/25"
                  aria-label="Fechar visualização ampliada do Kanban"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {activeKanbanFilterChips.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-medium text-[#607B89] whitespace-nowrap">Filtros:</span>
                  <div className="flex items-center gap-2">
                    {activeKanbanFilterChips.map((chip) => (
                      <span
                        key={`${chip.label}-${chip.value}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#B4BEC9]/55 bg-white px-2.5 py-1 text-[12px] text-[#244455] whitespace-nowrap"
                        title={`${chip.label}: ${chip.value}`}
                      >
                        <span className="text-[#6C8794]">{chip.label}:</span>
                        <strong className="text-[#1E3A4B] font-semibold">{chip.value}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={kanbanExpanded ? 'h-[calc(100vh-3.5rem)] px-4 sm:px-5 pt-3 pb-4' : undefined}>
            {!canManipulateKanban && (
              <div className="mb-3 rounded-lg border border-[#B4BEC9]/50 bg-white px-3 py-2 text-sm text-[#002333]/80">
                A movimentação de cards e a criação direta por coluna ficam disponíveis apenas na
                visão "Abertas".
              </div>
            )}
            <div
              className={
                kanbanExpanded
                  ? 'flex gap-3 sm:gap-4 overflow-x-auto pb-3 h-full'
                  : 'flex gap-3 sm:gap-4 overflow-x-auto pb-3 -mx-1 px-1 sm:mx-0 sm:px-0 h-[min(72vh,calc(100vh-22rem))]'
              }
            >
          {agrupadoPorEstagio.map((estagio) => (
            <div
              key={estagio.id}
              data-testid={`pipeline-column-${estagio.id}`}
              className="flex-shrink-0 w-[min(18rem,calc(100vw-5rem))] sm:w-72 flex flex-col h-full"
              role="region"
              aria-labelledby={`pipeline-column-title-${estagio.id}`}
            >
              {/* Header da Coluna */}
              <div className={`${estagio.headerClass} rounded-t-lg p-2.5 sm:p-3`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      {estagio.id === EstagioOportunidade.LEADS
                        ? '🎯'
                        : estagio.id === EstagioOportunidade.QUALIFICACAO
                          ? '✅'
                          : estagio.id === EstagioOportunidade.PROPOSTA
                            ? '📄'
                            : estagio.id === EstagioOportunidade.NEGOCIACAO
                              ? '🤝'
                              : '🎉'}
                    </span>
                    <h3
                      id={`pipeline-column-title-${estagio.id}`}
                      className="text-xs sm:text-sm font-semibold text-[#002333]"
                    >
                      {estagio.nome}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DEEFE7] text-[#002333] border border-[#B4BEC9]/55">
                      {estagio.oportunidades.length}
                    </span>
                    <button
                      onClick={() => handleNovaOportunidade(estagio.id)}
                      type="button"
                      disabled={!canManipulateKanban}
                      className="p-1.5 hover:bg-[#DEEFE7]/70 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/25 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={
                        canManipulateKanban
                          ? `Adicionar oportunidade em ${estagio.nome}`
                          : 'Criação por coluna disponível apenas na visão Abertas'
                      }
                      title={
                        canManipulateKanban
                          ? `Adicionar oportunidade em ${estagio.nome}`
                          : 'Disponível apenas na visão Abertas'
                      }
                      style={{ color: estagio.accentColor }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#002333]/70 font-semibold">
                  {formatarMoeda(calcularValorTotal(estagio.oportunidades))}
                </p>
              </div>

              {/* Cards das Oportunidades */}
              <div
                data-testid={`pipeline-column-dropzone-${estagio.id}`}
                className="bg-[#DEEFE7]/35 rounded-b-lg p-2 space-y-2 border border-[#B4BEC9]/40 border-t-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]"
                onDragOver={canManipulateKanban ? handleDragOver : undefined}
                onDrop={canManipulateKanban ? () => handleDrop(estagio.id) : undefined}
              >
                {estagio.oportunidades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-4 opacity-20">
                      {estagio.id === EstagioOportunidade.LEADS
                        ? '🎯'
                        : estagio.id === EstagioOportunidade.QUALIFICACAO
                          ? '✅'
                          : estagio.id === EstagioOportunidade.PROPOSTA
                            ? '📄'
                            : estagio.id === EstagioOportunidade.NEGOCIACAO
                              ? '🤝'
                              : '🎉'}
                    </div>
                    <p className="text-[#002333]/40 text-sm font-medium">Nenhuma oportunidade</p>
                    <p className="text-[#002333]/30 text-xs mt-1">Arraste cards para cá</p>
                  </div>
                ) : (
                  estagio.oportunidades.map((oportunidade) => {
                    // Determinar cor da probabilidade (heat map)
                    const prob = oportunidade.probabilidade || 0;
                    const probColor =
                      prob <= 20
                        ? 'bg-red-100 text-red-700'
                        : prob <= 40
                          ? 'bg-orange-100 text-orange-700'
                          : prob <= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : prob <= 80
                              ? 'bg-green-100 text-green-700'
                              : 'bg-green-200 text-green-800';
                    const probEmoji =
                      prob <= 20
                        ? '❄️'
                        : prob <= 40
                          ? '🌤️'
                          : prob <= 60
                            ? '☀️'
                            : prob <= 80
                              ? '🔥'
                              : '🚀';

                    // Calcular SLA
                    const diasAteVencimento = oportunidade.dataFechamentoEsperado
                      ? differenceInDays(new Date(oportunidade.dataFechamentoEsperado), new Date())
                      : null;
                    const lifecycleStatusCard = getLifecycleStatus(oportunidade);
                    const deleteModeCard = getDeleteModeForOpportunity(oportunidade);
                    const staleDaysCard = Number(oportunidade.stale_days || 0);
                    const showStaleBadge =
                      Boolean(oportunidade.is_stale) &&
                      staleDaysCard > 0 &&
                      lifecycleStatusCard === LifecycleStatusOportunidade.OPEN &&
                      !isTerminalStage(oportunidade.estagio);
                    const showDeadlineWarningCard =
                      diasAteVencimento !== null &&
                      isOpportunityOpenForProcess(oportunidade) &&
                      !isTerminalStage(oportunidade.estagio);
                    const isDragEnabled =
                      canManipulateKanban &&
                      (!lifecycleFeatureEnabled ||
                        lifecycleStatusCard === LifecycleStatusOportunidade.OPEN) &&
                      oportunidade.estagio !== EstagioOportunidade.GANHO &&
                      oportunidade.estagio !== EstagioOportunidade.PERDIDO;
                    const cardId = String(oportunidade.id);
                    const cardActionsMenuOpen = openCardActionsMenuId === cardId;
                    const lifecyclePrimaryLabel =
                      lifecycleStatusCard === LifecycleStatusOportunidade.ARCHIVED ||
                      lifecycleStatusCard === LifecycleStatusOportunidade.DELETED
                        ? 'Restaurar'
                        : oportunidade.estagio === EstagioOportunidade.GANHO ||
                            oportunidade.estagio === EstagioOportunidade.PERDIDO
                          ? 'Reabrir'
                          : 'Arquivar';
                    const canMarkAsWonCard = canMarkOpportunityAsWon(oportunidade);
                    const canMarkAsLostCard = canMarkOpportunityAsLost(oportunidade);
                    const canEditCard = canEditOpportunity(oportunidade);
                    const canDuplicateCard = canDuplicateOpportunity(oportunidade);
                    const canCreateProposalCard = canCreateProposalDraft(oportunidade);
                    const showClosingQuickActionsCard =
                      oportunidade.estagio === EstagioOportunidade.FECHAMENTO &&
                      (canMarkAsWonCard || canMarkAsLostCard);

                    return (
                      <div
                        key={oportunidade.id}
                        data-testid={`pipeline-card-${oportunidade.id}`}
                        draggable={isDragEnabled}
                        onDragStart={(event) => {
                          if (!isDragEnabled) {
                            event.preventDefault();
                            return;
                          }
                          event.dataTransfer?.setData('text/plain', String(oportunidade.id));
                          if (event.dataTransfer) {
                            event.dataTransfer.effectAllowed = 'move';
                          }
                          handleDragStart(oportunidade);
                        }}
                        onClick={() => handleVerDetalhes(oportunidade)}
                        onDragEnd={() => setDraggedItem(null)}
                        onKeyDown={(e) => {
                          if (e.currentTarget !== e.target) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleVerDetalhes(oportunidade);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Abrir oportunidade: ${oportunidade.titulo}`}
                        aria-grabbed={draggedItem?.id === oportunidade.id}
                        className={`bg-white rounded-lg p-3 shadow-sm border border-[#B4BEC9]/35 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/30 ${
                          cardActionsMenuOpen ? 'z-40' : 'z-0'
                        }`}
                      >
                        {/* Header com avatar e badges */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {/* Avatar do responsável */}
                            {oportunidade.responsavel && (
                              <div
                                className="h-7 w-7 rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                                title={oportunidade.responsavel.nome}
                              >
                                {oportunidade.responsavel.nome?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            {/* Badge de prioridade */}
                            {oportunidade.prioridade === PrioridadeOportunidade.ALTA && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                Alta
                              </span>
                            )}
                            {(oportunidade as any).prioridade === 'urgente' && (
                              <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-semibold">
                                Urgente
                              </span>
                            )}
                            {showStaleBadge && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                Parada {staleDaysCard}d
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badge de SLA */}
                        {showDeadlineWarningCard && (
                          <>
                            {diasAteVencimento < 0 && (
                              <div className="mb-2 px-2 py-1 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-xs font-semibold text-red-700">
                                  Atrasado {Math.abs(diasAteVencimento)}d
                                </span>
                              </div>
                            )}
                            {diasAteVencimento >= 0 && diasAteVencimento < 7 && (
                              <div className="mb-2 px-2 py-1 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <span className="text-xs font-semibold text-yellow-700">
                                  Vence em {diasAteVencimento}d
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Título */}
                        <h4
                          className="font-semibold text-[#002333] text-sm mb-2 line-clamp-2 leading-snug"
                          title={oportunidade.titulo}
                        >
                          {oportunidade.titulo}
                        </h4>

                        {/* Valor em destaque */}
                        <div className="mb-2 pb-2 border-b border-gray-100">
                          <p className="text-lg font-bold text-[#0F7B7D]">
                            {formatarMoeda(Number(oportunidade.valor || 0))}
                          </p>
                        </div>

                        {/* Badge de Probabilidade com Heat Map */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#002333]/60 font-medium">Probabilidade</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${probColor} flex items-center gap-1`}
                          >
                            <span>{probEmoji}</span>
                            <span>{oportunidade.probabilidade}%</span>
                          </span>
                        </div>

                        {/* Cliente (prioritário) ou Contato */}
                        {oportunidade.cliente ? (
                          // Se tem cliente vinculado, mostra link clicável
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clientes/${oportunidade.cliente.id}`);
                            }}
                            type="button"
                            className="flex items-center gap-2 text-xs text-[#0F7B7D] hover:text-[#159A9C] hover:underline mb-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/25 rounded"
                            aria-label={`Abrir cliente ${oportunidade.cliente.nome}`}
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span className="truncate font-medium">
                              {oportunidade.cliente.nome}
                            </span>
                          </button>
                        ) : oportunidade.nomeContato ? (
                          // Se não tem cliente, mas tem nome de contato, mostra o contato
                          <div className="flex items-center gap-2 text-xs text-[#002333]/70 mb-2">
                            <Users className="h-3.5 w-3.5 text-[#159A9C]" />
                            <span className="truncate font-medium">{oportunidade.nomeContato}</span>
                          </div>
                        ) : null}

                        {oportunidade.propostaPrincipal && (
                          <div
                            className={`mb-2 rounded-lg border px-2 py-1.5 text-xs ${
                              oportunidade.propostaPrincipal.sugerePerda
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-[#B4BEC9]/60 bg-[#F6FAFB] text-[#244455]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5" />
                              <span className="font-semibold">
                                {oportunidade.propostaPrincipal.numero || 'Proposta principal'}
                              </span>
                              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
                                {oportunidade.propostaPrincipal.status}
                              </span>
                            </div>
                            {oportunidade.propostaPrincipal.sugerePerda && (
                              <div className="mt-1 text-[11px] font-medium">
                                Proposta rejeitada ou expirada. Avalie marcar a oportunidade como perdida.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Data */}
                        {oportunidade.dataFechamentoEsperado && (
                          <div className="flex items-center gap-2 text-xs text-[#002333]/70">
                            <Calendar className="h-3.5 w-3.5 text-[#159A9C]" />
                            <span className="font-medium">
                              {new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString(
                                'pt-BR',
                              )}
                            </span>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                          {showClosingQuickActionsCard ? (
                            <div className="flex items-center gap-1">
                              {canMarkAsWonCard && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleMarcarOportunidadeComoGanha(oportunidade);
                                  }}
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/25"
                                  title="Marcar como ganho"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Ganho
                                </button>
                              )}
                              {canMarkAsLostCard && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrepararPerdaOportunidade(oportunidade);
                                  }}
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25"
                                  title="Marcar como perdido"
                                >
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Perdido
                                </button>
                              )}
                            </div>
                          ) : lifecycleFeatureEnabled ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenCardActionsMenuId(null);
                                void handleLifecyclePrimaryAction(oportunidade);
                              }}
                              type="button"
                              className="inline-flex items-center gap-1 rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#0F7B7D] transition-colors hover:bg-[#DEEFE7]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/25"
                              title={`${lifecyclePrimaryLabel} oportunidade`}
                            >
                              {lifecyclePrimaryLabel === 'Arquivar' ? (
                                <Archive className="h-3.5 w-3.5" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              {lifecyclePrimaryLabel}
                            </button>
                          ) : (
                            <span className="text-xs text-[#002333]/55">Ações rápidas</span>
                          )}

                          <div className="relative ml-auto" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenCardActionsMenuId((prev) => (prev === cardId ? null : cardId));
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#002333] transition-colors hover:bg-[#DEEFE7]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/25"
                              aria-expanded={cardActionsMenuOpen}
                              aria-label="Abrir menu de ações"
                            >
                              Ações
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>

                            {cardActionsMenuOpen && (
                              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#B4BEC9]/60 bg-white p-1 shadow-lg">
                                {lifecycleFeatureEnabled && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardActionsMenuId(null);
                                      void handleLifecyclePrimaryAction(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#0F7B7D] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    {lifecyclePrimaryLabel}
                                  </button>
                                )}
                                {canMarkAsWonCard && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardActionsMenuId(null);
                                      void handleMarcarOportunidadeComoGanha(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                                  >
                                    Marcar como ganho
                                  </button>
                                )}
                                {canMarkAsLostCard && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardActionsMenuId(null);
                                      handlePrepararPerdaOportunidade(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                                  >
                                    Marcar como perdido
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCardActionsMenuId(null);
                                    handleVerDetalhes(oportunidade);
                                  }}
                                  className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                >
                                  Ver detalhes
                                </button>
                                {canEditCard && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardActionsMenuId(null);
                                      handleEditarOportunidade(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    Editar
                                  </button>
                                )}
                                {canDuplicateCard && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardActionsMenuId(null);
                                      handleClonarOportunidade(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    Duplicar
                                  </button>
                                )}
                                {canCreateProposalCard && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenCardActionsMenuId(null);
                                      void handleGerarProposta(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    Criar rascunho de proposta
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCardActionsMenuId(null);
                                    handleDeletarOportunidade(oportunidade);
                                  }}
                                  className={`block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                                    deleteModeCard === 'permanente'
                                      ? 'text-red-700 hover:bg-red-100'
                                      : 'text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  {deleteModeCard === 'permanente'
                                    ? 'Excluir permanente'
                                    : 'Mover para lixeira'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
            </div>
          </div>
        </div>
      )}

      {/* Visualização Lista */}
      {visualizacao === 'lista' && (
        <DataTableCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#DEEFE7]/35 border-b border-[#B4BEC9]/40">
                <tr>
                  <th
                    onClick={() => handleOrdenar('titulo')}
                    className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-[#DEEFE7]/55 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Título
                      <span className="text-[#159A9C]">{getIconeOrdenacao('titulo')}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleOrdenar('estagio')}
                    className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-[#DEEFE7]/55 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Estágio
                      <span className="text-[#159A9C]">{getIconeOrdenacao('estagio')}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleOrdenar('valor')}
                    className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-[#DEEFE7]/55 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Valor
                      <span className="text-[#159A9C]">{getIconeOrdenacao('valor')}</span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleOrdenar('probabilidade')}
                    className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-[#DEEFE7]/55 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Probabilidade
                      <span className="text-[#159A9C]">{getIconeOrdenacao('probabilidade')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider">
                    Contato
                  </th>
                  <th
                    onClick={() => handleOrdenar('dataFechamentoEsperado')}
                    className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-[#DEEFE7]/55 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Data Esperada
                      <span className="text-[#159A9C]">
                        {getIconeOrdenacao('dataFechamentoEsperado')}
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#002333] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#B4BEC9]/25">
                {oportunidadesPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#002333]/60">
                      Nenhuma oportunidade encontrada
                    </td>
                  </tr>
                ) : (
                  oportunidadesPaginadas.map((oportunidade) => {
                    const estagioInfo = ESTAGIOS_CONFIG.find((e) => e.id === oportunidade.estagio);
                    const lifecycleStatus = getLifecycleStatus(oportunidade);
                    const deleteModeList = getDeleteModeForOpportunity(oportunidade);
                    const staleDaysList = Number(oportunidade.stale_days || 0);
                    const showStaleBadgeList =
                      Boolean(oportunidade.is_stale) &&
                      staleDaysList > 0 &&
                      lifecycleStatus === LifecycleStatusOportunidade.OPEN &&
                      !isTerminalStage(oportunidade.estagio);
                    const listRowId = String(oportunidade.id);
                    const listActionsMenuOpen = openListActionsMenuId === listRowId;
                    const lifecyclePrimaryLabelList =
                      lifecycleStatus === LifecycleStatusOportunidade.ARCHIVED ||
                      lifecycleStatus === LifecycleStatusOportunidade.DELETED
                        ? 'Restaurar'
                        : oportunidade.estagio === EstagioOportunidade.GANHO ||
                            oportunidade.estagio === EstagioOportunidade.PERDIDO
                          ? 'Reabrir'
                          : 'Arquivar';
                    const canMarkAsWonList = canMarkOpportunityAsWon(oportunidade);
                    const canMarkAsLostList = canMarkOpportunityAsLost(oportunidade);
                    const canEditList = canEditOpportunity(oportunidade);
                    const canDuplicateList = canDuplicateOpportunity(oportunidade);
                    const canCreateProposalList = canCreateProposalDraft(oportunidade);
                    return (
                      <tr
                        key={oportunidade.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleVerDetalhes(oportunidade)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#002333]">
                            {oportunidade.titulo}
                          </div>
                          {oportunidade.descricao && (
                            <div className="text-sm text-[#002333]/60 line-clamp-1">
                              {oportunidade.descricao}
                            </div>
                          )}
                          {showStaleBadgeList && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                Parada {staleDaysList}d
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estagioInfo?.badgeTextClass} ${estagioInfo?.badgeBgClass}`}
                          >
                            {estagioInfo?.nome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]">
                          {formatarMoeda(Number(oportunidade.valor || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]">
                          {oportunidade.probabilidade}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]/60">
                          {oportunidade.nomeContato || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]/60">
                          {oportunidade.dataFechamentoEsperado
                            ? new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString(
                                'pt-BR',
                              )
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div
                            className="relative inline-block text-left"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenListActionsMenuId((prev) =>
                                  prev === listRowId ? null : listRowId,
                                );
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#B4BEC9]/70 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                              aria-expanded={listActionsMenuOpen}
                              aria-label="Abrir menu de ações da linha"
                            >
                              Ações
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>

                            {listActionsMenuOpen && (
                              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-[#B4BEC9]/60 bg-white p-1 shadow-lg">
                                {lifecycleFeatureEnabled && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenListActionsMenuId(null);
                                      void handleLifecyclePrimaryAction(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#0F7B7D] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    {lifecyclePrimaryLabelList}
                                  </button>
                                )}
                                {canMarkAsWonList && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenListActionsMenuId(null);
                                      void handleMarcarOportunidadeComoGanha(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                                  >
                                    Marcar como ganho
                                  </button>
                                )}
                                {canMarkAsLostList && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenListActionsMenuId(null);
                                      handlePrepararPerdaOportunidade(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                                  >
                                    Marcar como perdido
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenListActionsMenuId(null);
                                    handleVerDetalhes(oportunidade);
                                  }}
                                  className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                >
                                  Ver detalhes
                                </button>
                                {canEditList && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenListActionsMenuId(null);
                                      handleEditarOportunidade(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    Editar
                                  </button>
                                )}
                                {canDuplicateList && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenListActionsMenuId(null);
                                      handleClonarOportunidade(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    Duplicar
                                  </button>
                                )}
                                {canCreateProposalList && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenListActionsMenuId(null);
                                      void handleGerarProposta(oportunidade);
                                    }}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/60"
                                  >
                                    Criar rascunho de proposta
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenListActionsMenuId(null);
                                    handleDeletarOportunidade(oportunidade);
                                  }}
                                  className={`block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                                    deleteModeList === 'permanente'
                                      ? 'text-red-700 hover:bg-red-100'
                                      : 'text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  {deleteModeList === 'permanente'
                                    ? 'Excluir permanente'
                                    : 'Mover para lixeira'}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="border-t border-[#B4BEC9]/35 px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[#DEEFE7]/35">
              <div className="text-xs sm:text-sm text-[#002333]/60">
                Mostrando {indexInicio + 1} a {Math.min(indexFim, oportunidadesOrdenadas.length)} de{' '}
                {oportunidadesOrdenadas.length} oportunidades
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1.5 border border-[#B4BEC9]/70 rounded-lg text-sm font-medium text-[#002333] hover:bg-[#DEEFE7]/55 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1 overflow-x-auto max-w-[130px] sm:max-w-none">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter((page) => {
                      // Mostrar apenas páginas próximas à atual
                      return (
                        page === 1 || page === totalPaginas || Math.abs(page - paginaAtual) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Adicionar "..." entre páginas não consecutivas
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && <span className="px-2 text-[#002333]/40">...</span>}
                          <button
                            onClick={() => setPaginaAtual(page)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              paginaAtual === page
                                ? 'bg-[#159A9C] text-white'
                                : 'text-[#002333] hover:bg-[#DEEFE7]/55'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-1.5 border border-[#B4BEC9]/70 rounded-lg text-sm font-medium text-[#002333] hover:bg-[#DEEFE7]/55 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </DataTableCard>
      )}

      {/* Visualização Calendário */}
      {visualizacao === 'calendario' && (
        <SectionCard className="overflow-hidden">
          <style>{`
                .rbc-calendar {
                  font-family: inherit;
                  min-height: 700px;
                }
                .rbc-header {
                  padding: 12px 6px;
                  font-weight: 600;
                  font-size: 14px;
                  color: #002333;
                  background-color: #DEEFE7;
                  border-bottom: 1px solid #B4BEC9;
                }
                .rbc-toolbar {
                  padding: 16px 24px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 1px solid #B4BEC9;
                  background-color: #FFFFFF;
                }
                .rbc-toolbar button {
                  padding: 8px 16px;
                  border: 1px solid #B4BEC9;
                  background-color: white;
                  color: #002333;
                  border-radius: 6px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                }
                .rbc-toolbar button:hover {
                  background-color: #DEEFE7;
                  border-color: #159A9C;
                }
                .rbc-toolbar button.rbc-active {
                  background-color: #159A9C;
                  color: white;
                  border-color: #159A9C;
                }
                .rbc-month-view {
                  border: none;
                }
                .rbc-month-row {
                  border: none;
                  overflow: visible;
                }
                .rbc-day-bg {
                  border: 1px solid #B4BEC9;
                }
                .rbc-off-range-bg {
                  background-color: #DEEFE7;
                }
                .rbc-today {
                  background-color: #DEEFE7 !important;
                }
                .rbc-event {
                  padding: 4px 8px;
                  border-radius: 4px;
                  border: none;
                  font-size: 12px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                  color: white !important;
                }
                .rbc-event:hover {
                  opacity: 0.9;
                  transform: translateY(-1px);
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .rbc-event.rbc-selected {
                  outline: 2px solid #159A9C;
                  outline-offset: 2px;
                }
                .rbc-event-label {
                  display: none;
                }
                .rbc-event-content {
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .rbc-date-cell {
                  padding: 6px;
                  text-align: right;
                  font-size: 14px;
                  font-weight: 500;
                  color: #002333;
                }
                .rbc-off-range .rbc-date-cell {
                  color: #9CA3AF;
                }
                .rbc-show-more {
                  color: #159A9C;
                  font-size: 12px;
                  font-weight: 600;
                  padding: 2px 4px;
                  cursor: pointer;
                  background-color: transparent;
                  border: none;
                }
                .rbc-show-more:hover {
                  text-decoration: underline;
                }
                @media (max-width: 640px) {
                  .rbc-calendar {
                    min-height: 560px;
                  }
                  .rbc-toolbar {
                    padding: 12px;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 8px;
                  }
                  .rbc-toolbar .rbc-toolbar-label {
                    margin: 4px 0;
                    text-align: center;
                    font-size: 14px;
                  }
                  .rbc-toolbar .rbc-btn-group {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 6px;
                  }
                  .rbc-toolbar button {
                    padding: 6px 10px;
                    font-size: 12px;
                  }
                  .rbc-header {
                    font-size: 11px;
                    padding: 8px 4px;
                  }
                  .rbc-date-cell {
                    padding: 4px;
                    font-size: 12px;
                  }
                }
              `}</style>

          <BigCalendar
            localizer={localizer}
            events={eventosCalendario}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            view={calendarView}
            onView={(view) => setCalendarView(view)}
            date={calendarDate}
            onNavigate={(date) => setCalendarDate(date)}
            onSelectEvent={(event: any) => {
              // Abrir modal da oportunidade ao clicar no evento
              if (event.resource) {
                handleEditarOportunidade(event.resource);
              }
            }}
            eventPropGetter={(event: any) => ({
              style: {
                backgroundColor: event.color,
                borderRadius: '4px',
                color: '#FFFFFF',
                border: 'none',
              },
            })}
            messages={{
              today: 'Hoje',
              previous: 'Anterior',
              next: 'Próximo',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
              date: 'Data',
              time: 'Hora',
              event: 'Evento',
              showMore: (total) => `+${total} mais`,
            }}
            formats={{
              monthHeaderFormat: (date) => format(date, 'MMMM yyyy', { locale: ptBR }),
              dayHeaderFormat: (date) => format(date, 'EEEE, dd/MM', { locale: ptBR }),
              dayRangeHeaderFormat: ({ start, end }) =>
                `${format(start, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM yyyy', { locale: ptBR })}`,
            }}
          />

          {/* Legenda de cores */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs font-semibold text-[#002333] mb-3">Legenda de Estágios:</p>
            <div className="flex flex-wrap gap-4">
              {ESTAGIOS_CONFIG.map((estagio) => (
                <div key={estagio.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${estagio.legendClass}`}></div>
                  <span className="text-xs text-[#002333]">{estagio.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Visualização Gráficos */}
      {visualizacao === 'grafico' && (
        <div className="space-y-6">
          {/* Grid 2x3 de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Funil de Conversão */}
            <SectionCard className="p-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#159A9C]" />
                Funil de Conversão
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={dadosGraficos.funil}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B4BEC9" />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 12, fill: '#002333' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#002333' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #B4BEC9',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [value, 'Oportunidades']}
                  />
                  <Bar dataKey="quantidade" fill="#159A9C" radius={[8, 8, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* 2. Valor por Estágio */}
            <SectionCard className="p-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#159A9C]" />
                Valor por Estágio
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={dadosGraficos.valorPorEstagio} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#B4BEC9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: '#002333' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    tick={{ fontSize: 12, fill: '#002333' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #B4BEC9',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(value),
                      'Valor',
                    ]}
                  />
                  <Bar dataKey="valor" fill="#0F7B7D" radius={[0, 8, 8, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* 3. Taxa de Conversão */}
            <SectionCard className="p-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#159A9C]" />
                Taxa de Conversão
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGraficos.taxaConversao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B4BEC9" />
                  <XAxis
                    dataKey="nome"
                    tick={{ fontSize: 12, fill: '#002333' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#002333' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #B4BEC9',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Taxa']}
                  />
                  <Line
                    type="monotone"
                    dataKey="taxa"
                    stroke="#159A9C"
                    strokeWidth={3}
                    dot={{ fill: '#159A9C', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* 4. Origem das Oportunidades */}
            <SectionCard className="p-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#159A9C]" />
                Origem das Oportunidades
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosGraficos.origens}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, percent }: any) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#159A9C"
                    dataKey="value"
                  >
                    {dadosGraficos.origens.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #B4BEC9',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* 5. Performance por Responsável */}
            <SectionCard className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#159A9C]" />
                Top 5 - Performance por Responsável
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={dadosGraficos.performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B4BEC9" />
                  <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#002333' }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fontSize: 12, fill: '#002333' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#002333' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #B4BEC9',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'valor') {
                        return [
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(value),
                          'Valor Total',
                        ];
                      }
                      return [value, 'Quantidade'];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="valor"
                    fill="#159A9C"
                    name="Valor"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="quantidade"
                    fill="#FBBF24"
                    name="Quantidade"
                    radius={[8, 8, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          {/* Resumo Estatístico */}
          <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Resumo do Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Total Oportunidades</p>
                <p className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                  {oportunidadesFiltradas.length}
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Valor Total</p>
                <p className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                  {formatarMoeda(calcularValorTotal(oportunidadesFiltradas))}
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Ticket Médio</p>
                <p className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                  {formatarMoeda(
                    oportunidadesFiltradas.length > 0
                      ? calcularValorTotal(oportunidadesFiltradas) / oportunidadesFiltradas.length
                      : 0,
                  )}
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-1">Taxa Conversão</p>
                <p className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                  {dadosGraficos.funil[0]?.quantidade > 0
                    ? (
                        ((dadosGraficos.funil.find((f) => f.nome === 'Ganho')?.quantidade || 0) /
                          dadosGraficos.funil[0].quantidade) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Modal Oportunidade Refatorado */}
      <ModalOportunidadeRefatorado
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setOportunidadeEditando(null);
        }}
        onSave={handleSalvarOportunidade}
        oportunidade={oportunidadeEditando}
        estagioInicial={estagioNovaOportunidade}
        estagiosPermitidos={estagiosKanbanVisiveis.map((estagio) => estagio.id)}
        lifecycleFeatureEnabled={lifecycleFeatureEnabled}
        usuarios={usuarios}
        loadingUsuarios={false}
      />

      {/* Modal Export */}
      <ModalExport
        isOpen={showModalExport}
        onClose={() => setShowModalExport(false)}
        totalOportunidades={oportunidadesFiltradas.length}
        onExport={handleExport}
      />

      {/* Modal Mudança de Estágio */}
      {mudancaEstagioData && (
        <ModalMudancaEstagio
          isOpen={showModalMudancaEstagio}
          onClose={() => {
            setShowModalMudancaEstagio(false);
            setMudancaEstagioData(null);
            setDraggedItem(null);
            setErroMudancaEstagio(null);
          }}
          onConfirm={handleConfirmarMudancaEstagio}
          estagioOrigem={mudancaEstagioData.oportunidade.estagio}
          estagioDestino={mudancaEstagioData.novoEstagio}
          tituloOportunidade={mudancaEstagioData.oportunidade.titulo}
          loading={loadingMudancaEstagio}
          errorMessage={erroMudancaEstagio}
        />
      )}

      {/* ✅ Modal de Motivo de Perda */}
      {showModalMotivoPerda && oportunidadeParaPerder && (
        <ModalMotivoPerda
          isOpen={showModalMotivoPerda}
          onClose={() => {
            setShowModalMotivoPerda(false);
            setOportunidadeParaPerder(null);
            setDraggedItem(null);
            setErroMotivoPerda(null);
          }}
          onConfirm={handleConfirmarPerda}
          tituloOportunidade={oportunidadeParaPerder.titulo}
          valorOportunidade={oportunidadeParaPerder.valor}
          loading={loadingMudancaEstagio}
          errorMessage={erroMotivoPerda}
        />
      )}

      {/* Modal de Detalhes */}
      <ModalDetalhesOportunidade
        oportunidade={oportunidadeDetalhes}
        onClose={() => setOportunidadeDetalhes(null)}
        onEditar={handleEditarOportunidade}
        onClonar={handleClonarOportunidade}
        exclusaoDireta={!lifecycleFeatureEnabled}
        onMarcarComoGanho={lifecycleFeatureEnabled ? handleMarcarOportunidadeComoGanha : undefined}
        onMarcarComoPerdido={
          lifecycleFeatureEnabled ? handlePrepararPerdaOportunidade : undefined
        }
        onArquivar={lifecycleFeatureEnabled ? handleArquivarOportunidade : undefined}
        onRestaurar={lifecycleFeatureEnabled ? handleRestaurarOportunidade : undefined}
        onReabrir={lifecycleFeatureEnabled ? handleReabrirOportunidade : undefined}
        onExcluir={async (oportunidade) => {
          await oportunidadesService.excluirOportunidade(oportunidade.id);
          toastService.success(
            lifecycleFeatureEnabled
              ? 'Oportunidade enviada para a lixeira.'
              : 'Oportunidade excluida com sucesso.',
          );
          await carregarDados();
        }}
        onExcluirPermanente={lifecycleFeatureEnabled ? handleExcluirPermanenteOportunidade : undefined}
      />

      {/* Modal de Confirmação de Exclusão */}
      {showModalDeletar && oportunidadeDeletar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-[#002333] mb-2">
                {deleteMode === 'permanente' ? 'Confirmar Exclusao Permanente' : 'Confirmar Exclusao'}
              </h3>
              <p className="text-center text-gray-600 mb-6">
                Tem certeza que deseja{' '}
                {deleteMode === 'permanente'
                  ? 'excluir permanentemente'
                  : 'enviar para a lixeira'}{' '}
                a oportunidade{' '}
                <strong>"{oportunidadeDeletar.titulo}"</strong>?
                <br />
                {deleteMode === 'permanente'
                  ? 'Esta ação não pode ser desfeita.'
                  : 'Você poderá restaurar depois pela visão Lixeira.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModalDeletar(false);
                    setOportunidadeDeletar(null);
                  }}
                  disabled={loadingDeletar}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarDelecao}
                  disabled={loadingDeletar}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                    deleteMode === 'permanente'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[#159A9C] hover:bg-[#0F7B7D]'
                  }`}
                >
                  {loadingDeletar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {deleteMode === 'permanente' ? 'Excluindo...' : 'Movendo...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {deleteMode === 'permanente' ? 'Excluir permanente' : 'Mover para lixeira'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Salvar Filtro */}
      {showModalSalvarFiltro && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#159A9C]/10 mx-auto mb-4">
                <Bookmark className="h-6 w-6 text-[#0F7B7D]" />
              </div>
              <h3 className="text-xl font-bold text-center text-[#002333] mb-2">Salvar Filtro</h3>
              <p className="text-center text-gray-600 mb-6">
                Dê um nome para este filtro para reutilizá-lo depois:
              </p>
              <input
                type="text"
                value={nomeFiltroSalvar}
                onChange={(e) => setNomeFiltroSalvar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nomeFiltroSalvar.trim()) {
                    handleSalvarFiltro();
                  }
                }}
                placeholder="Ex: Oportunidades Alta Prioridade"
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModalSalvarFiltro(false);
                    setNomeFiltroSalvar('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarFiltro}
                  disabled={!nomeFiltroSalvar.trim()}
                  className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelinePage;
