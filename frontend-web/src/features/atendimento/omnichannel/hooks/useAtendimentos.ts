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

import { useState, useEffect, useCallback } from 'react';
import {
  atendimentoService,
  ListarTicketsParams
} from '../services/atendimentoService';
import { Ticket, CanalTipo, StatusAtendimento } from '../types';
import { NovoAtendimentoData } from '../modals/NovoAtendimentoModal';
import { TransferenciaData } from '../modals/TransferirAtendimentoModal';
import { EncerramentoData } from '../modals/EncerrarAtendimentoModal';
import { resolveAvatarUrl } from '../../../../utils/avatar';

const normalizarStatusAtendimento = (status?: string | null): StatusAtendimento => {
  const valor = (status ?? '').toString().trim().toLowerCase();

  if (['resolvido', 'fechado', 'finalizado'].includes(valor)) {
    return 'resolvido';
  }

  if (['aguardando', 'aguardando_cliente', 'aguardando_cliente_bot', 'pendente', 'follow_up', 'retorno'].includes(valor)) {
    return 'retorno';
  }

  return 'aberto';
};

const normalizarCanal = (valor: unknown): CanalTipo => {
  const canalBruto = (typeof valor === 'string'
    ? valor
    : (valor as any)?.tipo || (valor as any)?.nome || (valor as any)?.canal || ''
  ).toString().trim().toLowerCase();

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

  const contatoNome =
    contatoFonte.nome ||
    ticket.contatoNome ||
    ticket.contato_nome ||
    'Sem nome';

  const contatoTelefone =
    contatoFonte.telefone ||
    ticket.contatoTelefone ||
    ticket.contato_telefone ||
    '';

  const contatoEmail =
    contatoFonte.email ||
    ticket.contatoEmail ||
    ticket.contato_email ||
    '';

  const contatoFoto = resolveAvatarUrl(
    contatoFonte.foto ||
    ticket.contatoFoto ||
    ticket.contato_foto ||
    null
  );

  const contatoOnline = typeof contatoFonte.online === 'boolean'
    ? contatoFonte.online
    : Boolean(ticket.contatoOnline ?? ticket.contato_online ?? false);

  // 🔍 DEBUG temporário - verificar clienteVinculado
  if (contatoFonte.clienteVinculado) {
    console.log('🔗 [useAtendimentos] Cliente vinculado encontrado:', {
      ticketId: ticket.id,
      contatoNome: contatoNome,
      clienteVinculado: contatoFonte.clienteVinculado
    });
  } else {
    console.log('⚠️ [useAtendimentos] Contato SEM cliente vinculado:', {
      ticketId: ticket.id,
      contatoNome: contatoNome,
      contatoFonte: contatoFonte
    });
  }

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
    ticket.createdAt
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
  totaisPorStatus: Record<StatusAtendimento, number>;

  // Filtros
  filtros: ListarTicketsParams;
  setFiltros: (
    filtros:
      | ListarTicketsParams
      | ((prev: ListarTicketsParams) => ListarTicketsParams)
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

export const useAtendimentos = (
  options: UseAtendimentosOptions = {}
): UseAtendimentosReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30, // 30 segundos padrão
    filtroInicial = { status: 'aberto', page: 1, limit: 50 }
  } = options;

  // ===== ESTADO =====
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTickets, setTotalTickets] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(filtroInicial.page || 1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [filtros, setFiltros] = useState<ListarTicketsParams>(filtroInicial);
  const [totaisPorStatus, setTotaisPorStatus] = useState<Record<StatusAtendimento, number>>({
    aberto: 0,
    resolvido: 0,
    retorno: 0,
  });

  // ===== CARREGAR TICKETS =====
  const carregarTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await atendimentoService.listarTickets({
        ...filtros,
        page: paginaAtual
      });

      const dados = Array.isArray(response.data) ? response.data : [];
      const ticketsTransformados = dados.map(mapearTicketParaFrontend);

      const totalResposta = typeof response.total === 'number'
        ? response.total
        : ticketsTransformados.length;

      const limiteAtual = Number(filtros.limit ?? filtroInicial.limit ?? 50) || 50;
      const totalPaginasCalculado = typeof response.totalPages === 'number'
        ? response.totalPages
        : Math.ceil(totalResposta / limiteAtual) || 0;

      setTickets(ticketsTransformados);
      setTotalTickets(totalResposta);
      setTotalPaginas(totalPaginasCalculado);

      const statusParaContagem = (filtros.status || filtroInicial.status) as StatusAtendimento | undefined;
      if (statusParaContagem) {
        setTotaisPorStatus(prev => ({
          ...prev,
          [statusParaContagem]: totalResposta,
        }));
      } else {
        const contagensCalculadas: Record<StatusAtendimento, number> = {
          aberto: 0,
          resolvido: 0,
          retorno: 0,
        };

        ticketsTransformados.forEach(ticketAtual => {
          contagensCalculadas[ticketAtual.status] += 1;
        });

        setTotaisPorStatus(prev => ({
          ...prev,
          ...contagensCalculadas,
        }));
      }

      if (DEBUG) console.log(`✅ ${dados.length} tickets carregados`);
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao carregar tickets';
      setError(mensagemErro);
      console.error('❌ Erro ao carregar tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaAtual]); // ✅ Removido ticketSelecionado para evitar loop infinito

  // ===== SELECIONAR TICKET =====
  const selecionarTicket = useCallback(async (ticketId: string) => {
    try {
      // Buscar ticket completo com todos os dados
      const ticket = await atendimentoService.buscarTicket(ticketId);

      if (!ticket || typeof ticket !== 'object') {
        console.error('❌ SelecionarTicket: resposta inválida do backend para id=', ticketId, ticket);
        setError('Ticket inválido recebido do servidor');
        return;
      }

      let ticketNormalizado: Ticket;
      try {
        ticketNormalizado = mapearTicketParaFrontend(ticket);
      } catch (mapErr) {
        console.error('❌ Erro ao normalizar ticket recebido:', mapErr, ticket);
        setError('Erro ao processar dados do ticket');
        return;
      }

      setTicketSelecionado(ticketNormalizado);
      if (DEBUG) console.log('✅ Ticket selecionado:', ticket.numero);
    } catch (err: any) {
      console.error('❌ Erro ao selecionar ticket:', err);
      setError('Erro ao carregar detalhes do ticket');
    }
  }, []);

  // ===== CRIAR TICKET =====
  const criarTicket = useCallback(async (dados: NovoAtendimentoData): Promise<Ticket> => {
    try {
      setLoading(true);
      const ticketCriado = await atendimentoService.criarTicket(dados);

      // Recarregar lista
      await carregarTickets();

      // Selecionar o novo ticket
      const ticketNormalizado = mapearTicketParaFrontend(ticketCriado);
      setTicketSelecionado(ticketNormalizado);

      if (DEBUG) console.log('✅ Ticket criado com sucesso:', ticketCriado.numero);
      return ticketNormalizado;
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao criar ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao criar ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets]);

  // ===== TRANSFERIR TICKET =====
  const transferirTicket = useCallback(async (
    ticketId: string,
    dados: TransferenciaData
  ): Promise<void> => {
    try {
      setLoading(true);
      await atendimentoService.transferirTicket(ticketId, dados);

      // Recarregar lista e ticket atual
      await carregarTickets();

      if (ticketSelecionado?.id === ticketId) {
        await selecionarTicket(ticketId);
      }

      if (DEBUG) console.log('✅ Ticket transferido com sucesso');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao transferir ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao transferir ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets, ticketSelecionado, selecionarTicket]);

  // ===== ENCERRAR TICKET =====
  const encerrarTicket = useCallback(async (
    ticketId: string,
    dados: EncerramentoData
  ): Promise<void> => {
    try {
      setLoading(true);
      await atendimentoService.encerrarTicket(ticketId, dados);

      // Recarregar lista
      await carregarTickets();

      // Limpar seleção se era o ticket atual
      if (ticketSelecionado?.id === ticketId) {
        setTicketSelecionado(null);
      }

      if (DEBUG) console.log('✅ Ticket encerrado com sucesso');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao encerrar ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao encerrar ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets, ticketSelecionado]);

  // ===== REABRIR TICKET =====
  const reabrirTicket = useCallback(async (ticketId: string): Promise<void> => {
    try {
      setLoading(true);
      const ticketReaberto = await atendimentoService.reabrirTicket(ticketId);
      const ticketNormalizado = mapearTicketParaFrontend(ticketReaberto);

      // Recarregar lista
      await carregarTickets();

      // Selecionar ticket reaberto
      setTicketSelecionado(ticketNormalizado);

      if (DEBUG) console.log('✅ Ticket reaberto com sucesso');
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Erro ao reabrir ticket';
      setError(mensagemErro);
      console.error('❌ Erro ao reabrir ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarTickets]);

  // ===== RECARREGAR =====
  const recarregar = useCallback(async () => {
    await carregarTickets();
  }, [carregarTickets]);

  // ===== SINCRONIZAR TICKET VIA TEMPO REAL =====
  const sincronizarTicketRealtime = useCallback((ticketPayload: any): Ticket | null => {
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
    const deveExibirTicket = !statusFiltroAtivo || statusFiltroAtivo === ticketNormalizado.status;

    let adicionou = false;
    let removidoPorFiltro = false;
    let statusAnterior: StatusAtendimento | null = null;

    setTickets(prev => {
      const index = prev.findIndex(ticket => ticket.id === ticketNormalizado.id);

      if (index === -1) {
        if (!deveExibirTicket) {
          return prev;
        }

        adicionou = true;
        const atualizada = [ticketNormalizado, ...prev];

        return atualizada.sort((a, b) => b.tempoUltimaMensagem.getTime() - a.tempoUltimaMensagem.getTime());
      }

      statusAnterior = prev[index].status;

      if (!deveExibirTicket) {
        removidoPorFiltro = true;
        const atualizada = prev.filter((_, idx) => idx !== index);
        return atualizada;
      }

      const atualizada = prev.map((ticket, idx) =>
        idx === index ? { ...ticket, ...ticketNormalizado } : ticket
      );

      return atualizada.sort((a, b) => b.tempoUltimaMensagem.getTime() - a.tempoUltimaMensagem.getTime());
    });

    if (deveExibirTicket) {
      setTicketSelecionado(prev =>
        prev?.id === ticketNormalizado.id ? { ...prev, ...ticketNormalizado } : prev
      );
    }

    if (adicionou) {
      setTotalTickets(prev => prev + 1);
    } else if (removidoPorFiltro) {
      setTotalTickets(prev => Math.max(0, prev - 1));
    }

    setTotaisPorStatus(prev => {
      const atualizado = { ...prev } as Record<StatusAtendimento, number>;

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
  }, [filtros.status]);

  // ===== ATUALIZAR TICKET LOCAL (SEM RELOAD) =====
  const atualizarTicketLocal = useCallback((ticketId: string, updates: Partial<Ticket>) => {
    const updatesNormalizados = normalizarAtualizacoesTicket(updates);

    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, ...updatesNormalizados }
        : ticket
    ));

    // Se for o ticket selecionado, atualizar também
    setTicketSelecionado(prev =>
      prev?.id === ticketId
        ? { ...prev, ...updatesNormalizados }
        : prev
    );

    if (DEBUG) console.log(`🔄 Ticket ${ticketId} atualizado localmente (sem reload)`);
  }, []);

  // ===== NAVEGAÇÃO =====
  const irParaPagina = useCallback((pagina: number) => {
    setPaginaAtual(pagina);
  }, []);

  // ===== ATUALIZAR FILTROS =====
  const atualizarFiltros = useCallback((novosFiltros: ListarTicketsParams | ((prev: ListarTicketsParams) => ListarTicketsParams)) => {
    if (typeof novosFiltros === 'function') {
      setFiltros(prev => (novosFiltros as (prev: ListarTicketsParams) => ListarTicketsParams)(prev));
    } else {
      setFiltros(prev => ({
        ...prev,
        ...novosFiltros,
      }));
    }

    setPaginaAtual(1); // Resetar para primeira página ao filtrar
  }, []);

  // ===== EFEITOS =====

  // Carregar tickets ao montar ou quando filtros/página mudarem
  useEffect(() => {
    carregarTickets();
  }, [carregarTickets]);

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
    // Estado
    tickets,
    ticketSelecionado,
    loading,
    error,
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
    atualizarTicketLocal, // 🆕 NOVA

    // Navegação
    irParaPagina,
  };
};
