import type { SupabaseClient } from "@supabase/supabase-js"
import type { CreateListingInput } from "./repository-types"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import { UNTITLED_OPPORTUNITY_TITLE } from "@/lib/listings/type-labels"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import {
  collectParentListingIds,
  fetchParentTitles,
  normalizeSupabaseRelation,
} from "./admin-utils"

export const LISTING_TITLE_DETAIL_SELECT = `
  id, type,
  performance_details (*),
  audition_details (*),
  creative_details (*),
  class_workshop_details!class_workshop_details_listing_id_fkey (*),
  piece_details!piece_details_listing_id_fkey (*)
`

function isCreateListingInput(input: CreateListingInput | PublicListingDetail): input is CreateListingInput {
  return "details" in input && "base" in input
}

function pieceTitleFromDetails(
  pieceDetails: {
    piece_title?: string | null
    piece_company?: string | null
    parent_event_name?: string | null
    parent_listing_id?: string | null
    parent_listing_title?: string | null
  },
  parentTitles?: Record<string, string>
): string {
  const pieceTitle = pieceDetails.piece_title || pieceDetails.piece_company
  const parentName = resolvePieceParentName(pieceDetails, parentTitles)
  if (parentName && pieceTitle) {
    return `${parentName} - ${pieceTitle}`
  }
  return pieceTitle || parentName || "Untitled Piece"
}

function resolvePieceParentName(
  pieceDetails: {
    parent_listing_id?: string | null
    parent_event_name?: string | null
    parent_listing_title?: string | null
  },
  parentTitles?: Record<string, string>
): string | null {
  if (pieceDetails.parent_listing_id && parentTitles?.[pieceDetails.parent_listing_id]) {
    return parentTitles[pieceDetails.parent_listing_id] || null
  }
  return pieceDetails.parent_listing_title || pieceDetails.parent_event_name || null
}

function classTitleFromDetails(
  classDetails: {
    title?: string | null
    parent_workshop_name?: string | null
    parent_listing_id?: string | null
    parent_listing_title?: string | null
  },
  parentTitles?: Record<string, string>
): string {
  const className = classDetails.title || undefined
  const parentName = resolveClassParentName(classDetails, parentTitles)
  if (parentName && className) {
    return `${parentName} - ${className}`
  }
  return parentName || className || "Untitled Class"
}

function resolveClassParentName(
  classDetails: {
    parent_listing_id?: string | null
    parent_workshop_name?: string | null
    parent_listing_title?: string | null
  },
  parentTitles?: Record<string, string>
): string | null {
  if (classDetails.parent_listing_id && parentTitles?.[classDetails.parent_listing_id]) {
    return parentTitles[classDetails.parent_listing_id] || null
  }
  return classDetails.parent_listing_title || classDetails.parent_workshop_name || null
}

export function getListingTitle(
  input: CreateListingInput | PublicListingDetail,
  parentTitles?: Record<string, string>
): string {
  if (input.type === "performance") {
    if (isCreateListingInput(input)) {
      const subtype = input.details.subtype as string | undefined
      if (subtype === "PIECE" && input.piece_details) {
        return pieceTitleFromDetails(input.piece_details, parentTitles)
      }
      return (input.details.title as string) || "Untitled Performance"
    }

    const performanceDetails = normalizeSupabaseRelation(input.performance_details)
    const pieceDetails = normalizeSupabaseRelation(input.piece_details)
    if (performanceDetails?.subtype === "PIECE" && pieceDetails) {
      return pieceTitleFromDetails(pieceDetails, parentTitles)
    }
    return performanceDetails?.title || "Untitled Performance"
  }
  
  if (input.type === "audition") {
    if (isCreateListingInput(input)) {
      return (input.details.title as string) || "Untitled Audition"
    }
    const auditionDetails = normalizeSupabaseRelation(input.audition_details)
    return auditionDetails?.title || "Untitled Audition"
  }
  
  if (input.type === "creative") {
    if (isCreateListingInput(input)) {
      return (input.details.title as string) || UNTITLED_OPPORTUNITY_TITLE
    }
    const creativeDetails = normalizeSupabaseRelation(input.creative_details)
    return creativeDetails?.title || UNTITLED_OPPORTUNITY_TITLE
  }
  
  if (input.type === "class") {
    if (isCreateListingInput(input)) {
      const classWorkshopType = input.details.class_workshop_type as string | undefined
      if (classWorkshopType === "CLASS") {
        return classTitleFromDetails(
          {
            title: (input.details.title as string) || undefined,
            parent_workshop_name: input.details.parent_workshop_name as string | undefined,
            parent_listing_id:
              input.parent_listing_id
              ?? (input.details as { parent_listing_id?: string | null }).parent_listing_id,
          },
          parentTitles
        )
      }
      return (input.details.title as string) || "Untitled Class/Workshop"
    }

    const classWorkshopDetails = normalizeSupabaseRelation(input.class_workshop_details)
    if (classWorkshopDetails?.class_workshop_type === "CLASS") {
      return classTitleFromDetails(classWorkshopDetails, parentTitles)
    }
    return classWorkshopDetails?.title || "Untitled Class/Workshop"
  }
  
  return "Untitled Listing"
}

export async function resolveListingTitleFromRecord(
  listing: unknown,
  supabase: SupabaseClient
): Promise<string> {
  const parentTitles = await fetchParentTitles(
    collectParentListingIds([listing]),
    supabase
  )
  return getListingTitle(listing as CreateListingInput | PublicListingDetail, parentTitles)
}

/** Loads a listing from the DB and resolves its display title (emails, notifications). */
export async function getListingTitleFromDb(listingId: string): Promise<string> {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_TITLE_DETAIL_SELECT)
    .eq("id", listingId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error || !data) {
    console.error(`[getListingTitleFromDb] Failed to load listing ${listingId}:`, error)
    return "Untitled Listing"
  }

  return resolveListingTitleFromRecord(data, supabase)
}
