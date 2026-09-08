import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import type { AnnouncementRow } from "./map-announcement"

const PUBLIC_COLUMNS =
  "id,title,content,published_at,created_at,hero_image_url,cta_kind,cta_label,cta_href"
const PUBLIC_COLUMNS_LEGACY = "id,title,content,published_at,created_at"

const ADMIN_COLUMNS =
  "id,title,content,published_at,archived_at,author_user_id,created_at,hero_image_url,cta_kind,cta_label,cta_href,dashboard_widget,dashboard_widget_label,dashboard_widget_value"
const ADMIN_COLUMNS_WIDGET =
  "id,title,content,published_at,archived_at,author_user_id,created_at,hero_image_url,cta_kind,cta_label,cta_href,dashboard_widget,dashboard_widget_label"
const ADMIN_COLUMNS_CARDS =
  "id,title,content,published_at,archived_at,author_user_id,created_at,hero_image_url,cta_kind,cta_label,cta_href"
const ADMIN_COLUMNS_LEGACY =
  "id,title,content,published_at,archived_at,author_user_id,created_at"

function isMissingColumnError(error: { code?: string } | null): boolean {
  return error?.code === "42703"
}

export async function listAnnouncementsRepo(limit = 50): Promise<AnnouncementRow[]> {
  const anonClient = getSupabaseServerClientAnon()
  const query = () =>
    anonClient
      .from("announcements")
      .select(PUBLIC_COLUMNS)
      .is("archived_at", null)
      .not("published_at", "is", null)
      .limit(limit)
      .order("created_at", { ascending: false })

  const first = await query()
  if (!first.error) return (first.data ?? []) as AnnouncementRow[]

  if (!isMissingColumnError(first.error)) throw first.error

  const { data, error } = await anonClient
    .from("announcements")
    .select(PUBLIC_COLUMNS_LEGACY)
    .is("archived_at", null)
    .not("published_at", "is", null)
    .limit(limit)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as AnnouncementRow[]
}

export async function listAnnouncementsRepoAdmin(): Promise<AnnouncementRow[]> {
  const supabase = await getSupabaseServerClient()
  const first = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS)
    .order("created_at", { ascending: false })
  if (!first.error) return (first.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(first.error)) throw first.error

  const withWidget = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS_WIDGET)
    .order("created_at", { ascending: false })
  if (!withWidget.error) return (withWidget.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withWidget.error)) throw withWidget.error

  const second = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS_CARDS)
    .order("created_at", { ascending: false })
  if (!second.error) return (second.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(second.error)) throw second.error

  const { data, error } = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS_LEGACY)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as AnnouncementRow[]
}

const DASHBOARD_WIDGET_COLUMNS =
  "id,title,content,dashboard_widget,dashboard_widget_label,dashboard_widget_value"
const DASHBOARD_WIDGET_COLUMNS_LEGACY =
  "id,title,content,dashboard_widget,dashboard_widget_label"

export async function listDashboardWidgetAnnouncementsRepo(): Promise<AnnouncementRow[]> {
  const anonClient = getSupabaseServerClientAnon()
  const first = await anonClient
    .from("announcements")
    .select(DASHBOARD_WIDGET_COLUMNS)
    .in("dashboard_widget", ["member_code", "copyable_value"])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .order("created_at", { ascending: false })
  if (!first.error) return (first.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(first.error)) throw first.error

  const second = await anonClient
    .from("announcements")
    .select(DASHBOARD_WIDGET_COLUMNS_LEGACY)
    .in("dashboard_widget", ["member_code", "copyable_value"])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .order("created_at", { ascending: false })
  if (!second.error) return (second.data ?? []) as AnnouncementRow[]
  if (isMissingColumnError(second.error)) return []
  throw second.error
}

export async function getAnnouncementRepo(id: string): Promise<AnnouncementRow | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.from("announcements").select("*").eq("id", id).single()
  if (error) throw error
  return data as AnnouncementRow
}

export async function createAnnouncementRepo(payload: {
  title: string
  content: string
  author_user_id: string
  published_at?: string | Date | null
  archived_at?: string | Date | null
  hero_image_url?: string | null
  cta_kind?: string | null
  cta_label?: string | null
  cta_href?: string | null
  dashboard_widget?: string | null
  dashboard_widget_label?: string | null
  dashboard_widget_value?: string | null
}) {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase.from("announcements").insert(payload).select().single()
  if (error) throw error
  return data as AnnouncementRow
}

export async function updateAnnouncementRepo(id: string, updatePayload: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("announcements")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as AnnouncementRow
}

export async function deleteAnnouncementRepo(id: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from("announcements").delete().eq("id", id)
  if (error) throw error
}
