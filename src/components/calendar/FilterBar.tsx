"use client"

import { Button } from "@/components/ui/button"
import { H4 } from "../ui/typography"

interface FilterBarProps {
  eventType: string
  onChangeEventType: (v: string) => void
}

const TYPES = ["ALL","PERFORMANCE","CLASS","AUDITION","CREATIVE","FUNDING"] as const

export function FilterBar({ eventType, onChangeEventType }: FilterBarProps) {
  return (
    <div className="mb-1">
      <div className="bg-white p-3 rounded-md">
        <H4 className="text-gray-800 mb-2">Filter:</H4>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <Button
              key={t}
              size="sm"
              className="rounded-full"
              variant={eventType === t ? "primary" : "secondary"}
              onClick={() => onChangeEventType(t)}
            >
              {t === "ALL" ? "All" :
               t === "PERFORMANCE" ? "Performance" :
               t === "CLASS" ? "Class/Workshop" :
               t === "AUDITION" ? "Audition" :
               t === "CREATIVE" ? "Creative" : "Funding"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

