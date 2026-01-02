// Bloco customizado - Menu de Opções

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { List } from 'lucide-react';
import { BlockData } from '../../types/flow-builder.types';

export const MenuBlock: React.FC<NodeProps<BlockData>> = ({ data, selected }) => {
  const mensagem = data.etapa?.mensagem || 'Clique para configurar';
  const opcoes = data.etapa?.opcoes || [];
  const preview = mensagem.length > 40 ? mensagem.substring(0, 40) + '...' : mensagem;

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border-2 ${
        selected ? 'border-purple-500' : 'border-gray-300'
      } transition-all hover:shadow-lg min-w-[220px] max-w-[320px]`}
    >
      {/* Handle de entrada (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-t-lg">
        <List className="w-4 h-4" />
        <span className="text-sm font-semibold">Menu</span>
        {opcoes.length > 0 && (
          <span className="ml-auto text-xs bg-purple-600 px-2 py-0.5 rounded-full">
            {opcoes.length} opções
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap break-words">{preview}</p>

        {opcoes.length > 0 && (
          <div className="space-y-1 mt-2 border-t pt-2">
            {opcoes.slice(0, 3).map((opcao, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-700 rounded-full font-bold">
                  {opcao.valor}
                </span>
                <span className="truncate">{opcao.texto}</span>
              </div>
            ))}
            {opcoes.length > 3 && (
              <p className="text-xs text-gray-400 italic">+{opcoes.length - 3} opções...</p>
            )}
          </div>
        )}
      </div>

      {/* Handles de saída (right) - um por opção (máx. 12 para não sobrepor demais) */}
      {opcoes.length > 0 ? (
        opcoes.slice(0, 12).map((_, index) => {
          const topPercent = 15 + ((index + 1) / (Math.min(opcoes.length, 12) + 1)) * 70;
          return (
            <Handle
              key={`source-${index}`}
              type="source"
              position={Position.Right}
              id={`source-${index}`}
              style={{ top: `${topPercent}%` }}
              className="w-3 h-3 bg-purple-500 border-2 border-white"
            />
          );
        })
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-purple-500 border-2 border-white"
        />
      )}
    </div>
  );
};
