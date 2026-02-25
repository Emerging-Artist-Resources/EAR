// src/app/api/calendar/listing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getListingPublicRepo } from "@/features/events/server/read"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    
    // Get the base listing data (now includes piece_details)
    const listingData = await getListingPublicRepo(id)
    
    // Fetch contact info separately since getListingPublicRepo doesn't include them
    const supabase = getSupabaseServerClientAnon()
    const { data: additionalData, error: additionalError } = await supabase
      .from("listings")
      .select(`
        contact_name, 
        pronouns, 
        contact_email
      `)
      .eq("id", id)
      .eq("status", "approved")
      .is("deleted_at", null)
      .single()
    
    if (additionalError) {
      console.error("Error fetching additional data:", additionalError)
    }
    
    const result = {
      ...listingData,
      contact_name: additionalData?.contact_name ?? null,
      pronouns: additionalData?.pronouns ?? null,
      contact_email: additionalData?.contact_email ?? null,
    }
    
    return NextResponse.json({ data: result }, { 
      headers: { "Cache-Control": "s-maxage=60" } 
    })
  } catch (err) {
    console.error("Listing public GET error:", err instanceof Error ? err.message : String(err))
    if (err instanceof Error && err.message.includes("not found")) {
      return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
    }
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
