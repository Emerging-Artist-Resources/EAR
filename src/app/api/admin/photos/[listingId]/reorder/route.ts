import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { getAuthenticatedUser, hasRole } from "@/lib/auth/helpers"

const bodySchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ listingId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
    }

    const { listingId } = await ctx.params
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "INVALID_BODY" } }, { status: 400 })
    }
    const { photoIds } = parsed.data

    const svc = getSupabaseServiceClient()

    const { data: listing, error: listingErr } = await svc
      .from("listings")
      .select("id")
      .eq("id", listingId)
      .maybeSingle()

    if (listingErr) throw listingErr
    if (!listing) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
    }

    const { data: rows, error: photosErr } = await svc
      .from("listing_photos")
      .select("id")
      .eq("listing_id", listingId)

    if (photosErr) throw photosErr

    const existingIds = new Set((rows ?? []).map((r) => r.id))
    if (photoIds.length !== existingIds.size || !photoIds.every((id) => existingIds.has(id))) {
      return NextResponse.json({ error: { code: "INVALID_ORDER" } }, { status: 400 })
    }

    for (let i = 0; i < photoIds.length; i++) {
      const { error: upErr } = await svc
        .from("listing_photos")
        .update({ sort_order: i })
        .eq("id", photoIds[i])
        .eq("listing_id", listingId)
      if (upErr) throw upErr
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Admin photos reorder error:", err)
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 })
  }
}
