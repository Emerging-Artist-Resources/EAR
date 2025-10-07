import { createEventWithPhotos, listEvents } from "./repository"
import { performanceSchema, type PerformanceFormData } from "@/lib/validations/events"

export async function createPerformance(formData: PerformanceFormData, createdBy: string | null) {
  const parsed = performanceSchema.parse(formData)
  const dateStr = parsed.date
  const details = {
    submitter_name: parsed.submitterName,
    submitter_pronouns: parsed.submitterPronouns,
    contact_email: parsed.contactEmail,
    company: parsed.company || null,
    company_website: parsed.companyWebsite || null,
    ticket_price: parsed.ticketPrice,
    short_description: parsed.shortDescription,
    credits: parsed.credits,
    social_handles: parsed.socialHandles,
    notes: parsed.notes || null,
    referral_sources: parsed.referralSources || [],
    referral_other: parsed.referralOther || null,
    join_email_list: parsed.joinEmailList ?? null,
    agree_comp_tickets: parsed.agreeCompTickets,
  }

  return await createEventWithPhotos({
    title: parsed.title,
    date: dateStr,
    show_time: parsed.showTime,
    status: 'PENDING',
    created_by: createdBy,
    event_type: 'PERFORMANCE',
    details,
  }, parsed.photoUrls ?? [])
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


