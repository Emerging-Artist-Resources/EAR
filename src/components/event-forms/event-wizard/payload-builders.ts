import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"

type EventPayload = {
  type: string
  base: {
    contact_name: string
    pronouns: string | null
    contact_email: string
    org_name: string | null
    org_website: string | null
    address: string | null
    social_handles: { raw: string }
    notes: string | null
    borough: string | null
  }
  details: Record<string, unknown>
  occurrences: Array<{ starts_at_utc: string; tz: string }>
}

export interface UserInfo {
  name: string
  email: string
  pronouns?: string | null
}

export function buildBasePayload(
  data: EventFormData,
  userInfo: UserInfo
): EventPayload["base"] {
  return {
    contact_name: userInfo.name || "",
    pronouns: userInfo.pronouns || data.submitterPronouns || null,
    contact_email: userInfo.email || "",
    org_name: data.company || null,
    org_website: data.companyWebsite || null,
    address: data.address || null,
    social_handles: { raw: data.socialHandles },
    notes: data.notes || null,
    borough: null,
  }
}

export function buildPerformancePayload(
  data: EventFormData,
  userInfo: UserInfo,
  tz: string
): EventPayload {
  const occurrences: Array<{ starts_at_utc: string; tz: string }> = []

  // Primary date/time
  const primaryDate = data.date
  const primaryTime = data.showTime
  if (primaryDate && primaryTime) {
    occurrences.push({
      starts_at_utc: new Date(`${primaryDate}T${primaryTime}:00Z`).toISOString(),
      tz,
    })
  }

  // Extra occurrences
  for (const d of data.extraOccurrences ?? []) {
    if (!d?.date || !Array.isArray(d?.times)) continue
    for (const t of d.times) {
      if (!t?.time) continue
      occurrences.push({
        starts_at_utc: new Date(`${d.date}T${t.time}:00Z`).toISOString(),
        tz,
      })
    }
  }

  return {
    type: "performance",
    base: buildBasePayload(data, userInfo),
    details: {
      show_name: data.title ?? "",
      short_description: data.shortDescription ?? "",
      credit_info: data.credits ?? "",
      ticket_price_cents:
        Number(String(data.ticketPrice ?? "0").replace(/[^0-9]/g, "")) || 0,
      ticket_link: data.ticketLink ?? "",
      agree_comp_tickets: Boolean(data.agreeCompTickets),
    },
    occurrences,
  }
}

export function buildAuditionPayload(
  data: EventFormData,
  userInfo: UserInfo,
  tz: string
): EventPayload {
  const primaryDate = data.auditionDate ?? ""
  const primaryTime = data.auditionTime ?? "00:00"
  const occurrences = primaryDate
    ? [
        {
          starts_at_utc: new Date(
            `${primaryDate}T${primaryTime}:00Z`
          ).toISOString(),
          tz,
        },
      ]
    : []

  return {
    type: "audition",
    base: buildBasePayload(data, userInfo),
    details: {
      audition_name: data.auditionName ?? "",
      about_project: data.aboutProject ?? "",
      eligibility: data.eligibility ?? "",
      compensation: data.compensation ?? "",
      audition_link: data.auditionLink ?? "",
    },
    occurrences,
  }
}

export function buildCreativePayload(
  data: EventFormData,
  userInfo: UserInfo,
  _tz: string
): EventPayload {
  const deadlineIso = data.deadline
    ? new Date(data.deadline).toISOString()
    : new Date().toISOString()

  return {
    type: "creative",
    base: buildBasePayload(data, userInfo),
    details: {
      opportunity_name: data.opportunityName ?? "",
      brief_description: data.briefDescription ?? "",
      eligibility: data.creativeEligibility ?? "",
      whats_offered: data.whatsOffered ?? "",
      stipend_amount: data.stipendAmount ?? "",
      requirements: data.requirements ?? "",
      deadline: deadlineIso,
      apply_link: data.applyLink ?? "",
    },
    occurrences: [],
  }
}

export function buildClassPayload(
  data: EventFormData,
  userInfo: UserInfo,
  tz: string
): EventPayload {
  const primaryDateRaw = (data.classDates ?? "").trim()
  const primaryTime = (data.classTimes ?? "00:00").trim()
  const tokens = primaryDateRaw
    ? primaryDateRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : []
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  const primaryList = tokens
    .filter((tok) => dateRegex.test(tok))
    .map((tok) => ({
      starts_at_utc: new Date(`${tok}T${primaryTime}:00Z`).toISOString(),
      tz,
    }))
  const extraOcc = (data.classExtraOccurrences ?? [])
    .filter((o) => o?.date && o?.time)
    .map((o) => ({
      starts_at_utc: new Date(`${o.date}T${o.time}:00Z`).toISOString(),
      tz,
    }))
  const occurrences = [...primaryList, ...extraOcc]

  const pricesArray = data.classPrices
    ? String(data.classPrices)
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  return {
    type: "class",
    base: buildBasePayload(data, userInfo),
    details: {
      festival_name: data.festivalName || null,
      festival_link: data.festivalLink || null,
      class_name: data.className ?? "",
      description: data.classDescription ?? "",
      prices: pricesArray,
      rrule: data.classRecurrence || null,
    },
    occurrences,
  }
}

export function buildFundingPayload(
  data: EventFormData,
  userInfo: UserInfo,
  _tz: string
): EventPayload {
  return {
    type: "funding",
    base: buildBasePayload(data, userInfo),
    details: {
      funding_link: data.fundingLink ?? "",
      title: data.fundingTitle || "",
      summary: data.fundingSummary || "",
    },
    occurrences: [],
  }
}

export function buildEventPayload(
  data: EventFormData,
  eventType: EventType,
  userInfo: UserInfo
): EventPayload {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  const type = eventType.toLowerCase() as
    | "performance"
    | "audition"
    | "creative"
    | "class"
    | "funding"

  switch (type) {
    case "performance":
      return buildPerformancePayload(data, userInfo, tz)
    case "audition":
      return buildAuditionPayload(data, userInfo, tz)
    case "creative":
      return buildCreativePayload(data, userInfo, tz)
    case "class":
      return buildClassPayload(data, userInfo, tz)
    case "funding":
      return buildFundingPayload(data, userInfo, tz)
    default:
      throw new Error(`Unknown event type: ${eventType}`)
  }
}

