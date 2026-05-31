/** Mailchimp group category (must match Mailchimp exactly). */
export const MAILCHIMP_GROUP_CATEGORY = "EAR Emailing Lists"

/** Mailchimp group option names under the category above. */
export const MAILCHIMP_GROUP_EAR = "EAR General Email List"
export const MAILCHIMP_GROUP_CALENDAR = "Community Calendar Weekly Email List"

/** Legacy audience tags (kept in sync for existing automations). */
export const MAILCHIMP_TAG_EAR = "EAR Newsletter"
export const MAILCHIMP_TAG_CALENDAR = "Calendar"

export const SYNC_STATUS = {
  PENDING: "pending",
  SYNCED: "synced",
  FAILED: "failed",
  SKIPPED: "skipped",
  FAILED_PERMANENT: "failed_permanent",
} as const

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS]

export const MAX_SYNC_RETRIES = 10
export const SYNC_RETRY_BACKOFF_MS = 60 * 60 * 1000

export const NEWSLETTER_SOURCES = [
  "unknown",
  "signup",
  "profile",
  "modal",
  "footer",
  "home",
  "our-story",
  "about-us",
  "backfill",
] as const

export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number]
