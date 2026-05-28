"use client"

import { useEffect, useState } from "react"

import { Modal } from "@/components/ui/modal"
import { AUTH_MODAL_CONTENT_CLASS } from "@/components/auth/SignInRequiredModal"
import { Button } from "@/components/ui/button"
import { resetSessionExpiredModalFlag } from "@/lib/client/fetch-utils"
import { supabase } from "@/lib/supabase/client"
import { ROUTES } from "@/lib/config/constants"

type SessionExpiredEventDetail = {
  next?: string
}

function sanitizeNextParam(raw: string | null | undefined): string {
  const next = raw ?? ROUTES.HOME
  if (next.startsWith("/") && !next.startsWith("//")) return next
  return ROUTES.HOME
}

export function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string>(ROUTES.HOME)
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
      window.location.assign(ROUTES.HOME)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Session Expired"
      size="sm"
      closeOnOverlay={false}
      contentClassName={AUTH_MODAL_CONTENT_CLASS}
    >
      <div className="space-y-4">
        <p className="text-sm text-ear-black/70">
          Your session expired. Please log in or continue as guest.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-ear-black/20 bg-white text-ear-black hover:bg-ear-black/5"
            onClick={handleContinueAsGuest}
            disabled={guestLoading}
          >
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
