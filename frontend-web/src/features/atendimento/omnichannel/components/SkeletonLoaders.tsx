import React from 'react';

/**
 * Skeleton para lista de tickets na sidebar
 */
export const TicketSkeleton: React.FC = () => {
  return (
    <div className="p-4 border-b border-gray-200 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>

        <div className="flex-1 space-y-2">
          {/* Nome + Badge */}
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-5 w-12 bg-gray-200 rounded"></div>
          </div>

          {/* Última mensagem */}
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>

          {/* Rodapé */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton para lista de tickets (múltiplos)
 */
export const TicketListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <TicketSkeleton key={index} />
      ))}
    </>
  );
};

/**
 * Skeleton para mensagens no chat
 */
export const MensagemSkeleton: React.FC<{ ehCliente?: boolean }> = ({ ehCliente = true }) => {
  return (
    <div className={`flex gap-3 animate-pulse ${ehCliente ? 'justify-start' : 'justify-end'}`}>
      {/* Avatar (cliente) */}
      {ehCliente && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      )}

      {/* Balão da mensagem */}
      <div className="max-w-md space-y-2">
        <div className={`rounded-2xl px-4 py-3 ${ehCliente ? 'bg-gray-100' : 'bg-blue-50'}`}>
          <div className="h-3 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Avatar (atendente) */}
      {!ehCliente && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton para lista de mensagens
 */
export const MensagensListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <MensagemSkeleton key={index} ehCliente={index % 3 !== 0} />
      ))}
    </>
  );
};

/**
 * Skeleton para header do chat
 */
export const ChatHeaderSkeleton: React.FC = () => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 animate-pulse">
      <div className="flex items-center justify-between">
        {/* Info do contato */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};
