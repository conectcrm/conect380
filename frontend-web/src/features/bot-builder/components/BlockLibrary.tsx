// Biblioteca de Blocos - Sidebar com blocos arrastavéis

import React from 'react';
import {
  MessageSquare,
  List,
  HelpCircle,
  GitBranch,
  Zap,
  CheckCircle
} from 'lucide-react';

interface BlockTemplate {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const blockTemplates: BlockTemplate[] = [
  {
    id: 'message',
    type: 'message',
    label: 'Mensagem',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'Envia uma mensagem simples',
    color: 'blue',
  },
  {
    id: 'menu',
    type: 'menu',
    label: 'Menu',
    icon: <List className="w-5 h-5" />,
    description: 'Menu com opções para escolha',
    color: 'purple',
  },
  {
    id: 'question',
    type: 'question',
    label: 'Pergunta',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'Faz uma pergunta e aguarda resposta',
    color: 'yellow',
  },
  {
    id: 'condition',
    type: 'condition',
    label: 'Condição',
    icon: <GitBranch className="w-5 h-5" />,
    description: 'Cria ramificação (if/else)',
    color: 'teal',
  },
  {
    id: 'action',
    type: 'action',
    label: 'Ação',
    icon: <Zap className="w-5 h-5" />,
    description: 'Transfere ou cria ticket',
    color: 'orange',
  },
  {
    id: 'end',
    type: 'end',
    label: 'Fim',
    icon: <CheckCircle className="w-5 h-5" />,
    description: 'Finaliza o atendimento',
    color: 'red',
  },
];

const colorClasses: Record<string, { bg: string, text: string, hover: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', hover: 'hover:bg-blue-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', hover: 'hover:bg-purple-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', hover: 'hover:bg-yellow-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', hover: 'hover:bg-teal-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', hover: 'hover:bg-orange-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', hover: 'hover:bg-red-200' },
};

interface BlockLibraryProps {
  onAddBlock: (type: string) => void;
}

export const BlockLibrary: React.FC<BlockLibraryProps> = ({ onAddBlock }) => {
  const onDragStart = (event: React.DragEvent, blockType: string) => {
    event.dataTransfer.setData('application/reactflow', blockType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <h3 className="text-sm font-bold text-[#002333] uppercase tracking-wide">
          📦 Blocos
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Arraste os blocos para o canvas
        </p>
      </div>

      {/* Lista de blocos */}
      <div className="p-3 space-y-2">
        {blockTemplates.map((block) => {
          const colors = colorClasses[block.color];

          return (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => onDragStart(e, block.type)}
              onClick={() => onAddBlock(block.type)}
              className={`
                ${colors.bg} ${colors.text} ${colors.hover}
                border-2 border-transparent
                rounded-lg p-3 cursor-grab active:cursor-grabbing
                transition-all duration-200
                hover:scale-105 hover:shadow-md
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {block.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">
                    {block.label}
                  </h4>
                  <p className="text-xs opacity-75 mt-1">
                    {block.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dicas */}
      <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 to-transparent p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 Dica:</span> Arraste um bloco para o canvas ou clique para adicionar no final
          </p>
        </div>
      </div>
    </div>
  );
};
