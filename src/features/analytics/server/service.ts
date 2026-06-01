import { getAdminAnalyticsCountsRepo } from "./repository"
import { getPeriodBounds, parseAnalyticsRange, toIso } from "./time-range"
import type { AdminAnalytics, AnalyticsRange, AnalyticsTrend } from "./types"

function calcTrend(current: number, previous: number): AnalyticsTrend | null {
  if (previous === 0) {
    if (current === 0) return null
    return { value: 100, label: "vs last period", isPositive: true }
  }
  const change = Math.round(((current - previous) / previous) * 100)
  return {
    value: Math.abs(change),
    label: "vs last period",
    isPositive: change >= 0,
  }
}

export async function getAdminAnalytics(rangeParam?: string): Promise<AdminAnalytics> {
  const range: AnalyticsRange = parseAnalyticsRange(rangeParam)
  const bounds = getPeriodBounds(range)
  const periodEndDate = bounds.periodEnd
  const periodEnd = toIso(periodEndDate)!
  const periodStart = toIso(bounds.periodStart)
  const previousPeriodStart = toIso(bounds.previousPeriodStart)
  const previousPeriodEnd = toIso(bounds.previousPeriodEnd)

  const counts = await getAdminAnalyticsCountsRepo({
    range,
    periodStart,
    periodEnd,
    previousPeriodStart,
    previousPeriodEnd,
    periodStartDate: bounds.periodStart,
    periodEndDate,
  })

  const hasComparison = range !== "all"

  const donationsTrendMetric =
    range === "all" ? counts.donationsAmountCents : counts.donationsAmountInPeriodCents
  const donationsTrendPrevious =
    range === "all" ? 0 : counts.donationsAmountPreviousPeriodCents

  return {
    totalUsers: counts.totalUsers,
    newUsersThisPeriod: counts.newUsersThisPeriod,
    totalListings: counts.totalListings,
    newListingsThisPeriod: counts.newListingsThisPeriod,
    approvedListings: counts.approvedListings,
    rejectedListings: counts.rejectedListings,
    pendingReviews: counts.pendingReviews,
    pendingPayments: counts.pendingPayments,
    medianReviewTimeHours: counts.medianReviewTimeHours,
    totalDonations: counts.totalDonations,
    donationsAmountCents: counts.donationsAmountCents,
    earDonationsAmountCents: counts.earDonationsAmountCents,
    sponsorDonationsAmountCents: counts.sponsorDonationsAmountCents,
    donationsInPeriod: counts.donationsInPeriod,
    donationsAmountInPeriodCents: counts.donationsAmountInPeriodCents,
    listingFeesCents: counts.listingFeesCents,
    listingFeesInPeriodCents: counts.listingFeesInPeriodCents,
    totalSavedListings: counts.totalSavedListings,
    totalServiceInquiries: counts.totalServiceInquiries,
    serviceInquiriesThisPeriod: counts.serviceInquiriesThisPeriod,
    pendingServiceInquiries: counts.pendingServiceInquiries,
    serviceInquiryByService: counts.serviceInquiryByService,
    newsletter: counts.newsletter,
    mailchimp: counts.mailchimp,
    listingTypeBreakdown: counts.listingTypeBreakdown,
    submissionsOverTime: counts.submissionsOverTime,
    donationsOverTime: counts.donationsOverTime,
    usersOverTime: counts.usersOverTime,
    serviceInquiriesOverTime: counts.serviceInquiriesOverTime,
    trends: {
      users: hasComparison
        ? calcTrend(counts.newUsersThisPeriod, counts.newUsersPreviousPeriod)
        : null,
      newListings: hasComparison
        ? calcTrend(counts.newListingsThisPeriod, counts.newListingsPreviousPeriod)
        : null,
      donations: hasComparison
        ? calcTrend(donationsTrendMetric, donationsTrendPrevious)
        : null,
      serviceInquiries: hasComparison
        ? calcTrend(counts.serviceInquiriesThisPeriod, counts.serviceInquiriesPreviousPeriod)
        : null,
    },
  }
}
