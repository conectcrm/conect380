// Bloco customizado - Mensagem

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import { BlockData } from '../../types/flow-builder.types';

export const MessageBlock: React.FC<NodeProps<BlockData>> = ({ data, selected }) => {
  const mensagem = data.etapa?.mensagem || 'Clique para configurar';
  const preview = mensagem.length > 50 ? mensagem.substring(0, 50) + '...' : mensagem;

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border-2 ${
        selected ? 'border-blue-500' : 'border-gray-300'
      } transition-all hover:shadow-lg min-w-[200px] max-w-[300px]`}
    >
      {/* Handle de entrada (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-t-lg">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-semibold">Mensagem</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{preview}</p>
      </div>

      {/* Handle de saída (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};
