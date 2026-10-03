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
  uploadToken?: string | null;
  uploadUrl?: string | null;
  hasCapacity?: boolean;
  capacity?: number | null;
}

export interface BookingAvailability {
  hasCapacity: boolean;
  capacity?: number;
  available?: number;
  waitlistCount?: number;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string;
  seats: number;
  status: 'confirmed' | 'waitlist' | 'cancelled';
  position?: number;
  cancelToken: string;
  createdAt: string;
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
  hasCapacity?: boolean;
  capacity?: number;
}

export interface EventPhoto {
  id: string;
  url: string;
  approved: boolean;
  isMember: boolean;
  uploaderName?: string;
  createdAt: string;
}
