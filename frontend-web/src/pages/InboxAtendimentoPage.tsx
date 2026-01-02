/**
 * Chat - Layout Fullscreen Estilo Zendesk/Intercom
 * 
 * IMPORTANTE: Esta página renderiza em TELA CHEIA (fora do DashboardLayout).
 * A estrutura 3 colunas (lista + chat + painel cliente) vem do ChatOmnichannel.
 * 
 * @author ConectCRM
 * @date 09/12/2025
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import ChatOmnichannel from '../features/atendimento/omnichannel/ChatOmnichannel';

const InboxAtendimentoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* Header Mínimo - Fixo no topo */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate('/nuclei/atendimento')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-2"
          title="Voltar ao módulo Atendimento"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Atendimento</span>
        </button>

        <div className="h-6 w-px bg-gray-300" /> {/* Divisor */}

        {/* Botão Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          title="Ir para Dashboard"
        >
          <LayoutGrid className="h-5 w-5" />
        </button>

        {/* Título */}
        <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
      </div>

      {/* ChatOmnichannel ocupa o resto da tela */}
      <div className="flex-1 overflow-hidden">
        <ChatOmnichannel />
      </div>
    </div>
  );
};

export default InboxAtendimentoPage;
