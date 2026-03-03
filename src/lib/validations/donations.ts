import { z } from "zod"

export const donationFormSchema = z.object({
  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(100, "Minimum donation is $1.00")
    .max(10000000, "Maximum donation is $100,000.00"),
  donor_name: z.string().max(255, "Name must be less than 255 characters").optional(),
  donor_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  message: z.string().max(2000, "Message must be less than 2000 characters").optional(),
})

export type DonationFormData = z.infer<typeof donationFormSchema>

export const createDonationRequestSchema = z.object({
  amount: z.number().int().min(100).max(10000000),
  donor_name: z.string().max(255).optional().nullable(),
  donor_email: z.string().email().optional().nullable().or(z.literal("")),
  message: z.string().max(2000).optional().nullable(),
})

export type CreateDonationRequest = z.infer<typeof createDonationRequestSchema>

export const createDonationSessionRequestSchema = z.object({
  donationId: z.string().uuid("Invalid donation ID"),
})

export type CreateDonationSessionRequest = z.infer<typeof createDonationSessionRequestSchema>
