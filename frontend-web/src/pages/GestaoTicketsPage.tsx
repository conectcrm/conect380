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
  Layers,
  Columns,
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
  clienteId?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

type ViewMode = 'table' | 'cards';
type Density = 'compact' | 'comfortable' | 'spacious';

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
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Colunas disponíveis e suas configurações
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('ticketsVisibleColumns');
    return saved
      ? JSON.parse(saved)
      : ['numero', 'prioridade', 'titulo', 'status', 'tipo', 'cliente', 'responsavel', 'sla', 'criado'];
  });

  // Definição de todas as colunas disponíveis
  const availableColumns = [
    { id: 'numero', label: 'Número', required: true },
    { id: 'prioridade', label: 'Prioridade' },
    { id: 'titulo', label: 'Título/Assunto', required: true },
    { id: 'status', label: 'Status' },
    { id: 'tipo', label: 'Tipo' },
    { id: 'cliente', label: 'Cliente' },
    { id: 'responsavel', label: 'Responsável' },
    { id: 'sla', label: 'SLA' },
    { id: 'criado', label: 'Criado em' },
  ];

  // Estados de filtros
  const [filtros, setFiltros] = useState<TicketFiltros>({
    empresaId: localStorage.getItem('empresaAtiva') || '',
    pagina: 1,
    limite: 50,
    sortField: 'created_at',
    sortDirection: 'desc',
  });
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  // Estados de seleção múltipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAtribuirModal, setShowAtribuirModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  // Dados para modais de ações em lote
  const [atendentes, setAtendentes] = useState<any[]>([]);
  const [filas, setFilas] = useState<any[]>([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState<any[]>([]);
  const [atendenteIdLote, setAtendenteIdLote] = useState<string>('');
  const [filaIdLote, setFilaIdLote] = useState<string>('');
  const [novoStatusLote, setNovoStatusLote] = useState<string>('');
  const [tagsIdsSelecionadas, setTagsIdsSelecionadas] = useState<string[]>([]);

  // Estados dos modais
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
  }, [filtros]);

  // Carregar dados para os modais de ações em lote
  useEffect(() => {
    const carregarDadosModais = async () => {
      try {
        const empresaId = localStorage.getItem('empresaAtiva') || '';

        // Carregar atendentes
        const resAtendentes = await api.get(`/users?empresaId=${empresaId}`);
        setAtendentes(resAtendentes.data?.data || resAtendentes.data || []);

        // Carregar filas
        const resFilas = await api.get(`/triagem/filas?empresaId=${empresaId}`);
        setFilas(resFilas.data?.data || resFilas.data || []);

        // Carregar tags
        const resTags = await api.get(`/atendimento/tags?empresaId=${empresaId}`);
        setTagsDisponiveis(resTags.data?.data || resTags.data || []);
      } catch (error) {
        console.error('Erro ao carregar dados para modais:', error);
      }
    };

    carregarDadosModais();
  }, []);

  const carregarTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const resultado = await ticketsService.listar(filtros);

      // Backend retorna array de tickets ou { data: tickets }
      let ticketsData = Array.isArray(resultado.data) ? resultado.data : (resultado.data as any)?.tickets || resultado.data || [];
      ticketsData = Array.isArray(ticketsData) ? ticketsData : [];

      // ✅ Backend agora faz a ordenação - usar dados diretos
      setTickets(ticketsData);
      setTotal((resultado.data as any)?.total || (resultado as any).total || ticketsData.length);
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
    setFiltros(prev => {
      const currentField = prev.sortField || 'createdAt';
      const currentDirection = prev.sortDirection || 'desc';

      return {
        ...prev,
        sortField: field === 'created_at' ? 'createdAt' : field,
        sortDirection: currentField === field
          ? (currentDirection === 'asc' ? 'desc' : 'asc')
          : 'asc',
        pagina: 1, // Reset para primeira página ao ordenar
      };
    });
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

  // Funções de controle de colunas visíveis
  const handleToggleColumn = (columnId: string) => {
    const column = availableColumns.find((col) => col.id === columnId);
    if (column?.required) return; // Não permitir desabilitar colunas obrigatórias

    setVisibleColumns((prev) => {
      const newColumns = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId];

      // Salvar no localStorage
      localStorage.setItem('ticketsVisibleColumns', JSON.stringify(newColumns));
      return newColumns;
    });
  };

  const handleResetColumns = () => {
    const defaultColumns = ['numero', 'prioridade', 'titulo', 'status', 'tipo', 'cliente', 'responsavel', 'sla', 'criado'];
    setVisibleColumns(defaultColumns);
    localStorage.setItem('ticketsVisibleColumns', JSON.stringify(defaultColumns));
    toast.success('Colunas restauradas para padrão');
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

  const handleEditar = (ticket: TicketType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const handleAtribuir = (ticket: TicketType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTicket(ticket);
    setShowAtribuirModal(true);
  };

  const handleDeletar = (ticket: TicketType, e?: React.MouseEvent) => {
    e?.stopPropagation();

    showConfirmation({
      title: 'Deletar Ticket',
      message: `Deseja realmente deletar o ticket #${ticket.numero}?\n\nTítulo: ${ticket.titulo || ticket.assunto || 'Sem título'}\n\nEsta ação não pode ser desfeita.`,
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

  // Ações em lote
  const handleAcoesEmLote = async (acao: 'atribuir' | 'status' | 'tags' | 'deletar') => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um ticket');
      return;
    }

    switch (acao) {
      case 'atribuir':
        setShowAtribuirModal(true);
        break;

      case 'status':
        setShowStatusModal(true);
        break;

      case 'tags':
        setShowTagsModal(true);
        break;

      case 'deletar':
        showConfirmation({
          title: 'Deletar Tickets',
          message: `Deseja realmente deletar ${selectedIds.length} ticket(s) selecionado(s)?\n\nEsta ação não pode ser desfeita.`,
          confirmText: 'Sim, Deletar Todos',
          cancelText: 'Cancelar',
          icon: 'danger',
          confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          onConfirm: async () => {
            try {
              setLoading(true);

              // Usar endpoint de lote otimizado
              const resultado = await ticketsService.deletarLote(selectedIds, true);

              if (resultado.successful > 0) {
                toast.success(`${resultado.successful} ticket(s) deletado(s) com sucesso!`);
              }
              if (resultado.failed > 0) {
                toast.error(`Falha ao deletar ${resultado.failed} ticket(s)`);
                console.error('Erros:', resultado.errors);
              }

              setSelectedIds([]);
              await carregarTickets();
            } catch (error) {
              console.error('Erro ao deletar lote:', error);
              toast.error('Erro ao deletar tickets em lote');
            } finally {
              setLoading(false);
            }
          },
        });
        break;
    }
  };

  // Handler para confirmar atribuição em lote
  const handleConfirmarAtribuicao = async () => {
    if (!atendenteIdLote && !filaIdLote) {
      toast.error('Selecione um atendente ou uma fila');
      return;
    }

    try {
      setLoading(true);

      const resultado = await ticketsService.atribuirLote(
        selectedIds,
        atendenteIdLote || undefined,
        filaIdLote || undefined,
        undefined
      );

      if (resultado.successful > 0) {
        toast.success(`${resultado.successful} ticket(s) atribuído(s) com sucesso!`);
      }
      if (resultado.failed > 0) {
        toast.error(`Falha ao atribuir ${resultado.failed} ticket(s)`);
        console.error('Erros:', resultado.errors);
      }

      setShowAtribuirModal(false);
      setAtendenteIdLote('');
      setFilaIdLote('');
      setSelectedIds([]);
      await carregarTickets();
    } catch (error) {
      console.error('Erro ao atribuir lote:', error);
      toast.error('Erro ao atribuir tickets em lote');
    } finally {
      setLoading(false);
    }
  };

  // Handler para confirmar mudança de status em lote
  const handleConfirmarStatus = async () => {
    if (!novoStatusLote) {
      toast.error('Selecione um status');
      return;
    }

    try {
      setLoading(true);

      const resultado = await ticketsService.mudarStatusLote(
        selectedIds,
        novoStatusLote as any,
        undefined
      );

      if (resultado.successful > 0) {
        toast.success(`${resultado.successful} ticket(s) atualizado(s) com sucesso!`);
      }
      if (resultado.failed > 0) {
        toast.error(`Falha ao atualizar ${resultado.failed} ticket(s)`);
        console.error('Erros:', resultado.errors);
      }

      setShowStatusModal(false);
      setNovoStatusLote('');
      setSelectedIds([]);
      await carregarTickets();
    } catch (error) {
      console.error('Erro ao mudar status em lote:', error);
      toast.error('Erro ao mudar status em lote');
    } finally {
      setLoading(false);
    }
  };

  // Handler para confirmar adição de tags em lote
  const handleConfirmarTags = async () => {
    if (tagsIdsSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma tag');
      return;
    }

    try {
      setLoading(true);

      const resultado = await ticketsService.adicionarTagsLote(
        selectedIds,
        tagsIdsSelecionadas
      );

      if (resultado.successful > 0) {
        toast.success(`Tags adicionadas em ${resultado.successful} ticket(s)!`);
      }
      if (resultado.failed > 0) {
        toast.error(`Falha em ${resultado.failed} ticket(s)`);
        console.error('Erros:', resultado.errors);
      }

      setShowTagsModal(false);
      setTagsIdsSelecionadas([]);
      setSelectedIds([]);
      await carregarTickets();
    } catch (error) {
      console.error('Erro ao adicionar tags em lote:', error);
      toast.error('Erro ao adicionar tags em lote');
    } finally {
      setLoading(false);
    }
  };

  // Handler para toggle de tag selecionada
  const handleToggleTag = (tagId: string) => {
    setTagsIdsSelecionadas(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Handler para exportar CSV
  const handleExportarCSV = async () => {
    try {
      setLoading(true);
      toast.loading('Gerando arquivo CSV...', { id: 'export-csv' });

      const csv = await ticketsService.exportarCSV(filtros);

      // Criar blob e fazer download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `tickets_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exportado com sucesso!', { id: 'export-csv' });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV', { id: 'export-csv' });
    } finally {
      setLoading(false);
    }
  };

  // Paginação
  const handlePaginacao = (novaPagina: number) => {
    setFiltros((prev) => ({ ...prev, pagina: novaPagina }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimite = (novoLimite: number) => {
    setFiltros((prev) => ({ ...prev, limite: novoLimite, pagina: 1 }));
  };

  // Calcular métricas para KPI cards
  const totalTickets = total;
  const ticketsAbertos = tickets.filter((t) =>
    ['FILA', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_INTERNO'].includes(t.status)
  ).length;
  const ticketsFechados = tickets.filter((t) =>
    ['CONCLUIDO', 'CANCELADO', 'ENCERRADO'].includes(t.status)
  ).length;
  const ticketsUrgentes = tickets.filter((t) => t.prioridade === 'URGENTE').length;

  // Labels
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

  const totalPaginas = Math.ceil(total / (filtros.limite || 50));
  const paginaAtual = filtros.pagina || 1;

  const filtrosAtivos = Object.keys(filtros).filter((key) => {
    if (key === 'empresaId' || key === 'pagina' || key === 'limite') return false;
    return filtros[key as keyof TicketFiltros] !== undefined;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Breadcrumb */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
      </div>

      <div className="p-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
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

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Toggle de Visualização */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-2 rounded-md transition-colors ${viewMode === 'table'
                        ? 'bg-white text-[#159A9C] shadow-sm'
                        : 'text-gray-600 hover:text-[#159A9C]'
                        }`}
                      title="Visualização em Tabela"
                    >
                      <List className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-2 rounded-md transition-colors ${viewMode === 'cards'
                        ? 'bg-white text-[#159A9C] shadow-sm'
                        : 'text-gray-600 hover:text-[#159A9C]'
                        }`}
                      title="Visualização em Cards"
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Densidade (apenas para tabela) */}
                  {viewMode === 'table' && (
                    <div className="relative group">
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Layers className="h-5 w-5 text-gray-600" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 hidden group-hover:block z-20 min-w-[160px]">
                        <button
                          onClick={() => setDensity('compact')}
                          className={`w-full text-left px-3 py-2 rounded text-sm ${density === 'compact' ? 'bg-[#159A9C]/10 text-[#159A9C]' : 'hover:bg-gray-100'
                            }`}
                        >
                          Compacta
                        </button>
                        <button
                          onClick={() => setDensity('comfortable')}
                          className={`w-full text-left px-3 py-2 rounded text-sm ${density === 'comfortable' ? 'bg-[#159A9C]/10 text-[#159A9C]' : 'hover:bg-gray-100'
                            }`}
                        >
                          Confortável
                        </button>
                        <button
                          onClick={() => setDensity('spacious')}
                          className={`w-full text-left px-3 py-2 rounded text-sm ${density === 'spacious' ? 'bg-[#159A9C]/10 text-[#159A9C]' : 'hover:bg-gray-100'
                            }`}
                        >
                          Espaçosa
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Controle de Colunas (apenas para tabela) */}
                  {viewMode === 'table' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        className={`px-3 py-2 border rounded-lg transition-colors flex items-center gap-2 ${showColumnMenu
                          ? 'border-[#159A9C] bg-[#159A9C]/5 text-[#159A9C]'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                        title="Selecionar Colunas"
                      >
                        <Columns className="h-5 w-5" />
                        <span className="text-sm hidden sm:inline">Colunas</span>
                      </button>

                      {showColumnMenu && (
                        <>
                          {/* Overlay para fechar ao clicar fora */}
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setShowColumnMenu(false)}
                          />

                          {/* Menu de Seleção de Colunas */}
                          <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-xl p-4 z-40 min-w-[280px]">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-[#002333]">
                                Colunas Visíveis
                              </h3>
                              <button
                                onClick={handleResetColumns}
                                className="text-xs text-[#159A9C] hover:text-[#0F7B7D] font-medium"
                              >
                                Restaurar Padrão
                              </button>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                              {availableColumns.map((column) => {
                                const isVisible = visibleColumns.includes(column.id);
                                const isRequired = column.required;

                                return (
                                  <label
                                    key={column.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isRequired
                                      ? 'bg-gray-50 cursor-not-allowed'
                                      : 'hover:bg-gray-50 cursor-pointer'
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isVisible}
                                      onChange={() => handleToggleColumn(column.id)}
                                      disabled={isRequired}
                                      className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C] disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className={`text-sm ${isRequired ? 'text-gray-500' : 'text-gray-700'}`}>
                                      {column.label}
                                      {isRequired && (
                                        <span className="ml-1 text-xs text-gray-400">(obrigatória)</span>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>

                            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                              {visibleColumns.length} de {availableColumns.length} colunas visíveis
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={carregarTickets}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Recarregar tickets"
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleExportarCSV}
                    disabled={loading || tickets.length === 0}
                    className="px-4 py-2 border border-[#159A9C] text-[#159A9C] rounded-lg hover:bg-[#159A9C]/10 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                    title="Exportar para CSV"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 - Total */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Total</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{totalTickets}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Todos os tickets</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Ticket className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2 - Em Aberto */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Em Aberto</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{ticketsAbertos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Necessitam ação</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Card 3 - Finalizados */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Finalizados</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{ticketsFechados}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Concluídos/Cancelados</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Urgentes */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Urgentes</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{ticketsUrgentes}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Alta prioridade</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="space-y-4">
              {/* Primeira linha: Busca + Filtros Rápidos */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Busca (em tempo real) */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por número, título, descrição..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                    />
                    {busca && (
                      <button
                        onClick={() => setBusca('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro por Tipo */}
                <select
                  value={filtros.tipo || ''}
                  onChange={(e) => handleFiltroRapido('tipo', (e.target.value as TipoTicket) || undefined)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors min-w-[180px]"
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

                {/* Filtro por Status */}
                <select
                  value={filtros.status?.[0] || ''}
                  onChange={(e) =>
                    handleFiltroRapido('status', e.target.value ? [e.target.value as StatusTicketApi] : undefined)
                  }
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors min-w-[200px]"
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

                {/* Filtro por Prioridade */}
                <select
                  value={filtros.prioridade || ''}
                  onChange={(e) =>
                    handleFiltroRapido('prioridade', (e.target.value as PrioridadeTicketApi) || undefined)
                  }
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors min-w-[160px]"
                >
                  <option value="">Todas prioridades</option>
                  <option value="URGENTE">🔴 Urgente</option>
                  <option value="ALTA">🟠 Alta</option>
                  <option value="MEDIA">🟡 Média</option>
                  <option value="BAIXA">🟢 Baixa</option>
                </select>

                {/* Botão Filtros Avançados */}
                <button
                  onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                  className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${showFiltrosAvancados || filtrosAtivos > 0
                    ? 'border-[#159A9C] bg-[#159A9C]/5 text-[#159A9C]'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                >
                  <Filter className="h-5 w-5" />
                  Filtros
                  {filtrosAtivos > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-[#159A9C] text-white text-xs rounded-full">
                      {filtrosAtivos}
                    </span>
                  )}
                </button>

                {/* Limpar Filtros */}
                {filtrosAtivos > 0 && (
                  <button
                    onClick={handleLimparFiltros}
                    className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Filtros Avançados (expansível) */}
              {showFiltrosAvancados && (
                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-3">Filtros Avançados</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Período */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
                      <select
                        onChange={(e) => {
                          const hoje = new Date();
                          let dataInicio: string | undefined;

                          switch (e.target.value) {
                            case 'hoje':
                              dataInicio = hoje.toISOString().split('T')[0];
                              handleFiltroRapido('dataInicio', dataInicio);
                              handleFiltroRapido('dataFim', dataInicio);
                              break;
                            case 'semana':
                              const inicioSemana = new Date(hoje);
                              inicioSemana.setDate(hoje.getDate() - 7);
                              handleFiltroRapido('dataInicio', inicioSemana.toISOString().split('T')[0]);
                              handleFiltroRapido('dataFim', undefined);
                              break;
                            case 'mes':
                              const inicioMes = new Date(hoje);
                              inicioMes.setDate(hoje.getDate() - 30);
                              handleFiltroRapido('dataInicio', inicioMes.toISOString().split('T')[0]);
                              handleFiltroRapido('dataFim', undefined);
                              break;
                            default:
                              handleFiltroRapido('dataInicio', undefined);
                              handleFiltroRapido('dataFim', undefined);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] text-sm"
                      >
                        <option value="">Qualquer período</option>
                        <option value="hoje">Hoje</option>
                        <option value="semana">Última semana</option>
                        <option value="mes">Último mês</option>
                      </select>
                    </div>

                    {/* SLA Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status SLA</label>
                      <select
                        value={filtros.slaStatus || ''}
                        onChange={(e) =>
                          handleFiltroRapido(
                            'slaStatus',
                            e.target.value ? (e.target.value as 'vencido' | 'proximo' | 'em_dia') : undefined
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] text-sm"
                      >
                        <option value="">Todos os SLA</option>
                        <option value="vencido">❌ Vencido</option>
                        <option value="proximo">⚠️ Próximo do vencimento</option>
                        <option value="em_dia">✅ Em dia</option>
                      </select>
                    </div>

                    {/* Responsável */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Responsável</label>
                      <select
                        value={filtros.responsavelId || ''}
                        onChange={(e) => handleFiltroRapido('responsavelId', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] text-sm"
                      >
                        <option value="">Todos</option>
                        <option value="sem_responsavel">Sem responsável</option>
                        <option value="meus">Meus tickets</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Barra de Ações em Lote (aparece quando há seleção) */}
          {selectedIds.length > 0 && (
            <div className="bg-[#159A9C]/10 border border-[#159A9C] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#002333]">
                    {selectedIds.length} ticket(s) selecionado(s)
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-[#159A9C] hover:text-[#0F7B7D] font-medium"
                  >
                    Limpar seleção
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcoesEmLote('atribuir')}
                    className="px-3 py-2 bg-white border border-[#159A9C] text-[#159A9C] rounded-lg hover:bg-[#159A9C] hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Atribuir
                  </button>
                  <button
                    onClick={() => handleAcoesEmLote('status')}
                    className="px-3 py-2 bg-white border border-[#159A9C] text-[#159A9C] rounded-lg hover:bg-[#159A9C] hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mudar Status
                  </button>
                  <button
                    onClick={() => handleAcoesEmLote('tags')}
                    className="px-3 py-2 bg-white border border-[#159A9C] text-[#159A9C] rounded-lg hover:bg-[#159A9C] hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Tag className="h-4 w-4" />
                    Adicionar Tags
                  </button>
                  <div className="h-6 w-px bg-[#159A9C]"></div>
                  <button
                    onClick={() => handleAcoesEmLote('deletar')}
                    className="px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          )}

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
              <div className="text-center py-16 px-6">
                <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {busca || filtrosAtivos > 0 ? 'Nenhum ticket encontrado' : 'Nenhum ticket cadastrado'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {busca || filtrosAtivos > 0
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie seu primeiro ticket para começar'}
                </p>
                {!busca && filtrosAtivos === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeiro Ticket
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Visualização em Tabela */}
          {!loading && tickets.length > 0 && viewMode === 'table' && (
            <TicketsTable
              tickets={tickets}
              onEdit={handleEditar}
              onDelete={handleDeletar}
              onAtribuir={handleAtribuir}
              selectedIds={selectedIds}
              onSelectToggle={handleSelectToggle}
              onSelectAll={handleSelectAll}
              sortField={filtros.sortField || 'createdAt'}
              sortDirection={filtros.sortDirection || 'desc'}
              onSort={handleSort}
              density={density}
              visibleColumns={visibleColumns}
            />
          )}

          {/* Visualização em Cards */}
          {!loading && tickets.length > 0 && viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow cursor-pointer group relative"
                  onClick={() => navigate(`/nuclei/atendimento/tickets/${ticket.id}`)}
                >
                  {/* Checkbox de seleção (canto superior esquerdo) */}
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ticket.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectToggle(ticket.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  <div className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#159A9C]">#{ticket.numero}</span>
                        {ticket.tipo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getTipoColor(ticket.tipo)}`}>
                            {getTipoLabel(ticket.tipo)}
                          </span>
                        )}
                        {ticket.prioridade === 'URGENTE' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Urgente
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

                    {/* Descrição */}
                    {ticket.descricao && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ticket.descricao}</p>
                    )}

                    {/* Info: Cliente e Responsável */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <User className="h-3.5 w-3.5" />
                        <span>Cliente: {ticket.cliente?.nome || 'Sem cliente'}</span>
                      </div>
                      {ticket.responsavel && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Responsável: {ticket.responsavel.nome}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer do Card */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAtribuir(ticket, e);
                          }}
                          className="p-1.5 text-[#159A9C] hover:bg-[#159A9C]/10 rounded transition-colors"
                          title="Atribuir"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditar(ticket, e);
                          }}
                          className="p-1.5 text-[#159A9C] hover:bg-[#159A9C]/10 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletar(ticket, e);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Deletar"
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

          {/* Paginação */}
          {!loading && tickets.length > 0 && totalPaginas > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Info de exibição */}
              <div className="text-sm text-gray-600">
                Exibindo {(paginaAtual - 1) * (filtros.limite || 50) + 1} até{' '}
                {Math.min(paginaAtual * (filtros.limite || 50), total)} de {total} tickets
              </div>

              {/* Controles de paginação */}
              <div className="flex items-center gap-2">
                {/* Botão Anterior */}
                <button
                  onClick={() => handlePaginacao(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(totalPaginas, 5))].map((_, i) => {
                    let pageNum: number;
                    if (totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (paginaAtual <= 3) {
                      pageNum = i + 1;
                    } else if (paginaAtual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i;
                    } else {
                      pageNum = paginaAtual - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handlePaginacao(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${paginaAtual === pageNum
                          ? 'bg-[#159A9C] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Botão Próximo */}
                <button
                  onClick={() => handlePaginacao(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Seletor de limite */}
                <select
                  value={filtros.limite}
                  onChange={(e) => handleLimite(Number(e.target.value))}
                  className="ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] text-sm"
                >
                  <option value={10}>10 / página</option>
                  <option value={25}>25 / página</option>
                  <option value={50}>50 / página</option>
                  <option value={100}>100 / página</option>
                </select>
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

      {/* Modal de Atribuir (se existir) */}
      {showAtribuirModal && selectedTicket && (
        <AtribuirTicketModal
          isOpen={showAtribuirModal}
          onClose={() => {
            setShowAtribuirModal(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
          onSuccess={carregarTickets}
        />
      )}

      {/* Modal de Atribuir em Lote */}
      {showAtribuirModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#002333] flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#159A9C]" />
                Atribuir {selectedIds.length} Ticket(s)
              </h3>
              <button
                onClick={() => {
                  setShowAtribuirModal(false);
                  setAtendenteIdLote('');
                  setFilaIdLote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atendente
                </label>
                <select
                  value={atendenteIdLote}
                  onChange={(e) => setAtendenteIdLote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="">Selecione um atendente</option>
                  {atendentes.map((atendente) => (
                    <option key={atendente.id} value={atendente.id}>
                      {atendente.nome || atendente.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-sm text-gray-500">ou</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fila
                </label>
                <select
                  value={filaIdLote}
                  onChange={(e) => setFilaIdLote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="">Selecione uma fila</option>
                  {filas.map((fila) => (
                    <option key={fila.id} value={fila.id}>
                      {fila.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAtribuirModal(false);
                  setAtendenteIdLote('');
                  setFilaIdLote('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAtribuicao}
                disabled={loading || (!atendenteIdLote && !filaIdLote)}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atribuindo...' : 'Confirmar Atribuição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mudar Status em Lote */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#002333] flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#159A9C]" />
                Mudar Status de {selectedIds.length} Ticket(s)
              </h3>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNovoStatusLote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novo Status
              </label>
              <select
                value={novoStatusLote}
                onChange={(e) => setNovoStatusLote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="">Selecione um status</option>
                <option value="FILA">Fila</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                <option value="AGUARDANDO_INTERNO">Aguardando Interno</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNovoStatusLote('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarStatus}
                disabled={loading || !novoStatusLote}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Confirmar Mudança'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Tags em Lote */}
      {showTagsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#002333] flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#159A9C]" />
                Adicionar Tags em {selectedIds.length} Ticket(s)
              </h3>
              <button
                onClick={() => {
                  setShowTagsModal(false);
                  setTagsIdsSelecionadas([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecione as Tags
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tagsDisponiveis.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma tag disponível</p>
                ) : (
                  tagsDisponiveis.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={tagsIdsSelecionadas.includes(tag.id)}
                        onChange={() => handleToggleTag(tag.id)}
                        className="w-4 h-4 text-[#159A9C] border-gray-300 rounded focus:ring-[#159A9C]"
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.cor || '#159A9C' }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {tag.nome}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {tagsIdsSelecionadas.length > 0 && (
                <p className="mt-3 text-sm text-[#159A9C]">
                  {tagsIdsSelecionadas.length} tag(s) selecionada(s)
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTagsModal(false);
                  setTagsIdsSelecionadas([]);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarTags}
                disabled={loading || tagsIdsSelecionadas.length === 0}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adicionando...' : `Adicionar ${tagsIdsSelecionadas.length} Tag(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Padrão */}
      <ConfirmationModal confirmationState={confirmationState} />
    </div>
  );
};

export default GestaoTicketsPage;
