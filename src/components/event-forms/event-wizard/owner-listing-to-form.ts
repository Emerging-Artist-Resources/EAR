import type { EventFormData } from "@/lib/validations/events"
import type { EventType } from "./EventTypeSelector"
import { convertUTCToEST } from "@/lib/datetime-utils"
import {
  extractPiecePhotosByIdFromDocument,
  normalizeOrganizerProgramPiecesFromDb,
  pieceFieldPrefix,
  type OrganizerProgramPiecePhoto,
} from "@/lib/organizer-program-pieces"

type UnknownRecord = Record<string, unknown>

function relOne<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null
  return Array.isArray(x) ? (x[0] ?? null) : x
}

function relMany<T>(x: T | T[] | null | undefined): T[] {
  if (x == null) return []
  return Array.isArray(x) ? x : [x]
}

function occurrenceRowToForm(occ: {
  starts_at_utc: string
  ends_at_utc?: string | null
  address?: string | null
  place_id?: string | null
  lat?: number | null
  lng?: number | null
  venue_name?: string | null
  location_instructions?: string | null
}) {
  const { date, time } = convertUTCToEST(occ.starts_at_utc)
  let endTime = ""
  if (occ.ends_at_utc) {
    endTime = convertUTCToEST(occ.ends_at_utc).time
  }
  return {
    date,
    times: [{ time, endTime }],
    address: occ.address ?? undefined,
    placeId: occ.place_id ?? undefined,
    lat: occ.lat ?? undefined,
    lng: occ.lng ?? undefined,
    venueName: occ.venue_name ?? undefined,
    locationInstructions: occ.location_instructions ?? undefined,
  }
}

function shareEmailsFromMeta(meta: unknown): string[] {
  const m = meta as { share?: { recipient_emails?: string[] } } | null | undefined
  const raw = m?.share?.recipient_emails
  return Array.isArray(raw) ? raw.filter((e): e is string => typeof e === "string") : []
}

export type OwnerListingLoadResult = {
  eventType: EventType
  defaults: Partial<EventFormData>
  /** Status before user edits (used for approved save confirmation). */
  initialPersistedStatus: string
  existingPhotos: Array<{ path: string; credit?: string | null }>
  /** Persisted piece promo images keyed by stable piece id (edit flow). */
  organizerPiecePhotosById: Record<string, OrganizerProgramPiecePhoto[]>
}

/**
 * Maps GET /api/events/:id/owner payload into EventWizard defaults.
 */
export function ownerListingToFormLoad(row: UnknownRecord): OwnerListingLoadResult {
  const emptyPiecePhotos: Record<string, OrganizerProgramPiecePhoto[]> = {}
  const listing = row as UnknownRecord
  const type = listing.type as string
  const status = (listing.status as string) || "pending"
  const occRows = relMany(listing.listing_occurrences as unknown[])
  const photosRaw = relMany(listing.listing_photos as unknown[])
  const existingPhotos = [...photosRaw]
    .sort(
      (a, b) =>
        ((a as { sort_order?: number }).sort_order ?? 0) - ((b as { sort_order?: number }).sort_order ?? 0)
    )
    .map((p) => {
      const ph = p as { path: string; credit?: string | null }
      return { path: ph.path, credit: ph.credit ?? null }
    })

  const baseDefaults: Partial<EventFormData> = {
    company: (listing.company as string) || undefined,
    companyWebsite: (listing.company_website as string) || undefined,
    address: (listing.address as string) || undefined,
    placeId: (listing.place_id as string) || undefined,
    lat: listing.lat as number | undefined,
    lng: listing.lng as number | undefined,
    venueName: (listing.venue_name as string) || undefined,
    locationInstructions: (listing.location_instructions as string) || undefined,
    socialHandles: (listing.social_handles as string) || undefined,
    notes: (listing.notes as string) || undefined,
    shareRecipientEmails: shareEmailsFromMeta(listing.meta),
    agreeCompTickets: false,
    extraOccurrences: [],
    occurrences: [],
    deadlineOccurrences: [],
  }

  if (type === "performance") {
    const pd = relOne(listing.performance_details as UnknownRecord) as UnknownRecord | null
    const piece = relOne(listing.piece_details as UnknownRecord) as UnknownRecord | null
    const subtype = (pd?.subtype as string) || "ORGANIZER"

    if (subtype === "ORGANIZER") {
      const eventOccs = occRows.filter((o) => (o as { occurrence_type?: string }).occurrence_type !== "deadline")
      const occurrences = eventOccs.map((o) => occurrenceRowToForm(o as Parameters<typeof occurrenceRowToForm>[0]))

      const programRaw = pd?.organizer_program_pieces
      const organizerPiecePhotosById = extractPiecePhotosByIdFromDocument(programRaw)
      const doc = normalizeOrganizerProgramPiecesFromDb(programRaw)

      const programFlat: Record<string, unknown> = {}
      if (doc && doc.pieces.length > 0) {
        programFlat.addPiece = true
        programFlat.pieces = doc.pieces.map(() => ({}))
        doc.pieces.forEach((piece, i) => {
          const p = pieceFieldPrefix(i)
          programFlat[`${p}_id`] = piece.id
          programFlat[`${p}_company`] = piece.company ?? ""
          programFlat[`${p}_companyWebsite`] = piece.company_website ?? ""
          programFlat[`${p}_title`] = piece.title ?? ""
          programFlat[`${p}_choreographer`] = piece.choreographer ?? ""
          programFlat[`${p}_description`] = piece.description ?? ""
          programFlat[`${p}_credits`] = piece.credits ?? ""
          programFlat[`${p}_selectedSlots`] = piece.selected_slots ?? []
          programFlat[`${p}_pieceScheduleMode`] = piece.piece_schedule_mode ?? "FROM_PARENT"
          programFlat[`${p}_extraOccurrences`] = Array.isArray(piece.extra_occurrences)
            ? piece.extra_occurrences
            : []
        })
      } else {
        programFlat.addPiece = false
        programFlat.pieces = []
      }

      const defaults: Partial<EventFormData> = {
        ...baseDefaults,
        type: "ORGANIZER",
        title: (pd?.title as string) || "",
        description: (pd?.description as string) || "",
        organizer: (pd?.organizer as string) || "",
        website: (pd?.website as string) || "",
        link: (pd?.link as string) || "",
        price: (pd?.price as string) || "",
        participants: (pd?.participants as string) || "",
        eventType: (pd?.event_type as EventFormData["eventType"]) || undefined,
        agreeCompTickets: Boolean(pd?.agree_comp_tickets),
        eventDatesConfirmed: Boolean(pd?.event_dates_confirmed),
        artistType: (pd?.artist_type as EventFormData["artistType"]) || undefined,
        listingFeeOption: (pd?.listing_fee_option as EventFormData["listingFeeOption"]) || undefined,
        listingFeeExplanation: (pd?.listing_fee_explanation as string) || undefined,
        complementaryTicketInfo: (pd?.complementary_ticket_info as string) || undefined,
        occurrences,
        ...(programFlat as Partial<EventFormData>),
      }
      return {
        eventType: "PERFORMANCE",
        defaults,
        initialPersistedStatus: status,
        existingPhotos,
        organizerPiecePhotosById,
      }
    }

    // PIECE: treat stored occurrences as custom schedule for edit (avoids parent schedule fetch).
    const eventOccs = occRows.filter((o) => (o as { occurrence_type?: string }).occurrence_type !== "deadline")
    const extraOccurrences = eventOccs.map((o) => occurrenceRowToForm(o as Parameters<typeof occurrenceRowToForm>[0]))

    const defaults: Partial<EventFormData> = {
      ...baseDefaults,
      type: "PIECE",
      // Load all stored showtimes as custom schedule so the wizard matches the saved payload without parent refetch.
      pieceScheduleMode: "CUSTOM",
      selectedSlots: [],
      parentEventId: (piece?.parent_listing_id as string) || undefined,
      parentEventName: (piece?.parent_event_name as string) || undefined,
      parentEventWebsite: (piece?.parent_event_website as string) || undefined,
      parentEventTicketLink: (piece?.parent_event_ticket_link as string) || undefined,
      parentEventContactEmail: (piece?.parent_event_contact_email as string) || undefined,
      piece_title: (piece?.piece_title as string) || "",
      piece_company: (piece?.piece_company as string) || "",
      piece_companyWebsite: (piece?.piece_company_website as string) || "",
      piece_description: (piece?.piece_description as string) || "",
      piece_choreographer: (piece?.choreographer as string) || "",
      piece_credits: (pd?.participants as string) || "",
      organizer: (pd?.organizer as string) || "",
      artistType: (pd?.artist_type as EventFormData["artistType"]) || undefined,
      listingFeeOption: (pd?.listing_fee_option as EventFormData["listingFeeOption"]) || undefined,
      listingFeeExplanation: (pd?.listing_fee_explanation as string) || undefined,
      complementaryTicketInfo: (pd?.complementary_ticket_info as string) || undefined,
      occurrences: [],
      extraOccurrences,
    }
    return {
      eventType: "PERFORMANCE",
      defaults,
      initialPersistedStatus: status,
      existingPhotos,
      organizerPiecePhotosById: emptyPiecePhotos,
    }
  }

  if (type === "audition") {
    const ad = relOne(listing.audition_details as UnknownRecord) as UnknownRecord | null
    const eventOccs = occRows.filter((o) => (o as { occurrence_type?: string }).occurrence_type === "event")
    const deadlineOccs = occRows.filter((o) => (o as { occurrence_type?: string }).occurrence_type === "deadline")
    const occurrences = eventOccs.map((o) => occurrenceRowToForm(o as Parameters<typeof occurrenceRowToForm>[0]))
    const deadlineOccurrences = deadlineOccs.map((o) =>
      occurrenceRowToForm(o as Parameters<typeof occurrenceRowToForm>[0])
    )

    const feeRaw = ad?.fee as string | null | undefined
    const defaults: Partial<EventFormData> = {
      ...baseDefaults,
      title: (ad?.title as string) || "",
      description: (ad?.description as string) || "",
      eligibility: (ad?.eligibility as string) || "",
      compensation: (ad?.compensation as string) || "",
      instructions: (ad?.instructions as string) || "",
      preAuditionClasses: (ad?.pre_audition_classes as string) || undefined,
      listingWebsite: (ad?.website as string) || "",
      fee: feeRaw === "PAY_FEE" ? "FEE" : "NO_FEE",
      feeAmount: (ad?.fee_amount as string) || undefined,
      artistType: (ad?.artist_type as EventFormData["artistType"]) || undefined,
      occurrences,
      deadlineOccurrences,
    }
    return {
      eventType: "AUDITION",
      defaults,
      initialPersistedStatus: status,
      existingPhotos,
      organizerPiecePhotosById: emptyPiecePhotos,
    }
  }

  if (type === "creative") {
    const cd = relOne(listing.creative_details as UnknownRecord) as UnknownRecord | null
    const deadlineOccs = occRows.filter((o) => (o as { occurrence_type?: string }).occurrence_type === "deadline")
    const deadlineOccurrences = deadlineOccs.map((o) =>
      occurrenceRowToForm(o as Parameters<typeof occurrenceRowToForm>[0])
    )
    const feeRaw = cd?.fee as string | null | undefined

    const defaults: Partial<EventFormData> = {
      ...baseDefaults,
      title: (cd?.title as string) || "",
      description: (cd?.description as string) || "",
      host: (cd?.host as string) || "",
      dates: (cd?.dates as string) || "",
      compensation: (cd?.compensation as string) || "",
      requirements: (cd?.requirements as string) || "",
      creativeSubmissionInstructions: (cd?.link as string) || "",
      listingWebsite: (cd?.website as string) || "",
      fee: feeRaw === "PAY_FEE" ? "FEE" : "NO_FEE",
      feeAmount: (cd?.fee_amount as string) || undefined,
      artistType: (cd?.artist_type as EventFormData["artistType"]) || undefined,
      deadlineOccurrences,
    }
    return {
      eventType: "CREATIVE",
      defaults,
      initialPersistedStatus: status,
      existingPhotos,
      organizerPiecePhotosById: emptyPiecePhotos,
    }
  }

  if (type === "class") {
    const cwd = relOne(listing.class_workshop_details as UnknownRecord) as UnknownRecord | null
    const eventOccs = occRows.filter((o) => (o as { occurrence_type?: string }).occurrence_type !== "deadline")
    const occurrences = eventOccs.map((o) => occurrenceRowToForm(o as Parameters<typeof occurrenceRowToForm>[0]))
    const parentId = (cwd?.parent_listing_id as string) || null

    const defaults: Partial<EventFormData> = {
      ...baseDefaults,
      classWorkshopType: (cwd?.class_workshop_type as EventFormData["classWorkshopType"]) || "CLASS",
      title: (cwd?.title as string) || "",
      description: (cwd?.description as string) || "",
      organizer: (cwd?.organizer as string) || "",
      teachers: (cwd?.teachers as string) || "",
      price: (cwd?.price as string) || "",
      classRegistrationDetails: (cwd?.link as string) || undefined,
      listingWebsite: (cwd?.website as string) || "",
      classWorkshopDuration: (cwd?.duration as string) || "",
      styleCategory: (cwd?.style_category as string) || undefined,
      workshopDetails: (cwd?.workshop_details as string) || undefined,
      classesOffered: (cwd?.classes_offered as string) || undefined,
      ...(() => {
        const dropText = ((cwd?.drop_in_classes as string) ?? "").trim()
        return {
          dropInClassesAvailable: (dropText ? "YES" : "NO") as EventFormData["dropInClassesAvailable"],
          dropInClasses: dropText || undefined,
        }
      })(),
      artistType: (cwd?.artist_type as EventFormData["artistType"]) || undefined,
      listingFeeOption: (cwd?.listing_fee_option as EventFormData["listingFeeOption"]) || undefined,
      listingFeeExplanation: (cwd?.listing_fee_explanation as string) || undefined,
      guestSpotInfo: (cwd?.guest_spot_info as string) || undefined,
      parentEventId: parentId || undefined,
      isPartOfFestivalOrWorkshop: parentId ? "YES" : "NO",
      placeholderTitle: (cwd?.parent_workshop_name as string) || undefined,
      placeholderWebsiteOrSocial: (cwd?.parent_workshop_website as string) || undefined,
      placeholderContactEmail: (cwd?.parent_workshop_contact_email as string) || undefined,
      occurrences,
    }
    return {
      eventType: "CLASS",
      defaults,
      initialPersistedStatus: status,
      existingPhotos,
      organizerPiecePhotosById: emptyPiecePhotos,
    }
  }

  throw new Error(`Unsupported listing type for edit: ${type}`)
}
