"use client"

import { Select } from "@/components/ui/select"

export type EventType = 'PERFORMANCE' | 'AUDITION' | 'CREATIVE' | 'CLASS' | 'FUNDING'

interface EventTypeSelectorProps {
  eventType: EventType | null
  onChangeType: (t: EventType) => void
  disabled?: boolean
}

export function EventTypeSelector({ eventType, onChangeType, disabled }: EventTypeSelectorProps) {
  const value = eventType ?? ''

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    onChangeType(e.target.value as EventType)
  }

  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : undefined}>
      <Select
        value={value}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="" disabled>Select listing type</option>
        <option value="PERFORMANCE">Performance</option>
        <option value="AUDITION">Audition</option>
        <option value="CREATIVE">Creative Opportunity</option>
        <option value="CLASS">Class/Workshop</option>
      </Select>
    </div>
  )
}


