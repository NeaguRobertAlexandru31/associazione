export interface CalendarEvent {
  id: string;
  slug: string | null;
  name: string;
  date: string; // ISO
  time: string;
  location: string;
  description?: string;
  images: string[];
  cover?: string;
}

export interface EventRsvp {
  id: string;
  name: string;
  email?: string;
  status: 'attending' | 'interested';
  createdAt: string;
}

export interface RsvpStats {
  attending: number;
  interested: number;
  total: number;
}

export interface CreateEventDto {
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  images?: string[];
  cover?: string;
}
