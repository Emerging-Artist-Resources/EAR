import { createClient } from "@supabase/supabase-js"
import { getServiceEnv } from "@/lib/env"

export function getSupabaseServiceClient() {
  const { SUPABASE_URL, SERVICE_ROLE_KEY } = getServiceEnv()
  return createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}