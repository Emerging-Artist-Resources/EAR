import { z } from "zod"

export const reviewSchema = z.object({
  eventId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>


