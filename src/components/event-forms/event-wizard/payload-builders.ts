import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"

type EventPayload = {
  type: string
  base: {
    contact_name: string
    pronouns: string | null
    contact_email: string
    company: string | null
    company_website: string | null
    address: string | null
    place_id: string | null
    lat: number | null
    lng: number | null
    venue_name: string | null
    location_instructions: string | null
    social_handles: string | null
    notes: string | null
    //borough: string | null
  }
  details: Record<string, unknown>
  occurrences: Array<{ 
    starts_at_utc: string
    ends_at_utc?: string | null
    tz: string
    occurrence_type?: 'event' | 'deadline'
    address?: string | null
    place_id?: string | null
    lat?: number | null
    lng?: number | null
    venue_name?: string | null
    location_instructions?: string | null
  }>
  piece_details?: Record<string, unknown> | null
  parent_listing_id?: string | null
  relationship_type?: "performance_piece" | "workshop_class" | null
  photos?: Array<{ path: string; credit?: string | null; sort_order?: number }>
}

export interface UserInfo {
  name: string
  email: string
  pronouns?: string | null
}

export function buildBasePayload(
  data: EventFormData,
  userInfo: UserInfo
): EventPayload["base"] {
  return {
    contact_name: userInfo.name || "",
    pronouns: userInfo.pronouns || null,
    contact_email: userInfo.email || "",
    company: data.company || null,
    company_website: data.companyWebsite || null,
    address: data.address || null,
    place_id: data.placeId || null,
    lat: data.lat || null,
    lng: data.lng || null,
    venue_name: data.venueName || null,
    location_instructions: data.locationInstructions || null,
    social_handles: data.socialHandles || null,
    notes: data.notes || null,
    //borough: null,
  }
}

export function buildPerformancePayload(
  data: EventFormData,
  userInfo: UserInfo,
  tz: string
): EventPayload {
  const occurrences: EventPayload["occurrences"] = []

  // Primary date/time (legacy support)
  const primaryDate = data.date
  const primaryTime = data.showTime
  if (primaryDate && primaryTime) {
    occurrences.push({
      starts_at_utc: new Date(`${primaryDate}T${primaryTime}:00Z`).toISOString(),
      tz,
      occurrence_type: 'event',
    })
  }

  // Use occurrences (preferred) or fall back to extraOccurrences (legacy)
  const occurrencesData = data.occurrences && data.occurrences.length > 0 
    ? data.occurrences 
    : data.extraOccurrences ?? []

  for (const d of occurrencesData) {
    if (!d?.date || !Array.isArray(d?.times)) continue
    for (const t of d.times) {
      if (!t?.time) continue
      occurrences.push({
        starts_at_utc: new Date(`${d.date}T${t.time}:00Z`).toISOString(),
        tz,
        occurrence_type: 'event',
        // Extract location fields from date item if present
        address: (d as any).address || null,
        place_id: (d as any).placeId || null,
        lat: (d as any).lat || null,
        lng: (d as any).lng || null,
        venue_name: (d as any).venueName || null,
        location_instructions: (d as any).locationInstructions || null,
      })
    }
  }

  const isPiece = data.type === "PIECE"

  // Build piece_details if this is a piece
  let pieceDetails: Record<string, unknown> | null = null
  let parentListingId: string | null = null
  let relationshipType: "performance_piece" | "workshop_class" | null = null

  if (isPiece) {
    parentListingId = data.parentEventId || null
    relationshipType = parentListingId ? "performance_piece" : null
    
    pieceDetails = {
      parent_listing_id: parentListingId,
      parent_event_name: data.parentEventName || null,
      parent_event_website: data.parentEventWebsite || null,
      parent_event_ticket_link: data.parentEventTicketLink || null,
      parent_event_contact_email: data.parentEventContactEmail || null,
      piece_schedule_mode: data.pieceScheduleMode || null,
      selected_slots: data.selectedSlots || null,
    }
  }

  return {
    type: "performance",
    base: buildBasePayload(data, userInfo),
    details: {
      subtype: isPiece ? "PIECE" : "ORGANIZER",
      title: data.title ?? null,
      description: data.description ?? null,
      organizer: data.organizer ?? null,
      website: data.website || null,
      link: data.link ?? null,
      price: data.price ?? null,
      participants: data.participants ?? null,
      event_type: data.eventType || null,
      agree_comp_tickets: Boolean(data.agreeCompTickets),
      event_dates_confirmed: Boolean(data.eventDatesConfirmed),
      artist_type: data.artistType || null,
      listing_fee_option: data.listingFeeOption || null,
      listing_fee_explanation: data.listingFeeExplanation || null,
      complementary_ticket_info: data.complementaryTicketInfo || null,
      guest_spot_info: null, // Not used for performance, but keep for consistency
    },
    occurrences,
    piece_details: pieceDetails,
    parent_listing_id: parentListingId,
    relationship_type: relationshipType,
  }
}

export function buildAuditionPayload(
  data: EventFormData,
  userInfo: UserInfo,
  tz: string
): EventPayload {
  const occurrences: EventPayload["occurrences"] = []
  
  // Build event occurrences from the occurrences array
  for (const occ of data.occurrences ?? []) {
    if (!occ?.date || !Array.isArray(occ?.times)) continue
    for (const t of occ.times) {
      if (!t?.time) continue
      occurrences.push({
        starts_at_utc: new Date(`${occ.date}T${t.time}:00Z`).toISOString(),
        tz,
        occurrence_type: 'event',
        // Extract location fields from occurrence if present
        address: (occ as any).address || null,
        place_id: (occ as any).placeId || null,
        lat: (occ as any).lat || null,
        lng: (occ as any).lng || null,
        venue_name: (occ as any).venueName || null,
        location_instructions: (occ as any).locationInstructions || null,
      })
    }
  }

  // Build deadline occurrences
  for (const deadline of data.deadlineOccurrences ?? []) {
    if (!deadline?.date || !Array.isArray(deadline?.times)) continue
    for (const t of deadline.times) {
      if (!t?.time) continue
      occurrences.push({
        starts_at_utc: new Date(`${deadline.date}T${t.time}:00Z`).toISOString(),
        tz,
        occurrence_type: 'deadline',
      })
    }
  }

  // Map fee: FEE -> PAY_FEE (if artistType is set), NO_FEE -> null
  let feeOption: string | null = null
  if (data.fee === "FEE" && data.artistType) {
    feeOption = "PAY_FEE"
  }

  return {
    type: "audition",
    base: buildBasePayload(data, userInfo),
    details: {
      title: data.title ?? "",
      description: data.description ?? "",
      eligibility: data.eligibility ?? "",
      compensation: data.compensation ?? "",
      instructions: data.instructions ?? "",
      pre_audition_classes: data.preAuditionClasses || null,
      fee: feeOption,
      fee_amount: data.feeAmount || null,
      artist_type: data.artistType || null,
    },
    occurrences,
  }
}

export function buildCreativePayload(
  data: EventFormData,
  userInfo: UserInfo,
  tz: string
): EventPayload {
  const occurrences: EventPayload["occurrences"] = []

  // Build deadline occurrences
  for (const deadline of data.deadlineOccurrences ?? []) {
    if (!deadline?.date || !Array.isArray(deadline?.times)) continue
    for (const t of deadline.times) {
      if (!t?.time) continue
      occurrences.push({
        starts_at_utc: new Date(`${deadline.date}T${t.time}:00Z`).toISOString(),
        tz,
        occurrence_type: 'deadline',
      })
    }
  }

  // Map fee: FEE -> PAY_FEE (if artistType is set), NO_FEE -> null
  let feeOption: string | null = null
  if (data.fee === "FEE" && data.artistType) {
    feeOption = "PAY_FEE"
  }

  return {
    type: "creative",
    base: buildBasePayload(data, userInfo),
    details: {
      title: data.title ?? "",
      description: data.description ?? "",
      host: data.host ?? "",
      dates: data.dates ?? "",
      compensation: data.compensation ?? "",
      requirements: data.requirements ?? "",
      link: data.link ?? "",
      fee: feeOption,
      fee_amount: data.feeAmount || null,
      artist_type: data.artistType || null,
    },
    occurrences,
  }
}

export function buildClassPayload(
  data: EventFormData,
  userInfo: UserInfo,
  tz: string
): EventPayload {
  const occurrences: EventPayload["occurrences"] = []

  // Use occurrences (preferred) or fall back to classOccurrences or legacy fields
  const occurrencesData = data.occurrences && data.occurrences.length > 0
    ? data.occurrences
    : data.classOccurrences && data.classOccurrences.length > 0
      ? data.classOccurrences
      : []

  for (const d of occurrencesData) {
    if (!d?.date || !Array.isArray(d?.times)) continue
    for (const t of d.times) {
      if (!t?.time) continue
      occurrences.push({
        starts_at_utc: new Date(`${d.date}T${t.time}:00Z`).toISOString(),
        tz,
        occurrence_type: 'event',
        // Extract location fields from date item if present
        address: (d as any).address || null,
        place_id: (d as any).placeId || null,
        lat: (d as any).lat || null,
        lng: (d as any).lng || null,
        venue_name: (d as any).venueName || null,
        location_instructions: (d as any).locationInstructions || null,
      })
    }
  }

  // Legacy support: fall back to old fields if occurrences are empty
  if (occurrences.length === 0) {
    const primaryDateRaw = (data.classDates ?? "").trim()
    const primaryTime = (data.classTimes ?? "00:00").trim()
    const tokens = primaryDateRaw
      ? primaryDateRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : []
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const primaryList = tokens
      .filter((tok) => dateRegex.test(tok))
      .map((tok) => ({
        starts_at_utc: new Date(`${tok}T${primaryTime}:00Z`).toISOString(),
        tz,
        occurrence_type: 'event' as const,
      }))
    const extraOcc = (data.classExtraOccurrences ?? [])
      .filter((o) => o?.date && o?.time)
      .map((o) => ({
        starts_at_utc: new Date(`${o.date}T${o.time}:00Z`).toISOString(),
        tz,
        occurrence_type: 'event' as const,
      }))
    occurrences.push(...primaryList, ...extraOcc)
  }

  // Set base location from first occurrence for backwards compatibility
  const basePayload = buildBasePayload(data, userInfo)
  const firstOccurrence = occurrencesData[0]
  if (firstOccurrence && !basePayload.address) {
    basePayload.address = (firstOccurrence as any).address || null
    basePayload.place_id = (firstOccurrence as any).placeId || null
    basePayload.lat = (firstOccurrence as any).lat || null
    basePayload.lng = (firstOccurrence as any).lng || null
    basePayload.venue_name = (firstOccurrence as any).venueName || null
    basePayload.location_instructions = (firstOccurrence as any).locationInstructions || null
  }

  return {
    type: "class",
    base: basePayload,
    details: {
      class_workshop_type: data.classWorkshopType || "CLASS",
      title: data.title ?? data.className ?? "",
      description: data.description ?? data.classDescription ?? "",
      organizer: data.organizer ?? "",
      teachers: data.teachers ?? "",
      price: data.price ?? data.classPrice ?? null,
      link: data.link ?? data.classLink ?? null,
      style_category: data.styleCategory || null,
      workshop_details: data.workshopDetails || null,
      classes_offered: data.classesOffered || null,
      drop_in_classes: data.dropInClasses || null,
      artist_type: data.artistType || data.classArtistType || null,
      listing_fee_option: data.listingFeeOption || data.classListingFeeOption || null,
      listing_fee_explanation: data.listingFeeExplanation || data.classListingFeeExplanation || null,
      guest_spot_info: data.guestSpotInfo || null,
    },
    occurrences,
  }
}

export function buildFundingPayload(
  data: EventFormData,
  userInfo: UserInfo,
  _tz: string
): EventPayload {
  return {
    type: "funding",
    base: buildBasePayload(data, userInfo),
    details: {
      funding_link: data.fundingLink ?? "",
      title: data.fundingTitle || "",
      summary: data.fundingSummary || "",
    },
    occurrences: [],
  }
}

export function buildEventPayload(
  data: EventFormData,
  eventType: EventType,
  userInfo: UserInfo
): EventPayload {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  const type = eventType.toLowerCase() as
    | "performance"
    | "audition"
    | "creative"
    | "class"
    | "funding"

  switch (type) {
    case "performance":
      return buildPerformancePayload(data, userInfo, tz)
    case "audition":
      return buildAuditionPayload(data, userInfo, tz)
    case "creative":
      return buildCreativePayload(data, userInfo, tz)
    case "class":
      return buildClassPayload(data, userInfo, tz)
    case "funding":
      return buildFundingPayload(data, userInfo, tz)
    default:
      throw new Error(`Unknown event type: ${eventType}`)
  }
}

