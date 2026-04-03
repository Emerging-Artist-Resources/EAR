import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export type GenerateDonationPdfInput = {
  donorName: string
  artistDisplayName: string
  amountCents: number
  dateLabel: string
  donationId?: string
}

export async function generateDonationPdf(input: GenerateDonationPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792])
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const amount = (input.amountCents / 100).toFixed(2)
  const lines: string[] = [
    "Donation summary",
    "",
    `Donor: ${input.donorName}`,
    `Artist / recipient: ${input.artistDisplayName}`,
    `Amount: $${amount}`,
    `Date: ${input.dateLabel}`,
  ]
  if (input.donationId) {
    lines.push("", `Reference: ${input.donationId}`)
  }

  let y = 750
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= 18
  }

  return doc.save()
}
