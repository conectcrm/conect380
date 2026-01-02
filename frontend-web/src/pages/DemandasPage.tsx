import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
/**
 * @deprecated Sprint 1: Este import está obsoleto
 * Migrado para usar ticketService com filtro tipo
 */
import demandaService, {
  Demanda,
  StatusDemanda,
  TipoDemanda,
  PrioridadeDemanda,
  tipoLabels,
  statusLabels,
  prioridadeLabels,
  tipoColors,
  statusColors,
  prioridadeColors,
} from '../services/demandaService';
// Sprint 2: Usar ticketService com filtro tipo
import { ticketsService, Ticket, TipoTicket, tipoTicketLabels, tipoTicketColors } from '../services/ticketsService';
import { useAuth } from '../hooks/useAuth';

/**
 * DemandasPage - Sprint 2: Migrado para usar Tickets com tipo='demanda'
 * 
 * Antes: demandaService.listar()
 * Depois: ticketService.listar({ empresaId, tipo: 'suporte' })
 * 
 * Esta página agora lista tickets filtrados por tipo, mantendo a mesma UI.
 */
export default function DemandasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados - Sprint 2: Usando interface Ticket
  const [demandas, setDemandas] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros - Sprint 2: Mantidos compatíveis
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string | 'todas'>('todas');
  const [filtroTipo, setFiltroTipo] = useState<TipoTicket | 'todos'>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | 'todas'>('todas');

  // Carregar demandas - Sprint 2: Usando ticketService.listar()
  useEffect(() => {
    carregarDemandas();
  }, []);

  const carregarDemandas = async () => {
    if (!user?.empresa?.id) {
      setError('Empresa não identificada');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Sprint 2: Buscar tickets com tipo (demanda foi migrada como tipo='suporte')
      const response = await ticketsService.listar({
        empresaId: user.empresa.id,
        tipo: 'suporte', // Demandas foram migradas como tipo='suporte'
      });

      setDemandas(response.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar demandas (tickets):', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar demandas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas - Sprint 2: Calculadas a partir dos tickets
  const stats = {
    total: demandas.length,
    abertas: demandas.filter((d) =>
      d.status === 'ABERTO' || d.status === 'FILA'
    ).length,
    emAndamento: demandas.filter((d) =>
      d.status === 'EM_ATENDIMENTO'
    ).length,
    aguardandoCliente: demandas.filter((d) =>
      d.status === 'AGUARDANDO' || d.status === 'AGUARDANDO_CLIENTE'
    ).length,
    concluidas: demandas.filter((d) =>
      d.status === 'RESOLVIDO' || d.status === 'CONCLUIDO' || d.status === 'ENCERRADO'
    ).length,
    canceladas: demandas.filter((d) =>
      d.status === 'CANCELADO'
    ).length,
    criticas: demandas.filter((d) =>
      d.prioridade === 'URGENTE' || d.severity === 'CRITICA'
    ).length,
  };

  // Filtrar demandas - Sprint 2: Adaptado para interface Ticket
  const demandasFiltradas = demandas.filter((demanda) => {
    // Busca por texto
    const matchSearch =
      searchTerm === '' ||
      (demanda.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (demanda.descricao?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (demanda.numero?.toString().includes(searchTerm));

    // Filtro de status - Sprint 2: Status do ticket
    const matchStatus =
      filtroStatus === 'todas' ||
      demanda.status?.toString() === filtroStatus ||
      // Compatibilidade com status antigos
      (filtroStatus === 'aberta' && (demanda.status === 'ABERTO' || demanda.status === 'FILA')) ||
      (filtroStatus === 'em_andamento' && demanda.status === 'EM_ATENDIMENTO') ||
      (filtroStatus === 'aguardando_cliente' && (demanda.status === 'AGUARDANDO' || demanda.status === 'AGUARDANDO_CLIENTE')) ||
      (filtroStatus === 'concluida' && (demanda.status === 'RESOLVIDO' || demanda.status === 'CONCLUIDO' || demanda.status === 'ENCERRADO')) ||
      (filtroStatus === 'cancelada' && demanda.status === 'CANCELADO');

    // Filtro de tipo - Sprint 2: Tipo do ticket
    const matchTipo = filtroTipo === 'todos' || demanda.tipo === filtroTipo;

    // Filtro de prioridade
    const matchPrioridade =
      filtroPrioridade === 'todas' ||
      demanda.prioridade?.toString() === filtroPrioridade ||
      // Compatibilidade com prioridades antigas (lowercase)
      demanda.prioridade?.toLowerCase() === filtroPrioridade;

    return matchSearch && matchStatus && matchTipo && matchPrioridade;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
        </div>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin" />
              <span className="ml-3 text-[#002333]">Carregando demandas...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
      </div>

      {/* Container Principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Título da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <h1 className="text-3xl font-bold text-[#002333] flex items-center">
              <ClipboardList className="h-8 w-8 mr-3 text-[#159A9C]" />
              Gestão de Demandas
            </h1>
            <p className="text-[#B4BEC9] mt-2">
              Acompanhe e gerencie todas as demandas do sistema
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Erro ao carregar demandas</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={carregarDemandas}
                  className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total de Demandas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{stats.total}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Todas as demandas no sistema
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <ClipboardList className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Abertas */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Abertas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{stats.abertas}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Aguardando atendimento
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Em Andamento */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Em Andamento
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{stats.emAndamento}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Sendo trabalhadas
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Críticas */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Críticas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{stats.criticas}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Requerem atenção urgente
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#B4BEC9]" />
                  <input
                    type="text"
                    placeholder="Buscar por título, descrição ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro Status */}
              <div className="w-full lg:w-48">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as StatusDemanda | 'todas')}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="todas">Todos os status</option>
                  {(Object.keys(statusLabels) as StatusDemanda[]).map((key) => (
                    <option key={key} value={key}>
                      {statusLabels[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Tipo */}
              <div className="w-full lg:w-48">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as TipoTicket | 'todos')}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="todos">Todos os tipos</option>
                  {(Object.keys(tipoTicketLabels) as TipoTicket[]).map((key) => (
                    <option key={key} value={key}>
                      {tipoTicketLabels[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Prioridade */}
              <div className="w-full lg:w-48">
                <select
                  value={filtroPrioridade}
                  onChange={(e) => setFiltroPrioridade(e.target.value as PrioridadeDemanda | 'todas')}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="todas">Todas as prioridades</option>
                  {(Object.keys(prioridadeLabels) as PrioridadeDemanda[]).map((key) => (
                    <option key={key} value={key}>
                      {prioridadeLabels[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão Limpar Filtros */}
              {(searchTerm || filtroStatus !== 'todas' || filtroTipo !== 'todos' || filtroPrioridade !== 'todas') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFiltroStatus('todas');
                    setFiltroTipo('todos');
                    setFiltroPrioridade('todas');
                  }}
                  className="px-4 py-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Grid de Demandas */}
          {demandasFiltradas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Filter className="h-16 w-16 text-[#B4BEC9] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#002333] mb-2">
                Nenhuma demanda encontrada
              </h3>
              <p className="text-[#B4BEC9] mb-6">
                {searchTerm || filtroStatus !== 'todas' || filtroTipo !== 'todos' || filtroPrioridade !== 'todas'
                  ? 'Tente ajustar os filtros ou realizar uma nova busca'
                  : 'Não há demandas cadastradas no momento'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demandasFiltradas.map((demanda) => (
                <div
                  key={demanda.id}
                  onClick={() => navigate(`/nuclei/atendimento/demandas/${demanda.id}`)}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#002333] flex-1 pr-2">
                      {demanda.titulo}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prioridadeColors[demanda.prioridade]}`}>
                      {prioridadeLabels[demanda.prioridade]}
                    </span>
                  </div>

                  {/* Descrição */}
                  {demanda.descricao && (
                    <p className="text-sm text-[#B4BEC9] mb-4 line-clamp-2">
                      {demanda.descricao}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {demanda.tipo && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoTicketColors[demanda.tipo]}`}>
                        {tipoTicketLabels[demanda.tipo]}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[demanda.status]}`}>
                      {statusLabels[demanda.status]}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-[#DEEFE7] text-xs text-[#B4BEC9]">
                    <p>
                      Criada em {new Date(demanda.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
