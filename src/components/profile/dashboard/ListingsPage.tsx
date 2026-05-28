"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { MyListings } from "@/components/profile/activity/MyListings"
import { ListingDetailsModal } from "@/components/calendar/ListingDetailsModal"
import { DashboardPageLayout } from "./DashboardPageLayout"
import { Button } from "@/components/ui/button"
import PerformanceModal from "@/components/performance-modal"
import { ROUTES } from "@/lib/config/constants"

export function ListingsPage() {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalListingId, setModalListingId] = useState<string | null>(null)
  const [listingsRefreshKey, setListingsRefreshKey] = useState(0)

  const openCreateModal = useCallback(() => {
    setModalListingId(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback((listingId: string) => {
    setModalListingId(listingId)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setModalListingId(null)
  }, [])

  const handleModalSuccess = useCallback(() => {
    closeModal()
    setListingsRefreshKey((k) => k + 1)
  }, [closeModal])

  return (
    <DashboardPageLayout
      title="Listings"
      description="Manage listings you have submitted for review."
      actions={
        <>
          <Button variant="primary" onClick={openCreateModal}>
            <PlusIcon className="size-4 text-ear-off-white" /> Submit new listing
          </Button>
          <Link href={ROUTES.CALENDAR}>
            <Button variant="secondary">Browse calendar</Button>
          </Link>
        </>
      }
    >
      <MyListings
        hideHeader
        refreshKey={listingsRefreshKey}
        onListingClick={setSelectedListingId}
        onEditListing={openEditModal}
      />
      <ListingDetailsModal
        isOpen={selectedListingId !== null}
        onClose={() => setSelectedListingId(null)}
        listingId={selectedListingId}
        onListingClick={setSelectedListingId}
      />
      <PerformanceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        listingId={modalListingId}
      />
    </DashboardPageLayout>
  )
}
