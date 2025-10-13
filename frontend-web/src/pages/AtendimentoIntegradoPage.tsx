import React from 'react';
import { ChatOmnichannel } from '../features/atendimento/omnichannel';

/**
 * Página de Atendimento Omnichannel - Nova Interface
 * 
 * Layout de 3 colunas moderno e completo:
 * - Coluna 1: Lista de atendimentos com tabs (Aberto/Resolvido/Retornos)
 * - Coluna 2: Chat com mensagens em tempo real
 * - Coluna 3: Informações do cliente e demandas
 * 
 * Funcionalidades:
 * - Múltiplos canais (WhatsApp, Telegram, Email, Chat, Telefone)
 * - Contador de tempo em tempo real
 * - Status de mensagens (enviando/enviado/entregue/lido)
 * - Fotos de perfil dinâmicas
 * - Histórico de atendimentos
 * - Sistema de demandas
 * - Busca e filtros
 * - Design responsivo e moderno
 * 
 * NOTA: Este componente usa calc(100vh - 64px) para ocupar
 * toda altura disponível, considerando a navbar de 64px
 */
export function AtendimentoIntegradoPage() {
  return (
    <div style={{ height: 'calc(100vh - 64px)' }} className="w-full">
      <ChatOmnichannel />
    </div>
  );
}
