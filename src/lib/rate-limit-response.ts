import { NextResponse } from "next/server"

export function rateLimitExceededResponse(reset?: number): NextResponse {
  const retryAfter = reset
    ? Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    : 60

  return NextResponse.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  )
}
