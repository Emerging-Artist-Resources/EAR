import { createListingOwnedRepo, listEvents, listCalendarItemsRepo, getEventPublicRepo, listMyEventsRepo, getEventForOwnerRepo, listAdminEventsRepo, getAdminEventDetailRepo, submitListingRepo } from "./repository"
import { eventFormSchema, type EventFormData } from "@/lib/validations/events"
import type { SupabaseClient } from "@supabase/supabase-js"
import { sendListingEmail } from "@/lib/email/sendListingEmail"
import {
  resolveCompanyArtistName,
  resolveFestivalCompanyArtistName,
  resolvePieceEventTitle,
} from "@/lib/email/listing-share-email-model"
import { sendListingShareTemplatedEmail } from "@/lib/email/sendListingShareEmail"
import { normalizeSupabaseRelation } from "./admin-utils"
import { getListingTitle } from "./listing-utils"
import type { CreateListingInput } from "./repository-types"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { normalizeShareRecipientEmails } from "@/lib/listings/share"
import { mergeListingMetaWithServerShareSentAt } from "./listing-meta-share"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"

export interface UserInfo {
  name: string
  email: string
  pronouns?: string | null
}

export async function createPerformance(supabase: SupabaseClient, formData: EventFormData, userInfo: UserInfo) {
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

async function fetchParentPerformanceTitle(
  supabase: SupabaseClient,
  parentListingId: string | null | undefined
): Promise<string | null> {
  if (!parentListingId) return null
  const { data, error } = await supabase
    .from("listings")
    .select("performance_details (title)")
    .eq("id", parentListingId)
    .maybeSingle()
  if (error || !data) return null
  const pd = normalizeSupabaseRelation(
    data.performance_details as { title?: string | null } | { title?: string | null }[] | null
  )
  const title = pd?.title?.trim()
  return title || null
}

/**
 * After listing approval: notify share recipients once (idempotent via meta.share.sent_at).
 */
export async function sendListingShareEmailsAfterApproval(listingId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()
  try {
    const { data: listingData, error } = await supabase
      .from("listings")
      .select(
        `
        id, type, contact_name, contact_email, company, meta,
        performance_details (*),
        audition_details (*),
        creative_details (*),
        class_workshop_details!class_workshop_details_listing_id_fkey (*),
        piece_details!piece_details_listing_id_fkey (*)
      `
      )
      .eq("id", listingId)
      .single()

    if (error || !listingData) {
      console.error(`[EMAIL] share listing: failed to load ${listingId}`, error)
      return
    }

    const cwdRaw = listingData.class_workshop_details as
      | { class_workshop_type?: string }
      | { class_workshop_type?: string }[]
      | null
    const cwd = Array.isArray(cwdRaw) ? cwdRaw[0] : cwdRaw
    const isWorkshopListing =
      listingData.type === "class" && cwd?.class_workshop_type === "WORKSHOP"

    if (listingData.type !== "performance" && !isWorkshopListing) return

    const meta = listingData.meta as Record<string, unknown> | null | undefined
    const shareRaw =
      meta && typeof meta === "object" && !Array.isArray(meta)
        ? (meta as Record<string, unknown>).share
        : null
    if (!shareRaw || typeof shareRaw !== "object" || Array.isArray(shareRaw)) return

    const shareObj = shareRaw as Record<string, unknown>
    if (typeof shareObj.sent_at === "string" && shareObj.sent_at.length > 0) return

    const rawRecipients = shareObj.recipient_emails
    if (!Array.isArray(rawRecipients)) return

    const normalized = normalizeShareRecipientEmails(
      rawRecipients.filter((e): e is string => typeof e === "string"),
      listingData.contact_email
    )
    if (normalized.length === 0) return

    const pd = listingData.performance_details as { subtype?: string } | { subtype?: string }[] | null
    const perfDetails = Array.isArray(pd) ? pd[0] : pd
    const subtype = perfDetails?.subtype
    if (
      listingData.type === "performance" &&
      subtype !== "ORGANIZER" &&
      subtype !== "PIECE"
    ) {
      return
    }

    const useFestivalTemplate = isWorkshopListing || subtype === "ORGANIZER"
    const listingForTitle = listingData as unknown as PublicListingDetail
    const listingTitle = getListingTitle(listingForTitle)

    const pieceDetails = normalizeSupabaseRelation(
      listingData.piece_details as
        | {
            piece_company?: string | null
            choreographer?: string | null
            parent_event_name?: string | null
            parent_listing_id?: string | null
          }
        | {
            piece_company?: string | null
            choreographer?: string | null
            parent_event_name?: string | null
            parent_listing_id?: string | null
          }[]
        | null
    )
    const perfDetailsForPiece = normalizeSupabaseRelation(
      listingData.performance_details as { title?: string | null } | { title?: string | null }[] | null
    )

    let shareContext: { companyArtistName: string; eventTitle: string } | null = null
    if (useFestivalTemplate) {
      let organizerName: string | null | undefined = null
      if (listingData.type === "performance") {
        const perfForOrg = normalizeSupabaseRelation(
          listingData.performance_details as
            | { organizer?: string | null }
            | { organizer?: string | null }[]
            | null
        )
        organizerName = perfForOrg?.organizer
      } else if (isWorkshopListing) {
        const cwdForOrg = normalizeSupabaseRelation(
          listingData.class_workshop_details as
            | { organizer?: string | null }
            | { organizer?: string | null }[]
            | null
        )
        organizerName = cwdForOrg?.organizer
      }
      shareContext = {
        companyArtistName: resolveFestivalCompanyArtistName({
          organizerName,
          company: listingData.company,
          contactName: listingData.contact_name,
        }),
        eventTitle: listingTitle,
      }
    } else {
      const parentPerformanceTitle = await fetchParentPerformanceTitle(
        supabase,
        pieceDetails?.parent_listing_id
      )
      shareContext = {
        companyArtistName: resolveCompanyArtistName({
          pieceDetails,
          contactName: listingData.contact_name,
        }),
        eventTitle: resolvePieceEventTitle({
          pieceDetails,
          performanceDetails: perfDetailsForPiece,
          parentPerformanceTitle,
        }),
      }
    }

    for (const to of normalized) {
      try {
        if (shareContext) {
          await sendListingShareTemplatedEmail({
            template: useFestivalTemplate ? "listing-share-festival" : "listing-share-piece",
            to,
            companyArtistName: shareContext.companyArtistName,
            eventTitle: shareContext.eventTitle,
          })
        }
      } catch (e) {
        console.error(`[EMAIL] listing share failed for ${to} (listing ${listingId}):`, e)
      }
    }

    const newMeta = mergeListingMetaWithServerShareSentAt(meta ?? {}, new Date().toISOString())
    const { error: upErr } = await supabase.from("listings").update({ meta: newMeta }).eq("id", listingId)
    if (upErr) {
      console.error(`[EMAIL] failed to persist share sent_at for ${listingId}:`, upErr)
    }
  } catch (e) {
    console.error(`[EMAIL] sendListingShareEmailsAfterApproval ${listingId}:`, e)
  }
}
