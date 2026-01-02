"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { useEffect, useState, useCallback } from "react"
import { EventFormData } from "@/lib/validations/events"

import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { PieceDetails } from "@/components/forms/blocks/PieceDetails"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiGet } from "@/lib/fetch-utils"

type CalendarItem = {
  occurrenceId: string
  eventId: string
  type: "performance" | "audition" | "creative" | "class" | "funding"
  title: string | null
  start: string
  tz: string
}

export function PieceSubmissionFlow({ form }: { form: UseFormReturn<EventFormData> }) {
  const parentEventMode =
    (form.watch("parentEventMode" as Path<EventFormData>) as "SELECT" | "MANUAL" | undefined) ?? "SELECT"

  const parentEventId = form.watch("parentEventId" as Path<EventFormData>) as string | undefined

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CalendarItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedEventTitle, setSelectedEventTitle] = useState<string | null>(null)

  const searchEvents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const qs = new URLSearchParams({
        q: query,
        types: "performance",
        limit: "20",
      })
      const data = await apiGet<CalendarItem[]>(`/api/calendar?${qs.toString()}`)
      setSearchResults(Array.isArray(data) ? data : [])
      setShowResults(true)
    } catch (error) {
      console.error("Error searching events:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchEvents(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchEvents])

  const handleSelectEvent = (eventId: string, title: string | null) => {
    form.setValue("parentEventId" as Path<EventFormData>, eventId as unknown as never)
    form.setValue("parentEventMode" as Path<EventFormData>, "SELECT" as unknown as never)
    setSelectedEventTitle(title)
    setShowResults(false)
    setSearchQuery("")
  }

  const handleCantLocate = () => {
    form.setValue("parentEventMode" as Path<EventFormData>, "MANUAL" as unknown as never)
    form.setValue("parentEventId" as Path<EventFormData>, "" as unknown as never)
    setSelectedEventTitle(null)
    setShowResults(false)
    setSearchQuery("")
  }

  useEffect(() => {
    if (!showResults) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.event-search-container')) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showResults])

  return (
    <>
      <Section title="Find Your Event">
        <div className="space-y-4">
          <div className="event-search-container">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search for event <span className="text-error-600">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (parentEventMode === "SELECT" && parentEventId) {
                    setSelectedEventTitle(null)
                    form.setValue("parentEventId" as Path<EventFormData>, "" as unknown as never)
                  }
                }}
                placeholder="Type to search for events..."
                onFocus={() => searchQuery && setShowResults(true)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  Searching...
                </div>
              )}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.eventId}
                      type="button"
                      onClick={() => handleSelectEvent(item.eventId, item.title)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="font-medium text-gray-900">{item.title || "Untitled Event"}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.start).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showResults && searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-lg">
                  No events found. Try a different search term.
                </div>
              )}
            </div>
            {parentEventId && parentEventMode === "SELECT" && (
              <div className="mt-2 rounded-md bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">
                  Selected: {selectedEventTitle || "Event"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Event ID: {parentEventId}</p>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleCantLocate}
          >
            Can't Locate Event
          </Button>
        </div>
      </Section>

      {parentEventMode === "MANUAL" && (
        <Section title="Basic event info (so we can link it later)">
          <TextField form={form} name={"parentEventName" as Path<EventFormData>} label="Event/festival name" required />
          <TextField
            form={form}
            name={"parentEventWebsite" as Path<EventFormData>}
            label="Website (optional)"
            type="url"
            placeholder="https://..."
          />
          <TextField
            form={form}
            name={"parentEventContactEmail" as Path<EventFormData>}
            label="Contact email (optional)"
            type="email"
            placeholder="contact@..."
          />
        </Section>
      )}

      <Section title="Piece Details">
        <PieceOccurrencesPicker
          form={form}
          label="Select performance date(s)/time(s)"
          mode={parentEventId ? "SELECT_FROM_PARENT" : "CUSTOM_ONLY"}
        />
      </Section>

      <Section title="Piece details">
        <PieceDetails
          form={form}
          index={0}
          canRemove={false}
          onRemove={() => {}}
          showOccurrences={false}
          occurrencesMode="CUSTOM_ONLY"
        />
      </Section>
    </>
  )
}
