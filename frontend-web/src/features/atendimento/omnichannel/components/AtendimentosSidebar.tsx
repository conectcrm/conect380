import React, { useState, useEffect } from 'react';
import { Search, Plus, Clock, MessageSquare } from 'lucide-react';
import { Ticket, StatusAtendimento, CanalTipo } from '../types';
import { getIconeCanal } from '../utils';

interface AtendimentosSidebarProps {
  tickets: Ticket[];
  ticketSelecionado?: string;
  onSelecionarTicket: (ticketId: string) => void;
  onNovoAtendimento: () => void;
}

export const AtendimentosSidebar: React.FC<AtendimentosSidebarProps> = ({
  tickets,
  ticketSelecionado,
  onSelecionarTicket,
  onNovoAtendimento
}) => {
  const [tabAtiva, setTabAtiva] = useState<StatusAtendimento>('aberto');
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
    const matchStatus = ticket.status === tabAtiva;
    const matchBusca = busca === '' || 
      ticket.contato.nome.toLowerCase().includes(busca.toLowerCase()) ||
      ticket.numero.toLowerCase().includes(busca.toLowerCase()) ||
      ticket.ultimaMensagem.toLowerCase().includes(busca.toLowerCase());
    
    return matchStatus && matchBusca;
  });

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

  const tabs: { value: StatusAtendimento; label: string; count: number }[] = [
    { value: 'aberto', label: 'Aberto', count: tickets.filter(t => t.status === 'aberto').length },
    { value: 'resolvido', label: 'Resolvido', count: tickets.filter(t => t.status === 'resolvido').length },
    { value: 'retorno', label: 'Retornos', count: tickets.filter(t => t.status === 'retorno').length }
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header com Tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-1 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setTabAtiva(tab.value)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                tabAtiva === tab.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  tabAtiva === tab.value ? 'bg-white/20' : 'bg-gray-300'
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
        {ticketsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-center">Nenhum atendimento encontrado</p>
          </div>
        ) : (
          ticketsFiltrados.map(ticket => {
            const IconeCanal = getIconeCanal(ticket.canal);
            const tempoAtendimento = contadores[ticket.id] || ticket.tempoAtendimento;
            const isAtivo = ticketSelecionado === ticket.id;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelecionarTicket(ticket.id)}
                className={`flex items-start gap-3 p-4 border-b border-gray-100 cursor-pointer transition-all ${
                  isAtivo
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Foto do Contato */}
                <div className="relative flex-shrink-0">
                  <img
                    src={ticket.contato.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.contato.nome)}&background=random`}
                    alt={ticket.contato.nome}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {/* Ícone do Canal */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                    ticket.canal === 'whatsapp' ? 'bg-green-500' :
                    ticket.canal === 'telegram' ? 'bg-blue-400' :
                    ticket.canal === 'email' ? 'bg-red-500' :
                    ticket.canal === 'chat' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}>
                    <IconeCanal className="w-3 h-3 text-white" />
                  </div>
                  {/* Status Online */}
                  {ticket.contato.online && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {ticket.contato.nome}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatarTempoUltimaMensagem(ticket.tempoUltimaMensagem)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-2">
                    {ticket.ultimaMensagem}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {ticket.numero}
                      </span>
                      {ticket.tags && ticket.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {ticket.status === 'aberto' && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Atendimento
        </button>
      </div>
    </div>
  );
};
