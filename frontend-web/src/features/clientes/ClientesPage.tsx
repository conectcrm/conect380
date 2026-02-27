import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ModalCadastroCliente from '../../components/modals/ModalCadastroCliente';
import { ModalDetalhesCliente } from '../../components/modals/ModalDetalhesCliente';
import { ClienteCard } from '../../components/clientes';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import {
  clientesService,
  Cliente,
  ClienteAttachment,
  ClienteFilters,
  ClientesEstatisticas,
  PaginatedClientes,
} from '../../services/clientesService';
import { UploadResult } from '../../services/uploadService';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  BookmarkPlus,
  BookmarkX,
  Eye,
  Edit,
  Star,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Grid3X3,
  List,
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
import ActiveEmpresaBadge from '../../components/tenant/ActiveEmpresaBadge';

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
const CLIENTES_SEARCH_DEBOUNCE_MS = 500;
const CLIENTES_SEARCH_MIN_CHARS = 2;

type ClientesViewMode = 'cards' | 'table';

type SavedClientesView = {
  id: string;
  name: string;
  searchTerm: string;
  status: string;
  tipo: string;
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
  viewMode: ClientesViewMode;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  activeViewId: string;
};

type SaveViewModalMode = 'save' | 'rename';

type ClienteNotasResumo = {
  total: number;
  importantes: number;
};

type ClienteDemandasResumo = {
  total: number;
  abertas: number;
  urgentes: number;
};

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

    const normalized = parsed
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
): Omit<Cliente, 'id' | 'created_at' | 'updated_at'> => ({
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
  empresa: cliente.empresa,
  cargo: cliente.cargo,
  site: cliente.site,
  observacoes: cliente.observacoes,
  tags: cliente.tags,
  data_nascimento: cliente.data_nascimento,
  genero: cliente.genero,
  profissao: cliente.profissao,
  renda: cliente.renda,
  avatar: cliente.avatar,
  avatarUrl: cliente.avatarUrl,
  avatar_url: cliente.avatar_url,
  foto: cliente.foto,
});

const ClientesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useGlobalConfirmation();
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
    sortBy: persistedStateRef.current.sortBy ?? 'created_at',
    sortOrder: persistedStateRef.current.sortOrder ?? 'DESC',
  }));
  const [searchTerm, setSearchTerm] = useState(persistedStateRef.current.searchTerm ?? '');
  const [selectedStatus, setSelectedStatus] = useState(persistedStateRef.current.status ?? '');
  const [selectedTipo, setSelectedTipo] = useState(persistedStateRef.current.tipo ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [clienteAttachments, setClienteAttachments] = useState<ClienteAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [clienteNotasResumo, setClienteNotasResumo] = useState<ClienteNotasResumo | null>(null);
  const [clienteDemandasResumo, setClienteDemandasResumo] = useState<ClienteDemandasResumo | null>(
    null,
  );
  const [relacionamentosLoading, setRelacionamentosLoading] = useState(false);
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
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState<Record<string, boolean>>({});
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

  // Ref para rastrear se e a primeira montagem (evitar execucao desnecessaria)
  const isFirstMount = useRef(true);
  const hasHydratedQueryRef = useRef(false);
  const hasAppliedDefaultViewRef = useRef(false);
  const processedHighlightRef = useRef('');
  const clientesRequestRef = useRef(0);
  const attachmentsRequestRef = useRef(0);
  const relacionamentosRequestRef = useRef(0);
  const inFlightLoadKeyRef = useRef<string | null>(null);
  const lastEstatisticasLoadedAtRef = useRef(0);
  const hasLoadedEstatisticasRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
        search: filters.search ?? '',
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

  // Aplicar filtros com debounce para busca
  useEffect(() => {
    // Pular execucao na primeira montagem (valores iniciais vazios)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const delayDebounce = setTimeout(() => {
      setFilters((prev) => {
        const currentPage = prev.page ?? 1;
        const normalizedSearch = searchTerm.trim();
        const shouldApplySearch =
          normalizedSearch.length === 0 || normalizedSearch.length >= CLIENTES_SEARCH_MIN_CHARS;
        const nextSearch = shouldApplySearch ? normalizedSearch : (prev.search ?? '');
        const nextStatus = selectedStatus;
        const nextTipo = selectedTipo;

        if (
          (prev.search ?? '') === nextSearch &&
          (prev.status ?? '') === nextStatus &&
          (prev.tipo ?? '') === nextTipo &&
          currentPage === 1
        ) {
          return prev;
        }

        return {
          ...prev,
          search: nextSearch,
          status: nextStatus,
          tipo: nextTipo,
          page: 1, // Reset para primeira pagina quando filtros mudam
        };
      });
    }, CLIENTES_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedStatus, selectedTipo]);

  useEffect(() => {
    if (hasHydratedQueryRef.current) {
      return;
    }

    hasHydratedQueryRef.current = true;

    const querySearch = searchParams.get('q');
    const queryStatus = searchParams.get('status');
    const queryTipo = searchParams.get('tipo');
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
      const nextSearch = querySearch ?? prev.search ?? '';
      const nextStatus = queryStatus ?? prev.status ?? '';
      const nextTipo = queryTipo ?? prev.tipo ?? '';
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
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
      };
    });
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const persistedState: PersistedClientesPageState = {
      searchTerm,
      status: selectedStatus,
      tipo: selectedTipo,
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
    const normalizedSearch = (filters.search ?? '').trim();

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
    filters.search,
    filters.sortBy,
    filters.sortOrder,
    searchParamsSerialized,
    selectedStatus,
    selectedTipo,
    setSearchParams,
    viewMode,
  ]);

  useEffect(() => {
    setSelectedClientes([]);
    setSelectAllFiltered(false);
    setExcludedClientes([]);
  }, [
    filters.search,
    filters.status,
    filters.tipo,
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
      setSelectedCliente(clienteDaPagina);
      setShowDetailsModal(true);
      setSearchParams(nextParams, { replace: true });
      return;
    }

    let cancelled = false;

    const carregarClientePorId = async () => {
      try {
        const cliente = await clientesService.getClienteById(highlightId);
        if (!cancelled && cliente?.id) {
          setSelectedCliente(cliente);
          setShowDetailsModal(true);
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
  }, [clientes, isLoading, searchParams, setSearchParams]);

  const loadClienteAttachments = useCallback(async (clienteId: string) => {
    const requestId = ++attachmentsRequestRef.current;

    try {
      setAttachmentsLoading(true);
      const attachments = await clientesService.listarAnexosCliente(clienteId);

      if (attachmentsRequestRef.current !== requestId) {
        return;
      }

      setClienteAttachments(attachments);
    } catch (error) {
      if (attachmentsRequestRef.current !== requestId) {
        return;
      }

      console.error('Erro ao carregar anexos do cliente:', error);
      setClienteAttachments([]);
      toast.error('Nao foi possivel carregar os anexos do cliente.');
    } finally {
      if (attachmentsRequestRef.current === requestId) {
        setAttachmentsLoading(false);
      }
    }
  }, []);

  const loadClienteRelacionamentos = useCallback(async (clienteId: string) => {
    const requestId = ++relacionamentosRequestRef.current;

    try {
      setRelacionamentosLoading(true);

      const [notasResumo, demandasResumo] = await Promise.all([
        clientesService.contarNotasCliente(clienteId).catch(() => null),
        clientesService.contarDemandasCliente(clienteId).catch(() => null),
      ]);

      if (relacionamentosRequestRef.current !== requestId) {
        return;
      }

      setClienteNotasResumo(notasResumo);
      setClienteDemandasResumo(demandasResumo);
    } catch (error) {
      if (relacionamentosRequestRef.current !== requestId) {
        return;
      }

      console.error('Erro ao carregar resumo de relacionamentos do cliente:', error);
      setClienteNotasResumo(null);
      setClienteDemandasResumo(null);
    } finally {
      if (relacionamentosRequestRef.current === requestId) {
        setRelacionamentosLoading(false);
      }
    }
  }, []);

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

  useEffect(() => {
    if (!showDetailsModal || !selectedCliente?.id) {
      attachmentsRequestRef.current += 1;
      relacionamentosRequestRef.current += 1;
      setClienteAttachments([]);
      setAttachmentsLoading(false);
      setClienteNotasResumo(null);
      setClienteDemandasResumo(null);
      setRelacionamentosLoading(false);
      return;
    }

    loadClienteAttachments(selectedCliente.id);
    loadClienteRelacionamentos(selectedCliente.id);
  }, [loadClienteAttachments, loadClienteRelacionamentos, selectedCliente?.id, showDetailsModal]);

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedTipo('');
    setActiveViewId('');
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

  const visibleClienteIds = useMemo(
    () => clientes.map((cliente) => cliente.id).filter((id): id is string => Boolean(id)),
    [clientes],
  );

  const totalRegistros = clientesData?.total ?? clientes.length;
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
    setViewMode(selectedView.viewMode);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: selectedView.limit,
      search: selectedView.searchTerm,
      status: selectedView.status,
      tipo: selectedView.tipo,
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
    setViewMode(defaultView.viewMode);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: defaultView.limit,
      search: defaultView.searchTerm,
      status: defaultView.status,
      tipo: defaultView.tipo,
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

  // Handler para salvar cliente (criar/editar)
  const handleSaveCliente = async (
    clienteData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>,
  ) => {
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

      if (selectedCliente?.id === id) {
        setShowDetailsModal(false);
        setSelectedCliente(null);
        setClienteAttachments([]);
        setClienteNotasResumo(null);
        setClienteDemandasResumo(null);
        setRelacionamentosLoading(false);
      }

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
    setSelectedCliente(cliente);
    setShowDetailsModal(true);
  };

  const handleOpenClienteProfile = (clienteId: string) => {
    const basePath = location.pathname.startsWith('/crm/') ? '/crm/clientes' : '/clientes';
    setShowDetailsModal(false);
    setSelectedCliente(null);
    navigate(`${basePath}/${clienteId}`);
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

  const handleAttachmentAdd = async (clienteId: string, attachment: UploadResult) => {
    if (selectedCliente?.id === clienteId && showDetailsModal) {
      await loadClienteAttachments(clienteId);
    }

    toast.success(`Anexo ${attachment.fileName} adicionado com sucesso.`, {
      duration: 3500,
      position: 'top-right',
    });
  };

  const handleAttachmentRemove = async (clienteId: string, attachmentId: string) => {
    try {
      await clientesService.removerAnexoCliente(clienteId, attachmentId);

      setClienteAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
      toast.success('Anexo removido com sucesso.', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Erro ao remover anexo do cliente:', error);
      toast.error('Nao foi possivel remover o anexo.', {
        duration: 5000,
        position: 'top-right',
      });
    }
  };

  const isInitialLoading = isLoading && clientes.length === 0;
  const isRefreshingResults = isLoading && clientes.length > 0;
  const pageDescription = isInitialLoading
    ? 'Carregando clientes...'
    : isRefreshingResults
      ? 'Atualizando resultados...'
      : `Gerencie seus ${estatisticas.total} clientes e contatos`;
  const hasFilters = Boolean(searchTerm || selectedStatus || selectedTipo);
  const activeView = savedViews.find((view) => view.id === activeViewId) ?? null;
  const hasFilterChips = hasFilters || Boolean(activeView);
  const activeFilterCount =
    Number(Boolean(searchTerm.trim())) +
    Number(Boolean(selectedStatus)) +
    Number(Boolean(selectedTipo)) +
    Number(Boolean(activeViewId));
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
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span>Clientes</span>
              {activeFilterCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-semibold text-[#0F7B7D]">
                  {activeFilterCount} filtro{activeFilterCount === 1 ? '' : 's'} ativo
                  {activeFilterCount === 1 ? '' : 's'}
                </span>
              ) : null}
            </span>
          }
          description={pageDescription}
          filters={<ActiveEmpresaBadge variant="page" />}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-[#D4E2E7] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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
                onClick={handleExportClientes}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
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
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Novo Cliente
              </button>
            </div>
          }
        />

        {!isLoading && (
          <InlineStats
            stats={[
              { label: 'Total', value: String(estatisticas.total), tone: 'neutral' },
              { label: 'Ativos', value: String(estatisticas.ativos), tone: 'accent' },
              { label: 'Prospects', value: String(estatisticas.prospects), tone: 'accent' },
              { label: 'Leads', value: String(estatisticas.leads), tone: 'neutral' },
            ]}
          />
        )}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[260px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">
              Buscar clientes
              <span className="ml-1 text-xs font-normal text-[#6F8B98]">atalho: /</span>
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

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            >
              <option value="">Todos os status</option>
              {CLIENTE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Tipo</label>
            <select
              value={selectedTipo}
              onChange={(e) => handleTipoChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            >
              <option value="">Todos os tipos</option>
              {CLIENTE_TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Views salvas</label>
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
                  onClick={handleDuplicateActiveView}
                  data-testid="clientes-duplicate-view-button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
                  title="Duplicar view ativa"
                >
                  <Copy className="h-4 w-4" />
                  <span>Duplicar</span>
                </button>
              )}
              {activeViewId && (
                <button
                  onClick={handleSetDefaultActiveView}
                  data-testid="clientes-set-default-view-button"
                  disabled={Boolean(activeView?.isDefault)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                  title={activeView?.isDefault ? 'View padrao ativa' : 'Definir como view padrao'}
                >
                  <Star className="h-4 w-4" />
                  <span>{activeView?.isDefault ? 'Padrao' : 'Definir padrao'}</span>
                </button>
              )}
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

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Acoes</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleClearFilters}
                disabled={!hasFilterChips}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Filter className="h-4 w-4" />
                Limpar
              </button>
            </div>
          </div>
        </div>
      </FiltersBar>

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

      {!isLoading && clientes.length === 0 && (
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

      {clientes.length > 0 && (
        <DataTableCard>
          {viewMode === 'cards' ? (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {clientes.map((cliente) => (
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
                    {clientes.length} de {totalRegistros} registros
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
                      <button
                        onClick={handleBulkExport}
                        disabled={isBulkExporting || isBulkDeleting}
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
                        disabled={isBulkDeleting || isBulkExporting}
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
                    disabled={isBulkDeleting || isBulkExporting}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-xs font-medium text-[#385A6A] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar todos
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1180px] bg-white">
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
                    {clientes.map((cliente, index) => (
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
                              title="Ver detalhes"
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

      {/* Modal de Detalhes */}
      <ModalDetalhesCliente
        key={selectedCliente?.id ?? 'detalhes-cliente'}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCliente(null);
        }}
        cliente={selectedCliente}
        onEdit={(cliente) => {
          setShowDetailsModal(false);
          setSelectedCliente(cliente);
          setShowCreateModal(true);
        }}
        onDelete={handleDeleteCliente}
        onOpenProfile={handleOpenClienteProfile}
        onAvatarUpdate={handleAvatarUpdate}
        onAttachmentAdd={handleAttachmentAdd}
        attachments={clienteAttachments}
        attachmentsLoading={attachmentsLoading}
        onAttachmentRemove={handleAttachmentRemove}
        notasResumo={clienteNotasResumo}
        demandasResumo={clienteDemandasResumo}
        relacionamentosLoading={relacionamentosLoading}
      />
    </div>
  );
};

export default ClientesPage;
