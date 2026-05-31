"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { headerDropdownMenuClass } from "@/components/layout/header-hover-dropdown"
import { getFilterTypeColor } from "./event-colors"
import {
  CALENDAR_FILTER_TYPES,
  CALENDAR_FILTER_TYPE_LABELS,
  isAllCalendarFilterTypesSelected,
  type CalendarFilterType,
} from "@/lib/listings/calendar-filter-types"
import { cn } from "@/lib/utils"

interface ListingTypeFilterDropdownProps {
  selectedTypes: Set<string>
  onChange: (types: Set<string>) => void
  className?: string
}

function getTriggerLabel(selectedTypes: Set<string>): string {
  if (isAllCalendarFilterTypesSelected(selectedTypes)) {
    return "All listing types"
  }
  if (selectedTypes.size === 0) {
    return "No types selected"
  }
  return CALENDAR_FILTER_TYPES.filter((t) => selectedTypes.has(t))
    .map((t) => CALENDAR_FILTER_TYPE_LABELS[t])
    .join(", ")
}

export function ListingTypeFilterDropdown({
  selectedTypes,
  onChange,
  className,
}: ListingTypeFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const allSelected = isAllCalendarFilterTypesSelected(selectedTypes)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const toggleType = (type: CalendarFilterType) => {
    if (allSelected) {
      onChange(new Set([type]))
      return
    }

    const next = new Set(selectedTypes)
    if (next.has(type)) {
      next.delete(type)
    } else {
      next.add(type)
    }
    onChange(next)
  }

  const selectAll = () => {
    onChange(new Set(CALENDAR_FILTER_TYPES))
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="max-w-[12rem] truncate">{getTriggerLabel(selectedTypes)}</span>
        <ChevronDown
          className={cn("ml-1 h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </Button>

      {isOpen ? (
        <div
          className={cn(headerDropdownMenuClass, "absolute left-0 top-full z-50 mt-1 min-w-[14rem] p-2")}
          role="listbox"
          aria-multiselectable="true"
        >
          <button
            type="button"
            className="mb-1 w-full rounded px-2 py-1.5 text-left text-sm font-medium text-text-primary hover:bg-surface-interactive"
            onClick={selectAll}
          >
            All types
          </button>
          {CALENDAR_FILTER_TYPES.map((type) => {
            const isChecked = allSelected || selectedTypes.has(type)
            const colors = getFilterTypeColor(type)
            const labelColor =
              "outlineText" in colors && colors.outlineText ? colors.outlineText : undefined

            return (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-interactive"
              >
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleType(type)}
                  aria-label={CALENDAR_FILTER_TYPE_LABELS[type]}
                />
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors.accent }}
                  aria-hidden
                />
                <span
                  className="text-sm text-text-primary"
                  style={labelColor ? { color: labelColor } : undefined}
                >
                  {CALENDAR_FILTER_TYPE_LABELS[type]}
                </span>
              </label>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
