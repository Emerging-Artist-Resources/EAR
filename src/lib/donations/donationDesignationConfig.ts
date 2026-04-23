import { z } from "zod"

/** Postmark / API user-facing copy when submitted id no longer in server config. */
export const DESIGNATION_STALE_OPTION_MESSAGE =
  "That option is no longer available. Please refresh the page and try again."

const designationOptionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(500),
})

export const donationDesignationConfigSchema = z
  .object({
    fieldLabel: z.string().trim().min(1).max(200),
    allowNoPreference: z.boolean(),
    options: z.array(designationOptionSchema).min(1),
  })
  .refine(
    (d) => !d.allowNoPreference || d.options.some((o) => o.id === "split"),
    { message: "allowNoPreference requires an option with id \"split\"" },
  )

export type DonationDesignationConfigParsed = z.infer<typeof donationDesignationConfigSchema>

/**
 * Parses and returns active config for public donate UI and API validation.
 * Returns null when missing, invalid, or not usable (empty options, missing split when required).
 */
export function parseActiveDonationDesignationConfig(
  raw: unknown | null | undefined,
): DonationDesignationConfigParsed | null {
  if (raw == null) return null
  const parsed = donationDesignationConfigSchema.safeParse(raw)
  if (!parsed.success) return null
  return parsed.data
}
