"use client"

import { Button } from "@/components/ui/button"
import { H4 } from "../ui/typography"

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
      <div className="bg-white p-3 rounded-md">
        <H4 className="text-gray-800 mb-2">Filter:</H4>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-full"
            variant={isAllSelected ? "primary" : "secondary"}
            onClick={handleSelectAll}
          >
            All
          </Button>
          {TYPES.map(t => (
            <Button
              key={t}
              size="sm"
              className="rounded-full"
              variant={!isAllSelected && selectedTypes.has(t) ? "primary" : "secondary"}
              onClick={() => handleToggle(t)}
            >
              {TYPE_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

