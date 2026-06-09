"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/client/fetch-utils"
import type { FiscalSponsorshipDashboard } from "@/features/profile/server/types"
import { FiscalSponsorshipStatusBadge } from "./FiscalSponsorshipStatusBadge"
import { DonationLinkCard } from "./DonationLinkCard"
import { ReceivedDonationsList } from "./ReceivedDonationsList"
import {
  fiscalSponsorshipDashboard,
  FISCAL_SPONSORSHIP_INQUIRY_HREF,
  FISCAL_SPONSORSHIP_PAGE_HREF,
  fiscalDashboardButtonClass,
} from "@/lib/content/fiscal-sponsorship-dashboard"

function DonationSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
      <DonationSkeleton />
      <DonationSkeleton />
    </div>
  )
}

interface FiscalSponsorshipSectionProps {
  data: FiscalSponsorshipDashboard | null
  loading: boolean
  error: string | null
  onPageChange: (page: number) => void
}

export function FiscalSponsorshipSection({
  data,
  loading,
  error,
  onPageChange,
}: FiscalSponsorshipSectionProps) {
  if (loading && !data) {
    return (
      <Card border="dashed" padding="md">
        <LoadingSkeleton />
      </Card>
    )
  }

  if (error) {
    return (
      <Card border="dashed" padding="md">
        <Text className="text-sm text-red-600">{error}</Text>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card border="dashed" padding="md">
        <Text className="text-sm text-gray-600">Unable to load fiscal sponsorship data.</Text>
      </Card>
    )
  }

  const status = data.fiscal_sponsorship_status
  const showDonationLink = status === "approved" && Boolean(data.donation_link && data.slug)
  const showDonationsList = status === "approved" || status === "paused" || status === "revoked"

  return (
    <div className="space-y-6">
      {status === "none" ? (
        <Card border="dashed" padding="md" className="space-y-4">
          <div className="space-y-2">
            <H3 className="text-lg font-semibold text-gray-900">
              {fiscalSponsorshipDashboard.none.title}
            </H3>
            <Text className="text-sm text-gray-600">{fiscalSponsorshipDashboard.none.body}</Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="primary">
              <Link href={FISCAL_SPONSORSHIP_PAGE_HREF}>
                {fiscalSponsorshipDashboard.none.primaryCta}
              </Link>
            </Button>
            <Button asChild variant="secondary" className={fiscalDashboardButtonClass.secondary}>
              <Link href={FISCAL_SPONSORSHIP_INQUIRY_HREF}>
                {fiscalSponsorshipDashboard.none.secondaryCta}
              </Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {status === "pending" ? (
        <Card border="dashed" padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FiscalSponsorshipStatusBadge status={status} />
          </div>
          <div className="space-y-2">
            <H3 className="text-lg font-semibold text-gray-900">
              {fiscalSponsorshipDashboard.pending.title}
            </H3>
            <Text className="text-sm text-gray-600">{fiscalSponsorshipDashboard.pending.body}</Text>
          </div>
          <Button asChild variant="secondary" className={fiscalDashboardButtonClass.secondary}>
            <Link href={FISCAL_SPONSORSHIP_INQUIRY_HREF}>
              {fiscalSponsorshipDashboard.pending.secondaryCta}
            </Link>
          </Button>
        </Card>
      ) : null}

      {status === "approved" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FiscalSponsorshipStatusBadge status={status} />
            {data.fiscal_sponsorship_approved_at ? (
              <Text className="text-sm text-gray-600">
                Approved{" "}
                {new Date(data.fiscal_sponsorship_approved_at).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </Text>
            ) : null}
          </div>
          {showDonationLink && data.donation_link && data.slug ? (
            <DonationLinkCard donationLink={data.donation_link} slug={data.slug} />
          ) : (
            <Card border="dashed" padding="md">
              <Text className="text-sm text-gray-600">
                {fiscalSponsorshipDashboard.approved.missingSlug}
              </Text>
            </Card>
          )}
        </div>
      ) : null}

      {status === "paused" || status === "revoked" ? (
        <Card border="dashed" padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FiscalSponsorshipStatusBadge status={status} />
          </div>
          <div className="space-y-2">
            <H3 className="text-lg font-semibold text-gray-900">
              {fiscalSponsorshipDashboard[status].title}
            </H3>
            <Text className="text-sm text-gray-600">
              {fiscalSponsorshipDashboard[status].body}
            </Text>
            {data.fiscal_sponsorship_note ? (
              <Text className="text-sm text-gray-700">{data.fiscal_sponsorship_note}</Text>
            ) : null}
          </div>
        </Card>
      ) : null}

      {showDonationsList ? (
        loading ? (
          <LoadingSkeleton />
        ) : (
          <ReceivedDonationsList
            donations={data.donations}
            totalCount={data.donations_total_count}
            page={data.page}
            limit={data.limit}
            onPageChange={onPageChange}
          />
        )
      ) : null}
    </div>
  )
}

export function useFiscalSponsorshipDashboard() {
  const [data, setData] = useState<FiscalSponsorshipDashboard | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (requestPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiGet<FiscalSponsorshipDashboard>(
        `/api/profile/fiscal-sponsorship?page=${requestPage}`,
      )
      setData(result)
      setPage(result.page)
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : "Failed to load fiscal sponsorship data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(page)
  }, [load, page])

  return {
    data,
    loading,
    error,
    setPage,
  }
}
