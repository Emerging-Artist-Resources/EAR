import { readFile } from "fs/promises"
import path from "path"
import fontkit from "@pdf-lib/fontkit"
import type { PDFFont, PDFPage } from "pdf-lib"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { EAR_PDF_LOGO_TITLE_GAP, embedEarPdfLogo, scaleEarPdfLogoSize } from "@/lib/pdf/ear-pdf-logo"
import type {
  ServiceInquiryPdfFieldRow,
  ServiceInquiryPdfInput,
} from "@/lib/service-inquiries/service-inquiry-pdf-types"

const PAGE_W = 612
const PAGE_H = 792
const PAD_X = 56
const PAD_Y = 48
const CONTENT_X = PAD_X
const CONTENT_W = PAGE_W - PAD_X * 2
const LABEL_COL_W = 180
const COL_GAP = 104
const VALUE_X = CONTENT_X + LABEL_COL_W + COL_GAP
const VALUE_MAX_W = CONTENT_X + CONTENT_W - VALUE_X
const FOOTER_Y = PAD_Y + 20
const BOTTOM_MIN_Y = FOOTER_Y

const CONTINUATION_TOP_PAD = 28
const ROW_GAP = 18
const SECTION_GAP_TOP = 24
const SECTION_PAD_TOP = 12
const SECTION_TITLE_GAP_FIRST = 6
const SECTION_TITLE_GAP = 10
const SECTION_TITLE_AFTER = 12
const LONG_BOX_PAD = 16
const BULLET_CONT_INDENT = 12

const TYPE = {
  title: 27,
  meta: 10,
  section: 13,
  label: 10,
  value: 11,
  footer: 8,
} as const

const color = {
  text: rgb(0.067, 0.067, 0.067),
  muted: rgb(0.467, 0.467, 0.467),
  faint: rgb(0.55, 0.55, 0.55),
  rule: rgb(0.898, 0.898, 0.898),
  longBg: rgb(0.969, 0.969, 0.969),
  pageBg: rgb(0.99, 0.99, 0.99),
}

const MISSING_VALUE = "—"

function valueForDisplay(value: string): string {
  return value.trim() || MISSING_VALUE
}

function wrapLines(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text.trim()) return [MISSING_VALUE]
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
      if (line) lines.push(line)
      let rest = word
      while (rest.length > 0 && font.widthOfTextAtSize(rest, fontSize) > maxWidth) {
        let cut = rest.length
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), fontSize) > maxWidth) cut--
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      line = rest
    }
    if (line) lines.push(line)
    if (words.length === 0 && para === "") lines.push("")
  }
  return lines.length > 0 ? lines : [MISSING_VALUE]
}

async function embedFonts(doc: PDFDocument, mode: "noto" | "standard") {
  if (mode === "noto") {
    doc.registerFontkit(fontkit)
    const regPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
    const boldPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf")
    const [regBytes, boldBytes] = await Promise.all([readFile(regPath), readFile(boldPath)])
    return {
      regular: await doc.embedFont(regBytes, { subset: true }),
      bold: await doc.embedFont(boldBytes, { subset: true }),
    }
  }
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  }
}

type Layout = {
  contentX: number
  contentW: number
  labelColW: number
  valueX: number
  valueMaxW: number
}

const PAGE_LAYOUT: Layout = {
  contentX: CONTENT_X,
  contentW: CONTENT_W,
  labelColW: LABEL_COL_W,
  valueX: VALUE_X,
  valueMaxW: VALUE_MAX_W,
}

type DrawCtx = {
  doc: PDFDocument
  page: PDFPage
  regular: PDFFont
  bold: PDFFont
  y: number
  layout: Layout
}

function continuationContentTopY(): number {
  return PAGE_H - PAD_Y - CONTINUATION_TOP_PAD
}

function ensureSpace(ctx: DrawCtx, needed: number): DrawCtx {
  if (ctx.y - needed >= BOTTOM_MIN_Y) return ctx
  const page = ctx.doc.addPage([PAGE_W, PAGE_H])
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: color.pageBg,
  })
  return { ...ctx, page, y: continuationContentTopY() }
}

function drawLabelColumn(
  page: PDFPage,
  lines: string[],
  x: number,
  topY: number,
  font: PDFFont,
  lineH: number,
) {
  let y = topY
  for (const line of lines) {
    page.drawText(line, { x, y, size: TYPE.label, font, color: color.muted })
    y -= lineH
  }
}

function drawValueLines(
  page: PDFPage,
  lines: string[],
  x: number,
  topY: number,
  font: PDFFont,
  lineH: number,
  size = TYPE.value,
) {
  let y = topY
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color: color.text })
    y -= lineH
  }
  return y
}

function measureBullets(items: string[], font: PDFFont, maxWidth: number): number {
  const lineH = TYPE.value * 1.6
  let total = 0
  for (const item of items) {
    const lines = wrapLines(`• ${item}`, font, TYPE.value, maxWidth)
    total += lines.length * lineH
  }
  return total
}

function drawBullets(ctx: DrawCtx, items: string[], x: number, topY: number, maxWidth: number): number {
  const lineH = TYPE.value * 1.6
  let y = topY

  for (const item of items) {
    const lines = wrapLines(`• ${item}`, ctx.regular, TYPE.value, maxWidth)
    for (let i = 0; i < lines.length; i++) {
      const lineX = i === 0 ? x : x + BULLET_CONT_INDENT
      ctx.page.drawText(lines[i]!, {
        x: lineX,
        y,
        size: TYPE.value,
        font: ctx.regular,
        color: color.text,
      })
      y -= lineH
    }
  }

  return y
}

function drawLongValueBox(
  ctx: DrawCtx,
  lines: string[],
  x: number,
  topY: number,
  width: number,
): number {
  const lineH = TYPE.value * 1.6
  const innerH = lines.length * lineH
  const boxH = innerH + LONG_BOX_PAD * 2
  const boxBottom = topY - boxH + LONG_BOX_PAD

  ctx.page.drawRectangle({
    x,
    y: boxBottom,
    width,
    height: boxH,
    color: color.longBg,
    borderColor: color.rule,
    borderWidth: 0.4,
  })

  drawValueLines(ctx.page, lines, x + LONG_BOX_PAD, topY - LONG_BOX_PAD, ctx.regular, lineH)
  return boxBottom - 4
}

function drawDefaultRow(ctx: DrawCtx, field: ServiceInquiryPdfFieldRow): DrawCtx {
  const { contentX, labelColW, valueX, valueMaxW } = ctx.layout
  const labelLines = wrapLines(field.label, ctx.regular, TYPE.label, labelColW)
  const valueLines = wrapLines(valueForDisplay(field.value), ctx.regular, TYPE.value, valueMaxW)
  const labelLineH = TYPE.label * 1.4
  const valueLineH = TYPE.value * 1.6
  const blockH =
    Math.max(labelLines.length * labelLineH, valueLines.length * valueLineH) + ROW_GAP + 4

  let next = ensureSpace(ctx, blockH)
  const topY = next.y

  drawLabelColumn(next.page, labelLines, contentX, topY, next.regular, labelLineH)
  const valueBottom = drawValueLines(next.page, valueLines, valueX, topY, next.regular, valueLineH)

  const labelBottom = topY - labelLines.length * labelLineH
  next.y = Math.min(labelBottom, valueBottom) - ROW_GAP
  return next
}

function drawMultiselectRow(ctx: DrawCtx, field: ServiceInquiryPdfFieldRow): DrawCtx {
  const { contentX, labelColW, valueX, valueMaxW } = ctx.layout
  const items = (field.multiselectItems ?? []).map((item) => valueForDisplay(item))
  if (items.length === 0) {
    return drawDefaultRow(ctx, { ...field, variant: undefined, value: MISSING_VALUE })
  }
  const labelLines = wrapLines(field.label, ctx.regular, TYPE.label, labelColW)
  const labelLineH = TYPE.label * 1.4
  const bulletsH = measureBullets(items, ctx.regular, valueMaxW)
  const blockH = Math.max(labelLines.length * labelLineH, bulletsH) + ROW_GAP + 4

  let next = ensureSpace(ctx, blockH)
  const topY = next.y

  drawLabelColumn(next.page, labelLines, contentX, topY, next.regular, labelLineH)
  const bulletsBottom = drawBullets(next, items, valueX, topY, valueMaxW)

  const labelBottom = topY - labelLines.length * labelLineH
  next.y = Math.min(labelBottom, bulletsBottom) - ROW_GAP
  return next
}

function drawLongRow(ctx: DrawCtx, field: ServiceInquiryPdfFieldRow): DrawCtx {
  const { contentX, contentW } = ctx.layout
  const labelLines = wrapLines(field.label, ctx.regular, TYPE.label, contentW)
  const valueLines = wrapLines(
    valueForDisplay(field.value),
    ctx.regular,
    TYPE.value,
    contentW - LONG_BOX_PAD * 2,
  )
  const labelLineH = TYPE.label * 1.4
  const valueLineH = TYPE.value * 1.6
  const boxH = valueLines.length * valueLineH + LONG_BOX_PAD * 2
  const blockH = labelLines.length * labelLineH + 8 + boxH + ROW_GAP

  let next = ensureSpace(ctx, blockH)
  let y = next.y

  for (const line of labelLines) {
    next.page.drawText(line, {
      x: contentX,
      y,
      size: TYPE.label,
      font: next.regular,
      color: color.muted,
    })
    y -= labelLineH
  }

  y -= 8
  y = drawLongValueBox(next, valueLines, contentX, y, contentW)
  next.y = y - ROW_GAP
  return next
}

function drawFieldRow(ctx: DrawCtx, field: ServiceInquiryPdfFieldRow): DrawCtx {
  if (field.variant === "long") return drawLongRow(ctx, field)
  if (field.variant === "multiselect") return drawMultiselectRow(ctx, field)
  return drawDefaultRow(ctx, field)
}

function drawSectionDivider(ctx: DrawCtx): DrawCtx {
  const next = ensureSpace(ctx, SECTION_GAP_TOP + SECTION_PAD_TOP + 8)
  next.y -= SECTION_GAP_TOP
  const lineY = next.y
  next.page.drawLine({
    start: { x: CONTENT_X, y: lineY },
    end: { x: CONTENT_X + CONTENT_W, y: lineY },
    thickness: 0.75,
    color: color.rule,
  })
  next.y = lineY - SECTION_PAD_TOP
  return next
}

function drawSection(
  ctx: DrawCtx,
  title: string,
  rows: ServiceInquiryPdfFieldRow[],
  isFirst: boolean,
): DrawCtx {
  let next = ctx
  if (!isFirst) next = drawSectionDivider(next)

  const titleGap = isFirst ? SECTION_TITLE_GAP_FIRST : SECTION_TITLE_GAP
  const titleLineH = TYPE.section * 1.4
  next.y -= titleGap
  next = ensureSpace(next, titleLineH + SECTION_TITLE_AFTER)

  next.page.drawText(title, {
    x: CONTENT_X,
    y: next.y,
    size: TYPE.section,
    font: next.bold,
    color: color.text,
  })
  next.y -= titleLineH + SECTION_TITLE_AFTER

  for (const field of rows) {
    next = drawFieldRow(next, field)
  }

  return next
}

async function buildPdf(input: ServiceInquiryPdfInput, fontMode: "noto" | "standard"): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { regular, bold } = await embedFonts(doc, fontMode)
  let page = doc.addPage([PAGE_W, PAGE_H])
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: color.pageBg })

  let y = PAGE_H - PAD_Y

  const logo = await embedEarPdfLogo(doc)
  if (logo) {
    const { width: logoW, height: logoH } = scaleEarPdfLogoSize(logo)
    const logoBottom = y - logoH
    page.drawImage(logo, { x: CONTENT_X, y: logoBottom, width: logoW, height: logoH })
    y = logoBottom - EAR_PDF_LOGO_TITLE_GAP
  }

  page.drawText(input.documentTitle, {
    x: CONTENT_X,
    y,
    size: TYPE.title,
    font: bold,
    color: color.text,
  })
  y -= TYPE.title * 1.15

  const metaLines = [
    "Submitted responses",
    `Reference: ${input.inquiryId}`,
    `Submitted: ${input.submittedAtLabel}`,
    `Contact: ${input.submitterName} · ${input.submitterEmail}`,
  ]
  const metaLineH = TYPE.meta * 1.6
  for (const line of metaLines) {
    page.drawText(line, {
      x: CONTENT_X,
      y,
      size: TYPE.meta,
      font: regular,
      color: color.muted,
    })
    y -= metaLineH
  }

  y -= 10
  page.drawLine({
    start: { x: CONTENT_X, y: y + 6 },
    end: { x: CONTENT_X + CONTENT_W, y: y + 6 },
    thickness: 0.75,
    color: color.rule,
  })
  y -= 14

  let ctx: DrawCtx = { doc, page, regular, bold, y, layout: PAGE_LAYOUT }

  input.sections.forEach((section, index) => {
    ctx = drawSection(ctx, section.title, section.rows, index === 0)
  })

  ctx.page.drawText("Emerging Artist Resources", {
    x: CONTENT_X,
    y: FOOTER_Y,
    size: TYPE.footer,
    font: ctx.regular,
    color: color.faint,
  })

  return doc.save()
}

export async function generateServiceInquiryPdf(input: ServiceInquiryPdfInput): Promise<Uint8Array> {
  try {
    return await buildPdf(input, "noto")
  } catch (notoErr) {
    console.warn("Service inquiry PDF: Noto failed, using Helvetica", { error: notoErr })
    return await buildPdf(input, "standard")
  }
}
