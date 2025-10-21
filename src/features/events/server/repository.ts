import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"

export type CreateEventNormalizedInput = {
  type: 'performance' | 'audition' | 'creative' | 'class' | 'funding'
  contact_name: string
  pronouns?: string | null
  contact_email: string
  org_name?: string | null
  org_website?: string | null
  address: string
  social_handles: Record<string, unknown>
  notes?: string | null
  created_by: string | null
  meta: Record<string, unknown>
  borough?: string | null
  performance?: {
    show_name: string
    short_description: string
    credit_info: string
    ticket_price_cents: number
    ticket_link: string
    agree_comp_tickets: boolean
  }
  photos?: Array<{ path: string; credit?: string | null; sort_order?: number }>
  occurrences: Array<{ starts_at_utc: string; ends_at_utc?: string | null; tz: string }>
}

export async function createEventWithDetails(input: CreateEventNormalizedInput) {
  const supabase = await getSupabaseServerClient()

  // 1) Insert base event
  const baseEvent = {
    type: input.type,
    contact_name: input.contact_name,
    pronouns: input.pronouns ?? null,
    contact_email: input.contact_email,
    org_name: input.org_name ?? null,
    org_website: input.org_website ?? null,
    address: input.address,
    social_handles: input.social_handles,
    notes: input.notes ?? null,
    created_by: input.created_by,
    meta: input.meta,
    borough: input.borough ?? null,
  }

  const { data: created, error: createErr } = await supabase
    .from('events')
    .insert(baseEvent)
    .select('id, type')
    .single()
  if (createErr) throw createErr

  const eventId = created.id as string

  // 2) Insert per-type details
  if (input.type === 'performance' && input.performance) {
    const { error: perfErr } = await supabase
      .from('performance_details')
      .insert({ event_id: eventId, ...input.performance })
    if (perfErr) throw perfErr
  }

  // 3) Insert occurrences
  if (input.occurrences?.length) {
    const { error: occErr } = await supabase
      .from('event_occurrences')
      .insert(input.occurrences.map((o) => ({ ...o, event_id: eventId })))
    if (occErr) throw occErr
  }

  // 4) Insert photos
  if (input.photos?.length) {
    const limited = input.photos.slice(0, 5).map((p, idx) => ({ event_id: eventId, path: p.path, credit: p.credit ?? null, sort_order: p.sort_order ?? idx }))
    const { error: photoErr } = await supabase.from('event_photos').insert(limited)
    if (photoErr) throw photoErr
  }

  return { id: eventId }
}

export async function listEvents(params: { status?: string | null, userId?: string | null, limit?: number, cursor?: string | null }) {
  const supabase = await getSupabaseServerClient()
  let query = supabase.from('events').select('*')
  if (params.status) query = query.eq('status', params.status)
  if (params.userId) query = query.eq('created_by', params.userId)
  query = query.order('submitted_at', { ascending: false })
  const limit = params.limit && params.limit > 0 ? params.limit : 20
  query = query.range(0, Math.max(0, limit - 1))
  const { data, error } = await query
  if (error) throw error
  return { items: data, nextCursor: null }
}


type EventType = "performance" | "audition" | "creative" | "class" | "funding"

const detailTable: Record<EventType, string> = {
  performance: "performance_details",
  audition: "audition_details",
  creative: "opportunity_details",
  class: "class_details",
  funding: "funding_details",
}

/* ------------------------------------------------------------------ */
/* PUBLIC CALENDAR (approved only)                                     */
/* ------------------------------------------------------------------ */
export async function listCalendarItemsRepo(params: {
  fromISO: string
  toISO: string
  types?: EventType[]
  borough?: string | null
  limit?: number
}) {
  const supabase = getSupabaseServerClientAnon()
  const { fromISO, toISO, types = [], borough = null, limit = 500 } = params

  const sel = `
    id, event_id, starts_at_utc, tz,
    events!inner (
      id, type, status, borough,
      performance_details (show_name),
      audition_details (audition_name),
      opportunity_details (opportunity_name),
      class_details (class_name),
      funding_details (title)
    )
  `

  let q = supabase
    .from("event_occurrences")
    .select(sel)
    .eq("events.status", "approved")
    .gte("starts_at_utc", fromISO)
    .lte("starts_at_utc", toISO)
    .order("starts_at_utc", { ascending: true })
    .limit(Math.min(limit, 1000))

  if (borough) q = q.eq("events.borough", borough)
  if (types.length) q = q.in("events.type", types)

  const { data, error } = await q as unknown as { data: Array<{ id: string; event_id: string; starts_at_utc: string; tz: string; events: { type: string; borough?: string | null; performance_details?: { show_name?: string } | null; audition_details?: { audition_name?: string } | null; opportunity_details?: { opportunity_name?: string } | null; class_details?: { class_name?: string } | null; funding_details?: { title?: string } | null } }> , error: unknown }
  if (error) throw error

  // flatten for UI
  return (data ?? []).map((row) => {
    const e = row.events
    const title =
      e.type === "performance" ? e.performance_details?.show_name :
      e.type === "audition"    ? e.audition_details?.audition_name :
      e.type === "creative"    ? e.opportunity_details?.opportunity_name :
      e.type === "class"       ? e.class_details?.class_name :
      e.funding_details?.title ?? "Untitled"
    return {
      occurrenceId: row.id,
      eventId: row.event_id,
      type: e.type as EventType,
      title,
      start: row.starts_at_utc as string,
      tz: row.tz as string,
      borough: (e as { borough?: string | null }).borough ?? null,
    }
  })
}

/* ------------------------------------------------------------------ */
/* PUBLIC EVENT (approved)                                             */
/* ------------------------------------------------------------------ */
export async function getEventPublicRepo(eventId: string) {
  const supabase = getSupabaseServerClientAnon()
  const { data, error } = await supabase
    .from("events")
    .select(`
      id, type, status, borough, social_handles, notes, submitted_at,
      performance_details (*),
      audition_details (*),
      opportunity_details (*),
      class_details (*),
      funding_details (*),
      event_occurrences (*),
      event_photos (*)
    `)
    .eq("id", eventId)
    .eq("status", "approved")
    .single()

  if (error) throw error
  return data
}

/* ------------------------------------------------------------------ */
/* OWNER reads (any status)                                            */
/* ------------------------------------------------------------------ */
export async function listMyEventsRepo() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from("events")
    .select(`id, type, status, submitted_at`)
    .eq("created_by", user.id)
    .order("submitted_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getEventForOwnerRepo(eventId: string) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("events")
    .select(`
      id, type, status, borough, social_handles, notes, submitted_at,
      performance_details (*),
      audition_details (*),
      opportunity_details (*),
      class_details (*),
      funding_details (*),
      event_occurrences (*),
      event_photos (*)
    `)
    .eq("id", eventId)
    // RLS lets owners read their own; no need to add created_by filter here
    .single()

  if (error) throw error
  return data
}

/* ------------------------------------------------------------------ */
/* CREATE (authenticated owner)                                        */
/* Owner can edit while status='pending' per RLS                       */
/* ------------------------------------------------------------------ */
export async function createEventOwnedRepo(input: {
  type: EventType
  base: {
    contact_name: string
    contact_email: string
    org_name?: string | null
    org_website?: string | null
    address?: string | null
    social_handles?: Record<string, unknown>
    notes?: string | null
    borough?: string | null
  }
  details: Record<string, unknown>           // matches the chosen detail table
  occurrences: Array<{ starts_at_utc: string; ends_at_utc?: string | null; tz: string }>
  photos?: Array<{ path: string; credit?: string | null; sort_order?: number }>
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) throw new Error("Unauthorized")

  // 1) insert event
  const { data: ev, error: e1 } = await supabase
    .from("events")
    .insert({
      type: input.type,
      status: "pending",
      created_by: user.id,
      contact_name: input.base.contact_name,
      contact_email: input.base.contact_email,
      org_name: input.base.org_name ?? null,
      org_website: input.base.org_website ?? null,
      address: input.base.address ?? null,
      social_handles: input.base.social_handles ?? {},
      notes: input.base.notes ?? null,
      borough: input.base.borough ?? null,
    })
    .select("id")
    .single()
  if (e1) throw e1

  const eventId = ev.id as string

  // 2) insert detail (owner has pending CUD via RLS)
  const tbl = detailTable[input.type]
  const { error: e2 } = await supabase
    .from(tbl)
    .insert({ event_id: eventId, ...input.details })
  if (e2) throw e2

  // 3) occurrences
  if (input.occurrences?.length) {
    const { error: e3 } = await supabase
      .from("event_occurrences")
      .insert(input.occurrences.map(o => ({ ...o, event_id: eventId })))
    if (e3) throw e3
  }

  // 4) photos
  if (input.photos?.length) {
    const { error: e4 } = await supabase
      .from("event_photos")
      .insert(input.photos.map(p => ({ ...p, event_id: eventId, sort_order: p.sort_order ?? 0 })))
    if (e4) throw e4
  }

  return { id: eventId }
}

/* ------------------------------------------------------------------ */
/* CREATE (anonymous submission)                                       */
/* Use SERVICE client in the API route; this repo assumes it's called  */
/* with a service client available (DI pattern shown below).           */
/* ------------------------------------------------------------------ */
import { getSupabaseServiceClient } from "@/lib/supabase/service"
export async function createEventAnonymousRepo(serviceSupabase: ReturnType<typeof getSupabaseServiceClient>, input: {
  type: EventType
  base: {
    contact_name: string
    contact_email: string
    org_name?: string | null
    org_website?: string | null
    address?: string | null
    social_handles?: Record<string, unknown>
    notes?: string | null
    borough?: string | null
  }
  details: Record<string, unknown>
  occurrences: Array<{ starts_at_utc: string; ends_at_utc?: string | null; tz: string }>
  photos?: Array<{ path: string; credit?: string | null; sort_order?: number }>
}) {
  // 1) insert event (created_by = null)
  const { data: ev, error: e1 } = await serviceSupabase
    .from("events")
    .insert({
      type: input.type,
      status: "pending",
      created_by: null,
      contact_name: input.base.contact_name,
      contact_email: input.base.contact_email,
      org_name: input.base.org_name ?? null,
      org_website: input.base.org_website ?? null,
      address: input.base.address ?? null,
      social_handles: input.base.social_handles ?? {},
      notes: input.base.notes ?? null,
      borough: input.base.borough ?? null,
    })
    .select("id")
    .single()
  if (e1) throw e1

  const eventId = ev.id as string
  const tbl = detailTable[input.type]

  // 2) detail
  const { error: e2 } = await serviceSupabase.from(tbl).insert({ event_id: eventId, ...input.details })
  if (e2) throw e2

  // 3) occurrences
  if (input.occurrences?.length) {
    const { error: e3 } = await serviceSupabase
      .from("event_occurrences")
      .insert(input.occurrences.map(o => ({ ...o, event_id: eventId })))
    if (e3) throw e3
  }

  // 4) photos
  if (input.photos?.length) {
    const { error: e4 } = await serviceSupabase
      .from("event_photos")
      .insert(input.photos.map(p => ({ ...p, event_id: eventId, sort_order: p.sort_order ?? 0 })))
    if (e4) throw e4
  }

  return { id: eventId }
}

/* ------------------------------------------------------------------ */
/* OWNER: update while pending                                         */
/* ------------------------------------------------------------------ */
export async function updatePendingEventRepo(eventId: string, patch: {
  base?: Partial<{
    contact_name: string; contact_email: string; org_name: string | null; org_website: string | null;
    address: string | null; social_handles: Record<string, unknown>; notes: string | null; borough: string | null;
  }>
  details?: Record<string, unknown>
}) {
  const supabase = await getSupabaseServerClient()

  if (patch.base) {
    const { error } = await supabase.from("events").update(patch.base).eq("id", eventId)
    if (error) throw error
  }
  if (patch.details) {
    // Need event type to know which details table to update
    const { data: ev, error: e1 } = await supabase.from("events").select("type").eq("id", eventId).single()
    if (e1) throw e1
    const tbl = detailTable[ev.type as EventType]
    const { error: e2 } = await supabase.from(tbl).update(patch.details).eq("event_id", eventId)
    if (e2) throw e2
  }
}

/* ------------------------------------------------------------------ */
/* ADMIN actions                                                       */
/* ------------------------------------------------------------------ */
export async function approveEventRepo(eventId: string, reviewerId: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from("events")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewer_id: reviewerId })
    .eq("id", eventId)
  if (error) throw error
}

export async function rejectEventRepo(eventId: string, reviewerId: string, admin_notes?: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from("events")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewer_id: reviewerId, admin_notes: admin_notes ?? null })
    .eq("id", eventId)
  if (error) throw error
}

/* ------------------------------------------------------------------ */
/* ADMIN list/detail (service client; API enforces role)               */
/* ------------------------------------------------------------------ */
export async function listAdminEventsRepo(params: { status: 'pending'|'approved'|'rejected'; limit: number }) {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from('events')
    .select(`
      id, type, status, submitted_at,
      performance_details (show_name),
      audition_details (audition_name),
      opportunity_details (opportunity_name),
      class_details (class_name),
      funding_details (title)
    `)
    .eq('status', params.status)
    .order('submitted_at', { ascending: false })
    .limit(params.limit)
  if (error) throw error
  type Row = {
    id: string
    type: 'performance'|'audition'|'creative'|'class'|'funding'
    status: 'pending'|'approved'|'rejected'
    submitted_at: string
    performance_details?: { show_name?: string } | null
    audition_details?: { audition_name?: string } | null
    opportunity_details?: { opportunity_name?: string } | null
    class_details?: { class_name?: string } | null
    funding_details?: { title?: string } | null
  }
  return (data ?? []).map((e) => {
    const row = e as Row
    const title =
      row.type === 'performance' ? row.performance_details?.show_name :
      row.type === 'audition'    ? row.audition_details?.audition_name :
      row.type === 'creative'    ? row.opportunity_details?.opportunity_name :
      row.type === 'class'       ? row.class_details?.class_name :
      row.funding_details?.title ?? 'Untitled'
    return { id: row.id, type: row.type, status: row.status, submitted_at: row.submitted_at, title: title ?? null }
  })
}

export async function getAdminEventDetailRepo(eventId: string) {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from('events')
    .select(`
      id, type, status, submitted_at,
      contact_name, pronouns, contact_email, org_name, org_website, address, social_handles, notes, borough, meta,
      performance_details (*),
      audition_details (*),
      opportunity_details (*),
      class_details (*),
      funding_details (*),
      event_occurrences (*),
      event_photos (*)
    `)
    .eq('id', eventId)
    .single()
  if (error) throw error
  return data
}
