import type { DonationDesignationConfigParsed } from "@/lib/donations/donationDesignationConfig"

export type DesignationOptionFormRow = {
  /** Stable option id. Set when loading saved options or when adding a row in the form. */
  id?: string
  label: string
}

/**
 * Create a stable id for a new designation option.
 * Identity follows the option itself — never its label or form index.
 */
export function createDesignationOptionId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  // Jest / older runtimes without Web Crypto UUID support
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const nibble = (Math.random() * 16) | 0
    const value = char === "x" ? nibble : (nibble & 0x3) | 0x8
    return value.toString(16)
  })
}

/** New empty form row with a fresh id so delete→add in one session cannot recycle a removed id. */
export function createEmptyDesignationOptionFormRow(): DesignationOptionFormRow {
  return {
    id: createDesignationOptionId(),
    label: "",
  }
}

function resolveDesignationOptionId(existingId: string | undefined): string {
  const trimmed = existingId?.trim()
  return trimmed ? trimmed : createDesignationOptionId()
}

/**
 * Map form rows to a validated designation config payload.
 * Keeps existing option ids; assigns a UUID only for rows that still lack one.
 * Blank-label rows are dropped and do not consume or recycle ids.
 */
export function buildDesignationConfigFromFormRows(params: {
  fieldLabel: string
  options: DesignationOptionFormRow[]
}): DonationDesignationConfigParsed {
  const options = params.options
    .map((row) => ({
      id: row.id,
      label: row.label.trim(),
    }))
    .filter((row) => row.label.length > 0)
    .map((row) => ({
      id: resolveDesignationOptionId(row.id),
      label: row.label,
    }))

  return {
    fieldLabel: params.fieldLabel.trim(),
    allowNoPreference: false,
    options,
  }
}

/**
 * Map saved designation config into form rows, preserving option ids.
 */
export function mapDesignationToFormRows(
  config: DonationDesignationConfigParsed | null,
): {
  fieldLabel: string
  options: DesignationOptionFormRow[]
} {
  if (!config) {
    return {
      fieldLabel: "",
      options: [createEmptyDesignationOptionFormRow()],
    }
  }

  return {
    fieldLabel: config.fieldLabel,
    options: config.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  }
}
