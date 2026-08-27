import {
  donationPageSettingsEqual,
  mapDonationPageSettingsFromRow,
  type DonationPageSettings,
} from "@/lib/donations/donationPageSettings"

function baseSettings(overrides: Partial<DonationPageSettings> = {}): DonationPageSettings {
  return {
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

  it("detects message, image, and preset changes", () => {
    const before = baseSettings({ donation_page_message: "A" })
    expect(
      donationPageSettingsEqual(
        before,
        baseSettings({ donation_page_message: "B" }),
      ),
    ).toBe(false)
    expect(
      donationPageSettingsEqual(
        before,
        baseSettings({
          donation_page_message: "A",
          donation_page_image_path: "u/new.jpg",
        }),
      ),
    ).toBe(false)
    expect(
      donationPageSettingsEqual(
        before,
        baseSettings({
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
    const a = mapDonationPageSettingsFromRow({
      donation_page_message: "  ",
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })
    const b = mapDonationPageSettingsFromRow({
      donation_page_message: null,
      donation_page_image_path: null,
      donation_designation_config: null,
      donation_preset_amounts: [25],
    })
    expect(donationPageSettingsEqual(a, b)).toBe(true)
  })
})
