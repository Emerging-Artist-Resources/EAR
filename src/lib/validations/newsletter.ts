import { z } from "zod"
import { NEWSLETTER_SOURCES } from "@/features/newsletter/constants"

export const newsletterSubscribeRequestSchema = z
  .object({
    email: z.string().email("Enter a valid email").transform((s) => s.trim()),
    subscribed_to_newsletter: z.boolean(),
    subscribed_to_calendar: z.boolean(),
    source: z.enum(NEWSLETTER_SOURCES).optional(),
    source_context: z.string().max(500).optional(),
  })
  .refine((d) => d.subscribed_to_newsletter || d.subscribed_to_calendar, {
    message: "Select at least one subscription option",
    path: ["subscribed_to_newsletter"],
  })

export type NewsletterSubscribeRequest = z.infer<typeof newsletterSubscribeRequestSchema>

export const newsletterProfileUpdateSchema = z.object({
  subscribed_to_newsletter: z.boolean(),
  subscribed_to_calendar: z.boolean(),
})

export type NewsletterProfileUpdate = z.infer<typeof newsletterProfileUpdateSchema>
