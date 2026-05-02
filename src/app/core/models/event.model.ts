export interface CalendarEvent {
  id: string;
  slug: string | null;
  name: string;
  date: string; // ISO
  time: string;
  location: string;
  description?: string;
  images: string[];
}

export interface CreateEventDto {
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  images?: string[];
}
