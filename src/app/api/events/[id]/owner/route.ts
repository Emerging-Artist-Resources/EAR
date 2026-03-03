import { NextRequest, NextResponse } from "next/server"
import { getListingForOwnerRepo } from "@/features/events/server/read"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { handleApiError } from "@/lib/api-utils"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const { id } = await ctx.params
    const supabase = await getSupabaseServerClient()
    
    // Verify ownership
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("created_by")
      .eq("id", id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
    }

    if (listing.created_by !== auth.user.id) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
    }

    const data = await getListingForOwnerRepo(id)
    return NextResponse.json({ data })
  } catch (err) {
    // Better error logging for Supabase errors
    if (err && typeof err === 'object') {
      const errorObj = err as Record<string, unknown>
      console.error("Event owner GET error:", {
        code: errorObj.code,
        message: errorObj.message,
        details: errorObj.details,
        hint: errorObj.hint,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
      })
    } else {
      console.error("Event owner GET error:", err instanceof Error ? err.message : String(err))
    }
    return handleApiError(err)
  }
}
