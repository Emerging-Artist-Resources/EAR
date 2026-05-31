/**
 * Launch-day operational kill switches (Vercel env + redeploy).
 * Never default these to true in production.
 */

function envEnabled(key: string): boolean {
  return process.env[key] === "true"
}

export type LaunchFlags = {
  disableRateLimit: boolean
  disableSentry: boolean
  disableEmails: boolean
  disableBackgroundSync: boolean
}

export function getLaunchFlags(): LaunchFlags {
  return {
    disableRateLimit: envEnabled("DISABLE_RATE_LIMIT"),
    disableSentry: envEnabled("DISABLE_SENTRY"),
    disableEmails: envEnabled("DISABLE_EMAILS"),
    disableBackgroundSync: envEnabled("DISABLE_BACKGROUND_SYNC"),
  }
}

export function isEmailsDisabled(): boolean {
  return getLaunchFlags().disableEmails
}

export function isSentryDisabled(): boolean {
  return (
    getLaunchFlags().disableSentry ||
    process.env.NEXT_PUBLIC_DISABLE_SENTRY === "true"
  )
}
