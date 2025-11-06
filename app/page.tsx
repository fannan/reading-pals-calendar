'use client';

import { useEffect, useState } from 'react';
import Calendar from '@/components/Calendar';
import { ScheduleResponse, ScheduleDay, CalendarEvent } from '@/types/schedule';

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule');

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

  const parseTime = (timeStr: string, date: string): { start: string; end: string } => {
    try {
      // Parse various time formats: "7:45 AM - 8:40 AM", "7:45–8:40 AM", "10:15–11:15 AM"
      // Replace en-dash and other unicode dashes with regular hyphen
      const normalizedTime = timeStr.replace(/–/g, '-').replace(/\u2013/g, '-').replace(/\u2014/g, '-');

      let startTime: string, endTime: string;

      // Check if there's a separator
      if (normalizedTime.includes(' - ')) {
        [startTime, endTime] = normalizedTime.split(' - ');
      } else if (normalizedTime.includes('-')) {
        // Handle formats like "10:15-11:15 AM" (no spaces around dash)
        const parts = normalizedTime.split('-');
        startTime = parts[0].trim();
        endTime = parts[1].trim();

        // If the end time doesn't have AM/PM, check if start has it and use the last one
        if (!endTime.includes('AM') && !endTime.includes('PM')) {
          const periodMatch = normalizedTime.match(/\s(AM|PM)$/);
          if (periodMatch) {
            endTime = endTime + ' ' + periodMatch[1];
            startTime = startTime.replace(/\s(AM|PM)$/, '') + ' ' + periodMatch[1];
          }
        }
      } else {
        throw new Error(`Cannot parse time format: ${timeStr}`);
      }

      const parseTimeComponent = (time: string): string => {
        if (!time) throw new Error('Time component is undefined');

        const trimmed = time.trim();
        const parts = trimmed.split(' ');
        const timePart = parts[0];
        const period = parts[1] || 'AM'; // Default to AM if not specified

        const [hours, minutes] = timePart.split(':');
        let hour = parseInt(hours);

        if (period.toUpperCase() === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period.toUpperCase() === 'AM' && hour === 12) {
          hour = 0;
        }

        return `${date}T${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      };

      return {
        start: parseTimeComponent(startTime),
        end: parseTimeComponent(endTime),
      };
    } catch (error) {
      console.error('Error parsing time:', { timeStr, date, error });
      // Return a default time range if parsing fails
      return {
        start: `${date}T09:00:00`,
        end: `${date}T10:00:00`,
      };
    }
  };

  const transformToCalendarEvents = (data: ScheduleResponse): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    data.schedule.forEach((day: ScheduleDay) => {
      if (!day.isSession) {
        // Create a holiday/no-session event
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
        // Create ONE consolidated event per day showing all sessions
        const volunteerCount = day.matches.length;
        const uniqueVolunteers = new Set(day.matches.map(m => m.volunteer.name)).size;

        // Get time range for the day
        const times = day.matches.map(m => m.time);
        const firstMatch = day.matches[0];
        const { start } = parseTime(firstMatch.time, day.date);

        events.push({
          id: `day-${day.scheduleId}`,
          title: `${uniqueVolunteers} Volunteers (${volunteerCount} sessions)`,
          start: `${day.date}T00:00:00`,
          end: `${day.date}T23:59:59`,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
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

    // Add consolidated substitute events from subs array
    console.log('Processing substitutes:', {
      totalSubs: data.subs?.length || 0,
      claimed: data.subs?.filter(s => s.property_claim_status === 'Claimed').length || 0
    });

    // Group substitutes by date
    const subsByDate = new Map<string, typeof data.subs>();
    data.subs?.forEach((sub, index) => {
      if (sub.property_claim_status === 'Claimed' && sub.property_claimed_by) {
        const date = sub.property_date.start;
        if (!subsByDate.has(date)) {
          subsByDate.set(date, []);
        }
        subsByDate.get(date)!.push(sub);

        console.log(`Processing substitute #${index + 1}:`, {
          date: sub.property_date.start,
          time: sub.property_time,
          substitute: sub.property_claimed_by,
          original: sub.property_volunteer,
          student: sub.property_student,
        });
      } else {
        console.log(`Skipping substitute #${index + 1}:`, {
          status: sub.property_claim_status,
          claimedBy: sub.property_claimed_by,
          reason: !sub.property_claimed_by ? 'No claimed_by' : 'Status not Claimed'
        });
      }
    });

    // Create one consolidated event per date for substitutes
    subsByDate.forEach((subs, date) => {
      const subCount = subs.length;
      const uniqueSubs = new Set(subs.map(s => s.property_claimed_by)).size;

      events.push({
        id: `subs-${date}`,
        title: `${uniqueSubs} Substitute${uniqueSubs > 1 ? 's' : ''} (${subCount} session${subCount > 1 ? 's' : ''})`,
        start: `${date}T00:00:00`,
        end: `${date}T23:59:59`,
        backgroundColor: '#f59e0b', // Orange for substitutes
        borderColor: '#d97706',
        textColor: '#ffffff',
        allDay: true,
        extendedProps: {
          type: 'substitute',
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

    return events;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Reading Pals Schedule
          </h1>
          <p className="text-gray-600">
            Volunteer schedule for the reading program
          </p>
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Regular Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Substitutes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">No Session / Holidays</span>
            </div>
          </div>
        </header>

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
