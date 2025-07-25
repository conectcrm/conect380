import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, AlertCircle, CheckCircle, Clock, User, Calendar, ArrowUp, ArrowDown, MessageSquare, Paperclip, Eye } from 'lucide-react';

interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  categoria: string;
  cliente: string;
  agente?: string;
  criadoEm: Date;
  atualizadoEm: Date;
  respostasSla: {
    primeira: number; // horas
    resolucao: number; // horas
  };
  anexos: number;
  interacoes: number;
}

interface TicketSuporteProps {
  searchTerm: string;
}

export const TicketSuporte: React.FC<TicketSuporteProps> = ({ searchTerm }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('todas');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<'recente' | 'prioridade' | 'status'>('recente');
  const [showModalNovoTicket, setShowModalNovoTicket] = useState(false);

  const tickets: Ticket[] = [
    {
      id: 'TCK-001',
      titulo: 'Erro ao importar contatos via CSV',
      descricao: 'Sistema apresenta erro 500 ao tentar importar arquivo CSV com mais de 1000 contatos.',
      status: 'aberto',
      prioridade: 'alta',
      categoria: 'Técnico',
      cliente: 'João Silva - Empresa ABC',
      criadoEm: new Date(Date.now() - 2 * 60 * 60 * 1000),
      atualizadoEm: new Date(Date.now() - 1 * 60 * 60 * 1000),
      respostasSla: { primeira: 2, resolucao: 24 },
      anexos: 2,
      interacoes: 3
    },
    {
      id: 'TCK-002',
      titulo: 'Dúvida sobre integração com WhatsApp',
      descricao: 'Como configurar a integração com WhatsApp Business API?',
      status: 'em_andamento',
      prioridade: 'media',
      categoria: 'Integração',
      cliente: 'Maria Santos - TechCorp',
      agente: 'Ana Silva',
      criadoEm: new Date(Date.now() - 6 * 60 * 60 * 1000),
      atualizadoEm: new Date(Date.now() - 30 * 60 * 1000),
      respostasSla: { primeira: 1, resolucao: 12 },
      anexos: 1,
      interacoes: 5
    },
    {
      id: 'TCK-003',
      titulo: 'Relatório de vendas não carrega',
      descricao: 'O relatório de vendas fica carregando indefinidamente desde ontem.',
      status: 'aguardando_cliente',
      prioridade: 'alta',
      categoria: 'Relatórios',
      cliente: 'Pedro Costa - Vendas Pro',
      agente: 'Carlos Lima',
      criadoEm: new Date(Date.now() - 24 * 60 * 60 * 1000),
      atualizadoEm: new Date(Date.now() - 4 * 60 * 60 * 1000),
      respostasSla: { primeira: 0.5, resolucao: 18 },
      anexos: 0,
      interacoes: 7
    },
    {
      id: 'TCK-004',
      titulo: 'Solicitação de upgrade de plano',
      descricao: 'Gostaria de fazer upgrade do plano Starter para Professional.',
      status: 'resolvido',
      prioridade: 'baixa',
      categoria: 'Comercial',
      cliente: 'Ana Oliveira - StartupXYZ',
      agente: 'Fernanda Rocha',
      criadoEm: new Date(Date.now() - 48 * 60 * 60 * 1000),
      atualizadoEm: new Date(Date.now() - 12 * 60 * 60 * 1000),
      respostasSla: { primeira: 1, resolucao: 36 },
      anexos: 1,
      interacoes: 4
    },
    {
      id: 'TCK-005',
      titulo: 'Sistema lento durante horário comercial',
      descricao: 'O sistema fica muito lento entre 9h e 17h, principalmente na tela de clientes.',
      status: 'em_andamento',
      prioridade: 'critica',
      categoria: 'Performance',
      cliente: 'Roberto Alves - MegaCorp',
      agente: 'Ana Silva',
      criadoEm: new Date(Date.now() - 3 * 60 * 60 * 1000),
      atualizadoEm: new Date(Date.now() - 15 * 60 * 1000),
      respostasSla: { primeira: 0.25, resolucao: 8 },
      anexos: 3,
      interacoes: 8
    }
  ];

  const statusOptions = ['todos', 'aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'];
  const prioridadeOptions = ['todas', 'baixa', 'media', 'alta', 'critica'];
  const categoriaOptions = ['todas', 'Técnico', 'Integração', 'Relatórios', 'Comercial', 'Performance', 'Billing', 'Treinamento'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'aguardando_cliente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolvido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fechado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return 'bg-red-500 text-white';
      case 'alta':
        return 'bg-orange-500 text-white';
      case 'media':
        return 'bg-yellow-500 text-white';
      case 'baixa':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
      case 'alta':
        return <ArrowUp className="w-4 h-4" />;
      case 'baixa':
        return <ArrowDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto':
        return <AlertCircle className="w-4 h-4" />;
      case 'em_andamento':
        return <Clock className="w-4 h-4" />;
      case 'aguardando_cliente':
        return <User className="w-4 h-4" />;
      case 'resolvido':
        return <CheckCircle className="w-4 h-4" />;
      case 'fechado':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredTickets = useMemo(() => {
    let filtered = tickets.filter(ticket => {
      const matchesSearch = !searchTerm || 
        ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === 'todos' || ticket.status === selectedStatus;
      const matchesPrioridade = selectedPrioridade === 'todas' || ticket.prioridade === selectedPrioridade;
      const matchesCategoria = selectedCategoria === 'todas' || ticket.categoria === selectedCategoria;
      
      return matchesSearch && matchesStatus && matchesPrioridade && matchesCategoria;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'prioridade':
          const prioridadeOrder = { 'critica': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
          return prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] - prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder];
        case 'status':
          return a.status.localeCompare(b.status);
        case 'recente':
        default:
          return b.atualizadoEm.getTime() - a.atualizadoEm.getTime();
      }
    });

    return filtered;
  }, [searchTerm, selectedStatus, selectedPrioridade, selectedCategoria, sortBy, tickets]);

  const formatarTempo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else {
      return `${diffDays}d atrás`;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em_andamento':
        return 'Em Andamento';
      case 'aguardando_cliente':
        return 'Aguardando Cliente';
      case 'resolvido':
        return 'Resolvido';
      case 'fechado':
        return 'Fechado';
      default:
        return status;
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return 'Baixa';
      case 'media':
        return 'Média';
      case 'alta':
        return 'Alta';
      case 'critica':
        return 'Crítica';
      default:
        return prioridade;
    }
  };

  // Estatísticas rápidas
  const stats = {
    total: tickets.length,
    abertos: tickets.filter(t => t.status === 'aberto').length,
    emAndamento: tickets.filter(t => t.status === 'em_andamento').length,
    criticos: tickets.filter(t => t.prioridade === 'critica').length
  };

  return (
    <div className="space-y-6">
      {/* Header e Estatísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-[#002333]">
            Tickets de Suporte
          </h2>
          
          <button
            onClick={() => setShowModalNovoTicket(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7d] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Ticket</span>
          </button>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#002333]">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.abertos}</div>
            <div className="text-sm text-gray-600">Abertos</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
            <div className="text-sm text-gray-600">Em Andamento</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.criticos}</div>
            <div className="text-sm text-gray-600">Críticos</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status === 'todos' ? 'Todos os Status' : getStatusLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={selectedPrioridade}
            onChange={(e) => setSelectedPrioridade(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            {prioridadeOptions.map(prioridade => (
              <option key={prioridade} value={prioridade}>
                {prioridade === 'todas' ? 'Todas as Prioridades' : getPrioridadeLabel(prioridade)}
              </option>
            ))}
          </select>

          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            {categoriaOptions.map(categoria => (
              <option key={categoria} value={categoria}>
                {categoria === 'todas' ? 'Todas as Categorias' : categoria}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recente' | 'prioridade' | 'status')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            <option value="recente">Mais Recentes</option>
            <option value="prioridade">Prioridade</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredTickets.length} de {tickets.length} tickets
        </div>
      </div>

      {/* Lista de Tickets */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum ticket encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou criar um novo ticket
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-sm text-[#159A9C] font-medium">
                      {ticket.id}
                    </span>
                    
                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span>{getStatusLabel(ticket.status)}</span>
                    </span>

                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(ticket.prioridade)}`}>
                      {getPrioridadeIcon(ticket.prioridade)}
                      <span>{getPrioridadeLabel(ticket.prioridade)}</span>
                    </span>

                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {ticket.categoria}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[#002333] mb-2 text-lg">
                    {ticket.titulo}
                  </h3>

                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {ticket.descricao}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{ticket.cliente}</span>
                    </div>
                    
                    {ticket.agente && (
                      <div className="flex items-center space-x-1">
                        <span>Agente:</span>
                        <span className="text-[#159A9C] font-medium">{ticket.agente}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatarTempo(ticket.atualizadoEm)}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{ticket.interacoes} interações</span>
                    </div>

                    {ticket.anexos > 0 && (
                      <div className="flex items-center space-x-1">
                        <Paperclip className="w-4 h-4" />
                        <span>{ticket.anexos} anexos</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>SLA Primeira: {ticket.respostasSla.primeira}h</span>
                    <span>SLA Resolução: {ticket.respostasSla.resolucao}h</span>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2">
                  <button className="flex items-center justify-center space-x-2 px-3 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7d] transition-colors">
                    <Eye className="w-4 h-4" />
                    <span>Ver Detalhes</span>
                  </button>
                  
                  <button className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>Responder</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação (se necessário) */}
      {filteredTickets.length > 10 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Mostrando 1-10 de {filteredTickets.length} tickets
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Anterior
              </button>
              <button className="px-3 py-1 bg-[#159A9C] text-white rounded text-sm hover:bg-[#0d7a7d]">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
