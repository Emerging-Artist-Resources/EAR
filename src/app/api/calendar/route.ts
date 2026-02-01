// src/app/api/calendar/route.ts
import { NextResponse } from "next/server"
import { listCalendarItemsRepo, listDeadlinesRepo } from "@/features/events/server/repository"
type EventType = "performance" | "audition" | "creative" | "class" | "funding"

function isoOrDefault(s: string | null, d: Date) {
  if (!s) return d.toISOString()
  const dt = new Date(s)
  return isNaN(+dt) ? d.toISOString() : dt.toISOString()
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    // Use start of today for "from" to include deadlines/events that are today
    const from = isoOrDefault(url.searchParams.get("from"), startOfToday())
    const to = isoOrDefault(
      url.searchParams.get("to"),
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // +30d
    )
    const types = (url.searchParams.get("types") ?? "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean) as EventType[]
    //const borough = url.searchParams.get("borough") as string | null
    const q = url.searchParams.get("q")?.toLowerCase() ?? null
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 500), 1000)
    const includeDeadlines = url.searchParams.get("includeDeadlines") === "true"

    const items = await listCalendarItemsRepo({
      fromISO: from,
      toISO: to,
      types,
      //borough: borough as string | null,
      limit,
    })

    let deadlines: typeof items = []
    if (includeDeadlines) {
      // Only fetch deadlines for auditions and creative opportunities
      // If types filter is empty, fetch all deadlines (pass undefined)
      // If types filter includes audition/creative, only fetch those
      // If types filter only includes performance/class, don't fetch deadlines
      const deadlineTypes = types.length > 0
        ? types.filter(t => t === "audition" || t === "creative")
        : undefined
      
      if (!deadlineTypes || deadlineTypes.length > 0) {
        deadlines = await listDeadlinesRepo({
          fromISO: from,
          toISO: to,
          types: deadlineTypes,
          limit: 100,
        })
      }
    }

    // lightweight client-side text filter
    const filteredItems = q
      ? items.filter(i => i.title?.toLowerCase().includes(q))
      : items
    
    const filteredDeadlines = q
      ? deadlines.filter(i => i.title?.toLowerCase().includes(q))
      : deadlines

    // cache for 60s at the edge/CDN
    // Return wrapped in 'data' to match ApiResponse<T> structure, but include deadlines at top level
    return NextResponse.json(
      { 
        data: {
          data: filteredItems,
          deadlines: filteredDeadlines
        }
      }, 
      { headers: { "Cache-Control": "s-maxage=60" } }
    )
  } catch (err) {
    console.error("Calendar GET error:", err)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}





// // src/app/api/calendar/route.ts
// import { NextResponse } from "next/server"
// import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"

// export async function GET(req: Request) {
//   const url = new URL(req.url)
//   const from = url.searchParams.get("from") ?? new Date().toISOString()
//   const to   = url.searchParams.get("to")   ?? new Date(Date.now()+1000*60*60*24*30).toISOString()
//   const types = (url.searchParams.get("types") ?? "").split(",").filter(Boolean)
//   const borough = url.searchParams.get("borough") ?? null
//   const q = url.searchParams.get("q")?.trim() || null

//   const supabase = getSupabaseServerClientAnon()

//   // Pull upcoming occurrences with their parent event + the name from the right details table
//   const { data, error } = await supabase
//     .from("event_occurrences")
//     .select(`
//       id, event_id, starts_at_utc, tz,
//       events!inner (
//         id, type, status, borough,
//         performance_details (show_name),
//         audition_details (audition_name),
//         opportunity_details (opportunity_name),
//         class_details (class_name),
//         funding_details (title)
//       )
//     `)
//     .eq("events.status", "approved")
//     .gte("starts_at_utc", from)
//     .lte("starts_at_utc", to)
//     .order("starts_at_utc", { ascending: true })

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 })

//   // Client-side filters (simple + fast); move to SQL later if needed
//   let items = (data ?? [])
//     .filter(row => !borough || row.events.borough === borough)
//     .filter(row => !types.length || types.includes(row.events.type))
//     .map(row => {
//       const e = row.events
//       const title =
//         e.type === "performance"  ? e.performance_details?.show_name :
//         e.type === "audition"     ? e.audition_details?.audition_name :
//         e.type === "creative"     ? e.opportunity_details?.opportunity_name :
//         e.type === "class"        ? e.class_details?.class_name :
//         e.type === "funding"      ? e.funding_details?.title :
//         "Untitled"
//       return {
//         occurrenceId: row.id,
//         eventId: row.event_id,
//         type: e.type,
//         title,
//         start: row.starts_at_utc,
//         tz: row.tz,
//       }
//     })

//   if (q) {
//     const ql = q.toLowerCase()
//     items = items.filter(i => i.title?.toLowerCase().includes(ql))
//   }

//   // Suggest: cache for 60s
//   return NextResponse.json(items, { headers: { "Cache-Control": "s-maxage=60" } })
// }
