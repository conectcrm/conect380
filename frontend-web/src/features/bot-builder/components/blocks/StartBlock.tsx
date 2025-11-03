// Bloco customizado - Início do fluxo

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

export const StartBlock: React.FC = () => {
  return (
    <div className="relative">
      <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg border-4 border-white">
        <Play className="w-10 h-10 text-white fill-white" />
      </div>

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded shadow">
          Início
        </span>
      </div>

      {/* Handle de saída (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
};
