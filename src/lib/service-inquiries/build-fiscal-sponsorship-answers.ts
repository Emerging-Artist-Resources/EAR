import { supabase } from "@/lib/supabase/client"
import {
  formatMultiselectAnswer,
  formatSelectAnswer,
  FISCAL_SPONSORSHIP_SERVICE_SLUG,
} from "@/lib/service-inquiries/fiscal-sponsorship-options"
import { FISCAL_SPONSORSHIP_QUESTION_KEYS } from "@/lib/service-inquiries/fiscal-sponsorship-question-keys"
import type { FiscalSponsorshipInquiryFormData } from "@/lib/validations/fiscal-sponsorship-inquiry"

export type ServiceAnswerPayload = {
  question_id: string
  answer_text: string
}

export async function fetchFiscalSponsorshipQuestionIdMap(): Promise<
  Map<string, string>
> {
  const { data: svc, error: svcError } = await supabase
    .from("services")
    .select("id")
    .eq("slug", FISCAL_SPONSORSHIP_SERVICE_SLUG)
    .eq("is_active", true)
    .maybeSingle()

  if (svcError || !svc) {
    throw new Error("This form is temporarily unavailable.")
  }

  const { data: rows, error: qError } = await supabase
    .from("service_questions")
    .select("id, question_key")
    .eq("service_id", svc.id)
    .not("question_key", "is", null)

  if (qError || !rows?.length) {
    throw new Error("Could not load form questions.")
  }

  const map = new Map<string, string>()
  for (const row of rows) {
    if (row.question_key) {
      map.set(row.question_key, row.id)
    }
  }
  return map
}

function requireId(
  map: Map<string, string>,
  key: string,
): string {
  const id = map.get(key)
  if (!id) {
    throw new Error(`Missing question configuration for "${key}".`)
  }
  return id
}

function textAnswer(map: Map<string, string>, key: string, text: string): ServiceAnswerPayload {
  return {
    question_id: requireId(map, key),
    answer_text: text.trim(),
  }
}

/**
 * Build API answers array from form values and question_key → id map.
 */
export function buildFiscalSponsorshipAnswers(
  data: FiscalSponsorshipInquiryFormData,
  questionIdByKey: Map<string, string>,
): ServiceAnswerPayload[] {
  const k = FISCAL_SPONSORSHIP_QUESTION_KEYS
  const answers: ServiceAnswerPayload[] = []

  answers.push(textAnswer(questionIdByKey, k.pronouns, data.pronouns))
  answers.push(
    textAnswer(questionIdByKey, k.artistProjectName, data.artistProjectOrOrgName),
  )
  answers.push(
    textAnswer(questionIdByKey, k.websiteSocialPortfolio, data.websiteSocialPortfolio),
  )
  answers.push(textAnswer(questionIdByKey, k.locationBased, data.artistLocation))
  answers.push({
    question_id: requireId(questionIdByKey, k.entityType),
    answer_text: formatSelectAnswer(data.entityType, data.entityTypeOther),
  })
  answers.push({
    question_id: requireId(questionIdByKey, k.artisticDiscipline),
    answer_text: formatMultiselectAnswer(
      data.artisticDiscipline,
      data.artisticDisciplineOther,
    ),
  })
  answers.push(
    textAnswer(questionIdByKey, k.projectDescription, data.projectDescription),
  )
  answers.push({
    question_id: requireId(questionIdByKey, k.annualBudget),
    answer_text: data.annualBudget.trim(),
  })
  answers.push({
    question_id: requireId(questionIdByKey, k.whySeeking),
    answer_text: formatMultiselectAnswer(data.whySeeking, data.whySeekingOther),
  })
  answers.push({
    question_id: requireId(questionIdByKey, k.expectedServices),
    answer_text: formatMultiselectAnswer(
      data.expectedServices,
      data.expectedServicesOther,
    ),
  })
  answers.push({
    question_id: requireId(questionIdByKey, k.legalEntity),
    answer_text: formatSelectAnswer(data.legalEntity, data.legalEntityOther),
  })
  answers.push({
    question_id: requireId(questionIdByKey, k.previousFiscalSponsor),
    answer_text: data.previousFiscalSponsor.trim(),
  })
  answers.push(
    textAnswer(
      questionIdByKey,
      k.previousFiscalSponsorOrg,
      data.previousFiscalSponsor === "Yes" ? data.previousFiscalSponsorOrg : "",
    ),
  )
  answers.push({
    question_id: requireId(questionIdByKey, k.additionalServicesInterest),
    answer_text: data.additionalServicesInterest.trim(),
  })

  const howHeard = data.howHeard.trim()
    ? formatSelectAnswer(data.howHeard, data.howHeardOther)
    : ""
  answers.push(textAnswer(questionIdByKey, k.howHeard, howHeard))
  answers.push(textAnswer(questionIdByKey, k.anythingElse, data.anythingElse))

  return answers
}
