import type { SupabaseClient, User } from "@supabase/supabase-js"

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

export async function getUserRoleFromProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<"ADMIN"|"USER"|undefined> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()
    
    if (error || !data) return undefined
    
    const role = data.role as string | undefined
    if (role === "admin") return "ADMIN"
    if (role === "user") return "USER"
    return undefined
  } catch {
    return undefined
  }
}

export async function fetchUserRoleWithFallback(
  user: User,
  supabase: SupabaseClient
): Promise<"ADMIN" | "REVIEWER" | "EDITOR" | "USER" | undefined> {
  let role = getUserRole(user)
  if (!role) {
    try {
      role = await getUserRoleFromProfile(supabase, user.id)
    } catch (err) {
      console.error("Error fetching user role from profile:", err)
    }
  }
  return role
}

export function extractUserName(user: User): string | null {
  return (
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    null
  )
}