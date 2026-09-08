"use client"

import { useState } from "react"
import Link from "next/link"

import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { isAppPath } from "@/features/announcements/announcement-urls"
import type { AnnouncementCta } from "@/features/announcements/types"

type AnnouncementCtaButtonProps = {
  cta: AnnouncementCta
  className?: string
  onClick?: () => void
  /** When false, the parent owns SignInRequiredModal (needed if this button sits inside another modal). */
  embedAuthModal?: boolean
  onAuthRequired?: () => void
}

export function AnnouncementCtaButton({
  cta,
  className,
  onClick,
  embedAuthModal = true,
  onAuthRequired,
}: AnnouncementCtaButtonProps) {
  const { isAuthed, isLoading } = useAuth()
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const needsAuth = cta.kind === "authenticated_link" && !isAuthed

  if (cta.kind === "authenticated_link" && isLoading) {
    return (
      <Button variant="primary" className={className} disabled>
        {cta.label}
      </Button>
    )
  }

  if (needsAuth) {
    return (
      <>
        <Button
          type="button"
          variant="primary"
          className={className}
          onClick={() => {
            onClick?.()
            if (embedAuthModal) {
              setAuthPromptOpen(true)
            } else {
              onAuthRequired?.()
            }
          }}
        >
          {cta.label}
        </Button>
        {embedAuthModal ? (
          <SignInRequiredModal
            isOpen={authPromptOpen}
            onClose={() => setAuthPromptOpen(false)}
            returnTo={cta.href}
            message="Sign in to continue."
          />
        ) : null}
      </>
    )
  }

  if (isAppPath(cta.href)) {
    return (
      <Button variant="primary" className={className} asChild>
        <Link href={cta.href} onClick={onClick}>
          {cta.label}
        </Link>
      </Button>
    )
  }

  return (
    <Button variant="primary" className={className} asChild>
      <a href={cta.href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {cta.label}
      </a>
    </Button>
  )
}
