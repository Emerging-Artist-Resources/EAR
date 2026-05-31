"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ClampableTextProps {
  text: string
  /** Tailwind line-clamp class, e.g. line-clamp-4 */
  clampClassName?: string
  className?: string
}

export function ClampableText({
  text,
  clampClassName = "line-clamp-4",
  className,
}: ClampableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [text, clampClassName])

  return (
    <div className="min-w-0">
      <p
        ref={ref}
        className={cn(
          "font-sans text-sm leading-6 text-text-primary whitespace-pre-wrap",
          !expanded && clampClassName,
          className,
        )}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-brand-primary hover:text-brand-primary-hover underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
