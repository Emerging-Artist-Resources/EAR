import { z } from "zod"

// Shared base across all forms
const baseSchema = z.object({
  submitterName: z.string().min(1, "Your name is required"),
  submitterPronouns: z.string().min(1, "Pronouns are required"),
  contactEmail: z.string().email("Invalid email address"),
  company: z.string().optional(),
  companyWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  socialHandles: z.string().min(1, "Social media handles are required"),
  notes: z.string().optional(),
  photoUrls: z.array(z.string().url("Invalid URL")).min(1, "At least one photo URL is required").max(5, "Maximum 5 photo URLs"),
  credits: z.string().min(1, "Image description / credit is required"),
  referralSources: z.array(z.enum(["INSTAGRAM", "WORD_OF_MOUTH", "GOOGLE", "OTHER"]))
    .optional(),
  referralOther: z.string().optional(),
  joinEmailList: z.boolean().optional(),
  submittedBefore: z.boolean().optional(),
})

// Performance-only fields (optional in schema; enforced per-step in UI)
const performanceFields = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  showTime: z.string().optional(),
  ticketPrice: z.string().optional(),
  ticketLink: z.string().url("Invalid URL").optional(),
  shortDescription: z.string().max(1000, "Description must be 1000 characters or less").optional(),
  agreeCompTickets: z.boolean().optional(),
  extraOccurrences: z
    .array(
      z.object({
        date: z.string().min(1, "Date is required"),
        time: z.string().min(1, "Time is required"),
      })
    )
    .optional(),
})

// Audition-only
const auditionFields = z.object({
  auditionName: z.string().optional(),
  aboutProject: z.string().optional(),
  eligibility: z.string().optional(),
  compensation: z.string().optional(),
  auditionDate: z.string().optional(),
  auditionTime: z.string().optional(),
  auditionLink: z.string().url("Invalid URL").optional(),
})

// Creative Opportunity-only
const creativeFields = z.object({
  opportunityName: z.string().optional(),
  briefDescription: z.string().max(2000).optional(),
  creativeEligibility: z.string().optional(),
  whatsOffered: z.string().optional(),
  stipendAmount: z.string().optional(),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
  applyLink: z.string().url("Invalid URL").optional(),
})

// Class / Workshop-only
const classFields = z.object({
  festivalName: z.string().optional(),
  festivalLink: z.string().url("Invalid URL").optional(),
  className: z.string().optional(),
  classDates: z.string().optional(),
  classTimes: z.string().optional(),
  classExtraOccurrences: z
    .array(
      z.object({
        date: z.string().min(1, "Date is required"),
        time: z.string().min(1, "Time is required"),
      })
    )
    .optional(),
  classPrices: z.string().optional(),
  classLink: z.string().url("Invalid URL").optional(),
  classDescription: z.string().max(2000).optional(),
  classCreditInfo: z.string().optional(),
  classRecurrence: z.string().optional(),
})

// Funding-only
const fundingFields = z.object({
  fundingLink: z.string().url("Invalid URL").optional(),
  fundingTitle: z.string().optional(),
  fundingSummary: z.string().optional(),
})

export const eventFormSchema = baseSchema
  .merge(performanceFields)
  .merge(auditionFields)
  .merge(creativeFields)
  .merge(classFields)
  .merge(fundingFields)

export type EventFormData = z.infer<typeof eventFormSchema>

// Backwards-compat exports for existing imports
export const performanceSchema = eventFormSchema
export type PerformanceFormData = EventFormData


