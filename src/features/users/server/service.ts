import { listProfilesRepo, upsertProfileRoleRepo, updateAuthUserRoleRepo } from "./repository"

export type UserSummary = { id: string; name: string | null; email: string | null; role: 'USER' | 'ADMIN'; createdAt: string }

export async function listUsers(): Promise<UserSummary[]> {
  const rows = await listProfilesRepo() as Array<{ user_id: string; name: string | null; role: string | null; created_at: string }>
  return rows.map((p) => ({
    id: p.user_id,
    name: p.name,
    email: null,
    role: (p.role === 'ADMIN' ? 'ADMIN' : 'USER'),
    createdAt: p.created_at,
  }))
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  await upsertProfileRoleRepo(userId, role)
  await updateAuthUserRoleRepo(userId, role)
  return { id: userId, role }
}


