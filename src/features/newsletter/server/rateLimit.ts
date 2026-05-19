const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5

type Entry = { count: number; windowStart: number }

const store = new Map<string, Entry>()

function prune() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.windowStart > WINDOW_MS) {
      store.delete(key)
    }
  }
}

/**
 * Simple in-memory rate limit for newsletter subscribe (per IP).
 * On serverless, limits are per-instance; upgrade to Redis/Upstash when needed.
 */
export function checkNewsletterSubscribeRateLimit(ip: string): { allowed: boolean; remaining: number } {
  prune()
  const now = Date.now()
  const key = ip || "unknown"
  const entry = store.get(key)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count += 1
  return { allowed: true, remaining: MAX_REQUESTS - entry.count }
}

export function getClientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown"
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}
