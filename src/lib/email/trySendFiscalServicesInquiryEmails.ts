import { buildFiscalServicesInquiryPdfInput } from "@/lib/service-inquiries/fiscal-services-inquiry-pdf-model"
import {
  buildFiscalServicesInquiryPdfFileName,
  generateFiscalServicesInquiryPdf,
} from "@/lib/pdf/generateFiscalServicesInquiryPdf"
import {
  FISCAL_SERVICES_INQUIRY_TEMPLATE_ADMIN,
  FISCAL_SERVICES_INQUIRY_TEMPLATE_CONFIRMATION,
  sendFiscalServicesInquiryTemplatedEmail,
} from "@/lib/email/sendFiscalServicesInquiryEmail"
import {
  formatPostmarkTo,
  getServiceNotificationRecipients,
  serviceNotificationRecipientsEnvName,
} from "@/lib/email/service-notification-recipients"
import { splitSubmitterName } from "@/lib/service-inquiries/service-inquiry-pdf-types"

type QuestionRow = {
  id: string
  question_text: string
  field_type: string
  order_index: number
}

export async function trySendFiscalServicesInquiryEmails(params: {
  inquiryId: string
  submitterName: string
  submitterEmail: string
  questions: QuestionRow[]
  answersByQuestionId: Map<string, string>
}): Promise<void> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(
      `[EMAIL] Fiscal services inquiry emails skipped (DISABLE_EMAILS) inquiryId=${params.inquiryId}`,
    )
    return
  }

  const adminRecipients = getServiceNotificationRecipients("fiscal-services")
  const adminTo = formatPostmarkTo(adminRecipients)

  const submittedAt = new Date()
  const submittedAtLabel = submittedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  })

  const pdfInput = buildFiscalServicesInquiryPdfInput({
    inquiryId: params.inquiryId,
    submittedAtLabel,
    submitterName: params.submitterName,
    submitterEmail: params.submitterEmail,
    questions: params.questions,
    answersByQuestionId: params.answersByQuestionId,
  })

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generateFiscalServicesInquiryPdf(pdfInput)
  } catch (pdfErr) {
    console.error("[EMAIL] Fiscal services inquiry PDF generation failed", pdfErr)
    return
  }

  const pdfFileName = buildFiscalServicesInquiryPdfFileName(params.submitterName, submittedAt)

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
    if (adminTo) {
      await sendFiscalServicesInquiryTemplatedEmail({
        to: adminTo,
        templateAlias: FISCAL_SERVICES_INQUIRY_TEMPLATE_ADMIN,
        templateModel: adminModel,
        pdfBytes,
        pdfFileName,
      })
      console.log("[EMAIL] Sent fiscal services inquiry admin notification", {
        inquiryId: params.inquiryId,
      })
    } else {
      console.warn(
        `[EMAIL] ${serviceNotificationRecipientsEnvName("fiscal-services")} (or ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL) not set; skipping fiscal services admin email`,
      )
    }

    await sendFiscalServicesInquiryTemplatedEmail({
      to: params.submitterEmail,
      templateAlias: FISCAL_SERVICES_INQUIRY_TEMPLATE_CONFIRMATION,
      templateModel: confirmationModel,
      pdfBytes,
      pdfFileName,
    })
    console.log("[EMAIL] Sent fiscal services inquiry confirmation", {
      inquiryId: params.inquiryId,
    })
  } catch (e) {
    console.error("[EMAIL] Failed to send fiscal services inquiry emails", e)
  }
}
