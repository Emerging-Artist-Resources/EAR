import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export function getSupabaseServerClient() {
  // auth-helpers resolves env automatically; cookies binds auth session
  return createRouteHandlerClient({ cookies })
}


