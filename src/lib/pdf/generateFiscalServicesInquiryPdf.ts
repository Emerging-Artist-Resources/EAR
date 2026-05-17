import { generateServiceInquiryPdf } from "@/lib/pdf/generateServiceInquiryPdf"
import type { FiscalServicesInquiryPdfInput } from "@/lib/service-inquiries/fiscal-services-inquiry-pdf-model"
import { buildServiceInquiryPdfFileName } from "@/lib/service-inquiries/service-inquiry-pdf-types"

const FISCAL_SERVICES_PDF_TITLE = "Fiscal Services Inquiry"
const FISCAL_SERVICES_PDF_PREFIX = "Fiscal-Service-Inquiry"

export function buildFiscalServicesInquiryPdfFileName(
  submitterName: string,
  submittedAt: Date,
): string {
  return buildServiceInquiryPdfFileName(FISCAL_SERVICES_PDF_PREFIX, submitterName, submittedAt)
}

export async function generateFiscalServicesInquiryPdf(
  input: FiscalServicesInquiryPdfInput,
): Promise<Uint8Array> {
  return generateServiceInquiryPdf({
    documentTitle: FISCAL_SERVICES_PDF_TITLE,
    ...input,
  })
}
