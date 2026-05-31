"use client"

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

const LINE_CLAMP_CLASS: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
}

export type ReadMoreProps = {
  children: ReactNode
  /** Number of lines to show before truncating (default 2) */
  lines?: number
  className?: string
  contentClassName?: string
  moreLabel?: string
  lessLabel?: string
}

export function ReadMore({
  children,
  lines = 2,
  className,
  contentClassName,
  moreLabel = "Read more",
  lessLabel = "Read less",
}: ReadMoreProps) {
  const contentId = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isTruncatable, setIsTruncatable] = useState(false)

  const measureOverflow = useCallback(() => {
    const el = contentRef.current
    if (!el || expanded) return
    setIsTruncatable(el.scrollHeight > el.clientHeight + 1)
  }, [expanded])

  useEffect(() => {
    measureOverflow()
    const el = contentRef.current
    if (!el) return

    const observer = new ResizeObserver(measureOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measureOverflow, children])

  useEffect(() => {
    if (!expanded) measureOverflow()
  }, [expanded, measureOverflow])

  const clampClass = LINE_CLAMP_CLASS[lines] ?? "line-clamp-2"
  const showToggle = isTruncatable || expanded

  return (
    <div className={className}>
      <div
        ref={contentRef}
        id={contentId}
        className={cn(contentClassName, !expanded && clampClass)}
      >
        {children}
      </div>
      {showToggle ? (
        <button
          type="button"
          className="mt-2 font-sans text-sm font-semibold uppercase tracking-wide text-ear-dark-red hover:text-ear-dark-red/80"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      ) : null}
    </div>
  )
}
