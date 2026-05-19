import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { getLaunchFlags } from "@/lib/launch-flags"

export type RateLimitWindow = `${number} s` | `${number} m` | `${number} h` | `${number} d`

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  reset?: number
}

type RateLimitOptions = {
  key: string
  limit: number
  window: RateLimitWindow
}

const limiterCache = new Map<string, Ratelimit>()

let redis: Redis | null = null

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  if (!redis) {
    redis = new Redis({ url, token })
  }
  return redis
}

function getLimiter(limit: number, window: RateLimitWindow): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const cacheKey = `${limit}:${window}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: "ear",
    })
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  if (getLaunchFlags().disableRateLimit) {
    return { allowed: true, remaining: options.limit }
  }

  const limiter = getLimiter(options.limit, options.window)
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[rate-limit] Upstash not configured; allowing request", options.key)
    }
    return { allowed: true, remaining: options.limit }
  }

  const result = await limiter.limit(options.key)
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/** @deprecated Use checkRateLimit from this module */
export const rateLimitService = {
  async check(key: string, limit: number, windowSeconds: number) {
    const window: RateLimitWindow = `${windowSeconds} s`
    const result = await checkRateLimit({ key, limit, window })
    return { allowed: result.allowed, remaining: result.remaining }
  },
}
