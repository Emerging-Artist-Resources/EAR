import { createClient } from '@supabase/supabase-js'

export function getSupabaseServerClientAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  // No cookies/session attached → cache-friendly, RLS-enforced
  return createClient(url, anon, { auth: { persistSession: false } })
}