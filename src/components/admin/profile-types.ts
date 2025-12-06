export type ProfileStatus = "emerging" | "established"

export interface AdminProfileItem {
  id: string
  name: string | null
  email: string | null
  status: ProfileStatus
  createdAt: string
  updatedAt?: string
}

export const STATUS_BADGE: Record<ProfileStatus, string> = {
  emerging: "bg-[var(--warning-50)] text-[var(--warning-600)]",
  established: "bg-[var(--success-50)] text-[var(--success-600)]",
}

