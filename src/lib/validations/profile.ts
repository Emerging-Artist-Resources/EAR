import { z } from "zod"
import { flexibleUrlProfileWebsiteSchema } from "./flexible-url"

const profileSlugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be at most 80 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only use lowercase letters, numbers, and hyphens")

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email("Invalid email address").optional(),
  pronouns: z.string().optional().nullable(),
  website: flexibleUrlProfileWebsiteSchema.optional(),
  organization_name: z.string().optional().nullable(),
  location_place_id: z.string().optional().nullable(),
  location_label: z.string().optional().nullable(),
  /** Set only while slug is null; server rejects changes after first set. */
  slug: profileSlugSchema.optional(),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>

export const saveListingSchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
})

export type SaveListingData = z.infer<typeof saveListingSchema>

export const updateAttendanceSchema = z.object({
  attendanceStatus: z.enum(["attended", "missed"]).nullable(),
})

export type UpdateAttendanceData = z.infer<typeof updateAttendanceSchema>
