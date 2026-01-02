// Bloco customizado - Ação

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, Users, UserCheck, TicketIcon } from 'lucide-react';
import { BlockData } from '../../types/flow-builder.types';

export const ActionBlock: React.FC<NodeProps<BlockData>> = ({ data, selected }) => {
  const etapa = data.etapa;
  const acao = etapa?.opcoes?.[0]?.acao || 'proximo_passo';

  const getActionIcon = () => {
    switch (acao) {
      case 'transferir_nucleo':
        return <Users className="w-4 h-4" />;
      case 'transferir_atendente':
        return <UserCheck className="w-4 h-4" />;
      case 'criar_ticket':
        return <TicketIcon className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getActionLabel = () => {
    switch (acao) {
      case 'transferir_nucleo':
        return 'Transferir para Núcleo';
      case 'transferir_atendente':
        return 'Transferir para Atendente';
      case 'criar_ticket':
        return 'Criar Ticket';
      case 'finalizar':
        return 'Finalizar Atendimento';
      default:
        return 'Ação';
    }
  };

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border-2 ${
        selected ? 'border-orange-500' : 'border-gray-300'
      } transition-all hover:shadow-lg min-w-[200px] max-w-[280px]`}
    >
      {/* Handle de entrada (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-t-lg">
        {getActionIcon()}
        <span className="text-sm font-semibold">Ação</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800">{getActionLabel()}</p>
        {etapa?.mensagem && (
          <p className="text-xs text-gray-500 mt-1">
            {etapa.mensagem.substring(0, 60)}
            {etapa.mensagem.length > 60 ? '...' : ''}
          </p>
        )}
      </div>

      {/* Handle de saída (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
    </div>
  );
};
