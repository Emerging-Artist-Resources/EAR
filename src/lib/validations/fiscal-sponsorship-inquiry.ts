import { z } from "zod"
import { FISCAL_SPONSORSHIP_OTHER_VALUE } from "@/lib/service-inquiries/fiscal-sponsorship-options"

function zTrimmedField(minError: string) {
  return z.preprocess(
    (val) => (val == null ? "" : String(val).trim()),
    z.string().min(1, minError),
  )
}

function zOptionalShortText(max: number) {
  return z.preprocess(
    (val) => (val == null ? "" : String(val)),
    z.string().max(max),
  )
}

function zOptionalTrimmedText(max: number) {
  return z.preprocess(
    (val) => (val == null ? "" : String(val).trim()),
    z.string().max(max),
  )
}

function zStringArrayField(minError: string) {
  return z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(z.string()).min(1, minError),
  )
}

function requireOtherTextWhenOther(
  value: string | string[] | undefined,
  otherText: string | undefined,
  message: string,
): z.ZodIssue[] {
  const issues: z.ZodIssue[] = []
  const selected = Array.isArray(value) ? value : value ? [value] : []
  if (selected.includes(FISCAL_SPONSORSHIP_OTHER_VALUE) && !otherText?.trim()) {
    issues.push({ code: "custom", message, path: [] })
  }
  return issues
}

const baseFields = {
  firstName: zTrimmedField("First name is required"),
  lastName: zTrimmedField("Last name is required"),
  pronouns: zOptionalShortText(100),
  email: z.preprocess(
    (val) => (val == null ? "" : String(val).trim()),
    z.string().min(1, "Email address is required").email("Enter a valid email address"),
  ),
  artistProjectOrOrgName: zTrimmedField("Artist, project, or organization name is required"),
  websiteSocialPortfolio: zOptionalShortText(2000),
  artistLocation: zTrimmedField("Where you are based is required"),
  entityType: zTrimmedField("Entity type is required"),
  entityTypeOther: zOptionalTrimmedText(500),
  artisticDiscipline: zStringArrayField("Select at least one artistic discipline"),
  artisticDisciplineOther: zOptionalTrimmedText(500),
  projectDescription: zOptionalShortText(5000),
  annualBudget: zTrimmedField("Estimated annual project budget is required"),
  whySeeking: zStringArrayField("Select at least one reason"),
  whySeekingOther: zOptionalTrimmedText(500),
  expectedServices: zStringArrayField("Select at least one expected service"),
  expectedServicesOther: zOptionalTrimmedText(500),
  legalEntity: zTrimmedField("Legal entity status is required"),
  legalEntityOther: zOptionalTrimmedText(500),
  previousFiscalSponsor: zTrimmedField("This field is required"),
  previousFiscalSponsorOrg: zOptionalTrimmedText(500),
  additionalServicesInterest: zTrimmedField("This field is required"),
  howHeard: zOptionalTrimmedText(200),
  howHeardOther: zOptionalTrimmedText(500),
  anythingElse: zOptionalShortText(5000),
}

function withOtherRefinements<T extends z.ZodType>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const d = data as Record<string, unknown>
    for (const [valueKey, otherKey, message] of [
      ["entityType", "entityTypeOther", "Please describe your entity type"],
      ["artisticDiscipline", "artisticDisciplineOther", "Please describe your discipline"],
      ["whySeeking", "whySeekingOther", "Please describe why you are seeking sponsorship"],
      ["expectedServices", "expectedServicesOther", "Please describe the services you expect"],
      ["legalEntity", "legalEntityOther", "Please describe your legal entity"],
      ["howHeard", "howHeardOther", "Please tell us how you heard about us"],
    ] as const) {
      const issues = requireOtherTextWhenOther(
        d[valueKey] as string | string[] | undefined,
        d[otherKey] as string | undefined,
        message,
      )
      for (const issue of issues) {
        ctx.addIssue({ ...issue, path: [otherKey] })
      }
    }
    if (d.previousFiscalSponsor === "Yes" && !String(d.previousFiscalSponsorOrg ?? "").trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Organization name is required when you have worked with a fiscal sponsor",
        path: ["previousFiscalSponsorOrg"],
      })
    }
  })
}

export const fiscalSponsorshipInquiryPage1Schema = withOtherRefinements(
  z.object({
    firstName: baseFields.firstName,
    lastName: baseFields.lastName,
    pronouns: baseFields.pronouns,
    email: baseFields.email,
    artistProjectOrOrgName: baseFields.artistProjectOrOrgName,
    websiteSocialPortfolio: baseFields.websiteSocialPortfolio,
    artistLocation: baseFields.artistLocation,
  }),
)

export const fiscalSponsorshipInquiryPage2Schema = withOtherRefinements(
  z.object({
    entityType: baseFields.entityType,
    entityTypeOther: baseFields.entityTypeOther,
    artisticDiscipline: baseFields.artisticDiscipline,
    artisticDisciplineOther: baseFields.artisticDisciplineOther,
    projectDescription: baseFields.projectDescription,
  }),
)

export const fiscalSponsorshipInquiryPage3Schema = withOtherRefinements(
  z.object({
    annualBudget: baseFields.annualBudget,
    whySeeking: baseFields.whySeeking,
    whySeekingOther: baseFields.whySeekingOther,
    expectedServices: baseFields.expectedServices,
    expectedServicesOther: baseFields.expectedServicesOther,
    legalEntity: baseFields.legalEntity,
    legalEntityOther: baseFields.legalEntityOther,
    previousFiscalSponsor: baseFields.previousFiscalSponsor,
    previousFiscalSponsorOrg: baseFields.previousFiscalSponsorOrg,
    additionalServicesInterest: baseFields.additionalServicesInterest,
    howHeard: baseFields.howHeard,
    howHeardOther: baseFields.howHeardOther,
    anythingElse: baseFields.anythingElse,
  }),
)

export const fiscalSponsorshipInquirySchema = withOtherRefinements(z.object(baseFields))

export type FiscalSponsorshipInquiryFormData = z.infer<typeof fiscalSponsorshipInquirySchema>

export const fiscalSponsorshipInquiryFieldLabels = {
  firstName: "First name",
  lastName: "Last name",
  pronouns: "Pronouns",
  email: "Email address",
  artistProjectOrOrgName: "Artist, project, or organization name",
  websiteSocialPortfolio: "Website / social media / portfolio",
  artistLocation: "Where you are based",
  entityType: "Entity type",
  entityTypeOther: "Entity type (other)",
  artisticDiscipline: "Artistic discipline",
  artisticDisciplineOther: "Artistic discipline (other)",
  projectDescription: "Project or organization description",
  annualBudget: "Estimated annual project budget",
  whySeeking: "Why you are seeking fiscal sponsorship",
  whySeekingOther: "Why you are seeking fiscal sponsorship (other)",
  expectedServices: "Expected services from a fiscal sponsor",
  expectedServicesOther: "Expected services (other)",
  legalEntity: "Legal entity",
  legalEntityOther: "Legal entity (other)",
  previousFiscalSponsor: "Previous fiscal sponsor",
  previousFiscalSponsorOrg: "Previous fiscal sponsor organization",
  additionalServicesInterest: "Additional fiscal services interest",
  howHeard: "How you heard about us",
  howHeardOther: "How you heard about us (other)",
  anythingElse: "Additional notes",
} as const satisfies Record<keyof FiscalSponsorshipInquiryFormData, string>

export const FISCAL_SPONSORSHIP_INQUIRY_ERROR_FALLBACK =
  "Please fix the highlighted fields before continuing."

export const fiscalSponsorshipInquiryPageFields = {
  1: [
    "firstName",
    "lastName",
    "pronouns",
    "email",
    "artistProjectOrOrgName",
    "websiteSocialPortfolio",
    "artistLocation",
  ],
  2: [
    "entityType",
    "entityTypeOther",
    "artisticDiscipline",
    "artisticDisciplineOther",
    "projectDescription",
  ],
  3: [
    "annualBudget",
    "whySeeking",
    "whySeekingOther",
    "expectedServices",
    "expectedServicesOther",
    "legalEntity",
    "legalEntityOther",
    "previousFiscalSponsor",
    "previousFiscalSponsorOrg",
    "additionalServicesInterest",
    "howHeard",
    "howHeardOther",
    "anythingElse",
  ],
} as const satisfies Record<number, readonly (keyof FiscalSponsorshipInquiryFormData)[]>

export const fiscalSponsorshipInquiryPageSchemas = {
  1: fiscalSponsorshipInquiryPage1Schema,
  2: fiscalSponsorshipInquiryPage2Schema,
  3: fiscalSponsorshipInquiryPage3Schema,
} as const

export const fiscalSponsorshipInquiryDefaultValues: FiscalSponsorshipInquiryFormData = {
  firstName: "",
  lastName: "",
  pronouns: "",
  email: "",
  artistProjectOrOrgName: "",
  websiteSocialPortfolio: "",
  artistLocation: "",
  entityType: "",
  entityTypeOther: "",
  artisticDiscipline: [],
  artisticDisciplineOther: "",
  projectDescription: "",
  annualBudget: "",
  whySeeking: [],
  whySeekingOther: "",
  expectedServices: [],
  expectedServicesOther: "",
  legalEntity: "",
  legalEntityOther: "",
  previousFiscalSponsor: "",
  previousFiscalSponsorOrg: "",
  additionalServicesInterest: "",
  howHeard: "",
  howHeardOther: "",
  anythingElse: "",
}
