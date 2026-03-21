import { z } from "zod"

/**
 * Coerce null/undefined and trim. The zodResolver always parses the full form object;
 * missing keys can be undefined in RHF state, which Zod 4 rejects for z.string().
 */
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

export const fiscalSponsorshipInquirySchema = z.object({
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
})

export type FiscalSponsorshipInquiryFormData = z.infer<typeof fiscalSponsorshipInquirySchema>

/** Human-readable labels for errors / toasts (matches signup `getFieldLabel` pattern). */
export const fiscalSponsorshipInquiryFieldLabels = {
  firstName: "First name",
  lastName: "Last name",
  pronouns: "Pronouns",
  email: "Email address",
  artistProjectOrOrgName: "Artist, project, or organization name",
  websiteSocialPortfolio: "Website / social media / portfolio",
  artistLocation: "Where you are based",
} as const satisfies Record<keyof FiscalSponsorshipInquiryFormData, string>

export const FISCAL_SPONSORSHIP_INQUIRY_STEP2_ERROR_FALLBACK =
  "Please fix the highlighted fields before continuing."

/** Fields validated before leaving step 2 (Continue). */
export const fiscalSponsorshipInquiryStep2Fields = [
  "firstName",
  "lastName",
  "pronouns",
  "email",
  "artistProjectOrOrgName",
  "websiteSocialPortfolio",
  "artistLocation",
] as const satisfies ReadonlyArray<keyof FiscalSponsorshipInquiryFormData>
