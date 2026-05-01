"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DonationSuccessView } from "@/components/donations/DonationSuccessView"
import { Text } from "@/components/ui/typography"

function DonationSuccessContent() {
  const searchParams = useSearchParams()
  const donationId = searchParams.get("donation_id") ?? ""

  return (
    <DonationSuccessView
      donationId={donationId}
      variant="generic"
    />
  )
}

export default function DonationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Text>Loading…</Text>
        </div>
      }
    >
      <DonationSuccessContent />
    </Suspense>
  )
}
