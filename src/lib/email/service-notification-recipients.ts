export type ServiceNotificationKind =
  | "documentation"
  | "fiscal-sponsorship"
  | "fiscal-services"

const SERVICE_RECIPIENTS_ENV: Record<ServiceNotificationKind, string> = {
  documentation: "SERVICE_NOTIFICATION_RECIPIENTS_DOCUMENTATION",
  "fiscal-sponsorship": "SERVICE_NOTIFICATION_RECIPIENTS_FISCAL_SPONSORSHIP",
  "fiscal-services": "SERVICE_NOTIFICATION_RECIPIENTS_FISCAL_SERVICES",
}

/** Parses a comma-separated list of email addresses (whitespace trimmed, empties dropped). */
export function parseCommaSeparatedEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0)
}

/**
 * Admin notification recipients for a service inquiry.
 * Uses the service-specific env var when set; otherwise falls back to ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL.
 */
export function getServiceNotificationRecipients(kind: ServiceNotificationKind): string[] {
  const serviceEnv = SERVICE_RECIPIENTS_ENV[kind]
  const fromService = parseCommaSeparatedEmails(process.env[serviceEnv] ?? "")
  if (fromService.length > 0) return fromService

  const fallbackRaw = process.env.ADMIN_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? ""
  return parseCommaSeparatedEmails(fallbackRaw)
}

/** Postmark accepts multiple To addresses as a comma-separated string. */
export function formatPostmarkTo(recipients: string[]): string {
  return recipients.join(", ")
}

export function serviceNotificationRecipientsEnvName(kind: ServiceNotificationKind): string {
  return SERVICE_RECIPIENTS_ENV[kind]
}
