import type { NewsletterSource } from "@/features/newsletter/constants"

export type NewsletterSubscribePayload = {
  first_name: string
  last_name: string
  email: string
  subscribed_to_newsletter: boolean
  subscribed_to_calendar: boolean
  source: NewsletterSource
  source_context?: string
}

type SubscribeApiError = {
  error?: { message?: string; details?: { message?: string }[] }
}

export function parseNewsletterSubscribeError(json: SubscribeApiError): string {
  const d = json.error?.details
  const firstDetail =
    Array.isArray(d) && d[0] && typeof d[0] === "object" && d[0] !== null && "message" in d[0]
      ? String((d[0] as { message: string }).message)
      : null
  return firstDetail ?? json.error?.message ?? "Something went wrong. Please try again."
}

export async function subscribeToNewsletters(payload: NewsletterSubscribePayload): Promise<void> {
  const res = await fetch("/api/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      email: payload.email.trim(),
      subscribed_to_newsletter: payload.subscribed_to_newsletter,
      subscribed_to_calendar: payload.subscribed_to_calendar,
      source: payload.source,
      source_context: payload.source_context,
    }),
  })

  const json = (await res.json()) as SubscribeApiError

  if (!res.ok) {
    throw new Error(parseNewsletterSubscribeError(json))
  }
}
