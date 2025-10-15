export type Announcement = {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  author_user_id: string
  published_at?: string | null
  archived_at?: string | null
  created_at?: string
}


