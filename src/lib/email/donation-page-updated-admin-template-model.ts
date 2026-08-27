import { getPublicAppUrl } from "@/lib/config/app-url"
import type { DonationPageSettings } from "@/lib/donations/donationPageSettings"

export type DonationPageUpdatedAdminModelInput = {
  userName: string | null | undefined
  userEmail: string | null | undefined
  profileType: string | null | undefined
  organizationName: string | null | undefined
  slug: string
  donationPage: DonationPageSettings
  /** Override for tests; defaults to `getPublicAppUrl()`. */
  baseUrl?: string
}

/**
 * Build Postmark TemplateModel for `donation-page-updated-admin`.
 * All values are strings (Postmark convention in this repo).
 */
export function buildDonationPageUpdatedAdminTemplateModel(
  input: DonationPageUpdatedAdminModelInput,
): Record<string, string> {
  const baseUrl = (input.baseUrl ?? getPublicAppUrl()).replace(/\/$/, "")
  const slug = input.slug.trim()
  const designation = input.donationPage.donation_designation
  const designationEnabled = input.donationPage.designation_enabled && designation != null

  return {
    user_name: input.userName?.trim() || "Unknown User",
    user_email: input.userEmail?.trim() || "No email provided",
    profile_type: input.profileType?.trim() || "unknown",
    organization_name: input.organizationName?.trim() || "N/A",
    slug,
    donation_page_url: `${baseUrl}/donate/${encodeURIComponent(slug)}`,
    has_image: input.donationPage.donation_page_image_path ? "yes" : "no",
    donation_page_message: input.donationPage.donation_page_message?.trim() || "",
    preset_amounts: input.donationPage.donation_preset_amounts.join(", "),
    designation_enabled: designationEnabled ? "yes" : "no",
    designation_field_label: designationEnabled ? designation.fieldLabel.trim() : "N/A",
    designation_options: designationEnabled
      ? designation.options.map((option) => option.label.trim()).filter(Boolean).join(", ")
      : "N/A",
  }
}
