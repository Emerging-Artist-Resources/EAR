import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { approveListingRepo, rejectListingRepo } from "@/features/events/server/repository"

export async function insertReviewRepo(input: {
  listingId: string
  decision: 'APPROVED' | 'REJECTED'
  notes: string | null
  reviewerUserId: string
}) {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      listing_id: input.listingId,
      decision: input.decision,
      notes: input.notes,
      reviewer_user_id: input.reviewerUserId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateListingStatusRepo(listingId: string, decision: 'APPROVED' | 'REJECTED', approverUserId: string, notes?: string | null) {
  // Use the main repository functions which handle photo migration and proper status updates
  if (decision === 'APPROVED') {
    await approveListingRepo(listingId, approverUserId, notes || undefined)
  } else {
    await rejectListingRepo(listingId, approverUserId, notes || undefined)
  }
}

export async function ensureListingExistsRepo(listingId: string) {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase.from('listings').select('id').eq('id', listingId).single()
  if (error || !data) throw new Error('Listing not found')
}


