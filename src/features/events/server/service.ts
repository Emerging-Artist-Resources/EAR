import { createEventWithDetails, listEvents, listCalendarItemsRepo, getEventPublicRepo, listMyEventsRepo, getEventForOwnerRepo } from "./repository"
import { eventFormSchema, type EventFormData } from "@/lib/validations/events"

export async function createPerformance(formData: EventFormData, createdBy: string | null) {
  const parsed = eventFormSchema.parse(formData)
  // For now we support performance path; other types will follow similarly
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  const occurrences = [{
    starts_at_utc: new Date(`${parsed.date ?? ''}T${(parsed.showTime ?? '00:00')}:00Z`).toISOString(),
    ends_at_utc: null,
    tz,
  },
  ...(parsed.extraOccurrences ?? []).map(o => ({
    starts_at_utc: new Date(`${o.date}T${o.time}:00Z`).toISOString(),
    ends_at_utc: null,
    tz,
  }))]

  const input = {
    type: 'performance' as const,
    contact_name: parsed.submitterName,
    pronouns: parsed.submitterPronouns,
    contact_email: parsed.contactEmail,
    org_name: parsed.company || null,
    org_website: parsed.companyWebsite || null,
    address: parsed.address,
    social_handles: { handles: parsed.socialHandles },
    notes: parsed.notes || null,
    created_by: createdBy,
    meta: {
      referral_sources: parsed.referralSources || [],
      referral_other: parsed.referralOther || null,
      join_email_list: parsed.joinEmailList ?? null,
      submitted_before: parsed.submittedBefore ?? null,
    },
    borough: null,
    performance: {
      show_name: parsed.title ?? '',
      short_description: parsed.shortDescription ?? '',
      credit_info: parsed.credits,
      ticket_price_cents: Number((parsed.ticketPrice ?? '0').replace(/[^0-9]/g, '')) || 0,
      ticket_link: parsed.ticketLink ?? '',
      agree_comp_tickets: Boolean(parsed.agreeCompTickets),
    },
    photos: (parsed.photoUrls ?? []).slice(0,5).map((p, idx) => ({ path: p, sort_order: idx })),
    occurrences,
  }

  return await createEventWithDetails(input)
}

export async function listCalendarItems(params: { fromISO: string; toISO: string; types?: Array<'performance'|'audition'|'creative'|'class'|'funding'>; borough?: string | null; limit?: number }) {
  return await listCalendarItemsRepo(params)
}

export async function getEventPublic(eventId: string) {
  return await getEventPublicRepo(eventId)
}

export async function listMyEvents() {
  return await listMyEventsRepo()
}

export async function getEventForOwner(eventId: string) {
  return await getEventForOwnerRepo(eventId)
}

export type ListOptions = { status?: string | null, userId?: string | null, limit?: number, cursor?: string | null }
export async function listPerformances(params: ListOptions) {
  const effectiveStatus = params.userId ? params.status ?? undefined : 'APPROVED'
  return await listEvents({
    status: effectiveStatus,
    userId: params.userId ?? null,
    limit: params.limit,
    cursor: params.cursor ?? null,
  })
}


