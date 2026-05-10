import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"
import { convertESTToUTC } from "@/lib/datetime-utils"

const EST_TIMEZONE = 'America/New_York'

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
    meta?: Record<string, unknown>
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

function occurrenceSlotPayload(
  date: string,
  t: { time?: string; endTime?: string | null },
  rest: Omit<EventPayload["occurrences"][number], "starts_at_utc" | "ends_at_utc" | "tz">
): EventPayload["occurrences"][number] {
  const endRaw = (t.endTime ?? "").trim()
  return {
    starts_at_utc: convertESTToUTC(date, t.time!),
    ends_at_utc: endRaw ? convertESTToUTC(date, endRaw) : null,
    tz: EST_TIMEZONE,
    ...rest,
  }
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

export async function buildPerformancePayload(
  data: EventFormData,
  userInfo: UserInfo,
  _tz: string // Unused - we always use EST_TIMEZONE for consistency
): Promise<EventPayload> {
  const occurrences: EventPayload["occurrences"] = []

  // Primary date/time (legacy support)
  const primaryDate = data.date
  const primaryTime = data.showTime
  if (primaryDate && primaryTime) {
    occurrences.push(
      occurrenceSlotPayload(primaryDate, { time: primaryTime }, { occurrence_type: "event" }),
    )
  }

  const isPiece = data.type === "PIECE"
  const scheduleMode = data.pieceScheduleMode ?? "FROM_PARENT"
  const hasSelectedSlots = data.selectedSlots && data.selectedSlots.length > 0
  const hasCustomOccurrences = data.extraOccurrences && data.extraOccurrences.length > 0

  // For pieces, handle different scenarios:
  // 1. FROM_PARENT mode with selectedSlots → add selectedSlots + custom occurrences (filter duplicates of selectedSlots)
  // 2. FROM_PARENT mode with only custom occurrences → add custom occurrences only
  // 3. CUSTOM mode → add custom occurrences only
  if (isPiece && (scheduleMode === "FROM_PARENT" || scheduleMode === "CUSTOM")) {
    // Get parent occurrences (from the organizer's confirmed dates/times)
    // These are in data.occurrences when the parent event is confirmed
    const parentOccurrences = data.occurrences || []
    
    // Track selectedSlots occurrences to check for duplicates
    const selectedOccurrences: Array<{
      date: string
      time: string
      address: string | null
      place_id: string | null
      venue_name: string | null
      location_instructions: string | null
    }> = []
    
    // First, add occurrences from selectedSlots (parent event selections) if they exist
    if (hasSelectedSlots) {
      for (const slotKey of data.selectedSlots ?? []) {
        // Parse slot key: "YYYY-MM-DD|HH:mm"
        const [date, time] = slotKey.split("|")
        if (!date || !time) continue
        
        // Find matching parent occurrence to get location fields
        const parentOcc = parentOccurrences.find((occ: any) => {
          if (!occ?.date || occ.date !== date) return false
          const matchingTime = occ.times?.find((t: any) => t?.time === time)
          return !!matchingTime
        }) as any
        
        // Get location from parent occurrence - check time-level first, then date-level
        // Location is stored per time slot in the times array, with date-level as fallback
        const timeSlot = parentOcc?.times?.find((t: any) => t?.time === time) as any
        const locationData = {
          // Time-level location takes precedence, fallback to date-level
          address: timeSlot?.address || parentOcc?.address || null,
          place_id: timeSlot?.placeId || parentOcc?.placeId || null,
          venue_name: timeSlot?.venueName || parentOcc?.venueName || null,
          location_instructions: timeSlot?.instructions || parentOcc?.locationInstructions || null,
          lat: timeSlot?.lat || parentOcc?.lat || null,
          lng: timeSlot?.lng || parentOcc?.lng || null,
        }
        
        const selectedOcc = {
          date,
          time,
          address: locationData.address,
          place_id: locationData.place_id,
          venue_name: locationData.venue_name,
          location_instructions: locationData.location_instructions,
        }
        
        // Store for duplicate checking
        selectedOccurrences.push(selectedOcc)
        
        // Create occurrence with location fields from parent
        occurrences.push(
          occurrenceSlotPayload(date, { time }, {
            occurrence_type: "event",
            address: locationData.address,
            place_id: locationData.place_id,
            lat: locationData.lat,
            lng: locationData.lng,
            venue_name: locationData.venue_name,
            location_instructions: locationData.location_instructions,
          }),
        )
      }
    }
    
    // Helper: check if a custom occurrence exactly matches a selectedSlot
    // (same date, time, AND location/instructions)
    const isDuplicateOfSelected = (
      date: string,
      time: string,
      address: string | null | undefined,
      placeId: string | null | undefined,
      venueName: string | null | undefined,
      locationInstructions: string | null | undefined
    ): boolean => {
      return selectedOccurrences.some((selected) => {
        if (selected.date !== date || selected.time !== time) return false
        
        // Compare location fields - all must match for it to be a duplicate
        const addressMatch = (selected.address || null) === (address || null)
        const placeIdMatch = (selected.place_id || null) === (placeId || null)
        const venueNameMatch = (selected.venue_name || null) === (venueName || null)
        const instructionsMatch = (selected.location_instructions || null) === (locationInstructions || null)
        
        return addressMatch && placeIdMatch && venueNameMatch && instructionsMatch
      })
    }
    
    // Then, add any custom occurrences from extraOccurrences (added via "Don't see your date/time?")
    // Filter out only exact duplicates of selectedSlots (same date, time, AND location/instructions)
    if (hasCustomOccurrences) {
      const customOccurrences = data.extraOccurrences ?? []
      for (const d of customOccurrences) {
        if (!d?.date || !Array.isArray(d?.times)) continue
        for (const t of d.times) {
          if (!t?.time) continue
          
          // Skip if this custom occurrence exactly matches a selectedSlot
          if (isDuplicateOfSelected(
            d.date,
            t.time,
            (d as any).address,
            (d as any).placeId,
            (d as any).venueName,
            (d as any).locationInstructions
          )) {
            continue
          }
          
          occurrences.push(
            occurrenceSlotPayload(d.date, t, {
              occurrence_type: "event",
              address: (d as any).address || null,
              place_id: (d as any).placeId || null,
              lat: (d as any).lat || null,
              lng: (d as any).lng || null,
              venue_name: (d as any).venueName || null,
              location_instructions: (d as any).locationInstructions || null,
            }),
          )
        }
      }
    }
  } else {
    // ORGANIZER (parent) submissions
    // Only add custom date/time entries from occurrences field
    // Check for uniqueness (no duplicates within form entries)
    // TODO: If listingId is added to EventFormData for updates, also check against existing listing_occurrences
    
    // Helper: check if a custom occurrence exactly matches another occurrence
    // (same date, time, AND location/instructions)
    const isDuplicate = (
      date: string,
      time: string,
      address: string | null | undefined,
      placeId: string | null | undefined,
      venueName: string | null | undefined,
      locationInstructions: string | null | undefined,
      allOccurrences: Array<{ date?: string; times?: Array<{ time?: string }> }>,
      currentIndex: number
    ): boolean => {
      // Check against other entries in the form
      for (let i = 0; i < allOccurrences.length; i++) {
        if (i === currentIndex) continue // Skip self
        
        const other = allOccurrences[i]
        if (!other?.date || !Array.isArray(other?.times)) continue
        
        if (other.date !== date) continue
        
        for (const t of other.times) {
          if (!t?.time || t.time !== time) continue
          
          // Check if location matches
          const addressMatch = ((other as any).address || null) === (address || null)
          const placeIdMatch = ((other as any).placeId || null) === (placeId || null)
          const venueNameMatch = ((other as any).venueName || null) === (venueName || null)
          const instructionsMatch = ((other as any).locationInstructions || null) === (locationInstructions || null)
          
          if (addressMatch && placeIdMatch && venueNameMatch && instructionsMatch) {
            return true // Found duplicate
          }
        }
      }
      return false
    }
    
    // Add custom occurrences from occurrences field only
    const customOccurrences = data.occurrences || []
    
    for (let i = 0; i < customOccurrences.length; i++) {
      const d = customOccurrences[i]
      if (!d?.date || !Array.isArray(d?.times)) continue
      
      for (const t of d.times) {
        if (!t?.time) continue
        
        const address = (d as any).address || null
        const placeId = (d as any).placeId || null
        const venueName = (d as any).venueName || null
        const locationInstructions = (d as any).locationInstructions || null
        
        // Skip if this duplicates another occurrence in the form
        if (isDuplicate(d.date, t.time, address, placeId, venueName, locationInstructions, customOccurrences, i)) {
          continue
        }
        
        occurrences.push(
          occurrenceSlotPayload(d.date, t, {
            occurrence_type: "event",
            address,
            place_id: placeId,
            lat: (d as any).lat || null,
            lng: (d as any).lng || null,
            venue_name: venueName,
            location_instructions: locationInstructions,
          }),
        )
      }
    }
  }

  // Build piece_details if this is a piece
  let pieceDetails: Record<string, unknown> | null = null
  let parentListingId: string | null = null
  let relationshipType: "performance_piece" | "workshop_class" | null = null

  if (isPiece) {
    parentListingId = data.parentEventId || null
    relationshipType = parentListingId ? "performance_piece" : null
    
    // Extract piece-specific fields from form data
    // Form uses "piece_" prefix for single piece, or "pieces.${index}_" for multiple
    const pieceCompany = (data as any).piece_company || (data as any).piece?.company || null
    const pieceCompanyWebsite = (data as any).piece_companyWebsite || (data as any).piece?.companyWebsite || null
    const pieceTitle = (data as any).piece_title || (data as any).piece?.title || null
    const pieceDescription = (data as any).piece_description || (data as any).piece?.description || null
    const choreographer = (data as any).piece_choreographer || (data as any).piece?.choreographer || null
    
    pieceDetails = {
      parent_listing_id: parentListingId,
      parent_event_name: data.parentEventName || null,
      parent_event_website: data.parentEventWebsite || null,
      parent_event_ticket_link: data.parentEventTicketLink || null,
      parent_event_contact_email: data.parentEventContactEmail || null,
      piece_schedule_mode: data.pieceScheduleMode || null,
      selected_slots: data.selectedSlots || null,
      piece_title: pieceTitle,
      piece_company: pieceCompany,
      piece_company_website: pieceCompanyWebsite,
      piece_description: pieceDescription,
      choreographer: choreographer,
    }
  }

  const rawShare = (data.shareRecipientEmails ?? [])
    .map((e) => e.trim())
    .filter(Boolean)
  const basePayload = buildBasePayload(data, userInfo)
  const base =
    rawShare.length > 0
      ? {
          ...basePayload,
          meta: { share: { recipient_emails: rawShare } },
        }
      : basePayload

  return {
    type: "performance",
    base,
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
  _tz: string // Unused - we always use EST_TIMEZONE for consistency
): EventPayload {
  const occurrences: EventPayload["occurrences"] = []
  
  // Build event occurrences from the occurrences array
  for (const occ of data.occurrences ?? []) {
    if (!occ?.date || !Array.isArray(occ?.times)) continue
    for (const t of occ.times) {
      if (!t?.time) continue
      occurrences.push(
        occurrenceSlotPayload(occ.date, t, {
          occurrence_type: "event",
          address: (occ as any).address || null,
          place_id: (occ as any).placeId || null,
          lat: (occ as any).lat || null,
          lng: (occ as any).lng || null,
          venue_name: (occ as any).venueName || null,
          location_instructions: (occ as any).locationInstructions || null,
        }),
      )
    }
  }

  // Build deadline occurrences
  for (const deadline of data.deadlineOccurrences ?? []) {
    if (!deadline?.date || !Array.isArray(deadline?.times)) continue
    for (const t of deadline.times) {
      if (!t?.time) continue
      occurrences.push(
        occurrenceSlotPayload(deadline.date, t, { occurrence_type: "deadline" }),
      )
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
      website: (data.listingWebsite ?? "").trim() || null,
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
  _tz: string // Unused - we always use EST_TIMEZONE for consistency
): EventPayload {
  const occurrences: EventPayload["occurrences"] = []

  // Build deadline occurrences
  for (const deadline of data.deadlineOccurrences ?? []) {
    if (!deadline?.date || !Array.isArray(deadline?.times)) continue
    for (const t of deadline.times) {
      if (!t?.time) continue
      occurrences.push(
        occurrenceSlotPayload(deadline.date, t, { occurrence_type: "deadline" }),
      )
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
      // API/DB column remains `link`; form uses free-text field (fallback: legacy `link` on same form object).
      link:
        (data.creativeSubmissionInstructions ?? "").trim() ||
        (data.link ?? "").trim() ||
        "",
      website: (data.listingWebsite ?? "").trim() || null,
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
  _tz: string // Unused - we always use EST_TIMEZONE for consistency
): EventPayload {
  const occurrences: EventPayload["occurrences"] = []

  // Use occurrences field
  const occurrencesData = data.occurrences && data.occurrences.length > 0
    ? data.occurrences
    : []

  for (const d of occurrencesData) {
    if (!d?.date || !Array.isArray(d?.times)) continue
    for (const t of d.times) {
      if (!t?.time) continue
      occurrences.push(
        occurrenceSlotPayload(d.date, t, {
          occurrence_type: "event",
          address: (d as any).address || null,
          place_id: (d as any).placeId || null,
          lat: (d as any).lat || null,
          lng: (d as any).lng || null,
          venue_name: (d as any).venueName || null,
          location_instructions: (d as any).locationInstructions || null,
        }),
      )
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
      .map((tok) =>
        occurrenceSlotPayload(tok, { time: primaryTime }, { occurrence_type: "event" as const }),
      )
    const extraOcc = (data.classExtraOccurrences ?? [])
      .filter((o) => o?.date && o?.time)
      .map((o) =>
        occurrenceSlotPayload(o.date, { time: o.time }, { occurrence_type: "event" as const }),
      )
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

  // Handle parent workshop relationship for CLASS type
  const isClass = (data.classWorkshopType || "CLASS") === "CLASS"
  const isPartOfFestivalOrWorkshop = data.isPartOfFestivalOrWorkshop === "YES"
  let parentListingId: string | null = null
  let relationshipType: "performance_piece" | "workshop_class" | null = null

  if (isClass && isPartOfFestivalOrWorkshop) {
    parentListingId = data.parentEventId || null
    relationshipType = parentListingId ? "workshop_class" : null
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
      website: (data.listingWebsite ?? "").trim() || null,
      style_category: data.styleCategory || null,
      workshop_details: data.workshopDetails || null,
      classes_offered: data.classesOffered || null,
      drop_in_classes: data.dropInClasses || null,
      artist_type: data.artistType || data.classArtistType || null,
      listing_fee_option: data.listingFeeOption || data.classListingFeeOption || null,
      listing_fee_explanation: data.listingFeeExplanation || data.classListingFeeExplanation || null,
      guest_spot_info: data.guestSpotInfo || null,
      // Parent workshop relationship fields
      parent_listing_id: parentListingId,
      parent_workshop_name: parentListingId ? null : (data.placeholderTitle || null),
      parent_workshop_website: parentListingId ? null : (data.placeholderWebsiteOrSocial || null),
      parent_workshop_contact_email: parentListingId ? null : (data.placeholderContactEmail || null),
    },
    occurrences,
    parent_listing_id: parentListingId,
    relationship_type: relationshipType,
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

export async function buildEventPayload(
  data: EventFormData,
  eventType: EventType,
  userInfo: UserInfo
): Promise<EventPayload> {
  // Always use EST timezone for consistency
  const tz = EST_TIMEZONE
  const type = eventType.toLowerCase() as
    | "performance"
    | "audition"
    | "creative"
    | "class"
    | "funding"

  switch (type) {
    case "performance":
      return await buildPerformancePayload(data, userInfo, tz)
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

