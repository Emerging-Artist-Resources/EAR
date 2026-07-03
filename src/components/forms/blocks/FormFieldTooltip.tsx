"use client"

import { useRef, useState } from "react"
import { CircleHelp } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type FormFieldTooltipProps = {
  text: string
  className?: string
}

/** Accessible info trigger: hover/focus shows `text` in a Radix tooltip. */
export function FormFieldTooltip({ text, className }: FormFieldTooltipProps) {
  const [open, setOpen] = useState(false)
  const isTouchTapRef = useRef(false)

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 rounded-full text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
            className
          )}
          aria-label={text}
          aria-expanded={open}
          onPointerDown={(event) => {
            isTouchTapRef.current = event.pointerType === "touch"
          }}
          onClick={(event) => {
            if (!isTouchTapRef.current) return
            // Explicit tap-to-toggle on mobile: tap once opens, tap again closes.
            event.preventDefault()
            setOpen((prev) => !prev)
          }}
        >
          <CircleHelp className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" className="text-left">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
