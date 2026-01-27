import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email("Invalid email address").optional(),
  pronouns: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  organization_name: z.string().optional().nullable(),
  location_label: z.string().optional().nullable(),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>
