
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
                <div className="p-1.5 overflow-hidden">
                  <div className="font-semibold text-xs text-center">
                    {reason}
                  </div>
                </div>
              );
            }

            if (type === 'session' && matches) {
              // Consolidated session event
              return (
                <div className="p-1.5 overflow-hidden">
                  <div className="font-bold text-xs mb-1">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-[10px] space-y-0.5 max-h-20 overflow-y-auto">
                    {matches.slice(0, 4).map((match: any, idx: number) => (
                      <div key={idx} className="truncate leading-tight">
                        {match.volunteer.name} → {match.student.name}
                      </div>
                    ))}
                    {matches.length > 4 && (
                      <div className="text-[10px] italic opacity-80">
                        +{matches.length - 4} more...
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (type === 'substitute-claimed' && substitutes) {
              // Claimed substitute event
              return (
                <div className="p-1.5 overflow-hidden">
                  <div className="font-bold text-xs mb-1">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-[10px] space-y-0.5 max-h-20 overflow-y-auto">
                    {substitutes.slice(0, 4).map((sub: any, idx: number) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="truncate leading-tight">
                          <span className="font-semibold">{sub.substitute}</span> → {sub.student}
                        </div>
                        <div className="text-[9px] opacity-80 italic truncate">
                          for {sub.original} • {sub.time}
                        </div>
                      </div>
                    ))}
                    {substitutes.length > 4 && (
                      <div className="text-[10px] italic opacity-80">
                        +{substitutes.length - 4} more...
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (type === 'substitute-open' && substitutes) {
              // Open substitute event
              return (
                <div className="p-1.5 overflow-hidden">
                  <div className="font-bold text-xs mb-1">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-[10px] space-y-0.5 max-h-20 overflow-y-auto">
                    {substitutes.slice(0, 4).map((sub: any, idx: number) => (
                      <div key={idx} className="truncate leading-tight">
                        {sub.original} for {sub.student} • {sub.time}
                      </div>
                    ))}
                    {substitutes.length > 4 && (
                      <div className="text-[10px] italic opacity-80">
                        +{substitutes.length - 4} more...
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
            <div className="bg-[#1e5a8e] text-white p-6">
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
                  <p className="text-white text-opacity-90">{selectedEvent.title}</p>
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

              {selectedEvent.extendedProps.type === 'session' && selectedEvent.extendedProps.matches && (() => {
                // Group matches by time slot
                const matchesByTime = selectedEvent.extendedProps.matches.reduce((acc: any, match: any) => {
                  const time = match.time;
                  if (!acc[time]) {
                    acc[time] = [];
                  }
                  acc[time].push(match);
                  return acc;
                }, {});

                // Sort time slots
                const sortedTimes = Object.keys(matchesByTime).sort((a, b) => {
                  // Parse times for proper sorting
                  const parseTime = (timeStr: string) => {
                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!match) return 0;
                    let hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    const period = match[3].toUpperCase();
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                  };
                  return parseTime(a) - parseTime(b);
                });

                return (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Regular Sessions ({selectedEvent.extendedProps.matches.length})
                    </h3>
                    <div className="space-y-6">
                      {sortedTimes.map((time: string) => (
                        <div key={time}>
                          <div className="flex items-center mb-3">
                            <div className="text-sm font-bold text-[#1e5a8e] bg-blue-50 px-3 py-1 rounded-full">
                              {time}
                            </div>
                            <div className="flex-1 h-px bg-gray-200 ml-3"></div>
                          </div>
                          <div className="space-y-2 ml-4">
                            {matchesByTime[time].map((match: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-blue-50 border-l-4 border-l-[#1e5a8e] border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">
                                      {match.volunteer.name}
                                    </div>
                                    <div className="text-gray-600 flex items-center mt-1 text-sm">
                                      <span className="mr-2">→</span>
                                      <span>{match.student.name}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {selectedEvent.extendedProps.type === 'substitute-claimed' && selectedEvent.extendedProps.substitutes && (() => {
                // Group substitutes by time slot
                const subsByTime = selectedEvent.extendedProps.substitutes.reduce((acc: any, sub: any) => {
                  const time = sub.time;
                  if (!acc[time]) {
                    acc[time] = [];
                  }
                  acc[time].push(sub);
                  return acc;
                }, {});

                // Sort time slots
                const sortedTimes = Object.keys(subsByTime).sort((a, b) => {
                  const parseTime = (timeStr: string) => {
                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!match) return 0;
                    let hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    const period = match[3].toUpperCase();
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                  };
                  return parseTime(a) - parseTime(b);
                });

                return (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Substitute Sessions ({selectedEvent.extendedProps.substitutes.length})
                    </h3>
                    <div className="space-y-6">
                      {sortedTimes.map((time: string) => (
                        <div key={time}>
                          <div className="flex items-center mb-3">
                            <div className="text-sm font-bold text-[#f5a623] bg-orange-50 px-3 py-1 rounded-full">
                              {time}
                            </div>
                            <div className="flex-1 h-px bg-gray-200 ml-3"></div>
                          </div>
                          <div className="space-y-2 ml-4">
                            {subsByTime[time].map((sub: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-orange-50 border-l-4 border-l-[#f5a623] border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">
                                      {sub.substitute}
                                      <span className="ml-2 text-xs bg-[#f5a623] text-white px-2 py-1 rounded-full">
                                        SUB
                                      </span>
                                    </div>
                                    <div className="text-gray-600 flex items-center mt-1 text-sm">
                                      <span className="mr-2">→</span>
                                      <span>{sub.student}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500 italic mt-2 pt-2 border-t border-orange-200">
                                  Substituting for: <span className="font-medium">{sub.original}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {selectedEvent.extendedProps.type === 'substitute-open' && selectedEvent.extendedProps.substitutes && (() => {
                // Group open substitutes by time slot
                const subsByTime = selectedEvent.extendedProps.substitutes.reduce((acc: any, sub: any) => {
                  const time = sub.time;
                  if (!acc[time]) {
                    acc[time] = [];
                  }
                  acc[time].push(sub);
                  return acc;
                }, {});

                // Sort time slots
                const sortedTimes = Object.keys(subsByTime).sort((a, b) => {
                  const parseTime = (timeStr: string) => {
                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!match) return 0;
                    let hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    const period = match[3].toUpperCase();
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                  };
                  return parseTime(a) - parseTime(b);
                });

                return (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Open Substitute Requests ({selectedEvent.extendedProps.substitutes.length})
                    </h3>
                    <div className="space-y-6">
                      {sortedTimes.map((time: string) => (
                        <div key={time}>
                          <div className="flex items-center mb-3">
                            <div className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              {time}
                            </div>
                            <div className="flex-1 h-px bg-gray-200 ml-3"></div>
                          </div>
                          <div className="space-y-2 ml-4">
                            {subsByTime[time].map((sub: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-gray-50 border-l-4 border-l-gray-400 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">
                                      Sub Needed
                                      <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded-full">
                                        OPEN
                                      </span>
                                    </div>
                                    <div className="text-gray-600 flex items-center mt-1 text-sm">
                                      <span className="mr-2">→</span>
                                      <span>{sub.student}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500 italic mt-2 pt-2 border-t border-gray-200">
                                  Covering for: <span className="font-medium">{sub.original}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={closeModal}
                className="w-full bg-[#f5a623] hover:bg-[#d88e1a] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
