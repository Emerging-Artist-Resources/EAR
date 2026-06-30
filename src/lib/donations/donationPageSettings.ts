import {
  type DonationDesignationConfigParsed,
  parseActiveDonationDesignationConfig,
} from "@/lib/donations/donationDesignationConfig"
import { resolveDonationPresetAmounts } from "@/lib/donations/donationPresetAmounts"

export interface DonationPageSettingsRow {
  donation_page_message: string | null
  donation_designation_config: unknown
  donation_preset_amounts: unknown
}

export interface DonationPageSettings {
  donation_page_message: string | null
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
    donation_preset_amounts: resolveDonationPresetAmounts(
      row.donation_preset_amounts as number[] | null | undefined,
    ),
    donation_designation,
    designation_enabled: donation_designation != null,
  }
}
