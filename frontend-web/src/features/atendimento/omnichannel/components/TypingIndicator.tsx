import React from 'react';

interface TypingIndicatorProps {
  nomeContato: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ nomeContato }) => {
  return (
    <div className="flex gap-3 justify-start animate-fade-in">
      <div className="flex-shrink-0">
        <div className="w-8 h-8" /> {/* Espaço para alinhamento */}
      </div>

      <div className="max-w-md">
        <span className="text-xs text-gray-500 mb-1 px-1">{nomeContato}</span>

        <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 shadow-sm">
          <div className="flex gap-1.5 items-center">
            {/* Bolinhas animadas */}
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
