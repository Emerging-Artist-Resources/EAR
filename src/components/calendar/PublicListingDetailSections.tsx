"use client"

// Type definition for public listing detail (subset of AdminEventDetail)
export type PublicListingDetail = {
  id: string
  type: "performance" | "audition" | "creative" | "class"
  contact_name?: string | null
  pronouns?: string | null
  contact_email?: string | null
  company?: string | null
  company_website?: string | null
  address?: string | null
  place_id?: string | null
  venue_name?: string | null
  location_instructions?: string | null
  social_handles?: string | Record<string, string> | null
  notes?: string | null
  listing_occurrences?: Array<{ 
    id: string
    starts_at_utc: string
    ends_at_utc?: string | null
    tz: string
    occurrence_type?: string
    address?: string | null
    place_id?: string | null
    venue_name?: string | null
    location_instructions?: string | null
  }>
  listing_photos?: Array<{ id: string; path: string; credit?: string | null; sort_order?: number; url?: string | null }>
  performance_details?: {
    subtype?: "ORGANIZER" | "PIECE"
    title?: string | null
    description?: string | null
    organizer?: string | null
    website?: string | null
    link?: string | null
    price?: string | null
    participants?: string | null
    event_type?: "SOLO" | "SPLIT_BILL" | "FESTIVAL" | null
  } | null
  piece_details?: {
    parent_listing_id?: string | null
    parent_event_name?: string | null
    piece_title?: string | null
    piece_company?: string | null
    piece_company_website?: string | null
    piece_description?: string | null
    choreographer?: string | null
  } | null
  audition_details?: {
    title?: string
    description?: string
    eligibility?: string
    compensation?: string
    instructions?: string
    website?: string | null
  } | null
  creative_details?: {
    title?: string
    description?: string
    host?: string
    dates?: string | null
    compensation?: string
    requirements?: string
    link?: string
    website?: string | null
  } | null
  class_workshop_details?: {
    class_workshop_type?: "CLASS" | "WORKSHOP"
    title?: string
    description?: string
    organizer?: string
    price?: string | null
    link?: string | null
    website?: string | null
    duration?: string | null
    workshop_details?: string | null
    classes_offered?: string | null
    drop_in_classes?: string | null
    parent_workshop_name?: string | null
    parent_listing_id?: string | null
  } | null
}

export function FieldRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="py-2">
      <div className="font-sans text-sm text-text-muted mb-1">{label}:</div>
      <div className="font-sans text-sm text-text-primary">{value}</div>
    </div>
  )
}

const linkClass = "text-primary-600 hover:text-primary-700 underline"

export function WebsiteLinkRow({ label, href }: { label: string; href?: string | null }) {
  const url = href?.trim()
  if (!url) return null
  return (
    <FieldRow
      label={label}
      value={
        <a className={linkClass} href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      }
    />
  )
}

// Piece (standalone, no link yet)
export function PieceDetails({ details }: { details: NonNullable<PublicListingDetail['piece_details']> }) {
  const hasContent = 
    details.parent_event_name ||
    details.piece_title ||
    details.piece_company ||
    details.piece_company_website ||
    details.piece_description ||
    details.choreographer

  if (!hasContent) return null

  return (
    <>
      {details.parent_event_name && !details.parent_listing_id && (
        <FieldRow label="Festival" value={details.parent_event_name} />
      )}
      <FieldRow label="Piece Title" value={details.piece_title} />
      <FieldRow label="Company/Artist Name" value={details.piece_company} />
      <FieldRow 
        label="Company/Artist Website" 
        value={
          details.piece_company_website ? (
            <a 
              className="text-primary-600 hover:text-primary-700 underline" 
              href={details.piece_company_website} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {details.piece_company_website}
            </a>
          ) : undefined
        } 
      />
      <FieldRow label="Piece Description" value={details.piece_description} />
      <FieldRow label="Choreographer/Creator" value={details.choreographer} />
    </>
  )
}

// Class (standalone, no link yet)
export function ClassDetails({ details }: { details: NonNullable<PublicListingDetail['class_workshop_details']> }) {
  const hasContent =
    (details.parent_workshop_name && !details.parent_listing_id) ||
    details.title ||
    details.description ||
    details.duration ||
    details.price ||
    details.link ||
    details.website ||
    details.organizer

  if (!hasContent) return null

  return (
    <>
      {details.parent_workshop_name && !details.parent_listing_id && (
        <FieldRow label="Organizer" value={details.parent_workshop_name} />
      )}
      <FieldRow label="Title" value={details.title} />
      <FieldRow label="Description" value={details.description} />
      <FieldRow label="Duration" value={details.duration} />
      <FieldRow label="Price" value={details.price} />
      <FieldRow 
        label="Registration link" 
        value={
          details.link ? (
            <a 
              className={linkClass} 
              href={details.link} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {details.link}
            </a>
          ) : undefined
        } 
      />
      <WebsiteLinkRow label="Website" href={details.website} />
    </>
  )
}

// Performance
export function PerformanceDetails({ details }: { details: NonNullable<PublicListingDetail['performance_details']> }) {
  if (details.subtype === "PIECE") return null // Pieces are handled separately

  const eventTypeLabels: Record<string, string> = {
    SOLO: "Solo show",
    SPLIT_BILL: "Split bill",
    FESTIVAL: "Festival",
  }

  const hasContent = 
    details.event_type ||
    details.title ||
    details.organizer ||
    details.website ||
    details.link ||
    details.price ||
    details.description

  if (!hasContent) return null

  return (
    <>
      <FieldRow 
        label="Type" 
        value={details.event_type ? (eventTypeLabels[details.event_type] || details.event_type) : undefined} 
      />
      <FieldRow label="Name" value={details.title} />
      <FieldRow label="Organizer / Presenting Company" value={details.organizer} />
      <FieldRow 
        label="Website" 
        value={
          details.website ? (
            <a 
              className="text-primary-600 hover:text-primary-700 underline" 
              href={details.website} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {details.website}
            </a>
          ) : undefined
        } 
      />
      <FieldRow 
        label="Ticket Link" 
        value={
          details.link ? (
            <a 
              className="text-primary-600 hover:text-primary-700 underline" 
              href={details.link} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {details.link}
            </a>
          ) : undefined
        } 
      />
      <FieldRow label="Ticket Cost" value={details.price} />
      <FieldRow label="Short Show Description" value={details.description} />
    </>
  )
}

// Workshop
export function WorkshopDetails({ details }: { details: NonNullable<PublicListingDetail['class_workshop_details']> }) {
  if (details.class_workshop_type !== "WORKSHOP") return null

  const hasContent =
    details.title ||
    details.description ||
    details.duration ||
    details.organizer ||
    details.price ||
    details.link ||
    details.website ||
    details.workshop_details ||
    details.classes_offered ||
    details.drop_in_classes

  if (!hasContent) return null

  return (
    <>
      <FieldRow label="Title" value={details.title} />
      <FieldRow label="Description" value={details.description} />
      <FieldRow label="Duration" value={details.duration} />
      <FieldRow label="Organizer" value={details.organizer} />
      <FieldRow label="Price" value={details.price} />
      <FieldRow 
        label="Registration link" 
        value={
          details.link ? (
            <a 
              className={linkClass} 
              href={details.link} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {details.link}
            </a>
          ) : undefined
        } 
      />
      <WebsiteLinkRow label="Website" href={details.website} />
      <FieldRow label="Workshop Details" value={details.workshop_details} />
      <FieldRow label="Classes Offered" value={details.classes_offered} />
      <FieldRow label="Drop-in Classes" value={details.drop_in_classes} />
    </>
  )
}

// Audition
export function AuditionDetails({ details }: { details: NonNullable<PublicListingDetail['audition_details']> }) {
  const hasContent = 
    details.title ||
    details.description ||
    details.eligibility ||
    details.compensation ||
    details.instructions ||
    details.website

  if (!hasContent) return null

  return (
    <>
      <FieldRow label="Title" value={details.title} />
      <FieldRow label="Description" value={details.description} />
      <FieldRow label="Eligibility" value={details.eligibility} />
      <FieldRow label="Compensation" value={details.compensation} />
      <FieldRow label="Instructions" value={details.instructions} />
      <WebsiteLinkRow label="Website" href={details.website} />
    </>
  )
}

// Opportunity (`creative` type)
export function CreativeDetails({ details }: { details: NonNullable<PublicListingDetail['creative_details']> }) {
  const hasContent = 
    details.title ||
    details.description ||
    details.host ||
    details.dates ||
    details.compensation ||
    details.requirements ||
    details.link ||
    details.website

  if (!hasContent) return null

  return (
    <>
      <FieldRow label="Opportunity Name" value={details.title} />
      <FieldRow label="Opportunity Description" value={details.description} />
      <FieldRow label="Hosting Organization/Individual(s)" value={details.host} />
      <WebsiteLinkRow label="Website" href={details.website} />
      <FieldRow label="Opportunity Dates" value={details.dates} />
      <FieldRow label="What is Offered" value={details.compensation} />
      <FieldRow label="Application Requirements" value={details.requirements} />
      <FieldRow label="Submission Instructions" value={details.link} />
    </>
  )
}

// Social Handles
export function SocialHandles({ socialHandles }: { socialHandles: unknown }) {
  if (!socialHandles) return null

  let handles: Record<string, string> | null = null
  if (typeof socialHandles === 'string') {
    try {
      handles = JSON.parse(socialHandles)
    } catch {
      return <span className="font-sans text-sm text-text-muted">{socialHandles}</span>
    }
  } else if (typeof socialHandles === 'object' && socialHandles !== null) {
    handles = socialHandles as Record<string, string>
  }
  
  if (!handles || Object.keys(handles).length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(handles).map(([platform, handle]) => (
        <a
          key={platform}
          href={handle.startsWith('http') ? handle : `https://${platform}.com/${handle.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-interactive hover:bg-surface-interactive-hover font-sans text-sm font-medium text-text-primary transition-colors"
        >
          <span className="uppercase text-xs">{platform}</span>
          <span className="text-text-muted">{String(handle)}</span>
        </a>
      ))}
    </div>
  )
}
