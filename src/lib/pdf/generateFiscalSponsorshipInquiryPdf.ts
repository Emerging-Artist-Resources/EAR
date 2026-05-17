import { generateServiceInquiryPdf } from "@/lib/pdf/generateServiceInquiryPdf"
import type { FiscalSponsorshipInquiryPdfInput } from "@/lib/service-inquiries/fiscal-sponsorship-inquiry-pdf-model"
import { buildServiceInquiryPdfFileName } from "@/lib/service-inquiries/service-inquiry-pdf-types"

const FISCAL_SPONSORSHIP_PDF_TITLE = "Fiscal sponsorship inquiry"
const FISCAL_SPONSORSHIP_PDF_PREFIX = "Fiscal-Sponsorship-Inquiry"

export function buildFiscalSponsorshipInquiryPdfFileName(
  submitterName: string,
  submittedAt: Date,
): string {
  return buildServiceInquiryPdfFileName(FISCAL_SPONSORSHIP_PDF_PREFIX, submitterName, submittedAt)
}

export async function generateFiscalSponsorshipInquiryPdf(
  input: FiscalSponsorshipInquiryPdfInput,
): Promise<Uint8Array> {
  return generateServiceInquiryPdf({
    documentTitle: FISCAL_SPONSORSHIP_PDF_TITLE,
    ...input,
  })
}
