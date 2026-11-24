import posthog, { type CaptureResult, type PostHogConfig, type Properties } from "posthog-js"

const EXCLUDED_PREFIXES = ["/admin", "/auth", "/profile", "/api", "/forms", "/donations"] as const

/**
 * SDK property names. Session entry renames `$current_url` to `$session_entry_url`.
 * Initial properties keep `$initial_current_url`.
 */
const URL_FIELDS = [
  "$current_url",
  "$pathname",
  "$host",
  "$referrer",
  "$referring_domain",
  "$initial_current_url",
  "$initial_url",
  "$initial_pathname",
  "$initial_host",
  "$initial_referrer",
  "$initial_referring_domain",
  "$session_entry_url",
  "$session_entry_current_url",
  "$session_entry_pathname",
  "$session_entry_host",
  "$session_entry_referrer",
  "$session_entry_referring_domain",
] as const

const ALLOWED_PREFIXED_KEYS = new Set<string>([
  "$initial_current_url",
  "$initial_url",
  "$initial_pathname",
  "$initial_host",
  "$initial_referrer",
  "$initial_referring_domain",
  "$session_entry_url",
  "$session_entry_current_url",
  "$session_entry_pathname",
  "$session_entry_host",
  "$session_entry_referrer",
  "$session_entry_referring_domain",
])

const CURRENT_KEYS = ["$current_url", "$pathname", "$host"] as const

const URL_GROUPS = [
  { signals: ["$referrer"], keys: ["$referrer", "$referring_domain"] },
  {
    signals: ["$initial_current_url", "$initial_url", "$initial_pathname"],
    keys: ["$initial_current_url", "$initial_url", "$initial_pathname", "$initial_host"],
  },
  {
    signals: ["$initial_referrer"],
    keys: ["$initial_referrer", "$initial_referring_domain"],
  },
  {
    signals: ["$session_entry_url", "$session_entry_current_url", "$session_entry_pathname"],
    keys: [
      "$session_entry_url",
      "$session_entry_current_url",
      "$session_entry_pathname",
      "$session_entry_host",
    ],
  },
  {
    signals: ["$session_entry_referrer"],
    keys: ["$session_entry_referrer", "$session_entry_referring_domain"],
  },
] as const

export type AnalyticsEnvironment = "production" | "preview" | "development"

type AnalyticsEnv = {
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?: string
  NEXT_PUBLIC_POSTHOG_HOST?: string
  NEXT_PUBLIC_POSTHOG_ENABLED?: string
  NEXT_PUBLIC_VERCEL_ENV?: string
}

let initialized = false

export function analyticsEnvironment(vercelEnv: string | undefined): AnalyticsEnvironment {
  if (vercelEnv === "production" || vercelEnv === "preview") return vercelEnv
  return "development"
}

function readAnalyticsEnv(env?: AnalyticsEnv): AnalyticsEnv {
  if (env) return env
  return {
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_ENABLED: process.env.NEXT_PUBLIC_POSTHOG_ENABLED,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  }
}

export function isPostHogEnabled(env?: AnalyticsEnv): boolean {
  const source = readAnalyticsEnv(env)
  if (!source.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || !source.NEXT_PUBLIC_POSTHOG_HOST) return false
  if (source.NEXT_PUBLIC_POSTHOG_ENABLED === "false") return false
  if (source.NEXT_PUBLIC_VERCEL_ENV === "production") return true
  return source.NEXT_PUBLIC_POSTHOG_ENABLED === "true"
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1)
  return pathname
}

function stripQueryAndHash(value: string): string {
  if (value === "$direct") return value
  const cut = value.search(/[?#]/)
  return cut === -1 ? value : value.slice(0, cut)
}

function pathnameOf(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value === "$direct") return null
  const stripped = stripQueryAndHash(value)
  if (stripped.startsWith("/")) return normalizePath(stripped)
  try {
    return normalizePath(new URL(stripped).pathname || "/")
  } catch {
    return null
  }
}

function isExcludedAnalyticsPath(pathname: string): boolean {
  const path = normalizePath(pathname)
  if (EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true
  }
  const [, section, , leaf] = path.split("/")
  return section === "donate" && leaf === "success"
}

function isExcludedValue(value: unknown): boolean {
  const pathname = pathnameOf(value)
  return pathname !== null && isExcludedAnalyticsPath(pathname)
}

function copyProperties(value: unknown): Properties | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  return { ...(value as Properties) }
}

function deleteKeys(bag: Properties, keys: readonly string[]) {
  for (const key of keys) delete bag[key]
}

function cleanBag(bag: Properties, dropCurrentGroup: boolean): boolean {
  for (const key of Object.keys(bag)) {
    if (
      key === "ph_keyword" ||
      ((key.startsWith("$initial_") || key.startsWith("$session_entry_")) &&
        !ALLOWED_PREFIXED_KEYS.has(key))
    ) {
      delete bag[key]
    }
  }

  for (const key of URL_FIELDS) {
    const value = bag[key]
    if (typeof value === "string") bag[key] = stripQueryAndHash(value)
  }

  const currentExcluded = isExcludedValue(bag.$current_url) || isExcludedValue(bag.$pathname)
  if (currentExcluded && dropCurrentGroup) deleteKeys(bag, CURRENT_KEYS)

  for (const group of URL_GROUPS) {
    if (group.signals.some((key) => isExcludedValue(bag[key]))) deleteKeys(bag, group.keys)
  }

  return currentExcluded
}

export function prepareAnalyticsEvent(
  event: CaptureResult,
  environment: AnalyticsEnvironment,
): CaptureResult | null {
  const properties = copyProperties(event.properties) ?? {}
  const set = copyProperties(event.$set)
  const setOnce = copyProperties(event.$set_once)
  const nestedSet = copyProperties(properties.$set)
  const nestedSetOnce = copyProperties(properties.$set_once)

  const currentExcluded = cleanBag(properties, false)
  if (set) cleanBag(set, true)
  if (setOnce) cleanBag(setOnce, true)
  if (nestedSet) {
    cleanBag(nestedSet, true)
    properties.$set = nestedSet
  }
  if (nestedSetOnce) {
    cleanBag(nestedSetOnce, true)
    properties.$set_once = nestedSetOnce
  }

  if (currentExcluded) return null

  properties.environment = environment

  const next: CaptureResult = { ...event, properties }
  if (set) next.$set = set
  else delete next.$set
  if (setOnce) next.$set_once = setOnce
  else delete next.$set_once
  return next
}

export function initPostHog(): void {
  if (initialized || typeof window === "undefined") return
  if (!isPostHogEnabled()) return

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!token || !host) return

  const environment = analyticsEnvironment(process.env.NEXT_PUBLIC_VERCEL_ENV)
  const config: Partial<PostHogConfig> = {
    api_host: host,
    defaults: "2026-08-30",
    capture_pageview: "history_change",
    capture_pageleave: "if_capture_pageview",
    cookieless_mode: "always",
    person_profiles: "never",
    save_campaign_params: false,
    internal_or_test_user_hostname: null,
    autocapture: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    capture_exceptions: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
    disable_capture_url_hashes: true,
    before_send: (captured) => prepareAnalyticsEvent(captured, environment),
  }

  try {
    posthog.init(token, config)
    initialized = true
  } catch {
    // Analytics must not break the page.
  }
}
