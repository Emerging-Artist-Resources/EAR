import { createListingOwnedRepo, listEvents, listCalendarItemsRepo, getEventPublicRepo, listMyEventsRepo, getEventForOwnerRepo, listAdminEventsRepo, getAdminEventDetailRepo, submitListingRepo } from "./repository"
import { eventFormSchema, type EventFormData } from "@/lib/validations/events"
import type { SupabaseClient } from "@supabase/supabase-js"
import { sendListingEmail } from "@/lib/email/sendListingEmail"
import { getListingTitle } from "./listing-utils"
import type { CreateListingInput } from "./repository-types"

export interface UserInfo {
  name: string
  email: string
  pronouns?: string | null
}

export async function createPerformance(supabase: SupabaseClient, formData: EventFormData, userInfo: UserInfo, createdBy: string | null) {
  const parsed = eventFormSchema.parse(formData)
  // For now we support performance path; other types will follow similarly
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  const occurrences = [{
    starts_at_utc: new Date(`${parsed.date ?? ''}T${(parsed.showTime ?? '00:00')}:00Z`).toISOString(),
    ends_at_utc: null,
    tz,
  },
  ...(parsed.extraOccurrences ?? []).flatMap(o => 
    o.times?.map(t => ({
      starts_at_utc: new Date(`${o.date}T${t.time}:00Z`).toISOString(),
      ends_at_utc: null,
      tz,
    }))
  )]

  // Note: This function appears to be legacy. The new system uses buildEventPayload and createListingOwnedRepo
  // Keeping for backward compatibility but should migrate to new system
  const input = {
    type: 'performance' as const,
    base: {
      contact_name: userInfo.name || "",
      pronouns: userInfo.pronouns || null,
      contact_email: userInfo.email || "",
      company: parsed.company || null,
      company_website: parsed.companyWebsite || null,
      address: parsed.address || null,
      social_handles: parsed.socialHandles || null,
      notes: parsed.notes || null,
      //borough: null,
      meta: {
        referral_sources: ('referralSources' in parsed && parsed.referralSources) ? parsed.referralSources : [],
        referral_other: ('referralOther' in parsed && parsed.referralOther) ? parsed.referralOther : null,
        join_email_list: ('joinEmailList' in parsed && parsed.joinEmailList !== undefined) ? parsed.joinEmailList : null,
        submitted_before: ('submittedBefore' in parsed && parsed.submittedBefore) ? parsed.submittedBefore : null,
      },
    },
    details: {
      subtype: 'ORGANIZER' as const,
      title: parsed.title ?? '',
      description: parsed.shortDescription ?? parsed.credits ?? '',
      link: parsed.ticketLink ?? null,
      price: parsed.ticketPrice ? `$${parsed.ticketPrice}` : null,
      agree_comp_tickets: Boolean(parsed.agreeCompTickets),
    },
    occurrences: occurrences.map(occ => ({
      starts_at_utc: occ?.starts_at_utc ?? '',
      ends_at_utc: occ?.ends_at_utc ?? null,
      tz: occ?.tz ?? '',
      occurrence_type: 'event' as const,
    })),
    photos: (parsed.promoImagePaths ?? []).slice(0,5).map((p, idx) => ({ path: p, sort_order: idx })),
  }

  // Note: This function appears to be legacy code
  // The new system uses buildEventPayload and createListingOwnedRepo directly
  // This function is kept for backward compatibility but should be migrated
  return await createListingOwnedRepo(supabase, input)
}

export async function listCalendarItems(params: { fromISO: string; toISO: string; types?: Array<'performance'|'audition'|'creative'|'class'>; limit?: number }) {
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

export async function listAdminEvents(status: 'pending'|'approved'|'rejected', limit = 50) {
  return await listAdminEventsRepo({ status, limit })
}

export async function getAdminEventDetail(eventId: string) {
  return await getAdminEventDetailRepo(eventId)
}

export async function submitListing(listingId: string) {
  return await submitListingRepo(listingId)
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

export async function sendListingConfirmationEmail(
  input: CreateListingInput,
  listingId: string
): Promise<void> {
  const listingTitle = getListingTitle(input)
  await sendListingEmail("listing-received", {
    to: input.base.contact_email,
    submitterName: input.base.contact_name,
    listingTitle,
    listingId,
  })
}

export async function sendListingUpdateEmail(
  listingId: string,
  contactEmail: string,
  contactName: string,
  listingTitle: string
): Promise<void> {
  await sendListingEmail("listing-updated", {
    to: contactEmail,
    submitterName: contactName,
    listingTitle,
    listingId,
  })
}

export async function sendAdminListingNotificationEmail(
  input: CreateListingInput,
  listingId: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) {
    console.warn("[EMAIL] ADMIN_NOTIFICATION_EMAIL not set, skipping admin notification")
    return
  }

  const listingTitle = getListingTitle(input)
  await sendListingEmail("admin-listing-received", {
    to: adminEmail,
    submitterName: input.base.contact_name,
    listingTitle,
    listingId,
    submitterEmail: input.base.contact_email,
  })
}


