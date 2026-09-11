"use client"

import { useEffect, useRef, useState } from "react"

/** Same duration as My listings deep-link highlight. */
export const TIMED_HIGHLIGHT_MS = 3500

/** Full even ring + wash. Put on a wrapper if the target uses overflow-hidden. */
export const timedHighlightClassName =
  "bg-ear-baby-blue/10 ring-2 ring-ear-baby-blue ring-offset-2"

/**
 * Scroll to a deep-linked item and show a highlight that clears after a few seconds.
 */
export function useTimedHighlight(
  targetId: string | null | undefined,
  options: {
    ready?: boolean
    isPresent: boolean
    elementId: string
    durationMs?: number
    scrollBlock?: ScrollLogicalPosition
  }
): string | null {
  const {
    ready = true,
    isPresent,
    elementId,
    durationMs = TIMED_HIGHLIGHT_MS,
    scrollBlock = "start",
  } = options
  const [activeId, setActiveId] = useState<string | null>(null)
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    if (targetId) handledRef.current = null
  }, [targetId])

  useEffect(() => {
    if (!targetId || !ready || !isPresent) return
    if (handledRef.current === targetId) return

    handledRef.current = targetId
    setActiveId(targetId)

    requestAnimationFrame(() => {
      document.getElementById(elementId)?.scrollIntoView({
        behavior: "smooth",
        block: scrollBlock,
      })
    })

    const timer = window.setTimeout(() => {
      setActiveId(null)
    }, durationMs)

    return () => window.clearTimeout(timer)
  }, [targetId, ready, isPresent, elementId, durationMs, scrollBlock])

  return activeId
}
