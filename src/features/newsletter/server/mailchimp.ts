import { createHash } from "crypto"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import {
  MAILCHIMP_TAG_CALENDAR,
  MAILCHIMP_TAG_EAR,
  MAX_SYNC_RETRIES,
  SYNC_STATUS,
} from "@/features/newsletter/constants"
import type { NewsletterSubscriberRow } from "@/features/newsletter/types"
import { mailchimpRequest } from "./mailchimp-client"
import { getMailchimpEnv } from "./mailchimp-env"
import { resolveMailchimpInterestIds } from "./mailchimp-interests"
import { buildMailchimpMergeFields, buildMailchimpMergeFieldsFromParts } from "./mailchimp-merge-fields"

function subscriberHash(normalizedEmail: string): string {
  return createHash("md5").update(normalizedEmail).digest("hex")
}

async function updateSyncMetadata(
  subscriberId: string,
  patch: {
    sync_status: string
    sync_last_error?: string | null
    synced_at?: string | null
    needs_sync?: boolean
    sync_retry_count?: number
    last_sync_attempt_at?: string
  },
) {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase.from("newsletter_subscribers").update(patch).eq("id", subscriberId)
  if (error) {
    console.error("[newsletter] failed to update sync metadata", error)
  }
}

async function loadProfileName(profileId: string | null): Promise<string | null> {
  if (!profileId) return null

  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase.from("profiles").select("name").eq("id", profileId).maybeSingle()

  if (error) {
    console.error("[newsletter] profile name lookup failed", profileId, error)
    return null
  }

  return (data?.name as string | null) ?? null
}

/**
 * Syncs one subscriber row to Mailchimp. Internal — call from syncNewsletterPreferences or cron only.
 */
export async function syncToMailchimp(subscriberId: string): Promise<void> {
  const supabase = getSupabaseServiceClient()
  const { data: row, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .eq("id", subscriberId)
    .maybeSingle()

  if (error || !row) {
    console.error("[newsletter] syncToMailchimp: row not found", subscriberId, error)
    return
  }

  const subscriber = row as NewsletterSubscriberRow
  const now = new Date().toISOString()

  await updateSyncMetadata(subscriberId, {
    last_sync_attempt_at: now,
    sync_status: SYNC_STATUS.PENDING,
  })

  const env = getMailchimpEnv()
  if (!env) {
    await updateSyncMetadata(subscriberId, {
      sync_status: SYNC_STATUS.SKIPPED,
      sync_last_error: null,
      synced_at: null,
      needs_sync: false,
    })
    return
  }

  const hash = subscriberHash(subscriber.normalized_email)
  const listPath = `/lists/${env.audienceId}/members/${hash}`

  try {
    const interestIds = await resolveMailchimpInterestIds(env)
    const profileName = await loadProfileName(subscriber.profile_id)
    const merge_fields = profileName
      ? buildMailchimpMergeFields(profileName)
      : buildMailchimpMergeFieldsFromParts(subscriber.first_name, subscriber.last_name)

    const memberBody: Record<string, unknown> = {
      email_address: subscriber.normalized_email,
      status_if_new: "subscribed",
      status: "subscribed",
      interests: {
        [interestIds.ear]: subscriber.subscribed_to_newsletter,
        [interestIds.calendar]: subscriber.subscribed_to_calendar,
      },
    }
    if (merge_fields) {
      memberBody.merge_fields = merge_fields
    }

    const memberRes = await mailchimpRequest(env, listPath, {
      method: "PUT",
      body: JSON.stringify(memberBody),
    })

    if (!memberRes.ok) {
      const body = await memberRes.text()
      throw new Error(`Mailchimp member upsert failed (${memberRes.status}): ${body}`)
    }

    const tagsRes = await mailchimpRequest(env, `${listPath}/tags`, {
      method: "POST",
      body: JSON.stringify({
        tags: [
          {
            name: MAILCHIMP_TAG_EAR,
            status: subscriber.subscribed_to_newsletter ? "active" : "inactive",
          },
          {
            name: MAILCHIMP_TAG_CALENDAR,
            status: subscriber.subscribed_to_calendar ? "active" : "inactive",
          },
        ],
      }),
    })

    if (!tagsRes.ok) {
      const body = await tagsRes.text()
      throw new Error(`Mailchimp tags failed (${tagsRes.status}): ${body}`)
    }

    await updateSyncMetadata(subscriberId, {
      sync_status: SYNC_STATUS.SYNCED,
      sync_last_error: null,
      synced_at: now,
      needs_sync: false,
      sync_retry_count: 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[newsletter] Mailchimp sync failed", subscriberId, message)

    const retryCount = subscriber.sync_retry_count + 1
    const permanent = retryCount >= MAX_SYNC_RETRIES

    await updateSyncMetadata(subscriberId, {
      sync_status: permanent ? SYNC_STATUS.FAILED_PERMANENT : SYNC_STATUS.FAILED,
      sync_last_error: message.slice(0, 2000),
      needs_sync: !permanent,
      sync_retry_count: retryCount,
      last_sync_attempt_at: now,
    })
  }
}

/**
 * Batch retry for cron. Returns count processed.
 */
export async function retryPendingNewsletterSyncs(limit = 50): Promise<number> {
  const supabase = getSupabaseServiceClient()
  const backoffBefore = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("needs_sync", true)
    .lt("sync_retry_count", MAX_SYNC_RETRIES)
    .or(`last_sync_attempt_at.is.null,last_sync_attempt_at.lt.${backoffBefore}`)
    .order("last_sync_attempt_at", { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error || !rows?.length) {
    if (error) console.error("[newsletter] cron query failed", error)
    return 0
  }

  for (const row of rows) {
    await syncToMailchimp(row.id as string)
  }

  return rows.length
}
