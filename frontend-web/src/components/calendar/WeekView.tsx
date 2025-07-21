import React, { useRef, useEffect } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { 
  generateWeekDays, 
  generateTimeSlots, 
  getDayName, 
  calculateEventPosition,
  organizeEventColumns,
  isSameDay
} from '../../utils/calendarUtils';

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
  onDragStart: (eventId: string) => void;
  onDragEnd: () => void;
  onDrop: (date: Date) => void;
  draggedEvent: string | null;
  dropTarget: Date | null;
}

export const WeekView: React.FC<WeekViewProps> = ({
  date,
  events,
  onEventClick,
  onTimeSlotClick,
  onDragStart,
  onDragEnd,
  onDrop,
  draggedEvent,
  dropTarget
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekDays = generateWeekDays(date);
  const timeSlots = generateTimeSlots();
  const today = new Date();

  // Scroll para o horário atual
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, (currentHour - 8) * 80); // 80px por hora
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const handleTimeSlotClick = (day: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const clickedDateTime = new Date(day);
    clickedDateTime.setHours(hours, minutes, 0, 0);
    onTimeSlotClick(clickedDateTime);
  };

  const handleDrop = (day: Date, timeSlot: string) => {
    if (draggedEvent) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const dropDateTime = new Date(day);
      dropDateTime.setHours(hours, minutes, 0, 0);
      onDrop(dropDateTime);
    }
  };

  const renderEventsForDay = (day: Date) => {
    const dayEvents = events.filter(event => isSameDay(event.start, day));
    const eventColumns = organizeEventColumns(dayEvents);
    const totalColumns = eventColumns.length;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {eventColumns.map((column, columnIndex) =>
          column.map((event) => {
            const position = calculateEventPosition(event, 960); // 960px = 12 horas * 80px
            const width = totalColumns > 0 ? `${100 / totalColumns}%` : '100%';
            const left = `${(columnIndex * 100) / totalColumns}%`;

            return (
              <div
                key={event.id}
                className="absolute pointer-events-auto"
                style={{
                  top: `${position.top}px`,
                  height: `${Math.max(40, position.height)}px`,
                  left,
                  width,
                  zIndex: draggedEvent === event.id ? 50 : 10
                }}
              >
                <div className="h-full mx-1">
                  <CalendarEventComponent
                    event={event}
                    onClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    className="h-full"
                    isDragging={draggedEvent === event.id}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header dos dias */}
      <div className="grid grid-cols-8 border-b bg-gray-50">
        {/* Coluna vazia para alinhamento com horários */}
        <div className="p-4 border-r border-gray-200"></div>
        
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          
          return (
            <div
              key={day.toISOString()}
              className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-600">
                {getDayName(day, 'short')}
              </div>
              <div className={`text-lg font-bold mt-1 ${
                isToday 
                  ? 'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto'
                  : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Container com scroll para os horários */}
      <div 
        ref={scrollContainerRef}
        className="h-96 overflow-y-auto"
      >
        <div className="grid grid-cols-8 relative">
          {/* Coluna dos horários */}
          <div className="border-r border-gray-200">
            {timeSlots.map((timeSlot) => (
              <div
                key={timeSlot}
                className="h-20 border-b border-gray-100 p-2 text-xs text-gray-600 flex items-start"
              >
                {timeSlot.endsWith(':00') && (
                  <span className="font-medium">{timeSlot}</span>
                )}
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            
            return (
              <div
                key={day.toISOString()}
                className={`border-r border-gray-200 last:border-r-0 relative ${
                  isToday ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Grid de horários */}
                {timeSlots.map((timeSlot, index) => {
                  const isDropTarget = dropTarget && 
                    isSameDay(dropTarget, day) &&
                    dropTarget.getHours() === parseInt(timeSlot.split(':')[0]) &&
                    dropTarget.getMinutes() === parseInt(timeSlot.split(':')[1]);

                  return (
                    <div
                      key={timeSlot}
                      className={`
                        h-20 border-b border-gray-100 cursor-pointer hover:bg-gray-50
                        transition-colors duration-150 relative
                        ${isDropTarget ? 'bg-green-50 border-green-300' : ''}
                      `}
                      onClick={() => handleTimeSlotClick(day, timeSlot)}
                      onDrop={() => handleDrop(day, timeSlot)}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {/* Linha de hora atual */}
                      {isToday && timeSlot === `${today.getHours()}:${today.getMinutes() < 30 ? '00' : '30'}` && (
                        <div className="absolute left-0 right-0 top-1/2 border-t-2 border-red-500 z-20">
                          <div className="w-2 h-2 bg-red-500 rounded-full -mt-1"></div>
                        </div>
                      )}

                      {/* Indicador de drop zone */}
                      {isDropTarget && (
                        <div className="absolute inset-0 border-2 border-dashed border-green-400 bg-green-50/50 flex items-center justify-center">
                          <span className="text-green-600 text-xs font-medium">
                            Soltar aqui
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Eventos do dia */}
                {renderEventsForDay(day)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
