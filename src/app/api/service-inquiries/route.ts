import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
  createErrorResponse,
  ErrorCodes,
} from "@/lib/api-utils"
import { createServiceInquiryRequestSchema } from "@/lib/validations/service-inquiries"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import {
  validateAnswersAgainstQuestions,
  type ServiceQuestionRow,
} from "@/lib/service-inquiries/validateAnswersAgainstQuestions"
import { trySendFiscalSponsorshipInquiryEmails } from "@/lib/email/trySendFiscalSponsorshipInquiryEmails"
import { trySendServiceInquiryNotification } from "@/lib/email/trySendServiceInquiryNotification"
import { FISCAL_SPONSORSHIP_SERVICE_SLUG } from "@/lib/service-inquiries/fiscal-sponsorship-options"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = validateRequestBody(body, createServiceInquiryRequestSchema)

    const emailNormalized = data.email.trim().toLowerCase()
    const nameNormalized = data.name.trim()
    const slugNormalized = data.service_slug.trim().toLowerCase()

    const supabase = getSupabaseServiceClient()
    const auth = await getAuthenticatedUser()

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, title, slug")
      .eq("slug", slugNormalized)
      .eq("is_active", true)
      .maybeSingle()

    if (serviceError || !service) {
      return createErrorResponse(ErrorCodes.BAD_REQUEST, "Service not found or inactive", undefined, 400)
    }

    const { data: questionRows, error: qError } = await supabase
      .from("service_questions")
      .select("id, field_type, is_required, question_text, order_index, question_key")
      .eq("service_id", service.id)
      .order("order_index", { ascending: true })

    if (qError || !questionRows?.length) {
      console.error("service_inquiries: failed to load questions", qError)
      return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to load service questions", undefined, 500)
    }

    const questions: ServiceQuestionRow[] = questionRows.map((r) => ({
      id: r.id,
      field_type: r.field_type,
      is_required: r.is_required,
    }))

    const answersMap = new Map<string, string>()
    for (const a of data.answers) {
      answersMap.set(a.question_id, a.answer_text)
    }

    const validationError = validateAnswersAgainstQuestions(questions, answersMap)
    if (validationError) {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, validationError, undefined, 400)
    }

    const { data: inquiry, error: insertInquiryError } = await supabase
      .from("service_inquiries")
      .insert({
        service_id: service.id,
        user_id: auth?.user.id ?? null,
        email: emailNormalized,
        name: nameNormalized,
        status: "pending",
        service_slug: service.slug,
      })
      .select("id")
      .single()

    if (insertInquiryError || !inquiry) {
      console.error("service_inquiries: insert inquiry failed", insertInquiryError)
      return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to save inquiry", undefined, 500)
    }

    const answerPayload = questionRows.map((q) => ({
      inquiry_id: inquiry.id,
      question_id: q.id,
      answer_text: answersMap.get(q.id) ?? "",
    }))

    const { error: insertAnswersError } = await supabase.from("service_answers").insert(answerPayload)

    if (insertAnswersError) {
      console.error("service_inquiries: insert answers failed", insertAnswersError)
      return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to save answers", undefined, 500)
    }

    if (slugNormalized === FISCAL_SPONSORSHIP_SERVICE_SLUG) {
      await trySendFiscalSponsorshipInquiryEmails({
        inquiryId: inquiry.id,
        submitterName: nameNormalized,
        submitterEmail: emailNormalized,
        questions: questionRows,
        answersByQuestionId: answersMap,
      })
    } else {
      const qById = new Map(questionRows.map((q) => [q.id, q]))
      const answersHtml = data.answers
        .map((a) => {
          const q = qById.get(a.question_id)
          const label = q?.question_text ?? a.question_id
          let display = a.answer_text
          if (q?.field_type === "multiselect") {
            try {
              const parsed = JSON.parse(a.answer_text) as unknown
              display = Array.isArray(parsed) ? parsed.join(", ") : a.answer_text
            } catch {
              /* keep raw */
            }
          }
          return `<p><strong>${escapeHtml(label)}</strong><br/>${escapeHtml(display)}</p>`
        })
        .join("")

      await trySendServiceInquiryNotification({
        inquiryId: inquiry.id,
        serviceTitle: service.title,
        serviceSlug: service.slug,
        name: nameNormalized,
        email: emailNormalized,
        answersHtml,
      })
    }

    return createSuccessResponse({ id: inquiry.id }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
