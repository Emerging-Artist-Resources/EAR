export interface PieceNeedingLink {
  id: string
  status: string
  submitted_at: string
  piece_title: string | null
  piece_company: string | null
  piece_company_website: string | null
  choreographer: string | null
  contact_name: string | null
  contact_email: string | null
  address: string | null
  venue_name: string | null
  location_instructions: string | null
  occurrences: Array<{
    id: string
    starts_at_utc: string
    ends_at_utc: string | null
    tz: string
    venue_name: string | null
    address: string | null
  }>
  parent_event_name: string | null
  parent_event_website: string | null
  parent_event_contact_email: string | null
}

export interface ParentEventOption {
  id: string
  title: string
}

export interface PieceLinkRequest {
  parentListingId: string
}

export interface CreateParentRequest {
  name: string
  website?: string | null
  email?: string | null
  pieceIds: string[]
}

export interface CreateParentResponse {
  listingId: string
}
