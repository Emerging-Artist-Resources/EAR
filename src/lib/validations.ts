import { z } from "zod"

// Performance submission fields (stored in events base + details jsonb)
const urlString = z.string().url("Enter a valid URL")

export const performanceSchema = z.object({
  // Base event fields
  title: z.string().min(1, "Show name is required"),
  date: z.string().min(1, "Show date is required"), // YYYY-MM-DD
  showTime: z.string().min(1, "Show time is required"), // HH:MM

  // Details (performance-specific)
  submitterName: z.string().min(1, "Name is required"),
  submitterPronouns: z.string().min(1, "Pronouns are required"),
  contactEmail: z.string().email("Enter a valid email"),
  company: z.string().optional().or(z.literal("")),
  companyWebsite: urlString.optional().or(z.literal("")),
  ticketPrice: z.string().min(1, "Ticket price is required"),
  ticketLink: urlString.min(1, "Ticket link is required"),
  shortDescription: z
    .string()
    .min(1, "Short description is required")
    .refine((v) => v.trim().split(/\s+/).filter(Boolean).length <= 100, {
      message: "Max 100 words",
    }),
  credits: z.string().min(1, "Credit information is required"),
  socialHandles: z.string().min(1, "Social handles are required"),
  notes: z.string().optional().or(z.literal("")),
  referralSources: z
    .array(z.enum(["INSTAGRAM", "WORD_OF_MOUTH", "GOOGLE", "OTHER"]))
    .default([]),
  referralOther: z.string().optional().or(z.literal("")),
  joinEmailList: z.boolean().default(false),
  agreeCompTickets: z.boolean(),
  photoUrls: z.array(urlString).min(1, "At least 1 photo URL").max(5, "Max 5 photos"),
})

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "ERROR"]).default("INFO"),
  isActive: z.boolean().default(true),
})

export type PerformanceFormData = z.infer<typeof performanceSchema>
export type NotificationFormData = z.infer<typeof notificationSchema>
