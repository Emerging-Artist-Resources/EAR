"use client";

import React, { useState } from "react"
import { MyListings } from "./MyListings"
import { MyOverview } from "./MyOverview"
import { ListingDetailsModal } from "@/components/calendar/ListingDetailsModal"

export const ActivityTab: React.FC = () => {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  return (
    <>
      <section className="mt-6 space-y-6">
        <MyListings onListingClick={setSelectedListingId} />
        <MyOverview />
      </section>
      <ListingDetailsModal
        isOpen={selectedListingId !== null}
        onClose={() => setSelectedListingId(null)}
        listingId={selectedListingId}
        onListingClick={setSelectedListingId}
      />
    </>
  )
}




