'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { CalendarEvent } from '@/types/schedule';

interface CalendarProps {
  events: CalendarEvent[];
}

export default function Calendar({ events }: CalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <div className="w-full h-full p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
          }}
          events={events}
          height="auto"
          eventDisplay="block"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          eventClassNames="cursor-pointer"
          eventClick={handleEventClick}
          eventContent={(eventInfo) => {
            const { type, reason, matches, substitutes } = eventInfo.event.extendedProps;

            if (type === 'holiday') {
              return (
                <div className="p-2 overflow-hidden">
                  <div className="font-semibold text-sm text-center">
                    {reason}
                  </div>
                </div>
              );
            }

            if (type === 'session' && matches) {
              // Consolidated session event
              return (
                <div className="p-2 overflow-hidden">
                  <div className="font-bold text-sm mb-1">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-xs space-y-0.5 max-h-20 overflow-y-auto">
                    {matches.slice(0, 3).map((match: any, idx: number) => (
                      <div key={idx} className="truncate">
                        {match.volunteer.name} → {match.student.name}
                      </div>
                    ))}
                    {matches.length > 3 && (
                      <div className="text-xs italic opacity-80">
                        +{matches.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (type === 'substitute' && substitutes) {
              // Consolidated substitute event
              return (
                <div className="p-2 overflow-hidden">
                  <div className="font-bold text-sm mb-1">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-xs space-y-0.5 max-h-20 overflow-y-auto">
                    {substitutes.slice(0, 3).map((sub: any, idx: number) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="truncate">
                          <span className="font-semibold">{sub.substitute}</span> → {sub.student}
                        </div>
                        <div className="text-[10px] opacity-80 italic truncate">
                          for {sub.original} • {sub.time}
                        </div>
                      </div>
                    ))}
                    {substitutes.length > 3 && (
                      <div className="text-xs italic opacity-80">
                        +{substitutes.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          }}
        />
      </div>

      {/* Modal */}
      {showModal && selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {new Date(selectedEvent.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                  <p className="text-blue-100">{selectedEvent.title}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {selectedEvent.extendedProps.type === 'holiday' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏖️</div>
                  <p className="text-xl text-gray-600">{selectedEvent.extendedProps.reason}</p>
                </div>
              )}

              {selectedEvent.extendedProps.type === 'session' && selectedEvent.extendedProps.matches && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Regular Sessions ({selectedEvent.extendedProps.matches.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedEvent.extendedProps.matches.map((match: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-lg">
                              {match.volunteer.name}
                            </div>
                            <div className="text-gray-600 flex items-center mt-1">
                              <span className="mr-2">→</span>
                              <span>{match.student.name}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                            {match.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.type === 'substitute' && selectedEvent.extendedProps.substitutes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Substitute Sessions ({selectedEvent.extendedProps.substitutes.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedEvent.extendedProps.substitutes.map((sub: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-lg">
                              {sub.substitute}
                              <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                SUB
                              </span>
                            </div>
                            <div className="text-gray-600 flex items-center mt-1">
                              <span className="mr-2">→</span>
                              <span>{sub.student}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                            {sub.time}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 italic mt-2 pt-2 border-t border-orange-200">
                          Substituting for: <span className="font-medium">{sub.original}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={closeModal}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
