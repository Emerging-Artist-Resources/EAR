"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Text, H2 } from "@/components/ui/typography"
import { apiGet } from "@/lib/fetch-utils"

function PaymentSuccessContent() {
  const router = useRouter()
  const search = useSearchParams()
  const listingId = search.get("listing_id")
  const [paymentStatus, setPaymentStatus] = useState<"checking" | "paid" | "processing">("checking")
  const [pollCount, setPollCount] = useState(0)
  const maxPolls = 20
  const pollInterval = 2000
  const statusRef = useRef(paymentStatus)
  const countRef = useRef(pollCount)

  useEffect(() => {
    statusRef.current = paymentStatus
  }, [paymentStatus])

  useEffect(() => {
    countRef.current = pollCount
  }, [pollCount])

  useEffect(() => {
    if (!listingId) {
      router.push("/calendar")
      return
    }

    let intervalId: NodeJS.Timeout | null = null
    let isMounted = true

    const checkPaymentStatus = async () => {
      if (!isMounted) return

      try {
        const listing = await apiGet<{ payment_status?: string }>(`/api/events/${listingId}/owner`)
        
        if (!isMounted) return

        if (listing?.payment_status === "paid") {
          setPaymentStatus("paid")
          if (intervalId) clearInterval(intervalId)
          setTimeout(() => {
            if (isMounted) {
              router.push("/calendar")
            }
          }, 2000)
          return
        }

        setPollCount((prev) => {
          const next = prev + 1
          if (next >= maxPolls) {
            setPaymentStatus("processing")
            if (intervalId) clearInterval(intervalId)
            return next
          }
          return next
        })
      } catch (error) {
        if (!isMounted) return
        console.error("Error checking payment status:", error)
        setPollCount((prev) => {
          const next = prev + 1
          if (next >= maxPolls) {
            setPaymentStatus("processing")
            if (intervalId) clearInterval(intervalId)
            return next
          }
          return next
        })
      }
    }

    checkPaymentStatus()

    intervalId = setInterval(() => {
      if (statusRef.current === "checking" && countRef.current < maxPolls) {
        checkPaymentStatus()
      } else {
        if (intervalId) clearInterval(intervalId)
      }
    }, pollInterval)

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [listingId, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <H2 className="text-2xl font-bold text-gray-900 mb-2">Payment Received</H2>
        </div>

        {paymentStatus === "checking" && (
          <div>
            <Text className="text-gray-600 mb-4">Verifying your payment...</Text>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        )}

        {paymentStatus === "paid" && (
          <div>
            <Text className="text-gray-600 mb-4">Your payment has been confirmed. Thank you!</Text>
            <Text className="text-sm text-gray-500">Redirecting to calendar...</Text>
          </div>
        )}

        {paymentStatus === "processing" && (
          <div>
            <Text className="text-gray-600 mb-4">
              Your payment is being processed. This may take a few moments.
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              You can check your listing status in your dashboard.
            </Text>
            <Button onClick={() => router.push("/calendar")} variant="primary">
              Go to Calendar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Text>Loading...</Text>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
