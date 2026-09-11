"use client"

import { useState } from "react"
import Link from "next/link"

import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { getAnnouncementUrl } from "@/lib/config/constants"
import { cn } from "@/lib/utils"
import type { AnnouncementPopup as AnnouncementPopupData } from "@/features/announcements/types"
import { AnnouncementCtaButton } from "./AnnouncementCtaButton"
import { AnnouncementMarkdown } from "./AnnouncementMarkdown"

type AnnouncementPopupProps = {
  popup: AnnouncementPopupData
  isOpen: boolean
  onDismiss: () => void
}

export function AnnouncementPopup({ popup, isOpen, onDismiss }: AnnouncementPopupProps) {
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const cta = popup.cta
  const showLearnMore = popup.showLearnMore
  const hasButtons = showLearnMore || Boolean(cta)

  return (
    <>
      <Modal isOpen={isOpen} onClose={onDismiss} title={popup.headline} size="sm">
        {popup.body ? (
          <AnnouncementMarkdown
            markdown={popup.body}
            className="text-sm text-ear-black/80"
          />
        ) : null}
        {hasButtons ? (
          <div
            className={cn(
              "flex flex-wrap items-center justify-end gap-2",
              popup.body && "mt-6"
            )}
          >
            {showLearnMore ? (
              <Button variant={cta ? "outline" : "primary"} asChild>
                <Link href={getAnnouncementUrl(popup.id)} onClick={onDismiss}>
                  {popup.ctaLabel}
                </Link>
              </Button>
            ) : null}
            {cta ? (
              <AnnouncementCtaButton
                cta={cta}
                embedAuthModal={false}
                onClick={onDismiss}
                onAuthRequired={() => setAuthPromptOpen(true)}
              />
            ) : null}
          </div>
        ) : null}
      </Modal>
      {cta?.kind === "authenticated_link" ? (
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
