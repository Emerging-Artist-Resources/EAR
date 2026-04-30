"use client"

import { format } from "date-fns"
import { Modal } from "@/components/ui/modal"
import type { CalendarItem } from "@/hooks/use-calendar"
import { getEventTypeColor } from "./event-colors"

interface DayEventsPanelProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  events: CalendarItem[]
  onEventClick: (listingId: string) => void
}

const getTypeLabel = (type: CalendarItem["type"]) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function DayEventsPanel({
  isOpen,
  onClose,
  date,
  events,
  onEventClick,
}: DayEventsPanelProps) {
  if (!date) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={format(date, "EEEE, MMMM d, yyyy")}
      size="md"
    >
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="font-sans text-sm text-muted-foreground text-center py-4">
            No events scheduled for this day
          </div>
        ) : (
          events.map((event) => {
            const colors = getEventTypeColor(event.type)
            return (
              <div
                key={`${event.listingId}-${event.occurrenceId}`}
                className="border border-border-default rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-surface-panel"
                onClick={() => {
                  onEventClick(event.listingId)
                  onClose()
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="font-sans px-2 py-1 rounded text-xs font-medium border"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.border,
                        }}
                      >
                        {getTypeLabel(event.type)}
                      </span>
                    </div>
                    <h3 className="font-header text-2xl font-semibold text-text-primary truncate">
                      {event.title || "Untitled Event"}
                    </h3>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}
