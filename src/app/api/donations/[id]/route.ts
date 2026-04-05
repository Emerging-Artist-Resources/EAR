import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"

/** Success polling must see fresh `payment_status`; do not statically cache this route. */
export const dynamic = "force-dynamic"

/**
 * Success page polls this by donation id (from the Stripe redirect URL). Donors are often
 * unauthenticated; RLS would hide rows from the anon server client. Service role is used only
 * to load the row by primary key (unguessable UUID).
 *
 * Only `payment_status` and `recipient_user_id` are returned — enough to confirm payment and
 * (for artist pages) detect donation/recipient mismatch; no donor message or PII in the payload.
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
      .select("payment_status, recipient_user_id")
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
