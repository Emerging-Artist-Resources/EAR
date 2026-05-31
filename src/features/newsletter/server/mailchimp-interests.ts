import { getOptionalEnv } from "@/lib/config/env"
import {
  MAILCHIMP_GROUP_CALENDAR,
  MAILCHIMP_GROUP_CATEGORY,
  MAILCHIMP_GROUP_EAR,
} from "@/features/newsletter/constants"
import type { getMailchimpEnv } from "./mailchimp-env"
import { mailchimpRequest } from "@/features/newsletter/server/mailchimp-client"

export type MailchimpInterestIds = {
  ear: string
  calendar: string
}

type InterestCategory = { id: string; title: string }
type Interest = { id: string; name: string }

const CACHE_TTL_MS = 60 * 60 * 1000

let cachedIds: MailchimpInterestIds | null = null
let cacheExpiresAt = 0

function interestIdsFromEnv(): MailchimpInterestIds | null {
  const ear = getOptionalEnv("MAILCHIMP_INTEREST_EAR_ID")
  const calendar = getOptionalEnv("MAILCHIMP_INTEREST_CALENDAR_ID")
  if (ear && calendar) {
    return { ear, calendar }
  }
  return null
}

/**
 * Resolves Mailchimp interest IDs for the EAR and Calendar groups.
 * Uses env overrides when set; otherwise looks up by group names (cached 1h).
 */
export async function resolveMailchimpInterestIds(
  env: NonNullable<ReturnType<typeof getMailchimpEnv>>,
): Promise<MailchimpInterestIds> {
  const fromEnv = interestIdsFromEnv()
  if (fromEnv) return fromEnv

  if (cachedIds && Date.now() < cacheExpiresAt) {
    return cachedIds
  }

  const categoriesRes = await mailchimpRequest(
    env,
    `/lists/${env.audienceId}/interest-categories?count=100`,
    { method: "GET" },
  )
  if (!categoriesRes.ok) {
    const body = await categoriesRes.text()
    throw new Error(`Mailchimp interest categories failed (${categoriesRes.status}): ${body}`)
  }

  const categoriesJson = (await categoriesRes.json()) as {
    categories?: InterestCategory[]
  }
  const category = categoriesJson.categories?.find((c) => c.title === MAILCHIMP_GROUP_CATEGORY)
  if (!category) {
    throw new Error(
      `Mailchimp group category "${MAILCHIMP_GROUP_CATEGORY}" not found. Check audience settings.`,
    )
  }

  const interestsRes = await mailchimpRequest(
    env,
    `/lists/${env.audienceId}/interest-categories/${category.id}/interests?count=100`,
    { method: "GET" },
  )
  if (!interestsRes.ok) {
    const body = await interestsRes.text()
    throw new Error(`Mailchimp interests failed (${interestsRes.status}): ${body}`)
  }

  const interestsJson = (await interestsRes.json()) as { interests?: Interest[] }
  const interests = interestsJson.interests ?? []

  const earInterest = interests.find((i) => i.name === MAILCHIMP_GROUP_EAR)
  const calendarInterest = interests.find((i) => i.name === MAILCHIMP_GROUP_CALENDAR)

  if (!earInterest || !calendarInterest) {
    const found = interests.map((i) => i.name).join(", ")
    throw new Error(
      `Mailchimp groups not found (expected "${MAILCHIMP_GROUP_EAR}" and "${MAILCHIMP_GROUP_CALENDAR}" under "${MAILCHIMP_GROUP_CATEGORY}"). Found: ${found || "(none)"}`,
    )
  }

  cachedIds = { ear: earInterest.id, calendar: calendarInterest.id }
  cacheExpiresAt = Date.now() + CACHE_TTL_MS
  return cachedIds
}

/** Clears cached interest IDs (for tests). */
export function clearMailchimpInterestIdCache(): void {
  cachedIds = null
  cacheExpiresAt = 0
}
