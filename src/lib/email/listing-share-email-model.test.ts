import {
  buildListingSharePieceTemplateModel,
  buildListingShareTemplateModel,
  resolveCompanyArtistName,
  resolveFestivalCompanyArtistName,
  resolvePieceEventTitle,
} from "./listing-share-email-model"

describe("resolveCompanyArtistName", () => {
  it("prefers piece company over choreographer and contact", () => {
    expect(
      resolveCompanyArtistName({
        pieceDetails: { piece_company: "ACME Dance", choreographer: "Jane Doe" },
        contactName: "Bob",
      })
    ).toBe("ACME Dance")
  })

  it("falls back to choreographer then contact name", () => {
    expect(
      resolveCompanyArtistName({
        pieceDetails: { choreographer: "Jane Doe" },
        contactName: "Bob",
      })
    ).toBe("Jane Doe")
    expect(
      resolveCompanyArtistName({
        pieceDetails: {},
        contactName: "Bob",
      })
    ).toBe("Bob")
  })
})

describe("resolvePieceEventTitle", () => {
  it("prefers manual parent event name", () => {
    expect(
      resolvePieceEventTitle({
        pieceDetails: { parent_event_name: "Spring Gala" },
        performanceDetails: { title: "Piece A" },
        parentPerformanceTitle: "Linked Parent",
      })
    ).toBe("Spring Gala")
  })

  it("uses linked parent title when manual name is absent", () => {
    expect(
      resolvePieceEventTitle({
        pieceDetails: { parent_listing_id: "parent-1" },
        performanceDetails: null,
        parentPerformanceTitle: "Festival Night",
      })
    ).toBe("Festival Night")
  })

  it("falls back to performance title then generic label", () => {
    expect(
      resolvePieceEventTitle({
        pieceDetails: {},
        performanceDetails: { title: "Solo Night" },
      })
    ).toBe("Solo Night")
    expect(
      resolvePieceEventTitle({
        pieceDetails: {},
        performanceDetails: {},
      })
    ).toBe("this performance")
  })
})

describe("resolveFestivalCompanyArtistName", () => {
  it("prefers organizer over company and contact", () => {
    expect(
      resolveFestivalCompanyArtistName({
        organizerName: "Festival Co",
        company: "EAR",
        contactName: "Jane",
      })
    ).toBe("Festival Co")
  })

  it("falls back to company then contact name", () => {
    expect(
      resolveFestivalCompanyArtistName({
        company: "EAR",
        contactName: "Jane",
      })
    ).toBe("EAR")
    expect(
      resolveFestivalCompanyArtistName({
        contactName: "Jane",
      })
    ).toBe("Jane")
  })
})

describe("buildListingShareTemplateModel", () => {
  it("includes expected Postmark variables for festival template", () => {
    const model = buildListingShareTemplateModel({
      companyArtistName: "Festival Co",
      eventTitle: "Spring Gala",
    })
    expect(model.company_artist_name).toBe("Festival Co")
    expect(model.event_title).toBe("Spring Gala")
    expect(model.submit_listing_url).toMatch(/\/forms$/)
    expect(model).not.toHaveProperty("support_email")
  })
})

describe("buildListingSharePieceTemplateModel", () => {
  it("includes expected Postmark variables", () => {
    const model = buildListingSharePieceTemplateModel({
      companyArtistName: "ACME Dance",
      eventTitle: "Spring Gala",
    })
    expect(model.company_artist_name).toBe("ACME Dance")
    expect(model.event_title).toBe("Spring Gala")
    expect(model.submit_listing_url).toMatch(/\/forms$/)
    expect(model.support_email).toBe("info@eararts.org")
  })
})
