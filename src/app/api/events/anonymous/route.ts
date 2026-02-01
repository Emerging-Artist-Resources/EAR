// src/app/api/events/anonymous/route.ts
// NOTE: Anonymous submissions are disabled - all submissions require authentication
import { NextRequest, NextResponse } from "next/server"

export async function POST(_req: NextRequest) {
  // Block anonymous submissions - all submissions require authentication
  return NextResponse.json(
    { error: { code: "FORBIDDEN", message: "Anonymous submissions are not allowed. Please sign in to submit." } },
    { status: 403 }
  )
}
