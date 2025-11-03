// Bloco customizado - Fim do fluxo

import React from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle } from 'lucide-react';

export const EndBlock: React.FC = () => {
  return (
    <div className="relative">
      <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg border-4 border-white">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded shadow">
          Fim
        </span>
      </div>

      {/* Handle de entrada (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
    </div>
  );
};
