export function requireRole(role: 'ADMIN' | 'REVIEWER' | 'EDITOR' | 'USER' | undefined, expected: 'ADMIN' | 'REVIEWER' | 'EDITOR' | 'USER') {
  return role === expected
}

export function getUserRole(user: unknown): "ADMIN"|"REVIEWER"|"EDITOR"|"USER"|undefined {
  if (!user || typeof user !== "object") return undefined
  const u = user as { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
  const val = (u.app_metadata?.role ?? u.user_metadata?.role) as string | undefined
  if (val === "ADMIN" || val === "REVIEWER" || val === "EDITOR" || val === "USER") return val
  return undefined
}