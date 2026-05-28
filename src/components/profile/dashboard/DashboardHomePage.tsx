"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ROUTES } from "@/lib/config/constants"
import { apiGet } from "@/lib/client/fetch-utils"
import type { ActivityOverview } from "@/features/profile/server/types"
import { DashboardSummaryCard } from "./DashboardSummaryCard"
import { ProfileShortcutCard } from "./ProfileShortcutCard"
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList"
import PerformanceModal from "@/components/performance-modal"
import { useEffect } from "react"
import { DashboardPageSkeleton } from "./DashboardPageSkeleton"
import { DashboardPageLayout } from "./DashboardPageLayout"
import { PlusIcon } from "lucide-react"

function firstNameFromUserName(userName: string | null): string {
  if (!userName?.trim()) return "there"
  return userName.trim().split(/\s+/)[0] || "there"
}

function DashboardStatsRow() {
  const [overview, setOverview] = useState<ActivityOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const data = await apiGet<ActivityOverview>("/api/profile/activity-overview")
        if (isMounted) setOverview(data)
      } catch {
        if (isMounted) setOverview({ savedCount: 0, listingsCount: 0, attendedCount: 0 })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  const counts = overview ?? { savedCount: 0, listingsCount: 0, attendedCount: 0 }

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
      <DashboardSummaryCard
        title="Listings"
        description="Listings you submitted for review"
        count={counts.listingsCount}
        href={ROUTES.PROFILE_LISTINGS}
        colorClass="bg-green-50"
      />
      <DashboardSummaryCard
        title="Saved"
        description="Events bookmarked for later"
        count={counts.savedCount}
        href={ROUTES.PROFILE_SAVED}
        colorClass="bg-cyan-50"
      />
      <ProfileShortcutCard />
    </div>
  )
}

export function DashboardHomePage() {
  const { userName } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const firstName = firstNameFromUserName(userName)

  return (
    <DashboardPageLayout
      title={`Welcome back, ${firstName}`}
      description={
        <>
          EAR is here to help you create, connect, and grow.{" "}
          <br /> We encourage you to explore services and reach out with anything you may need!
        </>
      }
      actions={
        <>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="size-4 text-ear-off-white" /> Create a new listing
          </Button>
          <Link href={ROUTES.CALENDAR}>
            <Button variant="secondary">Browse calendar</Button>
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        }
      >
        <DashboardStatsRow />
      </Suspense>

      <Suspense fallback={<DashboardPageSkeleton />}>
        <AnnouncementsList limit={3} />
      </Suspense>

      <PerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </DashboardPageLayout>
  )
}
