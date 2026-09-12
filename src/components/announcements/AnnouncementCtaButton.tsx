"use client"

import { useState } from "react"
import Link from "next/link"

import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { isAppPath } from "@/features/announcements/announcement-urls"
import type { AnnouncementCta } from "@/features/announcements/types"
import { cn } from "@/lib/utils"

type AnnouncementCtaButtonProps = {
  cta: AnnouncementCta
  className?: string
  variant?: "primary" | "outline"
  onClick?: () => void
  /** When false, the parent owns SignInRequiredModal (needed if this button sits inside another modal). */
  embedAuthModal?: boolean
  onAuthRequired?: () => void
}

export function AnnouncementCtaButton({
  cta,
  className,
  variant = "primary",
  onClick,
  embedAuthModal = true,
  onAuthRequired,
}: AnnouncementCtaButtonProps) {
  const { isAuthed, isLoading } = useAuth()
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const needsAuth = cta.kind === "authenticated_link" && !isAuthed

  if (cta.kind === "authenticated_link" && isLoading) {
    return (
      <Button variant={variant} className={className} disabled>
        {cta.label}
      </Button>
    )
  }

  if (needsAuth) {
    return (
      <>
        <Button
          type="button"
          variant={variant}
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
      <Button variant={variant} className={className} asChild>
        <Link href={cta.href} onClick={onClick}>
          {cta.label}
        </Link>
      </Button>
    )
  }

  return (
    <Button variant={variant} className={className} asChild>
      <a href={cta.href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {cta.label}
      </a>
    </Button>
  )
}

export function AnnouncementCtaGroup({
  cta,
  secondaryCta,
  stretch = false,
}: {
  cta: AnnouncementCta | null
  secondaryCta: AnnouncementCta | null
  stretch?: boolean
}) {
  if (!cta && !secondaryCta) return null

  const className = stretch ? "w-full sm:w-auto" : undefined

  return (
    <div className={cn("flex flex-wrap gap-2", stretch && "w-full sm:w-auto")}>
      {cta ? <AnnouncementCtaButton cta={cta} className={className} /> : null}
      {secondaryCta ? (
        <AnnouncementCtaButton
          cta={secondaryCta}
          variant={cta ? "outline" : "primary"}
          className={className}
        />
      ) : null}
    </div>
  )
}
