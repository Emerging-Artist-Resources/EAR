import { createEventWithPhotos, listEvents } from "./repository"

export type CreatePerformanceArgs = {
  title: string
  date: string
  showTime: string
  createdBy: string | null
  details: Record<string, unknown>
  photoUrls: string[]
}

export async function createPerformance(args: CreatePerformanceArgs) {
  return await createEventWithPhotos({
    title: args.title,
    date: args.date,
    show_time: args.showTime,
    status: 'PENDING',
    created_by: args.createdBy,
    event_type: 'PERFORMANCE',
    details: args.details,
  }, args.photoUrls)
}

export async function listPerformances(params: { status?: string | null, userId?: string | null }) {
  return await listEvents(params)
}


