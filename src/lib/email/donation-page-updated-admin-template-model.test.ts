import { buildDonationPageUpdatedAdminTemplateModel } from "@/lib/email/donation-page-updated-admin-template-model"
import type { DonationPageSettings } from "@/lib/donations/donationPageSettings"

function settings(overrides: Partial<DonationPageSettings> = {}): DonationPageSettings {
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

describe("buildDonationPageUpdatedAdminTemplateModel", () => {
  it("builds identity fields, encoded donation URL, and empty designation snapshot", () => {
    const model = buildDonationPageUpdatedAdminTemplateModel({
      userName: "  Ada Lovelace  ",
      userEmail: " ada@example.com ",
      profileType: "individual",
      organizationName: null,
      slug: "ada-lovelace",
      donationPage: settings({
        donation_preset_amounts: [10, 25],
      }),
      baseUrl: "https://ear.example/",
    })

    expect(model).toEqual({
      user_name: "Ada Lovelace",
      user_email: "ada@example.com",
      profile_type: "individual",
      organization_name: "",
      slug: "ada-lovelace",
      donation_page_url: "https://ear.example/donate/ada-lovelace",
      has_image: "no",
      donation_page_message: "",
      preset_amounts: "10, 25",
      designation_enabled: "no",
      designation_field_label: "",
      designation_options: "",
    })
  })

  it("encodes slug in donation_page_url", () => {
    const model = buildDonationPageUpdatedAdminTemplateModel({
      userName: "Test",
      userEmail: "t@example.com",
      profileType: "company",
      organizationName: "EAR Co",
      slug: "acme & co",
      donationPage: settings(),
      baseUrl: "https://ear.example",
    })

    expect(model.donation_page_url).toBe(
      "https://ear.example/donate/acme%20%26%20co",
    )
    expect(model.organization_name).toBe("EAR Co")
    expect(model.slug).toBe("acme & co")
  })

  it("includes message, image flag, and designation options when enabled", () => {
    const model = buildDonationPageUpdatedAdminTemplateModel({
      userName: null,
      userEmail: undefined,
      profileType: "  ",
      organizationName: "  Org  ",
      slug: "org-slug",
      donationPage: settings({
        donation_page_message: "  Thanks for supporting us.  ",
        donation_page_image_path: "user-id/hero-abc.jpg",
        donation_preset_amounts: [5, 15, 40],
        designation_enabled: true,
        donation_designation: {
          fieldLabel: "  Apply gift to  ",
          allowNoPreference: false,
          options: [
            { id: "1", label: " General  " },
            { id: "2", label: "Tour" },
            { id: "3", label: "  " },
          ],
        },
      }),
      baseUrl: "https://ear.example",
    })

    expect(model.user_name).toBe("Unknown User")
    expect(model.user_email).toBe("No email provided")
    expect(model.profile_type).toBe("unknown")
    expect(model.organization_name).toBe("Org")
    expect(model.has_image).toBe("yes")
    expect(model.donation_page_message).toBe("Thanks for supporting us.")
    expect(model.preset_amounts).toBe("5, 15, 40")
    expect(model.designation_enabled).toBe("yes")
    expect(model.designation_field_label).toBe("Apply gift to")
    expect(model.designation_options).toBe("General, Tour")
  })

  it("treats designation_enabled false as empty designation fields even if config present", () => {
    const model = buildDonationPageUpdatedAdminTemplateModel({
      userName: "X",
      userEmail: "x@example.com",
      profileType: "individual",
      organizationName: "",
      slug: "x",
      donationPage: settings({
        designation_enabled: false,
        donation_designation: {
          fieldLabel: "Should not appear",
          allowNoPreference: false,
          options: [{ id: "1", label: "Hidden" }],
        },
      }),
      baseUrl: "https://ear.example",
    })

    expect(model.designation_enabled).toBe("no")
    expect(model.designation_field_label).toBe("")
    expect(model.designation_options).toBe("")
  })
})
