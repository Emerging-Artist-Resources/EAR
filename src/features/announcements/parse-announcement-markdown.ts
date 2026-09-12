import { linkifyText } from "@/lib/text/linkify-text"
import { normalizeAnnouncementUrl } from "@/features/announcements/announcement-urls"

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] }

export type HeadingLevel = 1 | 2 | 3 | 4

export type BlockNode =
  | { type: "paragraph"; lines: InlineNode[][] }
  | { type: "heading"; level: HeadingLevel; children: InlineNode[] }
  | { type: "ul"; items: InlineNode[][] }
  | { type: "ol"; items: InlineNode[][] }
  | { type: "spacer"; count: number }

/** Copy for admin fields that accept announcement markdown. */
export const ANNOUNCEMENT_MARKDOWN_HINT =
  "Use **bold**, *italic*, headings (# to ####), and dash or numbered lists. Paste stays plain text — add the marks here."

export const ANNOUNCEMENT_MARKDOWN_PLACEHOLDER =
  "# Workshop details\n**Bold**, *italic*, and lists:\n- Who can apply\n- How to submit\n\nURLs become links automatically."

export const ANNOUNCEMENT_MARKDOWN_SHORT_PLACEHOLDER =
  "One or two sentences. **Bold**, *italic*, headings, and lists work here too."

const UL_LINE = /^\s*[-*+]\s+(.*)$/
const OL_LINE = /^\s*\d+\.\s+(.*)$/
const HEADING_LINE = /^\s{0,3}(#{1,4})(?:\s+(.*?))?\s*$/
const MD_LINK = /^\[([^\]]+)\]\(([^)]+)\)/

export function sanitizeAnnouncementHref(href: string): string | null {
  const trimmed = href.trim()
  if (!trimmed) return null

  if (trimmed.toLowerCase().startsWith("mailto:")) {
    const email = trimmed.slice("mailto:".length).trim()
    if (!email.includes("@") || email.includes(" ")) return null
    return `mailto:${email}`
  }

  return normalizeAnnouncementUrl(trimmed)
}

function linkifyToInline(text: string): InlineNode[] {
  return linkifyText(text).map((segment) => {
    if (segment.type === "text") {
      return { type: "text", value: segment.value }
    }
    return {
      type: "link",
      href: segment.href,
      children: [{ type: "text", value: segment.label }],
    }
  })
}

function findClosing(input: string, from: number, marker: string): number {
  let index = from
  while (index < input.length) {
    if (marker === "*" && input.startsWith("**", index)) {
      index += 2
      continue
    }
    if (input.startsWith(marker, index)) return index
    index += 1
  }
  return -1
}

export function parseAnnouncementInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let buffer = ""
  let index = 0

  const flush = () => {
    if (!buffer) return
    nodes.push(...linkifyToInline(buffer))
    buffer = ""
  }

  while (index < input.length) {
    if (input.startsWith("**", index)) {
      const close = input.indexOf("**", index + 2)
      if (close > index + 2) {
        flush()
        nodes.push({
          type: "strong",
          children: parseAnnouncementInline(input.slice(index + 2, close)),
        })
        index = close + 2
        continue
      }
    }

    if (input[index] === "*" && input[index + 1] !== "*") {
      const close = findClosing(input, index + 1, "*")
      if (close > index + 1) {
        flush()
        nodes.push({
          type: "em",
          children: parseAnnouncementInline(input.slice(index + 1, close)),
        })
        index = close + 1
        continue
      }
    }

    if (input[index] === "[") {
      const match = input.slice(index).match(MD_LINK)
      const href = match ? sanitizeAnnouncementHref(match[2]) : null
      if (match && href) {
        flush()
        nodes.push({
          type: "link",
          href,
          children: parseAnnouncementInline(match[1]),
        })
        index += match[0].length
        continue
      }
    }

    buffer += input[index]
    index += 1
  }

  flush()
  return nodes
}

export function parseAnnouncementHeading(line: string): { level: HeadingLevel; text: string } | null {
  const match = line.match(HEADING_LINE)
  if (!match) return null
  const text = (match[2] ?? "").replace(/\s+#+\s*$/, "").trim()
  if (!text) return null
  return { level: match[1].length as HeadingLevel, text }
}

function isBlockStart(line: string): boolean {
  return Boolean(parseAnnouncementHeading(line) || UL_LINE.test(line) || OL_LINE.test(line))
}

function takeList(
  lines: string[],
  start: number,
  pattern: RegExp
): { items: string[]; nextIndex: number } | null {
  const first = lines[start].match(pattern)
  if (!first) return null

  const items = [first[1]]
  let index = start + 1

  while (index < lines.length) {
    if (lines[index].trim() === "") {
      const next = lines[index + 1]
      if (next && pattern.test(next)) {
        index += 1
        continue
      }
      break
    }
    const item = lines[index].match(pattern)
    if (!item) break
    items.push(item[1])
    index += 1
  }

  return { items, nextIndex: index }
}

function consumeBlankLines(lines: string[], start: number): number {
  let index = start
  while (index < lines.length && lines[index].trim() === "") {
    index += 1
  }
  return index
}

export function parseAnnouncementMarkdown(source: string): BlockNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n")
  const blocks: BlockNode[] = []
  let index = 0

  while (index < lines.length) {
    if (lines[index].trim() === "") {
      const nextIndex = consumeBlankLines(lines, index)
      // One blank line separates blocks; additional blank lines stay as space.
      const extraBlanks = nextIndex - index - 1
      const betweenBlocks = blocks.length > 0 && nextIndex < lines.length
      if (betweenBlocks && extraBlanks > 0) {
        blocks.push({ type: "spacer", count: extraBlanks })
      }
      index = nextIndex
      continue
    }

    const heading = parseAnnouncementHeading(lines[index])
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading.level,
        children: parseAnnouncementInline(heading.text),
      })
      index += 1
      continue
    }

    const unordered = takeList(lines, index, UL_LINE)
    if (unordered) {
      blocks.push({
        type: "ul",
        items: unordered.items.map(parseAnnouncementInline),
      })
      index = unordered.nextIndex
      continue
    }

    const ordered = takeList(lines, index, OL_LINE)
    if (ordered) {
      blocks.push({
        type: "ol",
        items: ordered.items.map(parseAnnouncementInline),
      })
      index = ordered.nextIndex
      continue
    }

    const paragraphLines = [lines[index]]
    index += 1
    while (index < lines.length && lines[index].trim() !== "" && !isBlockStart(lines[index])) {
      paragraphLines.push(lines[index])
      index += 1
    }

    blocks.push({
      type: "paragraph",
      lines: paragraphLines.map(parseAnnouncementInline),
    })
  }

  return blocks
}
