import { getSupabaseServiceClient } from "@/lib/supabase/service"
import type { AdminListingDateBasis } from "@/lib/admin/listing-date-filter"
import { parseAdminListingDateRange } from "@/lib/admin/listing-date-filter"
import type { ListingStatus } from "./repository-types"
import {
  computeListingTitle,
  enrichWithParentTitle,
  generatePhotoUrls,
  fetchParentTitles,
  collectParentListingIds,
} from "./admin-utils"

const ADMIN_LIST_SELECT = `
  id, type, status, submitted_at,
  performance_details (title, subtype),
  audition_details (title),
  creative_details (title),
  class_workshop_details!class_workshop_details_listing_id_fkey (title, class_workshop_type, parent_workshop_name, parent_listing_id),
  piece_details!piece_details_listing_id_fkey (parent_event_name, parent_listing_id, piece_title, piece_company, piece_company_website)
`

function statusFilterFor(status: ListingStatus): string[] {
  return status === "pending" ? ["pending", "pending_payment"] : [status]
}

async function mapAdminListingRows(
  data: Record<string, unknown>[],
  displayDates?: Map<string, string>,
) {
  const svc = getSupabaseServiceClient()
  const allParentIds = collectParentListingIds(data)
  const parentTitles = await fetchParentTitles(allParentIds, svc)

  return data.map((e) => {
    const title = computeListingTitle(e, parentTitles)
    const id = e.id as string

    return {
      id,
      type: e.type,
      status: e.status,
      submitted_at: e.submitted_at as string,
      title,
      display_date: displayDates?.get(id) ?? (e.submitted_at as string),
    }
  })
}

async function getListingOccurrenceDisplayDates(
  dateBasis: "event" | "deadline",
  range: { fromISO?: string; toISO?: string },
): Promise<Map<string, string>> {
  const svc = getSupabaseServiceClient()
  let query = svc
    .from("listing_occurrences")
    .select("listing_id, starts_at_utc")
    .order("starts_at_utc", { ascending: true })

  if (dateBasis === "event") {
    query = query.or("occurrence_type.eq.event,occurrence_type.is.null")
  } else {
    query = query.eq("occurrence_type", "deadline")
  }

  if (range.fromISO) query = query.gte("starts_at_utc", range.fromISO)
  if (range.toISO) query = query.lte("starts_at_utc", range.toISO)

  const { data, error } = await query
  if (error) throw error

  const displayDates = new Map<string, string>()
  for (const row of data ?? []) {
    const listingId = row.listing_id as string
    if (!displayDates.has(listingId)) {
      displayDates.set(listingId, row.starts_at_utc as string)
    }
  }
  return displayDates
}

export async function listAdminListingsRepo(params: {
  status: ListingStatus
  limit: number
  dateFrom?: string
  dateTo?: string
  dateBasis?: AdminListingDateBasis
}) {
  const svc = getSupabaseServiceClient()
  const statusFilter = statusFilterFor(params.status)
  const dateRange = parseAdminListingDateRange(params.dateFrom, params.dateTo)
  const dateBasis = params.dateBasis ?? "submitted"

  if (!dateRange || dateBasis === "submitted") {
    let query = svc
      .from("listings")
      .select(ADMIN_LIST_SELECT)
      .in("status", statusFilter)
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false })
      .limit(params.limit)

    if (dateRange) {
      if (dateRange.fromISO) query = query.gte("submitted_at", dateRange.fromISO)
      if (dateRange.toISO) query = query.lte("submitted_at", dateRange.toISO)
    }

    const { data, error } = await query
    if (error) throw error
    return mapAdminListingRows(data ?? [])
  }

  const displayDates = await getListingOccurrenceDisplayDates(dateBasis, dateRange)
  const listingIds = [...displayDates.entries()]
    .sort(
      ([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime(),
    )
    .map(([id]) => id)
    .slice(0, params.limit)

  if (listingIds.length === 0) return []

  const { data, error } = await svc
    .from("listings")
    .select(ADMIN_LIST_SELECT)
    .in("id", listingIds)
    .in("status", statusFilter)
    .is("deleted_at", null)

  if (error) throw error

  const mapped = await mapAdminListingRows(data ?? [], displayDates)
  return mapped.sort(
    (a, b) =>
      new Date(a.display_date ?? a.submitted_at).getTime() -
      new Date(b.display_date ?? b.submitted_at).getTime(),
  )
}

export async function getAdminListingDetailRepo(listingId: string) {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from("listings")
    .select(`
      id, type, status, submitted_at,
      contact_name, pronouns, contact_email, company, company_website,
      address, place_id, lat, lng, venue_name, location_instructions,
      social_handles, notes, meta,
      performance_details (*),
      audition_details (*),
      creative_details (*),
      class_workshop_details!class_workshop_details_listing_id_fkey (*),
      piece_details!piece_details_listing_id_fkey (*),
      listing_occurrences!listing_occurrences_listing_id_fkey (*),
      listing_photos (*)
    `)
    .eq("id", listingId)
    .is("deleted_at", null)
    .single()
  if (error) throw error

  await enrichWithParentTitle(data, svc)

  if (data.listing_photos && Array.isArray(data.listing_photos) && data.listing_photos.length > 0) {
    data.listing_photos = await generatePhotoUrls(data.listing_photos, data.status, svc)
  }

  return data
}
