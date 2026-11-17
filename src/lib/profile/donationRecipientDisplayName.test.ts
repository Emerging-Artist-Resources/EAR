import { resolveDonationRecipientDisplayName } from "./donationRecipientDisplayName"

describe("resolveDonationRecipientDisplayName", () => {
  it("prefers a stored donation page title over organization and name", () => {
    expect(
      resolveDonationRecipientDisplayName({
        name: "Ada Lovelace",
        organization_name: "Analytical Engines",
        profile_type: "company",
        donation_page_title: "  The Engine Fund  ",
      }),
    ).toBe("The Engine Fund")
  })

  it("falls through when the stored title is blank", () => {
    expect(
      resolveDonationRecipientDisplayName({
        name: "Ada Lovelace",
        organization_name: "Analytical Engines",
        profile_type: "company",
        donation_page_title: "   ",
      }),
    ).toBe("Analytical Engines")

    expect(
      resolveDonationRecipientDisplayName({
        name: "Ada Lovelace",
        organization_name: null,
        profile_type: "individual",
        donation_page_title: null,
      }),
    ).toBe("Ada Lovelace")
  })

  it("uses organization name for company and festival profiles when set", () => {
    expect(
      resolveDonationRecipientDisplayName({
        name: "Ada Lovelace",
        organization_name: "  Analytical Engines  ",
        profile_type: "company",
      }),
    ).toBe("Analytical Engines")

    expect(
      resolveDonationRecipientDisplayName({
        name: "Ada Lovelace",
        organization_name: "Festival Co",
        profile_type: "festival",
      }),
    ).toBe("Festival Co")
  })

  it("uses the profile name when a company or festival has no organization name", () => {
    expect(
      resolveDonationRecipientDisplayName({
        name: "  Ada Lovelace  ",
        organization_name: "   ",
        profile_type: "company",
      }),
    ).toBe("Ada Lovelace")
  })

  it("uses the profile name for other profile types", () => {
    expect(
      resolveDonationRecipientDisplayName({
        name: "Ada Lovelace",
        organization_name: "Analytical Engines",
        profile_type: "individual",
      }),
    ).toBe("Ada Lovelace")
  })

  it("returns null when no usable name remains", () => {
    expect(
      resolveDonationRecipientDisplayName({
        name: "  ",
        organization_name: null,
        profile_type: "individual",
      }),
    ).toBeNull()
  })
})
