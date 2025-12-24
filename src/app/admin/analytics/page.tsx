"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import { AnalyticsHeader } from "@/components/admin/analytics/AnalyticsHeader"
import { StatCard } from "@/components/admin/analytics/StatCard"
import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"

interface AnalyticsData {
  totalUsers: number
  totalListings: number
  totalVisits: number
  totalDonations: number
  donationsAmount: number
  pendingReviews: number
  approvedListings: number
  newUsersThisPeriod: number
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("30d")
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    // Simulate loading
    setLoading(true)
    setTimeout(() => {
      // TODO: Replace with actual API call when backend is ready
      // const res = await fetch(`/api/admin/analytics?range=${timeRange}`)
      // const data = await res.json()
      // setAnalytics(data)

      // Mock data for now - ready for backend integration
      const mockData: AnalyticsData = {
        totalUsers: 1247,
        totalListings: 342,
        totalVisits: 15680,
        totalDonations: 89,
        donationsAmount: 12450,
        pendingReviews: 23,
        approvedListings: 298,
        newUsersThisPeriod: timeRange === "7d" ? 12 : timeRange === "30d" ? 45 : 156,
      }
      setAnalytics(mockData)
      setLoading(false)
    }, 500)
  }, [timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  if (loading || !analytics) {
    return (
      <AdminLayout>
        <AdminLoadingState />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={formatNumber(analytics.totalUsers)}
          subtitle={`${analytics.newUsersThisPeriod} new this period`}
          trend={{
            value: 12,
            label: "vs last period",
            isPositive: true,
          }}
        />
        <StatCard
          title="Total Listings"
          value={formatNumber(analytics.totalListings)}
          subtitle={`${analytics.approvedListings} approved`}
          trend={{
            value: 8,
            label: "vs last period",
            isPositive: true,
          }}
        />
        <StatCard
          title="Site Visits"
          value={formatNumber(analytics.totalVisits)}
          subtitle="Total page views"
          trend={{
            value: 15,
            label: "vs last period",
            isPositive: true,
          }}
        />
        <StatCard
          title="Donations"
          value={formatCurrency(analytics.donationsAmount)}
          subtitle={`${analytics.totalDonations} donations`}
          trend={{
            value: 22,
            label: "vs last period",
            isPositive: true,
          }}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <Text className="text-sm text-[var(--gray-600)] mb-2">Pending Reviews</Text>
          <H3 className="text-3xl font-bold text-[var(--warning-600)]">
            {analytics.pendingReviews}
          </H3>
          <Text className="text-xs text-[var(--gray-500)] mt-2">
            Listings awaiting review
          </Text>
        </Card>
        <Card className="p-6">
          <Text className="text-sm text-[var(--gray-600)] mb-2">Approval Rate</Text>
          <H3 className="text-3xl font-bold text-[var(--success-600)]">
            {Math.round((analytics.approvedListings / analytics.totalListings) * 100)}%
          </H3>
          <Text className="text-xs text-[var(--gray-500)] mt-2">
            {analytics.approvedListings} of {analytics.totalListings} listings
          </Text>
        </Card>
        <Card className="p-6">
          <Text className="text-sm text-[var(--gray-600)] mb-2">Average Donation</Text>
          <H3 className="text-3xl font-bold text-[var(--primary-600)]">
            {formatCurrency(
              analytics.totalDonations > 0
                ? analytics.donationsAmount / analytics.totalDonations
                : 0
            )}
          </H3>
          <Text className="text-xs text-[var(--gray-500)] mt-2">
            Per donation
          </Text>
        </Card>
      </div>

      {/* Placeholder for future charts/graphs */}
      <Card className="p-6">
        <H3 className="mb-4">Activity Overview</H3>
        <div className="h-64 flex items-center justify-center bg-[var(--gray-50)] rounded-md">
          <Text className="text-[var(--gray-500)]">
            Charts and graphs will be displayed here
          </Text>
        </div>
      </Card>
    </AdminLayout>
  )
}

