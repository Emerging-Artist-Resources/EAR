import type { NewsletterSource, SyncStatus } from "./constants"

export type NewsletterSubscriberRow = {
  id: string
  email: string
  normalized_email: string
  profile_id: string | null
  subscribed_to_newsletter: boolean
  subscribed_to_calendar: boolean
  source: string
  source_context: string | null
  sync_status: SyncStatus | string
  sync_last_error: string | null
  synced_at: string | null
  needs_sync: boolean
  sync_retry_count: number
  last_sync_attempt_at: string | null
  created_at: string
  updated_at: string
}

export type SyncNewsletterPreferencesInput = {
  email: string
  earOptIn: boolean
  calendarOptIn: boolean
  profileId?: string | null
  source: NewsletterSource
  sourceContext?: string
}
