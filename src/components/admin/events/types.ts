export type AdminStatus = "PENDING" | "APPROVED" | "REJECTED"

export type EventType = "performance" | "audition" | "creative" | "class"

export interface AdminEventItem {
  id: string
  type: EventType
  status: "pending" | "approved" | "rejected"
  submitted_at: string
  title: string | null
}

export type AdminEventDetail = {
  id: string
  type: EventType
  status: "pending" | "approved" | "rejected"
  submitted_at: string
  contact_name?: string
  pronouns?: string | null
  contact_email?: string
  company?: string | null
  company_website?: string | null
  address?: string | null
  place_id?: string | null
  lat?: number | null
  lng?: number | null
  venue_name?: string | null
  location_instructions?: string | null
  social_handles?: string | Record<string, string> | null
  notes?: string | null
  meta?: Record<string, unknown> | null
  listing_occurrences?: Array<{ 
    id: string
    starts_at_utc: string
    ends_at_utc?: string | null
    tz: string
    occurrence_type?: string
    address?: string | null
    venue_name?: string | null
  }>
  listing_photos?: Array<{ id: string; path: string; credit?: string | null; sort_order?: number; url?: string | null }>
  performance_details?: {
    id?: string
    subtype?: "ORGANIZER" | "PIECE"
    title?: string | null
    description?: string | null
    organizer?: string | null
    website?: string | null
    link?: string | null
    price?: string | null
    participants?: string | null
    event_type?: "SOLO" | "SPLIT_BILL" | "FESTIVAL" | null
    agree_comp_tickets?: boolean
    event_dates_confirmed?: boolean
    artist_type?: "ESTABLISHED" | "EMERGING" | null
    listing_fee_option?: "PAY_FEE" | "PROVIDE" | "EXPLAIN" | null
    listing_fee_explanation?: string | null
    complementary_ticket_info?: string | null
    guest_spot_info?: string | null
  } | null
  piece_details?: {
    id?: string
    parent_listing_id?: string | null
    parent_event_name?: string | null
    parent_event_website?: string | null
    parent_event_ticket_link?: string | null
    parent_event_contact_email?: string | null
    piece_schedule_mode?: string | null
    selected_slots?: unknown
  } | null
  audition_details?: {
    id?: string
    title?: string
    description?: string
    eligibility?: string
    compensation?: string
    instructions?: string
    pre_audition_classes?: string | null
    fee?: "PAY_FEE" | "PROVIDE" | "EXPLAIN" | null
    fee_amount?: string | null
    artist_type?: "ESTABLISHED" | "EMERGING"
  } | null
  creative_details?: {
    id?: string
    title?: string
    description?: string
    host?: string
    dates?: string
    compensation?: string
    requirements?: string
    link?: string
    fee?: "PAY_FEE" | "PROVIDE" | "EXPLAIN" | null
    fee_amount?: string | null
    artist_type?: "ESTABLISHED" | "EMERGING" | null
  } | null
  class_workshop_details?: {
    id?: string
    class_workshop_type?: "CLASS" | "WORKSHOP"
    title?: string
    description?: string
    organizer?: string
    teachers?: string
    price?: string | null
    link?: string | null
    style_category?: string | null
    workshop_details?: string | null
    classes_offered?: string | null
    drop_in_classes?: string | null
    artist_type?: "ESTABLISHED" | "EMERGING" | null
    listing_fee_option?: "PAY_FEE" | "PROVIDE" | "EXPLAIN" | null
    listing_fee_explanation?: string | null
    guest_spot_info?: string | null
  } | null
}

export const TYPE_BADGE: Record<EventType, string> = {
  performance: "bg-[var(--primary-100)] text-[var(--primary-700)]",
  audition: "bg-[var(--warning-50)] text-[var(--warning-600)]",
  creative: "bg-[var(--secondary-50)] text-[var(--primary-700)]",
  class: "bg-[var(--success-50)] text-[var(--success-600)]",
}

export const STATUS_BADGE: Record<AdminEventItem["status"], string> = {
  pending: "bg-[var(--warning-50)] text-[var(--warning-600)]",
  approved: "bg-[var(--success-50)] text-[var(--success-600)]",
  rejected: "bg-[var(--error-50)] text-[var(--error-600)]",
}
