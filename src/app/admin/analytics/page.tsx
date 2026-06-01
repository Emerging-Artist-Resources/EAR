"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import { AnalyticsHeader } from "@/components/admin/analytics/AnalyticsHeader"
import { AnalyticsSection } from "@/components/admin/analytics/AnalyticsSection"
import { StatCard } from "@/components/admin/analytics/StatCard"
import { ListingTypeBreakdown } from "@/components/admin/analytics/ListingTypeBreakdown"
import { AnalyticsBarChart } from "@/components/admin/analytics/AnalyticsBarChart"
import { NewsletterSubscriptionsBreakdown } from "@/components/admin/analytics/NewsletterSubscriptionsBreakdown"
import { MailchimpHealthCard } from "@/components/admin/analytics/MailchimpHealthCard"
import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import type { AdminAnalytics } from "@/features/analytics/server/types"
import type { ApiResponse } from "@/lib/api/utils"

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("30d")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics?range=${encodeURIComponent(timeRange)}`)
      const json = (await res.json()) as ApiResponse<AdminAnalytics>
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to load analytics")
      }
      setAnalytics(json.data ?? null)
    } catch (e) {
      console.error("Analytics fetch error:", e)
      setError(e instanceof Error ? e.message : "Failed to load analytics")
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  const formatReviewTime = (hours: number | null) => {
    if (hours == null) return "—"
    if (hours < 24) return `${hours}h`
    const days = Math.round((hours / 24) * 10) / 10
    return `${days}d`
  }

  const isAllTime = timeRange === "all"

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingState />
      </AdminLayout>
    )
  }

  if (error || !analytics) {
    return (
      <AdminLayout>
        <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        <Card className="p-6">
          <Text className="text-[var(--error-600)]">{error ?? "Unable to load analytics"}</Text>
        </Card>
      </AdminLayout>
    )
  }

  const donationCount = isAllTime ? analytics.totalDonations : analytics.donationsInPeriod
  const donationAmountCents = isAllTime
    ? analytics.donationsAmountCents
    : analytics.donationsAmountInPeriodCents
  const listingFeesCents = isAllTime
    ? analytics.listingFeesCents
    : analytics.listingFeesInPeriodCents

  const approvalRate =
    analytics.totalListings > 0
      ? Math.round((analytics.approvedListings / analytics.totalListings) * 100)
      : 0

  const newListingsValue = isAllTime
    ? analytics.totalListings
    : analytics.newListingsThisPeriod

  const serviceInquiriesPeriodLabel = isAllTime ? "All time" : "In selected period"

  return (
    <AdminLayout>
      <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      <AnalyticsSection title="Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={formatNumber(analytics.totalUsers)}
            subtitle={
              isAllTime
                ? "Registered profiles"
                : `${formatNumber(analytics.newUsersThisPeriod)} new this period`
            }
            trend={analytics.trends.users ?? undefined}
          />
          <StatCard
            title="Total Listings"
            value={formatNumber(analytics.totalListings)}
            subtitle={`${formatNumber(analytics.approvedListings)} approved`}
          />
          <StatCard
            title="New Listings"
            value={formatNumber(newListingsValue)}
            subtitle={
              isAllTime ? "All submissions" : "Submitted in selected period"
            }
            trend={analytics.trends.newListings ?? undefined}
          />
          <StatCard
            title="Donations"
            value={formatCurrency(donationAmountCents)}
            subtitle={`${formatNumber(donationCount)} paid donation${donationCount === 1 ? "" : "s"}`}
            trend={analytics.trends.donations ?? undefined}
          />
          <StatCard
            title="Approval Rate"
            value={`${approvalRate}%`}
            subtitle={`${formatNumber(analytics.approvedListings)} of ${formatNumber(analytics.totalListings)} listings`}
          />
          <StatCard
            title="Rejected Listings"
            value={formatNumber(analytics.rejectedListings)}
            subtitle="All time"
          />
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Operations">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">Pending Reviews</Text>
            <H3 className="text-3xl font-bold text-[var(--warning-600)]">
              {formatNumber(analytics.pendingReviews)}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">Awaiting admin review</Text>
          </Card>
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">Pending Payment</Text>
            <H3 className="text-3xl font-bold text-[var(--warning-600)]">
              {formatNumber(analytics.pendingPayments)}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">Awaiting listing fee</Text>
          </Card>
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">Median Review Time</Text>
            <H3 className="text-3xl font-bold text-[var(--primary-600)]">
              {formatReviewTime(analytics.medianReviewTimeHours)}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">
              {isAllTime ? "Submit to decision (all time)" : "In selected period"}
            </Text>
          </Card>
        </div>
        <div className="mt-6 max-w-sm">
          <MailchimpHealthCard mailchimp={analytics.mailchimp} formatNumber={formatNumber} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Services">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {analytics.serviceInquiryByService.map((service) => (
            <StatCard
              key={service.slug}
              title={service.label}
              value={formatNumber(service.count)}
              subtitle={serviceInquiriesPeriodLabel}
            />
          ))}
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Financials">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">EAR Donations</Text>
            <H3 className="text-2xl font-bold text-[var(--gray-900)]">
              {formatCurrency(analytics.earDonationsAmountCents)}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">All paid (org account)</Text>
          </Card>
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">Artist / Sponsor Donations</Text>
            <H3 className="text-2xl font-bold text-[var(--gray-900)]">
              {formatCurrency(analytics.sponsorDonationsAmountCents)}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">Fiscally sponsored artists</Text>
          </Card>
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">Listing Fees</Text>
            <H3 className="text-2xl font-bold text-[var(--gray-900)]">
              {formatCurrency(listingFeesCents)}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">
              {isAllTime ? "Paid submission fees (all time)" : "Paid in selected period"}
            </Text>
          </Card>
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">Average Donation</Text>
            <H3 className="text-2xl font-bold text-[var(--primary-600)]">
              {formatCurrency(
                donationCount > 0 ? Math.round(donationAmountCents / donationCount) : 0
              )}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">
              {isAllTime ? "All paid donations" : "Paid in selected period"}
            </Text>
          </Card>
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Growth & Activity">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <H3 className="mb-4 text-base font-semibold">New Users Over Time</H3>
            <AnalyticsBarChart data={analytics.usersOverTime} />
          </Card>
          <Card className="p-6">
            <H3 className="mb-4 text-base font-semibold">Listing Submissions Over Time</H3>
            <AnalyticsBarChart data={analytics.submissionsOverTime} />
          </Card>
          <Card className="p-6">
            <H3 className="mb-4 text-base font-semibold">Service Inquiries Over Time</H3>
            <AnalyticsBarChart data={analytics.serviceInquiriesOverTime} />
          </Card>
          <Card className="p-6">
            <H3 className="mb-4 text-base font-semibold">Donations Over Time</H3>
            <AnalyticsBarChart
              data={analytics.donationsOverTime}
              showAmount
              formatAmount={formatCurrency}
            />
          </Card>
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Community Insights">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <H3 className="mb-4 text-base font-semibold">Listing Types</H3>
            <ListingTypeBreakdown items={analytics.listingTypeBreakdown} />
          </Card>
          <Card className="p-6">
            <Text className="text-sm text-[var(--gray-600)] mb-2">Saved Listings</Text>
            <H3 className="text-3xl font-bold text-[var(--primary-600)]">
              {formatNumber(analytics.totalSavedListings)}
            </H3>
            <Text className="text-xs text-[var(--gray-500)] mt-2">User bookmarks on calendar</Text>
          </Card>
          <Card className="p-6">
            <H3 className="mb-4 text-base font-semibold">Newsletter</H3>
            <NewsletterSubscriptionsBreakdown
              newsletter={analytics.newsletter}
              formatNumber={formatNumber}
            />
          </Card>
        </div>
      </AnalyticsSection>
    </AdminLayout>
  )
}
