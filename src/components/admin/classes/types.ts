export interface ClassNeedingLink {
  id: string
  status: string
  submitted_at: string
  title: string | null
  organizer: string | null
  teachers: string | null
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
  parent_workshop_name: string | null
  parent_workshop_website: string | null
  parent_workshop_contact_email: string | null
}

export interface ParentWorkshopOption {
  id: string
  title: string
}

export interface ClassLinkRequest {
  parentListingId: string
}

export interface CreateParentRequest {
  name: string
  website?: string | null
  email?: string | null
  classIds: string[]
}

export interface CreateParentResponse {
  listingId: string
}
