import { readFile } from "fs/promises"
import path from "path"
import fontkit from "@pdf-lib/fontkit"
import type { PDFFont } from "pdf-lib"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export type GenerateDonationPdfInput = {
  donorName: string
  donorEmail?: string
  artistDisplayName: string
  amountCents: number
  dateLabel: string
  donationId?: string
  /** Optional donor note; empty / whitespace shows as "—". */
  donorMessage?: string
  /** Artist-bound donations only: whether the donor opted to cover fiscal / card fees. */
  feeCoverage?: { coverFiscalFee: boolean; coverCardFee: boolean }
}

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 50
const LABEL_X = MARGIN
/** Start of value column — wide enough that long labels (e.g. fee rows) do not overlap values. */
const VALUE_X = 230
const LABEL_WRAP_MAX_W = VALUE_X - LABEL_X - 10
const VALUE_MAX_W = PAGE_W - MARGIN - VALUE_X
const MESSAGE_LINE_H = 13
const MESSAGE_SIZE = 10
const MESSAGE_MAX_LINES = 36

const color = {
  text: rgb(0.12, 0.12, 0.12),
  muted: rgb(0.44, 0.44, 0.44),
  faint: rgb(0.55, 0.55, 0.55),
  rule: rgb(0.86, 0.86, 0.86),
  amountBg: rgb(0.98, 0.98, 0.99),
}

/** Word-wrap for receipt message (newlines preserved; long words split if needed). */
function wrapMessageLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const pushHardBroken = (w: string) => {
    let rest = w
    while (rest.length > 0 && font.widthOfTextAtSize(rest, fontSize) > maxWidth) {
      let cut = rest.length
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), fontSize) > maxWidth) cut--
      if (cut <= 1) cut = 1
      lines.push(rest.slice(0, cut))
      rest = rest.slice(cut)
    }
    return rest
  }

  const paragraphs = text.split(/\r?\n/)
  const lines: string[] = []
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean)
    let line = ""
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        line = candidate
        continue
      }
      if (line) {
        lines.push(line)
        line = pushHardBroken(word)
      } else {
        line = pushHardBroken(word)
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

async function tryLoadEarLogoPng(): Promise<Uint8Array | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "EAR-logo.png")
    return await readFile(logoPath)
  } catch {
    return null
  }
}

async function embedReceiptFonts(
  doc: PDFDocument,
  mode: "noto" | "standard",
): Promise<{ regular: PDFFont; bold: PDFFont }> {
  if (mode === "noto") {
    const regPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
    const boldPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf")
    const [regBytes, boldBytes] = await Promise.all([readFile(regPath), readFile(boldPath)])
    const regular = await doc.embedFont(regBytes, { subset: true })
    const bold = await doc.embedFont(boldBytes, { subset: true })
    return { regular, bold }
  }
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  }
}

/**
 * Strip emoji and reduce to printable ASCII (+ newlines/tabs) for StandardFonts / WinAnsi.
 * Used when Noto embed or draw fails and we re-render with Helvetica.
 */
export function sanitizeDonationPdfInput(input: GenerateDonationPdfInput): GenerateDonationPdfInput {
  const strip = (s: string) => {
    let t = s
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\uFE0F/g, "")
      .replace(/\u200D/g, "")
      .normalize("NFKC")
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2013\u2014\u2015]/g, "-")
      .replace(/\u2026/g, "...")
    return t.replace(/[^\n\r\t\x20-\x7E]/g, "")
  }

  const donorMessage = input.donorMessage?.trim()
  return {
    ...input,
    donorName: strip(input.donorName || ""),
    donorEmail: input.donorEmail ? strip(input.donorEmail) : undefined,
    artistDisplayName: strip(input.artistDisplayName || ""),
    dateLabel: strip(input.dateLabel),
    donationId: input.donationId ? strip(input.donationId) : undefined,
    donorMessage: donorMessage ? strip(donorMessage) : undefined,
    feeCoverage: input.feeCoverage,
  }
}

async function buildDonationPdf(input: GenerateDonationPdfInput, fontMode: "noto" | "standard"): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const page = doc.addPage([PAGE_W, PAGE_H])
  const { regular, bold } = await embedReceiptFonts(doc, fontMode)

  const amount = (input.amountCents / 100).toFixed(2)

  // Start below top margin; decrease y to move down the page.
  let y = PAGE_H - MARGIN

  const logoBytes = await tryLoadEarLogoPng()
  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes)
      const maxH = 54
      const scale = maxH / logo.height
      const w = logo.width * scale
      const h = logo.height * scale
      const imgBottom = y - h
      page.drawImage(logo, { x: LABEL_X, y: imgBottom, width: w, height: h })
      y = imgBottom - 22
    } catch {
      y -= 6
    }
  } else {
    y -= 4
  }

  page.drawText("Donation receipt", {
    x: LABEL_X,
    y,
    size: 20,
    font: bold,
    color: color.text,
  })
  y -= 26

  page.drawText("Fiscally sponsored donation — for your records", {
    x: LABEL_X,
    y,
    size: 9,
    font: regular,
    color: color.muted,
  })
  y -= 20

  page.drawLine({
    start: { x: MARGIN, y: y + 8 },
    end: { x: PAGE_W - MARGIN, y: y + 8 },
    thickness: 0.6,
    color: color.rule,
  })
  y -= 26

  const drawRow = (label: string, value: string, valueSize = 11) => {
    page.drawText(label, {
      x: LABEL_X,
      y,
      size: 9,
      font: regular,
      color: color.muted,
    })
    page.drawText(value, {
      x: VALUE_X,
      y,
      size: valueSize,
      font: regular,
      color: color.text,
    })
    y -= valueSize + 12
  }

  /** Label may wrap; value aligns to the first label line (e.g. long fee titles). */
  const drawRowWrappedLabel = (label: string, value: string, valueSize = 11) => {
    const labelLines = wrapMessageLines(label, regular, 9, LABEL_WRAP_MAX_W)
    const labelLineH = 11
    const topY = y
    let lineY = topY
    for (const line of labelLines) {
      page.drawText(line, {
        x: LABEL_X,
        y: lineY,
        size: 9,
        font: regular,
        color: color.muted,
      })
      lineY -= labelLineH
    }
    page.drawText(value, {
      x: VALUE_X,
      y: topY,
      size: valueSize,
      font: regular,
      color: color.text,
    })
    y = lineY - 12
  }

  drawRow("Donor", input.donorName || "—")
  drawRow("Email", input.donorEmail?.trim() || "—")
  drawRow("Artist / recipient", input.artistDisplayName || "—")
  drawRow("Date", input.dateLabel)
  if (input.donationId) {
    drawRow("Reference", input.donationId, 10)
  }
  if (input.feeCoverage) {
    drawRowWrappedLabel("Cover fiscal sponsorship fee", input.feeCoverage.coverFiscalFee ? "Yes" : "No")
    drawRowWrappedLabel("Cover card processing fee", input.feeCoverage.coverCardFee ? "Yes" : "No")
  }

  const messageRaw = input.donorMessage?.trim() ?? ""
  const messageDisplay = messageRaw.length > 0 ? messageRaw : "—"
  page.drawText("Message", {
    x: LABEL_X,
    y,
    size: 9,
    font: regular,
    color: color.muted,
  })
  if (messageDisplay === "—") {
    page.drawText("—", {
      x: VALUE_X,
      y,
      size: 11,
      font: regular,
      color: color.text,
    })
    y -= 11 + 12
  } else {
    const wrapped = wrapMessageLines(messageDisplay, regular, MESSAGE_SIZE, VALUE_MAX_W)
    const capped = wrapped.slice(0, MESSAGE_MAX_LINES)
    let lineY = y
    for (const line of capped) {
      page.drawText(line, {
        x: VALUE_X,
        y: lineY,
        size: MESSAGE_SIZE,
        font: regular,
        color: color.text,
      })
      lineY -= MESSAGE_LINE_H
    }
    if (wrapped.length > MESSAGE_MAX_LINES) {
      page.drawText("…", {
        x: VALUE_X,
        y: lineY,
        size: MESSAGE_SIZE,
        font: regular,
        color: color.text,
      })
      lineY -= MESSAGE_LINE_H
    }
    y = lineY
    y -= 8
  }

  y -= 6

  const boxBottom = y - 58
  const boxH = 58
  page.drawRectangle({
    x: MARGIN,
    y: boxBottom,
    width: PAGE_W - 2 * MARGIN,
    height: boxH,
    color: color.amountBg,
    borderColor: color.rule,
    borderWidth: 0.8,
  })

  const amountBlockTop = boxBottom + boxH
  page.drawText("Amount", {
    x: LABEL_X + 8,
    y: amountBlockTop - 22,
    size: 9,
    font: regular,
    color: color.muted,
  })
  page.drawText(`$${amount}`, {
    x: VALUE_X,
    y: amountBlockTop - 30,
    size: 24,
    font: bold,
    color: color.text,
  })

  page.drawText("Emerging Artist Resources", {
    x: LABEL_X,
    y: MARGIN + 22,
    size: 8,
    font: regular,
    color: color.faint,
  })
  page.drawText("This document summarizes the donation details included with your notification.", {
    x: LABEL_X,
    y: MARGIN + 10,
    size: 8,
    font: regular,
    color: color.faint,
  })

  return doc.save()
}

/**
 * Full-layout donation receipt: try embedded Noto Sans first (emoji / wide Unicode),
 * then same layout with Helvetica + {@link sanitizeDonationPdfInput}.
 */
export async function generateDonationPdf(input: GenerateDonationPdfInput): Promise<Uint8Array> {
  try {
    return await buildDonationPdf(input, "noto")
  } catch (notoErr) {
    console.warn("Donation PDF: Noto path failed, using Helvetica + sanitized input", { error: notoErr })
    return await buildDonationPdf(sanitizeDonationPdfInput(input), "standard")
  }
}

/** Keep only printable ASCII — safe for StandardFonts / WinAnsi in pdf-lib. */
function toAsciiPrintable(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, "")
}

export type MinimalDonationPdfFallbackInput = {
  amountCents: number
  /** Shown as-is after ASCII sanitization (e.g. formatted date). */
  dateLabel: string
  donationId?: string
}

/**
 * Small one-page PDF when {@link generateDonationPdf} fails entirely.
 * Uses only Helvetica + ASCII-safe dynamic text so encoding cannot throw.
 */
export async function generateMinimalDonationPdfFallback(
  input: MinimalDonationPdfFallbackInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_W, PAGE_H])
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const amount = (input.amountCents / 100).toFixed(2)
  const dateSafe = toAsciiPrintable(input.dateLabel) || "-"
  const refSafe = input.donationId ? toAsciiPrintable(input.donationId) : ""

  let y = PAGE_H - MARGIN

  page.drawText("Donation receipt (summary)", {
    x: LABEL_X,
    y,
    size: 18,
    font: bold,
    color: color.text,
  })
  y -= 28

  const notice =
    "The full receipt PDF could not be generated (for example, unsupported characters in the message). " +
    "Amount and reference below match this notification; see the email for full details."
  const noticeLines = wrapMessageLines(notice, regular, 10, PAGE_W - 2 * MARGIN)
  for (const line of noticeLines) {
    page.drawText(line, {
      x: LABEL_X,
      y,
      size: 10,
      font: regular,
      color: color.muted,
    })
    y -= 13
  }
  y -= 10

  page.drawText("Amount", {
    x: LABEL_X,
    y,
    size: 9,
    font: regular,
    color: color.muted,
  })
  page.drawText(`$${amount}`, {
    x: VALUE_X,
    y,
    size: 20,
    font: bold,
    color: color.text,
  })
  y -= 28

  page.drawText("Date", {
    x: LABEL_X,
    y,
    size: 9,
    font: regular,
    color: color.muted,
  })
  page.drawText(dateSafe, {
    x: VALUE_X,
    y,
    size: 11,
    font: regular,
    color: color.text,
  })
  y -= 22

  if (refSafe) {
    page.drawText("Reference", {
      x: LABEL_X,
      y,
      size: 9,
      font: regular,
      color: color.muted,
    })
    page.drawText(refSafe, {
      x: VALUE_X,
      y,
      size: 10,
      font: regular,
      color: color.text,
    })
    y -= 22
  }

  page.drawText("Emerging Artist Resources", {
    x: LABEL_X,
    y: MARGIN + 14,
    size: 8,
    font: regular,
    color: color.faint,
  })

  return doc.save()
}
