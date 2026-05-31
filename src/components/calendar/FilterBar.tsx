"use client"

import { Button } from "@/components/ui/button"
import { OPPORTUNITY_LISTING_TYPE_LABEL } from "@/lib/listings/type-labels"
import { cn } from "@/lib/utils"
import { getFilterTypeColor } from "./event-colors"

interface FilterBarProps {
  selectedTypes: Set<string>
  onChangeEventType: (types: Set<string>) => void
}

const TYPES = ["PERFORMANCE", "CLASS", "AUDITION", "CREATIVE"] as const

const TYPE_LABELS: Record<string, string> = {
  PERFORMANCE: "Performance",
  CLASS: "Class/Workshop",
  AUDITION: "Audition",
  CREATIVE: OPPORTUNITY_LISTING_TYPE_LABEL
}

export function FilterBar({ selectedTypes, onChangeEventType }: FilterBarProps) {
  const isAllSelected = TYPES.every(t => selectedTypes.has(t))

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
    onChangeEventType(new Set(TYPES))
  }

  return (
    <div className="mb-1">
      <div className="bg-surface-panel p-3 rounded-md border border-border-default">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-full"
            variant={isAllSelected ? "outlineSecondary" : "outline"}
            onClick={handleSelectAll}
          >
            All
          </Button>
          {TYPES.map(t => {
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
                {TYPE_LABELS[t]}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

