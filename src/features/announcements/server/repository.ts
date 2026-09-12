import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { DASHBOARD_WIDGET_ON_KINDS } from "@/features/announcements/types"
import type { AnnouncementRow } from "./map-announcement"

const PUBLIC_COLUMNS =
  "id,title,content,published_at,created_at,hero_image_url,cta_kind,cta_label,cta_href,cta_secondary_kind,cta_secondary_label,cta_secondary_href"
const PUBLIC_COLUMNS_CTA =
  "id,title,content,published_at,created_at,hero_image_url,cta_kind,cta_label,cta_href"
const PUBLIC_COLUMNS_LEGACY = "id,title,content,published_at,created_at"

const ADMIN_COLUMNS =
  "id,title,content,published_at,archived_at,author_user_id,created_at,hero_image_url,cta_kind,cta_label,cta_href,cta_secondary_kind,cta_secondary_label,cta_secondary_href,dashboard_widget,dashboard_widget_label,dashboard_widget_value,dashboard_widget_body,dashboard_learn_more_enabled,popup_enabled,popup_headline,popup_body,popup_cta_label,popup_learn_more_enabled,popup_show_announcement_cta,popup_revision"
const ADMIN_COLUMNS_FLAGS =
  "id,title,content,published_at,archived_at,author_user_id,created_at,hero_image_url,cta_kind,cta_label,cta_href,dashboard_widget,dashboard_widget_label,dashboard_widget_value,dashboard_widget_body,dashboard_learn_more_enabled,popup_enabled,popup_headline,popup_body,popup_cta_label,popup_learn_more_enabled,popup_show_announcement_cta,popup_revision"
const ADMIN_COLUMNS_BODY =
  "id,title,content,published_at,archived_at,author_user_id,created_at,hero_image_url,cta_kind,cta_label,cta_href,dashboard_widget,dashboard_widget_label,dashboard_widget_value,dashboard_widget_body,popup_enabled,popup_headline,popup_body,popup_cta_label,popup_revision"
const ADMIN_COLUMNS_POPUP =
  "id,title,content,published_at,archived_at,author_user_id,created_at,hero_image_url,cta_kind,cta_label,cta_href,dashboard_widget,dashboard_widget_label,dashboard_widget_value,popup_enabled,popup_headline,popup_body,popup_cta_label,popup_revision"
const ADMIN_COLUMNS_DASHBOARD =
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

  const withCta = await anonClient
    .from("announcements")
    .select(PUBLIC_COLUMNS_CTA)
    .is("archived_at", null)
    .not("published_at", "is", null)
    .limit(limit)
    .order("created_at", { ascending: false })
  if (!withCta.error) return (withCta.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withCta.error)) throw withCta.error

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

  const withFlags = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS_FLAGS)
    .order("created_at", { ascending: false })
  if (!withFlags.error) return (withFlags.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withFlags.error)) throw withFlags.error

  const withBody = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS_BODY)
    .order("created_at", { ascending: false })
  if (!withBody.error) return (withBody.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withBody.error)) throw withBody.error

  const withPopup = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS_POPUP)
    .order("created_at", { ascending: false })
  if (!withPopup.error) return (withPopup.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withPopup.error)) throw withPopup.error

  const withDashboard = await supabase
    .from("announcements")
    .select(ADMIN_COLUMNS_DASHBOARD)
    .order("created_at", { ascending: false })
  if (!withDashboard.error) return (withDashboard.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withDashboard.error)) throw withDashboard.error

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
  "id,title,dashboard_widget,dashboard_widget_label,dashboard_widget_value,dashboard_widget_body,dashboard_learn_more_enabled"
const DASHBOARD_WIDGET_COLUMNS_BODY =
  "id,title,dashboard_widget,dashboard_widget_label,dashboard_widget_value,dashboard_widget_body"
const DASHBOARD_WIDGET_COLUMNS_VALUE =
  "id,title,content,dashboard_widget,dashboard_widget_label,dashboard_widget_value"
const DASHBOARD_WIDGET_COLUMNS_LEGACY =
  "id,title,content,dashboard_widget,dashboard_widget_label"

export async function listDashboardWidgetAnnouncementsRepo(): Promise<AnnouncementRow[]> {
  const anonClient = getSupabaseServerClientAnon()
  const first = await anonClient
    .from("announcements")
    .select(DASHBOARD_WIDGET_COLUMNS)
    .in("dashboard_widget", [...DASHBOARD_WIDGET_ON_KINDS])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .order("created_at", { ascending: false })
  if (!first.error) return (first.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(first.error)) throw first.error

  const withBody = await anonClient
    .from("announcements")
    .select(DASHBOARD_WIDGET_COLUMNS_BODY)
    .in("dashboard_widget", [...DASHBOARD_WIDGET_ON_KINDS])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .order("created_at", { ascending: false })
  if (!withBody.error) return (withBody.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withBody.error)) throw withBody.error

  const withValue = await anonClient
    .from("announcements")
    .select(DASHBOARD_WIDGET_COLUMNS_VALUE)
    .in("dashboard_widget", [...DASHBOARD_WIDGET_ON_KINDS])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .order("created_at", { ascending: false })
  if (!withValue.error) return (withValue.data ?? []) as AnnouncementRow[]
  if (!isMissingColumnError(withValue.error)) throw withValue.error

  const second = await anonClient
    .from("announcements")
    .select(DASHBOARD_WIDGET_COLUMNS_LEGACY)
    .in("dashboard_widget", [...DASHBOARD_WIDGET_ON_KINDS])
    .is("archived_at", null)
    .not("published_at", "is", null)
    .order("created_at", { ascending: false })
  if (!second.error) return (second.data ?? []) as AnnouncementRow[]
  if (isMissingColumnError(second.error)) return []
  throw second.error
}

const POPUP_COLUMNS =
  "id,title,published_at,archived_at,popup_enabled,popup_headline,popup_body,popup_cta_label,popup_learn_more_enabled,popup_show_announcement_cta,popup_revision,cta_kind,cta_label,cta_href"
const POPUP_COLUMNS_NO_FLAGS =
  "id,title,published_at,archived_at,popup_enabled,popup_headline,popup_body,popup_cta_label,popup_revision,cta_kind,cta_label,cta_href"
const POPUP_COLUMNS_NO_CTA =
  "id,title,published_at,archived_at,popup_enabled,popup_headline,popup_body,popup_cta_label,popup_revision"

export async function getActivePopupAnnouncementRepo(): Promise<AnnouncementRow | null> {
  const anonClient = getSupabaseServerClientAnon()
  const query = (columns: string) =>
    anonClient
      .from("announcements")
      .select(columns)
      .eq("popup_enabled", true)
      .is("archived_at", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle()

  const first = await query(POPUP_COLUMNS)
  if (!first.error) return (first.data as AnnouncementRow | null) ?? null
  if (!isMissingColumnError(first.error)) throw first.error

  const withCta = await query(POPUP_COLUMNS_NO_FLAGS)
  if (!withCta.error) return (withCta.data as AnnouncementRow | null) ?? null
  if (!isMissingColumnError(withCta.error)) throw withCta.error

  const second = await query(POPUP_COLUMNS_NO_CTA)
  if (second.error) {
    if (isMissingColumnError(second.error)) return null
    throw second.error
  }
  return (second.data as AnnouncementRow | null) ?? null
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
  cta_secondary_kind?: string | null
  cta_secondary_label?: string | null
  cta_secondary_href?: string | null
  dashboard_widget?: string | null
  dashboard_widget_label?: string | null
  dashboard_widget_value?: string | null
  dashboard_widget_body?: string | null
  dashboard_learn_more_enabled?: boolean | null
  popup_enabled?: boolean | null
  popup_headline?: string | null
  popup_body?: string | null
  popup_cta_label?: string | null
  popup_learn_more_enabled?: boolean | null
  popup_show_announcement_cta?: boolean | null
  popup_revision?: number | null
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
