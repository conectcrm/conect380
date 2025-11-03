// Bloco customizado - Pergunta

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HelpCircle } from 'lucide-react';
import { BlockData } from '../../types/flow-builder.types';

export const QuestionBlock: React.FC<NodeProps<BlockData>> = ({ data, selected }) => {
  const mensagem = data.etapa?.mensagem || 'Clique para configurar';
  const preview = mensagem.length > 50 ? mensagem.substring(0, 50) + '...' : mensagem;

  return (
    <div className={`relative bg-white rounded-lg shadow-md border-2 ${selected ? 'border-yellow-500' : 'border-gray-300'
      } transition-all hover:shadow-lg min-w-[200px] max-w-[300px]`}>

      {/* Handle de entrada (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 bg-yellow-500 text-white px-3 py-2 rounded-t-lg">
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">Pergunta</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {preview}
        </p>
        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Aguarda resposta
          </span>
        </div>
      </div>

      {/* Handle de saída (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />
    </div>
  );
};
