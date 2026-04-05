export const fiscalSponsorshipInquiryIntro = {
  title: "Fiscal sponsorship inquiry",
  body: "This form has several short steps. You can add or change questions in each step component under components/forms/fiscal-sponsorship-inquiry/steps/. Nothing is submitted yet until you connect an API.",
} as const

export const fiscalSponsorshipInquiryFieldSteps = [
  {
    title: "Contact information",
    description: "Replace this copy and add fields in InquiryStep2.tsx.",
  },
  {
    title: "Step 3 — Organization & eligibility",
    description: "Replace this copy and add fields in InquiryStep3.tsx.",
  },
  {
    title: "Step 4 — Financial overview",
    description: "Replace this copy and add fields in InquiryStep4.tsx.",
  },
  {
    title: "Step 5 — Timeline & goals",
    description: "Replace this copy and add fields in InquiryStep5.tsx.",
  },
  {
    title: "Step 6 — Review & additional notes",
    description: "Replace this copy and add fields in InquiryStep6.tsx.",
  },
] as const

export const FISCAL_SPONSORSHIP_INQUIRY_TOTAL_STEPS =
  1 + fiscalSponsorshipInquiryFieldSteps.length
