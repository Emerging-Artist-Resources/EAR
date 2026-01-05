import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getUserRole, getUserRoleFromProfile } from "@/lib/authz"
import { createErrorResponse, ErrorCodes } from "@/lib/api-utils"
import type { User } from "@supabase/supabase-js"

export type UserRole = "ADMIN" | "REVIEWER" | "EDITOR" | "USER" | undefined

export interface AuthResult {
  user: User
  role: UserRole
}

/**
 * Gets the authenticated user and their role
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthResult | null> {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  let role = getUserRole(user)
  if (!role) {
    role = await getUserRoleFromProfile(supabase, user.id)
  }
  
  return { user, role }
}

/**
 * Requires authentication and returns user/role
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  const result = await getAuthenticatedUser()
  if (!result) {
    throw new Error("Unauthorized")
  }
  return result
}

/**
 * Requires a specific role
 * Throws error if user doesn't have the required role
 */
export async function requireRole(
  requiredRole: "ADMIN" | "REVIEWER" | "EDITOR"
): Promise<AuthResult> {
  const result = await requireAuth()
  
  if (result.role !== requiredRole && result.role !== "ADMIN") {
    // ADMIN can always access everything
    throw new Error("Forbidden")
  }
  
  return result
}

/**
 * Checks if user has one of the allowed roles
 */
export function hasRole(
  userRole: UserRole,
  allowedRoles: Array<"ADMIN" | "REVIEWER" | "EDITOR" | "USER">
): boolean {
  if (!userRole) return false
  // ADMIN can access everything
  if (userRole === "ADMIN") return true
  return allowedRoles.includes(userRole)
}

/**
 * Creates an unauthorized error response
 */
export function unauthorizedResponse() {
  return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", undefined, 401)
}

/**
 * Creates a forbidden error response
 */
export function forbiddenResponse() {
  return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", undefined, 403)
}
