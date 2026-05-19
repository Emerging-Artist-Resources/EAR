/**
 * Client IP for rate limiting (Vercel / reverse proxy safe).
 */
export function getClientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown"
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}
