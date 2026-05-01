"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Text, H2 } from "@/components/ui/typography"
import { apiPost } from "@/lib/fetch-utils"
import { DonationFunnelTrustHeader } from "@/components/donations/DonationFunnelTrustHeader"

function PaymentCancelContent() {
  const router = useRouter()
  const search = useSearchParams()
  const donationId = search.get("donation_id")
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!donationId) {
      router.push("/donate")
      return
    }

    try {
      setIsRetrying(true)
      const response = await apiPost<{ url: string }>("/api/stripe/create-donation-session", {
        donationId,
      })

      if (response?.url) {
        window.location.href = response.url
      } else {
        setIsRetrying(false)
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      setIsRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <DonationFunnelTrustHeader variant="generic" className="mb-6" />
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <H2 className="text-2xl font-bold text-gray-900 mb-2">Payment Canceled</H2>
        </div>

        <Text className="text-gray-600 mb-6">
          Your donation payment was canceled. You can complete your donation at any time.
        </Text>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRetry}
            variant="primary"
            disabled={isRetrying || !donationId}
          >
            {isRetrying ? "Loading..." : "Try Again"}
          </Button>
          <Button onClick={() => router.push("/donate")} variant="outline">
            Back to donation
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Text>Loading...</Text>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  )
}
