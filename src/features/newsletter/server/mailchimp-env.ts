import { getOptionalEnv } from "@/lib/env"

export type MailchimpEnv = {
  apiKey: string
  serverPrefix: string
  audienceId: string
}

export function getMailchimpEnv(): MailchimpEnv | null {
  if (getOptionalEnv("SYNC_DISABLED") === "true" || getOptionalEnv("MAILCHIMP_SYNC_DISABLED") === "true") {
    return null
  }

  const apiKey = getOptionalEnv("MAILCHIMP_API_KEY")
  const serverPrefix = getOptionalEnv("MAILCHIMP_SERVER_PREFIX")
  const audienceId = getOptionalEnv("MAILCHIMP_AUDIENCE_ID")

  if (!apiKey || !serverPrefix || !audienceId) {
    return null
  }

  return { apiKey, serverPrefix, audienceId }
}
