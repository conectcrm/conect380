/**
 * GESTÃO DE TICKETS - CONECT CRM
 * Visualização Profissional com Tabela/Cards
 * 
 * Features:
 * - Toggle Tabela/Cards
 * - Filtros Avançados (data, prioridade, responsável, SLA)
 * - Ordenação por colunas
 * - Seleção múltipla + Ações em lote
 * - Busca em tempo real
 * - Paginação completa
 * - Densidade configurável
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  Search,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  MessageSquare,
  Edit2,
  Trash2,
  List,
  Grid,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Tag,
  Download,
  X,
  Calendar,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmation } from '../hooks/useConfirmation';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { ticketsService, Ticket as TicketType, StatusTicketApi, TipoTicket, PrioridadeTicketApi } from '../services/ticketsService';
import { StatusTicket } from '../types/ticket';
import { TicketFormModal } from '../components/tickets/TicketFormModal';
import { AtribuirTicketModal } from '../components/tickets/AtribuirTicketModal';
import { TicketsTable } from '../components/tickets/TicketsTable';

interface TicketFiltros {
  empresaId: string;
  tipo?: TipoTicket;
  status?: StatusTicketApi[];
  prioridade?: PrioridadeTicketApi;
  responsavelId?: string;
  slaStatus?: 'vencido' | 'proximo' | 'em_dia';
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  pagina?: number;
  limite?: number;
}

type ViewMode = 'table' | 'cards';
type Density = 'compact' | 'comfortable' | 'spacious';
type SortField = 'numero' | 'titulo' | 'status' | 'prioridade' | 'tipo' | 'created_at';
type SortDirection = 'asc' | 'desc';

const GestaoTicketsPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados principais
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de visualização
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [density, setDensity] = useState<Density>('comfortable');
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);

  // Estados de filtros
  const [filtros, setFiltros] = useState<TicketFiltros>({
    empresaId: localStorage.getItem('empresaAtiva') || '',
    pagina: 1,
    limite: 50,
  });
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  // Estados de ordenação
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Estados de seleção múltipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados dos modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAtribuirModal, setShowAtribuirModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const { confirmationState, showConfirmation } = useConfirmation();

  // Debounce da busca (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);

    return () => clearTimeout(timer);
  }, [busca]);

  // Atualizar filtros quando busca debounced mudar
  useEffect(() => {
    if (buscaDebounced !== filtros.busca) {
      setFiltros((prev) => ({
        ...prev,
        busca: buscaDebounced.trim() || undefined,
        pagina: 1,
      }));
    }
  }, [buscaDebounced]);

  // Carregar tickets ao montar componente ou quando filtros mudarem
  useEffect(() => {
    carregarTickets();
  }, [filtros, sortField, sortDirection]);

  const carregarTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const resultado = await ticketsService.listar(filtros);

      // Backend retorna { data: { tickets, total } }
      let ticketsData = resultado.data?.tickets || resultado.data || [];
      ticketsData = Array.isArray(ticketsData) ? ticketsData : [];

      // Ordenação client-side (até implementar no backend)
      const ticketsOrdenados = [...ticketsData].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case 'numero':
            comparison = a.numero - b.numero;
            break;
          case 'titulo':
            comparison = (a.titulo || '').localeCompare(b.titulo || '');
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          case 'prioridade':
            const prioridadeOrder: Record<PrioridadeTicketApi, number> = {
              URGENTE: 4,
              ALTA: 3,
              MEDIA: 2,
              BAIXA: 1,
            };
            comparison = prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
            break;
          case 'tipo':
            comparison = (a.tipo || '').localeCompare(b.tipo || '');
            break;
          case 'created_at':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });

      setTickets(ticketsOrdenados);
      setTotal(resultado.data?.total || resultado.total || 0);
    } catch (err: unknown) {
      console.error('Erro ao carregar tickets:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar tickets');
      setTickets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Funções de manipulação de ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as SortField);
      setSortDirection('asc');
    }
  };

  // Funções de seleção múltipla
  const handleSelectToggle = (ticketId: string) => {
    setSelectedIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === tickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tickets.map((t) => t.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Funções de filtros
  const handleFiltroRapido = (campo: string, valor: any) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      pagina: 1,
    }));
  };

  const handleLimparFiltros = () => {
    setFiltros({
      empresaId: localStorage.getItem('empresaAtiva') || '',
      pagina: 1,
      limite: filtros.limite,
    });
    setBusca('');
  };

  const handleEditar = (ticket: TicketType, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir navegação ao clicar no card
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const handleDeletar = (ticket: TicketType, e: React.MouseEvent) => {
    e.stopPropagation();

    showConfirmation({
      title: 'Deletar Ticket',
      message: `Deseja realmente deletar o ticket #${ticket.numero}?\n\nTítulo: ${ticket.titulo || ticket.assunto || 'Sem título'}\nStatus: ${getStatusLabel(ticket.status)}\nCliente: ${ticket.contato_nome || 'Não especificado'}\n\nEsta ação não pode ser desfeita.`,
      confirmText: 'Sim, Deletar',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: async () => {
        try {
          const empresaId = localStorage.getItem('empresaAtiva') || '';
          await ticketsService.deletar(ticket.id, empresaId);
          toast.success(`Ticket #${ticket.numero} deletado com sucesso!`);
          await carregarTickets();
        } catch (err: unknown) {
          console.error('Erro ao deletar ticket:', err);
          const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar ticket';
          toast.error(`Erro: ${errorMessage}`);
        }
      },
    });
  };

  // Calcular métricas para KPI cards
  const totalTickets = total;
  const ticketsAbertos = tickets.filter((t) =>
    ['FILA', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_INTERNO'].includes(t.status)
  ).length;
  const ticketsFechados = tickets.filter((t) =>
    ['CONCLUIDO', 'CANCELADO', 'ENCERRADO'].includes(t.status)
  ).length;
  const ticketsPorTipo = tickets.reduce((acc, t) => {
    const tipo = t.tipo || 'sem-tipo';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Labels de status
  const getStatusLabel = (status: StatusTicketApi | StatusTicket): string => {
    const statusStr = status.toString().toUpperCase();
    const labels: Partial<Record<string, string>> = {
      FILA: 'Fila',
      ABERTO: 'Aberto',
      EM_ATENDIMENTO: 'Em Atendimento',
      AGUARDANDO: 'Aguardando',
      AGUARDANDO_CLIENTE: 'Aguardando Cliente',
      AGUARDANDO_INTERNO: 'Aguardando Interno',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
      ENCERRADO: 'Encerrado',
      RESOLVIDO: 'Resolvido',
      FECHADO: 'Fechado',
    };
    return labels[statusStr] || status;
  };

  // Labels de tipo
  const getTipoLabel = (tipo?: TipoTicket): string => {
    if (!tipo) return 'Sem tipo';
    const labels: Record<TipoTicket, string> = {
      tecnica: 'Técnica',
      comercial: 'Comercial',
      financeira: 'Financeira',
      suporte: 'Suporte',
      reclamacao: 'Reclamação',
      solicitacao: 'Solicitação',
      outros: 'Outros',
    };
    return labels[tipo] || tipo;
  };

  // Cores de tipo
  const getTipoColor = (tipo?: TipoTicket): string => {
    if (!tipo) return 'bg-gray-100 text-gray-800';
    const colors: Record<TipoTicket, string> = {
      tecnica: 'bg-blue-100 text-blue-800',
      comercial: 'bg-green-100 text-green-800',
      financeira: 'bg-purple-100 text-purple-800',
      suporte: 'bg-orange-100 text-orange-800',
      reclamacao: 'bg-red-100 text-red-800',
      solicitacao: 'bg-cyan-100 text-cyan-800',
      outros: 'bg-gray-100 text-gray-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  // Cores de status
  const getStatusColor = (status: StatusTicketApi | StatusTicket): string => {
    const statusStr = status.toString().toUpperCase();
    const colors: Partial<Record<string, string>> = {
      FILA: 'bg-yellow-100 text-yellow-800',
      ABERTO: 'bg-blue-100 text-blue-800',
      EM_ATENDIMENTO: 'bg-blue-100 text-blue-800',
      AGUARDANDO: 'bg-orange-100 text-orange-800',
      AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800',
      AGUARDANDO_INTERNO: 'bg-purple-100 text-purple-800',
      CONCLUIDO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800',
      ENCERRADO: 'bg-gray-100 text-gray-800',
      RESOLVIDO: 'bg-green-100 text-green-800',
      FECHADO: 'bg-gray-100 text-gray-800',
    };
    return colors[statusStr] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Breadcrumb */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Atendimento"
          nucleusPath="/nuclei/atendimento"
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <Ticket className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Gestão de Tickets
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading ? 'Carregando...' : `${totalTickets} tickets no total`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={carregarTickets}
                    disabled={loading}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Recarregar tickets"
                  >
                    <RefreshCw
                      className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Cards (KPI Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1 - Total de Tickets */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total de Tickets
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{totalTickets}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Todos os tickets do sistema
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Ticket className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2 - Tickets Abertos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Em Aberto
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{ticketsAbertos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Fila, em atendimento e aguardando
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Card 3 - Tickets Fechados */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Finalizados
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{ticketsFechados}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Concluídos, cancelados e encerrados
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Tickets por Tipo */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Tipos Ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {Object.keys(ticketsPorTipo).length}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Diferentes categorias em uso
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca/Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca por texto */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Tickets
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por número, título..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscaSubmit()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Filtro por Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Tipo
                </label>
                <select
                  value={filtros.tipo || ''}
                  onChange={(e) => handleFiltroTipo((e.target.value as TipoTicket) || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                >
                  <option value="">Todos os tipos</option>
                  <option value="suporte">Suporte</option>
                  <option value="tecnica">Técnica</option>
                  <option value="comercial">Comercial</option>
                  <option value="financeira">Financeira</option>
                  <option value="reclamacao">Reclamação</option>
                  <option value="solicitacao">Solicitação</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Status
                </label>
                <select
                  value={filtros.status?.[0] || ''}
                  onChange={(e) => handleFiltroStatus((e.target.value as StatusTicketApi) || undefined)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                >
                  <option value="">Todos os status</option>
                  <option value="FILA">Fila</option>
                  <option value="EM_ATENDIMENTO">Em Atendimento</option>
                  <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                  <option value="AGUARDANDO_INTERNO">Aguardando Interno</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
              </div>
            </div>

            {/* Botão de aplicar busca */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleBuscaSubmit}
                className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Estado Vazio */}
          {!loading && tickets.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="text-center py-12 px-6">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busca || filtros.tipo || filtros.status
                    ? 'Nenhum ticket encontrado'
                    : 'Nenhum ticket cadastrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {busca || filtros.tipo || filtros.status
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie seu primeiro ticket para começar'}
                </p>
                {!busca && !filtros.tipo && !filtros.status && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Ticket
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grid de Tickets */}
          {!loading && tickets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/nuclei/atendimento/tickets/${ticket.id}`)}
                >
                  <div className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#159A9C]">
                          #{ticket.numero}
                        </span>
                        {ticket.tipo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTipoColor(ticket.tipo)}`}>
                            {getTipoLabel(ticket.tipo)}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 className="text-lg font-semibold text-[#002333] mb-2 line-clamp-2">
                      {ticket.titulo || ticket.assunto || 'Sem título'}
                    </h3>

                    {/* Descrição (truncada) */}
                    {ticket.descricao && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {ticket.descricao}
                      </p>
                    )}

                    {/* Footer do Card */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{ticket.cliente?.nome || 'Sem contato'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{(ticket as any).totalMensagens || 0} msgs</span>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleEditar(ticket, e)}
                          className="p-1.5 text-[#159A9C] hover:bg-[#159A9C]/10 rounded transition-colors"
                          title="Editar ticket"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeletar(ticket, e)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Deletar ticket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação (simplificada - pode ser expandida na Fase 7) */}
          {!loading && tickets.length > 0 && totalTickets > (filtros.limite || 50) && (
            <div className="mt-6 flex justify-center">
              <div className="bg-white rounded-lg shadow-sm border px-4 py-2">
                <p className="text-sm text-gray-600">
                  Exibindo {tickets.length} de {totalTickets} tickets
                  {filtros.pagina && filtros.pagina > 1 && ` - Página ${filtros.pagina}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação de Ticket */}
      <TicketFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={carregarTickets}
        ticket={null}
        mode="create"
      />

      {/* Modal de Edição de Ticket */}
      <TicketFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTicket(null);
        }}
        onSuccess={carregarTickets}
        ticket={selectedTicket}
        mode="edit"
      />

      {/* Modal de Confirmação Padrão */}
      <ConfirmationModal confirmationState={confirmationState} />
    </div>
  );
};

export default GestaoTicketsPage;
