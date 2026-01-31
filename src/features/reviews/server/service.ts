import { ensureListingExistsRepo, insertReviewRepo, updateListingStatusRepo } from "./repository"

export async function reviewListing(args: {
  listingId: string
  decision: 'APPROVED' | 'REJECTED'
  notes?: string | null
  reviewerUserId: string
}) {
  await ensureListingExistsRepo(args.listingId)
  
  // Insert review record for audit trail
  const review = await insertReviewRepo({
    listingId: args.listingId,
    decision: args.decision,
    notes: args.notes ?? null,
    reviewerUserId: args.reviewerUserId,
  })
  
  // Update listing status (this also handles photo migration for approvals)
  await updateListingStatusRepo(args.listingId, args.decision, args.reviewerUserId, args.notes ?? null)
  
  return review
}

// Legacy function name for backward compatibility
export async function reviewEvent(args: {
  eventId: string
  decision: 'APPROVED' | 'REJECTED'
  notes?: string | null
  reviewerUserId: string
}) {
  return reviewListing({
    listingId: args.eventId, // Map eventId to listingId
    decision: args.decision,
    notes: args.notes,
    reviewerUserId: args.reviewerUserId,
  })
}


