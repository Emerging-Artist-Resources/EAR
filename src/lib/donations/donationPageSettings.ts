import {
  type DonationDesignationConfigParsed,
  parseActiveDonationDesignationConfig,
} from "@/lib/donations/donationDesignationConfig"
import { resolveDonationPresetAmounts } from "@/lib/donations/donationPresetAmounts"

export interface DonationPageSettingsRow {
  donation_page_message: string | null
  donation_page_image_path?: string | null
  donation_designation_config: unknown
  donation_preset_amounts: unknown
}

export interface DonationPageSettings {
  donation_page_message: string | null
  /** Storage path in donation-page-photos; null when no hero image. */
  donation_page_image_path: string | null
  /** Resolved public URL for dashboard preview; null when no path. */
  donation_page_image_url: string | null
  /** Resolved preset list (custom or app default) — matches donate page buttons. */
  donation_preset_amounts: number[]
  donation_designation: DonationDesignationConfigParsed | null
  designation_enabled: boolean
}

/** Single mapper for owner dashboard and PATCH responses — same parsers as public donate page. */
export function mapDonationPageSettingsFromRow(
  row: DonationPageSettingsRow,
): DonationPageSettings {
  const donation_designation = parseActiveDonationDesignationConfig(row.donation_designation_config)

  return {
    donation_page_message: row.donation_page_message?.trim() || null,
    donation_page_image_path: row.donation_page_image_path ?? null,
    donation_page_image_url: null,
    donation_preset_amounts: resolveDonationPresetAmounts(
      row.donation_preset_amounts as number[] | null | undefined,
    ),
    donation_designation,
    designation_enabled: donation_designation != null,
  }
}

function designationConfigsEqual(
  a: DonationDesignationConfigParsed | null,
  b: DonationDesignationConfigParsed | null,
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  if (a.fieldLabel !== b.fieldLabel) return false
  if (a.allowNoPreference !== b.allowNoPreference) return false
  if (a.options.length !== b.options.length) return false
  return a.options.every(
    (option, index) =>
      option.id === b.options[index].id && option.label === b.options[index].label,
  )
}

/**
 * Content equality for donation page settings (ignores derived `donation_page_image_url`).
 * Used to skip admin notification when a save is a no-op.
 */
export function donationPageSettingsEqual(
  a: DonationPageSettings,
  b: DonationPageSettings,
): boolean {
  if ((a.donation_page_message ?? null) !== (b.donation_page_message ?? null)) {
    return false
  }
  if ((a.donation_page_image_path ?? null) !== (b.donation_page_image_path ?? null)) {
    return false
  }
  if (a.designation_enabled !== b.designation_enabled) {
    return false
  }
  if (a.donation_preset_amounts.length !== b.donation_preset_amounts.length) {
    return false
  }
  if (a.donation_preset_amounts.some((amount, index) => amount !== b.donation_preset_amounts[index])) {
    return false
  }
  return designationConfigsEqual(a.donation_designation, b.donation_designation)
}
