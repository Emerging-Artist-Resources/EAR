"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import type { FiscalSponsorshipDashboard } from "@/features/profile/server/types"
import { FiscalSponsorshipStatusBadge } from "./FiscalSponsorshipStatusBadge"
import { DonationLinkCard } from "./DonationLinkCard"
import { CustomizeDonationPageModal } from "./CustomizeDonationPageModal"
import { DonationSummaryCard } from "./DonationSummaryCard"
import { ReceivedDonationsList } from "./ReceivedDonationsList"
import type { DonationDateRange } from "./DonationDateFilter"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"

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
  dateFrom?: string
  dateTo?: string
  onPageChange: (page: number) => void
  onDateRangeChange: (range: DonationDateRange) => void
  onDonationPageUpdated?: () => void
}

export function FiscalSponsorshipSection({
  data,
  loading,
  error,
  dateFrom,
  dateTo,
  onPageChange,
  onDateRangeChange,
  onDonationPageUpdated,
}: FiscalSponsorshipSectionProps) {
  const [customizeOpen, setCustomizeOpen] = useState(false)

  if (loading && !data) {
    return (
      <Card border="dashed" padding="md">
        <LoadingSkeleton />
      </Card>
    )
  }

  if (!data) {
    return (
      <Card border="dashed" padding="md">
        <Text className="text-sm text-red-600">
          {error ?? "Unable to load fiscal sponsorship data."}
        </Text>
      </Card>
    )
  }

  const status = data.fiscal_sponsorship_status
  const showDonationLink = status === "approved" && Boolean(data.donation_link && data.slug)
  const showDonationsList = status === "approved" || status === "paused" || status === "revoked"

  return (
    <div className="space-y-6">
      {error ? (
        <Card border="dashed" padding="md">
          <Text className="text-sm text-red-600">{error}</Text>
        </Card>
      ) : null}

      {status === "none" ? (
        <Card border="dashed" padding="md" className="space-y-2">
          <H3 className="text-lg font-semibold text-gray-900">
            {fiscalSponsorshipDashboard.none.title}
          </H3>
          <Text className="text-sm text-gray-600">{fiscalSponsorshipDashboard.none.body}</Text>
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
        </Card>
      ) : null}

      {status === "approved" ? (
        <div className="space-y-2">
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
            <div className="space-y-1">
              <DonationLinkCard donationLink={data.donation_link} slug={data.slug} />
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-sm"
                onClick={() => setCustomizeOpen(true)}
              >
                {fiscalSponsorshipDashboard.customizeDonationPage.trigger}
              </Button>
              <CustomizeDonationPageModal
                isOpen={customizeOpen}
                onClose={() => setCustomizeOpen(false)}
                initialSettings={data.donation_page}
                onSuccess={() => onDonationPageUpdated?.()}
              />
            </div>
          ) : (
            <Text className="text-sm text-gray-600">
              {fiscalSponsorshipDashboard.approved.missingSlug}
            </Text>
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
        <>
          <DonationSummaryCard summary={data.donations_summary} />
          <ReceivedDonationsList
            donations={data.donations}
            totalCount={data.donations_total_count}
            page={data.page}
            limit={data.limit}
            onPageChange={onPageChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateRangeChange={onDateRangeChange}
            isDateFiltered={Boolean(dateFrom || dateTo)}
          />
        </>
      ) : null}
    </div>
  )
}
