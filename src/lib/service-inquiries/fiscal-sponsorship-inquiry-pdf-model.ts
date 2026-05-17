import {
  formatFiscalSponsorshipAnswerForDisplay,
  parseFiscalSponsorshipMultiselectItems,
} from "@/lib/service-inquiries/format-fiscal-sponsorship-answer-display"
import { FISCAL_SPONSORSHIP_QUESTION_KEYS } from "@/lib/service-inquiries/fiscal-sponsorship-question-keys"

export type FiscalSponsorshipPdfFieldVariant = "default" | "long" | "multiselect"

export type FiscalSponsorshipPdfFieldRow = {
  label: string
  value: string
  variant?: FiscalSponsorshipPdfFieldVariant
  /** Individual values when variant is multiselect (chips / bullets in PDF). */
  multiselectItems?: string[]
}

export type FiscalSponsorshipPdfSection = {
  title: string
  rows: FiscalSponsorshipPdfFieldRow[]
}

export type FiscalSponsorshipInquiryPdfInput = {
  inquiryId: string
  submittedAtLabel: string
  submitterName: string
  submitterEmail: string
  sections: FiscalSponsorshipPdfSection[]
}

type QuestionRow = {
  id: string
  question_key: string | null
  question_text: string
  field_type: string
  order_index: number
}

export function splitSubmitterName(fullName: string): { firstName: string; lastName: string } {
  const t = fullName.trim()
  const space = t.indexOf(" ")
  if (space === -1) return { firstName: t, lastName: "" }
  return { firstName: t.slice(0, space), lastName: t.slice(space + 1).trim() }
}

function rowForKey(
  label: string,
  questions: QuestionRow[],
  answersByQuestionId: Map<string, string>,
  key: string,
): FiscalSponsorshipPdfFieldRow {
  const q = questions.find((row) => row.question_key === key)
  const raw = q ? (answersByQuestionId.get(q.id) ?? "") : ""
  const fieldType = q?.field_type ?? "text"
  const value = formatFiscalSponsorshipAnswerForDisplay(fieldType, raw)

  if (fieldType === "multiselect") {
    const items = parseFiscalSponsorshipMultiselectItems(raw)
    if (items.length === 0) {
      return { label, value: "—" }
    }
    return {
      label,
      value,
      variant: "multiselect",
      multiselectItems: items,
    }
  }

  if (fieldType === "textarea") {
    return { label, value: value.trim() ? value : "—", variant: "long" }
  }

  return { label, value: value.trim() ? value : "—" }
}

/**
 * Builds PDF/email structure mirroring the 3-page inquiry form.
 */
export function buildFiscalSponsorshipInquiryPdfInput(params: {
  inquiryId: string
  submittedAtLabel: string
  submitterName: string
  submitterEmail: string
  questions: QuestionRow[]
  answersByQuestionId: Map<string, string>
}): FiscalSponsorshipInquiryPdfInput {
  const { firstName, lastName } = splitSubmitterName(params.submitterName)
  const k = FISCAL_SPONSORSHIP_QUESTION_KEYS
  const { questions, answersByQuestionId } = params

  const contactRows: FiscalSponsorshipPdfFieldRow[] = [
    { label: "First Name", value: firstName.trim() || "—" },
    { label: "Last Name", value: lastName.trim() || "—" },
    { label: "Email Address", value: params.submitterEmail.trim() || "—" },
    rowForKey("Pronouns", questions, answersByQuestionId, k.pronouns),
    rowForKey(
      "Artist, Project, or Organization Name",
      questions,
      answersByQuestionId,
      k.artistProjectName,
    ),
    rowForKey(
      "Website / Social Media / Portfolio",
      questions,
      answersByQuestionId,
      k.websiteSocialPortfolio,
    ),
    rowForKey("Where are you based?", questions, answersByQuestionId, k.locationBased),
  ]

  const organizationRows: FiscalSponsorshipPdfFieldRow[] = [
    rowForKey("What type of entity are you?", questions, answersByQuestionId, k.entityType),
    rowForKey("Artistic Discipline", questions, answersByQuestionId, k.artisticDiscipline),
    rowForKey(
      "Please describe your project or organization",
      questions,
      answersByQuestionId,
      k.projectDescription,
    ),
  ]

  const sponsorshipRows: FiscalSponsorshipPdfFieldRow[] = [
    rowForKey(
      "What is your estimated annual project budget?",
      questions,
      answersByQuestionId,
      k.annualBudget,
    ),
    rowForKey(
      "Why are you seeking fiscal sponsorship?",
      questions,
      answersByQuestionId,
      k.whySeeking,
    ),
    rowForKey(
      "Which services would you expect from a fiscal sponsor?",
      questions,
      answersByQuestionId,
      k.expectedServices,
    ),
    rowForKey("Do you currently have a legal entity?", questions, answersByQuestionId, k.legalEntity),
    rowForKey(
      "Have you previously worked with a fiscal sponsor?",
      questions,
      answersByQuestionId,
      k.previousFiscalSponsor,
    ),
    rowForKey(
      "If yes, which organization?",
      questions,
      answersByQuestionId,
      k.previousFiscalSponsorOrg,
    ),
    rowForKey(
      "Are you interested in additional fiscal services (bookkeeping, grant writing, fiscal mentorship, etc.)?",
      questions,
      answersByQuestionId,
      k.additionalServicesInterest,
    ),
    rowForKey("How did you hear about us?", questions, answersByQuestionId, k.howHeard),
    rowForKey(
      "Is there anything else you'd like to share about your organization/project?",
      questions,
      answersByQuestionId,
      k.anythingElse,
    ),
  ]

  return {
    inquiryId: params.inquiryId,
    submittedAtLabel: params.submittedAtLabel,
    submitterName: params.submitterName,
    submitterEmail: params.submitterEmail,
    sections: [
      { title: "Contact information", rows: contactRows },
      { title: "Organization & discipline", rows: organizationRows },
      { title: "Sponsorship needs", rows: sponsorshipRows },
    ],
  }
}
