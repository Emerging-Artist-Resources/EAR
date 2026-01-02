"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useEffect, useReducer, useRef, useCallback } from "react"
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

type SearchState = {
  query: string
  results: CalendarItem[]
  isSearching: boolean
  showResults: boolean
  selectedEventTitle: string | null
}

type SearchAction =
  | { type: "SET_QUERY"; payload: string }
  | { type: "SET_RESULTS"; payload: CalendarItem[] }
  | { type: "SET_SEARCHING"; payload: boolean }
  | { type: "SET_SHOW_RESULTS"; payload: boolean }
  | { type: "SET_SELECTED_TITLE"; payload: string | null }
  | { type: "RESET" }

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload }
    case "SET_RESULTS":
      return { ...state, results: action.payload }
    case "SET_SEARCHING":
      return { ...state, isSearching: action.payload }
    case "SET_SHOW_RESULTS":
      return { ...state, showResults: action.payload }
    case "SET_SELECTED_TITLE":
      return { ...state, selectedEventTitle: action.payload }
    case "RESET":
      return {
        query: "",
        results: [],
        isSearching: false,
        showResults: false,
        selectedEventTitle: null,
      }
    default:
      return state
  }
}

const initialState: SearchState = {
  query: "",
  results: [],
  isSearching: false,
  showResults: false,
  selectedEventTitle: null,
}

export function PieceSubmissionFlow({ form }: { form: UseFormReturn<EventFormData> }) {
  const parentEventMode = useWatch({
    control: form.control,
    name: "parentEventMode" as Path<EventFormData>,
    defaultValue: "SELECT",
  }) as "SELECT" | "MANUAL" | undefined

  const parentEventId = useWatch({
    control: form.control,
    name: "parentEventId" as Path<EventFormData>,
  }) as string | undefined

  const [searchState, dispatch] = useReducer(searchReducer, initialState)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchEvents = useCallback(async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: "SET_RESULTS", payload: [] })
      dispatch({ type: "SET_SHOW_RESULTS", payload: false })
      return
    }

    dispatch({ type: "SET_SEARCHING", payload: true })
    try {
      const qs = new URLSearchParams({
        q: query,
        types: "performance",
        limit: "20",
      })
      const data = await apiGet<CalendarItem[]>(`/api/calendar?${qs.toString()}`)
      dispatch({ type: "SET_RESULTS", payload: Array.isArray(data) ? data : [] })
      dispatch({ type: "SET_SHOW_RESULTS", payload: true })
    } catch (error) {
      console.error("Error searching events:", error)
      dispatch({ type: "SET_RESULTS", payload: [] })
    } finally {
      dispatch({ type: "SET_SEARCHING", payload: false })
    }
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchEvents(searchState.query)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchState.query, searchEvents])

  useEffect(() => {
    if (parentEventMode === "SELECT" && parentEventId && searchState.query) {
      dispatch({ type: "SET_SELECTED_TITLE", payload: null })
      form.setValue("parentEventId" as Path<EventFormData>, "" as unknown as never)
    }
  }, [searchState.query, parentEventMode, parentEventId, form.setValue])

  const handleSelectEvent = (eventId: string, title: string | null) => {
    form.setValue("parentEventId" as Path<EventFormData>, eventId as unknown as never)
    form.setValue("parentEventMode" as Path<EventFormData>, "SELECT" as unknown as never)
    dispatch({ type: "SET_SELECTED_TITLE", payload: title })
    dispatch({ type: "SET_SHOW_RESULTS", payload: false })
    dispatch({ type: "SET_QUERY", payload: "" })
  }

  const handleCantLocate = () => {
    form.setValue("parentEventMode" as Path<EventFormData>, "MANUAL" as unknown as never)
    form.setValue("parentEventId" as Path<EventFormData>, "" as unknown as never)
    dispatch({ type: "RESET" })
  }

  useEffect(() => {
    if (!searchState.showResults) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.event-search-container')) {
        dispatch({ type: "SET_SHOW_RESULTS", payload: false })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchState.showResults])

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
                value={searchState.query}
                onChange={(e) => dispatch({ type: "SET_QUERY", payload: e.target.value })}
                placeholder="Type to search for events..."
                onFocus={() => searchState.query && dispatch({ type: "SET_SHOW_RESULTS", payload: true })}
              />
              {searchState.isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  Searching...
                </div>
              )}
              {searchState.showResults && searchState.results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
                  {searchState.results.map((item) => (
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
              {searchState.showResults && searchState.query && !searchState.isSearching && searchState.results.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-lg">
                  No events found. Try a different search term.
                </div>
              )}
            </div>
            {parentEventId && parentEventMode === "SELECT" && (
              <div className="mt-2 rounded-md bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">
                  Selected: {searchState.selectedEventTitle || "Event"}
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
