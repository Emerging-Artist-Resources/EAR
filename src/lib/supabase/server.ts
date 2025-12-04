import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function getSupabaseServerClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseKey) {
    return createRouteHandlerClient({ 
      cookies: () => cookieStore,
      supabaseUrl,
      supabaseKey,
    } as Parameters<typeof createRouteHandlerClient>[0])
  }
  
  // Fallback to default env resolution
  return createRouteHandlerClient({ cookies: () => cookieStore })
}


