import { z } from "zod"

/** Shared rule: form and POST /api/donations must validate identically. */
export const donorEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address")

const donorNameRequiredField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(255, "Name must be less than 255 characters")

export const donationFormSchema = z.object({
  /** Base gift in cents (maps to DB `base_gift_cents`; not the Stripe gross charge). */
  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(100, "Minimum donation is $1.00")
    .max(10000000, "Maximum donation is $100,000.00"),
  donor_name: donorNameRequiredField,
  donor_email: donorEmailSchema,
  message: z.string().max(2000, "Message must be less than 2000 characters").optional(),
  cover_card_fee: z.boolean().optional().default(false),
  cover_fiscal_fee: z.boolean().optional().default(false),
  /** Set when artist has designation config; omitted or unused for generic donate. */
  designation_option_id: z.string().max(120).optional(),
})

/** Same as {@link donationFormSchema}; kept as named schema for artist-specific flow wiring. */
export const donationArtistFormSchema = donationFormSchema.extend({
  donor_name: donorNameRequiredField,
})

/** Artist page when `donation_designation` config is active — designation required. */
export const donationArtistWithDesignationFormSchema = donationArtistFormSchema.extend({
  designation_option_id: z.string().trim().min(1, "Please choose a designation"),
})

export type DonationFormData = z.infer<typeof donationFormSchema>

export const createDonationRequestSchema = z
  .object({
    /** Base gift in cents (stored as `base_gift_cents`). */
    amount: z.number().int().min(100).max(10000000),
    donor_name: z.string().trim().max(255).optional().nullable(),
    donor_email: donorEmailSchema,
    message: z.string().max(2000).optional().nullable(),
    recipient_user_id: z.string().uuid().optional().nullable(),
    recipient_slug: z.string().min(1).max(80).optional().nullable(),
    recipient_name: z.string().max(255).optional().nullable(),
    /** Stable id from profile designation config (e.g. `split`, charity id); server validates against DB. */
    designation_option_id: z.string().max(120).optional().nullable(),
    cover_card_fee: z.boolean().optional().default(false),
    cover_fiscal_fee: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (!(data.donor_name?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required",
        path: ["donor_name"],
      })
    }
  })

export type CreateDonationRequest = z.infer<typeof createDonationRequestSchema>

export const createDonationSessionRequestSchema = z.object({
  donationId: z.string().uuid("Invalid donation ID"),
})

export type CreateDonationSessionRequest = z.infer<typeof createDonationSessionRequestSchema>
