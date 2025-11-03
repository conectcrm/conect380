// Bloco customizado - Condição (If/Else)

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { BlockData } from '../../types/flow-builder.types';

export const ConditionBlock: React.FC<NodeProps<BlockData>> = ({ data, selected }) => {
  const condicoes = data.etapa?.condicoes || [];
  const preview = condicoes.length > 0
    ? `${condicoes[0].campo} ${condicoes[0].operador} ${condicoes[0].valor || ''}`
    : 'Clique para configurar';

  return (
    <div className={`relative bg-white rounded-lg shadow-md border-2 ${selected ? 'border-teal-500' : 'border-gray-300'
      } transition-all hover:shadow-lg min-w-[200px] max-w-[300px]`}>

      {/* Handle de entrada (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-teal-500 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 bg-teal-500 text-white px-3 py-2 rounded-t-lg">
        <GitBranch className="w-4 h-4" />
        <span className="text-sm font-semibold">Condição</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap break-words">
          {preview}
        </p>
      </div>

      {/* Handles de saída (left e right) */}
      <Handle
        type="source"
        position={Position.Left}
        id="source-false"
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
      <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 text-xs font-bold text-red-600 bg-white px-2 py-1 rounded shadow">
        Não
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="source-true"
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-xs font-bold text-green-600 bg-white px-2 py-1 rounded shadow">
        Sim
      </div>
    </div>
  );
};
