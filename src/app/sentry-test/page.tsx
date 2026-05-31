"use client"

import { useState } from "react"
import * as Sentry from "@sentry/nextjs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { H1, Text } from "@/components/ui/typography"

export default function SentryTestPage() {
  const [triggerRenderError, setTriggerRenderError] = useState(false)

  const dsnConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
  const sentryEnabled =
    dsnConfigured &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_DISABLE_SENTRY !== "true"

  if (triggerRenderError) {
    throw new Error("EAR client render error (ErrorBoundary test)")
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-6 space-y-4">
        <H1>Sentry client test</H1>
        <Text className="text-sm text-[var(--gray-600)]">
          Use this page to verify browser-side Sentry reporting. Run{" "}
          <code className="text-xs bg-[var(--gray-100)] px-1 py-0.5 rounded">
            npm run build && npm start
          </code>{" "}
          — client Sentry is disabled in dev mode.
        </Text>

        <dl className="text-sm space-y-1 rounded-md bg-[var(--gray-50)] p-3">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--gray-600)]">NEXT_PUBLIC_SENTRY_DSN</dt>
            <dd>{dsnConfigured ? "set" : "missing"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--gray-600)]">NODE_ENV</dt>
            <dd>{process.env.NODE_ENV}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--gray-600)]">Client SDK enabled</dt>
            <dd>{sentryEnabled ? "yes" : "no"}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => {
              Sentry.captureException(new Error("EAR client captureException test"))
            }}
          >
            Send captureException test
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTriggerRenderError(true)
            }}
          >
            Throw render error (ErrorBoundary)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTimeout(() => {
                throw new Error("EAR client unhandled error test")
              }, 0)
            }}
          >
            Throw unhandled error
          </Button>
        </div>
      </Card>
    </div>
  )
}
