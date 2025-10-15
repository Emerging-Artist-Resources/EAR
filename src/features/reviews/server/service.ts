import { ensureEventExistsRepo, insertReviewRepo, updateEventStatusRepo } from "./repository"

export async function reviewEvent(args: {
  eventId: string
  decision: 'APPROVED' | 'REJECTED'
  notes?: string | null
  reviewerUserId: string
}) {
  await ensureEventExistsRepo(args.eventId)
  const review = await insertReviewRepo({
    eventId: args.eventId,
    decision: args.decision,
    notes: args.notes ?? null,
    reviewerUserId: args.reviewerUserId,
  })
  await updateEventStatusRepo(args.eventId, args.decision, args.reviewerUserId)
  return review
}


