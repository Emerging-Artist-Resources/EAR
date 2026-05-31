import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN

Sentry.init({
  dsn,
  enabled:
    Boolean(dsn) &&
    process.env.NODE_ENV === "production" &&
    process.env.DISABLE_SENTRY !== "true" &&
    process.env.NEXT_PUBLIC_DISABLE_SENTRY !== "true",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
