import { z } from "zod"

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(320)

export const createServiceInquiryRequestSchema = z.object({
  service_slug: z
    .string()
    .trim()
    .min(1, "Service is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid service slug"),
  name: z.string().trim().min(1, "Name is required").max(255),
  email: emailSchema,
  answers: z.array(
    z.object({
      question_id: z.string().uuid(),
      answer_text: z.string().max(20000),
    }),
  ),
})

export type CreateServiceInquiryRequest = z.infer<typeof createServiceInquiryRequestSchema>
