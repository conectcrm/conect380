import React, { useState } from 'react';
import { TicketListAprimorado } from './TicketListAprimorado';
import { ChatHeader } from './ChatHeader';
import { TemplatesRapidos } from './TemplatesRapidos';
import { useTicketFilters } from './TicketFilters';

/**
 * Componente de exemplo mostrando como integrar os novos componentes
 * de atendimento criados na FASE 2.
 *
 * Este arquivo serve como referência de implementação e pode ser adaptado
 * para o layout específico do seu sistema.
 */

// Dados de exemplo
const TICKETS_EXEMPLO = [
  {
    id: '1',
    numero: 1001,
    empresaId: 'emp-1',
    clienteId: 'cli-1',
    canalId: 'canal-whatsapp',
    status: 'aberto',
    prioridade: 'alta',
    assunto: 'Problema com login',
    descricao: 'Cliente não consegue acessar o sistema',
    contatoNome: 'João Silva',
    contatoTelefone: '(11) 98888-8888',
    clienteNome: 'Empresa ABC',
    clienteVip: true,
    ultimaMensagem: 'Olá, preciso de ajuda urgente!',
    mensagensNaoLidas: 3,
    criadoEm: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
    atualizadoEm: new Date(Date.now() - 30 * 60 * 1000), // 30min atrás
  },
  {
    id: '2',
    numero: 1002,
    empresaId: 'emp-1',
    clienteId: 'cli-2',
    canalId: 'canal-whatsapp',
    filaId: 'fila-suporte',
    atendenteId: 'atendente-1',
    status: 'em_atendimento',
    prioridade: 'media',
    assunto: 'Dúvida sobre fatura',
    descricao: 'Cliente quer entender os valores cobrados',
    contatoNome: 'Maria Santos',
    contatoTelefone: '(11) 97777-7777',
    clienteNome: 'Loja XYZ',
    ultimaMensagem: 'Entendi, vou aguardar o envio por email.',
    criadoEm: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h atrás
    atualizadoEm: new Date(Date.now() - 15 * 60 * 1000), // 15min atrás
  },
  {
    id: '3',
    numero: 1003,
    empresaId: 'emp-1',
    clienteId: 'cli-3',
    canalId: 'canal-whatsapp',
    status: 'aberto',
    prioridade: 'baixa',
    assunto: 'Solicitação de recurso',
    descricao: 'Cliente pediu nova funcionalidade',
    contatoNome: 'Pedro Costa',
    contatoTelefone: '(11) 96666-6666',
    clienteNome: 'Tech Solutions',
    ultimaMensagem: 'Seria possível adicionar exportação em Excel?',
    mensagensNaoLidas: 1,
    criadoEm: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    atualizadoEm: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
  },
  {
    id: '4',
    numero: 1004,
    empresaId: 'emp-1',
    canalId: 'canal-whatsapp',
    status: 'resolvido',
    prioridade: 'media',
    assunto: 'Configuração de integração',
    descricao: 'Ajuda com API',
    contatoNome: 'Ana Paula',
    contatoTelefone: '(11) 95555-5555',
    ultimaMensagem: 'Perfeito! Consegui configurar. Obrigada!',
    criadoEm: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 dias atrás
    atualizadoEm: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h atrás
  },
];

export const AtendimentoChatExample: React.FC = () => {
  // Estado do ticket ativo
  const [activeTicketId, setActiveTicketId] = useState<string | null>(
    TICKETS_EXEMPLO[0]?.id || null,
  );

  // Estado do painel de contexto
  const [contextoAberto, setContextoAberto] = useState(true);

  // Filtros usando hook customizado
  const { filters, setFilters, clearFilters } = useTicketFilters();

  // Ticket selecionado
  const activeTicket = TICKETS_EXEMPLO.find((t) => t.id === activeTicketId) || null;

  // Handlers
  const handleStatusChange = (status: string) => {
    console.log('Mudar status para:', status);
    // Implementar lógica de atualização
  };

  const handlePrioridadeChange = (prioridade: string) => {
    console.log('Mudar prioridade para:', prioridade);
    // Implementar lógica de atualização
  };

  const handleSelecionarTemplate = (texto: string) => {
    console.log('Template selecionado:', texto);
    // Implementar lógica para inserir texto no input de mensagem
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Layout: TicketList + Chat + PainelContexto (opcional) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Tickets - 400px */}
        <TicketListAprimorado
          tickets={TICKETS_EXEMPLO}
          activeTicketId={activeTicketId}
          onTicketSelect={setActiveTicketId}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />

        {/* Área do Chat */}
        <div className="flex-1 flex flex-col">
          {/* Header do Chat */}
          <ChatHeader
            ticket={activeTicket}
            contextoAberto={contextoAberto}
            onToggleContexto={() => setContextoAberto(!contextoAberto)}
            onStatusChange={handleStatusChange}
            onPrioridadeChange={handlePrioridadeChange}
          />

          {/* Área de mensagens */}
          <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {activeTicket ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-lg mb-2">Chat com {activeTicket.contatoNome}</p>
                  <p className="text-sm">Ticket #{activeTicket.numero}</p>
                  <p className="text-xs text-gray-400 mt-4">💡 As mensagens aparecerão aqui</p>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <p>Selecione um ticket para iniciar</p>
                </div>
              )}
            </div>
          </div>

          {/* Input de mensagem com Templates Rápidos */}
          <div className="bg-white border-t p-4">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
              {/* Templates Rápidos */}
              <TemplatesRapidos onSelecionarTemplate={handleSelecionarTemplate} />

              {/* Input de mensagem */}
              <div className="flex-1">
                <textarea
                  placeholder="Digite sua mensagem... (use / para templates rápidos)"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Botão enviar */}
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium h-[68px]">
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* Painel de Contexto (opcional) */}
        {contextoAberto && (
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Contexto do Cliente</h3>
            {activeTicket && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cliente</p>
                  <p className="font-medium">{activeTicket.clienteNome || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contato</p>
                  <p className="font-medium">{activeTicket.contatoNome}</p>
                  <p className="text-sm text-gray-600">{activeTicket.contatoTelefone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="font-medium capitalize">{activeTicket.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Prioridade</p>
                  <p className="font-medium capitalize">{activeTicket.prioridade}</p>
                </div>
                {activeTicket.clienteVip && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800">⭐ Cliente VIP</p>
                    <p className="text-xs text-yellow-700 mt-1">Priorize este atendimento</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtendimentoChatExample;
