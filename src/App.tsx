import { useEffect, useState } from 'react';
import Calendar from './components/Calendar';
import { ScheduleResponse, ScheduleDay, CalendarEvent } from './types/schedule';

const N8N_WEBHOOK_URL = 'https://tasks.sklabs.app/webhook/ec50065d-398b-4bfc-adaa-5378d8b444ea';

function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch(N8N_WEBHOOK_URL);

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data: ScheduleResponse = await response.json();
      const calendarEvents = transformToCalendarEvents(data);
      setEvents(calendarEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // parseTime function removed as events are now consolidated by day
  // Individual time-based events are shown in the modal details instead

  const transformToCalendarEvents = (data: ScheduleResponse): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    data.schedule.forEach((day: ScheduleDay) => {
      if (!day.isSession) {
        events.push({
          id: `holiday-${day.scheduleId}`,
          title: `No Session - ${day.reason}`,
          start: `${day.date}T00:00:00`,
          end: `${day.date}T23:59:59`,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          textColor: '#ffffff',
          extendedProps: {
            type: 'holiday',
            reason: day.reason || 'No session',
          },
        });
      } else if (day.matches.length > 0) {
        const volunteerCount = day.matches.length;
        const uniqueVolunteers = new Set(day.matches.map(m => m.volunteer.name)).size;

        events.push({
          id: `day-${day.scheduleId}`,
          title: `${uniqueVolunteers} Volunteers (${volunteerCount} sessions)`,
          start: `${day.date}T00:00:00`,
          end: `${day.date}T23:59:59`,
          backgroundColor: '#1e5a8e',
          borderColor: '#164a73',
          textColor: '#ffffff',
          allDay: true,
          extendedProps: {
            type: 'session',
            matches: day.matches,
            dayOfWeek: day.dayOfWeek,
          },
        });
      }
    });

    // Group substitutes by date and claim status
    const claimedSubsByDate = new Map<string, typeof data.subs>();
    const openSubsByDate = new Map<string, typeof data.subs>();

    data.subs?.forEach((sub) => {
      const date = sub.property_date.start;

      if (sub.property_claim_status === 'Claimed' && sub.property_claimed_by) {
        if (!claimedSubsByDate.has(date)) {
          claimedSubsByDate.set(date, []);
        }
        claimedSubsByDate.get(date)!.push(sub);
      } else if (sub.property_claim_status === 'Open') {
        if (!openSubsByDate.has(date)) {
          openSubsByDate.set(date, []);
        }
        openSubsByDate.get(date)!.push(sub);
      }
    });

    // Add claimed substitutes (orange)
    claimedSubsByDate.forEach((subs, date) => {
      const subCount = subs.length;
      const uniqueSubs = new Set(subs.map(s => s.property_claimed_by)).size;

      events.push({
        id: `subs-claimed-${date}`,
        title: `${uniqueSubs} Substitute${uniqueSubs > 1 ? 's' : ''} (${subCount} session${subCount > 1 ? 's' : ''})`,
        start: `${date}T00:00:00`,
        end: `${date}T23:59:59`,
        backgroundColor: '#f5a623',
        borderColor: '#d88e1a',
        textColor: '#ffffff',
        allDay: true,
        extendedProps: {
          type: 'substitute-claimed',
          substitutes: subs.map(sub => ({
            id: sub.id,
            time: sub.property_time,
            substitute: sub.property_claimed_by,
            original: sub.property_volunteer,
            student: sub.property_student,
          })),
        },
      });
    });

    // Add open substitutes (gray)
    openSubsByDate.forEach((subs, date) => {
      const subCount = subs.length;

      events.push({
        id: `subs-open-${date}`,
        title: `${subCount} Open Sub${subCount > 1 ? 's' : ''} Needed`,
        start: `${date}T00:00:00`,
        end: `${date}T23:59:59`,
        backgroundColor: '#9ca3af',
        borderColor: '#6b7280',
        textColor: '#ffffff',
        allDay: true,
        extendedProps: {
          type: 'substitute-open',
          substitutes: subs.map(sub => ({
            id: sub.id,
            time: sub.property_time,
            original: sub.property_volunteer,
            student: sub.property_student,
          })),
        },
      });
    });

    return events;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Volunteer Schedule
            </h2>
            <p className="text-gray-600">
              View and manage reading program volunteer sessions
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#1e5a8e] rounded"></div>
              <span className="text-xs text-gray-600">Sessions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#f5a623] rounded"></div>
              <span className="text-xs text-gray-600">Claimed Subs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#9ca3af] rounded"></div>
              <span className="text-xs text-gray-600">Open Subs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">Holidays</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 text-lg">Loading schedule...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">Error: {error}</p>
            <button
              onClick={fetchSchedule}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <Calendar events={events} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
