import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"
import { convertESTToUTC } from "@/lib/datetime-utils"
import {
  LOCATION_MODE_ONLINE,
  mergeLocationModeIntoMeta,
  normalizeLocationFieldsForPersist,
  normalizeLocationMode,
  type LocationFormFields,
  type PersistedLocationFields,
} from "@/lib/location-mode"
import {
  buildOrganizerProgramPiecesDocumentFromForm,
  type OrganizerProgramPiecesDocument,
} from "@/lib/organizer-program-pieces"

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

function listingLocationFromForm(data: LocationFormFields): PersistedLocationFields {
  return normalizeLocationFieldsForPersist({
    locationMode: data.locationMode,
    address: data.address,
    placeId: data.placeId,
    lat: data.lat,
    lng: data.lng,
    venueName: data.venueName,
    locationInstructions: data.locationInstructions,
  })
}

function occurrenceLocationFromRow(row: Record<string, unknown>): PersistedLocationFields {
  return normalizeLocationFieldsForPersist({
    locationMode: row.locationMode as LocationFormFields["locationMode"],
    address: row.address as string | undefined,
    placeId: row.placeId as string | undefined,
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    venueName: row.venueName as string | undefined,
    locationInstructions: row.locationInstructions as string | undefined,
  })
}

function persistedToOccurrencePayload(loc: PersistedLocationFields) {
  return {
    address: loc.address,
    place_id: loc.place_id,
    lat: loc.lat,
    lng: loc.lng,
    venue_name: loc.venue_name,
    location_instructions: loc.location_instructions,
  }
}

export function buildBasePayload(
  data: EventFormData,
  userInfo: UserInfo
): EventPayload["base"] {
  const loc = listingLocationFromForm(data)
  const mode = normalizeLocationMode(data.locationMode)
  const meta =
    mode === LOCATION_MODE_ONLINE ? mergeLocationModeIntoMeta({}, mode) : undefined

  return {
    contact_name: userInfo.name || "",
    pronouns: userInfo.pronouns || null,
    contact_email: userInfo.email || "",
    company: data.company || null,
    company_website: data.companyWebsite || null,
    address: loc.address,
    place_id: loc.place_id,
    lat: loc.lat,
    lng: loc.lng,
    venue_name: loc.venue_name,
    location_instructions: loc.location_instructions,
    social_handles: data.socialHandles || null,
    notes: data.notes || null,
    ...(meta ? { meta } : {}),
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
        const locationData = occurrenceLocationFromRow({
          ...(parentOcc ?? {}),
          ...(timeSlot ?? {}),
          locationMode: timeSlot?.locationMode ?? parentOcc?.locationMode,
          address: timeSlot?.address ?? parentOcc?.address,
          placeId: timeSlot?.placeId ?? parentOcc?.placeId,
          venueName: timeSlot?.venueName ?? parentOcc?.venueName,
          locationInstructions:
            timeSlot?.locationInstructions ?? timeSlot?.instructions ?? parentOcc?.locationInstructions,
          lat: timeSlot?.lat ?? parentOcc?.lat,
          lng: timeSlot?.lng ?? parentOcc?.lng,
        })

        const selectedOcc = {
          date,
          time,
          address: locationData.address,
          place_id: locationData.place_id,
          venue_name: locationData.venue_name,
          location_instructions: locationData.location_instructions,
        }

        selectedOccurrences.push(selectedOcc)

        occurrences.push(
          occurrenceSlotPayload(date, { time }, {
            occurrence_type: "event",
            ...persistedToOccurrencePayload(locationData),
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
          
          const loc = occurrenceLocationFromRow(d as Record<string, unknown>)
          occurrences.push(
            occurrenceSlotPayload(d.date, t, {
              occurrence_type: "event",
              ...persistedToOccurrencePayload(loc),
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
        
        const loc = occurrenceLocationFromRow(d as Record<string, unknown>)

        if (
          isDuplicate(
            d.date,
            t.time,
            loc.address,
            loc.place_id,
            loc.venue_name,
            loc.location_instructions,
            customOccurrences,
            i,
          )
        ) {
          continue
        }

        occurrences.push(
          occurrenceSlotPayload(d.date, t, {
            occurrence_type: "event",
            ...persistedToOccurrencePayload(loc),
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
  const performanceMeta: Record<string, unknown> = { ...(basePayload.meta ?? {}) }
  if (rawShare.length > 0) {
    performanceMeta.share = { recipient_emails: rawShare }
  }
  const base = {
    ...basePayload,
    ...(Object.keys(performanceMeta).length > 0 ? { meta: performanceMeta } : {}),
  }

  let organizerProgramPieces: OrganizerProgramPiecesDocument | null = null
  if (!isPiece) {
    if (
      (data.eventType === "SPLIT_BILL" || data.eventType === "FESTIVAL") &&
      data.addPiece === true
    ) {
      organizerProgramPieces = buildOrganizerProgramPiecesDocumentFromForm(data as Record<string, unknown>)
    } else {
      organizerProgramPieces = null
    }
  }

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
      participants: isPiece
        ? data.piece_credits?.trim() || data.participants?.trim() || null
        : data.participants ?? null,
      event_type: data.eventType || null,
      agree_comp_tickets: Boolean(data.agreeCompTickets),
      event_dates_confirmed: Boolean(data.eventDatesConfirmed),
      artist_type: data.artistType || null,
      listing_fee_option: data.listingFeeOption || null,
      listing_fee_explanation: data.listingFeeExplanation || null,
      complementary_ticket_info: data.complementaryTicketInfo || null,
      guest_spot_info: null, // Not used for performance, but keep for consistency
      organizer_program_pieces: organizerProgramPieces,
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
  const listingLoc = listingLocationFromForm(data)

  for (const occ of data.occurrences ?? []) {
    if (!occ?.date || !Array.isArray(occ?.times)) continue
    for (const t of occ.times) {
      if (!t?.time) continue
      occurrences.push(
        occurrenceSlotPayload(occ.date, t, {
          occurrence_type: "event",
          ...persistedToOccurrencePayload(listingLoc),
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
      const loc = occurrenceLocationFromRow(d as Record<string, unknown>)
      occurrences.push(
        occurrenceSlotPayload(d.date, t, {
          occurrence_type: "event",
          ...persistedToOccurrencePayload(loc),
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
  if (firstOccurrence && !basePayload.address && !basePayload.venue_name) {
    const loc = occurrenceLocationFromRow(firstOccurrence as Record<string, unknown>)
    basePayload.address = loc.address
    basePayload.place_id = loc.place_id
    basePayload.lat = loc.lat
    basePayload.lng = loc.lng
    basePayload.venue_name = loc.venue_name
    basePayload.location_instructions = loc.location_instructions
  }

  const isWorkshop = (data.classWorkshopType || "CLASS") === "WORKSHOP"
  const dropInClassesStored =
    isWorkshop && data.dropInClassesAvailable === "YES"
      ? (data.dropInClasses ?? "").trim() || null
      : isWorkshop
        ? null
        : (data.dropInClasses ?? "").trim() || null
  const rawShare = isWorkshop
    ? (data.shareRecipientEmails ?? [])
        .map((e) => e.trim())
        .filter(Boolean)
    : []
  const classMeta: Record<string, unknown> = { ...(basePayload.meta ?? {}) }
  if (rawShare.length > 0) {
    classMeta.share = { recipient_emails: rawShare }
  }
  const base = {
    ...basePayload,
    ...(Object.keys(classMeta).length > 0 ? { meta: classMeta } : {}),
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
    base,
    details: {
      class_workshop_type: data.classWorkshopType || "CLASS",
      title: data.title ?? data.className ?? "",
      description: data.description ?? data.classDescription ?? "",
      organizer: data.organizer ?? "",
      teachers: data.teachers ?? "",
      price: data.price ?? data.classPrice ?? null,
      link:
        (data.classRegistrationDetails ?? "").trim() ||
        (data.classLink ?? "").trim() ||
        null,
      website: (data.listingWebsite ?? "").trim() || null,
      duration: (data.classWorkshopDuration ?? "").trim() || null,
      style_category: data.styleCategory || null,
      workshop_details: data.workshopDetails || null,
      classes_offered: data.classesOffered || null,
      drop_in_classes: dropInClassesStored,
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

