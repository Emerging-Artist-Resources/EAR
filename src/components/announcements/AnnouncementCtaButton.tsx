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
}

export function AnnouncementCtaButton({ cta, className }: AnnouncementCtaButtonProps) {
  const { isAuthed, isLoading } = useAuth()
  const [authPromptOpen, setAuthPromptOpen] = useState(false)

  if (cta.kind === "authenticated_link") {
    if (isLoading) {
      return (
        <Button variant="primary" className={className} disabled>
          {cta.label}
        </Button>
      )
    }

    if (!isAuthed) {
      return (
        <>
          <Button
            type="button"
            variant="primary"
            className={className}
            onClick={() => setAuthPromptOpen(true)}
          >
            {cta.label}
          </Button>
          <SignInRequiredModal
            isOpen={authPromptOpen}
            onClose={() => setAuthPromptOpen(false)}
            returnTo={cta.href}
            message="Sign in to continue."
          />
        </>
      )
    }
  }

  if (isAppPath(cta.href)) {
    return (
      <Button variant="primary" className={className} asChild>
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    )
  }

  return (
    <Button variant="primary" className={className} asChild>
      <a href={cta.href} target="_blank" rel="noopener noreferrer">
        {cta.label}
      </a>
    </Button>
  )
}
