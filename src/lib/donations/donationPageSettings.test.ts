import {
  donationPageSettingsEqual,
  mapDonationPageSettingsFromRow,
  type DonationPageSettings,
} from "@/lib/donations/donationPageSettings"
import { DONATION_PAGE_TITLE_MAX_CHARS, updateDonationPageSchema } from "@/lib/validations/donation-page"

function baseSettings(overrides: Partial<DonationPageSettings> = {}): DonationPageSettings {
  return {
    donation_page_title: null,
    donation_page_message: null,
    donation_page_image_path: null,
    donation_page_image_url: null,
    donation_preset_amounts: [25, 50, 100],
    donation_designation: null,
    designation_enabled: false,
    ...overrides,
  }
}

describe("donationPageSettingsEqual", () => {
  it("treats identical content as equal even when image URLs differ", () => {
    const a = baseSettings({
      donation_page_message: "Hello",
      donation_page_image_path: "u/hero.jpg",
      donation_page_image_url: "https://cdn.example/a",
    })
    const b = baseSettings({
      donation_page_message: "Hello",
      donation_page_image_path: "u/hero.jpg",
      donation_page_image_url: "https://cdn.example/b",
    })
    expect(donationPageSettingsEqual(a, b)).toBe(true)
  })

  it("detects title, message, image, and preset changes", () => {
    const before = baseSettings({ donation_page_title: "Ada", donation_page_message: "A" })
    expect(
      donationPageSettingsEqual(
        before,
        baseSettings({ donation_page_title: "The Engine Fund", donation_page_message: "A" }),
      ),
    ).toBe(false)
    expect(
      donationPageSettingsEqual(
        before,
        baseSettings({ donation_page_title: "Ada", donation_page_message: "B" }),
      ),
    ).toBe(false)
    expect(
      donationPageSettingsEqual(
        before,
        baseSettings({
          donation_page_title: "Ada",
          donation_page_message: "A",
          donation_page_image_path: "u/new.jpg",
        }),
      ),
    ).toBe(false)
    expect(
      donationPageSettingsEqual(
        before,
        baseSettings({
          donation_page_title: "Ada",
          donation_page_message: "A",
          donation_preset_amounts: [10, 20],
        }),
      ),
    ).toBe(false)
  })

  it("detects designation enable/disable and option edits", () => {
    const withDesignation = baseSettings({
      designation_enabled: true,
      donation_designation: {
        fieldLabel: "Apply to",
        allowNoPreference: false,
        options: [
          { id: "1", label: "General" },
          { id: "2", label: "Tour" },
        ],
      },
    })

    expect(donationPageSettingsEqual(withDesignation, baseSettings())).toBe(false)
    expect(
      donationPageSettingsEqual(
        withDesignation,
        baseSettings({
          designation_enabled: true,
          donation_designation: {
            fieldLabel: "Apply to",
            allowNoPreference: false,
            options: [
              { id: "1", label: "General" },
              { id: "2", label: "Tour fund" },
            ],
          },
        }),
      ),
    ).toBe(false)
    expect(
      donationPageSettingsEqual(
        withDesignation,
        baseSettings({
          designation_enabled: true,
          donation_designation: {
            fieldLabel: "Apply to",
            allowNoPreference: false,
            options: [
              { id: "2", label: "Tour" },
              { id: "1", label: "General" },
            ],
          },
        }),
      ),
    ).toBe(false)
  })

  it("maps trimmed blank messages the same via mapDonationPageSettingsFromRow", () => {
    const identity = {
      donation_page_title: null,
      name: "Ada",
      organization_name: null,
      profile_type: "individual",
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    }
    const a = mapDonationPageSettingsFromRow({
      ...identity,
      donation_page_message: "  ",
    })
    const b = mapDonationPageSettingsFromRow({
      ...identity,
      donation_page_message: null,
    })
    expect(donationPageSettingsEqual(a, b)).toBe(true)
  })

  it("prefills a null title from the organization-then-name rule", () => {
    const company = mapDonationPageSettingsFromRow({
      donation_page_title: null,
      name: "Ada",
      organization_name: "Analytical Engines",
      profile_type: "company",
      donation_page_message: null,
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })
    const storedFallback = mapDonationPageSettingsFromRow({
      donation_page_title: "Analytical Engines",
      name: "Ada",
      organization_name: "Analytical Engines",
      profile_type: "company",
      donation_page_message: null,
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })
    const individual = mapDonationPageSettingsFromRow({
      donation_page_title: "   ",
      name: "Ada Lovelace",
      organization_name: "Ignored Org",
      profile_type: "individual",
      donation_page_message: null,
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })

    expect(company.donation_page_title).toBe("Analytical Engines")
    expect(donationPageSettingsEqual(company, storedFallback)).toBe(true)
    expect(individual.donation_page_title).toBe("Ada Lovelace")
  })

  it("prefers a stored title over the organization-then-name fallback", () => {
    const settings = mapDonationPageSettingsFromRow({
      donation_page_title: "  The Engine Fund  ",
      name: "Ada",
      organization_name: "Analytical Engines",
      profile_type: "company",
      donation_page_message: null,
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })

    expect(settings.donation_page_title).toBe("The Engine Fund")
  })

  it("caps a long fallback title so the prefilled value passes form validation", () => {
    const longName = "A".repeat(DONATION_PAGE_TITLE_MAX_CHARS + 40)
    const settings = mapDonationPageSettingsFromRow({
      donation_page_title: null,
      name: "Ada",
      organization_name: longName,
      profile_type: "company",
      donation_page_message: null,
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })

    expect(settings.donation_page_title).toHaveLength(DONATION_PAGE_TITLE_MAX_CHARS)
    expect(settings.donation_page_title).toBe(longName.slice(0, DONATION_PAGE_TITLE_MAX_CHARS))
    expect(
      updateDonationPageSchema.safeParse({
        donation_page_title: settings.donation_page_title,
        donation_page_message: null,
        donation_preset_amounts: [25],
        designation_enabled: false,
      }).success,
    ).toBe(true)
  })

  it("leaves a stored title within the limit unchanged", () => {
    const title = "B".repeat(DONATION_PAGE_TITLE_MAX_CHARS)
    const settings = mapDonationPageSettingsFromRow({
      donation_page_title: title,
      name: "A".repeat(DONATION_PAGE_TITLE_MAX_CHARS + 10),
      organization_name: null,
      profile_type: "individual",
      donation_page_message: null,
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })

    expect(settings.donation_page_title).toBe(title)
  })
})
