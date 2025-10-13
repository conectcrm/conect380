import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { TicketListAprimorado } from '../features/atendimento/chat/TicketListAprimorado';
import { ChatHeader } from '../features/atendimento/chat/ChatHeader';
import { TemplatesRapidos } from '../features/atendimento/chat/TemplatesRapidos';
import { PainelContextoCliente } from '../components/chat/PainelContextoCliente';
import { BuscaRapida, TipoRecursoBusca } from '../components/chat/BuscaRapida';
import { useTickets } from '../hooks/useTickets';
import { useMessagesRealtime } from '../hooks/useMessagesRealtime';
import { TicketFiltersState } from '../features/atendimento/chat/TicketFilters';

/**
 * Página completa de atendimento com integração real de APIs + WebSocket
 * 
 * FASE 5 - Recursos de tempo real adicionados:
 * - ✅ WebSocket para mensagens em tempo real
 * - ✅ Notificação sonora quando mensagem chega
 * - ✅ Indicador de "digitando..."
 * - ✅ Status de conexão WebSocket visível
 * - ✅ Entrada/saída automática de salas de tickets
 * 
 * Para usar em produção:
 * 1. Configure WS_URL no .env (REACT_APP_WS_URL)
 * 2. Certifique-se que backend WebSocket está rodando
 * 3. Token JWT deve estar no localStorage
 */
export function AtendimentoIntegradoPage() {
  // Estado da empresa (normalmente viria do contexto de autenticação)
  const [empresaId] = useState(() => {
    // Tentar pegar do localStorage ou usar um valor padrão
    return localStorage.getItem('empresaId') || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  });

  // Ticket ativo
  const [ticketAtivoId, setTicketAtivoId] = useState<string | null>(null);

  // Painel de contexto do cliente
  const [painelContextoAberto, setPainelContextoAberto] = useState(true);

  // Busca rápida global (Ctrl+K)
  const [buscaRapidaAberta, setBuscaRapidaAberta] = useState(false);

  // Filtros de tickets
  const [filtros, setFiltros] = useState<TicketFiltersState>({
    search: '',
    status: '',
    prioridade: '',
    ordenacao: 'recente',
  });

  // Hook de tickets com API real
  const {
    tickets,
    loading: loadingTickets,
    erro: erroTickets,
    total,
    atualizarStatus,
    atualizarPrioridade,
    atribuirAtendente,
    recarregar: recarregarTickets,
  } = useTickets(empresaId);

  // Hook de mensagens COM WEBSOCKET
  const {
    mensagens,
    loading: loadingMensagens,
    erro: erroMensagens,
    enviando,
    digitando,
    wsConnected,
    enviarMensagem,
    enviarArquivo,
    marcarComoLida,
    notificarDigitando,
    recarregar: recarregarMensagens,
  } = useMessagesRealtime(ticketAtivoId);

  // Ticket selecionado
  const ticketSelecionado = tickets.find((t) => t.id === ticketAtivoId);

  /**
   * Seleciona um ticket
   */
  const handleSelecionarTicket = (ticketId: string) => {
    console.log('🎯 Ticket selecionado:', ticketId);
    setTicketAtivoId(ticketId);
  };

  /**
   * Atualiza status do ticket via API
   */
  const handleAtualizarStatus = async (novoStatus: string) => {
    if (!ticketAtivoId) return;

    try {
      await atualizarStatus(ticketAtivoId, novoStatus as any);
      console.log('✅ Status atualizado para:', novoStatus);
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    }
  };

  /**
   * Atualiza prioridade do ticket via API
   */
  const handleAtualizarPrioridade = async (novaPrioridade: string) => {
    if (!ticketAtivoId) return;

    try {
      await atualizarPrioridade(ticketAtivoId, novaPrioridade as any);
      console.log('✅ Prioridade atualizada para:', novaPrioridade);
    } catch (error) {
      console.error('❌ Erro ao atualizar prioridade:', error);
    }
  };

  /**
   * Atribui atendente ao ticket via API
   */
  const handleAtribuirAtendente = async (atendenteId: string) => {
    if (!ticketAtivoId) return;

    try {
      await atribuirAtendente(ticketAtivoId, atendenteId);
      console.log('✅ Atendente atribuído:', atendenteId);
    } catch (error) {
      console.error('❌ Erro ao atribuir atendente:', error);
    }
  };

  /**
   * Envia uma mensagem via API
   */
  const handleEnviarMensagem = async (conteudo: string) => {
    if (!ticketAtivoId || !conteudo.trim()) return;

    try {
      await enviarMensagem(conteudo);
      console.log('✅ Mensagem enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    }
  };

  /**
   * Insere um template no chat e envia
   */
  const handleInserirTemplate = (template: any) => {
    console.log('📋 Template selecionado:', template);
    handleEnviarMensagem(template.mensagem);
  };

  /**
   * Limpa todos os filtros
   */
  const handleLimparFiltros = () => {
    setFiltros({
      search: '',
      status: '',
      prioridade: '',
      ordenacao: 'recente',
    });
  };

  /**
   * Atalho Ctrl+K para busca rápida - setup
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setBuscaRapidaAberta(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Selecionar resultado da busca rápida
   */
  const handleSelecionarResultadoBusca = (resultado: any) => {
    console.log('🔍 Resultado selecionado:', resultado);
    // TODO: Implementar navegação baseada no tipo de resultado
    // Ex: abrir modal de proposta, abrir ticket, etc.
  };

  /**
   * Enviar resultado da busca no chat
   */
  const handleEnviarResultadoNoChat = async (resultado: any) => {
    if (!ticketAtivoId) {
      console.warn('⚠️ Nenhum ticket ativo para enviar mensagem');
      return;
    }

    // Montar mensagem baseada no tipo de resultado
    let mensagem = '';
    switch (resultado.tipo) {
      case TipoRecursoBusca.PROPOSTA:
        mensagem = `📄 Proposta: ${resultado.titulo}\n${resultado.subtitulo || ''}`;
        break;
      case TipoRecursoBusca.FATURA:
        mensagem = `💰 Fatura: ${resultado.titulo}\n${resultado.subtitulo || ''}`;
        break;
      case TipoRecursoBusca.CLIENTE:
        mensagem = `👤 Cliente: ${resultado.titulo}\n${resultado.subtitulo || ''}`;
        break;
      case TipoRecursoBusca.TICKET:
        mensagem = `🎫 Ticket: ${resultado.titulo}\n${resultado.subtitulo || ''}`;
        break;
      default:
        mensagem = `${resultado.titulo}`;
    }

    await handleEnviarMensagem(mensagem);
  };

  // Extrair clienteId do ticket para o painel de contexto
  const clienteId = ticketSelecionado?.clienteId || null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Indicador de conexão WebSocket */}
      <div className="fixed top-4 right-4 z-50">
        {wsConnected ? (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg shadow-sm">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Tempo Real Ativo</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg shadow-sm">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Reconectando...</span>
          </div>
        )}
      </div>

      {/* Coluna Esquerda: Lista de Tickets */}
      <TicketListAprimorado
        tickets={tickets}
        activeTicketId={ticketAtivoId}
        onTicketSelect={handleSelecionarTicket}
        filters={filtros}
        onFiltersChange={setFiltros}
        onClearFilters={handleLimparFiltros}
      />

      {/* Coluna Central: Área de Chat/Mensagens */}
      <div className="flex-1 flex flex-col">
        {/* Erro ao carregar tickets */}
        {erroTickets && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Erro ao carregar tickets</p>
                <p className="text-sm text-red-700 mt-1">{erroTickets}</p>
              </div>
              <button
                onClick={recarregarTickets}
                className="ml-auto flex items-center gap-2 px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Loading tickets */}
        {loadingTickets && !tickets.length && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Carregando tickets...</p>
            </div>
          </div>
        )}

        {/* Nenhum ticket selecionado */}
        {!ticketAtivoId && !loadingTickets && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Selecione um ticket</h3>
              <p className="text-sm">
                {tickets.length === 0
                  ? 'Nenhum ticket disponível no momento'
                  : 'Escolha um ticket na lista ao lado para começar o atendimento'}
              </p>
              {total > 0 && (
                <p className="text-xs mt-2">
                  Total de {total} ticket{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ticket selecionado */}
        {ticketAtivoId && ticketSelecionado && (
          <>
            {/* Header do Chat */}
            <ChatHeader
              ticket={ticketSelecionado}
              contextoAberto={painelContextoAberto}
              onToggleContexto={() => setPainelContextoAberto(!painelContextoAberto)}
              onStatusChange={handleAtualizarStatus}
              onPrioridadeChange={handleAtualizarPrioridade}
            />

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto bg-white p-4">
              {/* Erro ao carregar mensagens */}
              {erroMensagens && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Erro ao carregar mensagens</p>
                      <p className="text-sm text-red-700 mt-1">{erroMensagens}</p>
                    </div>
                    <button
                      onClick={recarregarMensagens}
                      className="ml-auto flex items-center gap-2 px-3 py-1 text-sm text-red-700 hover:bg-red-100 rounded"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              {/* Loading mensagens */}
              {loadingMensagens && (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Carregando mensagens...</p>
                </div>
              )}

              {/* Lista de mensagens */}
              {!loadingMensagens && mensagens.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">Envie a primeira mensagem para iniciar a conversa</p>
                </div>
              )}

              {!loadingMensagens && mensagens.length > 0 && (
                <div className="space-y-4">
                  {mensagens.map((mensagem) => (
                    <div
                      key={mensagem.id}
                      className={`flex ${mensagem.direcao === 'saida' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${mensagem.direcao === 'saida'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
                        <p
                          className={`text-xs mt-1 ${mensagem.direcao === 'saida' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                        >
                          {new Date(mensagem.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Indicador de "digitando..." */}
                  {digitando && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-xs text-gray-500">digitando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Templates Rápidos */}
            <div className="border-t bg-gray-50 p-2">
              <TemplatesRapidos
                onSelecionarTemplate={handleEnviarMensagem}
              />
            </div>

            {/* Campo de entrada de mensagem */}
            <div className="border-t bg-white p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem('mensagem') as HTMLInputElement;
                  if (input.value.trim()) {
                    handleEnviarMensagem(input.value);
                    input.value = '';
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  name="mensagem"
                  placeholder="Digite sua mensagem..."
                  disabled={enviando}
                  onKeyDown={() => {
                    // Notificar que está digitando (WebSocket)
                    if (wsConnected) {
                      notificarDigitando();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Painel de Contexto do Cliente (3ª coluna) */}
      {ticketSelecionado && clienteId && (
        <PainelContextoCliente
          clienteId={clienteId}
          ticketId={ticketAtivoId!}
          collapsed={!painelContextoAberto}
          onClose={() => setPainelContextoAberto(false)}
        />
      )}

      {/* Modal de Busca Rápida (Ctrl+K) */}
      <BuscaRapida
        isOpen={buscaRapidaAberta}
        onClose={() => setBuscaRapidaAberta(false)}
        onSelecionarResultado={handleSelecionarResultadoBusca}
        onEnviarNoChat={handleEnviarResultadoNoChat}
      />
    </div>
  );
}
