"use client"

import { useState } from "react"
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

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 rounded-full text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
            className
          )}
          aria-label={text}
          aria-expanded={open}
          onPointerDown={(event) => {
            if (event.pointerType !== "touch") return
            // Radix tooltips are hover/focus-first; add explicit touch toggle for mobile UX.
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
