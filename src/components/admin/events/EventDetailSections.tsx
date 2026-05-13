import { AdminEventDetail } from "./types"
import { getBaseListingFeeUsd } from "@/lib/fees/listing-fee-policy"

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
      <span className="text-[var(--gray-600)] font-medium">{label}</span>
      <div className="text-[var(--gray-800)]">{value}</div>
    </div>
  )
}

function WebsiteRow({ href }: { href?: string | null }) {
  if (!href?.trim()) return null
  const url = href.trim()
  return (
    <Row
      label="Website"
      value={
        <a className="underline text-[var(--primary-600)]" href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      }
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h5 className="text-base font-bold text-[var(--gray-900)]">{title}</h5>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function OrganizerPerformanceDetails({ 
  details, 
  fullDetail: _fullDetail 
}: { 
  details: NonNullable<AdminEventDetail['performance_details']>
  fullDetail: AdminEventDetail
}) {
  const eventTypeLabels: Record<string, string> = {
    SOLO: "Solo show",
    SPLIT_BILL: "Split bill",
    FESTIVAL: "Festival",
  }

  const artistTypeLabels: Record<string, string> = {
    ESTABLISHED: "Established",
    EMERGING: "Emerging",
  }

  const getListingFeeDisplay = () => {
    if (!details.listing_fee_option) return null

    const artistType = details.artist_type
    const feeOption = details.listing_fee_option

    if (feeOption === "PAY_FEE") {
      const feeAmount = `$${getBaseListingFeeUsd(artistType === "ESTABLISHED" ? "ESTABLISHED" : "EMERGING")}`
      return `Pay listing fee (${feeAmount})`
    } else if (feeOption === "PROVIDE") {
      return "Provide complementary ticket"
    } else if (feeOption === "EXPLAIN") {
      return "Explain alternative arrangement"
    }
    return null
  }

  const hasEventBasics = details.title || details.organizer || details.link || details.price || details.description
  const hasArtistCredits = details.participants && details.event_type === "SOLO"
  const hasListingFee = details.artist_type || details.listing_fee_option

  return (
    <div className="space-y-6">
      {hasEventBasics && (
        <Section title="Event Basics">
          <Row label="Event Type" value={details.event_type ? eventTypeLabels[details.event_type] || details.event_type : undefined} />
          <Row label="Show Name" value={details.title} />
          <Row label="Organizer / Presenting Company" value={details.organizer} />
          <Row label="Website" value={
            details.website ? <a className="underline text-[var(--primary-600)]" href={details.website} target="_blank" rel="noopener noreferrer">{details.website}</a> : undefined
          }/>
          <Row label="Ticket Link" value={
            details.link ? <a className="underline text-[var(--primary-600)]" href={details.link} target="_blank" rel="noopener noreferrer">{details.link}</a> : undefined
          }/>
          <Row label="Ticket Cost" value={details.price} />
          <Row label="Short Show Description" value={details.description} />
        </Section>
      )}

      {hasArtistCredits && (
        <Section title="Artist Credits">
          <Row label="Participants" value={details.participants} />
        </Section>
      )}

      {hasListingFee && (
        <Section title="Listing Fee">
          <Row label="Artist Type" value={details.artist_type ? artistTypeLabels[details.artist_type] || details.artist_type : undefined} />
          {details.listing_fee_option && (
            <>
              <Row label="Selected Option" value={getListingFeeDisplay()} />
              {details.listing_fee_option === "PROVIDE" && (
                <>
                  <Row label="Complementary Ticket Information" value={details.complementary_ticket_info} />
                  <Row label="Has complementary ticket been provided?" value={details.agree_comp_tickets ? "Yes" : "No"} />
                </>
              )}
              {details.listing_fee_option === "EXPLAIN" && (
                <Row label="Alternative Arrangement Explanation" value={details.listing_fee_explanation} />
              )}
            </>
          )}
        </Section>
      )}
    </div>
  )
}

export function PerformanceDetails({ 
  details,
  fullDetail 
}: { 
  details: NonNullable<AdminEventDetail['performance_details']>
  fullDetail?: AdminEventDetail
}) {
  if (details.subtype === "ORGANIZER" && fullDetail) {
    return <OrganizerPerformanceDetails details={details} fullDetail={fullDetail} />
  }

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
      <WebsiteRow href={details.website} />
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
      <Row label="Opportunity Name" value={details.title} />
      <Row label="Opportunity Description" value={details.description} />
      <Row label="Hosting Organization/Individual(s)" value={details.host} />
      <WebsiteRow href={details.website} />
      <Row label="Opportunity Dates" value={details.dates} />
      <Row label="What is Offered" value={details.compensation} />
      <Row label="Application Requirements" value={details.requirements} />
      <Row label="Submission Instructions" value={details.link} />
      <Row label="Fee Option" value={details.fee} />
      <Row label="Fee Amount" value={details.fee_amount} />
      <Row label="Artist Type" value={details.artist_type} />
    </div>
  )
}

export function ClassDetails({ details }: { details: NonNullable<AdminEventDetail['class_workshop_details']> }) {
  const artistTypeLabels: Record<string, string> = {
    ESTABLISHED: "Established",
    EMERGING: "Emerging",
  }

  const getListingFeeDisplay = () => {
    if (!details.listing_fee_option) return null

    const feeOption = details.listing_fee_option

    if (feeOption === "PAY_FEE") {
      const artistType = details.artist_type
      const feeAmount = `$${getBaseListingFeeUsd(artistType === "ESTABLISHED" ? "ESTABLISHED" : "EMERGING")}`
      return `Pay listing fee (${feeAmount})`
    } else if (feeOption === "PROVIDE") {
      return "Provide guest spot"
    } else if (feeOption === "EXPLAIN") {
      return "Explain alternative arrangement"
    }
    return null
  }

  const hasListingFee = details.artist_type || details.listing_fee_option

  return (
    <div className="space-y-6">
      <Section title="Class/Workshop Details">
        <Row label="Type" value={details.class_workshop_type} />
        <Row label="Title" value={details.title} />
        <Row label="Description" value={details.description} />
        <Row label="Duration" value={details.duration} />
        <Row label="Organizer" value={details.organizer} />
        <Row label="Teachers" value={details.teachers} />
        <Row label="Price" value={details.price} />
        <Row label="Registration link" value={
          details.link ? <a className="underline text-[var(--primary-600)]" href={details.link} target="_blank" rel="noopener noreferrer">{details.link}</a> : undefined
        }/>
        <WebsiteRow href={details.website} />
        <Row label="Style Category" value={details.style_category} />
        <Row label="Workshop Details" value={details.workshop_details} />
        <Row label="Classes Offered" value={details.classes_offered} />
        <Row label="Drop-In Classes" value={details.drop_in_classes} />
      </Section>

      {hasListingFee && (
        <Section title="Listing Fee">
          <Row label="Artist Type" value={details.artist_type ? artistTypeLabels[details.artist_type] || details.artist_type : undefined} />
          {details.listing_fee_option && (
            <>
              <Row label="Selected Option" value={getListingFeeDisplay()} />
              {details.listing_fee_option === "PROVIDE" && (
                <>
                  <Row label="Guest Spot Information" value={details.guest_spot_info} />
                  <Row label="Has guest spot been provided?" value={details.guest_spot_info ? "Yes" : "No"} />
                </>
              )}
              {details.listing_fee_option === "EXPLAIN" && (
                <Row label="Alternative Arrangement Explanation" value={details.listing_fee_explanation} />
              )}
            </>
          )}
        </Section>
      )}
    </div>
  )
}

export function PieceDetails({ 
  details
}: { 
  details: NonNullable<AdminEventDetail['piece_details']>
}) {
  // Get festival/parent event name (prefer parent_listing_title if available, then parent_event_name)
  const festivalName = details.parent_listing_title || details.parent_event_name || null
  
  return (
    <div className="mt-2 pt-2 border-t border-[var(--gray-200)]">
      <h5 className="text-sm font-semibold text-[var(--gray-700)] mb-2">Piece Details</h5>
      <div className="grid gap-2">
        <Row label="Festival" value={festivalName} />
        {details.parent_listing_id && (
          <Row label="Parent Listing ID" value={details.parent_listing_id} />
        )}
        <Row label="Parent Event Website" value={
          details.parent_event_website ? <a className="underline text-[var(--primary-600)]" href={details.parent_event_website} target="_blank">{details.parent_event_website}</a> : undefined
        }/>
        <Row label="Parent Event Ticket Link" value={
          details.parent_event_ticket_link ? <a className="underline text-[var(--primary-600)]" href={details.parent_event_ticket_link} target="_blank">{details.parent_event_ticket_link}</a> : undefined
        }/>
        <Row label="Parent Event Contact" value={details.parent_event_contact_email} />
        <Row label="Piece Title" value={details.piece_title} />
        <Row label="Company/Artist Name" value={details.piece_company} />
        <Row label="Company/Artist Website" value={
          details.piece_company_website ? <a className="underline text-[var(--primary-600)]" href={details.piece_company_website} target="_blank">{details.piece_company_website}</a> : undefined
        }/>
        <Row label="Piece Description" value={details.piece_description} />
        <Row label="Choreographer/Creator" value={details.choreographer} />
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
