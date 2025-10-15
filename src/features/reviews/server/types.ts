export type Review = {
  id: string
  event_id: string
  decision: 'APPROVED' | 'REJECTED'
  notes: string | null
  reviewer_user_id: string
  created_at?: string
}


