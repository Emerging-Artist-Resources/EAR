"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import {
  dismissAnnouncementPopup,
  isAnnouncementPopupDismissed,
  shouldSkipAnnouncementPopup,
} from "@/features/announcements/popup"
import type { AnnouncementPopup } from "@/features/announcements/types"

export function useAnnouncementPopup() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const [popup, setPopup] = useState<AnnouncementPopup | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (shouldSkipAnnouncementPopup(pathname ?? "", search)) {
      setIsOpen(false)
      setPopup(null)
      return
    }

    const controller = new AbortController()

    fetch("/api/announcements/popup", { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { data?: AnnouncementPopup | null }) => {
        const next = json.data
        if (!next?.id) {
          setPopup(null)
          setIsOpen(false)
          return
        }
        if (isAnnouncementPopupDismissed(window.localStorage, next.id, next.revision)) {
          setPopup(null)
          setIsOpen(false)
          return
        }
        setPopup(next)
        setIsOpen(true)
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return
        setPopup(null)
        setIsOpen(false)
      })

    return () => controller.abort()
  }, [pathname, search])

  const dismiss = useCallback(() => {
    if (popup) {
      dismissAnnouncementPopup(window.localStorage, popup.id, popup.revision)
    }
    setIsOpen(false)
  }, [popup])

  return { popup, isOpen: isOpen && popup != null, dismiss }
}
