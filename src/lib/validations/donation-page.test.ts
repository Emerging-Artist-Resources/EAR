import {
  customizeDonationPageFormSchema,
  mapCustomizeFormToUpdatePayload,
  sanitizeCustomizeDonationPageFormData,
  toDonationPagePersistPayload,
  updateDonationPageSchema,
} from "./donation-page"
import { buildDesignationConfigFromFormRows } from "@/lib/donations/donationDesignationIds"

describe("updateDonationPageSchema", () => {
  it("accepts valid message, presets, and designation", () => {
    const result = updateDonationPageSchema.safeParse({
      donation_page_message: "  Thank you!  ",
      donation_preset_amounts: [25, 50, 100],
      designation_enabled: true,
      donation_designation_config: {
        fieldLabel: "Designate to",
        allowNoPreference: false,
        options: [
          { id: "general", label: "General support" },
          { id: "no-preference", label: "No preference" },
        ],
      },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.donation_page_message).toBe("Thank you!")
    }
  })

  it("rejects invalid preset amounts", () => {
    const result = updateDonationPageSchema.safeParse({
      donation_page_message: null,
      donation_preset_amounts: [0, 25],
      designation_enabled: false,
    })

    expect(result.success).toBe(false)
  })

  it("requires designation config when enabled", () => {
    const result = updateDonationPageSchema.safeParse({
      donation_page_message: null,
      donation_preset_amounts: [25, 50],
      designation_enabled: true,
      donation_designation_config: null,
    })

    expect(result.success).toBe(false)
  })

  it("accepts clearing the hero image path", () => {
    const result = updateDonationPageSchema.safeParse({
      donation_page_message: null,
      donation_preset_amounts: [25, 50],
      designation_enabled: false,
      donation_page_image_path: null,
    })

    expect(result.success).toBe(true)
  })

  it("accepts the canonical hero image path", () => {
    const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    const result = updateDonationPageSchema.safeParse({
      donation_page_message: null,
      donation_preset_amounts: [25, 50],
      designation_enabled: false,
      donation_page_image_path: `profiles/${userId}/donation-hero.jpg`,
    })

    expect(result.success).toBe(true)
  })
})

describe("toDonationPagePersistPayload", () => {
  it("clears designation when disabled", () => {
    const payload = toDonationPagePersistPayload(
      updateDonationPageSchema.parse({
        donation_page_message: "Hi",
        donation_preset_amounts: [10, 20],
        designation_enabled: false,
        donation_designation_config: {
          fieldLabel: "Ignored",
          allowNoPreference: false,
          options: [{ id: "general", label: "General" }],
        },
      }),
    )

    expect(payload.donation_designation_config).toBeNull()
    expect(payload.donation_preset_amounts).toEqual([10, 20])
  })

  it("includes image path when provided and omits it when absent", () => {
    const withImage = toDonationPagePersistPayload(
      updateDonationPageSchema.parse({
        donation_page_message: null,
        donation_preset_amounts: [10, 20],
        designation_enabled: false,
        donation_page_image_path: "profiles/user/donation-hero.jpg",
      }),
    )
    expect(withImage.donation_page_image_path).toBe("profiles/user/donation-hero.jpg")

    const withoutImage = toDonationPagePersistPayload(
      updateDonationPageSchema.parse({
        donation_page_message: null,
        donation_preset_amounts: [10, 20],
        designation_enabled: false,
      }),
    )
    expect(withoutImage.donation_page_image_path).toBeUndefined()
  })
})

describe("customizeDonationPageFormSchema", () => {
  it("maps form values to API payload with built designation config", () => {
    const formData = customizeDonationPageFormSchema.parse({
      donation_page_message: "Support our work",
      donation_preset_amounts: ["25", "50"],
      designation_enabled: true,
      designation_field_label: "Designate to",
      designation_options: [
        { label: "General support" },
        { label: "No preference" },
      ],
    })

    const payload = mapCustomizeFormToUpdatePayload(formData, buildDesignationConfigFromFormRows)

    expect(payload.donation_preset_amounts).toEqual([25, 50])
    expect(payload.donation_designation_config?.allowNoPreference).toBe(false)
    expect(payload.donation_designation_config?.options).toEqual([
      { id: "option-1", label: "General support" },
      { id: "option-2", label: "No preference" },
    ])
  })

  it("rejects zero preset amounts with a field error", () => {
    const result = customizeDonationPageFormSchema.safeParse({
      donation_page_message: "",
      donation_preset_amounts: ["25", "0"],
      designation_enabled: false,
      designation_field_label: "",
      designation_options: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "donation_preset_amounts.1")).toBe(
        true,
      )
    }
  })

  it("ignores blank preset rows when validating and saving", () => {
    const formData = customizeDonationPageFormSchema.parse({
      donation_page_message: "",
      donation_preset_amounts: ["25", "50", "", "  "],
      designation_enabled: false,
      designation_field_label: "",
      designation_options: [],
    })

    const sanitized = sanitizeCustomizeDonationPageFormData(formData)
    expect(sanitized.donation_preset_amounts).toEqual(["25", "50"])

    const payload = mapCustomizeFormToUpdatePayload(sanitized, buildDesignationConfigFromFormRows)
    expect(payload.donation_preset_amounts).toEqual([25, 50])
  })
})
