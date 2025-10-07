export const captchaService = {
  async verifyTurnstile(token: string | undefined, secret?: string) {
    const resolvedSecret = secret ?? process.env.TURNSTILE_SECRET_KEY
    if (!resolvedSecret || !token) {
      // Allow in local/dev when not configured
      return { success: true }
    }
    try {
      const form = new URLSearchParams()
      form.append('secret', resolvedSecret)
      form.append('response', token)

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })

      const data = await res.json() as { success: boolean }
      return { success: !!data.success }
    } catch {
      return { success: false }
    }
  },
}


