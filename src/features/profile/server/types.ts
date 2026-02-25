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

export interface SavedListing {
  id: string;
  user_id: string;
  listing_id: string;
  attendance_status: "attended" | "missed" | null;
  saved_at: string;
  updated_at: string;
}

export interface ActivityOverview {
  savedCount: number;
  listingsCount: number;
  attendedCount: number;
}

export interface MyListing {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}
