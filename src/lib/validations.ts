import { z } from "zod"

export const performanceSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  location: z.string().optional(),
  performer: z.string().min(1, "Performer name is required").max(100, "Performer name must be less than 100 characters"),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
})

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "ERROR"]).default("INFO"),
  isActive: z.boolean().default(true),
})

export type PerformanceFormData = z.infer<typeof performanceSchema>
export type NotificationFormData = z.infer<typeof notificationSchema>
