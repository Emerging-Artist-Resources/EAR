import { isValidHttpUrl, normalizeUserEnteredUrl } from "@/lib/validations/flexible-url"

export type LinkifiedSegment =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string }
  | { type: "email"; href: string; label: string }

type MatchCandidate = {
  start: number
  end: number
  kind: "url" | "email"
  raw: string
}

/** http(s) URLs and bare domains like example.com/path */
const URL_PATTERN =
  /(?:https?:\/\/[^\s<>"']+|(?:www\.)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?::\d+)?(?:\/[^\s<>"']*)?|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?::\d+)?(?:\/[^\s<>"']*)?)/gi

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

const TRAILING_PUNCTUATION = /[.,;:!?)}\]"']+$/

function stripTrailingPunctuation(raw: string): { core: string; trailing: string } {
  const match = raw.match(TRAILING_PUNCTUATION)
  if (!match) return { core: raw, trailing: "" }
  const trailing = match[0]
  return { core: raw.slice(0, raw.length - trailing.length), trailing }
}

function stripLeadingWrapper(raw: string): { core: string; leading: string } {
  if (raw.startsWith("(") && raw.endsWith(")")) {
    return { core: raw.slice(1, -1), leading: "(" }
  }
  if (raw.startsWith("<") && raw.endsWith(">")) {
    return { core: raw.slice(1, -1), leading: "<" }
  }
  return { core: raw, leading: "" }
}

function toSafeHttpLink(raw: string): { href: string; label: string } | null {
  const { core: unwrapped, leading } = stripLeadingWrapper(raw)
  const { core, trailing } = stripTrailingPunctuation(unwrapped)
  const candidate = core.trim()
  if (!candidate) return null

  const href = normalizeUserEnteredUrl(candidate)
  if (!isValidHttpUrl(href)) return null

  return {
    href,
    label: leading + candidate + trailing,
  }
}

function toEmailLink(raw: string): { href: string; label: string } | null {
  const { core, trailing } = stripTrailingPunctuation(raw)
  const candidate = core.trim()
  if (!candidate || !candidate.includes("@")) return null

  return {
    href: `mailto:${candidate}`,
    label: candidate + trailing,
  }
}

function collectMatches(text: string): MatchCandidate[] {
  const matches: MatchCandidate[] = []

  for (const match of text.matchAll(URL_PATTERN)) {
    if (match.index === undefined) continue
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      kind: "url",
      raw: match[0],
    })
  }

  for (const match of text.matchAll(EMAIL_PATTERN)) {
    if (match.index === undefined) continue
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      kind: "email",
      raw: match[0],
    })
  }

  return matches.sort((a, b) => a.start - b.start || b.end - a.end)
}

function selectNonOverlappingMatches(matches: MatchCandidate[]): MatchCandidate[] {
  const selected: MatchCandidate[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start < cursor) continue
    selected.push(match)
    cursor = match.end
  }

  return selected
}

/** Split plain text into display segments with safe http(s) and mailto links. */
export function linkifyText(text: string): LinkifiedSegment[] {
  if (!text) return [{ type: "text", value: "" }]

  const matches = selectNonOverlappingMatches(collectMatches(text))
  if (matches.length === 0) return [{ type: "text", value: text }]

  const segments: LinkifiedSegment[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, match.start) })
    }

    const link =
      match.kind === "url" ? toSafeHttpLink(match.raw) : toEmailLink(match.raw)

    if (link) {
      segments.push({
        type: match.kind === "url" ? "link" : "email",
        href: link.href,
        label: link.label,
      })
    } else {
      segments.push({ type: "text", value: text.slice(match.start, match.end) })
    }

    cursor = match.end
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) })
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }]
}
