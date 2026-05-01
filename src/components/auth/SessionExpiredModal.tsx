"use client"

import { useEffect, useState } from "react"

import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { resetSessionExpiredModalFlag } from "@/lib/fetch-utils"
import { supabase } from "@/lib/supabase/client"

type SessionExpiredEventDetail = {
  next?: string
}

function sanitizeNextParam(raw: string | null | undefined): string {
  const next = raw ?? "/announcement"
  if (next.startsWith("/") && !next.startsWith("//")) return next
  return "/announcement"
}

export function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [nextPath, setNextPath] = useState("/announcement")
  const [guestLoading, setGuestLoading] = useState(false)

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<SessionExpiredEventDetail>
      setNextPath(sanitizeNextParam(customEvent.detail?.next))
      setIsOpen(true)
    }

    window.addEventListener("app:session-expired", handleSessionExpired)
    return () => window.removeEventListener("app:session-expired", handleSessionExpired)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    resetSessionExpiredModalFlag()
  }

  const handleLogin = () => {
    const signinUrl = new URL("/auth/signin", window.location.origin)
    signinUrl.searchParams.set("error", "session_expired")
    signinUrl.searchParams.set("next", nextPath)
    resetSessionExpiredModalFlag()
    window.location.assign(`${signinUrl.pathname}${signinUrl.search}`)
  }

  const handleContinueAsGuest = async () => {
    if (guestLoading) return
    setGuestLoading(true)

    try {
      const { error } = await supabase.auth.signOut({ scope: "global" })
      if (error) {
        console.error("Failed global sign-out while continuing as guest:", error)
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error("Failed sign-out while continuing as guest:", err)
    } finally {
      resetSessionExpiredModalFlag()
      setIsOpen(false)
      // Force a full reload to ensure all authenticated client/server state is cleared.
      window.location.assign("/announcement")
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Session Expired"
      size="sm"
      closeOnOverlay={false}
      headerClassName="bg-primary text-white"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Your session expired. Please log in or continue as guest.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleContinueAsGuest} disabled={guestLoading}>
            {guestLoading ? "Switching to guest..." : "Continue as guest"}
          </Button>
          <Button type="button" onClick={handleLogin}>
            Log in
          </Button>
        </div>
      </div>
    </Modal>
  )
}
