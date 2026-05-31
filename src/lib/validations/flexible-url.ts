import { z } from "zod"

const HTTP_PREFIX = /^https?:\/\//i
const ANY_SCHEME_PREFIX = /^[a-z][a-z\d+\-.]*:/i
const INVALID_URL_MESSAGE = "Invalid URL"

/**
 * Trim; if non-empty and no http(s) scheme, prefix `https://`.
 * Matches signup “website” behavior so `example.com` validates like `https://example.com`.
 */
export function normalizeUserEnteredUrl(input: string): string {
  const s = input.trim()
  if (s === "") return s
  if (HTTP_PREFIX.test(s)) return s
  // Keep non-http schemes as-is so validation can reject them cleanly.
  if (ANY_SCHEME_PREFIX.test(s)) return s
  return `https://${s}`
}

/** RFC 2606 / obvious non-production hostnames we should not accept as listing URLs. */
const RESERVED_PUBLIC_SUFFIX_STYLE_TLDS = new Set(["test", "invalid", "example"])

/**
 * Hostnames like `dance` or `www.` parse oddly but are not useful public web URLs.
 * Require multi-label DNS shape (domain.tld), valid labels, localhost, or IPv4 literal.
 * IPv6 / bracket hosts: rely on ":" heuristic after URL parsing.
 */
function isLikelyWebHostname(hostname: string): boolean {
  let h = hostname.trim().toLowerCase()
  if (!h) return false
  if (h === "localhost") return true
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h)) return true
  if (h.includes(":")) return true

  // FQDN trailing dot (e.g. example.com.) — normalize for label checks
  h = h.replace(/\.+$/g, "")
  if (!h.includes(".")) return false

  const parts = h.split(".")
  if (parts.some((p) => p.length === 0)) return false
  if (parts.length < 2) return false

  const labelRe = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
  for (const p of parts) {
    if (p.length > 63 || !labelRe.test(p)) return false
  }

  const tld = parts[parts.length - 1]
  if (tld.length < 2) return false
  if (RESERVED_PUBLIC_SUFFIX_STYLE_TLDS.has(tld)) return false

  return true
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    const host = parsed.hostname.trim()
    if (!host) return false
    return isLikelyWebHostname(host)
  } catch {
    return false
  }
}

function preprocessUrlOrEmptyString(raw: unknown): string {
  if (raw === null || raw === undefined) return ""
  const s = String(raw).trim()
  if (s === "") return ""
  return normalizeUserEnteredUrl(s)
}

function preprocessOptionalUrl(raw: unknown): string | undefined {
  if (raw === null || raw === undefined) return undefined
  const s = String(raw).trim()
  if (s === "") return undefined
  return normalizeUserEnteredUrl(s)
}

/** Preserves `undefined` so omitted JSON keys / PATCH fields do not get coerced to `null`. */
function preprocessNullableUrl(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined
  if (raw === null) return null
  const s = String(raw).trim()
  if (s === "") return null
  return normalizeUserEnteredUrl(s)
}

const DEFAULT_INVALID = INVALID_URL_MESSAGE

const httpUrlStringSchema = z
  .string()
  .url(DEFAULT_INVALID)
  .refine(isValidHttpUrl, { message: DEFAULT_INVALID })

const signupHttpUrlStringSchema = z
  .string()
  .url("Enter a valid website URL")
  .refine(isValidHttpUrl, { message: "Enter a valid website URL" })

/** Listing-style optional URL: `""` when cleared; otherwise absolute http(s) after normalize. */
export const flexibleUrlOrEmptySchema = z.preprocess(
  preprocessUrlOrEmptyString,
  z.union([httpUrlStringSchema, z.literal("")])
)

/** Optional field omitted or empty → undefined; otherwise normalized absolute URL. */
export const flexibleUrlOptionalSchema = z.preprocess(
  preprocessOptionalUrl,
  httpUrlStringSchema.optional()
)

/** API / DB style: omitted → undefined; empty string → null; otherwise normalized http(s) URL. */
export const flexibleUrlNullableSchema = z.preprocess(
  preprocessNullableUrl,
  z.union([httpUrlStringSchema, z.null()]).optional()
)

/** Signup account website (same normalize; custom message). */
export const signupOptionalWebsiteSchema = z.preprocess(
  preprocessNullableUrl,
  z.union([signupHttpUrlStringSchema, z.null()]).optional()
)

/** Required URL (e.g. funding link): normalize then URL + min length. */
export function flexibleUrlRequiredSchema(message = DEFAULT_INVALID, requiredMessage = "Link is required") {
  return z.preprocess((raw: unknown) => {
    if (raw === null || raw === undefined) return ""
    return normalizeUserEnteredUrl(String(raw))
  }, z.string().min(1, requiredMessage).url(message).refine(isValidHttpUrl, { message }))
}

/** Profile PATCH: undefined / null / "" allowed; non-empty values get https:// if needed. */
export const flexibleUrlProfileWebsiteSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((raw) => {
    if (raw === undefined || raw === null) return raw
    const s = raw.trim()
    if (s === "") return ""
    return normalizeUserEnteredUrl(s)
  })
  .refine(
    (val) =>
      val === undefined ||
      val === null ||
      val === "" ||
      isValidHttpUrl(val),
    { message: DEFAULT_INVALID }
  )
