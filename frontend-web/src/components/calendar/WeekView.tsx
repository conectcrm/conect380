import React, { useEffect, useMemo, useRef } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import {
  generateWeekDays,
  generateTimeSlots,
  getDayName,
  calculateEventPosition,
  organizeEventColumns,
  isSameDay,
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
  daysToShow?: 1 | 7;
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
  dropTarget,
  daysToShow = 7,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const visibleDays = useMemo(
    () => (daysToShow === 1 ? [new Date(date)] : generateWeekDays(date)),
    [date, daysToShow],
  );
  const timeSlots = generateTimeSlots();
  const today = new Date();
  const currentTimeSlot = `${today.getHours().toString().padStart(2, '0')}:${
    today.getMinutes() < 30 ? '00' : '30'
  }`;
  const minWidthClass = daysToShow === 1 ? 'min-w-[340px]' : 'min-w-[860px]';
  const gridTemplateColumns = `72px repeat(${visibleDays.length}, minmax(120px, 1fr))`;

  // Scroll to current hour when opening the view.
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, (currentHour - 8) * 80);
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
    const dayEvents = events.filter((event) => isSameDay(event.start, day));
    const eventColumns = organizeEventColumns(dayEvents);
    const totalColumns = eventColumns.length;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {eventColumns.map((column, columnIndex) =>
          column.map((event) => {
            const position = calculateEventPosition(event, 960);
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
                  zIndex: draggedEvent === event.id ? 50 : 10,
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
          }),
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <div className={minWidthClass}>
          {/* Header days */}
          <div className="border-b bg-gray-50" style={{ display: 'grid', gridTemplateColumns }}>
            <div className="p-3 border-r border-gray-200 sticky left-0 z-20 bg-gray-50"></div>

            {visibleDays.map((day) => {
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-xs sm:text-sm font-medium text-gray-600 capitalize">
                    {getDayName(day, daysToShow === 1 ? 'long' : 'short')}
                  </div>
                  <div
                    className={`text-base sm:text-lg font-bold mt-1 ${
                      isToday
                        ? 'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto'
                        : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div ref={scrollContainerRef} className="h-96 overflow-y-auto">
            <div className="relative" style={{ display: 'grid', gridTemplateColumns }}>
              <div className="border-r border-gray-200 sticky left-0 z-20 bg-white">
                {timeSlots.map((timeSlot) => (
                  <div
                    key={timeSlot}
                    className="h-20 border-b border-gray-100 p-2 text-xs text-gray-600 flex items-start"
                  >
                    {timeSlot.endsWith(':00') && <span className="font-medium">{timeSlot}</span>}
                  </div>
                ))}
              </div>

              {visibleDays.map((day) => {
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-gray-200 last:border-r-0 relative ${
                      isToday ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {timeSlots.map((timeSlot) => {
                      const isDropTarget =
                        dropTarget &&
                        isSameDay(dropTarget, day) &&
                        dropTarget.getHours() === parseInt(timeSlot.split(':')[0], 10) &&
                        dropTarget.getMinutes() === parseInt(timeSlot.split(':')[1], 10);

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
                          {isToday && timeSlot === currentTimeSlot && (
                            <div className="absolute left-0 right-0 top-1/2 border-t-2 border-red-500 z-20">
                              <div className="w-2 h-2 bg-red-500 rounded-full -mt-1"></div>
                            </div>
                          )}

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

                    {renderEventsForDay(day)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
