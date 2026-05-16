/** Stable keys matching `service_questions.question_key` for fiscal sponsorship. */
export const FISCAL_SPONSORSHIP_QUESTION_KEYS = {
  pronouns: "pronouns",
  artistProjectName: "artist_project_name",
  websiteSocialPortfolio: "website_social_portfolio",
  locationBased: "location_based",
  entityType: "entity_type",
  artisticDiscipline: "artistic_discipline",
  projectDescription: "project_description",
  annualBudget: "annual_budget",
  whySeeking: "why_seeking",
  expectedServices: "expected_services",
  legalEntity: "legal_entity",
  previousFiscalSponsor: "previous_fiscal_sponsor",
  previousFiscalSponsorOrg: "previous_fiscal_sponsor_org",
  additionalServicesInterest: "additional_services_interest",
  howHeard: "how_heard",
  anythingElse: "anything_else",
} as const

export type FiscalSponsorshipQuestionKey =
  (typeof FISCAL_SPONSORSHIP_QUESTION_KEYS)[keyof typeof FISCAL_SPONSORSHIP_QUESTION_KEYS]
