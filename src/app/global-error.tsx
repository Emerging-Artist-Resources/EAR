"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { isSentryDisabled } from "@/lib/launch-flags"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (!isSentryDisabled()) {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>{error.message || "An unexpected error occurred"}</p>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
