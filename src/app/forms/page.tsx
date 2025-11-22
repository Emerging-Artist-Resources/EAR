"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PerformanceModal from "@/components/performance-modal"
import { Card } from "@/components/ui/card"
import { H2, Text } from "@/components/ui/typography"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function SubmitListingPage() {
  const router = useRouter()
  const search = useSearchParams()
  const returnTo = search.get("returnTo")
  const [open, setOpen] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // TODO: Need to fix this to ensure non authenticated user don't submit listings
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user || null
      console.log(user)
      if (!user) {
        const dest = `/auth/signin?returnTo=${encodeURIComponent(returnTo || "/forms")}`
        router.push(dest)
      } else {
        setCheckingAuth(false)
      }
    })
  }, [router, returnTo])

  const handleClose = useCallback(() => {
    setOpen(false)
    if (returnTo) {
      router.push(returnTo)
    } else if (typeof window !== "undefined" && document.referrer && new URL(document.referrer).origin === window.location.origin) {
      router.back()
    } else {
      router.push("/calendar")
    }
  }, [router, returnTo])

  const handleSuccess = useCallback(() => {
    // After successful submission, go back to calendar which will reflect on refresh
    if (returnTo) {
      router.push(returnTo)
    } else {
      router.push("/calendar")
    }
  }, [router, returnTo])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <Card className="p-6">
          <H2 className="mb-1">Submit a Listing</H2>
          <Text className="text-sm text-gray-600">Use the form to submit your event or opportunity.</Text>
        </Card>
      </div>
      {!checkingAuth && (
        <PerformanceModal isOpen={open} onClose={handleClose} onSuccess={handleSuccess} />
      )}
    </div>
  )
}


