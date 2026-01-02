/**
 * 🎯 useAtendimentos - Hook para gerenciar tickets de atendimento
 *
 * Funcionalidades:
 * - Listagem com filtros
 * - Seleção de ticket
 * - Criação de novo ticket
 * - Transferência
 * - Encerramento
 * - Reabertura
 * - Auto-refresh
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { atendimentoService, ListarTicketsParams } from '../services/atendimentoService';
import { Ticket, CanalTipo, StatusAtendimentoType } from '../types';
import { NovoAtendimentoData } from '../modals/NovoAtendimentoModal';
import { TransferenciaData } from '../modals/TransferirAtendimentoModal';
import { EncerramentoData } from '../modals/EncerrarAtendimentoModal';
import { resolveAvatarUrl } from '../../../../utils/avatar';
import { useAtendimentoStore } from '../../../../stores/atendimentoStore';

// ✅ ATUALIZADO: Normalizar status do backend (MAIÚSCULO) para frontend (minúsculo)
// 4 estágios: fila, em_atendimento, envio_ativo, encerrado
const normalizarStatusAtendimento = (status?: string | null): StatusAtendimentoType => {
  const valor = (status ?? '').toString().trim().toLowerCase();

  // Mapeamento para 4 estágios
  const mapa: Record<string, StatusAtendimentoType> = {
    // Novos estados (4 estágios)
    fila: 'fila',
    em_atendimento: 'em_atendimento',
    'em atendimento': 'em_atendimento',
    envio_ativo: 'envio_ativo',
    'envio ativo': 'envio_ativo',
    encerrado: 'encerrado',
    // Compatibilidade com nomes antigos (conversão)
    aberto: 'fila',
    aguardando: 'envio_ativo',
    aguardando_cliente: 'envio_ativo',
    resolvido: 'encerrado',
    fechado: 'encerrado',
    finalizado: 'encerrado',
  };

  return mapa[valor] || 'fila';
};

const normalizarCanal = (valor: unknown): CanalTipo => {
  const canalBruto = (
    typeof valor === 'string'
      ? valor
      : (valor as any)?.tipo || (valor as any)?.nome || (valor as any)?.canal || ''
  )
    .toString()
    .trim()
    .toLowerCase();

  if (['whatsapp', 'telegram', 'email', 'chat', 'telefone'].includes(canalBruto)) {
    return canalBruto as CanalTipo;
  }

  return 'chat';
};

const construirData = (valor: unknown): Date => {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor;
  }

  if (!valor) {
    return new Date();
  }

  const data = new Date(valor as any);
  return isNaN(data.getTime()) ? new Date() : data;
};

const mapearTicketParaFrontend = (ticket: any): Ticket => {
  if (!ticket) {
    throw new Error('Ticket inválido recebido do backend');
  }

  const statusOriginal = ticket.status ?? ticket.statusOriginal ?? '';
  const statusNormalizado = normalizarStatusAtendimento(statusOriginal);

  const contatoFonte = ticket.contato || {};
  const contatoId =
    contatoFonte.id ||
    ticket.contatoId ||
    ticket.contato_id ||
    ticket.contatoTelefone ||
    ticket.contato_telefone ||
    ticket.id;

  const contatoNome = contatoFonte.nome || ticket.contatoNome || ticket.contato_nome || 'Sem nome';

  const contatoTelefone =
    contatoFonte.telefone || ticket.contatoTelefone || ticket.contato_telefone || '';

  const contatoEmail = contatoFonte.email || ticket.contatoEmail || ticket.contato_email || '';

  const contatoFoto = resolveAvatarUrl(
    contatoFonte.foto || ticket.contatoFoto || ticket.contato_foto || null,
  );

  const contatoOnline =
    typeof contatoFonte.online === 'boolean'
      ? contatoFonte.online
      : Boolean(ticket.contatoOnline ?? ticket.contato_online ?? false);

  const canalFonte =
    typeof ticket.canal === 'string'
      ? ticket.canal
      : ticket.canal?.tipo ||
      ticket.canal?.nome ||
      ticket.canalTipo ||
      ticket.canal_tipo ||
      ticket.canalId ||
      'whatsapp';

  const atendenteFonte = ticket.atendente
    ? {
      ...ticket.atendente,
      id: ticket.atendente.id,
      nome: ticket.atendente.nome || 'Atendente',
      foto: resolveAvatarUrl(ticket.atendente.foto || null),
    }
    : undefined;

  const tempoUltimaMensagem = construirData(
    ticket.tempoUltimaMensagem ||
    ticket.ultimaMensagemEm ||
    ticket.ultima_mensagem_em ||
    ticket.updatedAt ||
    ticket.createdAt,
  );

  return {
    ...ticket,
    id: ticket.id,
    numero: ticket.numero ? String(ticket.numero) : String(ticket.id),
    contatoId,
    contato: {
      id: contatoId,
      nome: contatoNome,
      telefone: contatoTelefone,
      email: contatoEmail,
      foto: contatoFoto || undefined,
      online: contatoOnline,
      clienteVinculado: contatoFonte.clienteVinculado,
    },
    canal: normalizarCanal(canalFonte),
    status: statusNormalizado,
    statusOriginal: statusOriginal
      ? String(statusOriginal).toUpperCase()
      : statusNormalizado.toUpperCase(),
    ultimaMensagem: ticket.ultimaMensagem || ticket.ultima_mensagem || 'Sem mensagens',
    tempoUltimaMensagem,
    tempoAtendimento: Number(ticket.tempoAtendimento ?? ticket.tempo_atendimento ?? 0),
    atendente: atendenteFonte,
    tags: Array.isArray(ticket.tags) ? ticket.tags : [],
  } as Ticket;
};

const normalizarAtualizacoesTicket = (updates: Partial<Ticket>): Partial<Ticket> => {
  const resultado: Partial<Ticket> = { ...updates };

  if (resultado.status && typeof resultado.status === 'string') {
    const statusOriginal = resultado.status;
    resultado.status = normalizarStatusAtendimento(statusOriginal);
    resultado.statusOriginal = statusOriginal.toUpperCase();
  } else if (resultado.statusOriginal) {
    resultado.status = normalizarStatusAtendimento(resultado.statusOriginal);
    resultado.statusOriginal = resultado.statusOriginal.toUpperCase();
  }

  if (resultado.tempoUltimaMensagem) {
    resultado.tempoUltimaMensagem = construirData(resultado.tempoUltimaMensagem);
  }

  if (resultado.contato) {
    resultado.contato = {
      ...resultado.contato,
      foto: resolveAvatarUrl(resultado.contato.foto || null) || undefined,
    } as Ticket['contato'];
  }

  if (resultado.atendente) {
    resultado.atendente = {
      ...resultado.atendente,
      foto: resolveAvatarUrl(resultado.atendente.foto || null) || undefined,
    };
  }

  if (resultado.canal) {
    resultado.canal = normalizarCanal(resultado.canal);
  }

  return resultado;
};

const DEBUG = false;

interface UseAtendimentosOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
  filtroInicial?: ListarTicketsParams;
  atendenteAtualId?: string | null;
}

interface UseAtendimentosReturn {
  // Estado
  tickets: Ticket[];
  ticketSelecionado: Ticket | null;
  loading: boolean;
  error: string | null;
  totalTickets: number;
  paginaAtual: number;
  totalPaginas: number;
  totaisPorStatus: Record<StatusAtendimentoType, number>;

  // Filtros
  filtros: ListarTicketsParams;
  setFiltros: (
    filtros: ListarTicketsParams | ((prev: ListarTicketsParams) => ListarTicketsParams),
  ) => void;

  // Ações
  selecionarTicket: (ticketId: string) => void;
  criarTicket: (dados: NovoAtendimentoData) => Promise<Ticket>;
  transferirTicket: (ticketId: string, dados: TransferenciaData) => Promise<void>;
  encerrarTicket: (ticketId: string, dados: EncerramentoData) => Promise<void>;
  reabrirTicket: (ticketId: string) => Promise<void>;
  recarregar: () => Promise<void>;
  sincronizarTicketRealtime: (ticket: any) => Ticket | null;
  atualizarTicketLocal: (ticketId: string, updates: Partial<Ticket>) => void; // 🆕 NOVA: Atualiza ticket sem reload

  // Navegação
  irParaPagina: (pagina: number) => void;
}

export const useAtendimentos = (options: UseAtendimentosOptions = {}): UseAtendimentosReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30, // 30 segundos padrão
    filtroInicial: filtroInicialProp,
    atendenteAtualId = null,
  } = options;

  // ⚡ FIX: Estabilizar filtroInicial com useMemo para evitar recriação em cada render
  const filtroInicial = useMemo(
    () => filtroInicialProp || { page: 1, limit: 50 },
    [filtroInicialProp],
  );

  // ===== ESTADO (usando Zustand Store para tickets e seleção) =====
  // ===== ZUSTAND STORE (acesso direto - mais seguro) =====
  const tickets = useAtendimentoStore((state) => state.tickets);
  const ticketSelecionado = useAtendimentoStore((state) => state.ticketSelecionado);
  const ticketsLoading = useAtendimentoStore((state) => state.ticketsLoading);
  const ticketsError = useAtendimentoStore((state) => state.ticketsError);
  const selecionarTicketStore = useAtendimentoStore((state) => state.selecionarTicket);
  const setTickets = useAtendimentoStore((state) => state.setTickets);
  const setTicketsLoading = useAtendimentoStore((state) => state.setTicketsLoading);
  const setTicketsError = useAtendimentoStore((state) => state.setTicketsError);

  // Estado local para paginação e filtros (não precisam estar na store global)
  const [totalTickets, setTotalTickets] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(filtroInicial.page || 1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [filtros, setFiltrosLocal] = useState<ListarTicketsParams>(filtroInicial);
  const [totaisPorStatus, setTotaisPorStatus] = useState<Record<StatusAtendimentoType, number>>({
    aberto: 0,
    em_atendimento: 0,
    aguardando: 0,
    resolvido: 0,
    fechado: 0,
  });

  const podeVisualizarTicket = useCallback(
    (ticket: Ticket): boolean => {
      if (!atendenteAtualId) {
        return true;
      }

      const responsavelId = ticket.atendente?.id || null;
      if (!responsavelId) {
        return true;
      }

      return responsavelId === atendenteAtualId;
    },
    [atendenteAtualId],
  );

  // ⚡ FIX DEFINITIVO: Usar função normal (não useCallback) para evitar loop
  // O useEffect vai controlar quando chamar esta função
  const carregarTickets = async () => {
    setTicketsLoading(true);
    setTicketsError(null);

    try {
      // ✅ SPRINT 2: Adicionar filtro por atendenteId para mostrar apenas tickets do atendente logado
      const filtrosComAtendente = {
        ...filtros,
        page: paginaAtual,
        // Se atendenteAtualId existe E status não é 'fila', filtrar por atendenteId
        ...(atendenteAtualId && filtros.status !== 'fila' ? { atendenteId: atendenteAtualId } : {}),
      };

      const response = await atendimentoService.listarTickets(filtrosComAtendente);

      const dados = Array.isArray(response.data) ? response.data : [];
      const ticketsTransformados = dados.map(mapearTicketParaFrontend);
      const ticketsVisiveis = ticketsTransformados.filter(podeVisualizarTicket);

      const limiteAtual = Number(filtros.limit ?? filtroInicial.limit ?? 50) || 50;
      const totalVisiveis = ticketsVisiveis.length;
      const totalPaginasCalculado = Math.ceil(totalVisiveis / limiteAtual) || 0;

      setTickets(ticketsVisiveis);

      // Verificar se ticket selecionado ainda existe
      if (ticketSelecionado) {
        const aindaExiste = ticketsVisiveis.some((ticket) => ticket.id === ticketSelecionado.id);
        if (!aindaExiste) {
          selecionarTicketStore(null);
        }
      }

      setTotalTickets(totalVisiveis);
      setTotalPaginas(totalPaginasCalculado);

      const statusParaContagem = (filtros.status || filtroInicial.status) as
        | StatusAtendimentoType
        | undefined;
      if (statusParaContagem) {
        setTotaisPorStatus((prev) => ({
          ...prev,
          [statusParaContagem]: totalVisiveis,
        }));
      } else {
        const contagensCalculadas: Record<StatusAtendimentoType, number> = {
          aberto: 0,
          em_atendimento: 0,
          aguardando: 0,
          resolvido: 0,
          fechado: 0,
        };

        ticketsVisiveis.forEach((ticketAtual) => {
          contagensCalculadas[ticketAtual.status] += 1;
        });

        setTotaisPorStatus((prev) => ({
          ...prev,
          ...contagensCalculadas,
        }));
      }

      if (DEBUG) console.log(`✅ ${dados.length} tickets carregados`);
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao carregar tickets';
      setTicketsError(mensagemErro);
      console.error('❌ Erro ao carregar tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  }; // ⚡ Fim da função carregarTickets (não é mais useCallback)

  // ===== SELECIONAR TICKET =====
  const selecionarTicket = useCallback(
    async (ticketId: string) => {
      try {
        // Buscar ticket completo com todos os dados
        const ticket = await atendimentoService.buscarTicket(ticketId);

        if (!ticket || typeof ticket !== 'object') {
          console.error(
            '❌ SelecionarTicket: resposta inválida do backend para id=',
            ticketId,
            ticket,
          );
          setTicketsError('Ticket inválido recebido do servidor');
          return;
        }

        let ticketNormalizado: Ticket;
        try {
          ticketNormalizado = mapearTicketParaFrontend(ticket);
        } catch (mapErr) {
          console.error('❌ Erro ao normalizar ticket recebido:', mapErr, ticket);
          setTicketsError('Erro ao processar dados do ticket');
          return;
        }

        selecionarTicketStore(ticketNormalizado);
        if (DEBUG) console.log('✅ Ticket selecionado:', ticket.numero);
      } catch (err: any) {
        console.error('❌ Erro ao selecionar ticket:', err);
        setTicketsError('Erro ao carregar detalhes do ticket');
      }
    },
    [selecionarTicketStore, setTicketsError],
  );

  // ===== CRIAR TICKET =====
  const criarTicket = useCallback(
    async (dados: NovoAtendimentoData): Promise<Ticket> => {
      try {
        setTicketsLoading(true);
        const ticketCriado = await atendimentoService.criarTicket(dados);

        // Recarregar lista
        await carregarTickets();

        // Selecionar o novo ticket
        const ticketNormalizado = mapearTicketParaFrontend(ticketCriado);
        selecionarTicketStore(ticketNormalizado);

        if (DEBUG) console.log('✅ Ticket criado com sucesso:', ticketCriado.numero);
        return ticketNormalizado;
      } catch (err: any) {
        const mensagemErro = err.response?.data?.message || 'Erro ao criar ticket';
        setTicketsError(mensagemErro);
        console.error('❌ Erro ao criar ticket:', err);
        throw err;
      } finally {
        setTicketsLoading(false);
      }
    },
    [carregarTickets, selecionarTicketStore, setTicketsLoading, setTicketsError],
  );

  // ===== TRANSFERIR TICKET =====
  const transferirTicket = useCallback(
    async (ticketId: string, dados: TransferenciaData): Promise<void> => {
      try {
        setTicketsLoading(true);
        await atendimentoService.transferirTicket(ticketId, dados);

        // Recarregar lista e ticket atual
        await carregarTickets();

        if (ticketSelecionado?.id === ticketId) {
          await selecionarTicket(ticketId);
        }

        if (DEBUG) console.log('✅ Ticket transferido com sucesso');
      } catch (err: any) {
        const mensagemErro = err.response?.data?.message || 'Erro ao transferir ticket';
        setTicketsError(mensagemErro);
        console.error('❌ Erro ao transferir ticket:', err);
        throw err;
      } finally {
        setTicketsLoading(false);
      }
    },
    [carregarTickets, ticketSelecionado, selecionarTicket, setTicketsLoading, setTicketsError],
  );

  // ===== ENCERRAR TICKET =====
  const encerrarTicket = useCallback(
    async (ticketId: string, dados: EncerramentoData): Promise<void> => {
      try {
        setTicketsLoading(true);
        await atendimentoService.encerrarTicket(ticketId, dados);

        // Recarregar lista
        await carregarTickets();

        // Limpar seleção se era o ticket atual
        if (ticketSelecionado?.id === ticketId) {
          selecionarTicketStore(null);
        }

        if (DEBUG) console.log('✅ Ticket encerrado com sucesso');
      } catch (err: any) {
        const mensagemErro = err.response?.data?.message || 'Erro ao encerrar ticket';
        setTicketsError(mensagemErro);
        console.error('❌ Erro ao encerrar ticket:', err);
        throw err;
      } finally {
        setTicketsLoading(false);
      }
    },
    [carregarTickets, ticketSelecionado, selecionarTicketStore, setTicketsLoading, setTicketsError],
  );

  // ===== REABRIR TICKET =====
  const reabrirTicket = useCallback(
    async (ticketId: string): Promise<void> => {
      try {
        setTicketsLoading(true);
        const ticketReaberto = await atendimentoService.reabrirTicket(ticketId);
        const ticketNormalizado = mapearTicketParaFrontend(ticketReaberto);

        // Recarregar lista
        await carregarTickets();

        // Selecionar ticket reaberto
        selecionarTicketStore(ticketNormalizado);

        if (DEBUG) console.log('✅ Ticket reaberto com sucesso');
      } catch (err: any) {
        const mensagemErro = err.response?.data?.message || 'Erro ao reabrir ticket';
        setTicketsError(mensagemErro);
        console.error('❌ Erro ao reabrir ticket:', err);
        throw err;
      } finally {
        setTicketsLoading(false);
      }
    },
    [carregarTickets, selecionarTicketStore, setTicketsLoading, setTicketsError],
  );

  // ===== RECARREGAR =====
  const recarregar = useCallback(async () => {
    await carregarTickets();
  }, [carregarTickets]);

  // ===== SINCRONIZAR TICKET VIA TEMPO REAL =====
  const sincronizarTicketRealtime = useCallback(
    (ticketPayload: any): Ticket | null => {
      if (!ticketPayload) {
        return null;
      }

      let ticketNormalizado: Ticket;
      try {
        ticketNormalizado = mapearTicketParaFrontend(ticketPayload);
      } catch (err) {
        console.error('❌ Erro ao normalizar ticket recebido via WebSocket:', err, ticketPayload);
        return null;
      }

      const statusFiltroAtivo = filtros.status ?? null;
      const deveExibirTicket =
        podeVisualizarTicket(ticketNormalizado) &&
        (!statusFiltroAtivo || statusFiltroAtivo === ticketNormalizado.status);

      let adicionou = false;
      let removidoPorFiltro = false;
      let statusAnterior: StatusAtendimentoType | null = null;

      // Atualizar tickets na store
      const ticketsAtuais = tickets;
      const index = ticketsAtuais.findIndex((ticket) => ticket.id === ticketNormalizado.id);

      if (index === -1) {
        if (deveExibirTicket) {
          adicionou = true;
          const atualizada = [ticketNormalizado, ...ticketsAtuais];
          const ordenada = atualizada.sort(
            (a, b) => b.tempoUltimaMensagem.getTime() - a.tempoUltimaMensagem.getTime(),
          );
          setTickets(ordenada);
        }
      } else {
        statusAnterior = ticketsAtuais[index].status;

        if (!deveExibirTicket) {
          removidoPorFiltro = true;
          const atualizada = ticketsAtuais.filter((_, idx) => idx !== index);
          setTickets(atualizada);
        } else {
          const atualizada = ticketsAtuais.map((ticket, idx) =>
            idx === index ? { ...ticket, ...ticketNormalizado } : ticket,
          );
          const ordenada = atualizada.sort(
            (a, b) => b.tempoUltimaMensagem.getTime() - a.tempoUltimaMensagem.getTime(),
          );
          setTickets(ordenada);
        }
      }

      // Atualizar ticket selecionado se necessário
      if (ticketSelecionado?.id === ticketNormalizado.id) {
        if (deveExibirTicket) {
          selecionarTicketStore({ ...ticketSelecionado, ...ticketNormalizado });
        } else {
          selecionarTicketStore(null);
        }
      }

      if (adicionou) {
        setTotalTickets((prev) => prev + 1);
      } else if (removidoPorFiltro) {
        setTotalTickets((prev) => Math.max(0, prev - 1));
      }

      setTotaisPorStatus((prev) => {
        const atualizado = { ...prev } as Record<StatusAtendimentoType, number>;

        if (adicionou) {
          atualizado[ticketNormalizado.status] = (atualizado[ticketNormalizado.status] ?? 0) + 1;
        } else if (removidoPorFiltro && statusAnterior) {
          atualizado[statusAnterior] = Math.max(0, (atualizado[statusAnterior] ?? 1) - 1);
        } else if (statusAnterior && statusAnterior !== ticketNormalizado.status) {
          atualizado[statusAnterior] = Math.max(0, (atualizado[statusAnterior] ?? 1) - 1);
          atualizado[ticketNormalizado.status] = (atualizado[ticketNormalizado.status] ?? 0) + 1;
        }

        return atualizado;
      });

      if (!deveExibirTicket) {
        return ticketNormalizado;
      }

      return ticketNormalizado;
    },
    [
      filtros.status,
      podeVisualizarTicket,
      tickets,
      ticketSelecionado,
      setTickets,
      selecionarTicketStore,
    ],
  );

  // ===== ATUALIZAR TICKET LOCAL (SEM RELOAD) =====
  const atualizarTicketLocal = useCallback(
    (ticketId: string, updates: Partial<Ticket>) => {
      const updatesNormalizados = normalizarAtualizacoesTicket(updates);

      // Atualizar na lista
      const ticketsAtualizados = tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updatesNormalizados } : ticket,
      );
      setTickets(ticketsAtualizados);

      // Se for o ticket selecionado, atualizar também
      if (ticketSelecionado?.id === ticketId) {
        selecionarTicketStore({ ...ticketSelecionado, ...updatesNormalizados });
      }

      if (DEBUG) console.log(`🔄 Ticket ${ticketId} atualizado localmente (sem reload)`);
    },
    [tickets, ticketSelecionado, setTickets, selecionarTicketStore],
  );

  // ===== NAVEGAÇÃO =====
  const irParaPagina = useCallback((pagina: number) => {
    setPaginaAtual(pagina);
  }, []);

  // ===== ATUALIZAR FILTROS =====
  const atualizarFiltros = useCallback(
    (novosFiltros: ListarTicketsParams | ((prev: ListarTicketsParams) => ListarTicketsParams)) => {
      if (typeof novosFiltros === 'function') {
        setFiltrosLocal((prev) =>
          (novosFiltros as (prev: ListarTicketsParams) => ListarTicketsParams)(prev),
        );
      } else {
        setFiltrosLocal((prev) => ({
          ...prev,
          ...novosFiltros,
        }));
      }

      setPaginaAtual(1); // Resetar para primeira página ao filtrar
    },
    [],
  );

  // ===== EFEITOS =====

  // ⚡ FIX: Carregar tickets quando filtros ou página mudarem (não depende de carregarTickets)
  useEffect(() => {
    carregarTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, paginaAtual]); // Apenas dependências primitivas/objetos de estado

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalo = setInterval(() => {
      if (DEBUG) console.log('🔄 Auto-refresh dos tickets...');
      carregarTickets();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalo);
  }, [autoRefresh, refreshInterval, carregarTickets]);

  // ===== RETORNO =====
  return {
    // Estado (da Zustand Store)
    tickets,
    ticketSelecionado,
    loading: ticketsLoading,
    error: ticketsError,
    totalTickets,
    paginaAtual,
    totalPaginas,
    totaisPorStatus,

    // Filtros
    filtros,
    setFiltros: atualizarFiltros,

    // Ações
    selecionarTicket,
    criarTicket,
    transferirTicket,
    encerrarTicket,
    reabrirTicket,
    recarregar,
    sincronizarTicketRealtime,
    atualizarTicketLocal,

    // Navegação
    irParaPagina,
  };
};
