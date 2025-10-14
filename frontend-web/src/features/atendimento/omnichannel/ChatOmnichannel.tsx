import React, { useState, useCallback } from 'react';
import { AtendimentosSidebar } from './components/AtendimentosSidebar';
import { ChatArea } from './components/ChatArea';
import { ClientePanel } from './components/ClientePanel';
import { NovoAtendimentoModal, NovoAtendimentoData } from './modals/NovoAtendimentoModal';
import { TransferirAtendimentoModal, TransferenciaData } from './modals/TransferirAtendimentoModal';
import { EncerrarAtendimentoModal, EncerramentoData } from './modals/EncerrarAtendimentoModal';
import { EditarContatoModal, ContatoEditado } from './modals/EditarContatoModal';
import { VincularClienteModal } from './modals/VincularClienteModal';
import { AbrirDemandaModal, NovaDemanda } from './modals/AbrirDemandaModal';
import { Mensagem, NotaCliente, Demanda } from './types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useAtendimentos } from './hooks/useAtendimentos';
import { useMensagens } from './hooks/useMensagens';
import { mockHistorico, mockDemandas, mockNotas } from './mockData';

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
  
  // Hooks do backend real
  const { 
    tickets, 
    ticketSelecionado, 
    selecionarTicket,
    criarTicket,
    transferirTicket,
    encerrarTicket,
    loading: loadingTickets 
  } = useAtendimentos({
    autoRefresh: true,
    filtroInicial: { status: 'aberto' }
  });

  const {
    mensagens,
    enviarMensagem,
    enviarMensagemComAnexos,
    marcarComoLidas,
    loading: loadingMensagens
  } = useMensagens({
    ticketId: ticketSelecionado?.id || null
  });

  // Dados que ainda vêm do mock (serão implementados depois)
  const [historico] = useState(mockHistorico);
  const [demandas, setDemandas] = useState(mockDemandas);
  const [notas, setNotas] = useState<NotaCliente[]>(mockNotas);

  // Estados dos modais
  const [modalNovoAtendimento, setModalNovoAtendimento] = useState(false);
  const [modalTransferir, setModalTransferir] = useState(false);
  const [modalEncerrar, setModalEncerrar] = useState(false);
  const [modalEditarContato, setModalEditarContato] = useState(false);
  const [modalVincularCliente, setModalVincularCliente] = useState(false);
  const [modalAbrirDemanda, setModalAbrirDemanda] = useState(false);

  // Variáveis derivadas
  const ticketAtual = ticketSelecionado;
  const mensagensDoTicket = mensagens;

  // Handlers
  const handleSelecionarTicket = useCallback((ticketId: string) => {
    selecionarTicket(ticketId);
  }, [selecionarTicket]);

  const handleNovoAtendimento = useCallback(() => {
    setModalNovoAtendimento(true);
  }, []);

  const handleConfirmarNovoAtendimento = useCallback(async (dados: NovoAtendimentoData) => {
    try {
      const novoTicket = await criarTicket(dados);
      
      // Seleciona o novo ticket
      selecionarTicket(novoTicket.id);
      setModalNovoAtendimento(false);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      alert('Erro ao criar atendimento. Tente novamente.');
    }
  }, [criarTicket, selecionarTicket]);

  const handleEnviarMensagem = useCallback(async (conteudo: string, anexos?: File[]) => {
    if (!ticketSelecionado) return;

    try {
      if (anexos && anexos.length > 0) {
        await enviarMensagemComAnexos(conteudo, anexos);
      } else {
        await enviarMensagem(conteudo);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  }, [ticketSelecionado, enviarMensagem, enviarMensagemComAnexos]);

  const handleTransferir = useCallback(() => {
    setModalTransferir(true);
  }, []);

  const handleConfirmarTransferencia = useCallback(async (dados: TransferenciaData) => {
    if (!ticketSelecionado) return;
    
    try {
      await transferirTicket(ticketSelecionado.id, dados);
      setModalTransferir(false);
    } catch (error) {
      console.error('Erro ao transferir ticket:', error);
      alert('Erro ao transferir atendimento. Tente novamente.');
    }
  }, [ticketSelecionado, transferirTicket]);

  const handleEncerrar = useCallback(() => {
    setModalEncerrar(true);
  }, []);

  const handleConfirmarEncerramento = useCallback(async (dados: EncerramentoData) => {
    if (!ticketSelecionado) return;
    
    try {
      await encerrarTicket(ticketSelecionado.id, {
        motivo: dados.motivo as any,
        observacoes: dados.observacoes,
        criarFollowUp: dados.criarFollowUp,
        dataFollowUp: dados.dataFollowUp,
        solicitarAvaliacao: dados.solicitarAvaliacao
      });
      setModalEncerrar(false);
    } catch (error) {
      console.error('Erro ao encerrar ticket:', error);
      alert('Erro ao encerrar atendimento. Tente novamente.');
    }
  }, [ticketSelecionado, encerrarTicket]);

  const handleLigar = useCallback(() => {
    if (!ticketSelecionado) return;
    console.log('Ligar para:', ticketSelecionado.contato.telefone);
    // TODO: Integrar com sistema de telefonia
  }, [ticketSelecionado]);

  const handleEditarContato = useCallback(() => {
    setModalEditarContato(true);
  }, []);

  const handleConfirmarEdicaoContato = useCallback((dados: ContatoEditado) => {
    console.log('Editar contato:', dados);
    // TODO: Integrar com API
    // TODO: Atualizar dados do contato
  }, []);

  const handleVincularCliente = useCallback(() => {
    setModalVincularCliente(true);
  }, []);

  const handleConfirmarVinculoCliente = useCallback((clienteId: string) => {
    console.log('Vincular cliente:', clienteId);
    // TODO: Integrar com API
    // TODO: Atualizar vinculação
  }, []);

  const handleAbrirDemanda = useCallback(() => {
    setModalAbrirDemanda(true);
  }, []);

  const handleConfirmarNovaDemanda = useCallback((dados: NovaDemanda) => {
    const novaDemanda: Demanda = {
      id: `d${Date.now()}`,
      tipo: dados.tipo,
      descricao: dados.descricao,
      status: 'aberta' as const,
      dataAbertura: new Date()
    };
    setDemandas(prev => [novaDemanda, ...prev]);
    console.log('Nova demanda criada:', novaDemanda);
    // TODO: Integrar com API
    // TODO: Criar oportunidade vinculada
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
      <div className={`flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-96' : 'w-80'
        }`}>
        <AtendimentosSidebar
          tickets={tickets}
          ticketSelecionado={ticketSelecionado?.id || ''}
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

      {/* Modais */}
      <NovoAtendimentoModal
        isOpen={modalNovoAtendimento}
        onClose={() => setModalNovoAtendimento(false)}
        onConfirm={handleConfirmarNovoAtendimento}
      />

      <TransferirAtendimentoModal
        isOpen={modalTransferir}
        onClose={() => setModalTransferir(false)}
        onConfirm={handleConfirmarTransferencia}
        ticketAtual={ticketAtual}
      />

      <EncerrarAtendimentoModal
        isOpen={modalEncerrar}
        onClose={() => setModalEncerrar(false)}
        onConfirm={handleConfirmarEncerramento}
        ticketAtual={ticketAtual}
      />

      <EditarContatoModal
        isOpen={modalEditarContato}
        onClose={() => setModalEditarContato(false)}
        onConfirm={handleConfirmarEdicaoContato}
        contato={ticketAtual.contato}
      />

      <VincularClienteModal
        isOpen={modalVincularCliente}
        onClose={() => setModalVincularCliente(false)}
        onConfirm={handleConfirmarVinculoCliente}
        contatoAtual={ticketAtual.contato}
      />

      <AbrirDemandaModal
        isOpen={modalAbrirDemanda}
        onClose={() => setModalAbrirDemanda(false)}
        onConfirm={handleConfirmarNovaDemanda}
        ticketAtual={ticketAtual}
      />
    </div>
  );
};

export default ChatOmnichannel;
