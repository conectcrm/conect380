import React from 'react';

interface TypingIndicatorProps {
  usuarioNome?: string;
}

export function TypingIndicator({ usuarioNome }: TypingIndicatorProps) {
  return (
    <div className="px-6 py-2 bg-gray-50 border-t">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <span>{usuarioNome ? `${usuarioNome} está digitando...` : 'Digitando...'}</span>
      </div>
    </div>
  );
}
