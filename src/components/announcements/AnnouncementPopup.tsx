"use client"

import { useState } from "react"
import Link from "next/link"

import { LinkifiedText } from "@/components/shared/LinkifiedText"
import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Text } from "@/components/ui/typography"
import { getAnnouncementUrl } from "@/lib/config/constants"
import { cn } from "@/lib/utils"
import type { AnnouncementPopup as AnnouncementPopupData } from "@/features/announcements/types"
import { AnnouncementCtaButton } from "./AnnouncementCtaButton"

type AnnouncementPopupProps = {
  popup: AnnouncementPopupData
  isOpen: boolean
  onDismiss: () => void
}

export function AnnouncementPopup({ popup, isOpen, onDismiss }: AnnouncementPopupProps) {
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const cta = popup.cta

  return (
    <>
      <Modal isOpen={isOpen} onClose={onDismiss} title={popup.headline} size="sm">
        {popup.body ? (
          <Text className="whitespace-pre-wrap text-sm text-ear-black/80">
            <LinkifiedText text={popup.body} />
          </Text>
        ) : null}
        <div
          className={cn(
            "flex flex-wrap items-center justify-end gap-2",
            popup.body && "mt-6"
          )}
        >
          <Button variant={cta ? "outline" : "primary"} asChild>
            <Link href={getAnnouncementUrl(popup.id)} onClick={onDismiss}>
              {popup.ctaLabel}
            </Link>
          </Button>
          {cta ? (
            <AnnouncementCtaButton
              cta={cta}
              embedAuthModal={false}
              onClick={onDismiss}
              onAuthRequired={() => setAuthPromptOpen(true)}
            />
          ) : null}
        </div>
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
