import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AtendimentosSidebar } from './components/AtendimentosSidebar';
import { ChatArea } from './components/ChatArea';
import { ClientePanel } from './components/ClientePanel';
import { NovoAtendimentoModal, NovoAtendimentoData } from './modals/NovoAtendimentoModal';
import { TransferirAtendimentoModal, TransferenciaData } from './modals/TransferirAtendimentoModal';
import { EncerrarAtendimentoModal, EncerramentoData } from './modals/EncerrarAtendimentoModal';
import { EditarContatoModal, ContatoEditado } from './modals/EditarContatoModal';
import { VincularClienteModal } from './modals/VincularClienteModal';
import ConvertTicketModal from '../../../components/ConvertTicketModal';
import { SelecionarFilaModal } from '../../../components/chat/SelecionarFilaModal';
import { Mensagem, NotaCliente, Demanda, StatusAtendimentoType, Ticket, CanalTipo } from './types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useAtendimentos } from './hooks/useAtendimentos';
import { useMensagens } from './hooks/useMensagens';
import { useHistoricoCliente } from './hooks/useHistoricoCliente';
import { useContextoCliente } from './hooks/useContextoCliente';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import toast from 'react-hot-toast'; // ✅ Notificações simplificadas com toast
import { useNotas } from '../../../hooks/useNotas';
import { useDemandas } from '../../../hooks/useDemandas';
import { useAuth } from '../../../hooks/useAuth';
import { atendimentoService } from './services/atendimentoService';
import { useAtendimentoStore } from '../../../stores/atendimentoStore';
import demandaService from '../../../services/demandaService';
import { useNotificacoesDesktop } from '../../../hooks/useNotificacoesDesktop';
import { PopupNotifications, PopupNotificationItem } from './components/PopupNotifications';
import { resolveAvatarUrl } from '../../../utils/avatar';
import { resolverNomeExibicao } from './utils';

const MAX_NOTIFICATION_PREVIEW = 140;

const gerarPreviewTexto = (valor?: string | null): string => {
  if (!valor) return '';
  const texto = valor.toString().trim();
  if (!texto) return '';
  return texto.length > MAX_NOTIFICATION_PREVIEW
    ? `${texto.slice(0, MAX_NOTIFICATION_PREVIEW - 3)}...`
    : texto;
};

const gerarResumoNovaMensagem = (mensagem: Mensagem): string => {
  if (!mensagem) {
    return 'Nova mensagem recebida';
  }

  const texto = gerarPreviewTexto(mensagem.conteudo);
  if (texto) {
    return texto;
  }

  if (mensagem.audio) {
    return 'Mensagem de áudio recebida';
  }

  if (mensagem.anexos && mensagem.anexos.length > 0) {
    const quantidade = mensagem.anexos.length;
    const plural = quantidade > 1 ? 's' : '';
    return `${quantidade} arquivo${plural} recebido${plural}`;
  }

  return 'Nova mensagem recebida';
};

const gerarResumoNovoTicket = (ticket: any): string => {
  const texto = gerarPreviewTexto(ticket?.ultimaMensagem || ticket?.ultima_mensagem);
  if (texto) {
    return texto;
  }

  return 'Um cliente está aguardando atendimento.';
};

// Flag simples para logs de debug locais
const DEBUG = process.env.NODE_ENV === 'development';

const normalizarCanalNotificacao = (valor: unknown): CanalTipo => {
  if (typeof valor === 'string') {
    const canal = valor.toLowerCase();
    if (['whatsapp', 'telegram', 'email', 'chat', 'telefone'].includes(canal)) {
      return canal as CanalTipo;
    }
  }

  if (valor && typeof valor === 'object') {
    return normalizarCanalNotificacao(
      (valor as any).tipo ||
      (valor as any).nome ||
      (valor as any).canal ||
      (valor as any).canalTipo ||
      (valor as any).canal_tipo,
    );
  }

  return 'chat';
};

/**
 * ChatOmnichannel - Componente principal do chat omnichannel
 *
 * Layout de 3 colunas:
 * 1. Sidebar Esquerda: Lista de atendimentos com tabs (Aberto/Resolvido/Retornos)
 * 2. Área Central: Chat com mensagens, header e input
 * 3. Painel Direito: Informações do cliente e demandas
 *
 * TEMA: Integrado com ThemeContext do CRM
 * RESPONSIVE: Adapta larguras quando sidebar global está expandida/colapsada
 *
 * INTEGRAÇÃO BACKEND:
 * - ✅ Tickets: 100% integrado (listar, criar, transferir, encerrar)
 * - ✅ Mensagens: 100% integrado (listar, enviar texto/áudio/anexos)
 * - ✅ Histórico: 100% integrado (busca histórico real do cliente)
 * - ✅ Contexto: 100% integrado (dados do cliente, faturas, contratos)
 * - ✅ WebSocket: 100% integrado (mensagens e eventos em tempo real)
 * - ⚠️ Demandas: Ainda em mock (módulo CRM)
 * - ⚠️ Notas: Ainda em mock (módulo CRM)
 */
export const ChatOmnichannel: React.FC = () => {
  const { currentPalette } = useTheme();
  const { sidebarCollapsed } = useSidebar();
  const { user } = useAuth();

  // ✅ Responsividade básica: evita crash quando usado em SSR/tests
  const isMobile = typeof window !== 'undefined'
    ? window.matchMedia('(max-width: 1024px)').matches
    : false;
  const mobileView: 'chat' = 'chat';

  // 🆕 Hook de notificações desktop
  const {
    permissao: permissaoNotificacoes,
    suportado: notificacoesSuportadas,
    solicitarPermissao,
    mostrarNotificacao: exibirNotificacaoDesktop,
  } = useNotificacoesDesktop();

  // Popup notifications (overlay): guarda ids para deduplicar
  const [popupNotifications, setPopupNotifications] = useState<PopupNotificationItem[]>([]);
  const messageNotificationIds = useRef<Set<string>>(new Set());
  const ticketNotificationIds = useRef<Set<string>>(new Set());

  const addPopupNotification = useCallback(
    (notification: Omit<PopupNotificationItem, 'id' | 'createdAt'> & { id?: string }) => {
      const id =
        notification.id ||
        `popup-${notification.type}-${notification.ticketId || notification.messageId || Date.now()}`;

      setPopupNotifications((prev) => {
        if (prev.some((item) => item.id === id)) return prev;
        const item: PopupNotificationItem = {
          ...notification,
          id,
          createdAt: new Date(),
        };
        // mantém ordem mais recente primeiro e limita crescimento
        return [item, ...prev].slice(0, 8);
      });
    },
    [],
  );

  const dismissPopupNotification = useCallback((id: string) => {
    setPopupNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const hasMessageNotification = useCallback((messageId?: string | null) => {
    if (!messageId) return false;
    return messageNotificationIds.current.has(messageId);
  }, []);

  const registerMessageNotification = useCallback((messageId?: string | null) => {
    if (!messageId) return;
    messageNotificationIds.current.add(messageId);
  }, []);

  const hasTicketNotification = useCallback((ticketId?: string | null) => {
    if (!ticketId) return false;
    return ticketNotificationIds.current.has(ticketId);
  }, []);

  const registerTicketNotification = useCallback((ticketId?: string | null) => {
    if (!ticketId) return;
    ticketNotificationIds.current.add(ticketId);
  }, []);

  // 🆕 ZUSTAND STORE - Estado centralizado
  const {
    // Estado tickets
    tickets: ticketsStore,
    ticketSelecionado: ticketSelecionadoStore,
    ticketsLoading: ticketsLoadingStore,
    ticketsError,
    // Ações tickets
    setTickets: setTicketsStore,
    selecionarTicket: selecionarTicketStore,
    adicionarTicket: adicionarTicketStore,
    atualizarTicket: atualizarTicketStore,
    removerTicket: removerTicketStore,
    setTicketsLoading,
    setTicketsError,
    // Estado mensagens
    mensagens: mensagensStore,
    mensagensLoading: mensagensLoadingStore,
    mensagensError,
    // Ações mensagens
    setMensagens: setMensagensStore,
    adicionarMensagem: adicionarMensagemStore,
    setMensagensLoading,
    setMensagensError,
    // Cliente
    clienteSelecionado,
    setClienteSelecionado,
    historicoCliente,
    setHistoricoCliente,
  } = useAtendimentoStore();

  // ✅ HOOKS DO BACKEND REAL - TICKETS
  const {
    tickets,
    ticketSelecionado,
    selecionarTicket,
    criarTicket,
    transferirTicket,
    encerrarTicket,
    recarregar: recarregarTickets,
    sincronizarTicketRealtime: syncTicketRealtime,
    atualizarTicketLocal, // 🆕 NOVA: Atualiza ticket sem reload
    loading: loadingTickets,
    filtros,
    setFiltros,
    totaisPorStatus,
  } = useAtendimentos({
    autoRefresh: false, // WebSocket já cuida dos updates como nas principais plataformas
    filtroInicial: { status: 'em_atendimento' }, // ✅ Status padrão: atendimentos ativos
    atendenteAtualId: user?.id ?? null,
  });

  // ✅ Função de seleção simplificada (sem lógica mobile específica - Tailwind cuida disso)
  const handleSelecionarTicket = useCallback(
    (ticketId: string) => {
      selecionarTicket(ticketId);
    },
    [selecionarTicket],
  );

  // ✅ Status padrão: 'em_atendimento' (agente vê primeiro os atendimentos ativos)
  const [tabAtiva, setTabAtiva] = useState<StatusAtendimentoType>(filtros.status || 'em_atendimento');

  // 🔄 Estado para progress bar de upload
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (filtros.status && filtros.status !== tabAtiva) {
      setTabAtiva(filtros.status);
    }
  }, [filtros.status, tabAtiva]);

  const handleChangeTab = useCallback(
    (status: StatusAtendimentoType) => {
      setTabAtiva((prev) => (prev === status ? prev : status));
      setFiltros((prev) => {
        if (prev.status === status && (prev.page ?? 1) === 1) {
          return prev;
        }

        return {
          ...prev,
          status,
          page: 1,
        };
      });
    },
    [setFiltros],
  );

  // Hooks do backend real - MENSAGENS
  const {
    mensagens,
    enviarMensagem,
    enviarMensagemComAnexos,
    enviarAudio,
    marcarComoLidas,
    recarregar: recarregarMensagens,
    adicionarMensagemRecebida, // 🔥 NOVA: para WebSocket
    loading: loadingMensagens,
    enviando: enviandoMensagem,
  } = useMensagens({
    ticketId: ticketSelecionado?.id || null,
    onUploadProgress: setUploadProgress, // 🔄 NOVO: Callback de progresso
  });

  // 🔧 MEMOIZAÇÃO: Estabiliza clienteId/telefone para evitar loops nos hooks abaixo
  const clienteIdEstavel = useMemo(
    () => ticketSelecionado?.contato?.clienteVinculado?.id || null,
    [ticketSelecionado?.contato?.clienteVinculado?.id],
  );

  const telefoneEstavel = useMemo(
    () => ticketSelecionado?.contato?.telefone || null,
    [ticketSelecionado?.contato?.telefone],
  );

  // 🆕 Hooks do backend real - HISTÓRICO DO CLIENTE
  const { historico, loading: loadingHistorico } = useHistoricoCliente({
    clienteId: clienteIdEstavel,
    autoLoad: true,
  });

  // 🆕 Hooks do backend real - CONTEXTO DO CLIENTE
  const { contexto, loading: loadingContexto } = useContextoCliente({
    clienteId: clienteIdEstavel,
    telefone: telefoneEstavel,
    autoLoad: true,
  });

  // 🔧 REFS ESTÁVEIS PARA WEBSOCKET - Apenas para popups/notificações
  type WebsocketCallbacks = {
    mostrarPopupMensagem: (mensagem: Mensagem) => void;
    mostrarPopupNovoTicket: (ticket: Ticket | any) => void;
  };

  const websocketCallbacksRef = useRef<WebsocketCallbacks>({
    mostrarPopupMensagem: () => { },
    mostrarPopupNovoTicket: () => { },
  });

  // Atualizar refs quando funções mudarem
  useEffect(() => {
    const chatVisivel = Boolean(ticketSelecionado) && (!isMobile || mobileView === 'chat');

    websocketCallbacksRef.current = {
      mostrarPopupMensagem: (mensagem: Mensagem) => {
        if (!mensagem) {
          return;
        }

        const mensagemId = mensagem.id;

        if (hasMessageNotification(mensagemId)) {
          return;
        }

        if (!mensagem.ticketId) {
          registerMessageNotification(mensagemId);
          return;
        }

        if (mensagem.remetente?.tipo !== 'cliente') {
          registerMessageNotification(mensagemId);
          return;
        }

        const ticketAtualId = ticketSelecionado?.id || null;
        const isTicketAtual = mensagem.ticketId === ticketAtualId;
        const chatAbertoParaTicket = isTicketAtual && chatVisivel;

        if (chatAbertoParaTicket) {
          registerMessageNotification(mensagemId);
          return;
        }

        const ticketAlvo = tickets.find((item) => item.id === mensagem.ticketId);
        // 🎯 Usar nome do cliente vinculado se disponível
        const titulo = ticketAlvo?.contato
          ? resolverNomeExibicao(ticketAlvo.contato)
          : mensagem.remetente?.nome || 'Cliente';
        const avatarUrl =
          resolveAvatarUrl(ticketAlvo?.contato?.foto || mensagem.remetente?.foto || null) ||
          undefined;
        const canal = ticketAlvo?.canal || normalizarCanalNotificacao((mensagem as any)?.canal);

        addPopupNotification({
          type: 'nova-mensagem',
          title: titulo,
          message: gerarResumoNovaMensagem(mensagem),
          ticketId: mensagem.ticketId,
          messageId: mensagemId,
          avatarUrl,
          canal,
          onClick: () => {
            if (tabAtiva !== 'fila') {
              handleChangeTab('fila');
            }
            handleSelecionarTicket(mensagem.ticketId);
          },
        });

        registerMessageNotification(mensagemId);
      },
      mostrarPopupNovoTicket: (ticket: Ticket | any) => {
        const ticketId = ticket?.id;
        if (!ticketId || hasTicketNotification(ticketId)) {
          return;
        }

        const contato = ticket?.contato || {};
        // 🎯 Usar nome do cliente vinculado se disponível
        const titulo =
          contato.clienteVinculado?.nome ||
          contato.nome ||
          ticket?.contatoNome ||
          ticket?.contato_nome ||
          'Novo atendimento';
        const avatarUrl =
          resolveAvatarUrl(contato.foto || ticket?.contatoFoto || ticket?.contato_foto || null) ||
          undefined;
        const canal = normalizarCanalNotificacao(
          ticket?.canal ?? ticket?.canalTipo ?? ticket?.canal_tipo,
        );

        addPopupNotification({
          type: 'novo-ticket',
          title: titulo,
          message: gerarResumoNovoTicket(ticket),
          ticketId,
          avatarUrl,
          canal,
          onClick: () => {
            if (tabAtiva !== 'fila') {
              handleChangeTab('fila');
            }
            handleSelecionarTicket(ticketId);
          },
        });

        registerTicketNotification(ticketId);
      },
    };
  }, [
    ticketSelecionado,
    tickets,
    isMobile,
    mobileView,
    addPopupNotification,
    hasMessageNotification,
    registerMessageNotification,
    hasTicketNotification,
    registerTicketNotification,
    handleSelecionarTicket,
    handleChangeTab,
    tabAtiva,
  ]);

  // 🆕 Solicitar permissão de notificações desktop ao montar
  useEffect(() => {
    if (notificacoesSuportadas && permissaoNotificacoes === 'default') {
      // Aguardar 3 segundos para não ser intrusivo
      const timer = setTimeout(() => {
        solicitarPermissao();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacoesSuportadas, permissaoNotificacoes, solicitarPermissao]);

  // 🆕 Estado de digitação
  const [usuarioDigitandoNome, setUsuarioDigitandoNome] = useState<string | null>(null);
  const digitandoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🆕 Hooks do backend real - WEBSOCKET TEMPO REAL
  // ✅ STORE ZUSTAND: WebSocket já atualiza store diretamente em useWebSocket.ts
  // Callbacks aqui são APENAS para notificações/UI (popups, toasts)
  const {
    connected: wsConnected,
    entrarNoTicket,
    sairDoTicket,
    emitirDigitando,
  } = useWebSocket({
    enabled: true,
    autoConnect: true,
    events: {
      // 🔔 APENAS notificação popup (store já foi atualizada pelo hook)
      onNovoTicket: (ticket: any) => {
        if (DEBUG) console.log('📨 Novo ticket - mostrando popup');
        websocketCallbacksRef.current.mostrarPopupNovoTicket(ticket);

        // 🆕 Notificação desktop se janela não está focada
        if (document.hidden && permissaoNotificacoes === 'granted') {
          exibirNotificacaoDesktop({
            titulo: 'Novo Atendimento',
            corpo: `${ticket.contatoNome || 'Cliente'} via ${ticket.canal || 'Chat'}`,
            tag: `ticket-${ticket.id}`,
            requireInteraction: true,
            onClick: () => {
              window.focus();
              selecionarTicketStore(ticket.id);
            },
          });
        }
      },

      // 🔔 Nova mensagem recebida via WebSocket
      onNovaMensagem: (mensagem: any) => {
        // 🔥 ADICIONAR DIRETAMENTE no hook (padrão Slack/WhatsApp/Discord)
        if (mensagem.ticketId && adicionarMensagemRecebida) {
          adicionarMensagemRecebida(mensagem);
        }

        // Mostrar popup de notificação
        websocketCallbacksRef.current.mostrarPopupMensagem(mensagem);

        // 🆕 Notificação desktop se janela não está focada e mensagem é do cliente
        if (
          document.hidden &&
          permissaoNotificacoes === 'granted' &&
          mensagem.remetente?.tipo !== 'atendente'
        ) {
          const conteudoPreview = mensagem.conteudo?.substring(0, 100) || 'Nova mensagem recebida';
          exibirNotificacaoDesktop({
            titulo: `Nova mensagem de ${mensagem.remetente?.nome || 'Cliente'}`,
            corpo: conteudoPreview,
            tag: `msg-${mensagem.id}`,
            onClick: () => {
              window.focus();
              if (mensagem.ticketId) {
                selecionarTicketStore(mensagem.ticketId);
              }
            },
          });
        }
      },

      // ℹ️ Ticket atualizado - store já sincronizada, sem callback necessário
      onTicketAtualizado: (ticket: any) => {
        if (DEBUG) console.log('🔄 Ticket atualizado via store');
      },

      // ℹ️ Transferência - store já sincronizada, sem callback necessário
      onTicketTransferido: (data: any) => {
        if (DEBUG) console.log('👤 Ticket transferido via store');
      },

      // ℹ️ Encerramento - store já sincronizada, sem callback necessário
      onTicketEncerrado: (ticket: any) => {
        if (DEBUG) console.log('🏁 Ticket encerrado via store');
      },

      // 🆕 NOVO: Callback para usuário digitando
      onUsuarioDigitando: (data: { ticketId: string; usuarioId: string; usuarioNome: string }) => {
        // Só mostra indicador se for o ticket atual E usuário diferente do atual
        if (data.ticketId === ticketSelecionado?.id && data.usuarioId !== user?.id) {
          setUsuarioDigitandoNome(data.usuarioNome);

          // Limpar timeout anterior
          if (digitandoTimeoutRef.current) {
            clearTimeout(digitandoTimeoutRef.current);
          }

          // Remover indicador após 3 segundos de inatividade
          digitandoTimeoutRef.current = setTimeout(() => {
            setUsuarioDigitandoNome(null);
          }, 3000);
        }
      },
    },
  });

  // 🔥 NOVO: Entrar/sair da sala WebSocket quando ticket muda
  useEffect(() => {
    if (!ticketSelecionado?.id || !wsConnected) return;

    entrarNoTicket(ticketSelecionado.id);

    // Sair da sala ao desmontar ou trocar de ticket
    return () => {
      sairDoTicket(ticketSelecionado.id);
    };
  }, [ticketSelecionado?.id, wsConnected, entrarNoTicket, sairDoTicket]);

  // 🆕 Limpar timeout de digitação ao desmontar
  useEffect(() => {
    return () => {
      if (digitandoTimeoutRef.current) {
        clearTimeout(digitandoTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Hook de notas (dados reais do backend)
  const {
    notas,
    loading: loadingNotas,
    error: errorNotas,
    carregarNotas,
    criarNota,
    atualizarNota,
    deletarNota,
  } = useNotas();

  // ✅ Hook de demandas (dados reais do backend)
  const {
    demandas,
    loading: loadingDemandas,
    error: errorDemandas,
    carregarDemandas,
    criarDemanda,
    atualizarDemanda,
    deletarDemanda,
    alterarStatus,
  } = useDemandas();

  // 🔄 Carregar notas quando ticket ou contexto mudar
  useEffect(() => {
    if (!ticketSelecionado) return;

    const clienteId = contexto?.cliente?.id;
    const ticketId = ticketSelecionado.id;
    const telefone = ticketSelecionado.contato?.telefone;

    // Carregar notas (prioridade: clienteId > ticketId > telefone)
    carregarNotas(clienteId, ticketId, telefone);
  }, [ticketSelecionado?.id, contexto?.cliente?.id, carregarNotas]);

  // 🔄 Carregar demandas quando ticket ou contexto mudar
  useEffect(() => {
    if (!ticketSelecionado) return;

    const clienteId = contexto?.cliente?.id;
    const ticketId = ticketSelecionado.id;
    const telefone = ticketSelecionado.contato?.telefone;

    // Carregar demandas (prioridade: clienteId > ticketId > telefone)
    if (clienteId) {
      carregarDemandas({ clienteId });
    } else if (ticketId) {
      carregarDemandas({ ticketId });
    } else if (telefone) {
      carregarDemandas({ telefone });
    }
  }, [ticketSelecionado?.id, contexto?.cliente?.id, carregarDemandas]);

  // Estados dos modais
  const [modalNovoAtendimento, setModalNovoAtendimento] = useState(false);
  const [modalTransferir, setModalTransferir] = useState(false);
  const [modalEncerrar, setModalEncerrar] = useState(false);
  const [modalEditarContato, setModalEditarContato] = useState(false);
  const [modalVincularCliente, setModalVincularCliente] = useState(false);
  const [modalAbrirDemanda, setModalAbrirDemanda] = useState(false);
  const [demandaVinculada, setDemandaVinculada] = useState<any>(null);
  const [modalSelecionarFila, setModalSelecionarFila] = useState(false);

  // Variáveis derivadas
  const ticketAtual = ticketSelecionado;
  const mensagensDoTicket = mensagens;

  // Handlers
  const handleNovoAtendimento = useCallback(() => {
    setModalNovoAtendimento(true);
  }, []);

  const handleConfirmarNovoAtendimento = useCallback(
    async (dados: NovoAtendimentoData) => {
      try {
        const novoTicket = await criarTicket(dados);

        // Seleciona o novo ticket
        selecionarTicket(novoTicket.id);
        setModalNovoAtendimento(false);
        toast.success('Atendimento criado com sucesso!');
      } catch (error) {
        console.error('Erro ao criar ticket:', error);
        toast.error('Erro ao criar atendimento. Tente novamente.');
      }
    },
    [criarTicket, selecionarTicket],
  );

  const handleEnviarMensagem = useCallback(
    async (conteudo: string, anexos: File[] = []) => {
      if (!ticketSelecionado) return;

      const texto = conteudo.trim();
      const possuiAnexos = anexos.length > 0;

      if (!texto && !possuiAnexos) {
        return;
      }

      try {
        if (possuiAnexos) {
          await enviarMensagemComAnexos(texto, anexos);
        } else {
          await enviarMensagem(texto);
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast.error('Erro ao enviar mensagem. Tente novamente.');
      }
    },
    [ticketSelecionado, enviarMensagem, enviarMensagemComAnexos],
  );

  const handleTransferir = useCallback(() => {
    if (!ticketSelecionado) return;
    if (ticketSelecionado.status === 'encerrado') {
      toast('Este atendimento já está resolvido.');
      return;
    }

    setModalTransferir(true);
  }, [ticketSelecionado]);

  const handleEnviarAudio = useCallback(
    async (audio: Blob, duracao: number) => {
      if (!ticketSelecionado) return;

      try {
        await enviarAudio(audio, duracao);
      } catch (error) {
        console.error('Erro ao enviar áudio:', error);
        toast.error('Erro ao enviar áudio. Tente novamente.');
      }
    },
    [ticketSelecionado, enviarAudio],
  );

  const handleConfirmarTransferencia = useCallback(
    async (dados: TransferenciaData) => {
      if (!ticketSelecionado) return;

      try {
        await transferirTicket(ticketSelecionado.id, dados);
        setModalTransferir(false);
        toast.success('Atendimento transferido com sucesso!');
      } catch (error) {
        console.error('Erro ao transferir ticket:', error);
        toast.error('Erro ao transferir atendimento. Tente novamente.');
      }
    },
    [ticketSelecionado, transferirTicket],
  );

  const handleEncerrar = useCallback(() => {
    if (!ticketSelecionado) return;
    if (ticketSelecionado.status === 'encerrado') {
      toast('Este atendimento já está resolvido.');
      return;
    }

    setModalEncerrar(true);
  }, [ticketSelecionado]);

  const handleConfirmarEncerramento = useCallback(
    async (dados: EncerramentoData) => {
      if (!ticketSelecionado) return;

      try {
        await encerrarTicket(ticketSelecionado.id, {
          motivo: dados.motivo as any,
          observacoes: dados.observacoes,
          criarFollowUp: dados.criarFollowUp,
          dataFollowUp: dados.dataFollowUp,
          solicitarAvaliacao: dados.solicitarAvaliacao,
        });
        setModalEncerrar(false);
        toast.success('Atendimento encerrado com sucesso!');
      } catch (error) {
        console.error('Erro ao encerrar ticket:', error);
        toast.error('Erro ao encerrar atendimento. Tente novamente.');
      }
    },
    [ticketSelecionado, encerrarTicket],
  );

  // 🆕 NOVO: Mudar status do ticket diretamente
  const handleMudarStatus = useCallback(
    async (novoStatus: StatusAtendimentoType) => {
      if (!ticketSelecionado) return;

      try {
        // Se for resolver, abre modal de encerramento
        if (novoStatus === 'encerrado') {
          handleEncerrar();
          return;
        }

        // 🎯 CRÍTICO: Ao assumir atendimento, atribuir atendenteId do usuário atual
        if (novoStatus === 'em_atendimento' && !ticketSelecionado.atendente && user?.id) {
          // Atualizar status E atribuir atendente simultaneamente
          await Promise.all([
            atendimentoService.atualizarStatusTicket(ticketSelecionado.id, novoStatus),
            atendimentoService.atualizarTicket(ticketSelecionado.id, { atendenteId: user.id }),
          ]);

          // Buscar ticket atualizado do backend para garantir dados corretos
          const ticketAtualizado = await atendimentoService.buscarTicket(ticketSelecionado.id);
          atualizarTicketLocal(ticketSelecionado.id, ticketAtualizado);

          // 🔄 Mudar automaticamente para aba "Em Atendimento" após assumir
          handleChangeTab('em_atendimento');

          toast.success('Atendimento assumido com sucesso!');
          return;
        }

        // Para outros status, atualiza direto via API
        await atendimentoService.atualizarStatusTicket(ticketSelecionado.id, novoStatus);

        // Atualizar ticket local
        atualizarTicketLocal(ticketSelecionado.id, { status: novoStatus });

        toast.success(`Status alterado para "${novoStatus}" com sucesso!`);
      } catch (error) {
        console.error('Erro ao mudar status:', error);
        toast.error('Erro ao alterar status. Tente novamente.');
      }
    },
    [ticketSelecionado, handleEncerrar, atualizarTicketLocal, user],
  );

  // ⌨️ ATALHOS DE TECLADO para agilizar atendimento
  const algumModalAberto =
    modalNovoAtendimento ||
    modalTransferir ||
    modalEncerrar ||
    modalEditarContato ||
    modalVincularCliente ||
    modalAbrirDemanda;

  useKeyboardShortcuts({
    ticketSelecionado: ticketSelecionado
      ? {
        id: ticketSelecionado.id,
        status: ticketSelecionado.status,
      }
      : null,
    onMudarStatus: handleMudarStatus,
    modalAberto: algumModalAberto,
  });

  const handleLigar = useCallback(() => {
    if (!ticketSelecionado) return;
    console.log('Ligar para:', ticketSelecionado.contato.telefone);
    // TODO: Integrar com sistema de telefonia
  }, [ticketSelecionado]);

  const handleEditarContato = useCallback(() => {
    setModalEditarContato(true);
  }, []);

  const handleConfirmarEdicaoContato = useCallback(
    async (dados: ContatoEditado) => {
      if (!ticketSelecionado?.contato?.id) return;

      try {
        console.log('📝 Atualizando contato:', dados);

        const contatoAtualizado = await atendimentoService.atualizarContato(
          ticketSelecionado.contato.id,
          dados,
        );

        // Atualizar ticket local com novo contato
        atualizarTicketLocal(ticketSelecionado.id, {
          contato: contatoAtualizado,
        });

        toast.success('Contato atualizado com sucesso!');
        setModalEditarContato(false);
      } catch (error) {
        console.error('❌ Erro ao atualizar contato:', error);
        toast.error('Erro ao atualizar contato');
      }
    },
    [ticketSelecionado, atualizarTicketLocal],
  );

  const handleVincularCliente = useCallback(() => {
    setModalVincularCliente(true);
  }, []);

  const handleConfirmarVinculoCliente = useCallback(
    async (clienteId: string) => {
      if (!ticketSelecionado?.contato?.id) return;

      try {
        console.log('🔗 Vinculando cliente:', clienteId);

        const contatoAtualizado = await atendimentoService.vincularCliente(
          ticketSelecionado.contato.id,
          clienteId,
        );

        // Atualizar ticket local com novo contato vinculado
        atualizarTicketLocal(ticketSelecionado.id, {
          contato: contatoAtualizado,
        });

        toast.success('Cliente vinculado com sucesso!');
        setModalVincularCliente(false);
      } catch (error) {
        console.error('❌ Erro ao vincular cliente:', error);
        toast.error('Erro ao vincular cliente');
      }
    },
    [ticketSelecionado, atualizarTicketLocal],
  );

  const handleAbrirDemanda = useCallback(() => {
    console.log('🔍 Abrindo modal de conversão de ticket em demanda');
    setModalAbrirDemanda(true);
  }, []);

  const handleConversaoSucesso = useCallback(
    async (demandaId: string) => {
      toast.success('Ticket convertido em demanda com sucesso!');
      // Atualizar demanda vinculada
      if (ticketSelecionado?.id) {
        await verificarDemandaVinculada(ticketSelecionado.id);
      }
    },
    [ticketSelecionado],
  );

  // Verificar se ticket já tem demanda vinculada
  const verificarDemandaVinculada = useCallback(async (ticketId: string) => {
    try {
      const demanda = await demandaService.buscarPorTicket(ticketId);
      setDemandaVinculada(demanda);
    } catch (err) {
      setDemandaVinculada(null);
    }
  }, []);

  // Verificar demanda quando ticket mudar
  useEffect(() => {
    if (ticketSelecionado?.id) {
      verificarDemandaVinculada(ticketSelecionado.id);
    } else {
      setDemandaVinculada(null);
    }
  }, [ticketSelecionado?.id, verificarDemandaVinculada]);

  const handleAdicionarNota = useCallback(
    async (conteudo: string, importante: boolean) => {
      if (!ticketSelecionado) return;

      try {
        const clienteId = contexto?.cliente?.id;
        const ticketId = ticketSelecionado.id;
        const telefone = ticketSelecionado.contato?.telefone;

        // ✅ Criar nota no backend
        await criarNota({
          clienteId,
          ticketId,
          contatoTelefone: telefone,
          conteudo,
          importante,
        });

        toast.success('Nota adicionada com sucesso!', { duration: 2000 });
      } catch (error) {
        console.error('❌ Erro ao adicionar nota:', error);
        toast.error('Erro ao adicionar nota. Tente novamente.');
      }
    },
    [ticketSelecionado, contexto, criarNota],
  );

  const handleExcluirNota = useCallback(
    async (notaId: string) => {
      try {
        // ✅ Deletar nota no backend
        await deletarNota(notaId);
        toast.success('Nota excluída com sucesso!', { duration: 2000 });
      } catch (error) {
        console.error('❌ Erro ao excluir nota:', error);
        toast.error('Erro ao excluir nota. Tente novamente.');
      }
    },
    [deletarNota],
  );

  // 🆕 Handlers para Sistema de Filas
  const handleSelecionarFila = useCallback(() => {
    if (!ticketSelecionado) return;
    setModalSelecionarFila(true);
  }, [ticketSelecionado]);

  const handleFilaSelecionada = useCallback(
    async (fila: any, atendenteId: string) => {
      if (!ticketSelecionado) return;

      try {
        console.log('🎯 Fila selecionada:', { filaId: fila.id, atendenteId });

        // Atualizar ticket com fila e atendente
        await atendimentoService.atualizarTicket(ticketSelecionado.id, {
          filaId: fila.id,
          atendenteId,
        });

        // Recarregar dados do ticket para garantir sincronização completa
        await recarregarTickets();

        setModalSelecionarFila(false);
        toast.success('Fila atribuída com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao atribuir fila:', error);
        toast.error('Erro ao atribuir fila. Tente novamente.');
      }
    },
    [ticketSelecionado, recarregarTickets],
  );

  const handleRemoverFila = useCallback(async () => {
    if (!ticketSelecionado) return;

    try {
      console.log('🗑️ Removendo fila do ticket');

      // Remover fila do ticket
      await atendimentoService.atualizarTicket(ticketSelecionado.id, {
        filaId: null,
      });

      // Atualizar ticket local
      atualizarTicketLocal(ticketSelecionado.id, {
        filaId: null,
      });

      await recarregarTickets();

      toast.success('Fila removida com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao remover fila:', error);
      toast.error('Erro ao remover fila. Tente novamente.');
    }
  }, [ticketSelecionado, atualizarTicketLocal, recarregarTickets]);

  // ✅ LAYOUT RESPONSIVO SIMPLIFICADO (Grid Tailwind Nativo)
  return (
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Grid Responsivo: Mobile (1 col) | Tablet (2 cols) | Desktop (3 cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr_320px] gap-0 overflow-hidden">

        {/* COLUNA 1: Sidebar - Hidden no mobile */}
        <div className="hidden lg:flex flex-col h-full overflow-hidden border-r bg-white">
          <AtendimentosSidebar
            tickets={tickets}
            ticketSelecionado={ticketSelecionado?.id || ''}
            onSelecionarTicket={selecionarTicket}
            onNovoAtendimento={handleNovoAtendimento}
            theme={currentPalette}
            loading={loadingTickets}
            tabAtiva={tabAtiva}
            onChangeTab={handleChangeTab}
            contagemPorStatus={totaisPorStatus}
          />
        </div>

        {/* COLUNA 2: Chat Area - Sempre visível */}
        <div className="flex flex-col h-full overflow-hidden bg-gray-50">
          {!ticketSelecionado ? (
            <div className="flex items-center justify-center h-full bg-white">
              <div className="text-center px-4 max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum atendimento selecionado
                </h2>
                <p className="text-sm text-gray-600">
                  Selecione um atendimento na lista à esquerda ou crie um novo
                </p>
              </div>
            </div>
          ) : (
            <ChatArea
              ticket={ticketSelecionado}
              mensagens={mensagensDoTicket}
              onEnviarMensagem={handleEnviarMensagem}
              onEnviarAudio={handleEnviarAudio}
              onTransferir={handleTransferir}
              onEncerrar={handleEncerrar}
              onLigar={handleLigar}
              onMudarStatus={handleMudarStatus}
              onSelecionarFila={handleSelecionarFila}
              onRemoverFila={handleRemoverFila}
              onEmitirDigitando={() => emitirDigitando(ticketSelecionado.id)}
              usuarioDigitandoNome={usuarioDigitandoNome}
              uploadProgress={uploadProgress}
              theme={currentPalette}
              loading={loadingMensagens}
              enviandoMensagem={enviandoMensagem}
            />
          )}
        </div>

        {/* COLUNA 3: Cliente Panel - Hidden no tablet/mobile */}
        {ticketSelecionado && (
          <div className="hidden xl:flex flex-col overflow-y-auto border-l bg-white">
            <ClientePanel
              contato={ticketSelecionado.contato}
              historico={historico || []}
              demandas={demandas || []}
              notas={notas || []}
              onEditarContato={handleEditarContato}
              onVincularCliente={handleVincularCliente}
              onConverterTicket={handleAbrirDemanda}
              onAdicionarNota={handleAdicionarNota}
              onExcluirNota={handleExcluirNota}
              theme={currentPalette}
            />
          </div>
        )}
      </div>

      {/* Modais */}
      <NovoAtendimentoModal
        isOpen={modalNovoAtendimento}
        onClose={() => setModalNovoAtendimento(false)}
        onConfirm={handleConfirmarNovoAtendimento}
      />

      <TransferirAtendimentoModal
        isOpen={modalTransferir}
        onClose={() => setModalTransferir(false)}
        onConfirm={handleConfirmarTransferencia}
        ticketAtual={ticketSelecionado}
      />

      <EncerrarAtendimentoModal
        isOpen={modalEncerrar}
        onClose={() => setModalEncerrar(false)}
        onConfirm={handleConfirmarEncerramento}
        ticketAtual={ticketSelecionado}
      />

      <EditarContatoModal
        isOpen={modalEditarContato}
        onClose={() => setModalEditarContato(false)}
        onConfirm={handleConfirmarEdicaoContato}
        contato={ticketSelecionado?.contato}
      />

      <VincularClienteModal
        isOpen={modalVincularCliente}
        onClose={() => setModalVincularCliente(false)}
        onConfirm={handleConfirmarVinculoCliente}
        contatoAtual={ticketSelecionado?.contato}
      />

      {modalAbrirDemanda && ticketSelecionado && (
        <ConvertTicketModal
          ticketId={ticketSelecionado.id}
          ticketNumero={ticketSelecionado.numero?.toString() || 'S/N'}
          ticketAssunto={ticketSelecionado.ultimaMensagem || 'Sem assunto'}
          onClose={() => setModalAbrirDemanda(false)}
          onSuccess={handleConversaoSucesso}
        />
      )}

      <SelecionarFilaModal
        isOpen={modalSelecionarFila}
        onClose={() => setModalSelecionarFila(false)}
        ticketId={ticketSelecionado?.id || ''}
        onFilaSelecionada={handleFilaSelecionada}
      />

      {/* Popup de notificações rápidas */}
      <PopupNotifications
        notifications={popupNotifications}
        onDismiss={dismissPopupNotification}
      />
    </div>
  );
};

export default ChatOmnichannel;
