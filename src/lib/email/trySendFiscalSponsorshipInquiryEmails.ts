import {
  buildFiscalSponsorshipInquiryPdfInput,
  splitSubmitterName,
} from "@/lib/service-inquiries/fiscal-sponsorship-inquiry-pdf-model"
import {
  buildFiscalSponsorshipInquiryPdfFileName,
  generateFiscalSponsorshipInquiryPdf,
} from "@/lib/pdf/generateFiscalSponsorshipInquiryPdf"
import {
  FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_ADMIN,
  FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_CONFIRMATION,
  sendFiscalSponsorshipInquiryTemplatedEmail,
} from "@/lib/email/sendFiscalSponsorshipInquiryEmail"
import {
  formatPostmarkTo,
  getServiceNotificationRecipients,
  serviceNotificationRecipientsEnvName,
} from "@/lib/email/service-notification-recipients"

type QuestionRow = {
  id: string
  question_key: string | null
  question_text: string
  field_type: string
  order_index: number
}

export async function trySendFiscalSponsorshipInquiryEmails(params: {
  inquiryId: string
  submitterName: string
  submitterEmail: string
  questions: QuestionRow[]
  answersByQuestionId: Map<string, string>
}): Promise<void> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(
      `[EMAIL] Fiscal sponsorship inquiry emails skipped (DISABLE_EMAILS) inquiryId=${params.inquiryId}`,
    )
    return
  }

  const adminRecipients = getServiceNotificationRecipients("fiscal-sponsorship")
  const adminTo = formatPostmarkTo(adminRecipients)

  const submittedAt = new Date()
  const submittedAtLabel = submittedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  })

  const answersMap = params.answersByQuestionId
  const pdfInput = buildFiscalSponsorshipInquiryPdfInput({
    inquiryId: params.inquiryId,
    submittedAtLabel,
    submitterName: params.submitterName,
    submitterEmail: params.submitterEmail,
    questions: params.questions,
    answersByQuestionId: answersMap,
  })

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateFiscalSponsorshipInquiryPdf(pdfInput)
  } catch (pdfErr) {
    console.error("[EMAIL] Fiscal sponsorship inquiry PDF generation failed", pdfErr)
    return
  }

  const pdfFileName = buildFiscalSponsorshipInquiryPdfFileName(
    params.submitterName,
    submittedAt,
  )

  const { firstName } = splitSubmitterName(params.submitterName)
  const firstNameDisplay = firstName || params.submitterName

  const sharedModel: Record<string, unknown> = {
    first_name: firstNameDisplay,
    submitter_name: params.submitterName,
    submitter_email: params.submitterEmail,
    inquiry_id: params.inquiryId,
    submitted_date: submittedAtLabel,
    artist_project_name: pdfInput.sections[0]?.rows[4]?.value ?? "",
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
    if (adminTo) {
      await sendFiscalSponsorshipInquiryTemplatedEmail({
        to: adminTo,
        templateAlias: FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_ADMIN,
        templateModel: adminModel,
        pdfBytes,
        pdfFileName,
      })
      console.log("[EMAIL] Sent fiscal sponsorship inquiry admin notification", {
        inquiryId: params.inquiryId,
      })
    } else {
      console.warn(
        `[EMAIL] ${serviceNotificationRecipientsEnvName("fiscal-sponsorship")} (or ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL) not set; skipping fiscal sponsorship admin email`,
      )
    }

    await sendFiscalSponsorshipInquiryTemplatedEmail({
      to: params.submitterEmail,
      templateAlias: FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_CONFIRMATION,
      templateModel: confirmationModel,
      pdfBytes,
      pdfFileName,
    })
    console.log("[EMAIL] Sent fiscal sponsorship inquiry confirmation", {
      inquiryId: params.inquiryId,
    })
  } catch (e) {
    console.error("[EMAIL] Failed to send fiscal sponsorship inquiry emails", e)
  }
}
