"use client"

import { Button } from "@/components/ui/button"
import {
  CALENDAR_FILTER_TYPES,
  CALENDAR_FILTER_TYPE_LABELS,
  isAllCalendarFilterTypesSelected,
} from "@/lib/listings/calendar-filter-types"
import { cn } from "@/lib/utils"
import { getFilterTypeColor } from "./event-colors"

interface FilterBarProps {
  selectedTypes: Set<string>
  onChangeEventType: (types: Set<string>) => void
}

export function FilterBar({ selectedTypes, onChangeEventType }: FilterBarProps) {
  const isAllSelected = isAllCalendarFilterTypesSelected(selectedTypes)

  const handleToggle = (type: string) => {
    if (isAllSelected) {
      onChangeEventType(new Set([type]))
    } else {
      const newSet = new Set(selectedTypes)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      onChangeEventType(newSet)
    }
  }

  const handleSelectAll = () => {
    onChangeEventType(new Set(CALENDAR_FILTER_TYPES))
  }

  return (
    <div className="mb-1">
      <div className="bg-surface-panel p-3 rounded-md border border-border-default">
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <Button
            size="sm"
            className="rounded-full"
            variant={isAllSelected ? "outlineSecondary" : "outline"}
            onClick={handleSelectAll}
          >
            All
          </Button>
          {CALENDAR_FILTER_TYPES.map((t) => {
            const isSelected = !isAllSelected && selectedTypes.has(t)
            const colors = getFilterTypeColor(t)
            const outlineText =
              "outlineText" in colors && colors.outlineText
                ? colors.outlineText
                : colors.accent
            return (
              <Button
                key={t}
                size="sm"
                className={cn(
                  "rounded-full border bg-transparent hover:bg-transparent",
                  isSelected && "hover:opacity-90",
                )}
                variant="none"
                onClick={() => handleToggle(t)}
                style={
                  isSelected
                    ? {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                      }
                    : {
                        color: outlineText,
                        borderColor: colors.accent,
                      }
                }
              >
                {CALENDAR_FILTER_TYPE_LABELS[t]}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

