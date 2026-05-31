"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { LinkifiedText } from "@/components/shared/LinkifiedText"
import { cn } from "@/lib/utils"

const defaultListingLinkClass =
  "text-brand-primary hover:text-brand-primary-hover underline break-all"

interface ClampableTextProps {
  text: string
  /** Tailwind line-clamp class, e.g. line-clamp-4 */
  clampClassName?: string
  className?: string
  linkClassName?: string
}

export function ClampableText({
  text,
  clampClassName = "line-clamp-4",
  className,
  linkClassName = defaultListingLinkClass,
}: ClampableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [text, clampClassName, expanded])

  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <p
        ref={ref}
        className={cn(
          "max-w-full font-sans text-sm leading-6 text-text-primary whitespace-pre-wrap [overflow-wrap:anywhere]",
         !expanded && clampClassName,
          className,
        )}
      >
        <LinkifiedText text={text} linkClassName={linkClassName} />
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
