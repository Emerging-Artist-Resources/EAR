import { performanceStep2Schema } from "@/lib/validations/events"
import { ownerListingToFormLoad } from "@/components/event-forms/event-wizard/owner-listing-to-form"
import { buildPerformancePayload } from "@/components/event-forms/event-wizard/payload-builders"
import { resetPieceParentToSearch, clearPieceParentDependentSchedule } from "@/components/event-forms/event-wizard/steps/performance/reset-piece-parent-to-search"
import type { EventFormData } from "@/lib/validations/events"

const PARENT_LISTING_ID = "11111111-1111-4111-8111-111111111111"

function issuePaths(result: { success: false; error: { issues: { path: PropertyKey[] }[] } }) {
  return result.error.issues.map((i) => i.path.join("."))
}

function manualPieceBase(overrides: Record<string, unknown> = {}) {
  return {
    type: "PIECE",
    parentEventMode: "MANUAL",
    parentEventName: "Independent Festival",
    link: "https://tickets.example.com/show",
    price: "$25",
    piece_company: "Dance Co",
    piece_title: "New Work",
    piece_description: "A short piece.",
    pieceScheduleMode: "CUSTOM",
    extraOccurrences: [
      {
        date: "2026-09-15",
        times: [{ time: "19:30" }],
        venueName: "The Kitchen",
        address: "512 W 19th St, New York, NY",
      },
    ],
    ...overrides,
  }
}

describe("performance piece ticket fields (MANUAL vs SELECT)", () => {
  it("requires ticket link and price for MANUAL pieces", () => {
    const missingBoth = performanceStep2Schema.safeParse(
      manualPieceBase({ link: "", price: "" }),
    )
    expect(missingBoth.success).toBe(false)
    if (!missingBoth.success) {
      const paths = issuePaths(missingBoth)
      expect(paths).toContain("link")
      expect(paths).toContain("price")
    }

    const missingPrice = performanceStep2Schema.safeParse(manualPieceBase({ price: "" }))
    expect(missingPrice.success).toBe(false)
    if (!missingPrice.success) {
      expect(issuePaths(missingPrice)).toContain("price")
    }
  })

  it("accepts MANUAL pieces with ticket link and price", () => {
    const result = performanceStep2Schema.safeParse(manualPieceBase())
    expect(result.success).toBe(true)
  })

  it("does not require ticket fields for SELECT / linked pieces", () => {
    const result = performanceStep2Schema.safeParse({
      type: "PIECE",
      parentEventMode: "SELECT",
      parentEventId: PARENT_LISTING_ID,
      piece_company: "Dance Co",
      piece_title: "New Work",
      piece_description: "A short piece.",
      pieceScheduleMode: "FROM_PARENT",
      selectedSlots: ["2026-09-15|19:30"],
      link: "",
      price: "",
    })
    expect(result.success).toBe(true)
  })
})

describe("resetPieceParentToSearch", () => {
  it("clears manual parent and ticket fields and their errors when returning to search", () => {
    const setValue = jest.fn()
    const clearErrors = jest.fn()

    resetPieceParentToSearch({ setValue, clearErrors })

    expect(setValue).toHaveBeenCalledWith("parentEventMode", "SELECT", {
      shouldDirty: true,
      shouldValidate: false,
    })
    for (const field of ["parentEventName", "organizer", "parentEventWebsite", "parentEventContactEmail", "link", "price"]) {
      expect(setValue).toHaveBeenCalledWith(field, "", {
        shouldDirty: true,
        shouldValidate: false,
      })
    }
    expect(clearErrors).toHaveBeenCalledWith([
      "parentEventName",
      "organizer",
      "parentEventWebsite",
      "parentEventContactEmail",
      "link",
      "price",
    ])
    expect(setValue).toHaveBeenCalledWith("selectedSlots", [], {
      shouldDirty: true,
      shouldValidate: false,
    })
    expect(setValue).toHaveBeenCalledWith("occurrences", [], {
      shouldDirty: true,
      shouldValidate: false,
    })
    expect(clearErrors).toHaveBeenCalledWith(["selectedSlots", "occurrences"])
  })
})

describe("clearPieceParentDependentSchedule", () => {
  it("clears selectedSlots, parent occurrences cache, and related errors", () => {
    const setValue = jest.fn()
    const clearErrors = jest.fn()

    clearPieceParentDependentSchedule({ setValue, clearErrors })

    expect(setValue).toHaveBeenCalledWith("selectedSlots", [], {
      shouldDirty: true,
      shouldValidate: false,
    })
    expect(setValue).toHaveBeenCalledWith("occurrences", [], {
      shouldDirty: true,
      shouldValidate: false,
    })
    expect(clearErrors).toHaveBeenCalledWith(["selectedSlots", "occurrences"])
  })
})

describe("ownerListingToFormLoad piece ticket hydrate", () => {
  it("restores MANUAL mode and ticket values for unlinked pieces", () => {
    const result = ownerListingToFormLoad({
      type: "performance",
      status: "approved",
      performance_details: {
        subtype: "PIECE",
        link: "https://tickets.example.com/show",
        price: "$20 / sliding scale",
        participants: null,
      },
      piece_details: {
        parent_listing_id: null,
        parent_event_name: "Independent Festival",
        piece_title: "New Work",
        piece_company: "Dance Co",
        piece_description: "A short piece.",
      },
      listing_occurrences: [],
      listing_photos: [],
    })

    expect(result.defaults.parentEventMode).toBe("MANUAL")
    expect(result.defaults.link).toBe("https://tickets.example.com/show")
    expect(result.defaults.price).toBe("$20 / sliding scale")
  })

  it("keeps SELECT mode for linked pieces", () => {
    const result = ownerListingToFormLoad({
      type: "performance",
      status: "approved",
      performance_details: {
        subtype: "PIECE",
        link: null,
        price: null,
      },
      piece_details: {
        parent_listing_id: PARENT_LISTING_ID,
        piece_title: "New Work",
        piece_company: "Dance Co",
        piece_description: "A short piece.",
      },
      listing_occurrences: [],
      listing_photos: [],
    })

    expect(result.defaults.parentEventMode).toBe("SELECT")
    expect(result.defaults.parentEventId).toBe(PARENT_LISTING_ID)
  })
})

describe("buildPerformancePayload piece ticket fields", () => {
  const userInfo = { name: "Test User", email: "test@example.com" }

  it("includes performance_details.link and price for MANUAL pieces", async () => {
    const payload = await buildPerformancePayload(
      manualPieceBase({
        contactName: "Test User",
        contactEmail: "test@example.com",
      }) as EventFormData,
      userInfo,
      "America/New_York",
    )

    expect(payload.details.subtype).toBe("PIECE")
    expect(payload.details.link).toBe("https://tickets.example.com/show")
    expect(payload.details.price).toBe("$25")
  })

  it("stores empty cleared ticket fields as null", async () => {
    const payload = await buildPerformancePayload(
      {
        type: "PIECE",
        parentEventMode: "SELECT",
        parentEventId: PARENT_LISTING_ID,
        link: "",
        price: "",
        piece_company: "Dance Co",
        piece_title: "New Work",
        piece_description: "A short piece.",
        pieceScheduleMode: "FROM_PARENT",
        selectedSlots: ["2026-09-15|19:30"],
        contactName: "Test User",
        contactEmail: "test@example.com",
      } as unknown as EventFormData,
      userInfo,
      "America/New_York",
    )

    expect(payload.details.link).toBeNull()
    expect(payload.details.price).toBeNull()
  })

  it("drops manual parent metadata when the piece is linked to an EAR parent", async () => {
    const payload = await buildPerformancePayload(
      {
        type: "PIECE",
        parentEventMode: "SELECT",
        parentEventId: PARENT_LISTING_ID,
        // Stale manual values that could linger after MANUAL -> SELECT
        parentEventName: "Independent Festival",
        parentEventWebsite: "https://festival.example.com",
        parentEventContactEmail: "hello@festival.example.com",
        piece_company: "Dance Co",
        piece_title: "New Work",
        piece_description: "A short piece.",
        pieceScheduleMode: "FROM_PARENT",
        selectedSlots: ["2026-09-15|19:30"],
        contactName: "Test User",
        contactEmail: "test@example.com",
      } as unknown as EventFormData,
      userInfo,
      "America/New_York",
    )

    const pieceDetails = payload.piece_details ?? {}
    expect(pieceDetails.parent_listing_id).toBe(PARENT_LISTING_ID)
    expect(pieceDetails.parent_event_name).toBeNull()
    expect(pieceDetails.parent_event_website).toBeNull()
    expect(pieceDetails.parent_event_contact_email).toBeNull()
  })

  it("ignores stale selectedSlots when submitting a MANUAL piece", async () => {
    const payload = await buildPerformancePayload(
      manualPieceBase({
        contactName: "Test User",
        contactEmail: "test@example.com",
        // Leftover from SELECT → MANUAL without clearing parent slots
        selectedSlots: ["2026-09-15|19:30"],
        pieceScheduleMode: "CUSTOM",
      }) as EventFormData,
      userInfo,
      "America/New_York",
    )

    const pieceDetails = payload.piece_details ?? {}
    expect(pieceDetails.selected_slots).toBeNull()
    // Only the custom extraOccurrence should be persisted — not the stale parent slot.
    expect(payload.occurrences).toHaveLength(1)
    expect(payload.occurrences[0]?.venue_name).toBe("The Kitchen")
  })

  it("copies parent slot locations from form.occurrences onto linked-piece showtimes", async () => {
    const payload = await buildPerformancePayload(
      {
        type: "PIECE",
        parentEventMode: "SELECT",
        parentEventId: PARENT_LISTING_ID,
        piece_company: "Dance Co",
        piece_title: "New Work",
        piece_description: "A short piece.",
        pieceScheduleMode: "FROM_PARENT",
        selectedSlots: ["2026-09-15|19:30", "2026-09-16|20:00"],
        // Written by PieceOccurrencesPicker after fetching the parent schedule
        occurrences: [
          {
            date: "2026-09-15",
            times: [
              {
                time: "19:30",
                venueName: "The Joyce",
                address: "175 8th Ave, New York, NY",
                placeId: "place-joyce",
                lat: 40.742,
                lng: -74.0,
              },
            ],
            venueName: "The Joyce",
            address: "175 8th Ave, New York, NY",
            placeId: "place-joyce",
            lat: 40.742,
            lng: -74.0,
          },
          {
            date: "2026-09-16",
            times: [
              {
                time: "20:00",
                venueName: "Online",
                locationInstructions: "Zoom link sent day-of",
              },
            ],
            locationMode: "ONLINE",
            venueName: "Online",
            locationInstructions: "Zoom link sent day-of",
          },
        ],
        contactName: "Test User",
        contactEmail: "test@example.com",
      } as unknown as EventFormData,
      userInfo,
      "America/New_York",
    )

    expect(payload.occurrences).toHaveLength(2)

    const joyce = payload.occurrences.find((o) => o.venue_name === "The Joyce")
    expect(joyce?.address).toBe("175 8th Ave, New York, NY")
    expect(joyce?.place_id).toBe("place-joyce")
    expect(joyce?.lat).toBe(40.742)
    expect(joyce?.lng).toBe(-74.0)

    const online = payload.occurrences.find((o) => o.venue_name === "Online")
    expect(online?.location_instructions).toBe("Zoom link sent day-of")
    expect(online?.address).toBeNull()
  })
})
