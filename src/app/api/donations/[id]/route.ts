import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("donations")
      .select("id, amount, payment_status, donor_name, message, created_at, recipient_user_id")
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Donation not found" } },
        { status: 404 }
      )
    }

    return createSuccessResponse(data, 200)
  } catch (error) {
    return handleApiError(error)
  }
}
