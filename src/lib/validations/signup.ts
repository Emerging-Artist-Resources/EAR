import { z } from "zod"

// Constants
export const SIGNUP_STEPS = {
  BASIC: 1,
  ELIGIBILITY: 2,
  WRAP_UP: 3,
  PASSWORD: 4,
} as const

export const DEFAULT_ERROR_MESSAGE = "Please complete all required fields"

// Enums
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

// Validation Helpers
/**
 * Creates a schema for boolean/string union fields that must be required
 * Transforms string "true"/"false" to boolean
 */
const requiredBooleanStringField = (message: string) =>
  z
    .union([z.boolean(), z.string()])
    .refine((val) => val !== null && val !== undefined && val !== "", {
      message,
    })
    .transform((val) => {
      if (typeof val === "boolean") return val
      return val === "true"
    })

/**
 * Creates a schema for enum fields that must be required
 */
const requiredEnumField = <T extends z.ZodEnum<any>>(
  enumSchema: T,
  message: string
) =>
  enumSchema.refine(
    (val) => val !== null && val !== undefined,
    { message }
  )

/**
 * Creates a schema for nullable enum fields that must be filled (not null)
 */
const requiredNullableEnumField = <T extends z.ZodEnum<any>>(
  enumSchema: T,
  message: string
) =>
  z.union([enumSchema, z.null()]).refine(
    (val) => val !== null && val !== undefined,
    { message }
  )

// Schema Definitions
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
  self_identifies_emerging: requiredBooleanStringField("Artist identification is required"),
  operating_budget_range: requiredEnumField(operatingBudgetRangeEnum, "Operating Budget is required"),
  operating_budget_other_text: z.string().optional().nullable(),
  owns_or_operates_venue: requiredEnumField(yesNoOtherEnum, "Venue ownership is required"),
  owns_or_operates_venue_other_text: z.string().optional().nullable(),
  supported_by_major_institution: requiredEnumField(yesNoOtherEnum, "Major institution support is required"),
  supported_by_major_institution_other_text: z.string().optional().nullable(),
  classes_hosted_independently: requiredEnumField(yesNoOtherEnum, "Independent classes is required"),
  classes_hosted_independently_other_text: z.string().optional().nullable(),
  has_501c3: requiredEnumField(yesNoOtherEnum, "501c3 status is required"),
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

// Main Schema
export const signupFormSchema = profileFields.merge(eligibilityFields).merge(passwordFields)

export type SignupFormData = z.infer<typeof signupFormSchema>

// Step-specific Schemas
export const basicInfoSchema = profileFields.pick({
  profile_type: true,
  name: true,
  email: true,
})

export const eligibilitySchema = eligibilityFields

export const wrapUpSchema = z.object({
  referral_source: requiredNullableEnumField(referralSourceEnum, "Referral source is required"),
  newsletter_ear_opt_in: requiredBooleanStringField("EAR newsletter preference is required"),
  newsletter_calendar_opt_in: requiredBooleanStringField("Calendar newsletter preference is required"),
})

export const passwordSchema = passwordFields
