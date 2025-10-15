export const rateLimitService = {
  async check(key: string, limit: number, windowSeconds: number) {
    // TODO: Integrate with a provider (e.g., Upstash Redis)
    return { allowed: true, remaining: limit - 1 }
  },
}
