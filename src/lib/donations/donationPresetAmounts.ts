/** Default quick-select amounts (USD whole dollars) for /donate and /donate/[slug]. */
export const DEFAULT_DONATION_PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000] as const

export const DONATION_PRESET_MIN_DOLLARS = 1
export const DONATION_PRESET_MAX_DOLLARS = 100_000
export const DONATION_PRESET_MIN_COUNT = 1
export const DONATION_PRESET_MAX_COUNT = 6

/**
 * Validates profile `donation_preset_amounts` (integer[] from DB).
 * Returns null when missing, invalid, or empty — caller should fall back to default.
 */
export function parseDonationPresetAmounts(raw: unknown): number[] | null {
  if (raw == null) return null
  if (!Array.isArray(raw)) return null

  const parsed: number[] = []
  for (const item of raw) {
    if (typeof item !== "number" || !Number.isInteger(item)) return null
    if (item < DONATION_PRESET_MIN_DOLLARS || item > DONATION_PRESET_MAX_DOLLARS) return null
    parsed.push(item)
  }

  const unique = [...new Set(parsed)].sort((a, b) => a - b)
  if (unique.length < DONATION_PRESET_MIN_COUNT || unique.length > DONATION_PRESET_MAX_COUNT) {
    return null
  }

  return unique
}

/** Resolved preset list for donate UI; uses default when custom is null/invalid. */
export function resolveDonationPresetAmounts(custom?: number[] | null): number[] {
  if (custom == null) return [...DEFAULT_DONATION_PRESET_AMOUNTS]
  return parseDonationPresetAmounts(custom) ?? [...DEFAULT_DONATION_PRESET_AMOUNTS]
}
