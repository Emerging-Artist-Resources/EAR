"use client"

import { Button } from "@/components/ui/button"
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
  CREATIVE: "Creative"
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
            variant={isAllSelected ? "outline" : "secondary"}
            onClick={handleSelectAll}
          >
            All
          </Button>
          {TYPES.map(t => {
            const isSelected = !isAllSelected && selectedTypes.has(t)
            const colors = getFilterTypeColor(t)
            return (
              <Button
                key={t}
                size="sm"
                className="rounded-full"
                variant={isSelected ? "none" : "secondary"}
                onClick={() => handleToggle(t)}
                style={isSelected ? {
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderColor: colors.bg,
                } : undefined}
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

