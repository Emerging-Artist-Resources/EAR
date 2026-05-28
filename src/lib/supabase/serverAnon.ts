import { createClient } from '@supabase/supabase-js'
import { getClientEnv } from '@/lib/config/env'

export function getSupabaseServerClientAnon() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getClientEnv()
  // No cookies/session attached → cache-friendly, RLS-enforced
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
}