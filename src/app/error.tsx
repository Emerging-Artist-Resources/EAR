"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <Text className="text-xl font-bold mb-2">Something went wrong</Text>
        <Text className="text-gray-600 mb-4">
          {error.message || "An unexpected error occurred"}
        </Text>
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
      </Card>
    </div>
  )
}
