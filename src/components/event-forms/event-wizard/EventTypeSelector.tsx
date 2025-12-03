"use client"

import { Select } from "@/components/ui/select"

export type EventType = 'PERFORMANCE' | 'AUDITION' | 'CREATIVE' | 'CLASS' | 'FUNDING'

interface EventTypeSelectorProps {
  eventType: EventType | null
  onChangeType: (t: EventType) => void
}

export function EventTypeSelector({ eventType, onChangeType }: EventTypeSelectorProps) {
  const value = eventType ?? ''

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    onChangeType(e.target.value as EventType)
  }

  return (
    <div>
      <Select
        value={value}
        onChange={handleChange}
      >
        <option value="" disabled>Select listing type</option>
        <option value="PERFORMANCE">Performance</option>
        <option value="AUDITION">Audition</option>
        <option value="CREATIVE">Creative Opportunity</option>
        <option value="CLASS">Class/Workshop</option>
        <option value="FUNDING">Funding Opportunity</option>
      </Select>
    </div>
  )
}


