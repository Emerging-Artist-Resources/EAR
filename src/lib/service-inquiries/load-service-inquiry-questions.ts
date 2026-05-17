import type { ServiceInquiryQuestionRow } from "@/lib/service-inquiries/service-inquiry-questions"
import { supabase } from "@/lib/supabase/client"

type QuestionOptionRow = {
  label: string
  value: string
  order_index: number
  is_other: boolean
}

type QuestionRow = {
  id: string
  question_text: string
  field_type: string
  is_required: boolean
  order_index: number
  service_question_options: QuestionOptionRow[] | null
}

export type LoadServiceInquiryQuestionsResult =
  | { ok: true; questions: ServiceInquiryQuestionRow[] }
  | { ok: false; error: string }

export async function loadServiceInquiryQuestions(
  serviceSlug: string,
): Promise<LoadServiceInquiryQuestionsResult> {
  const { data: svc, error: svcError } = await supabase
    .from("services")
    .select("id")
    .eq("slug", serviceSlug)
    .eq("is_active", true)
    .maybeSingle()

  if (svcError || !svc) {
    return { ok: false, error: "This form is temporarily unavailable." }
  }

  const { data: rows, error: qError } = await supabase
    .from("service_questions")
    .select(
      `
      id,
      question_text,
      field_type,
      is_required,
      order_index,
      service_question_options (
        label,
        value,
        order_index,
        is_other
      )
    `,
    )
    .eq("service_id", svc.id)
    .order("order_index", { ascending: true })

  if (qError || !rows?.length) {
    return { ok: false, error: "Could not load form questions." }
  }

  const questions: ServiceInquiryQuestionRow[] = (rows as QuestionRow[]).map((row) => ({
    id: row.id,
    question_text: row.question_text,
    field_type: row.field_type,
    is_required: row.is_required,
    order_index: row.order_index,
    options: (row.service_question_options ?? []).map((o) => ({
      label: o.label,
      value: o.value,
      order_index: o.order_index,
      is_other: o.is_other,
    })),
  }))

  return { ok: true, questions }
}
