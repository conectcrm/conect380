import React, { useState, useCallback } from 'react';
import { AtendimentosSidebar } from './components/AtendimentosSidebar';
import { ChatArea } from './components/ChatArea';
import { ClientePanel } from './components/ClientePanel';
import { mockTickets, mockMensagens, mockHistorico, mockDemandas, mockNotas } from './mockData';
import { Mensagem, NotaCliente } from './types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSidebar } from '../../../contexts/SidebarContext';

/**
 * ChatOmnichannel - Componente principal do chat omnichannel
 * 
 * Layout de 3 colunas:
 * 1. Sidebar Esquerda: Lista de atendimentos com tabs (Aberto/Resolvido/Retornos)
 * 2. Área Central: Chat com mensagens, header e input
 * 3. Painel Direito: Informações do cliente e demandas
 * 
 * TEMA: Integrado com ThemeContext do CRM
 * RESPONSIVE: Adapta larguras quando sidebar global está expandida/colapsada
 */
export const ChatOmnichannel: React.FC = () => {
  const { currentPalette } = useTheme();
  const { sidebarCollapsed } = useSidebar();
  const [tickets] = useState(mockTickets);
  const [ticketSelecionado, setTicketSelecionado] = useState<string>(mockTickets[0]?.id);
  const [mensagens, setMensagens] = useState<Mensagem[]>(mockMensagens);
  const [historico] = useState(mockHistorico);
  const [demandas, setDemandas] = useState(mockDemandas);
  const [notas, setNotas] = useState<NotaCliente[]>(mockNotas);

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

  const handleAdicionarNota = useCallback((conteudo: string, importante: boolean) => {
    if (!ticketAtual) return;

    const novaNota: NotaCliente = {
      id: `n${Date.now()}`,
      conteudo,
      autor: {
        id: ticketAtual.atendente?.id || 'a1',
        nome: ticketAtual.atendente?.nome || 'Atendente',
        foto: ticketAtual.atendente?.foto
      },
      dataCriacao: new Date(),
      importante
    };

    setNotas(prev => [novaNota, ...prev]);
    console.log('Nova nota criada:', novaNota);
    // TODO: Salvar no backend
  }, [ticketAtual]);

  const handleExcluirNota = useCallback((notaId: string) => {
    setNotas(prev => prev.filter(n => n.id !== notaId));
    console.log('Nota excluída:', notaId);
    // TODO: Excluir no backend
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
    <div className="flex h-full bg-gray-100 overflow-hidden">
      {/* Coluna 1: Lista de Atendimentos - Adaptável ao estado da sidebar */}
      <div className={`flex-shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'w-96' : 'w-80'
      }`}>
        <AtendimentosSidebar
          tickets={tickets}
          ticketSelecionado={ticketSelecionado}
          onSelecionarTicket={handleSelecionarTicket}
          onNovoAtendimento={handleNovoAtendimento}
          theme={currentPalette}
        />
      </div>

      {/* Coluna 2: Área do Chat - Flex para usar espaço disponível */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          ticket={ticketAtual}
          mensagens={mensagensDoTicket}
          onEnviarMensagem={handleEnviarMensagem}
          onTransferir={handleTransferir}
          onEncerrar={handleEncerrar}
          onLigar={handleLigar}
          theme={currentPalette}
        />
      </div>

      {/* Coluna 3: Painel do Cliente - Largura fixa otimizada (320px) */}
      <ClientePanel
        contato={ticketAtual.contato}
        historico={historico}
        demandas={demandas}
        notas={notas}
        onEditarContato={handleEditarContato}
        onVincularCliente={handleVincularCliente}
        onAbrirDemanda={handleAbrirDemanda}
        onAdicionarNota={handleAdicionarNota}
        onExcluirNota={handleExcluirNota}
        theme={currentPalette}
      />
    </div>
  );
};

export default ChatOmnichannel;
