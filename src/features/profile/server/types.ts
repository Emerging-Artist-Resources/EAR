// Basic types you can expand later

export type EventType =
  | "performance"
  | "audition"
  | "creative"
  | "class"
  | "funding";

export interface SavedEvent {
  id: string;
  type: EventType;
  name: string;
  /** Display: start (and end when present), EST — from `formatOccurrenceRangeEST`. */
  date: string;
  /** ISO start of the primary occurrence or deadline; for reliable past/upcoming checks. */
  primaryStartsAtIso?: string;
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

export interface ServiceInquirySummary {
  id: string;
  created_at: string;
  status: string;
  service_slug: string;
  service_title: string | null;
}

export interface MyListing {
  id: string;
  type: string;
  title: string;
  status: "pending" | "approved" | "rejected" | "pending_payment";
  submitted_at: string;
  payment_required?: boolean;
  payment_status?: "not_required" | "requires_payment" | "paid" | "refunded" | "canceled";
  payment_amount?: number | null;
  resubmitted_at?: string | null;
  reviewed_at?: string | null;
  admin_notes?: string | null;
}
