// Basic types you can expand later

export type EventType = "performance" | "class" | "audition" | "opportunity" | "other";

export interface SavedEvent {
  id: string;
  type: EventType;
  name: string;
  date: string;       // ISO string or formatted string
  location: string;
  deadline?: string;
  description?: string;
  isSaved: boolean;
  attendanceStatus?: "attended" | "missed" | null;
}

export interface ProfileSavedEventsFilter {
  mode: "all" | "upcoming" | "past";
}
