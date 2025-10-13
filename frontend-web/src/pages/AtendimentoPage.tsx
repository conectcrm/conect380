import React, { useState, useEffect } from 'react';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { TicketList } from '../components/chat/TicketList';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { PainelContextoCliente } from '../components/chat/PainelContextoCliente';
import { BuscaRapida, TipoRecursoBusca } from '../components/chat/BuscaRapida';

export function AtendimentoPage() {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [painelContextoAberto, setPainelContextoAberto] = useState(true); // Estado do painel
  const [buscaRapidaAberta, setBuscaRapidaAberta] = useState(false); // NOVO: Estado da busca rápida

  // Obter token e empresaId do localStorage ou contexto de autenticação
  const token = localStorage.getItem('authToken') || '';
  const empresaId = localStorage.getItem('empresaId') || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // ID padrão da empresa de teste

  const whatsapp = useWhatsApp({
    empresaId,
    token,
    autoLoadTickets: true,
  });

  // Carregar mensagens quando selecionar um ticket
  useEffect(() => {
    if (activeTicketId) {
      whatsapp.carregarMensagens(activeTicketId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTicketId]);

  // NOVO: Atalho global Ctrl+K para busca rápida
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

  const handleTicketSelect = (ticketId: string) => {
    setActiveTicketId(ticketId);
  };

  const handleEnviarMensagem = async (mensagem: string) => {
    if (!activeTicketId) return;

    const ticket = whatsapp.tickets?.find((t) => t.id === activeTicketId);
    if (!ticket?.contatoTelefone) {
      console.error('[Atendimento] Ticket sem telefone de contato');
      return;
    }

    try {
      await whatsapp.enviarMensagem(activeTicketId, ticket.contatoTelefone, mensagem);
      console.log('[Atendimento] Mensagem enviada com sucesso');
    } catch (error) {
      console.error('[Atendimento] Erro ao enviar mensagem:', error);
    }
  };

  // NOVO: Handlers da busca rápida
  const handleSelecionarResultadoBusca = (resultado: any) => {
    console.log('[Atendimento] Resultado selecionado:', resultado);
    // TODO: Implementar navegação baseada no tipo de resultado
    // Ex: abrir modal de proposta, abrir ticket, etc.
  };

  const handleEnviarResultadoNoChat = async (resultado: any) => {
    if (!activeTicketId) {
      console.warn('[Atendimento] Nenhum ticket ativo para enviar mensagem');
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

  const activeTicket = whatsapp.tickets?.find((t) => t.id === activeTicketId);
  const mensagensDoTicket = activeTicketId ? whatsapp.mensagens?.get(activeTicketId) || [] : [];

  // NOVO: Extrair clienteId do ticket
  // Por enquanto usamos uma lógica simples: ID do cliente baseado no telefone
  // Futuramente, o backend deve retornar o clienteId diretamente no ticket
  const clienteId = activeTicket?.contatoTelefone
    ? `cliente-${activeTicket.contatoTelefone.replace(/\D/g, '')}` // Remove caracteres não numéricos
    : null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Indicador de conexão */}
      <div className="fixed top-4 right-4 z-50">
        {whatsapp.connecting && (
          <div className="flex items-center gap-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Conectando...
          </div>
        )}
        {whatsapp.connected && (
          <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Online
          </div>
        )}
        {whatsapp.wsError && !whatsapp.connected && !whatsapp.connecting && (
          <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full" />
            Offline
          </div>
        )}
      </div>

      {/* Sidebar com lista de tickets */}
      <div className="w-80 bg-white border-r shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">Atendimentos</h2>
            {/* NOVO: Botão de busca rápida */}
            <button
              onClick={() => setBuscaRapidaAberta(true)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1.5 transition-colors"
              title="Busca rápida (Ctrl+K)"
            >
              <span>🔍</span>
              <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+K</kbd>
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {whatsapp.tickets?.length || 0} ticket{whatsapp.tickets?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {whatsapp.loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando tickets...</p>
            </div>
          </div>
        ) : (
          <TicketList
            tickets={whatsapp.tickets || []}
            activeTicketId={activeTicketId}
            onTicketSelect={handleTicketSelect}
          />
        )}
      </div>

      {/* Área principal */}
      <div className="flex-1 flex flex-col">
        {activeTicket ? (
          <>
            {/* Cabeçalho */}
            <div className="bg-white border-b px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {activeTicket.contatoNome || 'Sem nome'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ticket #{activeTicket.numero} • {activeTicket.contatoTelefone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* NOVO: Botão toggle painel contexto */}
                  <button
                    onClick={() => setPainelContextoAberto(!painelContextoAberto)}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
                    title={painelContextoAberto ? 'Ocultar contexto do cliente' : 'Mostrar contexto do cliente'}
                  >
                    <span>{painelContextoAberto ? '✖️' : '📊'}</span>
                    <span>{painelContextoAberto ? 'Ocultar' : 'Contexto'}</span>
                  </button>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${activeTicket.status === 'ABERTO'
                      ? 'bg-blue-100 text-blue-800'
                      : activeTicket.status === 'EM_ATENDIMENTO'
                        ? 'bg-yellow-100 text-yellow-800'
                        : activeTicket.status === 'RESOLVIDO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {activeTicket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de mensagens */}
            {whatsapp.loadingMensagens ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Carregando mensagens...</p>
                </div>
              </div>
            ) : (
              <MessageList mensagens={mensagensDoTicket} ticketId={activeTicketId} />
            )}

            {/* Input de mensagem */}
            <MessageInput
              ticketId={activeTicketId}
              onEnviarMensagem={handleEnviarMensagem}
              enviando={whatsapp.enviandoMensagem}
              onTyping={() => {
                // Emitir evento de digitando (implementar futuramente)
              }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum ticket selecionado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecione um ticket à esquerda para começar o atendimento
              </p>
            </div>
          </div>
        )}
      </div>

      {/* NOVO: Painel de Contexto do Cliente (3ª coluna) */}
      {activeTicket && clienteId && (
        <PainelContextoCliente
          clienteId={clienteId}
          ticketId={activeTicketId!}
          collapsed={!painelContextoAberto}
          onClose={() => setPainelContextoAberto(false)}
        />
      )}

      {/* Erro */}
      {whatsapp.erro && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {whatsapp.erro}
        </div>
      )}

      {/* NOVO: Modal de Busca Rápida (Ctrl+K) */}
      <BuscaRapida
        isOpen={buscaRapidaAberta}
        onClose={() => setBuscaRapidaAberta(false)}
        onSelecionarResultado={handleSelecionarResultadoBusca}
        onEnviarNoChat={handleEnviarResultadoNoChat}
      />
    </div>
  );
}
