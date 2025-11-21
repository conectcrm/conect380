import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { User, X } from 'lucide-react';
import { AtendimentosSidebar } from './components/AtendimentosSidebar';
import { ChatArea } from './components/ChatArea';
import { ClientePanel } from './components/ClientePanel';
import { PopupNotifications, PopupNotificationItem } from './components/PopupNotifications';
import { NovoAtendimentoModal, NovoAtendimentoData } from './modals/NovoAtendimentoModal';
import { TransferirAtendimentoModal, TransferenciaData } from './modals/TransferirAtendimentoModal';
import { EncerrarAtendimentoModal, EncerramentoData } from './modals/EncerrarAtendimentoModal';
import { EditarContatoModal, ContatoEditado } from './modals/EditarContatoModal';
import { VincularClienteModal } from './modals/VincularClienteModal';
import { AbrirDemandaModal, NovaDemanda } from './modals/AbrirDemandaModal';
import { SelecionarFilaModal } from '../../../components/chat/SelecionarFilaModal';
import { FilaIndicator } from '../../../components/chat/FilaIndicator';
import { Mensagem, NotaCliente, Demanda, StatusAtendimentoType, Ticket, CanalTipo } from './types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useAtendimentos } from './hooks/useAtendimentos';
import { useMensagens } from './hooks/useMensagens';
import { useHistoricoCliente } from './hooks/useHistoricoCliente';
import { useContextoCliente } from './hooks/useContextoCliente';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'; // 🆕 Atalhos de teclado
import { useToast } from './contexts/ToastContext';
import { useNotificacoesDesktop } from '../../../hooks/useNotificacoesDesktop'; // 🆕 Notificações desktop
import { useNotas } from '../../../hooks/useNotas'; // ✅ Hook real de notas
import { useDemandas } from '../../../hooks/useDemandas'; // ✅ Hook real de demandas
import { useAuth } from '../../../hooks/useAuth';
import { atendimentoService } from './services/atendimentoService'; // ✅ Service para atualizar contato e vincular cliente
import { resolveAvatarUrl } from '../../../utils/avatar';
import { resolverNomeExibicao } from './utils';
import { useAtendimentoStore } from '../../../stores/atendimentoStore'; // 🆕 STORE ZUSTAND

const DEBUG = false; // ✅ Desabilitado após resolução do problema de tempo real

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
      (valor as any).canal_tipo
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
  const { showToast } = useToast();
  const { user } = useAuth();

  // 🆕 Hook de notificações desktop
  const {
    permissao: permissaoNotificacoes,
    suportado: notificacoesSuportadas,
    solicitarPermissao,
    mostrarNotificacao: exibirNotificacaoDesktop,
  } = useNotificacoesDesktop();

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

  const [popupNotifications, setPopupNotifications] = useState<PopupNotificationItem[]>([]);
  const popupTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const notifiedMessagesSetRef = useRef<Set<string>>(new Set());
  const notifiedMessagesQueueRef = useRef<string[]>([]);
  const notifiedTicketsSetRef = useRef<Set<string>>(new Set());
  const notifiedTicketsQueueRef = useRef<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const browserPermissionPendingRef = useRef(false);
  const browserNotificationsRef = useRef<Record<string, Notification>>({});

  const removePopupNotification = useCallback((id: string) => {
    setPopupNotifications(prev => prev.filter(notification => notification.id !== id));

    const timeoutId = popupTimeoutsRef.current[id];
    if (timeoutId) {
      clearTimeout(timeoutId);
      delete popupTimeoutsRef.current[id];
    }

    const browserNotification = browserNotificationsRef.current[id];
    if (browserNotification) {
      browserNotification.close();
      delete browserNotificationsRef.current[id];
    }
  }, []);

  const playPopupSound = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    try {
      let audioCtx = audioContextRef.current;
      if (!audioCtx) {
        audioCtx = new AudioContextCtor();
        audioContextRef.current = audioCtx;
      }

      // ✅ CORREÇÃO: Só tentar reproduzir se AudioContext estiver em estado válido
      // Evita erro "AudioContext was not allowed to start" antes de interação do usuário
      if (audioCtx.state === 'suspended') {
        // Tentar resumir, mas não criar som se falhar (usuário ainda não interagiu)
        audioCtx.resume().catch(() => {
          if (DEBUG) console.log('AudioContext ainda suspenso - aguardando interação do usuário');
        });
        return; // Não criar som enquanto suspended
      }

      // Se chegou aqui, contexto está 'running' e podemos criar som
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const now = audioCtx.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, now);
      oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.65);
    } catch (error) {
      if (DEBUG) console.warn('Não foi possível reproduzir som da notificação:', error);
    }
  }, []);

  const showBrowserNotification = useCallback((notification: PopupNotificationItem) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!('Notification' in window)) {
      return;
    }

    if (!document.hidden) {
      return;
    }

    const trigger = () => {
      try {
        const brandName = 'ConectCRM';
        const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const defaultIcon = `${appOrigin}/logo192.png`;
        const browserNotification = new Notification(
          `${brandName} • ${notification.title}`,
          {
            body: notification.message,
            icon: notification.avatarUrl || defaultIcon,
            badge: `${appOrigin}/favicon.ico`,
            tag: notification.ticketId ? `ticket-${notification.ticketId}` : notification.id,
            data: {
              ticketId: notification.ticketId,
              type: notification.type,
            },
          }
        );

        browserNotification.onclick = () => {
          window.focus();
          notification.onClick?.();
          browserNotification.close();
        };

        browserNotification.onclose = () => {
          delete browserNotificationsRef.current[notification.id];
        };

        browserNotificationsRef.current[notification.id] = browserNotification;
      } catch (error) {
        if (DEBUG) {
          console.warn('Falha ao exibir notificação do navegador:', error);
        }
      }
    };

    const permission = Notification.permission;
    if (permission === 'granted') {
      trigger();
      return;
    }

    if (permission === 'default' && !browserPermissionPendingRef.current) {
      browserPermissionPendingRef.current = true;
      Notification.requestPermission().then(result => {
        browserPermissionPendingRef.current = false;
        if (result === 'granted') {
          trigger();
        }
      }).catch(() => {
        browserPermissionPendingRef.current = false;
      });
    }
  }, []);

  const addPopupNotification = useCallback((
    notification: Omit<PopupNotificationItem, 'id' | 'createdAt' | 'onClick'> & {
      duration?: number;
      onClick?: (id: string) => void;
    }
  ) => {
    const id = `popup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date();

    const finalNotification: PopupNotificationItem = {
      ...notification,
      id,
      createdAt,
      onClick: () => {
        if (notification.onClick) {
          notification.onClick(id);
        }
        removePopupNotification(id);
      }
    };

    setPopupNotifications(prev => {
      const sanitized = prev.filter(existing => {
        const sameTicket = notification.ticketId && existing.ticketId === notification.ticketId;
        const sameType = existing.type === notification.type;

        if (sameTicket && sameType) {
          const timeoutId = popupTimeoutsRef.current[existing.id];
          if (timeoutId) {
            clearTimeout(timeoutId);
            delete popupTimeoutsRef.current[existing.id];
          }
          return false;
        }

        return true;
      });

      const next = [...sanitized, finalNotification];

      if (next.length > 4) {
        const excess = next.length - 4;
        const toRemove = next.slice(0, excess);
        toRemove.forEach(item => {
          const timeoutId = popupTimeoutsRef.current[item.id];
          if (timeoutId) {
            clearTimeout(timeoutId);
            delete popupTimeoutsRef.current[item.id];
          }
        });

        return next.slice(excess);
      }

      return next;
    });

    const timeoutId = setTimeout(() => {
      removePopupNotification(id);
    }, notification.duration ?? 8000);

    popupTimeoutsRef.current[id] = timeoutId;
    playPopupSound();
    showBrowserNotification(finalNotification);

    return id;
  }, [removePopupNotification, playPopupSound, showBrowserNotification]);

  const hasMessageNotification = useCallback((messageId?: string) => {
    if (!messageId) {
      return false;
    }

    return notifiedMessagesSetRef.current.has(messageId);
  }, []);

  const registerMessageNotification = useCallback((messageId?: string) => {
    if (!messageId) {
      return;
    }

    if (notifiedMessagesSetRef.current.has(messageId)) {
      return;
    }

    notifiedMessagesSetRef.current.add(messageId);
    notifiedMessagesQueueRef.current.push(messageId);

    if (notifiedMessagesQueueRef.current.length > 50) {
      const removed = notifiedMessagesQueueRef.current.shift();
      if (removed) {
        notifiedMessagesSetRef.current.delete(removed);
      }
    }
  }, []);

  const hasTicketNotification = useCallback((ticketId?: string) => {
    if (!ticketId) {
      return false;
    }

    return notifiedTicketsSetRef.current.has(ticketId);
  }, []);

  const registerTicketNotification = useCallback((ticketId?: string) => {
    if (!ticketId) {
      return;
    }

    if (notifiedTicketsSetRef.current.has(ticketId)) {
      return;
    }

    notifiedTicketsSetRef.current.add(ticketId);
    notifiedTicketsQueueRef.current.push(ticketId);

    if (notifiedTicketsQueueRef.current.length > 50) {
      const removed = notifiedTicketsQueueRef.current.shift();
      if (removed) {
        notifiedTicketsSetRef.current.delete(removed);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.values(popupTimeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });

      popupTimeoutsRef.current = {};

      Object.values(browserNotificationsRef.current).forEach(notification => {
        notification.close();
      });
      browserNotificationsRef.current = {};

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  // Estados para controle responsivo
  const [clientePanelAberto, setClientePanelAberto] = useState(false);
  const [mobileView, setMobileView] = useState<'tickets' | 'chat' | 'cliente'>('tickets');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);

      // Auto-fechar cliente panel em breakpoints menores
      if (window.innerWidth < 1280) {
        setClientePanelAberto(false);
      }

      // Reset para view de tickets no mobile quando redimensiona
      if (window.innerWidth < 768 && mobileView !== 'tickets') {
        setMobileView('tickets');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileView]);

  // Breakpoints responsivos
  const isDesktop = windowWidth >= 1280;
  const isTablet = windowWidth >= 768 && windowWidth < 1280;
  const isMobile = windowWidth < 768;

  // Hooks do backend real - TICKETS
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
    totaisPorStatus
  } = useAtendimentos({
    autoRefresh: false, // WebSocket já cuida dos updates como nas principais plataformas
    filtroInicial: { status: 'aberto' },
    atendenteAtualId: user?.id ?? null,
  });

  const [tabAtiva, setTabAtiva] = useState<StatusAtendimentoType>(filtros.status || 'aberto');

  useEffect(() => {
    if (filtros.status && filtros.status !== tabAtiva) {
      setTabAtiva(filtros.status);
    }
  }, [filtros.status, tabAtiva]);

  const handleChangeTab = useCallback((status: StatusAtendimentoType) => {
    setTabAtiva(prev => (prev === status ? prev : status));
    setFiltros(prev => {
      if (prev.status === status && (prev.page ?? 1) === 1) {
        return prev;
      }

      return {
        ...prev,
        status,
        page: 1,
      };
    });
  }, [setFiltros]);

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
    enviando: enviandoMensagem
  } = useMensagens({
    ticketId: ticketSelecionado?.id || null
  });

  // 🔧 MEMOIZAÇÃO: Estabiliza clienteId/telefone para evitar loops nos hooks abaixo
  const clienteIdEstavel = useMemo(
    () => ticketSelecionado?.contato?.clienteVinculado?.id || null,
    [ticketSelecionado?.contato?.clienteVinculado?.id]
  );

  const telefoneEstavel = useMemo(
    () => ticketSelecionado?.contato?.telefone || null,
    [ticketSelecionado?.contato?.telefone]
  );

  // 🆕 Hooks do backend real - HISTÓRICO DO CLIENTE
  const {
    historico,
    loading: loadingHistorico
  } = useHistoricoCliente({
    clienteId: clienteIdEstavel,
    autoLoad: true
  });

  // 🆕 Hooks do backend real - CONTEXTO DO CLIENTE
  const {
    contexto,
    loading: loadingContexto
  } = useContextoCliente({
    clienteId: clienteIdEstavel,
    telefone: telefoneEstavel,
    autoLoad: true
  });

  const handleSelecionarTicketResponsivo = useCallback((ticketId: string) => {
    selecionarTicket(ticketId);
    if (isMobile) {
      setMobileView('chat');
    }
  }, [selecionarTicket, isMobile]);

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

        const ticketAlvo = tickets.find(item => item.id === mensagem.ticketId);
        // 🎯 Usar nome do cliente vinculado se disponível
        const titulo = ticketAlvo?.contato
          ? resolverNomeExibicao(ticketAlvo.contato)
          : (mensagem.remetente?.nome || 'Cliente');
        const avatarUrl = resolveAvatarUrl(ticketAlvo?.contato?.foto || mensagem.remetente?.foto || null) || undefined;
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
            if (tabAtiva !== 'aberto') {
              handleChangeTab('aberto');
            }
            handleSelecionarTicketResponsivo(mensagem.ticketId);
          }
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
        const titulo = contato.clienteVinculado?.nome || contato.nome || ticket?.contatoNome || ticket?.contato_nome || 'Novo atendimento';
        const avatarUrl = resolveAvatarUrl(contato.foto || ticket?.contatoFoto || ticket?.contato_foto || null) || undefined;
        const canal = normalizarCanalNotificacao(ticket?.canal ?? ticket?.canalTipo ?? ticket?.canal_tipo);

        addPopupNotification({
          type: 'novo-ticket',
          title: titulo,
          message: gerarResumoNovoTicket(ticket),
          ticketId,
          avatarUrl,
          canal,
          onClick: () => {
            if (tabAtiva !== 'aberto') {
              handleChangeTab('aberto');
            }
            handleSelecionarTicketResponsivo(ticketId);
          }
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
    handleSelecionarTicketResponsivo,
    handleChangeTab,
    tabAtiva
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

  // 🆕 Hooks do backend real - WEBSOCKET TEMPO REAL
  // ✅ STORE ZUSTAND: WebSocket já atualiza store diretamente em useWebSocket.ts
  // Callbacks aqui são APENAS para notificações/UI (popups, toasts)
  const { connected: wsConnected, entrarNoTicket, sairDoTicket } = useWebSocket({
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

      // 🔔 APENAS notificação popup (store já foi atualizada pelo hook)
      onNovaMensagem: (mensagem: any) => {
        if (DEBUG) console.log('💬 Nova mensagem - mostrando popup');
        websocketCallbacksRef.current.mostrarPopupMensagem(mensagem);

        // 🆕 Notificação desktop se janela não está focada e mensagem é do cliente
        if (document.hidden && permissaoNotificacoes === 'granted' && mensagem.remetente !== 'atendente') {
          const conteudoPreview = mensagem.conteudo?.substring(0, 100) || 'Nova mensagem recebida';
          exibirNotificacaoDesktop({
            titulo: `Nova mensagem de ${mensagem.remetenteNome || 'Cliente'}`,
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
    }
  });

  // 🔥 NOVO: Entrar/sair da sala WebSocket quando ticket muda
  useEffect(() => {
    if (!ticketSelecionado?.id || !wsConnected) return;

    if (DEBUG) console.log('🚪 Entrando na sala do ticket:', ticketSelecionado.id);
    entrarNoTicket(ticketSelecionado.id);

    // Sair da sala ao desmontar ou trocar de ticket
    return () => {
      if (DEBUG) console.log('🚪 Saindo da sala do ticket:', ticketSelecionado.id);
      sairDoTicket(ticketSelecionado.id);
    };
  }, [ticketSelecionado?.id, wsConnected, entrarNoTicket, sairDoTicket]);

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
  const [modalSelecionarFila, setModalSelecionarFila] = useState(false);

  // Variáveis derivadas
  const ticketAtual = ticketSelecionado;
  const mensagensDoTicket = mensagens;

  // Handlers
  const handleSelecionarTicket = useCallback((ticketId: string) => {
    selecionarTicket(ticketId);
  }, [selecionarTicket]);

  const handleNovoAtendimento = useCallback(() => {
    setModalNovoAtendimento(true);
  }, []);

  const handleConfirmarNovoAtendimento = useCallback(async (dados: NovoAtendimentoData) => {
    try {
      const novoTicket = await criarTicket(dados);

      // Seleciona o novo ticket
      selecionarTicket(novoTicket.id);
      setModalNovoAtendimento(false);
      showToast('success', 'Atendimento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      showToast('error', 'Erro ao criar atendimento. Tente novamente.');
    }
  }, [criarTicket, selecionarTicket, showToast]);

  const handleEnviarMensagem = useCallback(async (conteudo: string, anexos: File[] = []) => {
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
      showToast('error', 'Erro ao enviar mensagem. Tente novamente.');
    }
  }, [ticketSelecionado, enviarMensagem, enviarMensagemComAnexos, showToast]);

  const handleTransferir = useCallback(() => {
    if (!ticketSelecionado) return;
    if (ticketSelecionado.status === 'resolvido') {
      showToast('info', 'Este atendimento já está resolvido.');
      return;
    }

    setModalTransferir(true);
  }, [ticketSelecionado, showToast]);

  const handleEnviarAudio = useCallback(async (audio: Blob, duracao: number) => {
    if (!ticketSelecionado) return;

    try {
      await enviarAudio(audio, duracao);
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      showToast('error', 'Erro ao enviar áudio. Tente novamente.');
    }
  }, [ticketSelecionado, enviarAudio, showToast]);

  const handleConfirmarTransferencia = useCallback(async (dados: TransferenciaData) => {
    if (!ticketSelecionado) return;

    try {
      await transferirTicket(ticketSelecionado.id, dados);
      setModalTransferir(false);
      showToast('success', 'Atendimento transferido com sucesso!');
    } catch (error) {
      console.error('Erro ao transferir ticket:', error);
      showToast('error', 'Erro ao transferir atendimento. Tente novamente.');
    }
  }, [ticketSelecionado, transferirTicket, showToast]);

  const handleEncerrar = useCallback(() => {
    if (!ticketSelecionado) return;
    if (ticketSelecionado.status === 'resolvido') {
      showToast('info', 'Este atendimento já está resolvido.');
      return;
    }

    setModalEncerrar(true);
  }, [ticketSelecionado, showToast]);

  const handleConfirmarEncerramento = useCallback(async (dados: EncerramentoData) => {
    if (!ticketSelecionado) return;

    try {
      await encerrarTicket(ticketSelecionado.id, {
        motivo: dados.motivo as any,
        observacoes: dados.observacoes,
        criarFollowUp: dados.criarFollowUp,
        dataFollowUp: dados.dataFollowUp,
        solicitarAvaliacao: dados.solicitarAvaliacao
      });
      setModalEncerrar(false);
      showToast('success', 'Atendimento encerrado com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar ticket:', error);
      showToast('error', 'Erro ao encerrar atendimento. Tente novamente.');
    }
  }, [ticketSelecionado, encerrarTicket, showToast]);

  // 🆕 NOVO: Mudar status do ticket diretamente
  const handleMudarStatus = useCallback(async (novoStatus: StatusAtendimentoType) => {
    if (!ticketSelecionado) return;

    try {
      // Se for resolver, abre modal de encerramento
      if (novoStatus === 'resolvido') {
        handleEncerrar();
        return;
      }

      // Se for fechar, também abre modal
      if (novoStatus === 'fechado') {
        handleEncerrar();
        return;
      }

      // Para outros status, atualiza direto via API
      await atendimentoService.atualizarStatusTicket(ticketSelecionado.id, novoStatus);

      // Atualizar ticket local
      atualizarTicketLocal(ticketSelecionado.id, { status: novoStatus });

      showToast('success', `Status alterado para "${novoStatus}" com sucesso!`);
    } catch (error) {
      console.error('Erro ao mudar status:', error);
      showToast('error', 'Erro ao alterar status. Tente novamente.');
    }
  }, [ticketSelecionado, handleEncerrar, atualizarTicketLocal, showToast]);

  // ⌨️ ATALHOS DE TECLADO para agilizar atendimento
  const algumModalAberto = modalNovoAtendimento || modalTransferir || modalEncerrar ||
    modalEditarContato || modalVincularCliente || modalAbrirDemanda;

  useKeyboardShortcuts({
    ticketSelecionado: ticketSelecionado ? {
      id: ticketSelecionado.id,
      status: ticketSelecionado.status,
    } : null,
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

  const handleConfirmarEdicaoContato = useCallback(async (dados: ContatoEditado) => {
    if (!ticketSelecionado?.contato?.id) return;

    try {
      console.log('📝 Atualizando contato:', dados);

      const contatoAtualizado = await atendimentoService.atualizarContato(
        ticketSelecionado.contato.id,
        dados
      );

      // Atualizar ticket local com novo contato
      atualizarTicketLocal(ticketSelecionado.id, {
        contato: contatoAtualizado
      });

      showToast('success', 'Contato atualizado com sucesso!');
      setModalEditarContato(false);
    } catch (error) {
      console.error('❌ Erro ao atualizar contato:', error);
      showToast('error', 'Erro ao atualizar contato');
    }
  }, [ticketSelecionado, atualizarTicketLocal, showToast]);

  const handleVincularCliente = useCallback(() => {
    setModalVincularCliente(true);
  }, []);

  const handleConfirmarVinculoCliente = useCallback(async (clienteId: string) => {
    if (!ticketSelecionado?.contato?.id) return;

    try {
      console.log('🔗 Vinculando cliente:', clienteId);

      const contatoAtualizado = await atendimentoService.vincularCliente(
        ticketSelecionado.contato.id,
        clienteId
      );

      // Atualizar ticket local com novo contato vinculado
      atualizarTicketLocal(ticketSelecionado.id, {
        contato: contatoAtualizado
      });

      showToast('success', 'Cliente vinculado com sucesso!');
      setModalVincularCliente(false);
    } catch (error) {
      console.error('❌ Erro ao vincular cliente:', error);
      showToast('error', 'Erro ao vincular cliente');
    }
  }, [ticketSelecionado, atualizarTicketLocal, showToast]);

  const handleAbrirDemanda = useCallback(() => {
    setModalAbrirDemanda(true);
  }, []);

  const handleConfirmarNovaDemanda = useCallback(async (dados: NovaDemanda) => {
    if (!ticketSelecionado) return;

    try {
      const clienteId = contexto?.cliente?.id;
      const ticketId = ticketSelecionado.id;
      const telefone = ticketSelecionado.contato?.telefone;

      // Mapear tipo da modal para tipo do backend
      const tipoMapping: Record<string, 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros'> = {
        'bug': 'tecnica',
        'feature': 'comercial',
        'suporte': 'suporte',
        'melhoria': 'solicitacao'
      };

      // ✅ Criar demanda no backend
      const novaDemanda = await criarDemanda({
        clienteId,
        ticketId,
        contatoTelefone: telefone,
        titulo: dados.titulo,
        descricao: dados.descricao,
        tipo: tipoMapping[dados.tipo] || 'outros',
        prioridade: dados.prioridade,
        status: 'aberta',
        dataVencimento: dados.prazo?.toISOString(),
        responsavelId: dados.responsavelId,
      });

      if (novaDemanda) {
        showToast('success', 'Demanda criada com sucesso!', 2000);
      }
    } catch (error) {
      console.error('❌ Erro ao criar demanda:', error);
      showToast('error', 'Erro ao criar demanda. Tente novamente.');
    }
  }, [ticketSelecionado, contexto, criarDemanda, showToast]);

  const handleAdicionarNota = useCallback(async (conteudo: string, importante: boolean) => {
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

      showToast('success', 'Nota adicionada com sucesso!', 2000);
    } catch (error) {
      console.error('❌ Erro ao adicionar nota:', error);
      showToast('error', 'Erro ao adicionar nota. Tente novamente.');
    }
  }, [ticketSelecionado, contexto, criarNota, showToast]);

  const handleExcluirNota = useCallback(async (notaId: string) => {
    try {
      // ✅ Deletar nota no backend
      await deletarNota(notaId);
      showToast('success', 'Nota excluída com sucesso!', 2000);
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
      showToast('error', 'Erro ao excluir nota. Tente novamente.');
    }
  }, [deletarNota, showToast]);

  // 🆕 Handlers para Sistema de Filas
  const handleSelecionarFila = useCallback(() => {
    if (!ticketSelecionado) return;
    setModalSelecionarFila(true);
  }, [ticketSelecionado]);

  const handleFilaSelecionada = useCallback(async (fila: any, atendenteId: string) => {
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
      showToast('success', 'Fila atribuída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atribuir fila:', error);
      showToast('error', 'Erro ao atribuir fila. Tente novamente.');
    }
  }, [ticketSelecionado, recarregarTickets, showToast]);

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

      showToast('success', 'Fila removida com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao remover fila:', error);
      showToast('error', 'Erro ao remover fila. Tente novamente.');
    }
  }, [ticketSelecionado, atualizarTicketLocal, recarregarTickets, showToast]);

  // Handlers específicos para controle responsivo
  const handleToggleClientePanel = useCallback(() => {
    if (isTablet) {
      setClientePanelAberto(prev => !prev);
    }
  }, [isTablet]);

  const handleMobileViewChange = useCallback((view: 'tickets' | 'chat' | 'cliente') => {
    setMobileView(view);
  }, []);

  // Renderização de layouts por breakpoint
  const renderDesktopLayout = () => (
    <div className="chat-layout-responsive">
      {/* Coluna 1: Lista de Atendimentos */}
      <div className="sidebar-responsive">
        <AtendimentosSidebar
          tickets={tickets}
          ticketSelecionado={ticketSelecionado?.id || ''}
          onSelecionarTicket={handleSelecionarTicketResponsivo}
          onNovoAtendimento={handleNovoAtendimento}
          theme={currentPalette}
          loading={loadingTickets}
          tabAtiva={tabAtiva}
          onChangeTab={handleChangeTab}
          contagemPorStatus={totaisPorStatus}
        />
      </div>

      {/* Coluna 2: Área Central do Chat */}
      <div className="chat-area-responsive">
        {!ticketSelecionado ? (
          // Estado vazio - Nenhum ticket selecionado
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum atendimento selecionado
              </h2>
              <p className="text-gray-600 text-sm">
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
            theme={currentPalette}
            loading={loadingMensagens}
            enviandoMensagem={enviandoMensagem}
          />
        )}
      </div>

      {/* Coluna 3: Painel do Cliente */}
      {ticketSelecionado && (
        <div className="cliente-panel-responsive">
          <ClientePanel
            contato={ticketSelecionado.contato}
            historico={historico || []}
            demandas={demandas || []}
            notas={notas || []}
            onEditarContato={handleEditarContato}
            onVincularCliente={handleVincularCliente}
            onAbrirDemanda={handleAbrirDemanda}
            onAdicionarNota={handleAdicionarNota}
            onExcluirNota={handleExcluirNota}
            theme={currentPalette}
          />
        </div>
      )}
    </div>
  );

  const renderTabletLayout = () => (
    <div className="chat-layout-responsive">
      {/* Coluna 1: Lista de Atendimentos */}
      <div className="sidebar-responsive">
        <AtendimentosSidebar
          tickets={tickets}
          ticketSelecionado={ticketSelecionado?.id || ''}
          onSelecionarTicket={handleSelecionarTicketResponsivo}
          onNovoAtendimento={handleNovoAtendimento}
          theme={currentPalette}
          loading={loadingTickets}
          tabAtiva={tabAtiva}
          onChangeTab={handleChangeTab}
          contagemPorStatus={totaisPorStatus}
        />
      </div>

      {/* Coluna 2: Área Central do Chat com botão para abrir cliente */}
      <div className="chat-area-responsive">
        {!ticketSelecionado ? (
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum atendimento selecionado
              </h2>
              <p className="text-gray-600 text-sm">
                Selecione um atendimento na lista à esquerda
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Header com botão do cliente */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Chat - {ticketSelecionado.contato.nome}
              </h3>
              <button
                onClick={handleToggleClientePanel}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <User className="w-4 h-4" />
                Informações do Cliente
              </button>
            </div>

            <div className="flex-1">
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
                theme={currentPalette}
                loading={loadingMensagens}
                enviandoMensagem={enviandoMensagem}
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer do Cliente Panel */}
      {ticketSelecionado && (
        <>
          <div
            className={`cliente-panel-overlay ${clientePanelAberto ? 'open' : ''}`}
            onClick={() => setClientePanelAberto(false)}
          />
          <div className={`cliente-panel-drawer ${clientePanelAberto ? 'open' : ''}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Informações do Cliente</h3>
              <button
                onClick={() => setClientePanelAberto(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ClientePanel
                contato={ticketSelecionado.contato}
                historico={historico || []}
                demandas={demandas || []}
                notas={notas || []}
                onEditarContato={handleEditarContato}
                onVincularCliente={handleVincularCliente}
                onAbrirDemanda={handleAbrirDemanda}
                onAdicionarNota={handleAdicionarNota}
                onExcluirNota={handleExcluirNota}
                theme={currentPalette}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderMobileLayout = () => (
    <div className="h-full flex flex-col">
      {/* Navegação em Tabs */}
      <div className="mobile-chat-tabs">
        <button
          className={`mobile-chat-tab ${mobileView === 'tickets' ? 'active' : ''}`}
          onClick={() => handleMobileViewChange('tickets')}
          style={{
            borderBottomColor: mobileView === 'tickets' ? currentPalette.colors.primary : 'transparent',
            color: mobileView === 'tickets' ? currentPalette.colors.primary : '#6b7280'
          }}
        >
          Atendimentos
        </button>

        {ticketSelecionado && (
          <button
            className={`mobile-chat-tab ${mobileView === 'chat' ? 'active' : ''}`}
            onClick={() => handleMobileViewChange('chat')}
            style={{
              borderBottomColor: mobileView === 'chat' ? currentPalette.colors.primary : 'transparent',
              color: mobileView === 'chat' ? currentPalette.colors.primary : '#6b7280'
            }}
          >
            Chat
          </button>
        )}

        {ticketSelecionado && (
          <button
            className={`mobile-chat-tab ${mobileView === 'cliente' ? 'active' : ''}`}
            onClick={() => handleMobileViewChange('cliente')}
            style={{
              borderBottomColor: mobileView === 'cliente' ? currentPalette.colors.primary : 'transparent',
              color: mobileView === 'cliente' ? currentPalette.colors.primary : '#6b7280'
            }}
          >
            Cliente
          </button>
        )}
      </div>

      {/* Conteúdo das Tabs */}
      <div className="flex-1 overflow-hidden">
        {/* Tab Atendimentos */}
        <div className={`mobile-content-panels ${mobileView === 'tickets' ? 'active' : ''}`}>
          <AtendimentosSidebar
            tickets={tickets}
            ticketSelecionado={ticketSelecionado?.id || ''}
            onSelecionarTicket={handleSelecionarTicketResponsivo}
            onNovoAtendimento={handleNovoAtendimento}
            theme={currentPalette}
            loading={loadingTickets}
            tabAtiva={tabAtiva}
            onChangeTab={handleChangeTab}
            contagemPorStatus={totaisPorStatus}
          />
        </div>

        {/* Tab Chat */}
        {ticketSelecionado && (
          <div className={`mobile-content-panels ${mobileView === 'chat' ? 'active' : ''}`}>
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
              theme={currentPalette}
              loading={loadingMensagens}
              enviandoMensagem={enviandoMensagem}
            />
          </div>
        )}

        {/* Tab Cliente */}
        {ticketSelecionado && (
          <div className={`mobile-content-panels ${mobileView === 'cliente' ? 'active' : ''}`}>
            <ClientePanel
              contato={ticketSelecionado.contato}
              historico={historico || []}
              demandas={demandas || []}
              notas={notas || []}
              onEditarContato={handleEditarContato}
              onVincularCliente={handleVincularCliente}
              onAbrirDemanda={handleAbrirDemanda}
              onAdicionarNota={handleAdicionarNota}
              onExcluirNota={handleExcluirNota}
              theme={currentPalette}
            />
          </div>
        )}
      </div>
    </div>
  );

  // ✅ RENDERIZAÇÃO RESPONSIVA COMPLETA
  return (
    <div className="layout-transition h-full bg-gray-100 overflow-hidden">
      {isDesktop && renderDesktopLayout()}
      {isTablet && renderTabletLayout()}
      {isMobile && renderMobileLayout()}

      <PopupNotifications
        notifications={popupNotifications}
        onDismiss={removePopupNotification}
      />

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

      <AbrirDemandaModal
        isOpen={modalAbrirDemanda}
        onClose={() => setModalAbrirDemanda(false)}
        onConfirm={handleConfirmarNovaDemanda}
        ticketAtual={ticketSelecionado}
      />

      <SelecionarFilaModal
        isOpen={modalSelecionarFila}
        onClose={() => setModalSelecionarFila(false)}
        ticketId={ticketSelecionado?.id || ''}
        onFilaSelecionada={handleFilaSelecionada}
      />
    </div>
  );
};

export default ChatOmnichannel;
