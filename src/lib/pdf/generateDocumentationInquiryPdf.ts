import { generateServiceInquiryPdf } from "@/lib/pdf/generateServiceInquiryPdf"
import type { DocumentationInquiryPdfInput } from "@/lib/service-inquiries/documentation-inquiry-pdf-model"
import { buildServiceInquiryPdfFileName } from "@/lib/service-inquiries/service-inquiry-pdf-types"

const DOCUMENTATION_PDF_TITLE = "Photography & Videography Inquiry"
const DOCUMENTATION_PDF_PREFIX = "Documentation-Inquiry"

export function buildDocumentationInquiryPdfFileName(
  submitterName: string,
  submittedAt: Date,
): string {
  return buildServiceInquiryPdfFileName(DOCUMENTATION_PDF_PREFIX, submitterName, submittedAt)
}

export async function generateDocumentationInquiryPdf(
  input: DocumentationInquiryPdfInput,
): Promise<Uint8Array> {
  return generateServiceInquiryPdf({
    documentTitle: DOCUMENTATION_PDF_TITLE,
    ...input,
  })
}
