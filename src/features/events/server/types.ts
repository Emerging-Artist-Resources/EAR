export type EventItem = {
  id: string
  title: string
  date: string
  show_time: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_by: string | null
  details: Record<string, unknown>
}

export type ListResult<T> = { items: T[]; nextCursor: string | null }


