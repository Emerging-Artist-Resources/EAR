import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import { trySendWelcomeEmail } from "@/lib/email/trySendWelcomeEmail"

export async function POST() {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      )
    }

    const result = await trySendWelcomeEmail({ userId: auth.user.id })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[welcome-email] API error", error)
    return NextResponse.json({ sent: false, reason: "error" as const }, { status: 200 })
  }
}
