import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { getUserRole } from "@/lib/authz"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = new URL(req.url)
  if (pathname.startsWith('/admin')) {
    const role = getUserRole(user)
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }
  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}


