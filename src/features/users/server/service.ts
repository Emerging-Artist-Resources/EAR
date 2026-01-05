import { listProfilesRepo, upsertProfileRoleRepo } from "./repository"

export type UserSummary = { id: string; name: string | null; email: string | null; role: 'USER' | 'ADMIN'; createdAt: string }

export async function listUsers(): Promise<UserSummary[]> {
  const rows = await listProfilesRepo() as Array<{ id: string; name: string | null; email: string | null; role: string | null; created_at: string }>
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: (p.role === 'admin' ? 'ADMIN' : 'USER'),
    createdAt: p.created_at,
  }))
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  const profileRole = role === 'ADMIN' ? 'admin' : 'user'
  await upsertProfileRoleRepo(userId, profileRole)
  return { id: userId, role }
}


