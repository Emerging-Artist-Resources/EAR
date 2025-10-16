export const rateLimitService = {
  async check(_key: string, limit: number, _windowSeconds: number) {
    void _key
    void _windowSeconds
    // TODO: Integrate with a provider (e.g., Upstash Redis)
    return { allowed: true, remaining: limit - 1 }
  },
}
