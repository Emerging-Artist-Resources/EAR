import { z } from "zod"

/** Shared rule: form and POST /api/donations must validate identically. */
export const donorEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address")

export const donationFormSchema = z.object({
  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(100, "Minimum donation is $1.00")
    .max(10000000, "Maximum donation is $100,000.00"),
  donor_name: z.string().max(255, "Name must be less than 255 characters").optional(),
  donor_email: donorEmailSchema,
  message: z.string().max(2000, "Message must be less than 2000 characters").optional(),
  cover_card_fee: z.boolean().optional().default(false),
  cover_fiscal_fee: z.boolean().optional().default(false),
})

export type DonationFormData = z.infer<typeof donationFormSchema>

export const createDonationRequestSchema = z.object({
  amount: z.number().int().min(100).max(10000000),
  donor_name: z.string().max(255).optional().nullable(),
  donor_email: donorEmailSchema,
  message: z.string().max(2000).optional().nullable(),
  recipient_user_id: z.string().uuid().optional().nullable(),
  recipient_slug: z.string().min(1).max(80).optional().nullable(),
  recipient_name: z.string().max(255).optional().nullable(),
  cover_card_fee: z.boolean().optional().default(false),
  cover_fiscal_fee: z.boolean().optional().default(false),
})

export type CreateDonationRequest = z.infer<typeof createDonationRequestSchema>

export const createDonationSessionRequestSchema = z.object({
  donationId: z.string().uuid("Invalid donation ID"),
})

export type CreateDonationSessionRequest = z.infer<typeof createDonationSessionRequestSchema>
