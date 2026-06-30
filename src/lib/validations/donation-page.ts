import { z } from "zod"
import {
  donationDesignationConfigSchema,
  type DonationDesignationConfigParsed,
} from "@/lib/donations/donationDesignationConfig"
import {
  DONATION_PRESET_MAX_COUNT,
  DONATION_PRESET_MAX_DOLLARS,
  DONATION_PRESET_MIN_COUNT,
  DONATION_PRESET_MIN_DOLLARS,
  isBlankPresetAmountString,
  normalizePresetAmountStrings,
  parseDonationPresetAmounts,
  parsePresetAmountString,
  presetAmountMinErrorMessage,
  presetAmountsRangeErrorMessage,
} from "@/lib/donations/donationPresetAmounts"

/** Shared rule: customize form and PATCH must validate identically. */
export const updateDonationPageSchema = z
  .object({
    donation_page_message: z
      .string()
      .max(2000, `Message must be at most 2000 characters`)
      .nullable()
      .optional()
      .transform((value) => {
        if (value == null) return null
        const trimmed = value.trim()
        return trimmed === "" ? null : trimmed
      }),
    donation_preset_amounts: z
      .array(z.number().int())
      .superRefine((amounts, ctx) => {
        const parsed = parseDonationPresetAmounts(amounts)
        if (!parsed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: presetAmountsRangeErrorMessage(),
          })
        }
      }),
    designation_enabled: z.boolean(),
    donation_designation_config: donationDesignationConfigSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.designation_enabled) {
      if (!data.donation_designation_config) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Designation configuration is required when the dropdown is enabled",
          path: ["donation_designation_config"],
        })
      }
    }
  })

export type UpdateDonationPageData = z.infer<typeof updateDonationPageSchema>

const designationOptionFormRowSchema = z.object({
  label: z.string(),
})

/** Client form schema — validates UI fields then maps to `updateDonationPageSchema` on submit. */
export const customizeDonationPageFormSchema = z
  .object({
    donation_page_message: z.string().max(2000, "Message must be at most 2000 characters"),
    donation_preset_amounts: z
      .array(z.string())
      .max(DONATION_PRESET_MAX_COUNT, `Add at most ${DONATION_PRESET_MAX_COUNT} preset amounts`)
      .superRefine((values, ctx) => {
        values.forEach((value, index) => {
          if (isBlankPresetAmountString(value)) return

          const amount = parsePresetAmountString(value)
          if (amount == null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: presetAmountMinErrorMessage(),
              path: [index],
            })
            return
          }

          if (amount < DONATION_PRESET_MIN_DOLLARS) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: presetAmountMinErrorMessage(),
              path: [index],
            })
          }

          if (amount > DONATION_PRESET_MAX_DOLLARS) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: presetAmountsRangeErrorMessage(),
              path: [index],
            })
          }
        })

        const nonEmptyValues = normalizePresetAmountStrings(values)
        const amounts = nonEmptyValues.map((value) => Number(value))
        const parsed = parseDonationPresetAmounts(amounts)

        if (!parsed) {
          if (nonEmptyValues.length < DONATION_PRESET_MIN_COUNT) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Add at least ${DONATION_PRESET_MIN_COUNT} preset amount`,
              path: [],
            })
            return
          }

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: presetAmountsRangeErrorMessage(),
            path: [],
          })
        }
      }),
    designation_enabled: z.boolean(),
    designation_field_label: z.string(),
    designation_options: z.array(designationOptionFormRowSchema),
  })
  .superRefine((data, ctx) => {
    if (!data.designation_enabled) return

    if (!data.designation_field_label.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field label is required",
        path: ["designation_field_label"],
      })
    }

    const nonEmptyOptions = data.designation_options.filter((option) => option.label.trim())
    if (nonEmptyOptions.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one designation option",
        path: ["designation_options"],
      })
    }
  })

export type CustomizeDonationPageFormData = z.infer<typeof customizeDonationPageFormSchema>

export function sanitizeCustomizeDonationPageFormData(
  data: CustomizeDonationPageFormData,
): CustomizeDonationPageFormData {
  return {
    ...data,
    donation_preset_amounts: normalizePresetAmountStrings(data.donation_preset_amounts),
  }
}

export function mapCustomizeFormToUpdatePayload(
  data: CustomizeDonationPageFormData,
  buildDesignationConfig: (params: {
    fieldLabel: string
    options: { label: string }[]
  }) => DonationDesignationConfigParsed,
): UpdateDonationPageData {
  const sanitized = sanitizeCustomizeDonationPageFormData(data)
  const amounts = parseDonationPresetAmounts(
    sanitized.donation_preset_amounts.map((value) => Number(value)),
  )
  if (!amounts) {
    throw new Error("Invalid donation preset amounts")
  }

  const donation_designation_config = sanitized.designation_enabled
    ? buildDesignationConfig({
        fieldLabel: sanitized.designation_field_label,
        options: sanitized.designation_options,
      })
    : null

  return updateDonationPageSchema.parse({
    donation_page_message: sanitized.donation_page_message,
    donation_preset_amounts: amounts,
    designation_enabled: sanitized.designation_enabled,
    donation_designation_config,
  })
}

/** Normalize PATCH payload for DB persistence. */
export function toDonationPagePersistPayload(data: UpdateDonationPageData): {
  donation_page_message: string | null
  donation_preset_amounts: number[]
  donation_designation_config: unknown | null
} {
  const validatedPresets = parseDonationPresetAmounts(data.donation_preset_amounts)
  if (!validatedPresets) {
    throw new Error("Invalid donation preset amounts")
  }

  return {
    donation_page_message: data.donation_page_message ?? null,
    donation_preset_amounts: validatedPresets,
    donation_designation_config: data.designation_enabled
      ? data.donation_designation_config ?? null
      : null,
  }
}
