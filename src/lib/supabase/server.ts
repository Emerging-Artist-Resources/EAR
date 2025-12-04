import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}


