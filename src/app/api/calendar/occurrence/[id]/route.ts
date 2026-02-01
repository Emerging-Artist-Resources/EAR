// src/app/api/calendar/occurrence/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const anon = getSupabaseServerClientAnon()

    // Join occurrence -> listing -> minimal detail fields
    const { data, error } = await anon
      .from("listing_occurrences")
      .select(`
        id, listing_id, starts_at_utc, tz,
        listings!inner(
          id, type, status, borough,
          performance_details (title, description),
          audition_details (title, description),
          creative_details (title, description),
          class_workshop_details (title, description),
          listing_photos (id, path, credit, sort_order)
        )
      `)
      .eq("id", id)
      .eq("listings.status", "approved")
      .is("listings.deleted_at", null)
      .single()

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const listing = (data as unknown as { listings: { type: string; borough?: string | null; performance_details?: { title: string; description: string; } | undefined; audition_details?: { title: string; description: string; } | undefined; creative_details?: { title: string; description: string; } | undefined; class_workshop_details?: { title: string; description: string; } | undefined; listing_photos?: { id: string; path: string; credit: string | null; sort_order: number; }[]; } }).listings
    const title =
      listing.type === "performance" ? listing.performance_details?.title :
      listing.type === "audition"    ? listing.audition_details?.title :
      listing.type === "creative"    ? listing.creative_details?.title :
      listing.type === "class"       ? listing.class_workshop_details?.title :
      "Untitled"

    const description =
      listing.type === "performance" ? listing.performance_details?.description :
      listing.type === "audition"    ? listing.audition_details?.description :
      listing.type === "creative"    ? listing.creative_details?.description :
      listing.type === "class"       ? listing.class_workshop_details?.description :
      null

    // Pick first photo - use public URL (approved listings use public bucket)
    const firstPhoto = (listing.listing_photos ?? []).sort((a: { sort_order: number; }, b: { sort_order: number; }) => a.sort_order - b.sort_order)[0]
    let heroUrl: string | null = null
    if (firstPhoto?.path) {
      const svc = getSupabaseServiceClient()
      // Approved listings have photos in public bucket
      heroUrl = storageService.getPublicUrl(svc, "event-photos-public", firstPhoto.path)
    }

    return NextResponse.json({
      occurrenceId: data.id,
      listingId: data.listing_id,
      type: listing.type,
      title,
      start: data.starts_at_utc,
      tz: data.tz,
      excerpt: description ?? null,
      //borough: listing.borough ?? null,
      heroPhoto: heroUrl ? { url: heroUrl, credit: firstPhoto?.credit ?? null } : null,
    }, { headers: { "Cache-Control": "s-maxage=30" } })
  } catch (err) {
    console.error("Inspect occurrence error:", err)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
