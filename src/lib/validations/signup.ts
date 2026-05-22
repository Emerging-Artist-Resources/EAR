import { z } from "zod"
import { signupOptionalWebsiteSchema } from "./flexible-url"

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

/** Must match SelectBlock `otherValue` on signup forms (lowercase — not fiscal/service "OTHER"). */
export const SIGNUP_OTHER_VALUE = "other" as const

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

function requireOtherTextWhenOther(
  value: string | null | undefined,
  otherText: string | null | undefined,
  message: string
): z.ZodIssue[] {
  if (value === SIGNUP_OTHER_VALUE && !otherText?.trim()) {
    return [{ code: "custom", message, path: [] }]
  }
  return []
}

function withSignupOtherRefinements<T extends z.ZodType>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const d = data as Record<string, unknown>
    for (const [valueKey, otherKey, message] of [
      ["operating_budget_range", "operating_budget_other_text", "Please describe your operating budget"],
      ["owns_or_operates_venue", "owns_or_operates_venue_other_text", "Please provide details"],
      ["supported_by_major_institution", "supported_by_major_institution_other_text", "Please provide details"],
      ["classes_hosted_independently", "classes_hosted_independently_other_text", "Please provide details"],
      ["has_501c3", "has_501c3_other_text", "Please provide details"],
      ["referral_source", "referral_source_other", "Please tell us how you heard about us"],
    ] as const) {
      const issues = requireOtherTextWhenOther(
        d[valueKey] as string | null | undefined,
        d[otherKey] as string | null | undefined,
        message
      )
      for (const issue of issues) {
        ctx.addIssue({ ...issue, path: [otherKey] })
      }
    }
  })
}

/** Coarse wizard step for redirecting after server-side validation errors */
export type SignupErrorStep = "basic" | "eligibility" | "wrap-up" | "password"

const BASIC_FIELD_KEYS = new Set<string>([
  "profile_type",
  "name",
  "email",
  "pronouns",
  "website",
  "organization_name",
  "location_place_id",
  "location_label",
])

const ELIGIBILITY_FIELD_KEYS = new Set<string>([
  "self_identifies_emerging",
  "operating_budget_range",
  "operating_budget_other_text",
  "owns_or_operates_venue",
  "owns_or_operates_venue_other_text",
  "supported_by_major_institution",
  "supported_by_major_institution_other_text",
  "classes_hosted_independently",
  "classes_hosted_independently_other_text",
  "has_501c3",
  "has_501c3_other_text",
])

const WRAP_UP_FIELD_KEYS = new Set<string>([
  "referral_source",
  "referral_source_other",
  "newsletter_ear_opt_in",
  "newsletter_calendar_opt_in",
])

const PASSWORD_FIELD_KEYS = new Set<string>(["password", "confirmPassword"])

export function getSignupErrorStepForPath(path: ReadonlyArray<PropertyKey>): SignupErrorStep {
  const key = String(path[0] ?? "")
  if (PASSWORD_FIELD_KEYS.has(key)) return "password"
  if (WRAP_UP_FIELD_KEYS.has(key)) return "wrap-up"
  if (ELIGIBILITY_FIELD_KEYS.has(key)) return "eligibility"
  if (BASIC_FIELD_KEYS.has(key)) return "basic"
  return "basic"
}

// Schema Definitions
const profileFields = z.object({
  profile_type: profileTypeEnum,
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  pronouns: z.string().optional().nullable(),
  website: signupOptionalWebsiteSchema,
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
export const signupFormSchema = withSignupOtherRefinements(
  profileFields.merge(eligibilityFields).merge(passwordFields)
)

export type SignupFormData = z.infer<typeof signupFormSchema>

// Step-specific Schemas
export const basicInfoSchema = profileFields.pick({
  profile_type: true,
  name: true,
  email: true,
})

export const eligibilitySchema = withSignupOtherRefinements(eligibilityFields)

export const wrapUpSchema = withSignupOtherRefinements(
  z.object({
    referral_source: requiredNullableEnumField(referralSourceEnum, "Referral source is required"),
    newsletter_ear_opt_in: requiredBooleanStringField("EAR newsletter preference is required"),
    newsletter_calendar_opt_in: requiredBooleanStringField("Calendar newsletter preference is required"),
    referral_source_other: z.string().optional().nullable(),
  })
)

export const passwordSchema = passwordFields
