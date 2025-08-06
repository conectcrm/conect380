import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ModalProposta } from '../../components/modals/ModalProposta';
import { ModalNovaProposta } from '../../components/modals/ModalNovaProposta';
import { propostasService, Proposta as PropostaCompleta } from '../../services/propostasService';
import { pdfPropostasService, DadosProposta } from '../../services/pdfPropostasService';
import DashboardPropostas from './components/DashboardPropostas';
import BulkActions from './components/BulkActions';
import FiltrosAvancados from './components/FiltrosAvancados';
import PropostaActions from './components/PropostaActions';
import StatusFluxo from './components/StatusFluxo';
import ModalVisualizarProposta from './components/ModalVisualizarProposta';
import SelecaoMultipla from './components/SelecaoMultipla';
import PreviewProposta from './components/PreviewProposta';
import { createSafeMouseHandler } from '../../utils/dom-helper';
import { safeRender } from '../../utils/safeRender';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Settings,
  Grid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  BarChart3,
  RefreshCw,
  Target,
  TrendingDown,
  Users,
  Copy
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
    console.log(`💾 [CACHE] Dados do cliente "${nome}" obtidos do cache`);
    return clienteCache.get(cacheKey);
  }

  try {
    console.log(`🔍 [GRID] Buscando dados reais para: "${nome}"`);

    // ⚡ OTIMIZADO: Verificar se o cache global ainda é válido
    const agora = Date.now();
    const cacheExpirado = (agora - ultimaCarregaClientes) > CACHE_CLIENTES_DURACAO;

    if (!clientesGlobaisPromise || cacheExpirado) {
      if (cacheExpirado) {
        console.log(`🔄 [CACHE GLOBAL] Cache expirado, recarregando clientes...`);
        clientesGlobaisPromise = null;
      } else {
        console.log(`📥 [CACHE GLOBAL] Carregando todos os clientes uma única vez...`);
      }

      ultimaCarregaClientes = agora;
      clientesGlobaisPromise = import('../../services/clientesService').then(module =>
        module.clientesService.getClientes({ limit: 100 })
      ).then(response => {
        console.log(`✅ [CACHE GLOBAL] ${response?.data?.length || 0} clientes carregados`);
        return response?.data || [];
      }).catch(error => {
        console.error(`❌ [CACHE GLOBAL] Erro ao carregar clientes:`, error);
        clientesGlobaisPromise = null; // Reset para tentar novamente
        ultimaCarregaClientes = 0;
        return [];
      });
    }

    const todosClientes = await clientesGlobaisPromise;

    if (todosClientes && todosClientes.length > 0) {
      const clienteReal = todosClientes.find(c =>
        c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
        nome.toLowerCase().includes(c.nome?.toLowerCase())
      );

      let resultado = null;
      if (clienteReal && clienteReal.email && clienteReal.email !== emailFicticio) {
        console.log(`✅ [GRID] Dados reais encontrados:`, {
          nome: clienteReal.nome,
          email: clienteReal.email,
          telefone: clienteReal.telefone
        });

        resultado = {
          nome: clienteReal.nome,
          email: clienteReal.email,
          telefone: clienteReal.telefone
        };
      }

      // Armazenar no cache por 5 minutos
      clienteCache.set(cacheKey, resultado);
      return resultado;
    }
  } catch (error) {
    console.log(`⚠️ [GRID] Erro ao buscar dados reais para "${nome}":`, error);
    // Armazenar null no cache para evitar tentativas repetidas
    clienteCache.set(cacheKey, null);
  }

  return null;
};

// Função para converter PropostaCompleta para o formato da UI
const converterPropostaParaUI = async (proposta: any) => {
  // Log detalhado para debug
  console.log(`🔄 [CONVERTER] Processando proposta ${proposta.numero}:`);
  console.log(`   - ID: ${proposta.id}`);
  console.log(`   - Status: "${proposta.status}"`);
  console.log(`   - Cliente original:`, proposta.cliente);
  console.log(`   - Tipo do cliente:`, typeof proposta.cliente);

  // Extrair dados do cliente de forma mais robusta
  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';
  let clienteTelefone = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    // Cliente como objeto (formato correto)
    clienteNome = safeRender(proposta.cliente.nome) || 'Cliente não informado';
    clienteEmail = safeRender(proposta.cliente.email) || '';
    clienteTelefone = safeRender(proposta.cliente.telefone) || '';

    console.log(`   📦 Cliente OBJETO - Nome: "${clienteNome}", Email: "${clienteEmail}"`);

    // ⚡ OTIMIZADO: Só buscar dados reais se realmente necessário e não estiver em cache
    const isEmailFicticio = clienteEmail && (
      clienteEmail.includes('@cliente.com') ||
      clienteEmail.includes('@cliente.temp') ||
      clienteEmail.includes('@email.com')
    );

    if (isEmailFicticio) {
      console.log(`   ⚠️  EMAIL FICTÍCIO DETECTADO: ${clienteEmail}`);

      // ✅ CACHE OTIMIZADO: Verificar cache primeiro, apenas buscar se necessário
      const cacheKey = `cliente_${clienteNome.toLowerCase().trim()}`;

      if (clienteCache.has(cacheKey)) {
        const dadosCache = clienteCache.get(cacheKey);
        if (dadosCache) {
          console.log(`   🎯 USANDO CACHE para ${clienteNome}`);
          clienteNome = dadosCache.nome;
          clienteEmail = dadosCache.email;
          clienteTelefone = dadosCache.telefone;
        }
      } else {
        console.log(`   🔍 Buscando dados REAIS para o GRID (não está em cache)...`);
        const dadosReais = await buscarDadosReaisDoCliente(clienteNome, clienteEmail);

        if (dadosReais) {
          console.log(`   ✅ SUBSTITUINDO por dados REAIS no grid:`);
          console.log(`      Email: ${clienteEmail} → ${dadosReais.email}`);
          console.log(`      Telefone: ${clienteTelefone} → ${dadosReais.telefone}`);

          clienteNome = dadosReais.nome;
          clienteEmail = dadosReais.email;
          clienteTelefone = dadosReais.telefone;
        } else {
          console.log(`   ⚠️  Dados reais não encontrados, mantendo originais`);
        }
      }
    } else if (clienteEmail) {
      console.log(`   🔒 EMAIL REAL PROTEGIDO: ${clienteEmail}`);
    }
  } else if (typeof proposta.cliente === 'string') {
    // Cliente como string (formato antigo)
    clienteNome = safeRender(proposta.cliente);
    console.log(`   📝 Cliente STRING - Nome original: "${clienteNome}"`);

    // ⚡ OTIMIZADO: Cache para clientes string também
    const cacheKey = `cliente_${clienteNome.toLowerCase().trim()}`;

    if (clienteCache.has(cacheKey)) {
      const dadosCache = clienteCache.get(cacheKey);
      if (dadosCache) {
        console.log(`   🎯 USANDO CACHE para cliente STRING: ${clienteNome}`);
        clienteNome = dadosCache.nome;
        clienteEmail = dadosCache.email;
        clienteTelefone = dadosCache.telefone;
      }
    } else {
      console.log(`   🔍 Buscando dados reais para cliente STRING (não está em cache)...`);
      const dadosReais = await buscarDadosReaisDoCliente(clienteNome);

      if (dadosReais) {
        console.log(`   ✅ Dados reais encontrados para cliente STRING:`);
        console.log(`      Email: ${dadosReais.email}`);
        console.log(`      Telefone: ${dadosReais.telefone}`);

        clienteNome = dadosReais.nome;
        clienteEmail = dadosReais.email;
        clienteTelefone = dadosReais.telefone;
      } else {
        console.log(`   ⚠️  Dados reais não encontrados para cliente STRING`);
        clienteEmail = ''; // Deixar vazio se não encontrou
      }
    }
  }

  // 🔧 CORREÇÃO DE DATAS - Garantir que as datas sejam válidas
  const criadaEm = proposta.criadaEm ? new Date(proposta.criadaEm) : new Date();
  const dataValidade = proposta.dataValidade ? new Date(proposta.dataValidade) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias por padrão

  // Validar se as datas são válidas
  const dataCreated = !isNaN(criadaEm.getTime()) ? criadaEm.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const dataExpiry = !isNaN(dataValidade.getTime()) ? dataValidade.toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Calcular dias restantes
  const hoje = new Date();
  const diasRestantes = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

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
    vendedor: typeof proposta.vendedor === 'object' && proposta.vendedor?.nome
      ? safeRender(proposta.vendedor.nome)
      : typeof proposta.vendedor === 'string'
        ? safeRender(proposta.vendedor)
        : 'Sistema', // Usando vendedor real quando disponível
    descricao: safeRender(proposta.observacoes) || `Proposta com ${proposta.produtos?.length || 0} produtos`,
    probabilidade: proposta.status === 'aprovada' ? 100 : proposta.status === 'enviada' ? 70 : proposta.status === 'rejeitada' ? 0 : 30,
    categoria: 'proposta',
    urgencia: diasRestantes <= 3 ? 'alta' : diasRestantes <= 7 ? 'media' : 'baixa' // ✅ Indicador de urgência
  };

  console.log(`   ✅ RESULTADO final:`, resultado);
  console.log(`   ✅ cliente_contato final: "${resultado.cliente_contato}"`);
  console.log(`   ✅ cliente_telefone final: "${resultado.cliente_telefone}"`);

  return resultado;
};

// Dados removidos - sistema agora trabalha apenas com dados reais do banco

const PropostasPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
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

  // � Sistema de Controle de Atualizações v2
  const [isLoadingPropostas, setIsLoadingPropostas] = useState(false);
  const updateControl = React.useRef({
    lastUpdate: 0,
    pendingUpdate: false,
    updateSource: '',
    batchTimeout: null as NodeJS.Timeout | null,
    requestId: null as string | null
  });
  const REFRESH_CONFIG = {
    minInterval: 5000,        // Intervalo mínimo entre atualizações
    batchWindow: 2000,        // Janela para agrupar múltiplas solicitações
    forceInterval: 30000,     // Intervalo para forçar atualização mesmo sem mudanças
    modalDebounce: 1000      // Debounce específico para interações do modal
  };

  // Sistema unificado de logs
  const logUpdate = (action: string, details: any = {}) => {
    console.log(`🔄 [UPDATE-SYSTEM] ${action}:`, {
      timestamp: new Date().toISOString(),
      loadingState: isLoadingPropostas,
      timeSinceLastUpdate: Date.now() - updateControl.current.lastUpdate,
      ...details
    });
  };

  // Novos estados para funcionalidades avançadas
  const [selectedPropostas, setSelectedPropostas] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'data_criacao' | 'valor' | 'cliente' | 'status'>('data_criacao');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'dashboard'>('dashboard'); // Novo modo dashboard
  const [filtrosAvancados, setFiltrosAvancados] = useState<any>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPropostaForView, setSelectedPropostaForView] = useState<any>(null);

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

  // � Sistema Inteligente de Atualizações v2
  const carregarPropostas = useCallback(async (options: {
    force?: boolean;
    source?: string;
    immediate?: boolean;
  } = {}) => {
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
          timeSinceLastUpdate
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
      console.log(`🚀 [ANTI-REFRESH] Iniciando carregamento ${requestId}${force ? ' (FORÇADO)' : ''}`);
      setIsLoadingPropostas(true);
      setIsLoading(true);
      updateControl.current.lastUpdate = now;
      updateControl.current.requestId = requestId;

      console.log(`🔄 [OTIMIZADO] Carregando propostas do banco de dados... (${requestId})`);

      const propostasReais = await propostasService.findAll();

      // Verificar se esta requisição ainda é válida (evitar race conditions)
      if (updateControl.current.requestId !== requestId) {
        console.log(`🚫 [RACE-CONDITION] Requisição ${requestId} cancelada, outra mais recente em andamento`);
        return;
      }

      console.log(`🔄 [OTIMIZADO] Propostas carregadas do serviço (${requestId}):`, propostasReais.length);

      if (propostasReais && propostasReais.length > 0) {
        console.log(`🔄 [OTIMIZADO] Convertendo propostas com busca de dados reais... (${requestId})`);

        // ✅ CONVERTER TODAS AS PROPOSTAS COM BUSCA DE DADOS REAIS
        const propostasFormatadas = await Promise.all(
          propostasReais.map(async (proposta) => {
            // Converter proposta do backend para o formato esperado
            const propostaFormatada = {
              id: proposta.id,
              numero: proposta.numero,
              cliente: proposta.cliente, // O backend já retorna o objeto cliente correto
              total: proposta.valor || proposta.total,
              status: proposta.status,
              observacoes: proposta.observacoes,
              criadaEm: proposta.criadaEm || new Date().toISOString(),
              dataValidade: proposta.dataVencimento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              vendedor: proposta.vendedor,
              produtos: proposta.produtos || []
            };
            return await converterPropostaParaUI(propostaFormatada);
          })
        );

        // Verificar novamente se esta requisição ainda é válida
        if (updateControl.current.requestId !== requestId) {
          console.log(`🚫 [RACE-CONDITION] Requisição ${requestId} cancelada durante conversão`);
          return;
        }

        // Validar que todas as propostas têm campos string
        const propostasValidadas = propostasFormatadas.map(proposta => ({
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
          valor: Number(proposta.valor) || 0,
          probabilidade: Number(proposta.probabilidade) || 0
        }));

        setPropostas(propostasValidadas);
        setFilteredPropostas(propostasValidadas);
        console.log(`✅ [OTIMIZADO] Propostas carregadas do banco (${requestId}):`, propostasValidadas.length);

        // Log específico para verificar status das propostas enviadas
        const propostasEnviadas = propostasValidadas.filter(p => p.status === 'enviada');
        console.log(`📧 [OTIMIZADO] Propostas com status "enviada": ${propostasEnviadas.length}`);
        propostasEnviadas.forEach(p => {
          console.log(`  - ${p.numero}: ${p.status}`);
        });
      } else {
        setPropostas([]);
        setFilteredPropostas([]);
        console.log(`📝 [OTIMIZADO] Nenhuma proposta encontrada no banco de dados (${requestId})`);
      }
    } catch (error) {
      console.error(`❌ [OTIMIZADO] Erro ao carregar propostas (${requestId}):`, error);
      setPropostas([]);
      setFilteredPropostas([]);
      // ❌ REMOVIDO: showNotification causa dependência circular
      console.error('Erro ao carregar propostas do banco de dados');
    } finally {
      // Só resetar se ainda é a requisição atual
      if (updateControl.current.requestId === requestId) {
        setIsLoading(false);
        setIsLoadingPropostas(false);
        updateControl.current.requestId = null;
        console.log(`✅ [ANTI-REFRESH] Carregamento finalizado (${requestId})`);
      } else {
        console.log(`🔄 [RACE-CONDITION] Finalizando requisição cancelada (${requestId})`);
      }
    }
  }, [isLoadingPropostas]); // ✅ Dependências limpas

  // ✅ CARREGAMENTO INICIAL SIMPLIFICADO - Sem dependência circular
  useEffect(() => {
    console.log('🚀 [INICIAL] Carregamento inicial das propostas');

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
  }, []); // ✅ SEM DEPENDÊNCIAS - Executa apenas na montagem

  // 🔄 POLLING AUTOMÁTICO DESABILITADO - Causava múltiplas requisições desnecessárias
  // useEffect(() => {
  //   console.log('⏰ Iniciando polling automático para atualização em tempo real...');

  //   const intervalo = setInterval(() => {
  //     console.log('🔄 Polling: Verificando atualizações...');
  //     carregarPropostas();
  //   }, 30000); // 30 segundos

  //   // Cleanup
  //   return () => {
  //     console.log('🛑 Parando polling automático');
  //     clearInterval(intervalo);
  //   };
  // }, []);

  // ⚡ OTIMIZADO: Atualizar lista quando página voltar ao foco (com debounce)
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;

    const handleFocus = () => {
      console.log('� [FOCUS] Página voltou ao foco...');
      // Usar debounce de 3 segundos para focus
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        console.log('🔄 [FOCUS] Verificando se precisa recarregar propostas...');
        carregarPropostas({ force: false }); // Não forçar reload
      }, 3000);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, []);

  // Sistema de Eventos Simplificado
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    const refreshDelay = 5000; // 5 segundos de espera

    const handlePropostaAtualizada = (e: Event) => {
      const event = e as CustomEvent;
      const detail = event.detail || {};

      // Atualização local imediata
      if (detail.propostaId && detail.novoStatus) {
        setPropostas(prev => prev.map(p =>
          p.id === detail.propostaId
            ? { ...p, status: detail.novoStatus }
            : p
        ));

        setFilteredPropostas(prev => prev.map(p =>
          p.id === detail.propostaId
            ? { ...p, status: detail.novoStatus }
            : p
        ));
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
  }, []);

  // Função para salvar proposta usando serviço real
  const handleSaveProposta = async (data: any) => {
    try {
      setIsLoadingCreate(true);
      console.log('💾 Salvando proposta no banco de dados...', data);

      // Usar o serviço real para criar a proposta
      // const novaProposta = await propostasService.criarProposta(data);

      console.log('✅ Proposta criada com sucesso (simulado):', data);

      // Recarregar a lista de propostas para incluir a nova
      await carregarPropostas({ force: true }); // Forçar reload após criar nova proposta

      showNotification('Proposta criada com sucesso!', 'success');
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      showNotification('Erro ao criar proposta. Tente novamente.', 'error');
    } finally {
      setIsLoadingCreate(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = propostas;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(proposta =>
        proposta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.cliente_contato.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter(proposta => proposta.status === selectedStatus);
    }

    // Filtro por vendedor
    if (selectedVendedor !== 'todos') {
      filtered = filtered.filter(proposta => proposta.vendedor === selectedVendedor);
    }

    // Filtros avançados - range de datas
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(proposta => {
        const dataCreated = new Date(proposta.data_criacao);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return dataCreated >= startDate && dataCreated <= endDate;
      });
    }

    // Filtros avançados - range de valores
    if (valueRange.min || valueRange.max) {
      filtered = filtered.filter(proposta => {
        const valor = proposta.valor;
        const min = valueRange.min ? parseFloat(valueRange.min) : 0;
        const max = valueRange.max ? parseFloat(valueRange.max) : Infinity;
        return valor >= min && valor <= max;
      });
    }

    // Filtros avançados do componente FiltrosAvancados
    if (filtrosAvancados.status) {
      filtered = filtered.filter(p => p.status === filtrosAvancados.status);
    }
    if (filtrosAvancados.vendedor) {
      filtered = filtered.filter(p => p.vendedor === filtrosAvancados.vendedor);
    }
    if (filtrosAvancados.dataInicio && filtrosAvancados.dataFim) {
      filtered = filtered.filter(p => {
        const dataProposta = new Date(p.data_criacao);
        const inicio = new Date(filtrosAvancados.dataInicio);
        const fim = new Date(filtrosAvancados.dataFim);
        return dataProposta >= inicio && dataProposta <= fim;
      });
    }

    // ✅ NOVO: Filtro por urgência
    if (filtrosAvancados.urgencia && filtrosAvancados.urgencia !== 'todas') {
      filtered = filtered.filter(p => {
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
      filtered = filtered.filter(p => p.valor >= filtrosAvancados.valorMin);
    }
    if (filtrosAvancados.valorMax !== undefined) {
      filtered = filtered.filter(p => p.valor <= filtrosAvancados.valorMax);
    }
    if (filtrosAvancados.categoria) {
      filtered = filtered.filter(p => p.categoria === filtrosAvancados.categoria);
    }
    if (filtrosAvancados.probabilidadeMin !== undefined) {
      filtered = filtered.filter(p => p.probabilidade >= filtrosAvancados.probabilidadeMin);
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
  }, [propostas, searchTerm, selectedStatus, selectedVendedor, dateRange, valueRange, sortBy, sortOrder, filtrosAvancados]);

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
      setPropostasSelecionadas(prev => [...prev, propostaId]);
    } else {
      setPropostasSelecionadas(prev => prev.filter(id => id !== propostaId));
    }
  };

  // Selecionar todas as propostas visíveis
  const handleSelectAll = () => {
    const propostasVisiveis = filteredPropostas.map(p => p.id?.toString() || p.numero);
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
        y: rect.top + rect.height / 2
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

    try {
      showNotification(`Exportando ${propostasSelecionadas.length} proposta(s)...`, 'success');

      // Implementar exportação aqui
      // const dadosExportacao = propostasData.filter(p => propostasSelecionadas.includes(p.id.toString()));
      // await exportarPropostasService.exportarPDF(dadosExportacao);

      showNotification('Propostas exportadas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar propostas:', error);
      showNotification('Erro ao exportar propostas', 'error');
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
          showNotification(`Enviando ${propostasSelecionadas.length} proposta(s) por email...`, 'success');
          break;

        case 'gerar-contratos':
          showNotification(`Gerando contratos para ${propostasSelecionadas.length} proposta(s)...`, 'success');
          break;

        case 'criar-faturas':
          showNotification(`Criando faturas para ${propostasSelecionadas.length} proposta(s)...`, 'success');
          break;

        case 'avancar-fluxo':
          showNotification(`Avançando fluxo de ${propostasSelecionadas.length} proposta(s)...`, 'success');
          break;

        case 'exportar-pdf':
          await handleExportarSelecionadas();
          break;

        case 'excluir':
          if (window.confirm(`Tem certeza que deseja excluir ${propostasSelecionadas.length} proposta(s)?`)) {
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
      showNotification(`Gerando PDF da proposta ${proposta.numero}...`, 'success');
      // Implementar geração de PDF aqui
      // await pdfPropostasService.gerarPDF(proposta);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showNotification('Erro ao gerar PDF', 'error');
    }
  };

  // Função para clonar proposta
  const handleCloneProposta = async (propostaId: string) => {
    try {
      // const propostaClonada = await propostasService.clonarProposta(propostaId);
      showNotification('Proposta clonada com sucesso! (simulado)', 'success');
      carregarPropostas({ force: true }); // Forçar reload após clonar
    } catch (error) {
      console.error('Erro ao clonar proposta:', error);
      showNotification('Erro ao clonar proposta', 'error');
    }
  };

  // Ações em massa usando serviços reais
  const handleBulkDelete = async () => {
    if (window.confirm(`Deseja excluir ${selectedPropostas.length} proposta(s) selecionada(s)?`)) {
      try {
        setIsLoading(true);
        console.log('🗑️ Excluindo propostas em lote:', selectedPropostas);

        // Usar o serviço real para exclusão em lote
        // await propostasService.excluirEmLote(selectedPropostas);
        console.log('🗑️ Exclusão em lote simulada:', selectedPropostas);

        showNotification(`${selectedPropostas.length} proposta(s) excluída(s) com sucesso! (simulado)`, 'success');
        setSelectedPropostas([]);
        setShowBulkActions(false);

        // Recarregar dados após exclusão
        await carregarPropostas({ force: true }); // Forçar reload após deletar
      } catch (error) {
        console.error('❌ Erro ao excluir propostas em lote:', error);
        showNotification('Erro ao excluir propostas. Tente novamente.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);
      console.log('📝 Alterando status em lote:', selectedPropostas, 'para:', newStatus);

      // Para cada proposta selecionada, alterar o status
      for (const propostaId of selectedPropostas) {
        // await propostasService.atualizarStatus(propostaId, newStatus);
        console.log('📝 Status alterado (simulado):', propostaId, 'para:', newStatus);
      }

      showNotification(`Status de ${selectedPropostas.length} proposta(s) alterado com sucesso! (simulado)`, 'success');
      setSelectedPropostas([]);
      setShowBulkActions(false);

      // Recarregar dados após alteração de status
      await carregarPropostas({ force: true }); // Forçar reload após alterar status
    } catch (error) {
      console.error('❌ Erro ao alterar status em lote:', error);
      showNotification('Erro ao alterar status das propostas. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = async () => {
    const selectedData = propostas.filter(p => selectedPropostas.includes(p.id));

    // Criar CSV
    const headers = ['Número', 'Cliente', 'Título', 'Valor', 'Status', 'Data Criação', 'Vendedor'];
    const csvContent = [
      headers.join(','),
      ...selectedData.map(p => [
        p.numero,
        p.cliente,
        p.titulo,
        p.valor,
        p.status,
        p.data_criacao,
        p.vendedor
      ].join(','))
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
    console.log('🔄 [MANUAL] Refresh solicitado pelo usuário via dashboard');
    carregarPropostas({ force: true }); // Forçar reload quando usuário solicita manualmente
  };

  const calcularMetricas = () => {
    const total = filteredPropostas.length;
    const aprovadas = filteredPropostas.filter(p => p.status === 'aprovada').length;
    const emNegociacao = filteredPropostas.filter(p => p.status === 'negociacao').length;
    const valorTotal = filteredPropostas.reduce((sum, p) => sum + p.valor, 0);
    const valorAprovado = filteredPropostas
      .filter(p => p.status === 'aprovada')
      .reduce((sum, p) => sum + p.valor, 0);

    const taxaConversao = total > 0 ? (aprovadas / total) * 100 : 0;

    return {
      total,
      aprovadas,
      emNegociacao,
      valorTotal,
      valorAprovado,
      taxaConversao
    };
  };

  const metricas = calcularMetricas();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada': return <CheckCircle className="w-4 h-4" />;
      case 'rejeitada': return <XCircle className="w-4 h-4" />;
      case 'negociacao': return <TrendingUp className="w-4 h-4" />;
      case 'enviada': return <Clock className="w-4 h-4" />;
      case 'rascunho': return <Edit className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada': return 'bg-green-100 text-green-800';
      case 'rejeitada': return 'bg-red-100 text-red-800';
      case 'negociacao': return 'bg-blue-100 text-blue-800';
      case 'enviada': return 'bg-yellow-100 text-yellow-800';
      case 'rascunho': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovada': return 'Aprovada';
      case 'rejeitada': return 'Rejeitada';
      case 'negociacao': return 'Em Negociação';
      case 'enviada': return 'Enviada';
      case 'rascunho': return 'Rascunho';
      default: return status;
    }
  };

  // Manipuladores dos botões de ações
  const converterPropostaParaPDF = async (proposta: any): Promise<DadosProposta> => {
    console.log('🔄 Convertendo proposta para PDF:', proposta);

    // Verificar se a proposta tem dados reais do sistema
    const temDadosReais = proposta.id && proposta.id.startsWith('prop_');

    if (temDadosReais) {
      console.log('📋 Usando dados reais da proposta criada no sistema');

      try {
        // Buscar dados completos da proposta (simulado por enquanto)
        console.log('🎯 Usando dados da proposta encontrada:', proposta);

        // Simular dados completos da proposta
        const propostaCompleta = {
          ...proposta,
          produtos: [
            {
              produto: {
                nome: proposta.titulo || 'Produto/Serviço',
                preco: proposta.valor || 0,
                categoria: proposta.categoria || 'Geral',
                descricao: proposta.descricao || 'Produto/serviço da proposta',
                unidade: 'un',
                tipo: 'servico'
              },
              quantidade: 1,
              desconto: 0
            }
          ]
        };

        console.log('🎯 Proposta completa simulada:', propostaCompleta);

        // Converter produtos reais para formato PDF
        const itensReais = propostaCompleta.produtos.map((produtoProposta, index) => {
          const produto = produtoProposta.produto;
          const quantidade = produtoProposta.quantidade;
          const desconto = produtoProposta.desconto || 0;
          const valorUnitario = produto.preco;
          const valorComDesconto = valorUnitario * (1 - desconto / 100);
          const valorTotal = valorComDesconto * quantidade;

          // Criar descrição detalhada do produto
          let descricaoDetalhada = produto.descricao || '';

          // Adicionar informações específicas por tipo
          if (produto.tipo === 'software') {
            descricaoDetalhada += descricaoDetalhada ? '\n' : '';
            descricaoDetalhada += `• Categoria: Software/Tecnologia`;
            if (produto.tipoItem) {
              descricaoDetalhada += `\n• Tipo: ${produto.tipoItem}`;
            }
            if (produto.tipoLicenciamento) {
              descricaoDetalhada += `\n• Licenciamento: ${produto.tipoLicenciamento}`;
            }
            if (produto.periodicidadeLicenca) {
              descricaoDetalhada += `\n• Periodicidade: ${produto.periodicidadeLicenca}`;
            }
            if (produto.quantidadeLicencas) {
              descricaoDetalhada += `\n• Licenças incluídas: ${produto.quantidadeLicencas}`;
            }
            if (produto.renovacaoAutomatica) {
              descricaoDetalhada += `\n• Renovação automática ativada`;
            }
          } else if (produto.tipo === 'combo') {
            descricaoDetalhada += descricaoDetalhada ? '\n' : '';
            descricaoDetalhada += `• Categoria: Pacote Promocional`;
            descricaoDetalhada += `\n• Pacote com ${produto.produtosCombo?.length || 0} itens incluídos`;
            if (produto.precoOriginal && produto.desconto) {
              const economia = produto.precoOriginal - produto.preco;
              descricaoDetalhada += `\n• Economia: R$ ${economia.toFixed(2)} (${produto.desconto.toFixed(1)}% OFF)`;
            }
            if (produto.produtosCombo && produto.produtosCombo.length > 0) {
              descricaoDetalhada += `\n• Itens inclusos: ${produto.produtosCombo.map(p => p.nome).join(', ')}`;
            }
          } else {
            descricaoDetalhada += descricaoDetalhada ? '\n' : '';
            descricaoDetalhada += `• Categoria: ${produto.categoria}`;
          }

          // Adicionar unidade de medida
          descricaoDetalhada += `\n• Unidade de medida: ${produto.unidade}`;

          return {
            nome: produto.nome,
            descricao: descricaoDetalhada.trim(),
            quantidade: quantidade,
            valorUnitario: valorUnitario,
            desconto: desconto,
            valorTotal: valorTotal
          };
        });

        // Calcular totais reais
        const subtotal = propostaCompleta.subtotal;
        const descontoGlobal = (propostaCompleta.descontoGlobal || 0);
        const impostos = propostaCompleta.impostos || 0;
        const valorTotal = propostaCompleta.total;

        // Obter dados do cliente real
        const clienteReal = propostaCompleta.cliente;
        const vendedorReal = propostaCompleta.vendedor;

        // Mapear status para o formato correto
        const statusMap = {
          'rascunho': 'draft',
          'enviada': 'sent',
          'aprovada': 'approved',
          'rejeitada': 'rejected'
        } as const;

        return {
          numeroProposta: propostaCompleta.numero || `PROP-${Date.now()}`,
          titulo: propostaCompleta.titulo || `Proposta para ${clienteReal?.nome || 'Cliente'}`,
          descricao: propostaCompleta.observacoes || 'Proposta comercial com produtos/serviços selecionados conforme necessidades específicas do cliente.',
          status: statusMap[propostaCompleta.status || 'rascunho'],
          dataEmissao: propostaCompleta.criadaEm ? new Date(propostaCompleta.criadaEm).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          dataValidade: propostaCompleta.dataValidade ? new Date(propostaCompleta.dataValidade).toLocaleDateString('pt-BR') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          empresa: {
            nome: 'FenixCRM Solutions',
            endereco: 'Rua das Inovações, 123 - Centro Empresarial',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
            telefone: '(11) 3333-4444',
            email: 'contato@fenixcrm.com.br',
            cnpj: '12.345.678/0001-90'
          },
          cliente: {
            nome: clienteReal?.nome || 'Cliente Não Informado',
            empresa: clienteReal?.tipoPessoa === 'juridica' ? clienteReal.nome : undefined,
            email: clienteReal?.email || 'cliente@email.com',
            telefone: clienteReal?.telefone || 'Não informado',
            documento: clienteReal?.documento || 'Não informado',
            tipoDocumento: clienteReal?.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF',
            endereco: clienteReal?.endereco ?
              `${clienteReal.endereco}${clienteReal.cidade ? `, ${clienteReal.cidade}` : ''}${clienteReal.estado ? `/${clienteReal.estado}` : ''}${clienteReal.cep ? ` - CEP: ${clienteReal.cep}` : ''}` :
              'Endereço não informado'
          },
          vendedor: {
            nome: vendedorReal?.nome || 'Consultor FenixCRM',
            email: vendedorReal?.email || 'vendedor@fenixcrm.com.br',
            telefone: '(11) 98765-4321',
            cargo: vendedorReal?.tipo === 'gerente' ? 'Gerente de Vendas' :
              vendedorReal?.tipo === 'admin' ? 'Diretor Comercial' :
                'Consultor de Vendas'
          },
          itens: itensReais,
          subtotal: subtotal,
          descontoGeral: descontoGlobal,
          percentualDesconto: subtotal > 0 ? (descontoGlobal / subtotal * 100) : 0,
          impostos: impostos,
          valorTotal: valorTotal,
          formaPagamento: propostaCompleta.formaPagamento === 'avista' ? 'À vista com desconto especial' :
            propostaCompleta.formaPagamento === 'parcelado' ? `Parcelado em até ${propostaCompleta.parcelas || 3}x sem juros` :
              propostaCompleta.formaPagamento === 'boleto' ? 'Boleto bancário' :
                propostaCompleta.formaPagamento === 'cartao' ? 'Cartão de crédito' :
                  'Conforme acordo comercial',
          prazoEntrega: `${propostaCompleta.validadeDias || 30} dias úteis`,
          garantia: '12 meses de garantia e suporte técnico especializado',
          validadeProposta: `${propostaCompleta.validadeDias || 30} dias corridos`,
          condicoesGerais: [
            `Proposta válida por ${propostaCompleta.validadeDias || 30} dias corridos a partir da data de emissão`,
            'Pagamento mediante apresentação de nota fiscal',
            'Entrega conforme cronograma acordado entre as partes',
            'Garantia e suporte técnico conforme especificações técnicas',
            'Valores já incluem todos os impostos aplicáveis',
            'Alterações no escopo podem gerar custos adicionais'
          ],
          observacoes: propostaCompleta.observacoes || `Esta proposta foi elaborada especialmente para ${clienteReal?.nome || 'o cliente'}, incluindo produtos/serviços selecionados conforme suas necessidades específicas. Estamos à disposição para esclarecimentos e ajustes necessários.`
        };

      } catch (error) {
        console.error('❌ Erro ao converter proposta real:', error);
        throw new Error('Não foi possível converter a proposta. Verifique os dados.');
      }
    } else {
      throw new Error('Proposta não encontrada ou dados incompletos.');
    }
  };

  const handleViewProposta = async (proposta: any) => {
    console.log('👁️ Visualizar proposta:', proposta.numero);

    try {
      // Converter dados da proposta para o formato compatível com o modal
      const propostaCompleta = {
        id: proposta.id || `prop_${Date.now()}`,
        numero: proposta.numero || 'N/A',
        titulo: proposta.titulo || 'Proposta comercial',
        subtotal: proposta.valor || 0,
        total: proposta.valor || 0,
        dataValidade: new Date(proposta.data_vencimento || Date.now()),
        status: proposta.status as 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada',
        criadaEm: proposta.data_criacao || new Date().toISOString(),

        // Dados básicos necessários
        vendedor: {
          id: `vendedor_${proposta.id}`,
          nome: proposta.vendedor || 'Vendedor',
          email: 'vendedor@conectcrm.com',
          tipo: 'vendedor',
          ativo: true
        },
        cliente: {
          id: `cliente_${proposta.id}`,
          nome: proposta.cliente || 'Cliente não informado',
          documento: '',
          email: proposta.cliente_contato || `${proposta.cliente?.toLowerCase().replace(/\s+/g, '.')}@email.com`,
          telefone: proposta.cliente_telefone || '',
          tipoPessoa: 'fisica'
        },
        produtos: [
          {
            produto: {
              id: `produto_${proposta.id}`,
              nome: proposta.titulo || 'Produto/Serviço',
              preco: proposta.valor || 0,
              categoria: 'Geral',
              unidade: 'un'
            },
            quantidade: 1,
            desconto: 0,
            subtotal: proposta.valor || 0
          }
        ],
        descontoGlobal: 0,
        impostos: 0,
        formaPagamento: 'avista',
        validadeDias: 30,
        observacoes: `Esta proposta foi elaborada especialmente para ${proposta.cliente}, considerando as necessidades específicas do projeto "${proposta.titulo}". Estamos à disposição para esclarecimentos e ajustes necessários.`,
        incluirImpostosPDF: false
      } as any; // Usar any temporariamente para resolver tipos

      setSelectedPropostaForView(propostaCompleta);
      setShowViewModal(true);

      console.log('✅ Modal de visualização aberto');
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
                    ${dados.itens.map((item, index) => {
      // Separar descrição dos detalhes técnicos
      const descricaoLinhas = (item.descricao || '').split('\n');
      const descricaoPrincipal = descricaoLinhas.find(linha => !linha.startsWith('•')) || '';
      const detalhes = descricaoLinhas.filter(linha => linha.startsWith('•'));

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
    }).join('')}
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
                ${dados.descontoGeral ? `
                <tr>
                    <td>Desconto Geral (${dados.percentualDesconto || 0}%):</td>
                    <td class="text-right currency">- R$ ${dados.descontoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ` : ''}
                ${dados.impostos ? `
                <tr>
                    <td>Impostos:</td>
                    <td class="text-right currency">R$ ${dados.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ` : ''}
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
    console.log('✏️ Editar proposta:', proposta.numero);
    // Navegar para página de edição ou abrir modal de edição
    alert(`Editando proposta: ${proposta.numero}\nEsta funcionalidade será implementada em breve!`);
  };

  const handleDeleteProposta = async (proposta: any) => {
    console.log('🗑️ Excluir proposta:', proposta.numero);

    if (window.confirm(`Tem certeza que deseja excluir a proposta ${proposta.numero}?`)) {
      try {
        setIsLoading(true);
        console.log('🗑️ Excluindo proposta do banco de dados...', proposta.id);

        // Usar o serviço real para excluir
        await propostasService.delete(proposta.id);

        console.log('✅ Proposta excluída com sucesso');
        showNotification('Proposta excluída com sucesso!', 'success');

        // Recarregar a lista para refletir a exclusão
        await carregarPropostas({ force: true });
      } catch (error) {
        console.error('❌ Erro ao excluir proposta:', error);
        showNotification('Erro ao excluir proposta. Tente novamente.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMoreOptions = (proposta: any) => {
    console.log('⚙️ Mais opções para proposta:', proposta.numero);

    // Criar um menu de contexto simples
    const opcoes = [
      'Duplicar Proposta',
      'Gerar PDF',
      'Enviar por Email',
      'Histórico',
      'Alterar Status'
    ];

    const opcaoEscolhida = window.prompt(
      `Selecione uma opção para ${proposta.numero}:\n\n` +
      opcoes.map((opcao, index) => `${index + 1}. ${opcao}`).join('\n') +
      '\n\nDigite o número da opção:'
    );

    if (opcaoEscolhida && opcaoEscolhida !== '') {
      const opcaoIndex = parseInt(opcaoEscolhida) - 1;
      if (opcaoIndex >= 0 && opcaoIndex < opcoes.length) {
        console.log(`📋 Opção selecionada: ${opcoes[opcaoIndex]}`);
        alert(`Funcionalidade "${opcoes[opcaoIndex]}" será implementada em breve!`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalValorPropostas = propostas.reduce((sum, p) => sum + p.valor, 0);
  const valorAprovadas = propostas.filter(p => p.status === 'aprovada').reduce((sum, p) => sum + p.valor, 0);
  const valorNegociacao = propostas.filter(p => p.status === 'negociacao').reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <ModalNovaProposta
        key={`modal-${showWizardModal ? 'open' : 'closed'}-${Date.now()}`}
        isOpen={showWizardModal}
        onClose={() => {
          console.log('🔘 Modal onClose chamado - setShowWizardModal(false)');
          setShowWizardModal(false);
        }}
        onPropostaCriada={(proposta) => {
          console.log('✅ Nova proposta criada via wizard:', proposta);
          // Recarregar a lista de propostas
          carregarPropostas({ force: true });
          setShowWizardModal(false);
        }}
      />

      {/* Header Padronizado */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Vendas"
          nucleusPath="/nuclei/vendas"
        />
      </div>

      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success'
          ? 'bg-green-100 border border-green-400 text-green-700'
          : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header da Página */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                <FileText className="h-8 w-8 mr-3 text-[#159A9C]" />
                Propostas
                {isLoading && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                )}
              </h1>
              <p className="mt-2 text-[#B4BEC9]">
                {isLoading ? 'Carregando propostas...' : `Acompanhe suas ${propostas.length} propostas comerciais`}
              </p>
            </div>

            {/* Botão de ação principal */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('🔔 Botão Nova Proposta clicado!');
                  console.log('📊 Estado atual showWizardModal:', showWizardModal);
                  setShowWizardModal(true);
                  console.log('✅ setShowWizardModal(true) executado');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Nova Proposta
              </button>
            </div>
          </div>
        </div>

        {/* Controles de Visualização e Ações */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Botão de atualizar */}
              <button
                onClick={() => {
                  console.log('🔄 [MANUAL] Atualizando propostas manualmente...');
                  carregarPropostas({ force: true }); // Forçar reload quando usuário clica no botão
                }}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Atualizar lista de propostas"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              {/* Botão exportar */}
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>

            {/* Modos de visualização */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                title="Visualização Dashboard"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                title="Visualização Lista"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'cards'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                title="Visualização Cards"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">Total de Propostas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{propostas.length}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">📊 Visão geral</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex-shrink-0">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">Aprovadas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                      {propostas.filter(p => p.status === 'aprovada').length}
                    </p>
                    <p className="text-xs text-green-500 mt-1 truncate">✅ Fechadas</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex-shrink-0">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">Em Negociação</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">
                      {propostas.filter(p => p.status === 'negociacao').length}
                    </p>
                    <p className="text-xs text-yellow-500 mt-1 truncate">🔄 Em andamento</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex-shrink-0">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">Valor Total</p>
                    <div className="mt-1">
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-purple-600 break-words leading-tight">
                        {formatCurrency(totalValorPropostas)}
                      </p>
                    </div>
                    <p className="text-xs text-purple-500 mt-1 truncate">💰 Receita</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex-shrink-0">
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros básicos */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm mb-6">
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
                      className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filtro Status */}
                <div className="w-full sm:w-auto sm:min-w-[160px] lg:w-48">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="enviada">Enviada</option>
                    <option value="negociacao">Em Negociação</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="rejeitada">Rejeitada</option>
                  </select>
                </div>

                {/* Filtro Vendedor */}
                <div className="w-full sm:w-auto sm:min-w-[160px] lg:w-48">
                  <select
                    value={selectedVendedor}
                    onChange={(e) => setSelectedVendedor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={(e) => setFiltrosAvancados({ ...filtrosAvancados, urgencia: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className={`px-3 sm:px-4 py-2 border rounded-lg flex items-center justify-center gap-2 text-sm transition-colors flex-shrink-0 ${showAdvancedFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  {Object.keys(filtrosAvancados).length > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                      {Object.keys(filtrosAvancados).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de Propostas com Seleção */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden propostas-page">
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
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Status: {selectedStatus}
                        </span>
                      )}
                      {filtrosAvancados.urgencia && filtrosAvancados.urgencia !== 'todas' && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          {filtrosAvancados.urgencia === 'vencidas' && '🔴 Vencidas'}
                          {filtrosAvancados.urgencia === 'urgentes' && '🟠 Urgentes'}
                          {filtrosAvancados.urgencia === 'próximas' && '🟡 Próximas'}
                          {filtrosAvancados.urgencia === 'normais' && '🟢 Normais'}
                        </span>
                      )}
                      {searchTerm && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Busca: "{searchTerm}"
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedPropostas.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedPropostas.length} selecionada(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table-propostas min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {/* Checkbox para selecionar todas */}
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={propostasSelecionadas.length === filteredPropostas.length && filteredPropostas.length > 0}
                            onChange={propostasSelecionadas.length === filteredPropostas.length ? handleDeselectAll : handleSelectAll}
                            className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (sortBy === 'data_criacao') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('data_criacao');
                              setSortOrder('desc');
                            }
                          }}>
                          <div className="flex items-center space-x-1">
                            <span>Proposta</span>
                            {sortBy === 'data_criacao' && (
                              sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (sortBy === 'cliente') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('cliente');
                              setSortOrder('asc');
                            }
                          }}>
                          <div className="flex items-center space-x-1">
                            <span>Cliente</span>
                            {sortBy === 'cliente' && (
                              sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (sortBy === 'status') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('status');
                              setSortOrder('asc');
                            }
                          }}>
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {sortBy === 'status' && (
                              sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (sortBy === 'valor') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('valor');
                              setSortOrder('desc');
                            }
                          }}>
                          <div className="flex items-center space-x-1">
                            <span>Valor</span>
                            {sortBy === 'valor' && (
                              sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
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
                      {filteredPropostas.map((proposta) => (
                        <tr
                          key={proposta.id}
                          className={`hover:bg-gray-50 ${propostasSelecionadas.includes(proposta.id?.toString() || proposta.numero) ? 'bg-blue-50' : ''} transition-colors duration-200`}
                          onMouseEnter={(e) => handleMouseEnterProposta(proposta, e)}
                          onMouseLeave={handleMouseLeaveProposta}
                        >
                          {/* Checkbox */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={propostasSelecionadas.includes(proposta.id?.toString() || proposta.numero)}
                              onChange={(e) => handleSelectProposta(proposta.id?.toString() || proposta.numero, e)}
                              className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" data-label="Proposta">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{safeRender(proposta.numero)}</div>
                              <div className="subinfo ellipsis-text">{safeRender(proposta.titulo)}</div>
                              <div className="subinfo flex items-center mt-1">
                                <Calendar className="w-3 h-3 mr-1" />
                                Criada em {formatDate(safeRender(proposta.data_criacao))}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" data-label="Cliente">
                            <div>
                              <div className="text-sm font-medium text-gray-900 ellipsis-text">{safeRender(proposta.cliente)}</div>
                              <div className="subinfo flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                <span className="ellipsis-sm">{safeRender(proposta.cliente_contato)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap col-hide-mobile" data-label="Status">
                            <div className="space-y-2">
                              {/* Novo Status com Fluxo Automatizado */}
                              <StatusFluxo
                                status={safeRender(proposta.status)}
                                compact={true}
                              />

                              {/* Indicadores adicionais */}
                              <div className="flex items-center space-x-2">
                                {proposta.urgencia === 'alta' && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Urgente
                                  </span>
                                )}
                                {proposta.status === 'enviada' && (
                                  <span className="text-blue-600 text-xs">📧 Enviada</span>
                                )}
                              </div>

                              {/* Probabilidade */}
                              <div className="subinfo">
                                <span>{safeRender(proposta.probabilidade)}% de chance</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" data-label="Valor">
                            <div className="valor-proposta text-sm font-medium">
                              {formatCurrency(Number(proposta.valor) || 0)}
                            </div>
                            <div className="subinfo capitalize">
                              {safeRender(proposta.categoria)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 col-hide-mobile" data-label="Vendedor">
                            {safeRender(proposta.vendedor)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap col-hide-mobile" data-label="Vencimento">
                            <div className="data-proposta text-sm text-gray-900">
                              {formatDate(safeRender(proposta.data_vencimento))}
                            </div>
                            <div className={`subinfo ${proposta.dias_restantes <= 0
                              ? 'text-red-600 font-semibold'
                              : proposta.dias_restantes <= 3
                                ? 'text-orange-600 font-semibold'
                                : proposta.dias_restantes <= 7
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                              }`}>
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" data-label="Ações">
                            <PropostaActions
                              proposta={proposta}
                              onViewProposta={handleViewProposta}
                              className="justify-end"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginação */}
              <div className="bg-white px-6 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredPropostas.length}</span> de{' '}
                    <span className="font-medium">{filteredPropostas.length}</span> resultados
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Anterior
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                      1
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
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
