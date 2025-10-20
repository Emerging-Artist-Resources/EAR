// src/app/api/calendar/occurrence/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getSupabaseServiceClient } from "@/lib/supabase/service" // for signed URL

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const anon = getSupabaseServerClientAnon()

    // Join occurrence -> event -> minimal detail fields
    const { data, error } = await anon
      .from("event_occurrences")
      .select(`
        id, event_id, starts_at_utc, tz,
        events!inner(
          id, type, status, borough,
          performance_details (show_name, short_description),
          audition_details (audition_name, about_project),
          opportunity_details (opportunity_name, brief_description),
          class_details (class_name, description),
          funding_details (title, summary),
          event_photos (id, path, credit, sort_order)
        )
      `)
      .eq("id", id)
      .eq("events.status", "approved")
      .single()

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const e = (data as unknown as { events: { type: string; borough?: string | null; performance_details?: { show_name: string; short_description: string; } | undefined; audition_details?: { audition_name: string; about_project: string; } | undefined; opportunity_details?: { opportunity_name: string; brief_description: string; } | undefined; class_details?: { class_name: string; description: string; } | undefined; funding_details?: { title: string; summary: string; } | undefined; event_photos?: { id: string; path: string; credit: string; sort_order: number; }[]; } }).events
    const title =
      e.type === "performance" ? e.performance_details?.show_name :
      e.type === "audition"    ? e.audition_details?.audition_name :
      e.type === "creative"    ? e.opportunity_details?.opportunity_name :
      e.type === "class"       ? e.class_details?.class_name :
      e.funding_details?.title ?? "Untitled"

    // Pick first photo and sign it (private bucket)
    const firstPhoto = (e.event_photos ?? []).sort((a: { sort_order: number; }, b: { sort_order: number; }) => a.sort_order - b.sort_order)[0]
    let heroUrl: string | null = null
    if (firstPhoto?.path) {
      const svc = getSupabaseServiceClient()
      const { data: signed } = await svc.storage.from("event-photos")
        .createSignedUrl(firstPhoto.path, 60) // seconds
      heroUrl = signed?.signedUrl ?? null
    }

    return NextResponse.json({
      occurrenceId: data.id,
      eventId: data.event_id,
      type: e.type,
      title,
      start: data.starts_at_utc,
      tz: data.tz,
      excerpt:
        e.type === "performance" ? e.performance_details?.short_description :
        e.type === "audition"    ? e.audition_details?.about_project :
        e.type === "creative"    ? e.opportunity_details?.brief_description :
        e.type === "class"       ? e.class_details?.description :
        e.funding_details?.summary ?? null,
      borough: (e as { borough?: string | null }).borough ?? null,
      heroPhoto: heroUrl ? { url: heroUrl, credit: firstPhoto?.credit ?? null } : null,
    }, { headers: { "Cache-Control": "s-maxage=30" } })
  } catch (err) {
    console.error("Inspect occurrence error:", err)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
