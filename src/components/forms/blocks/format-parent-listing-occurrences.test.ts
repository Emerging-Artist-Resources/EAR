import { formatParentListingOccurrencesForForm } from "@/components/forms/blocks/format-parent-listing-occurrences"

describe("formatParentListingOccurrencesForForm", () => {
  it("groups parent showtimes by EST date and keeps per-slot location fields", () => {
    const rows = formatParentListingOccurrencesForForm([
      {
        starts_at_utc: "2026-09-15T23:30:00.000Z", // 19:30 EDT
        venue_name: "The Joyce",
        address: "175 8th Ave, New York, NY",
        place_id: "place-joyce",
        lat: 40.742,
        lng: -74.0,
      },
      {
        starts_at_utc: "2026-09-17T00:00:00.000Z", // 20:00 EDT on Sep 16
        venue_name: "Online",
        location_instructions: "Zoom link sent day-of",
      },
    ])

    expect(rows).toHaveLength(2)

    expect(rows[0]?.date).toBe("2026-09-15")
    expect(rows[0]?.times[0]?.time).toBe("19:30")
    expect(rows[0]?.venueName).toBe("The Joyce")
    expect(rows[0]?.address).toBe("175 8th Ave, New York, NY")
    expect(rows[0]?.times[0]?.placeId).toBe("place-joyce")

    expect(rows[1]?.date).toBe("2026-09-16")
    expect(rows[1]?.times[0]?.time).toBe("20:00")
    expect(rows[1]?.locationMode).toBe("ONLINE")
    expect(rows[1]?.locationInstructions).toBe("Zoom link sent day-of")
  })
})
