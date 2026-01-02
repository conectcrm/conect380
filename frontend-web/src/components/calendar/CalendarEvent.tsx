import React from 'react';
import { CalendarEvent, EVENT_COLORS, PRIORITY_COLORS } from '../../types/calendar';
import { formatDate } from '../../utils/calendarUtils';
import {
  Clock,
  MapPin,
  Users,
  Phone,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface CalendarEventComponentProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  onDragStart?: (eventId: string) => void;
  onDragEnd?: () => void;
  className?: string;
  compact?: boolean;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

export const CalendarEventComponent: React.FC<CalendarEventComponentProps> = ({
  event,
  onClick,
  onDragStart,
  onDragEnd,
  className = '',
  compact = false,
  style = {},
  isDragging = false,
}) => {
  const eventColor = EVENT_COLORS[event.type];
  const priorityColor = PRIORITY_COLORS[event.priority];

  const getStatusIcon = () => {
    switch (event.status) {
      case 'confirmed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = () => {
    switch (event.type) {
      case 'meeting':
        return <Users className="w-3 h-3" />;
      case 'call':
        return <Phone className="w-3 h-3" />;
      case 'task':
        return <CheckCircle className="w-3 h-3" />;
      case 'event':
        return <Calendar className="w-3 h-3" />;
      case 'follow-up':
        return <User className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', event.id);
      onDragStart(event.id);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(event);
    }
  };

  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60); // minutos

  return (
    <div
      className={`
        relative rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md
        transition-all duration-200 cursor-pointer select-none group
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-102'}
        ${event.priority === 'high' ? 'ring-1 ring-red-200' : ''}
        ${className}
      `}
      style={{
        borderLeftColor: eventColor,
        ...style,
      }}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable={true}
    >
      {/* Conteúdo principal */}
      <div className={`p-2 ${compact ? 'space-y-1' : 'space-y-2'}`}>
        {/* Header com horário e status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="w-3 h-3" />
            <span className="font-medium">
              {formatDate(event.start, 'time')}
              {!compact && duration > 30 && (
                <span className="text-gray-400">
                  {' - '}
                  {formatDate(event.end, 'time')}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            {event.priority === 'high' && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorityColor }}
                title="Alta prioridade"
              />
            )}
          </div>
        </div>

        {/* Título */}
        <div className="flex items-start space-x-2">
          <div className="text-gray-600 mt-0.5">{getTypeIcon()}</div>
          <div className="flex-1 min-w-0">
            <h4
              className={`font-medium text-gray-900 leading-tight ${
                compact ? 'text-xs truncate' : 'text-sm'
              }`}
            >
              {event.title}
            </h4>

            {/* Cliente */}
            {event.cliente && !compact && (
              <p className="text-xs text-gray-600 truncate mt-1">{event.cliente.name}</p>
            )}
          </div>
        </div>

        {/* Informações adicionais (apenas se não for compact) */}
        {!compact && (
          <>
            {/* Localização */}
            {event.location && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            {/* Participantes */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>
                  {event.attendees.length} participante{event.attendees.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Descrição (apenas primeiras palavras) */}
            {event.description && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Indicador de drag */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full mt-1"></div>
      </div>

      {/* Border de prioridade alta */}
      {event.priority === 'high' && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-red-500"></div>
      )}
    </div>
  );
};
