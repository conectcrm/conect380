import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { ModalProposta } from '../../components/modals/ModalProposta';
import { ModalNovaProposta } from '../../components/modals/ModalNovaProposta';
import {
  DataTableCard,
  PageHeader,
  SectionCard,
  shellFieldTokens,
  shellTokens,
} from '../../components/layout-v2';
import { propostasService, Proposta as PropostaCompleta } from '../../services/propostasService';
import { pdfPropostasService, DadosProposta } from '../../services/pdfPropostasService';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import DashboardPropostas from './components/DashboardPropostas';
import BulkActions from './components/BulkActions';
import FiltrosAvancados from './components/FiltrosAvancados';
import PropostaActions from './components/PropostaActions';
import StatusFluxo from './components/StatusFluxo';
import ModalVisualizarProposta from './components/ModalVisualizarProposta';
import {
  propostasService as propostasFeatureService,
  type PropostaCompleta as PropostaCompletaFeature,
} from './services/propostasService';
import SelecaoMultipla from './components/SelecaoMultipla';
import PreviewProposta from './components/PreviewProposta';
import { createSafeMouseHandler } from '../../utils/dom-helper';
import { safeRender } from '../../utils/safeRender';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Grid,
  List,
  ArrowUp,
  ArrowDown,
  X,
  BarChart3,
  RefreshCw,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react';

// 🔧 Função auxiliar para buscar dados reais do cliente (com cache para evitar requisições duplicadas)
const clienteCache = new Map();
let clientesGlobaisPromise: Promise<any[]> | null = null;
let ultimaCarregaClientes = 0;
const CACHE_CLIENTES_DURACAO = 5 * 60 * 1000; // 5 minutos

const buscarDadosReaisDoCliente = async (nome: string, emailFicticio: string = '') => {
  if (!nome || nome === 'Cliente não informado') return null;

  // Verificar cache primeiro
  const cacheKey = nome.toLowerCase().trim();
  if (clienteCache.has(cacheKey)) {
    return clienteCache.get(cacheKey);
  }

  try {
    // ⚡ OTIMIZADO: Verificar se o cache global ainda é válido
    const agora = Date.now();
    const cacheExpirado = agora - ultimaCarregaClientes > CACHE_CLIENTES_DURACAO;

    if (!clientesGlobaisPromise || cacheExpirado) {
      if (cacheExpirado) {
        clientesGlobaisPromise = null;
      }

      ultimaCarregaClientes = agora;
      clientesGlobaisPromise = import('../../services/clientesService')
        .then((module) => module.clientesService.getClientes({ limit: 100 }))
        .then((response) => {
          return response?.data || [];
        })
        .catch((error) => {
          console.error(`❌ [CACHE GLOBAL] Erro ao carregar clientes:`, error);
          clientesGlobaisPromise = null; // Reset para tentar novamente
          ultimaCarregaClientes = 0;
          return [];
        });
    }

    const todosClientes = await clientesGlobaisPromise;

    if (todosClientes && todosClientes.length > 0) {
      const clienteReal = todosClientes.find(
        (c) =>
          c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
          nome.toLowerCase().includes(c.nome?.toLowerCase()),
      );

      let resultado = null;
      if (clienteReal && clienteReal.email && clienteReal.email !== emailFicticio) {
        resultado = {
          nome: clienteReal.nome,
          email: clienteReal.email,
          telefone: clienteReal.telefone,
        };
      }

      // Armazenar no cache por 5 minutos
      clienteCache.set(cacheKey, resultado);
      return resultado;
    }
  } catch (error) {
    // Falha silenciosa: mantemos os dados originais quando o backend não responde
    // Armazenar null no cache para evitar tentativas repetidas
    clienteCache.set(cacheKey, null);
  }

  return null;
};

// Função para converter PropostaCompleta para o formato da UI
const converterPropostaParaUI = async (proposta: any) => {
  // Extrair dados do cliente de forma mais robusta
  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';
  let clienteTelefone = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    // Cliente como objeto (formato correto)
    clienteNome = safeRender(proposta.cliente.nome) || 'Cliente não informado';
    clienteEmail = safeRender(proposta.cliente.email) || '';
    clienteTelefone = safeRender(proposta.cliente.telefone) || '';

    // ⚡ OTIMIZADO: Só buscar dados reais se realmente necessário e não estiver em cache
    const isEmailFicticio =
      clienteEmail &&
      (clienteEmail.includes('@cliente.com') ||
        clienteEmail.includes('@cliente.temp') ||
        clienteEmail.includes('@email.com'));

    if (isEmailFicticio) {
      // ✅ CACHE OTIMIZADO: Verificar cache primeiro, apenas buscar se necessário
      const cacheKey = `cliente_${clienteNome.toLowerCase().trim()}`;

      if (clienteCache.has(cacheKey)) {
        const dadosCache = clienteCache.get(cacheKey);
        if (dadosCache) {
          clienteNome = dadosCache.nome;
          clienteEmail = dadosCache.email;
          clienteTelefone = dadosCache.telefone;
        }
      } else {
        const dadosReais = await buscarDadosReaisDoCliente(clienteNome, clienteEmail);

        if (dadosReais) {
          clienteNome = dadosReais.nome;
          clienteEmail = dadosReais.email;
          clienteTelefone = dadosReais.telefone;
        } else {
        }
      }
    }
  } else if (typeof proposta.cliente === 'string') {
    // Cliente como string (formato antigo)
    clienteNome = safeRender(proposta.cliente);

    // ⚡ OTIMIZADO: Cache para clientes string também
    const cacheKey = `cliente_${clienteNome.toLowerCase().trim()}`;

    if (clienteCache.has(cacheKey)) {
      const dadosCache = clienteCache.get(cacheKey);
      if (dadosCache) {
        clienteNome = dadosCache.nome;
        clienteEmail = dadosCache.email;
        clienteTelefone = dadosCache.telefone;
      }
    } else {
      const dadosReais = await buscarDadosReaisDoCliente(clienteNome);

      if (dadosReais) {
        clienteNome = dadosReais.nome;
        clienteEmail = dadosReais.email;
        clienteTelefone = dadosReais.telefone;
      } else {
        clienteEmail = ''; // Deixar vazio se não encontrou
      }
    }
  }

  // Correcao de datas: garantir que as datas sejam validas
  const criadaEm = proposta.criadaEm ? new Date(proposta.criadaEm) : new Date();
  const dataValidade = proposta.dataValidade
    ? new Date(proposta.dataValidade)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias por padrão

  // Validar se as datas são válidas
  const dataCreated = !isNaN(criadaEm.getTime())
    ? criadaEm.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  const dataExpiry = !isNaN(dataValidade.getTime())
    ? dataValidade.toISOString().split('T')[0]
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Calcular dias restantes
  const hoje = new Date();
  const diasRestantes = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

  const versoes = Array.isArray((proposta as any).versoes)
    ? [...(proposta as any).versoes]
    : Array.isArray((proposta as any).emailDetails?.versoes)
      ? [...(proposta as any).emailDetails.versoes]
      : [];
  versoes.sort((a: any, b: any) => Number(a?.versao || 0) - Number(b?.versao || 0));
  const totalVersoes = versoes.length;
  const ultimaVersao = totalVersoes > 0 ? Number(versoes[totalVersoes - 1]?.versao || totalVersoes) : 0;
  const penultimaVersao = totalVersoes > 1 ? versoes[totalVersoes - 2] : null;
  const ultimaVersaoSnapshot = totalVersoes > 0 ? versoes[totalVersoes - 1]?.snapshot || {} : {};
  const penultimaVersaoSnapshot = penultimaVersao?.snapshot || {};
  const totalAtualVersao = Number(ultimaVersaoSnapshot.total ?? ultimaVersaoSnapshot.valor ?? 0) || 0;
  const totalBaseVersao =
    Number(penultimaVersaoSnapshot.total ?? penultimaVersaoSnapshot.valor ?? 0) || 0;
  const deltaUltimaVersao = totalVersoes > 1 ? totalAtualVersao - totalBaseVersao : 0;
  const statusMudouUltimaVersao =
    totalVersoes > 1 &&
    String(ultimaVersaoSnapshot.status || '').trim() !==
      String(penultimaVersaoSnapshot.status || '').trim();

  const resultado = {
    id: safeRender(proposta.id) || '',
    numero: safeRender(proposta.numero) || '',
    cliente: clienteNome,
    cliente_contato: clienteEmail, // ✅ Agora contém dados reais quando possível
    cliente_telefone: clienteTelefone, // ✅ Incluir telefone real
    titulo: `Proposta para ${clienteNome}`,
    valor: Number(proposta.total) || 0,
    status: safeRender(proposta.status) || 'rascunho',
    data_criacao: dataCreated,
    data_vencimento: dataExpiry,
    dias_restantes: diasRestantes, // ✅ Campo calculado para mostrar dias restantes
    data_aprovacao: proposta.status === 'aprovada' ? new Date().toISOString().split('T')[0] : null,
    vendedor:
      typeof proposta.vendedor === 'object' && proposta.vendedor?.nome
        ? safeRender(proposta.vendedor.nome)
        : typeof proposta.vendedor === 'string'
          ? safeRender(proposta.vendedor)
          : 'Sistema', // Usando vendedor real quando disponível
    descricao:
      safeRender(proposta.observacoes) || `Proposta com ${proposta.produtos?.length || 0} produtos`,
    probabilidade:
      proposta.status === 'aprovada'
        ? 100
        : proposta.status === 'enviada'
          ? 70
          : proposta.status === 'rejeitada'
            ? 0
            : 30,
    categoria: 'proposta',
    motivoPerda:
      safeRender((proposta as any).motivoPerda) || safeRender((proposta as any).motivo_perda) || '',
    aprovacaoInterna:
      (proposta as any).aprovacaoInterna || (proposta as any).emailDetails?.aprovacaoInterna,
    lembretes: Array.isArray((proposta as any).lembretes)
      ? (proposta as any).lembretes
      : Array.isArray((proposta as any).emailDetails?.lembretes)
        ? (proposta as any).emailDetails.lembretes
        : [],
    historicoEventos: Array.isArray((proposta as any).historicoEventos)
      ? (proposta as any).historicoEventos
      : Array.isArray((proposta as any).emailDetails?.historicoEventos)
        ? (proposta as any).emailDetails.historicoEventos
        : [],
    versoes,
    totalVersoes,
    ultimaVersao,
    deltaUltimaVersao,
    statusMudouUltimaVersao,
    urgencia: diasRestantes <= 3 ? 'alta' : diasRestantes <= 7 ? 'media' : 'baixa', // ✅ Indicador de urgência
  };

  return resultado;
};

// Dados removidos - sistema agora trabalha apenas com dados reais do banco

const actionPrimaryButtonClass =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60';
const actionSecondaryButtonClass =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60';
const viewToggleBaseClass =
  'inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors';
const MOTIVOS_PERDA_STORAGE_KEY = 'conect360:propostas:motivos-perda';

type MotivoPerdaMap = Record<
  string,
  {
    motivo: string;
    updatedAt: string;
  }
>;

const PropostasPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Estados inicializados com arrays vazios - dados vêm do banco
  const [propostas, setPropostas] = useState<any[]>([]);
  const [filteredPropostas, setFilteredPropostas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedVendedor, setSelectedVendedor] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);

  // Sistema de Controle de Atualizações v2
  const [isLoadingPropostas, setIsLoadingPropostas] = useState(false);
  const updateControl = React.useRef({
    lastUpdate: 0,
    pendingUpdate: false,
    updateSource: '',
    batchTimeout: null as NodeJS.Timeout | null,
    requestId: null as string | null,
  });
  const REFRESH_CONFIG = {
    minInterval: 5000, // Intervalo mínimo entre atualizações
    batchWindow: 2000, // Janela para agrupar múltiplas solicitações
    forceInterval: 30000, // Intervalo para forçar atualização mesmo sem mudanças
    modalDebounce: 1000, // Debounce específico para interações do modal
  };

  // Sistema unificado de logs
  const logUpdate = (_action: string, _details: any = {}) => {};

  // Novos estados para funcionalidades avançadas
  const [selectedPropostas, setSelectedPropostas] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'data_criacao' | 'valor' | 'cliente' | 'status'>(
    'data_criacao',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'dashboard'>('dashboard'); // Novo modo dashboard
  const [filtrosAvancados, setFiltrosAvancados] = useState<any>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [motivosPerda, setMotivosPerda] = useState<MotivoPerdaMap>(() => {
    try {
      const raw = localStorage.getItem(MOTIVOS_PERDA_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }
      return parsed as MotivoPerdaMap;
    } catch {
      return {};
    }
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPropostaForView, setSelectedPropostaForView] =
    useState<PropostaCompletaFeature | null>(null);

  // 🆕 Estados para UX Melhorada - Fase 2
  const [propostasSelecionadas, setPropostasSelecionadas] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewProposta, setPreviewProposta] = useState<any>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Função para mostrar notificações
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MOTIVOS_PERDA_STORAGE_KEY, JSON.stringify(motivosPerda));
    } catch {
      // Falha silenciosa para nao interromper a UX em ambientes sem storage disponivel.
    }
  }, [motivosPerda]);

  const getPropostaStorageKey = useCallback((proposta: any) => {
    if (!proposta) return '';
    const chave = safeRender(proposta.id) || safeRender(proposta.numero);
    return String(chave || '');
  }, []);

  const getMotivoPerda = useCallback(
    (proposta: any) => {
      const motivoBackend =
        safeRender((proposta as any)?.motivoPerda) || safeRender((proposta as any)?.motivo_perda);
      if (motivoBackend) {
        return motivoBackend;
      }

      const chave = getPropostaStorageKey(proposta);
      if (!chave) return '';
      return motivosPerda[chave]?.motivo || '';
    },
    [getPropostaStorageKey, motivosPerda],
  );

  const handleRegistrarMotivoPerda = useCallback(
    async (proposta: any) => {
      const propostaChave = getPropostaStorageKey(proposta);
      if (!propostaChave) {
        showNotification(
          'Nao foi possivel identificar a proposta para registrar o motivo.',
          'error',
        );
        return;
      }

      const statusAtual = safeRender(proposta?.status);
      if (statusAtual !== 'rejeitada') {
        showNotification(
          'O motivo de perda so pode ser registrado para propostas rejeitadas.',
          'error',
        );
        return;
      }

      const motivoAtual = getMotivoPerda(proposta);
      const motivoInformado = window.prompt(
        `Informe o motivo de perda da proposta ${safeRender(proposta?.numero) || propostaChave}:`,
        motivoAtual,
      );

      if (motivoInformado === null) {
        return;
      }

      const motivoLimpo = motivoInformado.trim();
      const propostaId = safeRender(proposta?.id) || safeRender(proposta?.numero);

      try {
        if (propostaId) {
          await propostasService.updateStatus(propostaId, 'rejeitada' as any, {
            source: 'motivo-perda',
            motivoPerda: motivoLimpo || '',
          });
        }

        const atualizarMotivo = (lista: any[]) =>
          lista.map((item) => {
            const corresponde =
              String(safeRender(item?.id)) === String(propostaId) ||
              String(safeRender(item?.numero)) === String(propostaId) ||
              String(safeRender(item?.id)) === propostaChave ||
              String(safeRender(item?.numero)) === propostaChave;

            if (!corresponde) return item;
            return {
              ...item,
              status: 'rejeitada',
              motivoPerda: motivoLimpo || '',
            };
          });

        setPropostas((prev) => atualizarMotivo(prev));
        setFilteredPropostas((prev) => atualizarMotivo(prev));

        setMotivosPerda((prev) => {
          if (!motivoLimpo) {
            if (!prev[propostaChave]) {
              return prev;
            }
            const next = { ...prev };
            delete next[propostaChave];
            return next;
          }

          return {
            ...prev,
            [propostaChave]: {
              motivo: motivoLimpo,
              updatedAt: new Date().toISOString(),
            },
          };
        });

        showNotification(
          motivoLimpo ? 'Motivo de perda atualizado com sucesso.' : 'Motivo de perda removido.',
          'success',
        );
      } catch (error) {
        // Fallback local para nao bloquear a operacao em caso de indisponibilidade da API.
        setMotivosPerda((prev) => {
          if (!motivoLimpo) {
            const next = { ...prev };
            delete next[propostaChave];
            return next;
          }

          return {
            ...prev,
            [propostaChave]: {
              motivo: motivoLimpo,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        showNotification('Falha ao persistir no servidor. Motivo salvo localmente.', 'error');
      }
    },
    [getMotivoPerda, getPropostaStorageKey, showNotification],
  );

  // Sistema Inteligente de Atualizações v2
  const carregarPropostas = useCallback(
    async (
      options: {
        force?: boolean;
        source?: string;
        immediate?: boolean;
      } = {},
    ) => {
      const { force = false, source = 'manual', immediate = false } = options;
      const now = Date.now();
      const requestId = `req_${now}_${Math.random().toString(36).substr(2, 9)}`;

      // Função para verificar se devemos prosseguir com a atualização
      const shouldUpdate = () => {
        if (force) return true;
        if (isLoadingPropostas) return false;

        const timeSinceLastUpdate = now - updateControl.current.lastUpdate;
        if (timeSinceLastUpdate < REFRESH_CONFIG.minInterval) {
          logUpdate('UPDATE_REJECTED', {
            reason: 'TOO_SOON',
            source,
            timeSinceLastUpdate,
          });
          return false;
        }

        return true;
      };

      // Se já houver uma atualização pendente e não for forçada, apenas registre
      if (!force && updateControl.current.pendingUpdate) {
        logUpdate('UPDATE_QUEUED', { source, requestId });
        return;
      }

      try {
        setIsLoadingPropostas(true);
        setIsLoading(true);
        updateControl.current.lastUpdate = now;
        updateControl.current.requestId = requestId;

        const propostasReais = await propostasService.findAll();

        // Verificar se esta requisição ainda é válida (evitar race conditions)
        if (updateControl.current.requestId !== requestId) {
          return;
        }

        if (propostasReais && propostasReais.length > 0) {
          // ✅ CONVERTER TODAS AS PROPOSTAS COM BUSCA DE DADOS REAIS
          const propostasFormatadas = await Promise.all(
            propostasReais.map(async (proposta) => {
              // Converter proposta do backend para o formato esperado
              const propostaFormatada = {
                id: proposta.id,
                numero: proposta.numero,
                cliente: proposta.cliente, // O backend já retorna o objeto cliente correto
                total: (proposta as any).valor || proposta.total,
                status: proposta.status,
                observacoes: proposta.observacoes,
                motivoPerda: (proposta as any).motivoPerda || '',
                criadaEm: (proposta as any).criadaEm || new Date().toISOString(),
                dataValidade:
                  (proposta as any).dataVencimento ||
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                vendedor: proposta.vendedor,
                produtos: (proposta as any).produtos || [],
              };
              return await converterPropostaParaUI(propostaFormatada);
            }),
          );

          // Verificar novamente se esta requisição ainda é válida
          if (updateControl.current.requestId !== requestId) {
            return;
          }

          // Validar que todas as propostas têm campos string
          const propostasValidadas = propostasFormatadas.map((proposta) => ({
            ...proposta,
            numero: safeRender(proposta.numero),
            cliente: safeRender(proposta.cliente),
            cliente_contato: safeRender(proposta.cliente_contato),
            titulo: safeRender(proposta.titulo),
            status: safeRender(proposta.status),
            vendedor: safeRender(proposta.vendedor),
            categoria: safeRender(proposta.categoria),
            descricao: safeRender(proposta.descricao),
            data_criacao: safeRender(proposta.data_criacao),
            data_vencimento: safeRender(proposta.data_vencimento),
            data_aprovacao: proposta.data_aprovacao ? safeRender(proposta.data_aprovacao) : null,
            motivoPerda: safeRender((proposta as any).motivoPerda),
            valor: Number((proposta as any).valor) || 0,
            probabilidade: Number(proposta.probabilidade) || 0,
          }));

          setPropostas(propostasValidadas);
          setFilteredPropostas(propostasValidadas);
        } else {
          setPropostas([]);
          setFilteredPropostas([]);
        }
      } catch (error) {
        console.error(`❌ [OTIMIZADO] Erro ao carregar propostas (${requestId}):`, error);
        setPropostas([]);
        setFilteredPropostas([]);
        const friendlyMessage =
          error instanceof Error ? error.message : 'Erro ao carregar propostas do banco de dados';
        showNotification(friendlyMessage, 'error');
      } finally {
        // Só resetar se ainda é a requisição atual
        if (updateControl.current.requestId === requestId) {
          setIsLoading(false);
          setIsLoadingPropostas(false);
          updateControl.current.requestId = null;
        } else {
          setIsLoading(false);
          setIsLoadingPropostas(false);
        }
      }
    },
    [isLoadingPropostas],
  ); // ✅ Dependências limpas

  // ✅ CARREGAMENTO INICIAL SIMPLIFICADO - Sem dependência circular
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      if (isMounted) {
        await carregarPropostas({ force: true }); // Forçar carregamento inicial
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVisualizarProposta = (proposta: any) => {
    void handleViewProposta(proposta);
  };
  // ✅ DETECTAR PROPOSTA RECÉM-GERADA DO PIPELINE
  useEffect(() => {
    const propostaId = searchParams.get('proposta');

    if (propostaId && propostas.length > 0) {
      // Aguardar 500ms para garantir que propostas carregaram
      const timer = setTimeout(() => {
        const propostaEncontrada = propostas.find((p) => p.id === propostaId);

        if (propostaEncontrada) {
          console.log('✅ Proposta recém-gerada encontrada:', propostaEncontrada);

          // Abrir modal de detalhes automaticamente
          handleVisualizarProposta(propostaEncontrada);

          // Limpar query string da URL
          navigate(location.pathname, { replace: true });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchParams, propostas, location.pathname, navigate]);
  // 🔄 POLLING AUTOMÁTICO DESABILITADO - Causava múltiplas requisições desnecessárias
  // useEffect(() => {
  //   const intervalo = setInterval(() => {
  //     carregarPropostas();
  //   }, 30000); // 30 segundos

  //   // Cleanup
  //   return () => {
  //     clearInterval(intervalo);
  //   };
  // }, []);

  // ⚡ OTIMIZADO: Atualizar lista quando página voltar ao foco (com debounce)
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;

    const handleFocus = () => {
      // Usar debounce de 3 segundos para focus
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        carregarPropostas({ force: false }); // Não forçar reload
      }, 3000);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [carregarPropostas]);

  // Sistema de Eventos Simplificado
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    const refreshDelay = 5000; // 5 segundos de espera

    const handlePropostaAtualizada = (e: Event) => {
      const event = e as CustomEvent;
      const detail = event.detail || {};

      // Atualização local imediata
      if (detail.propostaId && detail.novoStatus) {
        const propostaId = String(detail.propostaId);
        const correspondeProposta = (propostaAtual: any) =>
          String(safeRender(propostaAtual?.id)) === propostaId ||
          String(safeRender(propostaAtual?.numero)) === propostaId;
        const motivoEvento = String(detail.motivoPerda || '').trim();
        const statusAtualizado = String(detail.novoStatus || '').trim();
        const patchProposta = (propostaAtual: any) => {
          if (!correspondeProposta(propostaAtual)) {
            return propostaAtual;
          }

          return {
            ...propostaAtual,
            status: statusAtualizado,
            ...(detail.motivoPerda !== undefined ? { motivoPerda: motivoEvento } : {}),
          };
        };

        setPropostas((prev) => prev.map(patchProposta));

        setFilteredPropostas((prev) => prev.map(patchProposta));

        if (detail.novoStatus === 'rejeitada') {
          if (motivoEvento) {
            setMotivosPerda((prev) => ({
              ...prev,
              [propostaId]: {
                motivo: motivoEvento,
                updatedAt: new Date().toISOString(),
              },
            }));
          }
        }
      }

      // Agendar atualização do servidor
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        carregarPropostas({ force: false, source: 'event' });
      }, refreshDelay);
    };

    const handleRefreshRequest = (e: Event) => {
      const event = e as CustomEvent;
      const fonte = (event.detail || {}).fonte;

      // Ignorar eventos específicos
      if (['modal', 'date-change', 'form-update'].includes(fonte)) {
        return;
      }

      // Agendar atualização
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        carregarPropostas({ force: false, source: fonte || 'manual' });
      }, refreshDelay);
    };

    window.addEventListener('propostaAtualizada', handlePropostaAtualizada);
    window.addEventListener('atualizarPropostas', handleRefreshRequest);

    return () => {
      window.removeEventListener('propostaAtualizada', handlePropostaAtualizada);
      window.removeEventListener('atualizarPropostas', handleRefreshRequest);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [carregarPropostas]);

  // Função para salvar proposta usando serviço real
  const handleSaveProposta = async (data: any) => {
    try {
      setIsLoadingCreate(true);

      // Usar o serviço real para criar a proposta
      // const novaProposta = await propostasService.criarProposta(data);

      // Recarregar a lista de propostas para incluir a nova
      await carregarPropostas({ force: true }); // Forçar reload após criar nova proposta

      showNotification('Proposta criada com sucesso!', 'success');
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      const friendlyMessage =
        error instanceof Error ? error.message : 'Erro ao criar proposta. Tente novamente.';
      showNotification(friendlyMessage, 'error');
    } finally {
      setIsLoadingCreate(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = propostas;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (proposta) =>
          proposta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          proposta.cliente_contato.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter((proposta) => proposta.status === selectedStatus);
    }

    // Filtro por vendedor
    if (selectedVendedor !== 'todos') {
      filtered = filtered.filter((proposta) => proposta.vendedor === selectedVendedor);
    }

    // Filtros avançados - range de datas
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((proposta) => {
        const dataCreated = new Date(proposta.data_criacao);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return dataCreated >= startDate && dataCreated <= endDate;
      });
    }

    // Filtros avançados - range de valores
    if (valueRange.min || valueRange.max) {
      filtered = filtered.filter((proposta) => {
        const valor = (proposta as any).valor;
        const min = valueRange.min ? parseFloat(valueRange.min) : 0;
        const max = valueRange.max ? parseFloat(valueRange.max) : Infinity;
        return valor >= min && valor <= max;
      });
    }

    // Filtros avançados do componente FiltrosAvancados
    if (filtrosAvancados.status) {
      filtered = filtered.filter((p) => p.status === filtrosAvancados.status);
    }
    if (filtrosAvancados.vendedor) {
      filtered = filtered.filter((p) => p.vendedor === filtrosAvancados.vendedor);
    }
    if (filtrosAvancados.dataInicio && filtrosAvancados.dataFim) {
      filtered = filtered.filter((p) => {
        const dataProposta = new Date(p.data_criacao);
        const inicio = new Date(filtrosAvancados.dataInicio);
        const fim = new Date(filtrosAvancados.dataFim);
        return dataProposta >= inicio && dataProposta <= fim;
      });
    }

    // ✅ NOVO: Filtro por urgência
    if (filtrosAvancados.urgencia && filtrosAvancados.urgencia !== 'todas') {
      filtered = filtered.filter((p) => {
        switch (filtrosAvancados.urgencia) {
          case 'vencidas':
            return p.dias_restantes <= 0;
          case 'urgentes':
            return p.dias_restantes > 0 && p.dias_restantes <= 3;
          case 'próximas':
            return p.dias_restantes > 3 && p.dias_restantes <= 7;
          case 'normais':
            return p.dias_restantes > 7;
          default:
            return true;
        }
      });
    }
    if (filtrosAvancados.valorMin !== undefined) {
      filtered = filtered.filter((p) => p.valor >= filtrosAvancados.valorMin);
    }
    if (filtrosAvancados.valorMax !== undefined) {
      filtered = filtered.filter((p) => p.valor <= filtrosAvancados.valorMax);
    }
    if (filtrosAvancados.categoria) {
      filtered = filtered.filter((p) => p.categoria === filtrosAvancados.categoria);
    }
    if (filtrosAvancados.probabilidadeMin !== undefined) {
      filtered = filtered.filter((p) => p.probabilidade >= filtrosAvancados.probabilidadeMin);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'data_criacao':
          comparison = new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime();
          break;
        case 'valor':
          comparison = a.valor - b.valor;
          break;
        case 'cliente':
          comparison = a.cliente.localeCompare(b.cliente);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPropostas(filtered);
  }, [
    propostas,
    searchTerm,
    selectedStatus,
    selectedVendedor,
    dateRange,
    valueRange,
    sortBy,
    sortOrder,
    filtrosAvancados,
  ]);

  // Função para lidar com ações em lote
  const handleBulkAction = (action: string, success: boolean) => {
    showNotification(action, success ? 'success' : 'error');
    if (success) {
      // Recarregar propostas após ação bem-sucedida (forçar para garantir consistência)
      carregarPropostas({ force: true });
    }
  };

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedPropostas([]);
  };

  // Função para aplicar filtros avançados
  const handleAdvancedFilters = (filtros: any) => {
    setFiltrosAvancados(filtros);
  };

  // 🆕 FASE 2: Funções para Seleção Múltipla e UX Melhorada

  // Gerenciar seleção de propostas
  const handleSelectProposta = (propostaId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setPropostasSelecionadas((prev) => [...prev, propostaId]);
    } else {
      setPropostasSelecionadas((prev) => prev.filter((id) => id !== propostaId));
    }
  };

  // Selecionar todas as propostas visíveis
  const handleSelectAll = () => {
    const propostasVisiveis = filteredPropostas.map((p) => p.id?.toString() || p.numero);
    setPropostasSelecionadas(propostasVisiveis);
  };

  // Deselecionar todas
  const handleDeselectAll = () => {
    setPropostasSelecionadas([]);
  };

  // Preview de proposta no hover
  const handleMouseEnterProposta = (proposta: any, event: React.MouseEvent) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const safeHandler = createSafeMouseHandler((rect) => {
      setPreviewPosition({
        x: rect.right + 10,
        y: rect.top + rect.height / 2,
      });
      setPreviewProposta(proposta);
      setShowPreview(true);
    }, 800);

    const timeout = setTimeout(() => {
      safeHandler(event);
    }, 0);

    setHoverTimeout(timeout);
  };

  const handleMouseLeaveProposta = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // Dar um pequeno delay para permitir hover no preview
    const leaveTimeout = setTimeout(() => {
      setShowPreview(false);
      setPreviewProposta(null);
    }, 200);

    // Cleanup do timeout se necessário
    return () => {
      if (leaveTimeout) {
        clearTimeout(leaveTimeout);
      }
    };
  };

  // Exportar propostas selecionadas
  const handleExportarSelecionadas = async () => {
    if (propostasSelecionadas.length === 0) {
      showNotification('Selecione pelo menos uma proposta para exportar', 'error');
      return;
    }

    const propostasParaExportar = propostas.filter((p) =>
      propostasSelecionadas.includes(p.id?.toString() || p.numero),
    );

    if (propostasParaExportar.length === 0) {
      showNotification('Nenhuma proposta valida foi encontrada para exportacao.', 'error');
      return;
    }

    try {
      showNotification(`Gerando ${propostasParaExportar.length} PDF(s) de proposta...`, 'success');

      for (const proposta of propostasParaExportar) {
        const dadosPdf = await converterPropostaParaPDF(proposta);
        await pdfPropostasService.downloadPdf('comercial', dadosPdf);
      }

      showNotification(`${propostasParaExportar.length} PDF(s) gerado(s) com sucesso.`, 'success');
      setPropostasSelecionadas([]);
    } catch (error) {
      console.error('Erro ao exportar propostas:', error);
      const message = error instanceof Error ? error.message : 'Erro ao exportar propostas';
      showNotification(message, 'error');
    }
  };

  // Executar ações em massa
  const handleAcoesMassa = async (acao: string) => {
    if (propostasSelecionadas.length === 0) {
      showNotification('Selecione pelo menos uma proposta', 'error');
      return;
    }

    try {
      switch (acao) {
        case 'enviar-email':
          showNotification(
            `Enviando ${propostasSelecionadas.length} proposta(s) por email...`,
            'success',
          );
          break;

        case 'gerar-contratos':
          showNotification(
            `Gerando contratos para ${propostasSelecionadas.length} proposta(s)...`,
            'success',
          );
          break;

        case 'criar-faturas':
          showNotification(
            `Criando faturas para ${propostasSelecionadas.length} proposta(s)...`,
            'success',
          );
          break;

        case 'avancar-fluxo':
          showNotification(
            `Avançando fluxo de ${propostasSelecionadas.length} proposta(s)...`,
            'success',
          );
          break;

        case 'exportar-pdf':
          await handleExportarSelecionadas();
          break;

        case 'excluir':
          if (
            await confirm(
              `Tem certeza que deseja excluir ${propostasSelecionadas.length} proposta(s)?`,
            )
          ) {
            showNotification(`Excluindo ${propostasSelecionadas.length} proposta(s)...`, 'success');
            setPropostasSelecionadas([]);
          }
          break;

        default:
          showNotification(`Ação "${acao}" executada com sucesso!`, 'success');
      }

      // Recarregar propostas após a ação
      carregarPropostas({ force: true });
    } catch (error) {
      console.error('Erro ao executar ação em massa:', error);
      showNotification('Erro ao executar ação', 'error');
    }
  };

  // Função auxiliar para o preview
  const handleGeneratePDF = async (proposta: any) => {
    try {
      const numero = safeRender(proposta?.numero) || safeRender(proposta?.id) || 'sem-numero';
      showNotification(`Gerando PDF da proposta ${numero}...`, 'success');

      const dadosPdf = await converterPropostaParaPDF(proposta);
      await pdfPropostasService.downloadPdf('comercial', dadosPdf);

      showNotification(`PDF da proposta ${numero} gerado com sucesso.`, 'success');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      const message = error instanceof Error ? error.message : 'Erro ao gerar PDF';
      showNotification(message, 'error');
    }
  };

  // Função para clonar proposta
  const handleCloneProposta = async (propostaId: string) => {
    try {
      void propostaId;
      showNotification('Clonacao de proposta ainda indisponivel nesta versao.', 'error');
    } catch (error) {
      console.error('Erro ao clonar proposta:', error);
      showNotification('Erro ao clonar proposta', 'error');
    }
  };

  // Ações em massa usando serviços reais
  const handleBulkDelete = async () => {
    if (await confirm(`Deseja excluir ${selectedPropostas.length} proposta(s) selecionada(s)?`)) {
      try {
        showNotification('Exclusao em lote ainda indisponivel nesta versao.', 'error');
      } catch (error) {
        console.error('❌ Erro ao excluir propostas em lote:', error);
        showNotification('Erro ao excluir propostas. Tente novamente.', 'error');
      }
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      void newStatus;
      showNotification('Alteracao de status em lote ainda indisponivel nesta versao.', 'error');
    } catch (error) {
      console.error('❌ Erro ao alterar status em lote:', error);
      showNotification('Erro ao alterar status das propostas. Tente novamente.', 'error');
    }
  };

  const handleBulkExport = async () => {
    const selectedData = propostas.filter((p) => selectedPropostas.includes(p.id));

    // Criar CSV
    const headers = ['Número', 'Cliente', 'Título', 'Valor', 'Status', 'Data Criação', 'Vendedor'];
    const csvContent = [
      headers.join(','),
      ...selectedData.map((p) =>
        [p.numero, p.cliente, p.titulo, p.valor, p.status, p.data_criacao, p.vendedor].join(','),
      ),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `propostas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedPropostas([]);
    setShowBulkActions(false);
  };

  // Calcular métricas do dashboard
  // 🎯 Função específica para refresh manual do dashboard
  const handleManualRefresh = () => {
    carregarPropostas({ force: true }); // Forçar reload quando usuário solicita manualmente
  };

  const calcularMetricas = () => {
    const statusGanhos = new Set([
      'aprovada',
      'contrato_gerado',
      'contrato_assinado',
      'fatura_criada',
      'aguardando_pagamento',
      'pago',
    ]);
    const statusNegociacao = new Set(['enviada', 'visualizada', 'negociacao']);

    const total = filteredPropostas.length;
    const aprovadas = filteredPropostas.filter((p) => statusGanhos.has(String(p.status))).length;
    const emNegociacao = filteredPropostas.filter((p) =>
      statusNegociacao.has(String(p.status)),
    ).length;
    const valorTotal = filteredPropostas.reduce((sum, p) => sum + p.valor, 0);
    const valorAprovado = filteredPropostas
      .filter((p) => statusGanhos.has(String(p.status)))
      .reduce((sum, p) => sum + p.valor, 0);
    const propostasRevisadas = filteredPropostas.filter(
      (p) => Number((p as any).totalVersoes || 0) > 1,
    ).length;
    const mediaVersoesPorProposta =
      total > 0
        ? filteredPropostas.reduce(
            (sum, p) => sum + Math.max(Number((p as any).totalVersoes || 0), 1),
            0,
          ) / total
        : 0;

    const taxaConversao = total > 0 ? (aprovadas / total) * 100 : 0;

    return {
      total,
      aprovadas,
      emNegociacao,
      valorTotal,
      valorAprovado,
      taxaConversao,
      propostasRevisadas,
      mediaVersoesPorProposta,
    };
  };

  const metricas = calcularMetricas();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejeitada':
        return <XCircle className="w-4 h-4" />;
      case 'negociacao':
        return <TrendingUp className="w-4 h-4" />;
      case 'visualizada':
      case 'enviada':
        return <Clock className="w-4 h-4" />;
      case 'contrato_gerado':
      case 'contrato_assinado':
      case 'pago':
        return <CheckCircle className="w-4 h-4" />;
      case 'fatura_criada':
      case 'aguardando_pagamento':
        return <DollarSign className="w-4 h-4" />;
      case 'expirada':
        return <AlertCircle className="w-4 h-4" />;
      case 'rascunho':
        return <Edit className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'bg-[#16A34A]/10 text-[#16A34A]';
      case 'rejeitada':
        return 'bg-[#DC2626]/10 text-[#DC2626]';
      case 'negociacao':
        return 'bg-[#159A9C]/10 text-[#0F7B7D]';
      case 'visualizada':
        return 'bg-[#38BDF8]/10 text-[#0369A1]';
      case 'enviada':
        return 'bg-[#FBBF24]/20 text-[#92400E]';
      case 'contrato_gerado':
      case 'contrato_assinado':
        return 'bg-[#818CF8]/15 text-[#3730A3]';
      case 'fatura_criada':
      case 'aguardando_pagamento':
        return 'bg-[#FB7185]/15 text-[#BE123C]';
      case 'pago':
        return 'bg-[#16A34A]/10 text-[#166534]';
      case 'expirada':
        return 'bg-[#F97316]/15 text-[#9A3412]';
      case 'rascunho':
        return 'bg-[#B4BEC9]/20 text-[#002333]';
      default:
        return 'bg-[#B4BEC9]/20 text-[#002333]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'Aprovada';
      case 'rejeitada':
        return 'Rejeitada';
      case 'negociacao':
        return 'Em Negociacao';
      case 'visualizada':
        return 'Visualizada';
      case 'enviada':
        return 'Enviada';
      case 'contrato_gerado':
        return 'Contrato Gerado';
      case 'contrato_assinado':
        return 'Contrato Assinado';
      case 'fatura_criada':
        return 'Fatura Criada';
      case 'aguardando_pagamento':
        return 'Aguardando Pagamento';
      case 'pago':
        return 'Pago';
      case 'expirada':
        return 'Expirada';
      case 'rascunho':
        return 'Rascunho';
      default:
        return status;
    }
  };

  // Manipuladores dos botoes de acoes
  const normalizarStatusParaPdf = (status: unknown): DadosProposta['status'] => {
    const normalized = String(status || '')
      .trim()
      .toLowerCase();
    const statusMap: Record<string, DadosProposta['status']> = {
      rascunho: 'draft',
      draft: 'draft',
      enviada: 'sent',
      sent: 'sent',
      visualizada: 'viewed',
      viewed: 'viewed',
      aprovada: 'approved',
      approved: 'approved',
      rejeitada: 'rejected',
      rejected: 'rejected',
      expirada: 'expired',
      expired: 'expired',
      negociacao: 'sent',
      contrato_gerado: 'approved',
      contrato_assinado: 'approved',
      fatura_criada: 'approved',
      aguardando_pagamento: 'approved',
      pago: 'approved',
    };

    return statusMap[normalized] || 'draft';
  };

  const formatarDataPdf = (value: unknown, fallback: Date): string => {
    const parsed = value ? new Date(String(value)) : fallback;
    if (Number.isNaN(parsed.getTime())) {
      return fallback.toLocaleDateString('pt-BR');
    }
    return parsed.toLocaleDateString('pt-BR');
  };

  const descreverFormaPagamento = (formaPagamento: unknown, parcelas?: unknown): string => {
    const normalized = String(formaPagamento || '')
      .trim()
      .toLowerCase();
    const numeroParcelas = Number(parcelas || 0);

    if (normalized === 'avista' || normalized === 'a_vista' || normalized === 'a-vista') {
      return 'A vista';
    }
    if (normalized === 'boleto') {
      return 'Boleto bancario';
    }
    if (normalized === 'cartao') {
      return 'Cartao de credito';
    }
    if (normalized === 'pix') {
      return 'PIX';
    }
    if (normalized === 'parcelado') {
      return numeroParcelas > 0
        ? `Parcelado em ate ${numeroParcelas}x`
        : 'Parcelado conforme acordo';
    }

    return 'Conforme acordo comercial';
  };

  const converterPropostaParaPDF = async (proposta: any): Promise<DadosProposta> => {
    if (!proposta || !proposta.id) {
      throw new Error('Proposta nao encontrada ou dados incompletos.');
    }

    const propostaCompleta = proposta;
    const itensOriginais = Array.isArray(propostaCompleta.produtos)
      ? propostaCompleta.produtos
      : [];

    const itens = (
      itensOriginais.length > 0
        ? itensOriginais
        : [
            {
              nome: propostaCompleta.titulo || 'Item da proposta',
              quantidade: 1,
              precoUnitario: Number((propostaCompleta as any).valor || propostaCompleta.total || 0),
              desconto: 0,
            },
          ]
    ).map((item: any, index: number) => {
      const produto = item?.produto && typeof item.produto === 'object' ? item.produto : item;

      const nome =
        safeRender(produto?.nome || produto?.titulo || item?.nome) || `Item ${index + 1}`;
      const quantidade = Math.max(1, Number(item?.quantidade ?? produto?.quantidade ?? 1));
      const valorUnitario = Number(
        item?.precoUnitario ?? item?.valorUnitario ?? produto?.precoUnitario ?? produto?.preco ?? 0,
      );
      const desconto = Number(item?.desconto ?? produto?.desconto ?? 0);
      const valorTotalCalculado = valorUnitario * quantidade * (1 - desconto / 100);
      const valorTotal = Number(item?.subtotal ?? item?.valorTotal ?? valorTotalCalculado);

      const descricaoPartes = [
        safeRender(produto?.descricao),
        produto?.categoria ? `Categoria: ${safeRender(produto.categoria)}` : null,
      ].filter(Boolean);

      return {
        nome,
        descricao: descricaoPartes.join(' | '),
        quantidade,
        valorUnitario,
        desconto,
        valorTotal,
      };
    });

    const subtotalCalculado = itens.reduce((sum, item) => sum + Number(item.valorTotal || 0), 0);
    const subtotal = Number(propostaCompleta.subtotal ?? subtotalCalculado);
    const descontoGeral = Number(propostaCompleta.descontoGlobal ?? 0);
    const impostos = Number(propostaCompleta.impostos ?? 0);
    const valorTotal = Number(
      propostaCompleta.total ?? propostaCompleta.valor ?? subtotal - descontoGeral + impostos,
    );

    const clienteObj =
      propostaCompleta.cliente && typeof propostaCompleta.cliente === 'object'
        ? propostaCompleta.cliente
        : null;
    const vendedorObj =
      propostaCompleta.vendedor && typeof propostaCompleta.vendedor === 'object'
        ? propostaCompleta.vendedor
        : null;

    return {
      numeroProposta: safeRender(propostaCompleta.numero) || `PROP-${Date.now()}`,
      titulo: safeRender(propostaCompleta.titulo) || 'Proposta comercial',
      descricao:
        safeRender(propostaCompleta.observacoes) ||
        'Proposta comercial com produtos/servicos selecionados para o cliente.',
      status: normalizarStatusParaPdf(propostaCompleta.status),
      dataEmissao: formatarDataPdf(
        propostaCompleta.criadaEm || propostaCompleta.data_criacao,
        new Date(),
      ),
      dataValidade: formatarDataPdf(
        propostaCompleta.dataValidade || propostaCompleta.data_vencimento,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ),
      empresa: {
        nome: 'ConectCRM',
        endereco: 'Rua das Inovacoes, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        cep: '01234-567',
        telefone: '(11) 3333-4444',
        email: 'contato@conectcrm.com',
        cnpj: '12.345.678/0001-90',
      },
      cliente: {
        nome:
          safeRender(clienteObj?.nome) ||
          safeRender(propostaCompleta.cliente) ||
          'Cliente nao informado',
        empresa: safeRender(clienteObj?.empresa),
        email: safeRender(clienteObj?.email) || 'nao-informado@cliente.local',
        telefone: safeRender(clienteObj?.telefone) || 'Nao informado',
        documento: safeRender(clienteObj?.documento) || 'Nao informado',
        tipoDocumento:
          String(clienteObj?.tipoPessoa || '').toLowerCase() === 'juridica' ? 'CNPJ' : 'CPF',
        endereco: safeRender(clienteObj?.endereco) || 'Endereco nao informado',
      },
      vendedor: {
        nome: safeRender(vendedorObj?.nome) || safeRender(propostaCompleta.vendedor) || 'Vendedor',
        email: safeRender(vendedorObj?.email) || 'vendedor@conectcrm.com',
        telefone: safeRender(vendedorObj?.telefone) || '(11) 99999-9999',
        cargo: safeRender(vendedorObj?.cargo) || 'Consultor de vendas',
      },
      itens,
      subtotal,
      descontoGeral,
      percentualDesconto: subtotal > 0 ? (descontoGeral / subtotal) * 100 : 0,
      impostos,
      valorTotal,
      formaPagamento: descreverFormaPagamento(
        propostaCompleta.formaPagamento,
        propostaCompleta.parcelas,
      ),
      prazoEntrega: `${Number(propostaCompleta.validadeDias || 30)} dias uteis`,
      garantia: 'Conforme contrato comercial',
      validadeProposta: `${Number(propostaCompleta.validadeDias || 30)} dias corridos`,
      condicoesGerais: [
        `Proposta valida por ${Number(propostaCompleta.validadeDias || 30)} dias corridos`,
        'Pagamento conforme condicoes comerciais acordadas',
        'Alteracoes de escopo podem gerar custos adicionais',
      ],
      observacoes:
        safeRender(propostaCompleta.observacoes) ||
        'Proposta gerada pelo modulo comercial do ConectCRM.',
    };
  };

  const handleViewProposta = async (proposta: any) => {
    try {
      const propostaId = proposta?.id ? String(proposta.id) : null;
      if (propostaId) {
        const propostaCompletaReal = await propostasFeatureService.obterProposta(propostaId);
        if (propostaCompletaReal) {
          setSelectedPropostaForView(propostaCompletaReal);
          setShowViewModal(true);
          return;
        }
      }

      // Converter dados da proposta para o formato compatível com o modal
      const propostaCompleta = {
        id: proposta.id || `prop_${Date.now()}`,
        numero: proposta.numero || 'N/A',
        titulo: proposta.titulo || 'Proposta comercial',
        subtotal: (proposta as any).valor || 0,
        total: (proposta as any).valor || 0,
        dataValidade: new Date(proposta.data_vencimento || Date.now()),
        status: proposta.status as 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada',
        criadaEm: proposta.data_criacao || new Date().toISOString(),

        // Dados básicos necessários
        vendedor: {
          id: `vendedor_${proposta.id}`,
          nome: proposta.vendedor || 'Vendedor',
          email: 'vendedor@conectcrm.com',
          tipo: 'vendedor',
          ativo: true,
        },
        cliente: {
          id: `cliente_${proposta.id}`,
          nome: proposta.cliente || 'Cliente não informado',
          documento: '',
          email:
            proposta.cliente_contato ||
            `${proposta.cliente?.toLowerCase().replace(/\s+/g, '.')}@email.com`,
          telefone: proposta.cliente_telefone || '',
          tipoPessoa: 'fisica',
        },
        produtos: [
          {
            produto: {
              id: `produto_${proposta.id}`,
              nome: proposta.titulo || 'Produto/Serviço',
              preco: (proposta as any).valor || 0,
              categoria: 'Geral',
              unidade: 'un',
            },
            quantidade: 1,
            desconto: 0,
            subtotal: (proposta as any).valor || 0,
          },
        ],
        descontoGlobal: 0,
        impostos: 0,
        formaPagamento: 'avista',
        validadeDias: 30,
        observacoes: `Esta proposta foi elaborada especialmente para ${proposta.cliente}, considerando as necessidades específicas do projeto "${proposta.titulo}". Estamos à disposição para esclarecimentos e ajustes necessários.`,
        incluirImpostosPDF: false,
        aprovacaoInterna: (proposta as any).aprovacaoInterna,
        lembretes: Array.isArray((proposta as any).lembretes) ? (proposta as any).lembretes : [],
        historicoEventos: Array.isArray((proposta as any).historicoEventos)
          ? (proposta as any).historicoEventos
          : [],
        versoes: Array.isArray((proposta as any).versoes) ? (proposta as any).versoes : [],
      } as unknown as PropostaCompletaFeature;

      setSelectedPropostaForView(propostaCompleta);
      setShowViewModal(true);
    } catch (error) {
      console.error('❌ Erro ao preparar visualização da proposta:', error);
      alert('Erro ao preparar visualização da proposta. Tente novamente.');
    }
  };

  // Função de fallback para gerar HTML local quando API não estiver disponível
  const gerarHtmlLocal = (dados: DadosProposta): string => {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta Comercial - ${dados.numeroProposta}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: #333; background: #fff; font-size: 14px; }
        .container { max-width: 210mm; margin: 0 auto; padding: 15px; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 2px solid #159A9C; margin-bottom: 20px; }
        .company-info { font-size: 11px; color: #666; line-height: 1.3; margin-top: 8px; }
        .proposal-number { font-size: 20px; font-weight: bold; color: #159A9C; margin-bottom: 3px; }
        .title-section { text-align: center; margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #159A9C, #127577); color: white; border-radius: 6px; }
        .main-title { font-size: 22px; font-weight: bold; margin-bottom: 5px; }
        .client-section { display: flex; gap: 15px; margin: 20px 0; }
        .client-info, .vendor-info { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; }
        .section-title { font-size: 14px; font-weight: bold; color: #159A9C; margin-bottom: 10px; border-bottom: 1px solid #159A9C; padding-bottom: 3px; }
        .info-row { display: flex; margin: 5px 0; font-size: 12px; }
        .info-label { font-weight: 600; min-width: 90px; color: #555; }
        .products-table { width: 100%; border-collapse: collapse; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 12px; }
        .products-table th { background: #159A9C; color: white; padding: 10px 8px; text-align: left; font-weight: 600; font-size: 11px; }
        .products-table td { padding: 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
        .products-table tr:nth-child(even) { background: #f9f9f9; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .currency { font-weight: 600; color: #159A9C; }
        .product-name { font-weight: 600; color: #333; margin-bottom: 3px; }
        .product-desc { font-size: 10px; color: #666; line-height: 1.3; white-space: pre-line; }
        .product-features { font-size: 9px; color: #159A9C; background: #f0f9f9; padding: 4px 6px; margin-top: 4px; border-radius: 3px; border-left: 2px solid #159A9C; }
        .totals-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #159A9C; }
        .totals-table { width: 100%; max-width: 350px; margin-left: auto; font-size: 12px; }
        .totals-table td { padding: 5px 10px; border-bottom: 1px solid #ddd; }
        .total-final { font-size: 16px; font-weight: bold; color: #159A9C; border-top: 2px solid #159A9C; background: white; }
        .signature-section { margin: 30px 0; padding: 20px 0; border-top: 2px solid #159A9C; }
        .signatures { display: flex; justify-content: space-between; gap: 30px; margin-top: 20px; }
        .signature-box { flex: 1; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; }
        .signature-line { border-top: 1px solid #333; margin: 30px 15px 10px; }
        .signature-label { font-weight: 600; margin-bottom: 5px; font-size: 11px; }
        .signature-info { font-size: 10px; color: #666; }
        .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
        .term-item { padding: 12px; background: #f9f9f9; border-radius: 4px; }
        .term-label { font-weight: 600; color: #159A9C; margin-bottom: 3px; font-size: 11px; }
        .term-value { font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div style="font-size: 20px; font-weight: bold; color: #159A9C;">${dados.empresa?.nome || 'FenixCRM'}</div>
                <div class="company-info">
                    <div>${dados.empresa?.endereco || 'Endereço da empresa'}</div>
                    <div>${dados.empresa?.telefone || '(11) 0000-0000'} | ${dados.empresa?.email || 'contato@empresa.com'}</div>
                </div>
            </div>
            <div>
                <div class="proposal-number">PROPOSTA Nº ${dados.numeroProposta}</div>
                <div style="font-size: 12px; color: #666;">${dados.dataEmissao}</div>
            </div>
        </div>

        <div class="title-section">
            <div class="main-title">PROPOSTA COMERCIAL</div>
            <div style="font-size: 14px; opacity: 0.9;">${dados.titulo}</div>
        </div>

        <div class="client-section">
            <div class="client-info">
                <div class="section-title">DADOS DO CLIENTE</div>
                <div class="info-row">
                    <span class="info-label">Nome:</span>
                    <span>${dados.cliente.nome}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">E-mail:</span>
                    <span>${dados.cliente.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefone:</span>
                    <span>${dados.cliente.telefone || 'Não informado'}</span>
                </div>
            </div>

            <div class="vendor-info">
                <div class="section-title">DADOS DO VENDEDOR</div>
                <div class="info-row">
                    <span class="info-label">Nome:</span>
                    <span>${dados.vendedor.nome}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">E-mail:</span>
                    <span>${dados.vendedor.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cargo:</span>
                    <span>${dados.vendedor.cargo || 'Vendedor'}</span>
                </div>
            </div>
        </div>

        <div style="margin: 20px 0;">
            <div class="section-title">PRODUTOS/SERVIÇOS</div>
            <table class="products-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">Item</th>
                        <th style="width: 40%;">Descrição</th>
                        <th style="width: 10%;" class="text-center">Qtd</th>
                        <th style="width: 15%;" class="text-right">Valor Unit.</th>
                        <th style="width: 10%;" class="text-center">Desconto</th>
                        <th style="width: 20%;" class="text-right">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${dados.itens
                      .map((item, index) => {
                        // Separar descrição dos detalhes técnicos
                        const descricaoLinhas = (item.descricao || '').split('\n');
                        const descricaoPrincipal =
                          descricaoLinhas.find((linha) => !linha.startsWith('•')) || '';
                        const detalhes = descricaoLinhas.filter((linha) => linha.startsWith('•'));

                        return `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>
                            <div class="product-name">${item.nome}</div>
                            ${descricaoPrincipal ? `<div class="product-desc">${descricaoPrincipal}</div>` : ''}
                            ${detalhes.length > 0 ? `<div class="product-features">${detalhes.join('\n')}</div>` : ''}
                        </td>
                        <td class="text-center">${item.quantidade}</td>
                        <td class="text-right currency">R$ ${item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="text-center">${item.desconto ? `${item.desconto.toFixed(1)}%` : '-'}</td>
                        <td class="text-right currency">R$ ${item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    `;
                      })
                      .join('')}
                </tbody>
            </table>
        </div>

        <div class="totals-section">
            <div class="section-title">RESUMO FINANCEIRO</div>
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right currency">R$ ${(dados.subtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${
                  dados.descontoGeral
                    ? `
                <tr>
                    <td>Desconto Geral (${dados.percentualDesconto || 0}%):</td>
                    <td class="text-right currency">- R$ ${dados.descontoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                `
                    : ''
                }
                ${
                  dados.impostos
                    ? `
                <tr>
                    <td>Impostos:</td>
                    <td class="text-right currency">R$ ${dados.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                `
                    : ''
                }
                <tr class="total-final">
                    <td><strong>VALOR TOTAL:</strong></td>
                    <td class="text-right"><strong>R$ ${dados.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
            </table>
        </div>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px;">
            <div class="section-title">CONDIÇÕES COMERCIAIS</div>
            <div class="terms-grid">
                <div class="term-item">
                    <div class="term-label">Pagamento</div>
                    <div class="term-value">${dados.formaPagamento}</div>
                </div>
                <div class="term-item">
                    <div class="term-label">Entrega</div>
                    <div class="term-value">${dados.prazoEntrega}</div>
                </div>
                <div class="term-item">
                    <div class="term-label">Garantia</div>
                    <div class="term-value">${dados.garantia}</div>
                </div>
                <div class="term-item">
                    <div class="term-label">Validade</div>
                    <div class="term-value">${dados.validadeProposta}</div>
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="section-title">ACEITE DA PROPOSTA</div>
            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-label">CLIENTE</div>
                    <div class="signature-line"></div>
                    <div class="signature-info">
                        <div><strong>${dados.cliente.nome}</strong></div>
                        <div>Data: ___/___/______</div>
                    </div>
                </div>
                <div class="signature-box">
                    <div class="signature-label">VENDEDOR</div>
                    <div class="signature-line"></div>
                    <div class="signature-info">
                        <div><strong>${dados.vendedor.nome}</strong></div>
                        <div>Data: ___/___/______</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const handleEditProposta = (proposta: any) => {
    // Navegar para página de edição ou abrir modal de edição
    alert(`Editando proposta: ${proposta.numero}\nEsta funcionalidade será implementada em breve!`);
  };

  const handleDeleteProposta = async (proposta: any) => {
    if (await confirm(`Tem certeza que deseja excluir a proposta ${proposta.numero}?`)) {
      try {
        setIsLoading(true);

        // Usar o serviço real para excluir
        await propostasService.delete(proposta.id);

        showNotification('Proposta excluída com sucesso!', 'success');

        // Recarregar a lista para refletir a exclusão
        await carregarPropostas({ force: true });
      } catch (error) {
        console.error('❌ Erro ao excluir proposta:', error);
        const friendlyMessage =
          error instanceof Error ? error.message : 'Erro ao excluir proposta. Tente novamente.';
        showNotification(friendlyMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMoreOptions = (proposta: any) => {
    // Criar um menu de contexto simples
    const opcoes = [
      'Duplicar Proposta',
      'Gerar PDF',
      'Enviar por Email',
      'Histórico',
      'Alterar Status',
    ];

    const opcaoEscolhida = window.prompt(
      `Selecione uma opção para ${proposta.numero}:\n\n` +
        opcoes.map((opcao, index) => `${index + 1}. ${opcao}`).join('\n') +
        '\n\nDigite o número da opção:',
    );

    if (opcaoEscolhida && opcaoEscolhida !== '') {
      const opcaoIndex = parseInt(opcaoEscolhida) - 1;
      if (opcaoIndex >= 0 && opcaoIndex < opcoes.length) {
        alert(`Funcionalidade "${opcoes[opcaoIndex]}" será implementada em breve!`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const valorAprovadas = filteredPropostas
    .filter((p) =>
      [
        'aprovada',
        'contrato_gerado',
        'contrato_assinado',
        'fatura_criada',
        'aguardando_pagamento',
        'pago',
      ].includes(String(p.status)),
    )
    .reduce((sum, p) => sum + p.valor, 0);
  const valorNegociacao = filteredPropostas
    .filter((p) => ['enviada', 'visualizada', 'negociacao'].includes(String(p.status)))
    .reduce((sum, p) => sum + p.valor, 0);
  const propostasRejeitadas = filteredPropostas.filter((p) => p.status === 'rejeitada').length;
  const taxaPerda = metricas.total > 0 ? (propostasRejeitadas / metricas.total) * 100 : 0;

  return (
    <div className="space-y-4">
      <ModalNovaProposta
        key={`modal-${showWizardModal ? 'open' : 'closed'}-${Date.now()}`}
        isOpen={showWizardModal}
        onClose={() => {
          setShowWizardModal(false);
        }}
        onPropostaCriada={(proposta) => {
          // Recarregar a lista de propostas
          carregarPropostas({ force: true });
          setShowWizardModal(false);
        }}
      />

      <div className="space-y-4">
        {/* Header da Página */}
        <SectionCard className="p-4 sm:p-5">
          <PageHeader
            title="Propostas"
            description={
              isLoading
                ? 'Carregando propostas...'
                : `Acompanhe suas ${propostas.length} propostas comerciais`
            }
            actions={
              <button
                type="button"
                onClick={() => setShowWizardModal(true)}
                className={actionPrimaryButtonClass}
              >
                <Plus className="h-4 w-4" />
                Nova Proposta
              </button>
            }
          />
        </SectionCard>

        {/* Controles de Visualização e Ações */}
        <SectionCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => carregarPropostas({ force: true })}
                disabled={isLoading}
                className={actionSecondaryButtonClass}
                title="Atualizar lista de propostas"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              <button type="button" className={actionSecondaryButtonClass}>
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>

            <div className="flex rounded-lg border border-[#D4E2E7] bg-[#F6FAFB] p-1">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className={`${viewToggleBaseClass} ${
                  viewMode === 'dashboard'
                    ? 'border border-[#DEE8EC] bg-white text-[#0F7B7D]'
                    : 'text-[#607B89] hover:text-[#244455]'
                }`}
                title="Visualizacao Dashboard"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`${viewToggleBaseClass} ${
                  viewMode === 'table'
                    ? 'border border-[#DEE8EC] bg-white text-[#0F7B7D]'
                    : 'text-[#607B89] hover:text-[#244455]'
                }`}
                title="Visualizacao Lista"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`${viewToggleBaseClass} ${
                  viewMode === 'cards'
                    ? 'border border-[#DEE8EC] bg-white text-[#0F7B7D]'
                    : 'text-[#607B89] hover:text-[#244455]'
                }`}
                title="Visualizacao Cards"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Renderização condicional por modo de visualização */}
        {viewMode === 'dashboard' ? (
          <DashboardPropostas onRefresh={handleManualRefresh} />
        ) : (
          <>
            {/* Filtros Avançados */}
            <div className="mb-6">
              <FiltrosAvancados
                onFiltersChange={handleAdvancedFilters}
                isOpen={showAdvancedFilters}
                onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
              />
            </div>

            {/* Cards de Dashboard */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
              <div className={`${shellTokens.cardSoft} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Total no filtro
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002333] sm:text-3xl">
                      {metricas.total}
                    </p>
                    <p className="mt-3 truncate text-sm text-[#002333]/70">Pipeline atual</p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#159A9C]/10 shadow-sm">
                    <Users className="h-6 w-6 text-[#159A9C]" />
                  </div>
                </div>
              </div>

              <div className={`${shellTokens.cardSoft} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Aprovadas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002333] sm:text-3xl">
                      {metricas.aprovadas}
                    </p>
                    <p className="mt-3 truncate text-sm text-[#002333]/70">
                      {formatCurrency(valorAprovadas)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#16A34A]/10 shadow-sm">
                    <CheckCircle className="h-6 w-6 text-[#16A34A]" />
                  </div>
                </div>
              </div>

              <div className={`${shellTokens.cardSoft} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Em negociacao
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002333] sm:text-3xl">
                      {metricas.emNegociacao}
                    </p>
                    <p className="mt-3 truncate text-sm text-[#002333]/70">
                      {formatCurrency(valorNegociacao)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#159A9C]/10 shadow-sm">
                    <TrendingUp className="h-6 w-6 text-[#0F7B7D]" />
                  </div>
                </div>
              </div>

              <div className={`${shellTokens.cardSoft} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Rejeitadas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002333] sm:text-3xl">
                      {propostasRejeitadas}
                    </p>
                    <p className="mt-3 truncate text-sm text-[#002333]/70">
                      {taxaPerda.toFixed(1)}% de perda
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#DC2626]/10 shadow-sm">
                    <TrendingDown className="h-6 w-6 text-[#DC2626]" />
                  </div>
                </div>
              </div>

              <div className={`${shellTokens.cardSoft} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Conversao
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002333] sm:text-3xl">
                      {metricas.taxaConversao.toFixed(1)}%
                    </p>
                    <p className="mt-3 truncate text-sm text-[#002333]/70">Aprovadas / Total</p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0F7B7D]/10 shadow-sm">
                    <Target className="h-6 w-6 text-[#0F7B7D]" />
                  </div>
                </div>
              </div>

              <div className={`${shellTokens.cardSoft} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Revisadas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002333] sm:text-3xl">
                      {metricas.propostasRevisadas}
                    </p>
                    <p className="mt-3 truncate text-sm text-[#002333]/70">
                      {metricas.mediaVersoesPorProposta.toFixed(1)} versao(oes) / proposta
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#0369A1]/10 shadow-sm">
                    <RefreshCw className="h-6 w-6 text-[#0369A1]" />
                  </div>
                </div>
              </div>

              <div className={`${shellTokens.cardSoft} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Valor total
                    </p>
                    <div className="mt-2">
                      <p className="break-words text-lg font-bold leading-tight text-[#002333] sm:text-xl lg:text-2xl">
                        {formatCurrency(metricas.valorTotal)}
                      </p>
                    </div>
                    <p className="mt-3 truncate text-sm text-[#002333]/70">Receita potencial</p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#159A9C]/10 shadow-sm">
                    <DollarSign className="h-6 w-6 text-[#159A9C]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros básicos */}
            <div className={`${shellTokens.card} p-4 sm:p-5`}>
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* Busca */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por número, cliente ou título..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={shellFieldTokens.withIcon}
                    />
                  </div>
                </div>

                {/* Filtro Status */}
                <div className="w-full sm:w-auto sm:min-w-[160px] lg:w-48">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={shellFieldTokens.base}
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="enviada">Enviada</option>
                    <option value="visualizada">Visualizada</option>
                    <option value="negociacao">Em Negociação</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="contrato_gerado">Contrato Gerado</option>
                    <option value="contrato_assinado">Contrato Assinado</option>
                    <option value="fatura_criada">Fatura Criada</option>
                    <option value="aguardando_pagamento">Aguardando Pagamento</option>
                    <option value="pago">Pago</option>
                    <option value="rejeitada">Rejeitada</option>
                    <option value="expirada">Expirada</option>
                  </select>
                </div>

                {/* Filtro Vendedor */}
                <div className="w-full sm:w-auto sm:min-w-[160px] lg:w-48">
                  <select
                    value={selectedVendedor}
                    onChange={(e) => setSelectedVendedor(e.target.value)}
                    className={shellFieldTokens.base}
                  >
                    <option value="todos">Todos os Vendedores</option>
                    <option value="Maria Santos">Maria Santos</option>
                    <option value="Pedro Costa">Pedro Costa</option>
                    <option value="Ana Silva">Ana Silva</option>
                  </select>
                </div>

                {/* Filtro por Urgência */}
                <div className="w-full sm:w-auto sm:min-w-[160px] lg:w-48">
                  <select
                    value={filtrosAvancados.urgencia || 'todas'}
                    onChange={(e) =>
                      setFiltrosAvancados({ ...filtrosAvancados, urgencia: e.target.value })
                    }
                    className={shellFieldTokens.base}
                  >
                    <option value="todas">Todas as Urgências</option>
                    <option value="vencidas">🔴 Vencidas</option>
                    <option value="urgentes">🟠 Urgentes (≤3 dias)</option>
                    <option value="próximas">🟡 Próximas (≤7 dias)</option>
                    <option value="normais">🟢 Normais</option>
                  </select>
                </div>

                {/* Botão Filtros Avançados */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 sm:px-4 py-2 border rounded-lg flex items-center justify-center gap-2 text-sm transition-colors flex-shrink-0 ${
                    showAdvancedFilters
                      ? 'bg-[#159A9C]/10 border-[#159A9C]/40 text-[#0F7B7D]'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  {Object.keys(filtrosAvancados).length > 0 && (
                    <span className="bg-[#159A9C] text-white text-xs rounded-full px-2 py-0.5 ml-1">
                      {Object.keys(filtrosAvancados).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de Propostas com Seleção */}
            {viewMode === 'cards' ? (
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredPropostas.length === 0 ? (
                  <div className="col-span-full rounded-[18px] border border-dashed border-[#D4E2E7] bg-[#F8FBFC] p-10 text-center">
                    <p className="text-sm font-medium text-[#244455]">
                      Nenhuma proposta encontrada para os filtros atuais.
                    </p>
                    <p className="mt-2 text-sm text-[#607B89]">
                      Ajuste os filtros ou crie uma nova proposta.
                    </p>
                  </div>
                ) : (
                  filteredPropostas.map((proposta) => {
                    const propostaId = proposta.id?.toString() || proposta.numero;
                    const propostaSelecionada = propostasSelecionadas.includes(propostaId);
                    const motivoPerda = getMotivoPerda(proposta);
                    const totalVersoes = Number((proposta as any).totalVersoes || 0);
                    const ultimaVersao = Number((proposta as any).ultimaVersao || totalVersoes || 0);
                    const deltaUltimaVersao = Number((proposta as any).deltaUltimaVersao || 0);
                    const possuiRevisao = totalVersoes > 1;
                    const statusMudouUltimaVersao = Boolean((proposta as any).statusMudouUltimaVersao);

                    return (
                      <article
                        key={propostaId}
                        className={`${shellTokens.card} p-4 transition-colors ${propostaSelecionada ? 'border-[#159A9C]/50 bg-[#F2FBFA]' : ''}`}
                        onMouseEnter={(e) => handleMouseEnterProposta(proposta, e)}
                        onMouseLeave={handleMouseLeaveProposta}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#19384C]">
                              {safeRender(proposta.numero)}
                            </p>
                            <p className="text-xs text-[#607B89]">
                              Criada em {formatDate(safeRender(proposta.data_criacao))}
                            </p>
                            {possuiRevisao && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewProposta(proposta)}
                                  className="inline-flex items-center rounded-full border border-[#0369A1]/30 bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-semibold text-[#075985] hover:bg-[#BAE6FD]"
                                  title="Abrir comparacao de versoes"
                                >
                                  v{ultimaVersao} ({totalVersoes - 1} revisao(oes))
                                </button>
                                {deltaUltimaVersao !== 0 && (
                                  <span className="text-[11px] font-medium text-[#0F4C5C]">
                                    Ultima revisao:{' '}
                                    <span
                                      className={
                                        deltaUltimaVersao > 0 ? 'text-[#B45309]' : 'text-[#0F7B7D]'
                                      }
                                    >
                                      {deltaUltimaVersao > 0 ? '+' : ''}
                                      {formatCurrency(deltaUltimaVersao)}
                                    </span>
                                  </span>
                                )}
                                {statusMudouUltimaVersao && (
                                  <span className="inline-flex rounded-full bg-[#FBBF24]/20 px-2 py-0.5 text-[11px] font-semibold text-[#92400E]">
                                    Status revisado
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={propostaSelecionada}
                                onChange={(e) => handleSelectProposta(propostaId, e)}
                                className="rounded border-[#C7D7DE] text-[#159A9C] focus:ring-[#159A9C]"
                              />
                            </label>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                                safeRender(proposta.status),
                              )}`}
                            >
                              {getStatusIcon(safeRender(proposta.status))}
                              {getStatusText(safeRender(proposta.status))}
                            </span>
                          </div>
                        </div>

                        <h4 className="line-clamp-2 text-sm font-semibold text-[#1E3A4B]">
                          {safeRender(proposta.titulo)}
                        </h4>

                        <div className="mt-3 space-y-1.5 text-sm text-[#4C6775]">
                          <p className="line-clamp-1">
                            <span className="font-medium text-[#244455]">Cliente:</span>{' '}
                            {safeRender(proposta.cliente)}
                          </p>
                          <p className="line-clamp-1">
                            <span className="font-medium text-[#244455]">Vendedor:</span>{' '}
                            {safeRender(proposta.vendedor)}
                          </p>
                          <p>
                            <span className="font-medium text-[#244455]">Vencimento:</span>{' '}
                            {formatDate(safeRender(proposta.data_vencimento))}
                          </p>
                        </div>

                        {safeRender(proposta.status) === 'rejeitada' && (
                          <div className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B91C1C]">
                              Motivo da perda
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-[#7F1D1D]">
                              {motivoPerda || 'Nao informado'}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRegistrarMotivoPerda(proposta)}
                              className="mt-2 inline-flex text-xs font-semibold text-[#B91C1C] hover:text-[#991B1B]"
                            >
                              {motivoPerda ? 'Editar motivo' : 'Informar motivo'}
                            </button>
                          </div>
                        )}

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-[#607B89]">Valor</p>
                            <p className="text-lg font-bold text-[#19384C]">
                              {formatCurrency(Number((proposta as any).valor) || 0)}
                            </p>
                          </div>
                          <PropostaActions
                            proposta={proposta}
                            onViewProposta={handleViewProposta}
                            onPropostaUpdated={() =>
                              carregarPropostas({ force: true, source: 'actions' })
                            }
                            className="justify-end"
                          />
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            ) : (
              <DataTableCard className="propostas-page overflow-hidden">
                {/* Header da tabela com informações de filtros */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Lista de Propostas ({filteredPropostas.length})
                      </h3>
                      {/* Indicadores de filtros ativos */}
                      <div className="flex items-center space-x-2">
                        {selectedStatus !== 'todos' && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#159A9C]/10 text-[#0F7B7D] rounded-full">
                            Status: {selectedStatus}
                          </span>
                        )}
                        {filtrosAvancados.urgencia && filtrosAvancados.urgencia !== 'todas' && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#FBBF24]/20 text-[#92400E] rounded-full">
                            {filtrosAvancados.urgencia === 'vencidas' && '🔴 Vencidas'}
                            {filtrosAvancados.urgencia === 'urgentes' && '🟠 Urgentes'}
                            {filtrosAvancados.urgencia === 'próximas' && '🟡 Próximas'}
                            {filtrosAvancados.urgencia === 'normais' && '🟢 Normais'}
                          </span>
                        )}
                        {searchTerm && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#159A9C]/10 text-[#0F7B7D] rounded-full">
                            Busca: "{searchTerm}"
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {propostasSelecionadas.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {propostasSelecionadas.length} selecionada(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden border-t border-[#DEE8EC]">
                  <div className="overflow-x-auto">
                    <table className="table-propostas min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {/* Checkbox para selecionar todas */}
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                propostasSelecionadas.length === filteredPropostas.length &&
                                filteredPropostas.length > 0
                              }
                              onChange={
                                propostasSelecionadas.length === filteredPropostas.length
                                  ? handleDeselectAll
                                  : handleSelectAll
                              }
                              className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                            />
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              if (sortBy === 'data_criacao') {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy('data_criacao');
                                setSortOrder('desc');
                              }
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Proposta</span>
                              {sortBy === 'data_criacao' &&
                                (sortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              if (sortBy === 'cliente') {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy('cliente');
                                setSortOrder('asc');
                              }
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Cliente</span>
                              {sortBy === 'cliente' &&
                                (sortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              if (sortBy === 'status') {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy('status');
                                setSortOrder('asc');
                              }
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Status</span>
                              {sortBy === 'status' &&
                                (sortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                ))}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile">
                            Motivo perda
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              if (sortBy === 'valor') {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy('valor');
                                setSortOrder('desc');
                              }
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Valor</span>
                              {sortBy === 'valor' &&
                                (sortOrder === 'asc' ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                ))}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile">
                            Vendedor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile">
                            Vencimento
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPropostas.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-12 text-center">
                              <p className="text-sm font-medium text-[#244455]">
                                Nenhuma proposta encontrada.
                              </p>
                              <p className="mt-1 text-sm text-[#607B89]">
                                Revise os filtros aplicados ou cadastre uma nova proposta.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredPropostas.map((proposta) => {
                            const totalVersoes = Number((proposta as any).totalVersoes || 0);
                            const ultimaVersao =
                              Number((proposta as any).ultimaVersao || totalVersoes || 0);
                            const deltaUltimaVersao = Number((proposta as any).deltaUltimaVersao || 0);
                            const possuiRevisao = totalVersoes > 1;
                            const statusMudouUltimaVersao = Boolean(
                              (proposta as any).statusMudouUltimaVersao,
                            );

                            return (
                            <tr
                              key={proposta.id}
                              className={`hover:bg-gray-50 ${propostasSelecionadas.includes(proposta.id?.toString() || proposta.numero) ? 'bg-[#159A9C]/10' : ''} transition-colors duration-200`}
                              onMouseEnter={(e) => handleMouseEnterProposta(proposta, e)}
                              onMouseLeave={handleMouseLeaveProposta}
                            >
                              {/* Checkbox */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={propostasSelecionadas.includes(
                                    proposta.id?.toString() || proposta.numero,
                                  )}
                                  onChange={(e) =>
                                    handleSelectProposta(
                                      proposta.id?.toString() || proposta.numero,
                                      e,
                                    )
                                  }
                                  className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap" data-label="Proposta">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {safeRender(proposta.numero)}
                                  </div>
                                  <div className="subinfo ellipsis-text">
                                    {safeRender(proposta.titulo)}
                                  </div>
                                  <div className="subinfo flex items-center mt-1">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Criada em {formatDate(safeRender(proposta.data_criacao))}
                                  </div>
                                  {possuiRevisao && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleViewProposta(proposta)}
                                        className="inline-flex items-center rounded-full border border-[#0369A1]/30 bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-semibold text-[#075985] hover:bg-[#BAE6FD]"
                                        title="Abrir comparacao de versoes"
                                      >
                                        v{ultimaVersao} ({totalVersoes - 1} revisao(oes))
                                      </button>
                                      {deltaUltimaVersao !== 0 && (
                                        <span className="text-[11px] font-medium text-[#0F4C5C]">
                                          {deltaUltimaVersao > 0 ? '+' : ''}
                                          {formatCurrency(deltaUltimaVersao)}
                                        </span>
                                      )}
                                      {statusMudouUltimaVersao && (
                                        <span className="inline-flex rounded-full bg-[#FBBF24]/20 px-2 py-0.5 text-[11px] font-semibold text-[#92400E]">
                                          Status revisado
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {proposta.oportunidade && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#159A9C]/10 text-[#159A9C] border border-[#159A9C]/20">
                                        <Target className="w-3 h-3 mr-1" />
                                        {proposta.oportunidade.titulo}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap" data-label="Cliente">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 ellipsis-text">
                                    {safeRender(proposta.cliente)}
                                  </div>
                                  <div className="subinfo flex items-center">
                                    <User className="w-4 h-4 mr-1" />
                                    <span className="ellipsis-sm">
                                      {safeRender(proposta.cliente_contato)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap col-hide-mobile"
                                data-label="Status"
                              >
                                <div className="space-y-2">
                                  {/* Novo Status com Fluxo Automatizado */}
                                  <StatusFluxo
                                    status={safeRender(proposta.status)}
                                    compact={true}
                                  />

                                  {/* Indicadores adicionais */}
                                  <div className="flex items-center space-x-2">
                                    {proposta.urgencia === 'alta' && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Urgente
                                      </span>
                                    )}
                                    {proposta.status === 'enviada' && (
                                      <span className="text-[#0F7B7D] text-xs">📧 Enviada</span>
                                    )}
                                  </div>

                                  {/* Probabilidade */}
                                  <div className="subinfo">
                                    <span>{safeRender(proposta.probabilidade)}% de chance</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 col-hide-mobile" data-label="Motivo perda">
                                {safeRender(proposta.status) === 'rejeitada' ? (
                                  <div className="max-w-[280px] space-y-2">
                                    <p className="line-clamp-2 text-sm text-[#7F1D1D]">
                                      {getMotivoPerda(proposta) || 'Nao informado'}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => handleRegistrarMotivoPerda(proposta)}
                                      className="inline-flex text-xs font-semibold text-[#B91C1C] hover:text-[#991B1B]"
                                    >
                                      {getMotivoPerda(proposta)
                                        ? 'Editar motivo'
                                        : 'Informar motivo'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#94A3B8]">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap" data-label="Valor">
                                <div className="valor-proposta text-sm font-medium">
                                  {formatCurrency(Number((proposta as any).valor) || 0)}
                                </div>
                                <div className="subinfo capitalize">
                                  {safeRender(proposta.categoria)}
                                </div>
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 col-hide-mobile"
                                data-label="Vendedor"
                              >
                                {safeRender(proposta.vendedor)}
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap col-hide-mobile"
                                data-label="Vencimento"
                              >
                                <div className="data-proposta text-sm text-gray-900">
                                  {formatDate(safeRender(proposta.data_vencimento))}
                                </div>
                                <div
                                  className={`subinfo ${
                                    proposta.dias_restantes <= 0
                                      ? 'text-[#DC2626] font-semibold'
                                      : proposta.dias_restantes <= 3
                                        ? 'text-[#B45309] font-semibold'
                                        : proposta.dias_restantes <= 7
                                          ? 'text-[#92400E]'
                                          : 'text-[#16A34A]'
                                  }`}
                                >
                                  {proposta.dias_restantes <= 0 ? (
                                    <span className="flex items-center">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Vencida há {Math.abs(proposta.dias_restantes)} dias
                                    </span>
                                  ) : proposta.dias_restantes <= 3 ? (
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Vence em {proposta.dias_restantes} dias
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {proposta.dias_restantes} dias restantes
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td
                                className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                                data-label="Ações"
                              >
                                <PropostaActions
                                  proposta={proposta}
                                  onViewProposta={handleViewProposta}
                                  onPropostaUpdated={() =>
                                    carregarPropostas({ force: true, source: 'actions' })
                                  }
                                  className="justify-end"
                                />
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Paginação */}
                <div className="bg-white px-6 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">1</span> a{' '}
                      <span className="font-medium">{filteredPropostas.length}</span> de{' '}
                      <span className="font-medium">{filteredPropostas.length}</span> resultados
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                        Anterior
                      </button>
                      <button className="px-3 py-1 bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded text-sm transition-colors">
                        1
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              </DataTableCard>
            )}

            {/* Modal de Proposta */}
            <ModalProposta
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSave={handleSaveProposta}
              isLoading={isLoadingCreate}
            />

            {/* Modal de Visualização de Proposta */}
            {selectedPropostaForView && (
              <ModalVisualizarProposta
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                proposta={selectedPropostaForView}
                onPropostaUpdated={() => carregarPropostas({ force: true, source: 'modal-view' })}
              />
            )}

            {/* Modal Wizard removido daqui - movido para o início do JSX */}

            {/* Componentes adicionais */}
            <BulkActions
              selectedIds={selectedPropostas}
              onAction={handleBulkAction}
              onClearSelection={clearSelection}
            />
          </>
        )}

        {/* 🆕 FASE 2: Componentes de UX Melhorada */}

        {/* Seleção Múltipla - Barra fixa na parte inferior */}
        <SelecaoMultipla
          propostasSelecionadas={propostasSelecionadas}
          totalPropostas={filteredPropostas.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onExportarSelecionadas={handleExportarSelecionadas}
          onAcoesMassa={handleAcoesMassa}
          visible={propostasSelecionadas.length > 0}
        />

        {/* Preview de Proposta - Hover tooltip */}
        <PreviewProposta
          proposta={previewProposta}
          isVisible={showPreview}
          onClose={() => setShowPreview(false)}
          onViewFull={() => {
            if (previewProposta) {
              handleViewProposta(previewProposta);
              setShowPreview(false);
            }
          }}
          onEdit={() => {
            if (previewProposta) {
              handleEditProposta(previewProposta.id);
              setShowPreview(false);
            }
          }}
          onDownload={() => {
            if (previewProposta) {
              handleGeneratePDF(previewProposta);
              setShowPreview(false);
            }
          }}
          onSend={() => {
            if (previewProposta) {
              // Implementar envio por email
              showNotification(`Proposta ${previewProposta.numero} enviada por email!`, 'success');
              setShowPreview(false);
            }
          }}
          position={previewPosition}
        />

        {/* Notificações Toast */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-[#159A9C]/10 text-[#0F7B7D] border border-[#159A9C]/30'
                : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropostasPage;

