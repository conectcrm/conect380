/**
 * DETALHES DO TICKET - CONECT CRM
 * Sprint 2 - Fase 7: Frontend Detalhes do Ticket
 * 
 * Página de visualização completa de um ticket específico
 * - Layout 2 colunas (informações + histórico)
 * - Informações completas do ticket
 * - Histórico de mensagens/eventos
 * - Botões de ação (editar, fechar, atribuir, escalar)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  X,
  CheckCircle,
  UserPlus,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
  Calendar,
  Tag,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { ticketsService, Ticket, StatusTicketApi } from '../services/ticketsService';
import { StatusTicket } from '../types/ticket';
import { TicketFormModal } from '../components/tickets/TicketFormModal';
import { AtribuirTicketModal } from '../components/tickets/AtribuirTicketModal';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados principais
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  // Estados para modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAtribuirModal, setShowAtribuirModal] = useState(false);

  // Carregar ticket ao montar
  useEffect(() => {
    if (id) {
      carregarTicket();
    }
  }, [id]);

  const carregarTicket = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error('ID do ticket não fornecido');
      }

      const empresaId = localStorage.getItem('empresaAtiva') || '';
      const resultado = await ticketsService.buscar(id, empresaId);
      setTicket(resultado.data);
    } catch (err: unknown) {
      console.error('Erro ao carregar ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ticket';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para voltar à listagem
  const handleVoltar = () => {
    navigate('/nuclei/atendimento/tickets');
  };

  // Funções de ação (placeholder - implementação completa na Fase 8)
  const handleEditar = () => {
    setShowEditModal(true);
  };

  const handleFechar = async () => {
    if (!ticket) return;

    if (window.confirm('Deseja realmente fechar este ticket?')) {
      try {
        setAtualizando(true);
        const empresaId = localStorage.getItem('empresaAtiva') || '';
        await ticketsService.atualizar(ticket.id, empresaId, { status: 'FECHADO' });
        await carregarTicket(); // Recarregar dados
      } catch (err) {
        console.error('Erro ao fechar ticket:', err);
        alert('Erro ao fechar ticket');
      } finally {
        setAtualizando(false);
      }
    }
  };

  const handleAtribuir = () => {
    setShowAtribuirModal(true);
  };

  const handleEscalar = async () => {
    if (!ticket) return;

    if (window.confirm('Deseja escalar este ticket para o próximo nível?')) {
      try {
        setAtualizando(true);
        // Lógica de escalonamento (implementar na Fase 8)
        alert('Funcionalidade de escalonamento será implementada na Fase 8');
      } catch (err) {
        console.error('Erro ao escalar ticket:', err);
        alert('Erro ao escalar ticket');
      } finally {
        setAtualizando(false);
      }
    }
  };

  // Funções auxiliares de label e cores
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      FILA: 'Fila',
      EM_ATENDIMENTO: 'Em Atendimento',
      AGUARDANDO: 'Aguardando',
      AGUARDANDO_CLIENTE: 'Aguardando Cliente',
      AGUARDANDO_INTERNO: 'Aguardando Interno',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
      ENCERRADO: 'Encerrado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      FILA: 'bg-yellow-100 text-yellow-800',
      EM_ATENDIMENTO: 'bg-blue-100 text-blue-800',
      AGUARDANDO: 'bg-orange-100 text-orange-800',
      AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800',
      AGUARDANDO_INTERNO: 'bg-purple-100 text-purple-800',
      CONCLUIDO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800',
      ENCERRADO: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTipoLabel = (tipo?: string): string => {
    const labels: Record<string, string> = {
      tecnica: 'Técnica',
      comercial: 'Comercial',
      financeira: 'Financeira',
      suporte: 'Suporte',
      reclamacao: 'Reclamação',
      solicitacao: 'Solicitação',
      outros: 'Outros',
    };
    return tipo ? labels[tipo] || tipo : 'Não especificado';
  };

  const getTipoColor = (tipo?: string): string => {
    const colors: Record<string, string> = {
      tecnica: 'bg-blue-100 text-blue-800',
      comercial: 'bg-green-100 text-green-800',
      financeira: 'bg-yellow-100 text-yellow-800',
      suporte: 'bg-purple-100 text-purple-800',
      reclamacao: 'bg-red-100 text-red-800',
      solicitacao: 'bg-cyan-100 text-cyan-800',
      outros: 'bg-gray-100 text-gray-800',
    };
    return tipo ? colors[tipo] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade: string): string => {
    const colors: Record<string, string> = {
      BAIXA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      URGENTE: 'bg-red-100 text-red-800',
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const formatarData = (data?: string): string => {
    if (!data) return 'N/A';
    try {
      return new Date(data).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return data;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header com BackToNucleus */}
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus
            nucleusName="Atendimento"
            nucleusPath="/nuclei/atendimento"
          />
        </div>

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-12 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mr-3" />
              <span className="text-lg text-[#002333]">Carregando ticket...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header com BackToNucleus */}
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus
            nucleusName="Atendimento"
            nucleusPath="/nuclei/atendimento"
          />
        </div>

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-1">
                    Erro ao carregar ticket
                  </h3>
                  <p className="text-red-700 mb-4">{error || 'Ticket não encontrado'}</p>
                  <button
                    onClick={handleVoltar}
                    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
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
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={handleVoltar}
                    className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                    title="Voltar para lista"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
                      <MessageSquare className="h-8 w-8 text-[#159A9C]" />
                      Ticket #{ticket.numero}
                    </h1>
                    <p className="text-sm text-[#002333]/60 mt-1">
                      {ticket.titulo || ticket.assunto || 'Sem título'}
                    </p>
                  </div>
                </div>

                {/* Badges de Status e Tipo */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(ticket.tipo)}`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {getTipoLabel(ticket.tipo)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(ticket.prioridade)}`}>
                    {ticket.prioridade}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                <button
                  onClick={handleEditar}
                  disabled={atualizando}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>

                {ticket.status !== 'CONCLUIDO' && ticket.status !== 'FECHADO' && ticket.status !== 'CANCELADO' && (
                  <button
                    onClick={handleFechar}
                    disabled={atualizando}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Concluir
                  </button>
                )}

                <button
                  onClick={handleAtribuir}
                  disabled={atualizando}
                  className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  <UserPlus className="h-4 w-4" />
                  Atribuir
                </button>

                <button
                  onClick={handleEscalar}
                  disabled={atualizando}
                  className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Escalar
                </button>

                <button
                  onClick={carregarTicket}
                  disabled={atualizando}
                  className="px-4 py-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium ml-auto"
                >
                  <RefreshCw className={`h-4 w-4 ${atualizando ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* Layout 2 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA: Informações do Ticket (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Descrição */}
              {ticket.descricao && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                    Descrição
                  </h2>
                  <p className="text-[#002333]/80 whitespace-pre-wrap">{ticket.descricao}</p>
                </div>
              )}

              {/* Informações Detalhadas */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#159A9C]" />
                  Informações Detalhadas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prioridade */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1">
                      Prioridade
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadeColor(ticket.prioridade)}`}>
                      {ticket.prioridade}
                    </span>
                  </div>

                  {/* Severidade */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1">
                      Severidade
                    </p>
                    <p className="text-sm text-[#002333]">{ticket.severity || 'N/A'}</p>
                  </div>

                  {/* Nível de Atendimento */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1">
                      Nível de Atendimento
                    </p>
                    <p className="text-sm text-[#002333]">{ticket.assignedLevel || 'N/A'}</p>
                  </div>

                  {/* Data de Vencimento */}
                  {ticket.dataVencimento && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vencimento
                      </p>
                      <p className="text-sm text-[#002333]">{formatarData(ticket.dataVencimento)}</p>
                    </div>
                  )}

                  {/* SLA */}
                  {ticket.slaExpiresAt && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        SLA Expira Em
                      </p>
                      <p className="text-sm text-[#002333]">{formatarData(ticket.slaExpiresAt)}</p>
                    </div>
                  )}

                  {/* Criado em */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1">
                      Criado em
                    </p>
                    <p className="text-sm text-[#002333]">{formatarData(ticket.createdAt)}</p>
                  </div>

                  {/* Última atualização */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1">
                      Atualizado em
                    </p>
                    <p className="text-sm text-[#002333]">{formatarData(ticket.updatedAt)}</p>
                  </div>

                  {/* Última mensagem */}
                  {ticket.ultimaMensagemEm && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60 mb-1">
                        Última Mensagem
                      </p>
                      <p className="text-sm text-[#002333]">{formatarData(ticket.ultimaMensagemEm)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico de Mensagens (Placeholder) */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                  Histórico de Mensagens
                  {ticket.mensagensNaoLidas > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {ticket.mensagensNaoLidas} não lidas
                    </span>
                  )}
                </h2>

                <div className="text-center py-8 text-[#002333]/60">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[#B4BEC9]" />
                  <p className="text-sm">
                    Histórico de mensagens será implementado na próxima fase
                  </p>
                  <p className="text-xs mt-1">
                    Integração com atendimentoService em desenvolvimento
                  </p>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Sidebar com Informações Adicionais (1/3) */}
            <div className="space-y-6">
              {/* Cliente */}
              {ticket.cliente && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-sm font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Building className="h-4 w-4 text-[#159A9C]" />
                    Cliente
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#002333]/60 mb-1">Nome</p>
                      <p className="text-sm font-medium text-[#002333]">{ticket.cliente.nome}</p>
                    </div>
                    {ticket.cliente.telefone && (
                      <div>
                        <p className="text-xs text-[#002333]/60 mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Telefone
                        </p>
                        <p className="text-sm text-[#002333]">{ticket.cliente.telefone}</p>
                      </div>
                    )}
                    {ticket.cliente.email && (
                      <div>
                        <p className="text-xs text-[#002333]/60 mb-1 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          E-mail
                        </p>
                        <p className="text-sm text-[#002333]">{ticket.cliente.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Atendente */}
              {ticket.atendente && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-sm font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#159A9C]" />
                    Atendente
                  </h3>
                  <div className="flex items-center gap-3">
                    {ticket.atendente.avatar ? (
                      <img
                        src={ticket.atendente.avatar}
                        alt={ticket.atendente.nome}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#159A9C]/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#159A9C]" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#002333]">{ticket.atendente.nome}</p>
                      <p className="text-xs text-[#002333]/60">ID: {ticket.atendente.id.substring(0, 8)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Responsável (Sprint 1) */}
              {ticket.responsavel && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-sm font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#159A9C]" />
                    Responsável
                  </h3>
                  <div className="flex items-center gap-3">
                    {ticket.responsavel.avatar ? (
                      <img
                        src={ticket.responsavel.avatar}
                        alt={ticket.responsavel.nome}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#159A9C]/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#159A9C]" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#002333]">{ticket.responsavel.nome}</p>
                      <p className="text-xs text-[#002333]/60">ID: {ticket.responsavel.id.substring(0, 8)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Canal */}
              {ticket.canal && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-sm font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#159A9C]" />
                    Canal
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#002333]">{ticket.canal.nome}</p>
                    <p className="text-xs text-[#002333]/60 uppercase">{ticket.canal.tipo}</p>
                  </div>
                </div>
              )}

              {/* Escalonamento (se houver) */}
              {ticket.escalationReason && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Escalonamento
                  </h3>
                  <p className="text-xs text-orange-800 mb-2">{ticket.escalationReason}</p>
                  {ticket.escalationAt && (
                    <p className="text-xs text-orange-700">
                      Escalado em: {formatarData(ticket.escalationAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals de CRUD */}
      <TicketFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={carregarTicket}
        ticket={ticket}
        mode="edit"
      />

      <AtribuirTicketModal
        isOpen={showAtribuirModal}
        onClose={() => setShowAtribuirModal(false)}
        onSuccess={carregarTicket}
        ticket={ticket}
      />
    </div>
  );
};

export default TicketDetailPage;
