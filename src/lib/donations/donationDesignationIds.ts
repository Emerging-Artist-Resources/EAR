import type { DonationDesignationConfigParsed } from "@/lib/donations/donationDesignationConfig"

export type DesignationOptionFormRow = {
  label: string
}

/** Stable 1-based id for designation options (option-1, option-2, …). */
export function designationOptionId(index: number): string {
  return `option-${index + 1}`
}

/**
 * Map form rows to a validated designation config payload.
 * Ids are assigned by row order among non-empty labels.
 */
export function buildDesignationConfigFromFormRows(params: {
  fieldLabel: string
  options: DesignationOptionFormRow[]
}): DonationDesignationConfigParsed {
  const options = params.options
    .map((row) => row.label.trim())
    .filter((label) => label.length > 0)
    .map((label, index) => ({
      id: designationOptionId(index),
      label,
    }))

  return {
    fieldLabel: params.fieldLabel.trim(),
    allowNoPreference: false,
    options,
  }
}

export function mapDesignationToFormRows(
  config: DonationDesignationConfigParsed | null,
): {
  fieldLabel: string
  options: DesignationOptionFormRow[]
} {
  if (!config) {
    return {
      fieldLabel: "",
      options: [{ label: "" }],
    }
  }

  return {
    fieldLabel: config.fieldLabel,
    options: config.options.map((option) => ({
      label: option.label,
    })),
  }
}
