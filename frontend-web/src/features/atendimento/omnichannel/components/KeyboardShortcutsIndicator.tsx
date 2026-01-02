/**
 * ⌨️ Indicador de Atalhos de Teclado
 *
 * Mostra os atalhos disponíveis de forma sutil no header do chat
 */

import React from 'react';
import { Keyboard } from 'lucide-react';
import { StatusAtendimentoType } from '../types';

interface KeyboardShortcutsIndicatorProps {
  ticketStatus: StatusAtendimentoType;
}

export const KeyboardShortcutsIndicator: React.FC<KeyboardShortcutsIndicatorProps> = ({
  ticketStatus,
}) => {
  const getAtalhos = () => {
    switch (ticketStatus) {
      case 'aberto':
        return [{ tecla: 'A', acao: 'Assumir' }];
      case 'em_atendimento':
        return [
          { tecla: 'G', acao: 'Aguardar' },
          { tecla: 'R', acao: 'Resolver' },
        ];
      case 'aguardando':
        return [{ tecla: 'R', acao: 'Resolver' }];
      case 'resolvido':
        return [{ tecla: 'F', acao: 'Fechar' }];
      default:
        return [];
    }
  };

  const atalhos = getAtalhos();

  if (atalhos.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <Keyboard className="w-3.5 h-3.5" />
      <div className="flex items-center gap-2">
        {atalhos.map((atalho, index) => (
          <React.Fragment key={atalho.tecla}>
            {index > 0 && <span>·</span>}
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                {atalho.tecla}
              </kbd>
              <span>{atalho.acao}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
