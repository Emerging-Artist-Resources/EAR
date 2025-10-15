import { z } from "zod"

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["INFO", "WARNING", "SUCCESS", "ERROR"]).default("INFO"),
  isActive: z.boolean().default(true).optional(),
})

export type AnnouncementFormData = z.infer<typeof announcementSchema>


