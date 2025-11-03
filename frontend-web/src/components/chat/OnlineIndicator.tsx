import React from 'react';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lastActivity?: string | Date | null;
  className?: string;
}

/**
 * Componente para mostrar indicador de status online/offline
 * 
 * @example
 * // Apenas bolinha
 * <OnlineIndicator isOnline={true} />
 * 
 * @example
 * // Com texto
 * <OnlineIndicator isOnline={true} showText lastActivity={ticket.contatoLastActivity} />
 */
export function OnlineIndicator({
  isOnline,
  size = 'md',
  showText = false,
  lastActivity,
  className = ''
}: OnlineIndicatorProps) {

  // Tamanhos da bolinha
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  // Formatar tempo desde última atividade
  const formatarTempoOffline = (lastActivity: string | Date | null | undefined): string => {
    if (!lastActivity) return 'Nunca visto';

    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const statusText = isOnline
    ? '🟢 Online agora'
    : `Visto há ${formatarTempoOffline(lastActivity)}`;

  if (showText) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div
          className={`${sizeClasses[size]} rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'
            } animate-pulse`}
          title={statusText}
        />
        <span className="text-xs text-gray-500">
          {statusText}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'
        } ${isOnline ? 'animate-pulse' : ''} ${className}`}
      title={statusText}
    />
  );
}

/**
 * Componente para avatar com indicador de status
 */
interface AvatarWithStatusProps {
  nome: string;
  isOnline: boolean;
  foto?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarWithStatus({
  nome,
  isOnline,
  foto,
  size = 'md'
}: AvatarWithStatusProps) {

  // Tamanhos do avatar
  const avatarSizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  // Tamanhos do indicador
  const indicatorSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  // Obter iniciais do nome
  const getIniciais = (nome: string): string => {
    if (!nome) return '?';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      {foto ? (
        <img
          src={foto}
          alt={nome}
          className={`${avatarSizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${avatarSizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold`}>
          {getIniciais(nome)}
        </div>
      )}

      {/* Bolinha de status */}
      <div
        className={`absolute bottom-0 right-0 ${indicatorSizes[size]} rounded-full border-2 border-white ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        title={isOnline ? 'Online' : 'Offline'}
      />
    </div>
  );
}
