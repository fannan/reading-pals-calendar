export interface Person {
  id: string;
  name: string;
}

export interface Match {
  time: string;
  volunteer: Person;
  student: Person;
}

export interface ScheduleDay {
  scheduleId: string;
  date: string;
  dayOfWeek: string;
  isSession: boolean;
  reason: string | null;
  matches: Match[];
}

export interface SubstitutionRequest {
  id: string;
  name: string;
  url: string;
  property_time: string;
  property_claim_status: string;
  property_day: string;
  property_claimed_by: string;
  property_date: {
    start: string;
    end: string | null;
    time_zone: string | null;
  };
  property_confirmed: boolean;
  property_notes: string;
  property_volunteer: string;
  property_student: string;
  property_sub_request: string;
}

export interface ScheduleResponse {
  schedule: ScheduleDay[];
  subs: SubstitutionRequest[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  allDay?: boolean;
  extendedProps: {
    type: 'session' | 'substitute' | 'holiday';
    reason?: string;
    matches?: Match[];
    dayOfWeek?: string;
    substitutes?: Array<{
      id: string;
      time: string;
      substitute: string;
      original: string;
      student: string;
    }>;
  };
}
