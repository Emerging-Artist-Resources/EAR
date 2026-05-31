import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { SYNC_STATUS } from "@/features/newsletter/constants"
import { normalizeEmail } from "@/features/newsletter/normalizeEmail"
import type { NewsletterSubscriberRow, SyncNewsletterPreferencesInput } from "@/features/newsletter/types"

/**
 * @internal Only call from syncNewsletterPreferences.
 */
export async function upsertNewsletterSubscriber(
  input: SyncNewsletterPreferencesInput,
): Promise<NewsletterSubscriberRow> {
  const supabase = getSupabaseServiceClient()
  const email = input.email.trim()
  const normalized_email = normalizeEmail(email)

  const { data: existing, error: selectError } = await supabase
    .from("newsletter_subscribers")
    .select("profile_id, sync_retry_count")
    .eq("normalized_email", normalized_email)
    .maybeSingle()

  if (selectError) {
    console.error("[newsletter] lookup failed", selectError)
    throw new Error("Failed to save subscription")
  }

  const profileId =
    input.profileId !== undefined && input.profileId !== null && input.profileId !== ""
      ? input.profileId
      : (existing?.profile_id as string | null) ?? null

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      {
        email,
        normalized_email,
        profile_id: profileId,
        first_name: input.firstName?.trim() || null,
        last_name: input.lastName?.trim() || null,
        subscribed_to_newsletter: input.earOptIn,
        subscribed_to_calendar: input.calendarOptIn,
        source: input.source,
        source_context: input.sourceContext ?? null,
        sync_status: SYNC_STATUS.PENDING,
        sync_last_error: null,
        needs_sync: true,
        sync_retry_count: 0,
      },
      { onConflict: "normalized_email" },
    )
    .select("*")
    .single()

  if (error) {
    console.error("[newsletter] upsert failed", error)
    throw new Error("Failed to save subscription")
  }

  return data as NewsletterSubscriberRow
}

/**
 * @internal Only call from syncNewsletterPreferences.
 */
export async function mirrorProfileNewsletterFields(
  profileId: string,
  earOptIn: boolean,
  calendarOptIn: boolean,
): Promise<void> {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      newsletter_ear_opt_in: earOptIn,
      newsletter_calendar_opt_in: calendarOptIn,
    })
    .eq("id", profileId)

  if (error) {
    console.error("[newsletter] profile mirror failed", error)
    throw new Error("Failed to save profile newsletter preferences")
  }
}
