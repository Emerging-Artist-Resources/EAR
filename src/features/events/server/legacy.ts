import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createListingOwnedRepo, createListingAnonymousRepo } from "./create"
import { getListingPublicRepo, getListingForOwnerRepo, listMyListingsRepo } from "./read"
import { updatePendingListingRepo } from "./update"
import { approveListingRepo, rejectListingRepo, listAdminListingsRepo, getAdminListingDetailRepo } from "./admin"

export async function createEventOwnedRepo(
  supabase: SupabaseClient,
  input: Parameters<typeof createListingOwnedRepo>[1]
) {
  return createListingOwnedRepo(supabase, input)
}

export async function createEventAnonymousRepo(
  serviceSupabase: ReturnType<typeof getSupabaseServiceClient>,
  input: Parameters<typeof createListingAnonymousRepo>[1]
) {
  return createListingAnonymousRepo(serviceSupabase, input)
}

export async function listEvents(params: {
  status?: string | null
  userId?: string | null
  limit?: number
  cursor?: string | null
}) {
  const supabase = await getSupabaseServerClient()
  let query = supabase.from("listings").select("*").is("deleted_at", null)
  if (params.status) query = query.eq("status", params.status)
  if (params.userId) query = query.eq("created_by", params.userId)
  query = query.order("submitted_at", { ascending: false })
  const limit = params.limit && params.limit > 0 ? params.limit : 20
  query = query.range(0, Math.max(0, limit - 1))
  const { data, error } = await query
  if (error) throw error
  return { items: data, nextCursor: null }
}

export async function getEventPublicRepo(listingId: string) {
  return getListingPublicRepo(listingId)
}

export async function getEventForOwnerRepo(listingId: string) {
  return getListingForOwnerRepo(listingId)
}

export async function listMyEventsRepo() {
  const result = await listMyListingsRepo()
  return result.listings
}

export async function updatePendingEventRepo(
  listingId: string,
  patch: Parameters<typeof updatePendingListingRepo>[1]
) {
  return updatePendingListingRepo(listingId, patch)
}

export async function approveEventRepo(
  listingId: string,
  reviewerId: string,
  admin_notes?: string
) {
  return approveListingRepo(listingId, reviewerId, admin_notes)
}

export async function rejectEventRepo(
  listingId: string,
  reviewerId: string,
  admin_notes?: string
) {
  return rejectListingRepo(listingId, reviewerId, admin_notes)
}

export async function listAdminEventsRepo(params: {
  status: "pending" | "approved" | "rejected"
  limit: number
}) {
  return listAdminListingsRepo(params)
}

export async function getAdminEventDetailRepo(listingId: string) {
  return getAdminListingDetailRepo(listingId)
}
