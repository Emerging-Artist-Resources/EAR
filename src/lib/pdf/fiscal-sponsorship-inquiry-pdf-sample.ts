import type { FiscalSponsorshipInquiryPdfInput } from "@/lib/service-inquiries/fiscal-sponsorship-inquiry-pdf-model"

/** Rich sample payload for local PDF layout preview (dev route only). */
export function buildFiscalSponsorshipInquiryPdfSample(): FiscalSponsorshipInquiryPdfInput {
  return {
    inquiryId: "FS-2026-PREVIEW",
    submittedAtLabel: "May 16, 2026 at 2:30 PM ET",
    submitterName: "Jordan Rivera",
    submitterEmail: "jordan.rivera@example.com",
    sections: [
      {
        title: "Contact information",
        rows: [
          { label: "First Name", value: "Jordan" },
          { label: "Last Name", value: "Rivera" },
          { label: "Email Address", value: "jordan.rivera@example.com" },
          { label: "Pronouns", value: "" },
          { label: "Artist, Project, or Organization Name", value: "Riverlight Collective" },
          {
            label: "Website / Social Media / Portfolio",
            value: "https://riverlightcollective.org · @riverlight.nyc",
          },
          { label: "Where are you based?", value: "Brooklyn, NY" },
        ],
      },
      {
        title: "Organization & discipline",
        rows: [
          { label: "What type of entity are you?", value: "Fiscally sponsored project (no separate legal entity)" },
          {
            label: "Artistic Discipline",
            value: "Interdisciplinary, Dance, Theater",
            variant: "multiselect",
            multiselectItems: ["Interdisciplinary"],
          },
          {
            label: "Please describe your project or organization",
            value:
              "Riverlight Collective produces interdisciplinary performances that center immigrant stories and community co-creation. We run an annual residency, two public showcases, and workshops for youth in Brooklyn. Our work blends dance, oral history, and visual design.",
            variant: "long",
          },
        ],
      },
      {
        title: "Sponsorship needs",
        rows: [
          { label: "What is your estimated annual project budget?", value: "$50,000 – $100,000" },
          {
            label: "Why are you seeking fiscal sponsorship?",
            value: "Grant eligibility, Donor tax deductions, Administrative support",
            variant: "multiselect",
            multiselectItems: [
              "Grant eligibility",
              "Donor tax deductions",
              "Administrative support",
            ],
          },
          {
            label: "Which services would you expect from a fiscal sponsor?",
            value: "Receiving donations, Grant application support, Bookkeeping / financial reporting",
            variant: "multiselect",
            multiselectItems: [
              "Receiving donations",
              "Grant application support",
              "Bookkeeping / financial reporting",
            ],
          },
          { label: "Do you currently have a legal entity?", value: "No" },
          { label: "Have you previously worked with a fiscal sponsor?", value: "Yes" },
          { label: "If yes, which organization?", value: "NYC Arts Fiscal Partners" },
          {
            label:
              "Are you interested in additional fiscal services (bookkeeping, grant writing, fiscal mentorship, etc.)?",
            value: "Yes — grant writing and fiscal mentorship",
          },
          { label: "How did you hear about us?", value: "Referral from another artist" },
          {
            label:
              "Is there anything else you'd like to share about your organization/project?",
            value:
              "We are planning a spring 2027 tour and would like support setting up restricted funds for tour-related expenses. Happy to share our draft budget and recent press links.",
            variant: "long",
          },
        ],
      },
    ],
  }
}
