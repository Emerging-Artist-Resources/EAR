import { buildDocumentationInquiryPdfInput } from "@/lib/service-inquiries/documentation-inquiry-pdf-model"
import {
  buildDocumentationInquiryPdfFileName,
  generateDocumentationInquiryPdf,
} from "@/lib/pdf/generateDocumentationInquiryPdf"
import {
  DOCUMENTATION_INQUIRY_TEMPLATE_ADMIN,
  DOCUMENTATION_INQUIRY_TEMPLATE_CONFIRMATION,
  sendDocumentationInquiryTemplatedEmail,
} from "@/lib/email/sendDocumentationInquiryEmail"
import { splitSubmitterName } from "@/lib/service-inquiries/service-inquiry-pdf-types"

type QuestionRow = {
  id: string
  question_text: string
  field_type: string
  order_index: number
}

export async function trySendDocumentationInquiryEmails(params: {
  inquiryId: string
  submitterName: string
  submitterEmail: string
  questions: QuestionRow[]
  answersByQuestionId: Map<string, string>
}): Promise<void> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(
      `[EMAIL] Documentation inquiry emails skipped (DISABLE_EMAILS) inquiryId=${params.inquiryId}`,
    )
    return
  }

  const adminEmailRaw = process.env.ADMIN_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? ""
  const adminEmail = adminEmailRaw.trim()

  const submittedAt = new Date()
  const submittedAtLabel = submittedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  })

  const pdfInput = buildDocumentationInquiryPdfInput({
    inquiryId: params.inquiryId,
    submittedAtLabel,
    submitterName: params.submitterName,
    submitterEmail: params.submitterEmail,
    questions: params.questions,
    answersByQuestionId: params.answersByQuestionId,
  })

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateDocumentationInquiryPdf(pdfInput)
  } catch (pdfErr) {
    console.error("[EMAIL] Documentation inquiry PDF generation failed", pdfErr)
    return
  }

  const pdfFileName = buildDocumentationInquiryPdfFileName(params.submitterName, submittedAt)

  const { firstName } = splitSubmitterName(params.submitterName)
  const firstNameDisplay = firstName || params.submitterName

  const sharedModel: Record<string, unknown> = {
    first_name: firstNameDisplay,
    submitter_name: params.submitterName,
    submitter_email: params.submitterEmail,
    inquiry_id: params.inquiryId,
    submitted_date: submittedAtLabel,
  }

  const adminModel: Record<string, unknown> = {
    ...sharedModel,
    is_admin: "yes",
  }

  const confirmationModel: Record<string, unknown> = {
    ...sharedModel,
    is_admin: "",
  }

  try {
    if (adminEmail) {
      await sendDocumentationInquiryTemplatedEmail({
        to: adminEmail,
        templateAlias: DOCUMENTATION_INQUIRY_TEMPLATE_ADMIN,
        templateModel: adminModel,
        pdfBytes,
        pdfFileName,
      })
      console.log("[EMAIL] Sent documentation inquiry admin notification", {
        inquiryId: params.inquiryId,
      })
    } else {
      console.warn(
        "[EMAIL] ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL not set; skipping documentation admin email",
      )
    }

    await sendDocumentationInquiryTemplatedEmail({
      to: params.submitterEmail,
      templateAlias: DOCUMENTATION_INQUIRY_TEMPLATE_CONFIRMATION,
      templateModel: confirmationModel,
      pdfBytes,
      pdfFileName,
    })
    console.log("[EMAIL] Sent documentation inquiry confirmation", {
      inquiryId: params.inquiryId,
    })
  } catch (e) {
    console.error("[EMAIL] Failed to send documentation inquiry emails", e)
  }
}
