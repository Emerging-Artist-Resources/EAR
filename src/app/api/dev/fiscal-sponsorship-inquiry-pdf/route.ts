import { NextResponse } from "next/server"
import { buildFiscalSponsorshipInquiryPdfSample } from "@/lib/pdf/fiscal-sponsorship-inquiry-pdf-sample"
import { generateFiscalSponsorshipInquiryPdf } from "@/lib/pdf/generateFiscalSponsorshipInquiryPdf"

/**
 * Dev-only PDF preview. Open while `npm run dev` is running:
 * http://localhost:3001/api/dev/fiscal-sponsorship-inquiry-pdf
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 })
  }

  const pdfBytes = await generateFiscalSponsorshipInquiryPdf(buildFiscalSponsorshipInquiryPdfSample())

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="fiscal-sponsorship-inquiry-preview.pdf"',
      "Cache-Control": "no-store",
    },
  })
}
