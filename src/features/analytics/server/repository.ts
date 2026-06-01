import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { SYNC_STATUS } from "@/features/newsletter/constants"
import type { ListingTypeBreakdownItem } from "./types"
import { CALENDAR_LISTING_TYPE_LABELS } from "@/lib/listings/type-labels"
import {
  aggregateAmountsIntoBuckets,
  aggregateIntoBuckets,
  buildChartBuckets,
  type ChartBucket,
} from "./chart-buckets"
import { getServiceInquiryByServiceRepo } from "./service-inquiry-details"
import type { AnalyticsRange } from "./types"

async function countProfiles(options?: { createdFrom?: string; createdBefore?: string }): Promise<number> {
  const svc = getSupabaseServiceClient()
  let query = svc.from("profiles").select("id", { count: "exact", head: true })
  if (options?.createdFrom) query = query.gte("created_at", options.createdFrom)
  if (options?.createdBefore) query = query.lt("created_at", options.createdBefore)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function countListings(options: {
  statuses?: string[]
  submittedFrom?: string
  submittedBefore?: string
}): Promise<number> {
  const svc = getSupabaseServiceClient()
  let query = svc.from("listings").select("id", { count: "exact", head: true }).is("deleted_at", null)
  if (options.statuses?.length) query = query.in("status", options.statuses)
  if (options.submittedFrom) query = query.gte("submitted_at", options.submittedFrom)
  if (options.submittedBefore) query = query.lt("submitted_at", options.submittedBefore)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

type DonationRow = {
  base_gift_cents: number | null
  amount: number
  stripe_account: string | null
  created_at: string
}

async function fetchPaidDonations(options?: {
  createdFrom?: string
  createdBefore?: string
  sponsorOnly?: boolean
}): Promise<DonationRow[]> {
  const svc = getSupabaseServiceClient()
  let query = svc
    .from("donations")
    .select("base_gift_cents, amount, stripe_account, created_at")
    .eq("payment_status", "paid")

  if (options?.createdFrom) query = query.gte("created_at", options.createdFrom)
  if (options?.createdBefore) query = query.lt("created_at", options.createdBefore)
  if (options?.sponsorOnly) query = query.eq("stripe_account", "sponsor")

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as DonationRow[]
}

function giftCents(row: DonationRow): number {
  if (row.base_gift_cents != null && row.base_gift_cents > 0) {
    return row.base_gift_cents
  }
  return row.amount
}

function sumGiftCents(rows: DonationRow[]): number {
  return rows.reduce((sum, row) => sum + giftCents(row), 0)
}

function sumEarGiftCents(rows: DonationRow[]): number {
  return rows
    .filter((row) => row.stripe_account !== "sponsor")
    .reduce((sum, row) => sum + giftCents(row), 0)
}

async function sumListingFeesCents(options?: {
  paidFrom?: string
  paidBefore?: string
}): Promise<number> {
  const svc = getSupabaseServiceClient()
  let query = svc
    .from("listings")
    .select("payment_amount")
    .eq("payment_required", true)
    .eq("payment_status", "paid")
    .is("deleted_at", null)

  if (options?.paidFrom) query = query.gte("updated_at", options.paidFrom)
  if (options?.paidBefore) query = query.lt("updated_at", options.paidBefore)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + (row.payment_amount ?? 0), 0)
}

async function countSavedListings(): Promise<number> {
  const svc = getSupabaseServiceClient()
  const { count, error } = await svc
    .from("saved_listings")
    .select("id", { count: "exact", head: true })
  if (error) throw error
  return count ?? 0
}

async function countServiceInquiries(options?: {
  createdFrom?: string
  createdBefore?: string
  status?: string
}): Promise<number> {
  const svc = getSupabaseServiceClient()
  let query = svc.from("service_inquiries").select("id", { count: "exact", head: true })
  if (options?.createdFrom) query = query.gte("created_at", options.createdFrom)
  if (options?.createdBefore) query = query.lt("created_at", options.createdBefore)
  if (options?.status) query = query.eq("status", options.status)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function fetchServiceInquiryTimestamps(options: {
  createdFrom?: string
  createdBefore?: string
}): Promise<string[]> {
  const svc = getSupabaseServiceClient()
  let query = svc
    .from("service_inquiries")
    .select("created_at")
    .order("created_at", { ascending: true })

  if (options.createdFrom) query = query.gte("created_at", options.createdFrom)
  if (options.createdBefore) query = query.lt("created_at", options.createdBefore)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((r) => r.created_at as string)
}

async function getNewsletterStatsRepo(): Promise<{
  totalSubscribers: number
  earNewsletter: number
  calendarEmail: number
  bothLists: number
}> {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from("newsletter_subscribers")
    .select("subscribed_to_newsletter, subscribed_to_calendar")
  if (error) throw error

  let earNewsletter = 0
  let calendarEmail = 0
  let bothLists = 0
  for (const row of data ?? []) {
    const ear = Boolean(row.subscribed_to_newsletter)
    const cal = Boolean(row.subscribed_to_calendar)
    if (ear) earNewsletter++
    if (cal) calendarEmail++
    if (ear && cal) bothLists++
  }

  return {
    totalSubscribers: data?.length ?? 0,
    earNewsletter,
    calendarEmail,
    bothLists,
  }
}

async function getMailchimpHealthRepo(): Promise<{ pending: number; failed: number }> {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from("newsletter_subscribers")
    .select("sync_status, needs_sync")
  if (error) throw error

  let pending = 0
  let failed = 0
  for (const row of data ?? []) {
    const status = row.sync_status as string
    if (
      status === SYNC_STATUS.PENDING ||
      (row.needs_sync && status !== SYNC_STATUS.SYNCED)
    ) {
      pending++
    }
    if (status === SYNC_STATUS.FAILED || status === SYNC_STATUS.FAILED_PERMANENT) {
      failed++
    }
  }
  return { pending, failed }
}

function medianHours(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
  }
  return Math.round(sorted[mid] * 10) / 10
}

async function getMedianReviewTimeHoursRepo(options?: {
  reviewedFrom?: string
  reviewedBefore?: string
}): Promise<number | null> {
  const svc = getSupabaseServiceClient()
  let query = svc
    .from("listings")
    .select("submitted_at, reviewed_at")
    .not("reviewed_at", "is", null)
    .is("deleted_at", null)

  if (options?.reviewedFrom) query = query.gte("reviewed_at", options.reviewedFrom)
  if (options?.reviewedBefore) query = query.lt("reviewed_at", options.reviewedBefore)

  const { data, error } = await query
  if (error) throw error

  const hours: number[] = []
  for (const row of data ?? []) {
    if (!row.submitted_at || !row.reviewed_at) continue
    const diff =
      (new Date(row.reviewed_at).getTime() - new Date(row.submitted_at).getTime()) /
      (1000 * 60 * 60)
    if (diff >= 0) hours.push(diff)
  }
  return medianHours(hours)
}

async function fetchAccountCreatedTimestamps(options: {
  createdFrom?: string
  createdBefore?: string
}): Promise<string[]> {
  const svc = getSupabaseServiceClient()
  let query = svc
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: true })

  if (options.createdFrom) query = query.gte("created_at", options.createdFrom)
  if (options.createdBefore) query = query.lt("created_at", options.createdBefore)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((r) => r.created_at as string)
}

async function fetchSubmissionTimestamps(options: {
  submittedFrom?: string
  submittedBefore?: string
}): Promise<string[]> {
  const svc = getSupabaseServiceClient()
  let query = svc
    .from("listings")
    .select("submitted_at")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: true })

  if (options.submittedFrom) query = query.gte("submitted_at", options.submittedFrom)
  if (options.submittedBefore) query = query.lt("submitted_at", options.submittedBefore)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((r) => r.submitted_at as string)
}

export async function getListingTypeBreakdownRepo(): Promise<ListingTypeBreakdownItem[]> {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from("listings")
    .select("type")
    .is("deleted_at", null)

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const type = row.type as string
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0)
  const orderedTypes = ["performance", "class", "audition", "creative"] as const

  return orderedTypes
    .filter((type) => (counts.get(type) ?? 0) > 0)
    .map((type) => {
      const count = counts.get(type) ?? 0
      const label =
        type in CALENDAR_LISTING_TYPE_LABELS
          ? CALENDAR_LISTING_TYPE_LABELS[type as keyof typeof CALENDAR_LISTING_TYPE_LABELS]
          : type
      return {
        type,
        label,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
}

function buildTimeSeriesForRange(
  range: AnalyticsRange,
  periodStart: Date | null,
  periodEnd: Date,
  submissionTimestamps: string[],
  accountCreatedTimestamps: string[],
  serviceInquiryTimestamps: string[],
  paidDonations: DonationRow[],
): {
  submissionsOverTime: { label: string; count: number }[]
  donationsOverTime: { label: string; count: number; amountCents: number }[]
  usersOverTime: { label: string; count: number }[]
  serviceInquiriesOverTime: { label: string; count: number }[]
} {
  const buckets: ChartBucket[] = buildChartBuckets(range, periodStart, periodEnd)
  const chartFrom =
    buckets.length > 0 ? buckets[0].start.toISOString() : periodStart?.toISOString()
  const filteredSubmissions = chartFrom
    ? submissionTimestamps.filter((ts) => ts >= chartFrom)
    : submissionTimestamps
  const filteredAccounts = chartFrom
    ? accountCreatedTimestamps.filter((ts) => ts >= chartFrom)
    : accountCreatedTimestamps
  const filteredInquiries = chartFrom
    ? serviceInquiryTimestamps.filter((ts) => ts >= chartFrom)
    : serviceInquiryTimestamps
  const filteredDonations = chartFrom
    ? paidDonations.filter((d) => d.created_at >= chartFrom)
    : paidDonations

  return {
    submissionsOverTime: aggregateIntoBuckets(filteredSubmissions, buckets),
    usersOverTime: aggregateIntoBuckets(filteredAccounts, buckets),
    serviceInquiriesOverTime: aggregateIntoBuckets(filteredInquiries, buckets),
    donationsOverTime: aggregateAmountsIntoBuckets(
      filteredDonations.map((d) => ({ at: d.created_at, cents: giftCents(d) })),
      buckets,
    ),
  }
}

export async function getAdminAnalyticsCountsRepo(params: {
  range: AnalyticsRange
  periodStart: string | undefined
  periodEnd: string
  previousPeriodStart: string | undefined
  previousPeriodEnd: string | undefined
  periodStartDate: Date | null
  periodEndDate: Date
}) {
  const { range, periodStart, periodEnd, previousPeriodStart, previousPeriodEnd, periodStartDate, periodEndDate } =
    params

  const chartSubmittedFrom =
    range === "all"
      ? undefined
      : periodStart ?? new Date(periodEndDate.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totalUsers,
    newUsersThisPeriod,
    newUsersPreviousPeriod,
    totalListings,
    approvedListings,
    rejectedListings,
    pendingReviews,
    pendingPayments,
    newListingsThisPeriod,
    newListingsPreviousPeriod,
    allPaidDonations,
    paidDonationsThisPeriod,
    paidDonationsPreviousPeriod,
    allSponsorDonations,
    listingTypeBreakdown,
    listingFeesCents,
    listingFeesInPeriodCents,
    totalSavedListings,
    newsletter,
    mailchimp,
    medianReviewTimeHours,
    submissionTimestamps,
    accountCreatedTimestamps,
    serviceInquiryTimestamps,
    totalServiceInquiries,
    serviceInquiriesThisPeriod,
    serviceInquiriesPreviousPeriod,
    pendingServiceInquiries,
    serviceInquiryByService,
    chartDonations,
  ] = await Promise.all([
    countProfiles(),
    periodStart
      ? countProfiles({ createdFrom: periodStart, createdBefore: periodEnd })
      : Promise.resolve(0),
    previousPeriodStart && previousPeriodEnd
      ? countProfiles({
          createdFrom: previousPeriodStart,
          createdBefore: previousPeriodEnd,
        })
      : Promise.resolve(0),
    countListings({}),
    countListings({ statuses: ["approved"] }),
    countListings({ statuses: ["rejected"] }),
    countListings({ statuses: ["pending"] }),
    countListings({ statuses: ["pending_payment"] }),
    periodStart
      ? countListings({
          submittedFrom: periodStart,
          submittedBefore: periodEnd,
        })
      : Promise.resolve(0),
    previousPeriodStart && previousPeriodEnd
      ? countListings({
          submittedFrom: previousPeriodStart,
          submittedBefore: previousPeriodEnd,
        })
      : Promise.resolve(0),
    fetchPaidDonations(),
    periodStart
      ? fetchPaidDonations({
          createdFrom: periodStart,
          createdBefore: periodEnd,
        })
      : Promise.resolve([] as DonationRow[]),
    previousPeriodStart && previousPeriodEnd
      ? fetchPaidDonations({
          createdFrom: previousPeriodStart,
          createdBefore: previousPeriodEnd,
        })
      : Promise.resolve([] as DonationRow[]),
    fetchPaidDonations({ sponsorOnly: true }),
    getListingTypeBreakdownRepo(),
    sumListingFeesCents(),
    periodStart
      ? sumListingFeesCents({ paidFrom: periodStart, paidBefore: periodEnd })
      : Promise.resolve(0),
    countSavedListings(),
    getNewsletterStatsRepo(),
    getMailchimpHealthRepo(),
    getMedianReviewTimeHoursRepo(
      periodStart ? { reviewedFrom: periodStart, reviewedBefore: periodEnd } : undefined,
    ),
    fetchSubmissionTimestamps({
      submittedFrom: chartSubmittedFrom,
      submittedBefore: periodEnd,
    }),
    fetchAccountCreatedTimestamps({
      createdFrom: chartSubmittedFrom,
      createdBefore: periodEnd,
    }),
    fetchServiceInquiryTimestamps({
      createdFrom: chartSubmittedFrom,
      createdBefore: periodEnd,
    }),
    countServiceInquiries(),
    periodStart
      ? countServiceInquiries({ createdFrom: periodStart, createdBefore: periodEnd })
      : Promise.resolve(0),
    previousPeriodStart && previousPeriodEnd
      ? countServiceInquiries({
          createdFrom: previousPeriodStart,
          createdBefore: previousPeriodEnd,
        })
      : Promise.resolve(0),
    countServiceInquiries({ status: "pending" }),
    getServiceInquiryByServiceRepo(
      periodStart ? { createdFrom: periodStart, createdBefore: periodEnd } : undefined,
    ),
    fetchPaidDonations({
      createdFrom: chartSubmittedFrom,
      createdBefore: periodEnd,
    }),
  ])

  const { submissionsOverTime, donationsOverTime, usersOverTime, serviceInquiriesOverTime } =
    buildTimeSeriesForRange(
      range,
      periodStartDate,
      periodEndDate,
      submissionTimestamps,
      accountCreatedTimestamps,
      serviceInquiryTimestamps,
      chartDonations,
    )

  return {
    totalUsers,
    newUsersThisPeriod,
    newUsersPreviousPeriod,
    totalListings,
    approvedListings,
    rejectedListings,
    pendingReviews,
    pendingPayments,
    newListingsThisPeriod,
    newListingsPreviousPeriod,
    totalDonations: allPaidDonations.length,
    donationsAmountCents: sumGiftCents(allPaidDonations),
    earDonationsAmountCents: sumEarGiftCents(allPaidDonations),
    sponsorDonationsAmountCents: sumGiftCents(allSponsorDonations),
    donationsInPeriod: paidDonationsThisPeriod.length,
    donationsAmountInPeriodCents: sumGiftCents(paidDonationsThisPeriod),
    donationsPreviousPeriod: paidDonationsPreviousPeriod.length,
    donationsAmountPreviousPeriodCents: sumGiftCents(paidDonationsPreviousPeriod),
    listingFeesCents,
    listingFeesInPeriodCents,
    totalSavedListings,
    totalServiceInquiries,
    serviceInquiriesThisPeriod,
    serviceInquiriesPreviousPeriod,
    pendingServiceInquiries,
    serviceInquiryByService,
    newsletter,
    mailchimp,
    medianReviewTimeHours,
    listingTypeBreakdown,
    submissionsOverTime,
    donationsOverTime,
    usersOverTime,
    serviceInquiriesOverTime,
  }
}
