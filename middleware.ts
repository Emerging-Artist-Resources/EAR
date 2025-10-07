import { type NextRequest, NextResponse } from "next/server"

export function middleware(_req: NextRequest) {
  // Placeholder for future auth-aware middleware if needed
  return NextResponse.next()
}

export const config = {
  matcher: [
    // add protected routes later, e.g., '/admin/:path*'
  ],
}


