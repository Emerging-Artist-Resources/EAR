"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  if (supabaseUrl && supabaseKey) {
    // Pass explicitly if available (supports .env or legacy names)
    return createClientComponentClient({ supabaseUrl, supabaseKey } as unknown as Parameters<typeof createClientComponentClient>[0])
  }
  // Fallback to default env resolution
  return createClientComponentClient()
}


