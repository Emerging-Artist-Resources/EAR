import { AdminEventDetail } from "./types"

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex items-start gap-3">
      <span className="inline-block min-w-28 text-[var(--gray-500)]">{label}</span>
      <div className="text-[var(--gray-800)]">{value}</div>
    </div>
  )
}

export function PerformanceDetails({ details }: { details: NonNullable<AdminEventDetail['performance_details']> }) {
  return (
    <div className="grid gap-2">
      <Row label="Subtype" value={details.subtype} />
      <Row label="Title" value={details.title} />
      <Row label="Description" value={details.description} />
      <Row label="Organizer" value={details.organizer} />
      <Row label="Website" value={
        details.website ? <a className="underline text-[var(--primary-600)]" href={details.website} target="_blank">{details.website}</a> : undefined
      }/>
      <Row label="Link" value={
        details.link ? <a className="underline text-[var(--primary-600)]" href={details.link} target="_blank">{details.link}</a> : undefined
      }/>
      <Row label="Price" value={details.price} />
      <Row label="Participants" value={details.participants} />
      <Row label="Event Type" value={details.event_type} />
      <Row label="Comp Tickets" value={details.agree_comp_tickets ? "Yes" : "No"} />
      <Row label="Dates Confirmed" value={details.event_dates_confirmed ? "Yes" : "No"} />
      <Row label="Artist Type" value={details.artist_type} />
      <Row label="Listing Fee Option" value={details.listing_fee_option} />
      <Row label="Listing Fee Explanation" value={details.listing_fee_explanation} />
      <Row label="Complementary Ticket Info" value={details.complementary_ticket_info} />
      <Row label="Guest Spot Info" value={details.guest_spot_info} />
    </div>
  )
}

export function AuditionDetails({ details }: { details: NonNullable<AdminEventDetail['audition_details']> }) {
  return (
    <div className="grid gap-2">
      <Row label="Title" value={details.title} />
      <Row label="Description" value={details.description} />
      <Row label="Eligibility" value={details.eligibility} />
      <Row label="Compensation" value={details.compensation} />
      <Row label="Instructions" value={details.instructions} />
      <Row label="Pre-Audition Classes" value={details.pre_audition_classes} />
      <Row label="Fee Option" value={details.fee} />
      <Row label="Fee Amount" value={details.fee_amount} />
      <Row label="Artist Type" value={details.artist_type} />
    </div>
  )
}

export function CreativeDetails({ details }: { details: NonNullable<AdminEventDetail['creative_details']> }) {
  return (
    <div className="grid gap-2">
      <Row label="Title" value={details.title} />
      <Row label="Description" value={details.description} />
      <Row label="Host" value={details.host} />
      <Row label="Dates" value={details.dates} />
      <Row label="Compensation" value={details.compensation} />
      <Row label="Requirements" value={details.requirements} />
      <Row label="Link" value={
        details.link ? <a className="underline text-[var(--primary-600)]" href={details.link} target="_blank">{details.link}</a> : undefined
      }/>
      <Row label="Fee Option" value={details.fee} />
      <Row label="Fee Amount" value={details.fee_amount} />
      <Row label="Artist Type" value={details.artist_type} />
    </div>
  )
}

export function ClassDetails({ details }: { details: NonNullable<AdminEventDetail['class_workshop_details']> }) {
  return (
    <div className="grid gap-2">
      <Row label="Type" value={details.class_workshop_type} />
      <Row label="Title" value={details.title} />
      <Row label="Description" value={details.description} />
      <Row label="Organizer" value={details.organizer} />
      <Row label="Teachers" value={details.teachers} />
      <Row label="Price" value={details.price} />
      <Row label="Link" value={
        details.link ? <a className="underline text-[var(--primary-600)]" href={details.link} target="_blank">{details.link}</a> : undefined
      }/>
      <Row label="Style Category" value={details.style_category} />
      <Row label="Workshop Details" value={details.workshop_details} />
      <Row label="Classes Offered" value={details.classes_offered} />
      <Row label="Drop-In Classes" value={details.drop_in_classes} />
      <Row label="Artist Type" value={details.artist_type} />
      <Row label="Listing Fee Option" value={details.listing_fee_option} />
      <Row label="Listing Fee Explanation" value={details.listing_fee_explanation} />
      <Row label="Guest Spot Info" value={details.guest_spot_info} />
    </div>
  )
}

export function PieceDetails({ details }: { details: NonNullable<AdminEventDetail['piece_details']> }) {
  return (
    <div className="mt-2 pt-2 border-t border-[var(--gray-200)]">
      <h5 className="text-sm font-semibold text-[var(--gray-700)] mb-2">Piece Details</h5>
      <div className="grid gap-2">
        <Row label="Parent Event" value={details.parent_event_name} />
        <Row label="Parent Event Website" value={
          details.parent_event_website ? <a className="underline text-[var(--primary-600)]" href={details.parent_event_website} target="_blank">{details.parent_event_website}</a> : undefined
        }/>
        <Row label="Parent Event Ticket Link" value={
          details.parent_event_ticket_link ? <a className="underline text-[var(--primary-600)]" href={details.parent_event_ticket_link} target="_blank">{details.parent_event_ticket_link}</a> : undefined
        }/>
        <Row label="Parent Event Contact" value={details.parent_event_contact_email} />
        <Row label="Schedule Mode" value={details.piece_schedule_mode} />
      </div>
    </div>
  )
}

export function SocialHandles({ socialHandles }: { socialHandles: unknown }) {
  if (!socialHandles) return null

  // Handle both string (TEXT) and object (legacy JSONB) formats
  let handles: Record<string, string> | null = null
  if (typeof socialHandles === 'string') {
    try {
      handles = JSON.parse(socialHandles)
    } catch {
      // If not valid JSON, treat as plain text
      return <span className="text-sm">{socialHandles}</span>
    }
  } else if (typeof socialHandles === 'object' && socialHandles !== null) {
    handles = socialHandles as Record<string, string>
  }
  
  if (!handles) return null

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(handles).map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--gray-100)] text-xs">
          <span className="uppercase">{k}</span>
          <span className="text-[var(--gray-600)]">{String(v)}</span>
        </span>
      ))}
    </div>
  )
}
