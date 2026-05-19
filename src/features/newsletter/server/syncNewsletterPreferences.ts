import type { NewsletterSubscriberRow, SyncNewsletterPreferencesInput } from "@/features/newsletter/types"
import { mirrorProfileNewsletterFields, upsertNewsletterSubscriber } from "./upsertSubscriber"
import { syncToMailchimp } from "./mailchimp"

export type { SyncNewsletterPreferencesInput }

/**
 * Single entry point for all newsletter preference writes.
 * Do not write to newsletter_subscribers or call Mailchimp outside this module.
 */
export async function syncNewsletterPreferences(
  input: SyncNewsletterPreferencesInput,
): Promise<NewsletterSubscriberRow> {
  const row = await upsertNewsletterSubscriber(input)

  if (input.profileId) {
    await mirrorProfileNewsletterFields(input.profileId, input.earOptIn, input.calendarOptIn)
  }

  void syncToMailchimp(row.id).catch((err) => {
    console.error("[newsletter] async Mailchimp sync failed", row.id, err)
  })

  return row
}

/**
 * Read canonical preferences by normalized email (falls back to profile mirror via profileId lookup).
 */
export async function getNewsletterPreferencesByProfile(
  profileId: string,
  email: string,
): Promise<{ earOptIn: boolean; calendarOptIn: boolean }> {
  const { getSupabaseServiceClient } = await import("@/lib/supabase/service")
  const { normalizeEmail } = await import("@/features/newsletter/normalizeEmail")
  const supabase = getSupabaseServiceClient()
  const normalized = normalizeEmail(email)

  const { data: subscriber } = await supabase
    .from("newsletter_subscribers")
    .select("subscribed_to_newsletter, subscribed_to_calendar")
    .eq("normalized_email", normalized)
    .maybeSingle()

  if (subscriber) {
    return {
      earOptIn: subscriber.subscribed_to_newsletter,
      calendarOptIn: subscriber.subscribed_to_calendar,
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("newsletter_ear_opt_in, newsletter_calendar_opt_in")
    .eq("id", profileId)
    .maybeSingle()

  return {
    earOptIn: profile?.newsletter_ear_opt_in ?? false,
    calendarOptIn: profile?.newsletter_calendar_opt_in ?? false,
  }
}
