import { z } from "zod"

export const performanceSchema = z.object({
  submitterName: z.string().min(1, "Your name is required"),
  submitterPronouns: z.string().min(1, "Pronouns are required"),
  contactEmail: z.string().email("Invalid email address"),
  company: z.string().optional(),
  companyWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  title: z.string().min(1, "Show name is required").max(200, "Show name must be less than 200 characters"),
  date: z.string().min(1, "Show date is required"),
  showTime: z.string().min(1, "Show time is required"),
  ticketPrice: z.string().min(1, "Ticket price is required"),
  ticketLink: z.string().url("Invalid URL").min(1, "Ticket link is required"),
  shortDescription: z.string().min(1, "Short description is required").max(1000, "Description must be 1000 characters or less"),
  photoUrls: z.array(z.string().url("Invalid URL")).min(1, "At least one photo URL is required").max(5, "Maximum 5 photo URLs"),
  credits: z.string().min(1, "Credit information is required"),
  socialHandles: z.string().min(1, "Social media handles are required"),
  notes: z.string().optional(),
  referralSources: z.array(z.enum(["INSTAGRAM", "WORD_OF_MOUTH", "GOOGLE", "OTHER"])).optional(),
  referralOther: z.string().optional(),
  joinEmailList: z.boolean().optional(),
  agreeCompTickets: z.boolean().refine(val => val === true, {
    message: "You must agree to provide complimentary tickets",
  }),
})

export type PerformanceFormData = z.infer<typeof performanceSchema>


