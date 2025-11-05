import React from 'react';
import ChatOmnichannel from '../omnichannel/ChatOmnichannel';

/**
 * Página de Atendimento Integrado
 * 
 * Esta página encapsula o sistema completo de chat omnichannel
 * com layout responsivo que se adapta a qualquer tamanho de tela
 * sem necessidade de scroll horizontal ou vertical desnecessário.
 * 
 * Funcionalidades:
 * - Layout responsivo para Desktop/Tablet/Mobile
 * - Múltiplos canais (WhatsApp, Telegram, Email, Chat, Telefone)
 * - Sistema de mensagens em tempo real
 * - Informações do cliente integradas
 * - Altura otimizada sem scroll desnecessário
 */
const AtendimentoIntegradoPage: React.FC = () => {
  return (
    <div className="chat-height-responsive chat-container-optimized">
      <ChatOmnichannel />
    </div>
  );
};

export default AtendimentoIntegradoPage;
