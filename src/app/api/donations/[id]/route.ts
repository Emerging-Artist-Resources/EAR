import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"

/**
 * Success page polls this by donation id (from the Stripe redirect URL). Donors are often
 * unauthenticated; RLS would hide rows from the anon server client. Service role is used only
 * to load the row by primary key (unguessable UUID); returned fields stay minimal.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const supabase = getSupabaseServiceClient()

    const { data, error } = await supabase
      .from("donations")
      .select(
        "id, amount, base_gift_cents, fee_model_version, stripe_account, payment_status, donor_name, message, created_at, recipient_user_id",
      )
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
