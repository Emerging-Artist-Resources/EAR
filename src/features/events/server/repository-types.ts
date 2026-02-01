import type { SupabaseClient } from "@supabase/supabase-js"

export type ListingType = "performance" | "audition" | "creative" | "class" | "funding"

export type ListingStatus = "pending" | "approved" | "rejected" | "draft"

export type OccurrenceType = "event" | "deadline"

export type BaseListingInput = {
  contact_name: string
  pronouns?: string | null
  contact_email: string
  company?: string | null
  company_website?: string | null
  address?: string | null
  place_id?: string | null
  lat?: number | null
  lng?: number | null
  venue_name?: string | null
  location_instructions?: string | null
  social_handles?: string | null
  notes?: string | null
  //borough?: string | null
  meta?: Record<string, unknown>
}

export type OccurrenceInput = {
  starts_at_utc: string
  ends_at_utc?: string | null
  tz: string
  occurrence_type?: OccurrenceType
  address?: string | null
  place_id?: string | null
  lat?: number | null
  lng?: number | null
  venue_name?: string | null
  location_instructions?: string | null
}

export type PhotoInput = {
  path: string
  credit?: string | null
  sort_order?: number
}

export type PieceDetailsInput = {
  parent_listing_id?: string | null
  parent_event_name?: string | null
  parent_event_website?: string | null
  parent_event_ticket_link?: string | null
  parent_event_contact_email?: string | null
  piece_schedule_mode?: string | null
  selected_slots?: string[] | null
}

export type CreateListingInput = {
  type: ListingType
  base: BaseListingInput
  details: Record<string, unknown>
  occurrences: OccurrenceInput[]
  photos?: PhotoInput[]
  piece_details?: PieceDetailsInput | null
  parent_listing_id?: string | null
  relationship_type?: "performance_piece" | "workshop_class"
}

export const detailTable: Record<Exclude<ListingType, "funding">, string> = {
  performance: "performance_details",
  audition: "audition_details",
  creative: "creative_details",
  class: "class_workshop_details",
}
