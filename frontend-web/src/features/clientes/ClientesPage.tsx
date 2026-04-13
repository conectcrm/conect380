import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ModalCadastroCliente from '../../components/modals/ModalCadastroCliente';
import { ClienteCard } from '../../components/clientes';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import { useAuth } from '../../hooks/useAuth';
import {
  clientesService,
  Cliente,
  CreateClientePayload,
  ClienteFilters,
  ClientesEstatisticas,
  PaginatedClientes,
} from '../../services/clientesService';
import usersService, { User as UsuarioResponsavel } from '../../services/usersService';
import { UploadResult } from '../../services/uploadService';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  BookmarkPlus,
  BookmarkX,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  Grid3X3,
  List,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';

const CLIENTE_STATUS_OPTIONS: Array<{ value: Cliente['status']; label: string }> = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'inativo', label: 'Inativo' },
];

const CLIENTE_TIPO_OPTIONS: Array<{ value: Cliente['tipo']; label: string }> = [
  { value: 'pessoa_fisica', label: 'Pessoa Fisica' },
  { value: 'pessoa_juridica', label: 'Pessoa Juridica' },
];

const getStatusLabel = (status: string): string =>
  CLIENTE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

const getTipoLabel = (tipo: string): string =>
  CLIENTE_TIPO_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo;

const getFollowupLabel = (followup: '' | 'pendente' | 'vencido'): string => {
  if (followup === 'pendente') return 'Pendente';
  if (followup === 'vencido') return 'Vencido';
  return '';
};

const formatDocumento = (documento?: string, tipo?: Cliente['tipo']): string => {
  if (!documento) return '-';

  const digits = documento.replace(/\D/g, '');
  if (digits.length === 11 || tipo === 'pessoa_fisica') {
    if (digits.length !== 11) return documento;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 14 || tipo === 'pessoa_juridica') {
    if (digits.length !== 14) return documento;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  return documento;
};

const CLIENTES_PAGE_STATE_STORAGE_KEY = 'conectcrm_clientes_page_state_v1';
const CLIENTES_SAVED_VIEWS_STORAGE_KEY = 'conectcrm_clientes_saved_views_v1';
const CLIENTES_UNASSIGNED_RESPONSAVEL_FILTER = '__sem_responsavel__';
type ClientesViewMode = 'cards' | 'table';

type SavedClientesView = {
  id: string;
  name: string;
  searchTerm: string;
  status: string;
  tipo: string;
  tag: string;
  origem: string;
  responsavelId: string;
  followup: '' | 'pendente' | 'vencido';
  viewMode: ClientesViewMode;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  createdAt: string;
  isDefault: boolean;
};

type PersistedClientesPageState = {
  searchTerm: string;
  status: string;
  tipo: string;
  tag: string;
  origem: string;
  responsavelId: string;
  followup: '' | 'pendente' | 'vencido';
  viewMode: ClientesViewMode;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  activeViewId: string;
};

type SaveViewModalMode = 'save' | 'rename';

const loadPersistedClientesState = (): Partial<PersistedClientesPageState> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(CLIENTES_PAGE_STATE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Partial<PersistedClientesPageState>;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const loadSavedClientesViews = (): SavedClientesView[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CLIENTES_SAVED_VIEWS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedClientesView[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized: SavedClientesView[] = parsed
      .filter(
        (view) =>
          typeof view?.id === 'string' &&
          typeof view?.name === 'string' &&
          typeof view?.searchTerm === 'string' &&
          typeof view?.status === 'string' &&
          typeof view?.tipo === 'string' &&
          (view?.viewMode === 'cards' || view?.viewMode === 'table'),
      )
      .map((view) => ({
        ...view,
        tag: typeof view.tag === 'string' ? view.tag : '',
        origem: typeof view.origem === 'string' ? view.origem : '',
        responsavelId: typeof view.responsavelId === 'string' ? view.responsavelId : '',
        followup:
          view.followup === 'pendente' || view.followup === 'vencido'
            ? (view.followup as 'pendente' | 'vencido')
            : '',
        isDefault: Boolean(view.isDefault),
      }));

    const firstDefaultIndex = normalized.findIndex((view) => view.isDefault);
    return normalized.map((view, index) => ({
      ...view,
      isDefault: firstDefaultIndex !== -1 && index === firstDefaultIndex,
    }));
  } catch {
    return [];
  }
};

const toCreateClientePayload = (
  cliente: Cliente,
): CreateClientePayload => ({
  nome: cliente.nome,
  email: cliente.email ?? '',
  telefone: cliente.telefone,
  tipo: cliente.tipo ?? 'pessoa_fisica',
  documento: cliente.documento,
  status: cliente.status ?? 'lead',
  endereco: cliente.endereco,
  cidade: cliente.cidade,
  estado: cliente.estado,
  cep: cliente.cep,
  observacoes: cliente.observacoes,
  tags: cliente.tags,
  ultimo_contato: cliente.ultimo_contato,
  proximo_contato: cliente.proximo_contato,
  avatar: cliente.avatar,
  avatarUrl: cliente.avatarUrl,
  avatar_url: cliente.avatar_url,
});

const ClientesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useGlobalConfirmation();
  const { user } = useAuth();
  const usuarioAtualId = String(user?.id || '').trim();
  const persistedStateRef = useRef<Partial<PersistedClientesPageState>>(
    loadPersistedClientesState(),
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [clientesData, setClientesData] = useState<PaginatedClientes | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filters, setFilters] = useState<ClienteFilters>(() => ({
    page: persistedStateRef.current.page ?? 1,
    limit: persistedStateRef.current.limit ?? 10,
    search: persistedStateRef.current.searchTerm ?? '',
    status: persistedStateRef.current.status ?? '',
    tipo: persistedStateRef.current.tipo ?? '',
    tag: persistedStateRef.current.tag ?? '',
    origem: persistedStateRef.current.origem ?? '',
    responsavelId: persistedStateRef.current.responsavelId ?? '',
    followup:
      persistedStateRef.current.followup === 'pendente' ||
      persistedStateRef.current.followup === 'vencido'
        ? persistedStateRef.current.followup
        : '',
    sortBy: persistedStateRef.current.sortBy ?? 'created_at',
    sortOrder: persistedStateRef.current.sortOrder ?? 'DESC',
  }));
  const [searchTerm, setSearchTerm] = useState(persistedStateRef.current.searchTerm ?? '');
  const [selectedStatus, setSelectedStatus] = useState(persistedStateRef.current.status ?? '');
  const [selectedTipo, setSelectedTipo] = useState(persistedStateRef.current.tipo ?? '');
  const [selectedTag, setSelectedTag] = useState(persistedStateRef.current.tag ?? '');
  const [selectedOrigem, setSelectedOrigem] = useState(persistedStateRef.current.origem ?? '');
  const [selectedResponsavelId, setSelectedResponsavelId] = useState(
    persistedStateRef.current.responsavelId ?? '',
  );
  const [selectedFollowup, setSelectedFollowup] = useState<'' | 'pendente' | 'vencido'>(
    persistedStateRef.current.followup === 'pendente' || persistedStateRef.current.followup === 'vencido'
      ? persistedStateRef.current.followup
      : '',
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    Boolean(
      (persistedStateRef.current.tag ?? '').trim() ||
        (persistedStateRef.current.origem ?? '').trim() ||
        (persistedStateRef.current.responsavelId ?? '').trim() ||
        (persistedStateRef.current.followup ?? '') ||
        (persistedStateRef.current.activeViewId ?? ''),
    ),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ClientesViewMode>(() => {
    if (persistedStateRef.current.viewMode) {
      return persistedStateRef.current.viewMode;
    }

    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'cards';
    }

    return 'table';
  });
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [excludedClientes, setExcludedClientes] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<SavedClientesView[]>(() => loadSavedClientesViews());
  const [activeViewId, setActiveViewId] = useState(persistedStateRef.current.activeViewId ?? '');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [saveViewModalMode, setSaveViewModalMode] = useState<SaveViewModalMode>('save');
  const [saveViewName, setSaveViewName] = useState('');
  const [isSavingView, setIsSavingView] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState<Record<string, boolean>>({});
  const [responsaveis, setResponsaveis] = useState<UsuarioResponsavel[]>([]);
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<'' | Cliente['status']>('');
  const [bulkResponsavelTarget, setBulkResponsavelTarget] = useState('');
  const [bulkFollowupDate, setBulkFollowupDate] = useState('');
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    prospects: 0,
    leads: 0,
  });

  // Alternancia automatica para cards em breakpoints pequenos
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 640px)');

    const ensureCardsView = () => {
      if (mediaQuery.matches) {
        setViewMode((current) => (current === 'cards' ? current : 'cards'));
      }
    };

    ensureCardsView();

    const listener = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setViewMode((current) => (current === 'cards' ? current : 'cards'));
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadResponsaveis = async () => {
      try {
        setLoadingResponsaveis(true);
        const usuarios = await usersService.listarAtivos();
        if (cancelled) {
          return;
        }

        setResponsaveis((usuarios || []).filter((usuario) => Boolean(usuario?.id)));
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao carregar responsaveis de clientes:', error);
          setResponsaveis([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingResponsaveis(false);
        }
      }
    };

    loadResponsaveis().catch(() => {
      // Tratado no bloco try/catch.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Ref para rastrear se e a primeira montagem (evitar execucao desnecessaria)
  const isFirstMount = useRef(true);
  const hasHydratedQueryRef = useRef(false);
  const hasAppliedDefaultViewRef = useRef(false);
  const processedHighlightRef = useRef('');
  const clientesRequestRef = useRef(0);
  const inFlightLoadKeyRef = useRef<string | null>(null);
  const lastEstatisticasLoadedAtRef = useRef(0);
  const hasLoadedEstatisticasRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const clientesProfileBasePath = useMemo(
    () => (location.pathname.startsWith('/crm/') ? '/crm/clientes' : '/clientes'),
    [location.pathname],
  );

  // Funcao para calcular estatisticas baseadas nos dados carregados
  const calcularEstatisticasLocais = useCallback((clientesData: Cliente[]) => {
    if (clientesData.length === 0) {
      setEstatisticas({ total: 0, ativos: 0, prospects: 0, leads: 0 });
      return;
    }

    const total = clientesData.length;
    const ativos = clientesData.filter((c) => c.status === 'cliente').length;
    const prospects = clientesData.filter((c) => c.status === 'prospect').length;
    const leads = clientesData.filter((c) => c.status === 'lead').length;

    setEstatisticas({ total, ativos, prospects, leads });
  }, []);

  const loadEstatisticas = useCallback(
    async (fallbackClientes: Cliente[]) => {
      try {
        const stats = await clientesService.getEstatisticas();
        const statsData = stats as ClientesEstatisticas;
        const statsMap = statsData as Record<string, unknown>;

        setEstatisticas({
          total: Number(statsData.total ?? 0),
          ativos: Number(statsData.ativos ?? statsMap.clientesAtivos ?? 0),
          prospects: Number(statsData.prospects ?? 0),
          leads: Number(statsData.leads ?? 0),
        });
      } catch (error) {
        console.error('Erro ao carregar estatisticas de clientes:', error);
        calcularEstatisticasLocais(fallbackClientes);
      }
    },
    [calcularEstatisticasLocais],
  );

  // Carregar clientes (memoizado para evitar loops)
  const loadClientes = useCallback(
    async (forceFresh = false) => {
      const normalizedFilters: ClienteFilters = {
        ...filters,
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        search: (filters.search ?? '').trim(),
        status: filters.status ?? '',
        tipo: filters.tipo ?? '',
        sortBy: filters.sortBy ?? 'created_at',
        sortOrder: filters.sortOrder ?? 'DESC',
      };
      const loadKey = JSON.stringify(normalizedFilters);

      if (!forceFresh && inFlightLoadKeyRef.current === loadKey) {
        return;
      }

      if (!forceFresh) {
        inFlightLoadKeyRef.current = loadKey;
      }
      const requestId = ++clientesRequestRef.current;

      try {
        setIsLoading(true);

        const requestFilters: ClienteFilters = forceFresh
          ? { ...normalizedFilters, cacheBust: Date.now() }
          : normalizedFilters;

        const data = await clientesService.getClientes(requestFilters);

        if (clientesRequestRef.current !== requestId) {
          return;
        }

        setClientesData(data);
        setClientes(data.data);

        const shouldReloadStats =
          forceFresh ||
          !hasLoadedEstatisticasRef.current ||
          Date.now() - lastEstatisticasLoadedAtRef.current > 30000;

        if (shouldReloadStats) {
          // Estatisticas sao globais e nao precisam ser buscadas em toda digitacao de filtro.
          await loadEstatisticas(data.data);
          hasLoadedEstatisticasRef.current = true;
          lastEstatisticasLoadedAtRef.current = Date.now();
        }
      } catch (error) {
        if (clientesRequestRef.current !== requestId) {
          return;
        }

        console.error('Erro ao carregar clientes:', error);

        toast.error('Erro ao carregar clientes do servidor. Verifique sua conexao.', {
          duration: 5000,
          position: 'top-right',
          icon: '!',
        });

        // Em caso de erro, manter dados vazios
        setClientes([]);
        setClientesData({
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        });
        calcularEstatisticasLocais([]);
      } finally {
        if (!forceFresh && inFlightLoadKeyRef.current === loadKey) {
          inFlightLoadKeyRef.current = null;
        }
        if (clientesRequestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [filters, loadEstatisticas, calcularEstatisticasLocais],
  );

  // Aplicar filtros de backend sem depender da digitacao da busca
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setFilters((prev) => {
      const currentPage = prev.page ?? 1;
      const nextStatus = selectedStatus;
      const nextTipo = selectedTipo;
      const nextTag = selectedTag.trim();
      const nextOrigem = selectedOrigem.trim();
      const nextResponsavelId = selectedResponsavelId.trim();
      const nextFollowup = selectedFollowup;
      const nextSearch = (prev.search ?? '').trim();

      if (
        (prev.search ?? '') === nextSearch &&
        (prev.status ?? '') === nextStatus &&
        (prev.tipo ?? '') === nextTipo &&
        (prev.tag ?? '') === nextTag &&
        (prev.origem ?? '') === nextOrigem &&
        (prev.responsavelId ?? '') === nextResponsavelId &&
        (prev.followup ?? '') === nextFollowup &&
        currentPage === 1
      ) {
        return prev;
      }

      return {
        ...prev,
        search: nextSearch,
        status: nextStatus,
        tipo: nextTipo,
        tag: nextTag,
        origem: nextOrigem,
        responsavelId: nextResponsavelId,
        followup: nextFollowup,
        page: 1,
      };
    });
  }, [selectedStatus, selectedTipo, selectedTag, selectedOrigem, selectedResponsavelId, selectedFollowup]);

  useEffect(() => {
    if (hasHydratedQueryRef.current) {
      return;
    }

    hasHydratedQueryRef.current = true;

    const querySearch = searchParams.get('q');
    const queryStatus = searchParams.get('status');
    const queryTipo = searchParams.get('tipo');
    const queryTag = searchParams.get('tag');
    const queryOrigem = searchParams.get('origem');
    const queryResponsavelId = searchParams.get('responsavelId');
    const queryFollowup = searchParams.get('followup');
    const queryView = searchParams.get('view');
    const queryPage = Number(searchParams.get('page') || '');
    const queryLimit = Number(searchParams.get('limit') || '');
    const querySortBy = searchParams.get('sortBy');
    const querySortOrder = searchParams.get('sortOrder');
    const querySavedView = searchParams.get('savedView');

    const hasAnyQueryState = [
      querySearch,
      queryStatus,
      queryTipo,
      queryTag,
      queryOrigem,
      queryResponsavelId,
      queryFollowup,
      queryView,
      searchParams.get('page'),
      searchParams.get('limit'),
      querySortBy,
      querySortOrder,
      querySavedView,
    ].some((value) => value !== null && value !== '');

    if (!hasAnyQueryState) {
      return;
    }

    if (querySearch !== null) {
      setSearchTerm(querySearch);
    }

    if (queryStatus !== null) {
      setSelectedStatus(queryStatus);
    }

    if (queryTipo !== null) {
      setSelectedTipo(queryTipo);
    }

    if (queryTag !== null) {
      setSelectedTag(queryTag);
    }

    if (queryOrigem !== null) {
      setSelectedOrigem(queryOrigem);
    }

    if (queryResponsavelId !== null) {
      setSelectedResponsavelId(queryResponsavelId);
    }

    if (queryFollowup === 'pendente' || queryFollowup === 'vencido') {
      setSelectedFollowup(queryFollowup);
    } else if (queryFollowup === '') {
      setSelectedFollowup('');
    }

    if (queryView === 'cards' || queryView === 'table') {
      setViewMode(queryView);
    }

    if (querySavedView !== null) {
      setActiveViewId(querySavedView);
    }

    setFilters((prev) => {
      const nextPage = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : (prev.page ?? 1);
      const nextLimit =
        Number.isFinite(queryLimit) && queryLimit > 0 ? queryLimit : (prev.limit ?? 10);
      const nextSearch = (querySearch ?? prev.search ?? '').trim();
      const nextStatus = queryStatus ?? prev.status ?? '';
      const nextTipo = queryTipo ?? prev.tipo ?? '';
      const nextTag = queryTag ?? prev.tag ?? '';
      const nextOrigem = queryOrigem ?? prev.origem ?? '';
      const nextResponsavelId = queryResponsavelId ?? prev.responsavelId ?? '';
      const nextFollowup =
        queryFollowup === 'pendente' || queryFollowup === 'vencido'
          ? queryFollowup
          : ((prev.followup ?? '') as '' | 'pendente' | 'vencido');
      const nextSortBy = querySortBy ?? prev.sortBy ?? 'created_at';
      const nextSortOrder =
        querySortOrder === 'ASC' || querySortOrder === 'DESC'
          ? querySortOrder
          : (prev.sortOrder ?? 'DESC');

      if (
        (prev.page ?? 1) === nextPage &&
        (prev.limit ?? 10) === nextLimit &&
        (prev.search ?? '') === nextSearch &&
        (prev.status ?? '') === nextStatus &&
        (prev.tipo ?? '') === nextTipo &&
        (prev.tag ?? '') === nextTag &&
        (prev.origem ?? '') === nextOrigem &&
        (prev.responsavelId ?? '') === nextResponsavelId &&
        (prev.followup ?? '') === nextFollowup &&
        (prev.sortBy ?? 'created_at') === nextSortBy &&
        (prev.sortOrder ?? 'DESC') === nextSortOrder
      ) {
        return prev;
      }

      return {
        ...prev,
        page: nextPage,
        limit: nextLimit,
        search: nextSearch,
        status: nextStatus,
        tipo: nextTipo,
        tag: nextTag,
        origem: nextOrigem,
        responsavelId: nextResponsavelId,
        followup: nextFollowup,
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      };
    });
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchTerm.trim();
      setFilters((prev) => {
        if ((prev.search ?? '') === nextSearch && (prev.page ?? 1) === 1) {
          return prev;
        }

        return {
          ...prev,
          search: nextSearch,
          page: 1,
        };
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const persistedState: PersistedClientesPageState = {
      searchTerm,
      status: selectedStatus,
      tipo: selectedTipo,
      tag: selectedTag,
      origem: selectedOrigem,
      responsavelId: selectedResponsavelId,
      followup: selectedFollowup,
      viewMode,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      sortBy: filters.sortBy ?? 'created_at',
      sortOrder: filters.sortOrder ?? 'DESC',
      activeViewId,
    };

    window.localStorage.setItem(CLIENTES_PAGE_STATE_STORAGE_KEY, JSON.stringify(persistedState));
  }, [
    activeViewId,
    filters.limit,
    filters.page,
    filters.sortBy,
    filters.sortOrder,
    searchTerm,
    selectedStatus,
    selectedTipo,
    selectedTag,
    selectedOrigem,
    selectedResponsavelId,
    selectedFollowup,
    viewMode,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CLIENTES_SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  const searchParamsSerialized = searchParams.toString();

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsSerialized);
    const normalizedSearch = searchTerm.trim();

    const setOrDelete = (key: string, value: string | null | undefined, keepWhenValue = true) => {
      if (!value || !keepWhenValue) {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, value);
    };

    setOrDelete('q', normalizedSearch);
    setOrDelete('status', selectedStatus);
    setOrDelete('tipo', selectedTipo);
    setOrDelete('tag', selectedTag.trim());
    setOrDelete('origem', selectedOrigem.trim());
    setOrDelete('responsavelId', selectedResponsavelId.trim());
    setOrDelete('followup', selectedFollowup);
    setOrDelete('view', viewMode === 'table' ? null : viewMode);
    setOrDelete('page', String(filters.page ?? 1), (filters.page ?? 1) > 1);
    setOrDelete('limit', String(filters.limit ?? 10), (filters.limit ?? 10) !== 10);
    setOrDelete(
      'sortBy',
      filters.sortBy,
      Boolean(filters.sortBy && filters.sortBy !== 'created_at'),
    );
    setOrDelete(
      'sortOrder',
      filters.sortOrder,
      Boolean(filters.sortOrder && filters.sortOrder !== 'DESC'),
    );
    setOrDelete('savedView', activeViewId);

    if (nextParams.toString() !== searchParamsSerialized) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    activeViewId,
    filters.limit,
    filters.page,
    filters.sortBy,
    filters.sortOrder,
    searchTerm,
    searchParamsSerialized,
    selectedStatus,
    selectedTipo,
    selectedTag,
    selectedOrigem,
    selectedResponsavelId,
    selectedFollowup,
    setSearchParams,
    viewMode,
  ]);

  useEffect(() => {
    setSelectedClientes([]);
    setSelectAllFiltered(false);
    setExcludedClientes([]);
  }, [
    searchTerm,
    filters.status,
    filters.tipo,
    filters.tag,
    filters.origem,
    filters.responsavelId,
    filters.followup,
    filters.sortBy,
    filters.sortOrder,
    filters.limit,
  ]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  useEffect(() => {
    const highlightId = searchParams.get('highlight')?.trim() ?? '';

    if (!highlightId) {
      processedHighlightRef.current = '';
      return;
    }

    if (isLoading || processedHighlightRef.current === highlightId) {
      return;
    }

    processedHighlightRef.current = highlightId;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('highlight');

    const clienteDaPagina = clientes.find((cliente) => cliente.id === highlightId);
    if (clienteDaPagina) {
      navigate(`${clientesProfileBasePath}/${clienteDaPagina.id}`);
      setSearchParams(nextParams, { replace: true });
      return;
    }

    let cancelled = false;

    const carregarClientePorId = async () => {
      try {
        const cliente = await clientesService.getClienteById(highlightId);
        if (!cancelled && cliente?.id) {
          navigate(`${clientesProfileBasePath}/${cliente.id}`);
        }
      } catch {
        if (!cancelled) {
          toast.error('Nao foi possivel abrir o cliente selecionado.');
        }
      } finally {
        if (!cancelled) {
          setSearchParams(nextParams, { replace: true });
        }
      }
    };

    carregarClientePorId().catch(() => {
      // Tratado no bloco try/catch acima.
    });

    return () => {
      cancelled = true;
    };
  }, [clientes, clientesProfileBasePath, isLoading, navigate, searchParams, setSearchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const htmlTarget = target instanceof HTMLElement ? target : null;
      const isTypingContext =
        htmlTarget instanceof HTMLInputElement ||
        htmlTarget instanceof HTMLTextAreaElement ||
        Boolean(htmlTarget?.isContentEditable);

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingContext
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (
        event.key === 'Escape' &&
        document.activeElement === searchInputRef.current &&
        searchTerm.length > 0
      ) {
        event.preventDefault();
        setSearchTerm('');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchTerm]);

  // Notificacao de boas-vindas removida - usar apenas toast para feedback imediato

  // Handlers para filtros simplificados
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleTipoChange = (tipo: string) => {
    setSelectedTipo(tipo);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
  };

  const handleOrigemChange = (origem: string) => {
    setSelectedOrigem(origem);
  };

  const handleResponsavelChange = (responsavelId: string) => {
    setSelectedResponsavelId(responsavelId);
  };

  const handleToggleMinhaCarteira = () => {
    if (!usuarioAtualId) {
      return;
    }

    setSelectedResponsavelId((current) => (current === usuarioAtualId ? '' : usuarioAtualId));
  };

  const handleFollowupChange = (followup: '' | 'pendente' | 'vencido') => {
    setSelectedFollowup(followup);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedTipo('');
    setSelectedTag('');
    setSelectedOrigem('');
    setSelectedResponsavelId('');
    setSelectedFollowup('');
    setActiveViewId('');
    setShowAdvancedFilters(false);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1,
    }));
  };

  const clientesFiltrados = clientes;
  const responsavelLabelById = useMemo(() => {
    const labels = new Map<string, string>([
      [CLIENTES_UNASSIGNED_RESPONSAVEL_FILTER, 'Sem responsavel'],
    ]);

    responsaveis
      .filter((responsavel) => Boolean(responsavel?.id))
      .forEach((responsavel) => {
        const nome =
          (responsavel.nome || responsavel.username || responsavel.email || '').trim() ||
          String(responsavel.id);
        labels.set(String(responsavel.id), nome);
      });

    return labels;
  }, [responsaveis]);
  const minhaCarteiraAtiva = Boolean(usuarioAtualId) && selectedResponsavelId === usuarioAtualId;

  const visibleClienteIds = useMemo(
    () => clientesFiltrados.map((cliente) => cliente.id).filter((id): id is string => Boolean(id)),
    [clientesFiltrados],
  );

  const totalRegistros = clientesData?.total ?? clientesFiltrados.length;
  const selectedCount = useMemo(() => {
    if (selectAllFiltered) {
      return Math.max(totalRegistros - excludedClientes.length, 0);
    }

    return selectedClientes.length;
  }, [excludedClientes.length, selectAllFiltered, selectedClientes.length, totalRegistros]);

  const hasBulkSelection = selectedCount > 0;
  const canSelectAcrossPages = totalRegistros > visibleClienteIds.length;
  const areAllVisibleSelected =
    visibleClienteIds.length > 0 &&
    visibleClienteIds.every((id) =>
      selectAllFiltered ? !excludedClientes.includes(id) : selectedClientes.includes(id),
    );

  const clearBulkSelection = useCallback(() => {
    setSelectedClientes([]);
    setSelectAllFiltered(false);
    setExcludedClientes([]);
  }, []);

  const loadClientesSnapshot = useCallback(
    async (ids: string[]): Promise<Cliente[]> => {
      if (ids.length === 0) {
        return [];
      }

      const uniqueIds = Array.from(new Set(ids));
      const snapshotById = new Map<string, Cliente>();

      clientes.forEach((cliente) => {
        if (cliente.id && uniqueIds.includes(cliente.id)) {
          snapshotById.set(cliente.id, cliente);
        }
      });

      const missingIds = uniqueIds.filter((id) => !snapshotById.has(id));
      if (missingIds.length > 0) {
        const snapshotResults = await Promise.allSettled(
          missingIds.map((id) => clientesService.getClienteById(id)),
        );

        snapshotResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.id) {
            snapshotById.set(result.value.id, result.value);
          }
        });
      }

      return uniqueIds
        .map((id) => snapshotById.get(id))
        .filter((cliente): cliente is Cliente => Boolean(cliente));
    },
    [clientes],
  );

  const restoreDeletedClientes = useCallback(
    async (snapshot: Cliente[]) => {
      if (snapshot.length === 0) {
        return;
      }

      const loadingToast = toast.loading('Restaurando clientes...');
      const restoreResults = await Promise.allSettled(
        snapshot.map((cliente) => clientesService.createCliente(toCreateClientePayload(cliente))),
      );
      toast.dismiss(loadingToast);

      const restoredCount = restoreResults.filter((result) => result.status === 'fulfilled').length;
      const failedCount = snapshot.length - restoredCount;

      if (restoredCount > 0) {
        await loadClientes(true);
      }

      if (failedCount === 0) {
        toast.success(`${restoredCount} cliente(s) restaurado(s).`);
        return;
      }

      if (restoredCount > 0) {
        toast(`Restauracao parcial: ${restoredCount} restaurado(s), ${failedCount} falha(s).`, {
          duration: 5000,
          position: 'top-right',
          icon: '!',
        });
        return;
      }

      toast.error('Nao foi possivel restaurar os clientes excluidos.');
    },
    [loadClientes],
  );

  const showUndoDeleteToast = useCallback(
    (snapshot: Cliente[]) => {
      if (snapshot.length === 0) {
        return;
      }

      toast(
        (toastItem) => (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#19384C]">
              {snapshot.length} cliente(s) excluido(s).
            </span>
            <button
              onClick={async () => {
                toast.dismiss(toastItem.id);
                await restoreDeletedClientes(snapshot);
              }}
              className="rounded-md bg-[#159A9C] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#0F7B7D]"
            >
              Desfazer
            </button>
          </div>
        ),
        {
          duration: 8000,
          position: 'top-right',
        },
      );
    },
    [restoreDeletedClientes],
  );

  const getSelectedClienteIdsForBulkAction = useCallback(async (): Promise<string[]> => {
    if (!selectAllFiltered) {
      return Array.from(new Set(selectedClientes));
    }

    const limit = 200;
    const filteredIds: string[] = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const pageData = await clientesService.getClientes({
        ...filters,
        page: currentPage,
        limit,
      });

      filteredIds.push(
        ...pageData.data.map((cliente) => cliente.id).filter((id): id is string => Boolean(id)),
      );

      totalPages = pageData.totalPages || 1;
      currentPage += 1;
    }

    if (excludedClientes.length === 0) {
      return Array.from(new Set(filteredIds));
    }

    const excludedSet = new Set(excludedClientes);
    return Array.from(new Set(filteredIds.filter((id) => !excludedSet.has(id))));
  }, [excludedClientes, filters, selectAllFiltered, selectedClientes]);

  const handleSelectAll = (checked: boolean) => {
    if (selectAllFiltered) {
      if (checked) {
        setExcludedClientes((prev) => prev.filter((id) => !visibleClienteIds.includes(id)));
      } else {
        setExcludedClientes((prev) => Array.from(new Set([...prev, ...visibleClienteIds])));
      }
      return;
    }

    if (checked) {
      setSelectedClientes((prev) => Array.from(new Set([...prev, ...visibleClienteIds])));
    } else {
      setSelectedClientes((prev) => prev.filter((id) => !visibleClienteIds.includes(id)));
    }
  };

  const handleSelectCliente = (clienteId: string, checked: boolean) => {
    if (selectAllFiltered) {
      if (checked) {
        setExcludedClientes((prev) => prev.filter((id) => id !== clienteId));
      } else {
        setExcludedClientes((prev) => Array.from(new Set([...prev, clienteId])));
      }
      return;
    }

    if (checked) {
      setSelectedClientes((prev) => Array.from(new Set([...prev, clienteId])));
    } else {
      setSelectedClientes((prev) => prev.filter((id) => id !== clienteId));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectAllFiltered(true);
    setSelectedClientes([]);
    setExcludedClientes([]);
  };

  const handleSavedViewChange = (viewId: string, options?: { showFeedback?: boolean }) => {
    const showFeedback = options?.showFeedback ?? true;

    if (!viewId) {
      setActiveViewId('');
      return;
    }

    const selectedView = savedViews.find((view) => view.id === viewId);
    if (!selectedView) {
      return;
    }

    setActiveViewId(selectedView.id);
    setSearchTerm(selectedView.searchTerm);
    setSelectedStatus(selectedView.status);
    setSelectedTipo(selectedView.tipo);
    setSelectedTag(selectedView.tag ?? '');
    setSelectedOrigem(selectedView.origem ?? '');
    setSelectedResponsavelId(selectedView.responsavelId ?? '');
    setSelectedFollowup(selectedView.followup ?? '');
    setViewMode(selectedView.viewMode);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: selectedView.limit,
      search: selectedView.searchTerm.trim(),
      status: selectedView.status,
      tipo: selectedView.tipo,
      tag: selectedView.tag ?? '',
      origem: selectedView.origem ?? '',
      responsavelId: selectedView.responsavelId ?? '',
      followup: selectedView.followup ?? '',
      sortBy: selectedView.sortBy,
      sortOrder: selectedView.sortOrder,
    }));
    if (showFeedback) {
      toast.success(`View "${selectedView.name}" aplicada.`);
    }
  };

  const handleOpenSaveViewModal = (mode: SaveViewModalMode = 'save') => {
    const currentView = savedViews.find((view) => view.id === activeViewId);
    if (mode === 'rename' && !currentView) {
      toast.error('Selecione uma view salva para renomear.');
      return;
    }

    setSaveViewModalMode(mode);
    setSaveViewName(currentView?.name ?? '');
    setShowSaveViewModal(true);
  };

  const handleCloseSaveViewModal = () => {
    if (isSavingView) {
      return;
    }

    setShowSaveViewModal(false);
    setSaveViewModalMode('save');
    setSaveViewName('');
  };

  const handleSaveCurrentView = async () => {
    if (isSavingView) {
      return;
    }

    const name = saveViewName.trim();
    const currentView = savedViews.find((view) => view.id === activeViewId) ?? null;
    const isRenameFlow = saveViewModalMode === 'rename' && Boolean(currentView);

    if (!name) {
      toast.error('Informe um nome para salvar a view.');
      return;
    }

    if (isRenameFlow && currentView?.name.trim().toLowerCase() === name.toLowerCase()) {
      toast.error('Informe um nome diferente para renomear a view.');
      return;
    }

    setIsSavingView(true);

    try {
      const nextId = currentView?.id ?? activeViewId ?? `view-${Date.now()}`;
      const duplicateByName = savedViews.find(
        (view) => view.name.toLowerCase() === name.toLowerCase() && view.id !== nextId,
      );

      if (duplicateByName) {
        const shouldReplace = await confirm(
          `Ja existe uma view chamada "${duplicateByName.name}". Deseja substituir?`,
        );
        if (!shouldReplace) {
          return;
        }
      }

      const nextView: SavedClientesView = {
        id: duplicateByName?.id ?? nextId,
        name,
        searchTerm,
        status: selectedStatus,
        tipo: selectedTipo,
        tag: selectedTag.trim(),
        origem: selectedOrigem.trim(),
        responsavelId: selectedResponsavelId.trim(),
        followup: selectedFollowup,
        viewMode,
        limit: filters.limit ?? 10,
        sortBy: filters.sortBy ?? 'created_at',
        sortOrder: filters.sortOrder ?? 'DESC',
        createdAt: new Date().toISOString(),
        isDefault: duplicateByName?.isDefault ?? currentView?.isDefault ?? false,
      };

      setSavedViews((prev) => [nextView, ...prev.filter((view) => view.id !== nextView.id)]);
      setActiveViewId(nextView.id);
      setShowSaveViewModal(false);
      setSaveViewModalMode('save');
      setSaveViewName('');

      const actionLabel = isRenameFlow ? 'renomeada' : currentView ? 'atualizada' : 'salva';
      toast.success(`View "${nextView.name}" ${actionLabel}.`);
    } finally {
      setIsSavingView(false);
    }
  };

  const handleDeleteActiveView = async () => {
    const activeView = savedViews.find((view) => view.id === activeViewId);
    if (!activeView) {
      return;
    }

    if (!(await confirm(`Deseja remover a view "${activeView.name}"?`))) {
      return;
    }

    setSavedViews((prev) => prev.filter((view) => view.id !== activeView.id));
    setActiveViewId('');
    toast.success('View removida com sucesso.');
  };

  const handleDuplicateActiveView = () => {
    const currentView = savedViews.find((view) => view.id === activeViewId);
    if (!currentView) {
      toast.error('Selecione uma view salva para duplicar.');
      return;
    }

    const baseName = `${currentView.name} (copia)`;
    let nextName = baseName;
    let suffix = 2;

    while (savedViews.some((view) => view.name.toLowerCase() === nextName.toLowerCase())) {
      nextName = `${baseName} ${suffix}`;
      suffix += 1;
    }

    const nextView: SavedClientesView = {
      ...currentView,
      id: `view-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: nextName,
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    setSavedViews((prev) => [nextView, ...prev]);
    setActiveViewId(nextView.id);
    toast.success(`View "${nextView.name}" duplicada.`);
  };

  const handleSetDefaultActiveView = () => {
    const currentView = savedViews.find((view) => view.id === activeViewId);
    if (!currentView) {
      toast.error('Selecione uma view salva para definir como padrao.');
      return;
    }

    if (currentView.isDefault) {
      return;
    }

    setSavedViews((prev) =>
      prev.map((view) => ({
        ...view,
        isDefault: view.id === currentView.id,
      })),
    );
    toast.success(`View "${currentView.name}" definida como padrao.`);
  };

  useEffect(() => {
    if (hasAppliedDefaultViewRef.current) {
      return;
    }

    if (!hasHydratedQueryRef.current) {
      return;
    }

    const hasAnyQueryState = [
      searchParams.get('q'),
      searchParams.get('status'),
      searchParams.get('tipo'),
      searchParams.get('tag'),
      searchParams.get('origem'),
      searchParams.get('responsavelId'),
      searchParams.get('followup'),
      searchParams.get('view'),
      searchParams.get('page'),
      searchParams.get('limit'),
      searchParams.get('sortBy'),
      searchParams.get('sortOrder'),
      searchParams.get('savedView'),
    ].some((value) => value !== null && value !== '');

    if (hasAnyQueryState || activeViewId) {
      hasAppliedDefaultViewRef.current = true;
      return;
    }

    const defaultView = savedViews.find((view) => view.isDefault);
    if (!defaultView) {
      hasAppliedDefaultViewRef.current = true;
      return;
    }

    setActiveViewId(defaultView.id);
    setSearchTerm(defaultView.searchTerm);
    setSelectedStatus(defaultView.status);
    setSelectedTipo(defaultView.tipo);
    setSelectedTag(defaultView.tag ?? '');
    setSelectedOrigem(defaultView.origem ?? '');
    setSelectedResponsavelId(defaultView.responsavelId ?? '');
    setSelectedFollowup(defaultView.followup ?? '');
    setViewMode(defaultView.viewMode);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: defaultView.limit,
      search: defaultView.searchTerm.trim(),
      status: defaultView.status,
      tipo: defaultView.tipo,
      tag: defaultView.tag ?? '',
      origem: defaultView.origem ?? '',
      responsavelId: defaultView.responsavelId ?? '',
      followup: defaultView.followup ?? '',
      sortBy: defaultView.sortBy,
      sortOrder: defaultView.sortOrder,
    }));
    hasAppliedDefaultViewRef.current = true;
  }, [activeViewId, savedViews, searchParams]);

  useEffect(() => {
    if (!activeViewId) {
      return;
    }

    const activeView = savedViews.find((view) => view.id === activeViewId);
    if (!activeView) {
      setActiveViewId('');
      return;
    }

    const isSameAsActiveView =
      activeView.searchTerm === searchTerm &&
      activeView.status === selectedStatus &&
      activeView.tipo === selectedTipo &&
      (activeView.tag ?? '') === selectedTag.trim() &&
      (activeView.origem ?? '') === selectedOrigem.trim() &&
      (activeView.responsavelId ?? '') === selectedResponsavelId.trim() &&
      (activeView.followup ?? '') === selectedFollowup &&
      activeView.viewMode === viewMode &&
      activeView.limit === (filters.limit ?? 10) &&
      activeView.sortBy === (filters.sortBy ?? 'created_at') &&
      activeView.sortOrder === (filters.sortOrder ?? 'DESC');

    if (!isSameAsActiveView) {
      setActiveViewId('');
    }
  }, [
    activeViewId,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
    savedViews,
    searchTerm,
    selectedStatus,
    selectedTipo,
    selectedTag,
    selectedOrigem,
    selectedResponsavelId,
    selectedFollowup,
    viewMode,
  ]);

  const handleBulkDelete = async () => {
    if (selectedCount === 0 || isBulkDeleting) return;

    setIsBulkDeleting(true);

    try {
      const selectedIds = await getSelectedClienteIdsForBulkAction();
      if (selectedIds.length === 0) {
        toast.error('Nenhum cliente selecionado para exclusao.');
        clearBulkSelection();
        return;
      }

      const confirmMessage = `Tem certeza que deseja excluir ${selectedIds.length} cliente(s) selecionado(s)?`;
      if (!(await confirm(confirmMessage))) {
        return;
      }

      const loadingToast = toast.loading(`Excluindo ${selectedIds.length} cliente(s)...`);
      const snapshotIds = selectedIds.slice(0, 30);
      const snapshot = await loadClientesSnapshot(snapshotIds);

      const deleteResults = await Promise.allSettled(
        selectedIds.map((id) => clientesService.deleteCliente(id)),
      );

      const failedIds = selectedIds.filter(
        (_, index) => deleteResults[index]?.status === 'rejected',
      );
      const successIds = selectedIds.filter(
        (_, index) => deleteResults[index]?.status === 'fulfilled',
      );
      const successCount = successIds.length;

      if (successCount > 0) {
        await loadClientes(true);
      }

      setSelectAllFiltered(false);
      setExcludedClientes([]);
      setSelectedClientes(failedIds);
      toast.dismiss(loadingToast);

      if (successCount > 0) {
        const successSnapshot = snapshot.filter(
          (cliente) => cliente.id && successIds.includes(cliente.id),
        );
        showUndoDeleteToast(successSnapshot);
      }

      if (failedIds.length === 0) {
        toast.success(`${successCount} cliente(s) excluido(s) com sucesso!`, {
          duration: 4000,
          position: 'top-right',
          icon: '!',
        });
        return;
      }

      if (successCount > 0) {
        toast(`Exclusao parcial: ${successCount} excluido(s), ${failedIds.length} com falha.`, {
          duration: 5000,
          position: 'top-right',
          icon: '!',
        });
        return;
      }

      toast.error('Nao foi possivel excluir os clientes selecionados.', {
        duration: 5000,
        position: 'top-right',
        icon: '!',
      });
    } catch (error) {
      console.error('Erro ao excluir clientes:', error);
      toast.error('Erro ao excluir clientes. Tente novamente.', {
        duration: 5000,
        position: 'top-right',
        icon: '!',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedCount === 0 || isBulkExporting) return;

    try {
      setIsBulkExporting(true);
      const selectedIds = await getSelectedClienteIdsForBulkAction();
      if (selectedIds.length === 0) {
        toast.error('Nenhum cliente selecionado para exportacao.');
        clearBulkSelection();
        return;
      }

      const exportFilters = selectAllFiltered
        ? { ...filters }
        : {
            ...filters,
            ids: selectedIds,
          };

      const blob = await clientesService.exportClientes(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = selectAllFiltered
        ? `clientes-filtrados-${selectedIds.length}.csv`
        : `clientes-selecionados-${selectedIds.length}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`${selectedIds.length} cliente(s) exportado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar clientes selecionados:', error);
      toast.error('Erro ao exportar clientes selecionados. Tente novamente.');
    } finally {
      setIsBulkExporting(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusTarget || selectedCount === 0 || isBulkUpdating) {
      return;
    }

    try {
      setIsBulkUpdating(true);
      const selectedIds = await getSelectedClienteIdsForBulkAction();
      if (selectedIds.length === 0) {
        toast.error('Nenhum cliente selecionado para atualizar status.');
        clearBulkSelection();
        return;
      }

      if (
        !(await confirm(
          `Atualizar status de ${selectedIds.length} cliente(s) para "${getStatusLabel(
            bulkStatusTarget,
          )}"?`,
        ))
      ) {
        return;
      }

      const loadingToast = toast.loading(`Atualizando status de ${selectedIds.length} cliente(s)...`);
      const updateResults = await Promise.allSettled(
        selectedIds.map((id) => clientesService.updateClienteStatus(id, bulkStatusTarget)),
      );
      toast.dismiss(loadingToast);

      const failedIds = selectedIds.filter(
        (_, index) => updateResults[index]?.status === 'rejected',
      );
      const successCount = selectedIds.length - failedIds.length;

      if (successCount > 0) {
        await loadClientes(true);
      }

      setSelectAllFiltered(false);
      setExcludedClientes([]);
      setSelectedClientes(failedIds);

      if (failedIds.length === 0) {
        toast.success(`${successCount} cliente(s) atualizado(s) com sucesso!`);
        return;
      }

      if (successCount > 0) {
        toast(
          `Atualizacao parcial: ${successCount} atualizado(s), ${failedIds.length} com falha.`,
          {
            duration: 5000,
            position: 'top-right',
            icon: '!',
          },
        );
        return;
      }

      toast.error('Nao foi possivel atualizar o status dos clientes selecionados.');
    } catch (error) {
      console.error('Erro ao atualizar status em lote:', error);
      toast.error('Erro ao atualizar status em lote. Tente novamente.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkResponsavelUpdate = async () => {
    if (selectedCount === 0 || isBulkUpdating) {
      return;
    }

    try {
      setIsBulkUpdating(true);
      const selectedIds = await getSelectedClienteIdsForBulkAction();
      if (selectedIds.length === 0) {
        toast.error('Nenhum cliente selecionado para atualizar responsavel.');
        clearBulkSelection();
        return;
      }

      const responsavelNome =
        bulkResponsavelTarget.trim().length > 0
          ? responsavelLabelById.get(bulkResponsavelTarget.trim()) || bulkResponsavelTarget.trim()
          : 'Sem responsavel';

      if (
        !(await confirm(
          `Atualizar responsavel de ${selectedIds.length} cliente(s) para "${responsavelNome}"?`,
        ))
      ) {
        return;
      }

      const payload = {
        responsavelId: bulkResponsavelTarget.trim(),
      };

      const loadingToast = toast.loading(
        `Atualizando responsavel de ${selectedIds.length} cliente(s)...`,
      );
      const updateResults = await Promise.allSettled(
        selectedIds.map((id) => clientesService.updateCliente(id, payload)),
      );
      toast.dismiss(loadingToast);

      const failedIds = selectedIds.filter(
        (_, index) => updateResults[index]?.status === 'rejected',
      );
      const successCount = selectedIds.length - failedIds.length;

      if (successCount > 0) {
        await loadClientes(true);
      }

      setSelectAllFiltered(false);
      setExcludedClientes([]);
      setSelectedClientes(failedIds);

      if (failedIds.length === 0) {
        toast.success(`${successCount} cliente(s) atualizado(s) com sucesso!`);
        return;
      }

      if (successCount > 0) {
        toast(
          `Atualizacao parcial: ${successCount} atualizado(s), ${failedIds.length} com falha.`,
          {
            duration: 5000,
            position: 'top-right',
            icon: '!',
          },
        );
        return;
      }

      toast.error('Nao foi possivel atualizar o responsavel dos clientes selecionados.');
    } catch (error) {
      console.error('Erro ao atualizar responsavel em lote:', error);
      toast.error('Erro ao atualizar responsavel em lote. Tente novamente.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkFollowupUpdate = async () => {
    if (selectedCount === 0 || isBulkUpdating) {
      return;
    }

    if (!bulkFollowupDate) {
      toast.error('Selecione uma data para o proximo follow-up.');
      return;
    }

    try {
      setIsBulkUpdating(true);
      const selectedIds = await getSelectedClienteIdsForBulkAction();
      if (selectedIds.length === 0) {
        toast.error('Nenhum cliente selecionado para atualizar follow-up.');
        clearBulkSelection();
        return;
      }

      if (
        !(await confirm(
          `Definir proximo follow-up de ${selectedIds.length} cliente(s) para ${new Date(
            `${bulkFollowupDate}T12:00:00`,
          ).toLocaleDateString('pt-BR')}?`,
        ))
      ) {
        return;
      }

      const payload = {
        proximo_contato: `${bulkFollowupDate}T12:00:00`,
      };

      const loadingToast = toast.loading(
        `Atualizando follow-up de ${selectedIds.length} cliente(s)...`,
      );
      const updateResults = await Promise.allSettled(
        selectedIds.map((id) => clientesService.updateCliente(id, payload)),
      );
      toast.dismiss(loadingToast);

      const failedIds = selectedIds.filter(
        (_, index) => updateResults[index]?.status === 'rejected',
      );
      const successCount = selectedIds.length - failedIds.length;

      if (successCount > 0) {
        await loadClientes(true);
      }

      setSelectAllFiltered(false);
      setExcludedClientes([]);
      setSelectedClientes(failedIds);

      if (failedIds.length === 0) {
        toast.success(`${successCount} cliente(s) atualizado(s) com sucesso!`);
        return;
      }

      if (successCount > 0) {
        toast(
          `Atualizacao parcial: ${successCount} atualizado(s), ${failedIds.length} com falha.`,
          {
            duration: 5000,
            position: 'top-right',
            icon: '!',
          },
        );
        return;
      }

      toast.error('Nao foi possivel atualizar o follow-up dos clientes selecionados.');
    } catch (error) {
      console.error('Erro ao atualizar follow-up em lote:', error);
      toast.error('Erro ao atualizar follow-up em lote. Tente novamente.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Handler para salvar cliente (criar/editar)
  const handleSaveCliente = async (clienteData: CreateClientePayload) => {
    try {
      setIsModalLoading(true);

      if (selectedCliente) {
        // Editar cliente existente
        await clientesService.updateCliente(selectedCliente.id!, clienteData);
      } else {
        // Criar novo cliente
        await clientesService.createCliente(clienteData);
      }

      // Recarregar a lista de clientes
      await loadClientes(true);

      // Fechar modal
      setShowCreateModal(false);
      setSelectedCliente(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      throw error;
    } finally {
      setIsModalLoading(false);
    }
  };

  // Handler para excluir cliente
  const handleDeleteCliente = async (id: string) => {
    if (!(await confirm('Tem certeza que deseja excluir este cliente?'))) {
      return;
    }

    try {
      const loadingToast = toast.loading('Excluindo cliente...');
      const snapshot = await loadClientesSnapshot([id]);

      await clientesService.deleteCliente(id);
      await loadClientes(true);

      setSelectedClientes((prev) => prev.filter((clienteId) => clienteId !== id));
      setExcludedClientes((prev) => prev.filter((clienteId) => clienteId !== id));
      toast.dismiss(loadingToast);
      toast.success('Cliente excluido com sucesso!', {
        duration: 4000,
        position: 'top-right',
        icon: '!',
      });

      showUndoDeleteToast(snapshot);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente. Tente novamente.', {
        duration: 5000,
        position: 'top-right',
        icon: '!',
      });
    }
  };

  const handleStatusUpdate = async (clienteId: string, status: Cliente['status']) => {
    const clienteAtual = clientes.find((cliente) => cliente.id === clienteId);

    if (!clienteAtual || clienteAtual.status === status) {
      return;
    }

    setStatusUpdateInProgress((prev) => ({ ...prev, [clienteId]: true }));

    try {
      await clientesService.updateClienteStatus(clienteId, status);
      await loadClientes(true);

      setSelectedCliente((current) =>
        current?.id === clienteId ? { ...current, status } : current,
      );

      toast.success('Status do cliente atualizado com sucesso.', {
        duration: 3500,
        position: 'top-right',
        icon: '!',
      });
    } catch (error) {
      console.error('Erro ao atualizar status do cliente:', error);
      toast.error('Nao foi possivel atualizar o status do cliente.', {
        duration: 5000,
        position: 'top-right',
        icon: '!',
      });
    } finally {
      setStatusUpdateInProgress((prev) => {
        const next = { ...prev };
        delete next[clienteId];
        return next;
      });
    }
  };

  // Handler para exportar clientes
  const handleExportClientes = async () => {
    try {
      const blob = await clientesService.exportClientes(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'clientes.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar clientes:', error);
      toast.error('Erro ao exportar clientes. Tente novamente.');
    }
  };

  // Handler para abrir modal de edicao
  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowCreateModal(true);
  };

  const handleViewCliente = (cliente: Cliente) => {
    if (!cliente.id) {
      return;
    }
    navigate(`${clientesProfileBasePath}/${cliente.id}`);
  };

  const handleAvatarUpdate = (clienteId: string, avatar: UploadResult) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === clienteId
          ? { ...c, avatar: avatar.url, avatarUrl: avatar.url, avatar_url: avatar.url }
          : c,
      ),
    );
    setSelectedCliente((current) =>
      current?.id === clienteId
        ? { ...current, avatar: avatar.url, avatarUrl: avatar.url, avatar_url: avatar.url }
        : current,
    );
    toast.success('Avatar do cliente atualizado com sucesso.', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleAttachmentAdd = async (_clienteId: string, attachment: UploadResult) => {
    toast.success(`Anexo ${attachment.fileName} adicionado com sucesso.`, {
      duration: 3500,
      position: 'top-right',
    });
  };

  const isInitialLoading = isLoading && clientes.length === 0;
  const isRefreshingResults = isLoading && clientes.length > 0;
  const pageDescription = isInitialLoading
    ? 'Carregando clientes...'
    : isRefreshingResults
      ? 'Atualizando resultados...'
      : `Gerencie o cadastro e relacionamento basico de ${estatisticas.total} clientes`;
  const hasFilters = Boolean(
    searchTerm ||
      selectedStatus ||
      selectedTipo ||
      selectedTag.trim() ||
      selectedOrigem.trim() ||
      selectedResponsavelId.trim() ||
      selectedFollowup,
  );
  const activeView = savedViews.find((view) => view.id === activeViewId) ?? null;
  const hasAdvancedFilters = Boolean(
    selectedTag.trim() ||
      selectedOrigem.trim() ||
      selectedResponsavelId.trim() ||
      selectedFollowup ||
      activeViewId,
  );
  const advancedFiltersCount = [
    selectedTag.trim(),
    selectedOrigem.trim(),
    selectedResponsavelId.trim(),
    selectedFollowup,
    activeViewId,
  ].filter(Boolean).length;
  const hasFilterChips = hasFilters || Boolean(activeView);
  const oportunidadesAtivas = Number(estatisticas.prospects ?? 0) + Number(estatisticas.leads ?? 0);
  const isRenameMode = saveViewModalMode === 'rename' && Boolean(activeView);
  const saveViewModalTitle = isRenameMode
    ? 'Renomear view'
    : activeView
      ? 'Atualizar view atual'
      : 'Salvar view atual';
  const saveViewModalDescription = isRenameMode
    ? 'Altere o nome da view salva sem mudar os filtros aplicados.'
    : 'Salve filtros e ordenacao para reutilizar rapidamente.';
  const saveViewActionLabel = isRenameMode
    ? 'Renomear view'
    : activeView
      ? 'Atualizar view'
      : 'Salvar view';

  const getSortIconClass = (column: string) =>
    filters.sortBy === column
      ? filters.sortOrder === 'ASC'
        ? 'rotate-90 text-[#159A9C]'
        : '-rotate-90 text-[#159A9C]'
      : 'text-[#9AB0BA]';

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
              <Users className="h-6 w-6 text-[#159A9C]" />
              Clientes
            </span>
          }
          titleClassName="leading-none sm:inline-flex sm:items-center"
          description={pageDescription}
          descriptionClassName="max-w-[74ch] text-[12px] leading-[1.4] text-[#5B7A89] sm:border-l sm:border-[#D7E5EC] sm:pl-3 sm:text-[13px]"
          inlineDescriptionOnDesktop
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-[#D4E2E7] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-[#ECF7F3] text-[#0F7B7D]'
                      : 'text-[#607B89] hover:text-[#19384C]'
                  }`}
                  title="Visualizar em cards"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#ECF7F3] text-[#0F7B7D]'
                      : 'text-[#607B89] hover:text-[#19384C]'
                  }`}
                  title="Visualizar em lista"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => void loadClientes(true)}
                disabled={isLoading}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={handleExportClientes}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCliente(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Novo Cliente
              </button>
            </div>
          }
        />

        <section className="space-y-3 rounded-2xl border border-[#D4E1E8] bg-white/95 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5F7B89]">
              Resumo essencial:
            </span>
            <span className="inline-flex items-center rounded-full border border-[#D7E6EC] bg-[#F5FAFC] px-2.5 py-1 text-xs font-semibold text-[#345362]">
              Base cadastrada: {isLoading ? '--' : estatisticas.total}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#BEE6CF] bg-[#F1FBF5] px-2.5 py-1 text-xs font-semibold text-[#137A42]">
              Clientes ativos: {isLoading ? '--' : estatisticas.ativos}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#BFE8E9] bg-[#EEFBFB] px-2.5 py-1 text-xs font-semibold text-[#0F7B7D]">
              Prospects: {isLoading ? '--' : estatisticas.prospects}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#D6DAF8] bg-[#F2F4FF] px-2.5 py-1 text-xs font-semibold text-[#404F9A]">
              Leads: {isLoading ? '--' : estatisticas.leads}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#F5D7A7] bg-[#FFF7EA] px-2.5 py-1 text-xs font-semibold text-[#A86400]">
              Oportunidades abertas: {isLoading ? '--' : oportunidadesAtivas}
            </span>
          </div>
        </section>

        <FiltersBar className="space-y-4 rounded-2xl border border-[#D4E1E8] bg-gradient-to-br from-[#F7FBFD] to-[#F1F7FA] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end">
            <div className="w-full xl:min-w-[300px] xl:flex-1">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Buscar clientes
                <span className="ml-1 text-[10px] font-medium normal-case text-[#6F8B98]">atalho: /</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar por nome, CPF/CNPJ, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>
            </div>

            <div className="w-full xl:w-auto">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 xl:w-[180px]"
              >
                <option value="">Todos os status</option>
                {CLIENTE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full xl:w-auto">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                Tipo
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => handleTipoChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 xl:w-[180px]"
              >
                <option value="">Todos os tipos</option>
                {CLIENTE_TIPO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-wrap items-end gap-2 xl:w-auto xl:justify-end">
              <button
                type="button"
                onClick={handleToggleMinhaCarteira}
                disabled={!usuarioAtualId}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                  minhaCarteiraAtiva
                    ? 'border-[#159A9C] bg-[#ECF7F3] text-[#0F7B7D]'
                    : 'border-[#B4BEC9] bg-white text-[#19384C] hover:bg-[#F6FAF9]'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Minha carteira
              </button>

              <button
                type="button"
                data-testid="clientes-advanced-filters-toggle"
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
                disabled={!hasFilterChips}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Limpar
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] p-3 sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="w-full">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                    Tag
                  </label>
                  <input
                    type="text"
                    value={selectedTag}
                    onChange={(e) => handleTagChange(e.target.value)}
                    data-testid="clientes-filter-tag"
                    placeholder="Ex.: vip"
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                </div>

                <div className="w-full">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                    Follow-up
                  </label>
                  <select
                    value={selectedFollowup}
                    onChange={(e) => handleFollowupChange(e.target.value as '' | 'pendente' | 'vencido')}
                    data-testid="clientes-filter-followup"
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    <option value="">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>

                <div className="w-full">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                    Origem
                  </label>
                  <input
                    type="text"
                    value={selectedOrigem}
                    onChange={(e) => handleOrigemChange(e.target.value)}
                    data-testid="clientes-filter-origem"
                    placeholder="Ex.: Indicacao"
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                </div>

                <div className="w-full">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                    Responsavel
                  </label>
                  <select
                    value={selectedResponsavelId}
                    onChange={(e) => handleResponsavelChange(e.target.value)}
                    data-testid="clientes-filter-responsavel"
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    <option value="">Todos</option>
                    <option value={CLIENTES_UNASSIGNED_RESPONSAVEL_FILTER}>Sem responsavel</option>
                    {responsaveis.map((responsavel) => (
                      <option key={responsavel.id} value={responsavel.id}>
                        {responsavel.nome || responsavel.username || responsavel.email || responsavel.id}
                      </option>
                    ))}
                  </select>
                  {loadingResponsaveis ? (
                    <p className="mt-1 text-xs text-[#6F8B98]">Carregando responsaveis...</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 border-t border-[#DFEAEE] pt-3">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                  Views salvas
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={activeViewId}
                    onChange={(e) => handleSavedViewChange(e.target.value)}
                    data-testid="clientes-saved-views-select"
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:min-w-[190px] sm:w-auto"
                  >
                    <option value="">Sem view salva</option>
                    {savedViews.map((view) => (
                      <option key={view.id} value={view.id}>
                        {view.isDefault ? `${view.name} (padrao)` : view.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleOpenSaveViewModal()}
                    data-testid="clientes-save-view-button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#B4BEC9] bg-white px-3 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
                    title={activeViewId ? 'Salvar alteracoes da view ativa' : 'Salvar view atual'}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    <span>Salvar</span>
                  </button>
                  {activeViewId && (
                    <button
                      onClick={() => handleOpenSaveViewModal('rename')}
                      data-testid="clientes-rename-view-button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
                      title="Renomear view ativa"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Renomear</span>
                    </button>
                  )}
                  {activeViewId && (
                    <button
                      onClick={handleDeleteActiveView}
                      data-testid="clientes-delete-view-button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4C7C7] bg-white px-3 py-2 text-sm font-medium text-[#9E3535] transition-colors hover:bg-[#FFF5F5]"
                      title="Excluir view ativa"
                    >
                      <BookmarkX className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </FiltersBar>
      </SectionCard>

      {hasFilterChips && (
        <div className="flex flex-wrap items-center gap-2">
          {activeView && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              View: <strong className="font-semibold text-[#1C3B4C]">{activeView.name}</strong>
              {activeView.isDefault ? (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-1.5 py-0.5 text-[10px] font-semibold text-[#0F7B7D]">
                  padrao
                </span>
              ) : null}
              <button
                onClick={() => setActiveViewId('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover view salva"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {searchTerm && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              Busca: <strong className="font-semibold text-[#1C3B4C]">{searchTerm}</strong>
              <button
                onClick={() => setSearchTerm('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover filtro de busca"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedStatus && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              Status:{' '}
              <strong className="font-semibold text-[#1C3B4C]">
                {getStatusLabel(selectedStatus)}
              </strong>
              <button
                onClick={() => setSelectedStatus('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover filtro de status"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedTipo && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              Tipo:{' '}
              <strong className="font-semibold text-[#1C3B4C]">{getTipoLabel(selectedTipo)}</strong>
              <button
                onClick={() => setSelectedTipo('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover filtro de tipo"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedTag.trim() && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              Tag: <strong className="font-semibold text-[#1C3B4C]">{selectedTag.trim()}</strong>
              <button
                onClick={() => setSelectedTag('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover filtro de tag"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedFollowup && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              Follow-up:{' '}
              <strong className="font-semibold text-[#1C3B4C]">
                {getFollowupLabel(selectedFollowup)}
              </strong>
              <button
                onClick={() => setSelectedFollowup('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover filtro de follow-up"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedOrigem.trim() && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              Origem:{' '}
              <strong className="font-semibold text-[#1C3B4C]">{selectedOrigem.trim()}</strong>
              <button
                onClick={() => setSelectedOrigem('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover filtro de origem"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedResponsavelId.trim() && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
              Responsavel:{' '}
              <strong className="font-semibold text-[#1C3B4C]">
                {responsavelLabelById.get(selectedResponsavelId.trim()) || selectedResponsavelId.trim()}
              </strong>
              <button
                onClick={() => setSelectedResponsavelId('')}
                className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                title="Remover filtro de responsavel"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1 rounded-full border border-[#D2DFE4] bg-white px-3 py-1 text-xs font-medium text-[#486978] transition-colors hover:bg-[#F3F8FA]"
          >
            <X className="h-3.5 w-3.5" />
            Limpar todos
          </button>
        </div>
      )}

      {isInitialLoading && <LoadingSkeleton lines={7} />}

      {isRefreshingResults && (
        <div className="rounded-xl border border-[#DCE8EC] bg-[#F6FBFC] px-4 py-2 text-sm text-[#446675]">
          Atualizando resultados da busca...
        </div>
      )}

      {!isLoading && clientesFiltrados.length === 0 && (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={hasFilters ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          description={
            hasFilters
              ? 'Tente ajustar os filtros de busca para localizar clientes.'
              : 'Comece cadastrando seu primeiro cliente.'
          }
          action={
            hasFilters ? (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
              >
                <Filter className="h-4 w-4" />
                Limpar filtros
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedCliente(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Criar primeiro cliente
              </button>
            )
          }
        />
      )}

      {clientesFiltrados.length > 0 && (
        <DataTableCard>
          {viewMode === 'cards' ? (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {clientesFiltrados.map((cliente) => (
                  <ClienteCard
                    key={cliente.id}
                    cliente={cliente}
                    onEdit={handleEditCliente}
                    onDelete={handleDeleteCliente}
                    onView={handleViewCliente}
                    onAvatarUpdate={handleAvatarUpdate}
                    onAttachmentAdd={handleAttachmentAdd}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#516F7D]">
                  <span>
                    {clientesFiltrados.length} de {totalRegistros} registros
                  </span>
                  {hasFilters && (
                    <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                      filtrados
                    </span>
                  )}
                  {hasBulkSelection && (
                    <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-semibold text-[#0F7B7D]">
                      {selectedCount} selecionado
                      {selectedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {canSelectAcrossPages && areAllVisibleSelected && !selectAllFiltered && (
                    <button
                      onClick={handleSelectAllFiltered}
                      className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2.5 py-0.5 text-xs font-semibold text-[#0F7B7D] transition-colors hover:bg-[#DFF2EC]"
                    >
                      Selecionar todos os {totalRegistros} resultados
                    </button>
                  )}
                  {hasBulkSelection && (
                    <button
                      onClick={clearBulkSelection}
                      className="rounded-full border border-[#D8E4E9] bg-white px-2.5 py-0.5 text-xs font-medium text-[#486978] transition-colors hover:bg-[#F3F8FA]"
                    >
                      {selectAllFiltered ? 'Limpar selecao total' : 'Limpar selecao'}
                    </button>
                  )}
                  <select
                    className="h-8 rounded-lg border border-[#D4E2E7] bg-white px-2 text-xs text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                    value={filters.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                  >
                    <option value={10}>Exibir: 10</option>
                    <option value={25}>Exibir: 25</option>
                    <option value={50}>Exibir: 50</option>
                    <option value={100}>Exibir: 100</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {hasBulkSelection && (
                    <>
                      <select
                        value={bulkStatusTarget}
                        onChange={(e) =>
                          setBulkStatusTarget((e.target.value as Cliente['status']) || '')
                        }
                        disabled={isBulkDeleting || isBulkExporting || isBulkUpdating}
                        className="h-8 rounded-lg border border-[#D4E2E7] bg-white px-2 text-xs text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Alterar status em lote"
                      >
                        <option value="">Status em lote</option>
                        {CLIENTE_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkStatusUpdate}
                        disabled={
                          !bulkStatusTarget || isBulkDeleting || isBulkExporting || isBulkUpdating
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-xs font-medium text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Aplicar status
                      </button>

                      <select
                        value={bulkResponsavelTarget}
                        onChange={(e) => setBulkResponsavelTarget(e.target.value)}
                        disabled={isBulkDeleting || isBulkExporting || isBulkUpdating}
                        className="h-8 rounded-lg border border-[#D4E2E7] bg-white px-2 text-xs text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Atribuir responsavel em lote"
                      >
                        <option value="">Responsavel em lote</option>
                        {responsaveis.map((responsavel) => (
                          <option key={responsavel.id} value={responsavel.id}>
                            {responsavel.nome || responsavel.username || responsavel.email || responsavel.id}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkResponsavelUpdate}
                        disabled={isBulkDeleting || isBulkExporting || isBulkUpdating}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-xs font-medium text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Aplicar responsavel
                      </button>

                      <input
                        type="date"
                        value={bulkFollowupDate}
                        onChange={(e) => setBulkFollowupDate(e.target.value)}
                        disabled={isBulkDeleting || isBulkExporting || isBulkUpdating}
                        className="h-8 rounded-lg border border-[#D4E2E7] bg-white px-2 text-xs text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Definir proximo follow-up em lote"
                      />
                      <button
                        onClick={handleBulkFollowupUpdate}
                        disabled={
                          !bulkFollowupDate || isBulkDeleting || isBulkExporting || isBulkUpdating
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-xs font-medium text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Definir follow-up
                      </button>

                      <button
                        onClick={handleBulkExport}
                        disabled={isBulkExporting || isBulkDeleting || isBulkUpdating}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#159A9C] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBulkExporting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {isBulkExporting ? 'Exportando...' : `Exportar (${selectedCount})`}
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting || isBulkExporting || isBulkUpdating}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBulkDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {isBulkDeleting ? 'Excluindo...' : `Excluir (${selectedCount})`}
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleExportClientes}
                    disabled={isBulkDeleting || isBulkExporting || isBulkUpdating}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-xs font-medium text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar todos
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] bg-white">
                  <thead className="border-b border-[#E1EAEE] bg-[#F8FBFC]">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={areAllVisibleSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-[#BFD0D8] text-[#159A9C] focus:ring-[#159A9C]"
                        />
                      </th>
                      <th className="w-[28%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                        <button
                          onClick={() => handleSort('nome')}
                          className="inline-flex items-center gap-1 transition-colors hover:text-[#159A9C]"
                        >
                          <span>Cliente</span>
                          <ChevronRight
                            className={`h-3 w-3 transition-transform ${getSortIconClass('nome')}`}
                          />
                        </button>
                      </th>
                      <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                        Tipo
                      </th>
                      <th className="w-48 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                        CPF/CNPJ
                      </th>
                      <th className="w-[26%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                        Contato
                      </th>
                      <th className="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                        <button
                          onClick={() => handleSort('status')}
                          className="inline-flex items-center gap-1 transition-colors hover:text-[#159A9C]"
                        >
                          <span>Status</span>
                          <ChevronRight
                            className={`h-3 w-3 transition-transform ${getSortIconClass('status')}`}
                          />
                        </button>
                      </th>
                      <th className="w-36 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                        <button
                          onClick={() => handleSort('created_at')}
                          className="inline-flex items-center gap-1 transition-colors hover:text-[#159A9C]"
                        >
                          <span>Criado em</span>
                          <ChevronRight
                            className={`h-3 w-3 transition-transform ${getSortIconClass('created_at')}`}
                          />
                        </button>
                      </th>
                      <th className="w-32 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F5] bg-white">
                    {clientesFiltrados.map((cliente, index) => (
                      <tr
                        key={cliente.id}
                        className={`cursor-pointer transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFD]'
                        } hover:bg-[#EFF7F4]`}
                        onClick={() => handleViewCliente(cliente)}
                      >
                        <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={
                              Boolean(cliente.id) &&
                              (selectAllFiltered
                                ? !excludedClientes.includes(cliente.id!)
                                : selectedClientes.includes(cliente.id!))
                            }
                            onChange={(e) => handleSelectCliente(cliente.id!, e.target.checked)}
                            className="h-4 w-4 rounded border-[#BFD0D8] text-[#159A9C] focus:ring-[#159A9C]"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ECF7F3] text-xs font-semibold text-[#0F7B7D]">
                              {cliente.nome
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#19384C]">
                                {cliente.nome}
                              </p>
                              {(cliente.cidade || cliente.estado || cliente.empresa) && (
                                <p className="truncate text-xs text-[#6B8693]">
                                  {cliente.cidade || cliente.estado
                                    ? [cliente.cidade, cliente.estado]
                                        .filter((value): value is string => Boolean(value))
                                        .join(' - ')
                                    : cliente.empresa}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              cliente.tipo === 'pessoa_juridica'
                                ? 'border-[#CFE1EC] bg-[#F2F8FB] text-[#325569]'
                                : 'border-[#D6E7E2] bg-[#EFF7F4] text-[#1A8877]'
                            }`}
                          >
                            {cliente.tipo === 'pessoa_juridica'
                              ? 'Pessoa juridica'
                              : 'Pessoa fisica'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-[#244455]">
                            {formatDocumento(cliente.documento, cliente.tipo)}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {cliente.email ? (
                              <a
                                href={`mailto:${cliente.email}`}
                                onClick={(event) => event.stopPropagation()}
                                className="block truncate text-sm text-[#159A9C] hover:text-[#0F7B7D]"
                              >
                                {cliente.email}
                              </a>
                            ) : (
                              <p className="truncate text-xs text-[#7B95A1]">Sem e-mail</p>
                            )}
                            {cliente.telefone ? (
                              <a
                                href={`tel:${cliente.telefone}`}
                                onClick={(event) => event.stopPropagation()}
                                className="block truncate text-sm text-[#355061]"
                              >
                                {cliente.telefone}
                              </a>
                            ) : (
                              <p className="truncate text-xs text-[#7B95A1]">Sem telefone</p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div
                            className="flex items-center gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <select
                              value={cliente.status}
                              onChange={(event) =>
                                handleStatusUpdate(
                                  cliente.id!,
                                  event.target.value as Cliente['status'],
                                )
                              }
                              disabled={Boolean(statusUpdateInProgress[cliente.id!])}
                              className="h-8 w-full max-w-[150px] rounded-lg border border-[#D4E2E7] bg-white px-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:bg-[#F2F6F8]"
                            >
                              {CLIENTE_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {statusUpdateInProgress[cliente.id!] && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#159A9C]" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-[#4F6D7B]">
                          {cliente.created_at
                            ? new Date(cliente.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCliente(cliente);
                              }}
                              className="rounded-lg p-1.5 text-[#7A95A2] transition-colors hover:bg-[#EAF3F6] hover:text-[#159A9C]"
                              title="Abrir perfil"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCliente(cliente);
                              }}
                              className="rounded-lg p-1.5 text-[#7A95A2] transition-colors hover:bg-[#EAF3F6] hover:text-[#159A9C]"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCliente(cliente.id!);
                              }}
                              className="rounded-lg p-1.5 text-[#7A95A2] transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {clientesData && clientesData.totalPages > 1 && (
            <div className="border-t border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[#4F6D7B]">
                  Exibindo{' '}
                  <span className="font-medium text-[#19384C]">
                    {((clientesData.page || 1) - 1) * (clientesData.limit || 10) + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium text-[#19384C]">
                    {Math.min(
                      (clientesData.page || 1) * (clientesData.limit || 10),
                      clientesData.total,
                    )}
                  </span>{' '}
                  de <span className="font-medium text-[#19384C]">{clientesData.total}</span>{' '}
                  registros
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!clientesData.page || clientesData.page === 1}
                    className="hidden rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
                  >
                    Primeira
                  </button>

                  <button
                    onClick={() => handlePageChange(Math.max(1, (clientesData.page || 1) - 1))}
                    disabled={!clientesData.page || clientesData.page === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: Math.min(5, clientesData.totalPages) }, (_, i) => {
                      const startPage = Math.max(1, (clientesData.page || 1) - 2);
                      const page = startPage + i;
                      if (page > clientesData.totalPages) return null;

                      const isCurrentPage = page === clientesData.page;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            isCurrentPage
                              ? 'border-[#159A9C] bg-[#159A9C] text-white'
                              : 'border-[#D4E2E7] bg-white text-[#385A6A] hover:bg-[#F6FAF9]'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      handlePageChange(
                        Math.min(clientesData.totalPages, (clientesData.page || 1) + 1),
                      )
                    }
                    disabled={!clientesData.page || clientesData.page === clientesData.totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Proxima</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handlePageChange(clientesData.totalPages)}
                    disabled={!clientesData.page || clientesData.page === clientesData.totalPages}
                    className="hidden rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
                  >
                    Ultima
                  </button>
                </div>
              </div>
            </div>
          )}
        </DataTableCard>
      )}
      {showSaveViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10232E]/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Salvar view"
            className="w-full max-w-md rounded-2xl border border-[#D4E2E7] bg-white p-5 shadow-[0_26px_60px_-24px_rgba(16,57,74,0.45)]"
          >
            <h2 className="text-lg font-semibold text-[#19384C]">{saveViewModalTitle}</h2>
            <p className="mt-1 text-sm text-[#4F6D7B]">{saveViewModalDescription}</p>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-[#385A6A]">Nome da view</label>
              <input
                type="text"
                data-testid="clientes-save-view-input"
                value={saveViewName}
                onChange={(event) => setSaveViewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    handleCloseSaveViewModal();
                    return;
                  }

                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSaveCurrentView().catch(() => {
                      // Erros tratados por feedback em tela.
                    });
                  }
                }}
                placeholder="Ex: Leads de fevereiro"
                autoFocus
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseSaveViewModal}
                disabled={isSavingView}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveCurrentView().catch(() => {
                    // Erros tratados por feedback em tela.
                  });
                }}
                data-testid="clientes-save-view-submit"
                disabled={isSavingView || saveViewName.trim().length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingView ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSavingView ? 'Salvando...' : saveViewActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Criacao/Edicao */}
      <ModalCadastroCliente
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedCliente(null);
        }}
        onSave={handleSaveCliente}
        cliente={selectedCliente}
        isLoading={isModalLoading}
      />
    </div>
  );
};

export default ClientesPage;
