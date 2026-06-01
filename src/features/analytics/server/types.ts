export type AnalyticsRange = "7d" | "30d" | "90d" | "1y" | "all"

export type AnalyticsTrend = {
  value: number
  label: string
  isPositive: boolean
}

export type ListingTypeBreakdownItem = {
  type: string
  label: string
  count: number
  percent: number
}

export type TimeSeriesPoint = {
  label: string
  count: number
  amountCents?: number
}

export type NewsletterStats = {
  totalSubscribers: number
  earNewsletter: number
  calendarEmail: number
  bothLists: number
}

export type MailchimpHealth = {
  pending: number
  failed: number
}

export type ServiceInquiryServiceDetail = {
  slug: string
  label: string
  count: number
}

export type AdminAnalytics = {
  totalUsers: number
  newUsersThisPeriod: number
  totalListings: number
  newListingsThisPeriod: number
  approvedListings: number
  rejectedListings: number
  pendingReviews: number
  pendingPayments: number
  medianReviewTimeHours: number | null
  totalDonations: number
  donationsAmountCents: number
  earDonationsAmountCents: number
  sponsorDonationsAmountCents: number
  donationsInPeriod: number
  donationsAmountInPeriodCents: number
  listingFeesCents: number
  listingFeesInPeriodCents: number
  totalSavedListings: number
  totalServiceInquiries: number
  serviceInquiriesThisPeriod: number
  pendingServiceInquiries: number
  serviceInquiryByService: ServiceInquiryServiceDetail[]
  newsletter: NewsletterStats
  mailchimp: MailchimpHealth
  listingTypeBreakdown: ListingTypeBreakdownItem[]
  submissionsOverTime: TimeSeriesPoint[]
  donationsOverTime: TimeSeriesPoint[]
  usersOverTime: TimeSeriesPoint[]
  serviceInquiriesOverTime: TimeSeriesPoint[]
  trends: {
    users: AnalyticsTrend | null
    newListings: AnalyticsTrend | null
    donations: AnalyticsTrend | null
    serviceInquiries: AnalyticsTrend | null
  }
}
