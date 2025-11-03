import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Clock, MessageSquare } from 'lucide-react';
import { Ticket, StatusAtendimento, CanalTipo } from '../types';
import { getIconeCanal, resolverNomeExibicao } from '../utils';
import { resolveAvatarUrl } from '../../../../utils/avatar';
import { ThemePalette } from '../../../../contexts/ThemeContext';
import { TicketListSkeleton } from './SkeletonLoaders';

const DEBUG = false; // ✅ Debug desabilitado - sistema estável

interface AtendimentosSidebarProps {
  tickets: Ticket[];
  ticketSelecionado?: string;
  onSelecionarTicket: (ticketId: string) => void;
  onNovoAtendimento: () => void;
  theme: ThemePalette;
  loading?: boolean;
  tabAtiva: StatusAtendimento;
  onChangeTab: (status: StatusAtendimento) => void;
  contagemPorStatus?: Partial<Record<StatusAtendimento, number>>;
}

export const AtendimentosSidebar: React.FC<AtendimentosSidebarProps> = ({
  tickets,
  ticketSelecionado,
  onSelecionarTicket,
  onNovoAtendimento,
  theme,
  loading = false,
  tabAtiva,
  onChangeTab,
  contagemPorStatus
}) => {
  const [busca, setBusca] = useState('');
  const [contadores, setContadores] = useState<Record<string, number>>({});

  // Atualiza contadores de tempo em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const novosContadores: Record<string, number> = {};
      tickets.forEach(ticket => {
        if (ticket.status === 'aberto') {
          const segundosDecorridos = Math.floor(
            (Date.now() - ticket.tempoUltimaMensagem.getTime()) / 1000
          );
          novosContadores[ticket.id] = ticket.tempoAtendimento + segundosDecorridos;
        }
      });
      setContadores(novosContadores);
    }, 1000);

    return () => clearInterval(interval);
  }, [tickets]);

  const ticketsFiltrados = tickets.filter(ticket => {
    // 🔧 Normalizar status para comparação (backend retorna MAIÚSCULO, frontend usa minúsculo)
    const ticketStatus = (ticket.status || '').toLowerCase();
    const matchStatus = ticketStatus === tabAtiva;

    // 🎯 Buscar pelo nome de exibição (prioriza cliente vinculado)
    const nomeExibicao = resolverNomeExibicao(ticket.contato);
    const matchBusca = busca === '' ||
      nomeExibicao.toLowerCase().includes(busca.toLowerCase()) ||
      ticket.numero.toLowerCase().includes(busca.toLowerCase()) ||
      ticket.ultimaMensagem.toLowerCase().includes(busca.toLowerCase());

    return matchStatus && matchBusca;
  });

  // 🔍 DEBUG: Log dos tickets recebidos e filtrados (REMOVER dependência de ticketsFiltrados para evitar loop)
  useEffect(() => {
    if (!DEBUG) return;

    console.log('🎫 [AtendimentosSidebar] Total de tickets recebidos:', tickets.length);
    console.log('🎫 [AtendimentosSidebar] Tickets recebidos:', tickets.map(t => ({
      id: t.id.substring(0, 8),
      numero: t.numero,
      status: t.status,
      contato: t.contato.nome,
      telefone: t.contato.telefone
    })));
    console.log('📊 [AtendimentosSidebar] Tab ativa:', tabAtiva);

    // Calcular filtrados apenas para log (não usar ticketsFiltrados como dependência)
    const ticketsParaTab = tickets.filter(ticket => {
      const ticketStatus = (ticket.status || '').toLowerCase();
      return ticketStatus === tabAtiva;
    });
    console.log('📋 [AtendimentosSidebar] Tickets filtrados:', ticketsParaTab.length);

    // 🔍 DEBUG adicional: Por que não filtra?
    if (tickets.length > 0 && ticketsParaTab.length === 0) {
      console.log('❌ [AtendimentosSidebar] PROBLEMA NO FILTRO!');
      tickets.forEach(t => {
        console.log(`   Ticket ${t.numero}: status="${t.status}" (${typeof t.status}) vs tabAtiva="${tabAtiva}" (${typeof tabAtiva})`);
        console.log(`   Match? ${t.status === tabAtiva} | Lowercase match? ${t.status?.toLowerCase() === tabAtiva}`);
      });
    }
  }, [tickets, tabAtiva]); // ✅ Removido ticketsFiltrados das dependências

  const formatarTempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    } else {
      return `${segs}s`;
    }
  };

  const formatarTempoUltimaMensagem = (data: Date): string => {
    const agora = new Date();
    const diff = agora.getTime() - data.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'agora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  };

  const contagemFallback = useMemo(() => ({
    aberto: tickets.filter(t => (t.status || '').toLowerCase() === 'aberto').length,
    resolvido: tickets.filter(t => (t.status || '').toLowerCase() === 'resolvido').length,
    retorno: tickets.filter(t => (t.status || '').toLowerCase() === 'retorno').length,
  }), [tickets]);

  const tabs: { value: StatusAtendimento; label: string; count: number }[] = [
    { value: 'aberto', label: 'Aberto', count: contagemPorStatus?.aberto ?? contagemFallback.aberto },
    { value: 'resolvido', label: 'Resolvido', count: contagemPorStatus?.resolvido ?? contagemFallback.resolvido },
    { value: 'retorno', label: 'Retornos', count: contagemPorStatus?.retorno ?? contagemFallback.retorno }
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header com Tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-1 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => onChangeTab(tab.value)}
              style={{
                backgroundColor: tabAtiva === tab.value ? theme.colors.primary : '',
                color: tabAtiva === tab.value ? '#FFFFFF' : ''
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${tabAtiva === tab.value
                ? 'shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabAtiva === tab.value ? 'bg-white/20' : 'bg-gray-300'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar atendimentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Atendimentos */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <TicketListSkeleton count={5} />
        ) : ticketsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-center">Nenhum atendimento encontrado</p>
          </div>
        ) : (
          ticketsFiltrados.map(ticket => {
            const IconeCanal = getIconeCanal(ticket.canal);
            const tempoAtendimento = contadores[ticket.id] || ticket.tempoAtendimento;
            const isAtivo = ticketSelecionado === ticket.id;
            const avatarUrl = resolveAvatarUrl(ticket.contato.foto || null);

            return (
              <div
                key={ticket.id}
                onClick={() => onSelecionarTicket(ticket.id)}
                style={{
                  backgroundColor: isAtivo ? theme.colors.primaryLight : '',
                  borderLeftColor: isAtivo ? theme.colors.primary : '',
                  borderLeftWidth: isAtivo ? '4px' : ''
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 cursor-pointer transition-all ${isAtivo ? '' : 'hover:bg-gray-50'
                  }`}
              >
                {/* Foto do Contato - Compacta */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolverNomeExibicao(ticket.contato))}&background=random`}
                    alt={resolverNomeExibicao(ticket.contato)}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {/* Ícone do Canal */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${ticket.canal === 'whatsapp' ? 'bg-green-500' :
                    ticket.canal === 'telegram' ? 'bg-blue-400' :
                      ticket.canal === 'email' ? 'bg-red-500' :
                        ticket.canal === 'chat' ? 'bg-purple-500' :
                          'bg-gray-500'
                    }`}>
                    <IconeCanal className="w-2.5 h-2.5 text-white" />
                  </div>
                  {/* Status Online */}
                  {ticket.contato.online && (
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Informações - Layout Compacto */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  {/* Linha 1: Nome + Tempo */}
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className="font-semibold text-sm text-gray-900 truncate max-w-[180px]"
                      title={resolverNomeExibicao(ticket.contato)}
                    >
                      {resolverNomeExibicao(ticket.contato)}
                    </h3>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                      {formatarTempoUltimaMensagem(ticket.tempoUltimaMensagem)}
                    </span>
                  </div>

                  {/* Linha 2: Última Mensagem */}
                  <p
                    className="text-xs text-gray-600 truncate max-w-full leading-tight"
                    title={ticket.ultimaMensagem}
                  >
                    {ticket.ultimaMensagem}
                  </p>

                  {/* Linha 3: Número + Tags + Tempo Atendimento */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-medium text-gray-500 flex-shrink-0">
                        #{ticket.numero}
                      </span>
                      {ticket.tags && ticket.tags.slice(0, 1).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded truncate max-w-[60px]"
                          title={tag}
                        >
                          {tag}
                        </span>
                      ))}
                      {ticket.tags && ticket.tags.length > 1 && (
                        <span className="text-[10px] text-gray-400">
                          +{ticket.tags.length - 1}
                        </span>
                      )}
                    </div>

                    {ticket.status === 'aberto' && (
                      <div className="flex items-center gap-0.5 text-[10px] text-gray-500 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">
                          {formatarTempo(tempoAtendimento)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Botão Novo Atendimento */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onNovoAtendimento}
          style={{
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Atendimento
        </button>
      </div>
    </div>
  );
};
