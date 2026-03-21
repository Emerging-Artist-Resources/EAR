"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Text, H2 } from "@/components/ui/typography"
import { apiGet } from "@/lib/fetch-utils"

export type DonationPollPayload = {
  payment_status?: string
  recipient_user_id?: string | null
}

const maxPolls = 20
const pollInterval = 2000

function earMarketingUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.eararts.org"
  return base
}

export type DonationSuccessViewProps = {
  donationId: string
  variant: "generic" | "artist"
  /** Required when variant is artist — used to ensure the donation matches this page */
  artist?: {
    slug: string
    profileId: string
    displayName: string
  }
}

export function DonationSuccessView({ donationId, variant, artist }: DonationSuccessViewProps) {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<"checking" | "paid" | "processing" | "mismatch">("checking")
  const [pollCount, setPollCount] = useState(0)
  const statusRef = useRef(paymentStatus)
  const countRef = useRef(pollCount)

  const backToDonateHref = variant === "artist" && artist ? `/donate/${encodeURIComponent(artist.slug)}` : "/donate"
  const earUrl = earMarketingUrl()

  useEffect(() => {
    statusRef.current = paymentStatus
  }, [paymentStatus])

  useEffect(() => {
    countRef.current = pollCount
  }, [pollCount])

  useEffect(() => {
    if (!donationId) return

    let intervalId: ReturnType<typeof setInterval> | null = null
    let isMounted = true

    const checkPaymentStatus = async () => {
      if (!isMounted) return

      try {
        const donation = await apiGet<DonationPollPayload>(`/api/donations/${donationId}`)

        if (!isMounted) return

        if (variant === "artist" && artist) {
          if (donation.recipient_user_id && donation.recipient_user_id !== artist.profileId) {
            setPaymentStatus("mismatch")
            if (intervalId) clearInterval(intervalId)
            return
          }
        }

        if (donation?.payment_status === "paid") {
          setPaymentStatus("paid")
          if (intervalId) clearInterval(intervalId)
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
      } else if (intervalId) {
        clearInterval(intervalId)
      }
    }, pollInterval)

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [donationId, variant, artist])

  if (!donationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-4">
          <Text className="text-gray-600">Missing donation reference. Return to the donation page to try again.</Text>
          <Button variant="primary" onClick={() => router.push("/donate")}>
            Go to donate
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <H2 className="text-2xl font-bold text-gray-900 mb-2">Thank you for donating</H2>
          {variant === "artist" && artist && (
            <Text className="text-gray-700 text-base">
              Your gift supports <span className="font-semibold">{artist.displayName}</span> through EAR&apos;s fiscal
              sponsorship. We&apos;re grateful you chose to give.
            </Text>
          )}
          {variant === "generic" && (
            <Text className="text-gray-600 text-sm">
              Your support helps us keep resources available for emerging artists.
            </Text>
          )}
        </div>

        {paymentStatus === "checking" && (
          <div>
            <Text className="text-gray-600 mb-4">Confirming your payment…</Text>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          </div>
        )}

        {paymentStatus === "mismatch" && (
          <div className="space-y-4">
            <Text className="text-gray-600">
              We couldn&apos;t match this payment to this artist page. If you completed a checkout, your receipt email
              from Stripe is still valid.
            </Text>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href={backToDonateHref}>Back to donation</Link>
              </Button>
              <Button variant="primary" asChild>
                <a href={earUrl} target="_blank" rel="noopener noreferrer">
                  Visit EAR
                </a>
              </Button>
            </div>
          </div>
        )}

        {paymentStatus === "paid" && (
          <div className="space-y-6">
            <Text className="text-gray-600">Your donation has been confirmed.</Text>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href={backToDonateHref}>Make another donation</Link>
              </Button>
              <Button variant="primary" asChild>
                <a href={earUrl} target="_blank" rel="noopener noreferrer">
                  Visit EAR website
                </a>
              </Button>
            </div>
          </div>
        )}

        {paymentStatus === "processing" && (
          <div className="space-y-6">
            <Text className="text-gray-600">
              Your payment is still processing. This can take a minute; you may get a confirmation email from Stripe.
            </Text>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href={backToDonateHref}>Back to donation</Link>
              </Button>
              <Button variant="primary" asChild>
                <a href={earUrl} target="_blank" rel="noopener noreferrer">
                  Visit EAR website
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
