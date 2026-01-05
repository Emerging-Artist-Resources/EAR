import { z } from "zod"

export const profileTypeEnum = z.enum(["individual", "company", "festival", "other"])

export const referralSourceEnum = z.enum(["instagram", "word_of_mouth", "google", "other"])

export const operatingBudgetRangeEnum = z.enum([
  "r_0_24999",
  "r_25000_49999",
  "r_50000_99999",
  "r_100000_499999",
  "r_500000_999999",
  "r_1000000_1999999",
  "r_2000000_plus",
  "other",
])

export const yesNoOtherEnum = z.enum(["yes", "no", "other"])

const profileFields = z.object({
  profile_type: profileTypeEnum,
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  pronouns: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  organization_name: z.string().optional().nullable(),
  location_place_id: z.string().optional().nullable(),
  location_label: z.string().optional().nullable(),
  newsletter_ear_opt_in: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === "boolean") return val
    return val === "true"
  }),
  newsletter_calendar_opt_in: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === "boolean") return val
    return val === "true"
  }),
  referral_source: referralSourceEnum.nullable(),
  referral_source_other: z.string().optional().nullable(),
})

const eligibilityFields = z.object({
  self_identifies_emerging: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === "boolean") return val
    return val === "true"
  }),
  operating_budget_range: operatingBudgetRangeEnum,
  operating_budget_other_text: z.string().optional().nullable(),
  owns_or_operates_venue: yesNoOtherEnum,
  owns_or_operates_venue_other_text: z.string().optional().nullable(),
  supported_by_major_institution: yesNoOtherEnum,
  supported_by_major_institution_other_text: z.string().optional().nullable(),
  classes_hosted_independently: yesNoOtherEnum,
  classes_hosted_independently_other_text: z.string().optional().nullable(),
  has_501c3: yesNoOtherEnum,
  has_501c3_other_text: z.string().optional().nullable(),
})

const passwordFields = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const signupFormSchema = profileFields.merge(eligibilityFields).merge(passwordFields)

export type SignupFormData = z.infer<typeof signupFormSchema>

