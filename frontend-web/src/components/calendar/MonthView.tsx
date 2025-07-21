import React from 'react';
import { CalendarEvent, CalendarDay } from '../../types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { generateCalendarDays, getDayName } from '../../utils/calendarUtils';

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onDragStart: (eventId: string) => void;
  onDragEnd: () => void;
  onDrop: (date: Date) => void;
  draggedEvent: string | null;
  dropTarget: Date | null;
}

export const MonthView: React.FC<MonthViewProps> = ({
  date,
  events,
  onEventClick,
  onDateClick,
  onDragStart,
  onDragEnd,
  onDrop,
  draggedEvent,
  dropTarget
}) => {
  const calendarDays = generateCalendarDays(date, events);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleDayClick = (day: CalendarDay, e: React.MouseEvent) => {
    // Se não clicou em um evento
    if ((e.target as HTMLElement).closest('.calendar-event') === null) {
      onDateClick(day.date);
    }
  };

  const handleDrop = (day: CalendarDay) => {
    if (draggedEvent) {
      onDrop(day.date);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((dayName) => (
          <div
            key={dayName}
            className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const isDropTarget = dropTarget && 
            dropTarget.toDateString() === day.date.toDateString();
          
          return (
            <div
              key={index}
              className={`
                min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer
                transition-colors duration-200 relative
                ${day.isCurrentMonth 
                  ? 'bg-white hover:bg-gray-50' 
                  : 'bg-gray-50 text-gray-400'
                }
                ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                ${day.isWeekend && day.isCurrentMonth ? 'bg-gray-50' : ''}
                ${isDropTarget ? 'bg-green-50 border-green-300' : ''}
              `}
              onClick={(e) => handleDayClick(day, e)}
              onDrop={() => handleDrop(day)}
              onDragOver={handleDragOver}
            >
              {/* Número do dia */}
              <div className="flex justify-between items-center mb-2">
                <span className={`
                  text-sm font-medium
                  ${day.isToday 
                    ? 'w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs' 
                    : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }
                `}>
                  {day.date.getDate()}
                </span>
                
                {/* Indicador de eventos */}
                {day.events.length > 3 && (
                  <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded">
                    +{day.events.length - 3}
                  </span>
                )}
              </div>

              {/* Lista de eventos */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="calendar-event"
                    style={{
                      opacity: draggedEvent === event.id ? 0.3 : 1
                    }}
                  >
                    <CalendarEventComponent
                      event={event}
                      onClick={onEventClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      compact={true}
                      className="text-xs"
                      isDragging={draggedEvent === event.id}
                    />
                  </div>
                ))}
                
                {/* Eventos ocultos - mostrar apenas dots */}
                {day.events.length > 3 && (
                  <div className="flex space-x-1 mt-1">
                    {day.events.slice(3, 6).map((event) => (
                      <div
                        key={event.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: event.color || '#9CA3AF' }}
                        title={event.title}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Indicador de drop zone */}
              {isDropTarget && (
                <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded-lg bg-green-50/50 flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">
                    Soltar aqui
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
