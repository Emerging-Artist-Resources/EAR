"use client"

import { Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { AnnouncementPopup } from "./AnnouncementPopup"
import { useAnnouncementPopup } from "@/hooks/use-announcement-popup"
import { shouldSkipAnnouncementPopup } from "@/features/announcements/popup"

function AnnouncementPopupHostReady() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { popup, isOpen, dismiss } = useAnnouncementPopup()

  if (shouldSkipAnnouncementPopup(pathname ?? "", searchParams.toString())) return null
  if (!popup) return null
  return <AnnouncementPopup popup={popup} isOpen={isOpen} onDismiss={dismiss} />
}

export function AnnouncementPopupHost() {
  return (
    <Suspense fallback={null}>
      <AnnouncementPopupHostReady />
    </Suspense>
  )
}
