import React, { useState, useCallback } from 'react';
import { AtendimentosSidebar } from './components/AtendimentosSidebar';
import { ChatArea } from './components/ChatArea';
import { ClientePanel } from './components/ClientePanel';
import { mockTickets, mockMensagens, mockHistorico, mockDemandas } from './mockData';
import { Mensagem } from './types';

/**
 * ChatOmnichannel - Componente principal do chat omnichannel
 * 
 * Layout de 3 colunas:
 * 1. Sidebar Esquerda: Lista de atendimentos com tabs (Aberto/Resolvido/Retornos)
 * 2. Área Central: Chat com mensagens, header e input
 * 3. Painel Direito: Informações do cliente e demandas
 */
export const ChatOmnichannel: React.FC = () => {
  const [tickets] = useState(mockTickets);
  const [ticketSelecionado, setTicketSelecionado] = useState<string>(mockTickets[0]?.id);
  const [mensagens, setMensagens] = useState<Mensagem[]>(mockMensagens);
  const [historico] = useState(mockHistorico);
  const [demandas, setDemandas] = useState(mockDemandas);

  // Encontra o ticket atual
  const ticketAtual = tickets.find(t => t.id === ticketSelecionado);

  // Filtra mensagens do ticket atual
  const mensagensDoTicket = mensagens.filter(m => m.ticketId === ticketSelecionado);

  // Handlers
  const handleSelecionarTicket = useCallback((ticketId: string) => {
    setTicketSelecionado(ticketId);
  }, []);

  const handleNovoAtendimento = useCallback(() => {
    console.log('Abrir modal de novo atendimento');
    // TODO: Implementar modal de novo atendimento
  }, []);

  const handleEnviarMensagem = useCallback((conteudo: string) => {
    if (!ticketAtual) return;

    const novaMensagem: Mensagem = {
      id: `m${Date.now()}`,
      ticketId: ticketSelecionado,
      remetente: {
        id: ticketAtual.atendente?.id || 'a1',
        nome: ticketAtual.atendente?.nome || 'Atendente',
        foto: ticketAtual.atendente?.foto,
        tipo: 'atendente'
      },
      conteudo,
      timestamp: new Date(),
      status: 'enviando'
    };

    setMensagens(prev => [...prev, novaMensagem]);

    // Simular envio e mudança de status
    setTimeout(() => {
      setMensagens(prev => 
        prev.map(m => m.id === novaMensagem.id ? { ...m, status: 'enviado' } : m)
      );
    }, 500);

    setTimeout(() => {
      setMensagens(prev => 
        prev.map(m => m.id === novaMensagem.id ? { ...m, status: 'entregue' } : m)
      );
    }, 1000);

    setTimeout(() => {
      setMensagens(prev => 
        prev.map(m => m.id === novaMensagem.id ? { ...m, status: 'lido' } : m)
      );
    }, 2000);
  }, [ticketSelecionado, ticketAtual]);

  const handleTransferir = useCallback(() => {
    console.log('Transferir atendimento');
    // TODO: Implementar modal de transferência
  }, []);

  const handleEncerrar = useCallback(() => {
    console.log('Encerrar atendimento');
    // TODO: Implementar confirmação e lógica de encerramento
  }, []);

  const handleLigar = useCallback(() => {
    if (!ticketAtual) return;
    console.log('Ligar para:', ticketAtual.contato.telefone);
    // TODO: Integrar com sistema de telefonia
  }, [ticketAtual]);

  const handleEditarContato = useCallback(() => {
    console.log('Editar contato');
    // TODO: Implementar modal de edição de contato
  }, []);

  const handleVincularCliente = useCallback(() => {
    console.log('Vincular cliente');
    // TODO: Implementar modal de busca e vinculação de cliente
  }, []);

  const handleAbrirDemanda = useCallback((tipo: string, descricao: string) => {
    const novaDemanda = {
      id: `d${Date.now()}`,
      tipo,
      descricao,
      status: 'aberta' as const,
      dataAbertura: new Date()
    };

    setDemandas(prev => [novaDemanda, ...prev]);
    console.log('Nova demanda criada:', novaDemanda);
    // TODO: Salvar no backend
  }, []);

  if (!ticketAtual) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nenhum atendimento selecionado
          </h2>
          <p className="text-gray-600">
            Selecione um atendimento na lista para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Coluna 1: Lista de Atendimentos */}
      <div className="w-96 flex-shrink-0">
        <AtendimentosSidebar
          tickets={tickets}
          ticketSelecionado={ticketSelecionado}
          onSelecionarTicket={handleSelecionarTicket}
          onNovoAtendimento={handleNovoAtendimento}
        />
      </div>

      {/* Coluna 2: Área do Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          ticket={ticketAtual}
          mensagens={mensagensDoTicket}
          onEnviarMensagem={handleEnviarMensagem}
          onTransferir={handleTransferir}
          onEncerrar={handleEncerrar}
          onLigar={handleLigar}
        />
      </div>

      {/* Coluna 3: Painel do Cliente */}
      <ClientePanel
        contato={ticketAtual.contato}
        historico={historico}
        demandas={demandas}
        onEditarContato={handleEditarContato}
        onVincularCliente={handleVincularCliente}
        onAbrirDemanda={handleAbrirDemanda}
      />
    </div>
  );
};

export default ChatOmnichannel;
