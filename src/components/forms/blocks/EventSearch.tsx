"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { useEffect, useReducer, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/fetch-utils"

type EventType = "performance" | "audition" | "creative" | "class" | "funding"

type CalendarItem = {
  occurrenceId: string
  eventId: string
  type: EventType
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

function mapEventTypeToApi(eventType: string): EventType {
  const mapping: Record<string, EventType> = {
    PERFORMANCE: "performance",
    AUDITION: "audition",
    CREATIVE: "creative",
    CLASS: "class",
    FUNDING: "funding",
  }
  return mapping[eventType] || eventType.toLowerCase() as EventType
}

interface EventSearchProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  eventType: string | string[]
  eventIdField: Path<T>
  eventModeField?: Path<T>
  label?: string
  placeholder?: string
  showCantLocateButton?: boolean
  onCantLocate?: () => void
  required?: boolean
}

export function EventSearch<T extends Record<string, unknown>>({
  form,
  eventType,
  eventIdField,
  eventModeField,
  label = "Search for event",
  placeholder = "Type to search for events...",
  showCantLocateButton = false,
  onCantLocate,
  required = false,
}: EventSearchProps<T>) {
  const eventTypes = Array.isArray(eventType) ? eventType : [eventType]
  const apiTypes = eventTypes.map(mapEventTypeToApi).join(",")

  const selectedEventId = form.watch(eventIdField) as string | undefined
  const eventMode = eventModeField ? (form.watch(eventModeField) as string | undefined) : undefined

  const [searchState, dispatch] = useReducer(searchReducer, initialState)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const searchEvents = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        dispatch({ type: "SET_RESULTS", payload: [] })
        dispatch({ type: "SET_SHOW_RESULTS", payload: false })
        return
      }

      dispatch({ type: "SET_SEARCHING", payload: true })
      try {
        const qs = new URLSearchParams({
          q: query,
          types: apiTypes,
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
    },
    [apiTypes]
  )

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
    if (eventMode === "SELECT" && selectedEventId && searchState.query) {
      dispatch({ type: "SET_SELECTED_TITLE", payload: null })
      form.setValue(eventIdField, "" as unknown as never)
    }
  }, [searchState.query, eventMode, selectedEventId, form, eventIdField])

  const handleSelectEvent = (eventId: string, title: string | null) => {
    form.setValue(eventIdField, eventId as unknown as never)
    if (eventModeField) {
      form.setValue(eventModeField, "SELECT" as unknown as never)
    }
    dispatch({ type: "SET_SELECTED_TITLE", payload: title })
    dispatch({ type: "SET_SHOW_RESULTS", payload: false })
    dispatch({ type: "SET_QUERY", payload: "" })
  }

  const handleCantLocate = () => {
    if (eventModeField) {
      form.setValue(eventModeField, "MANUAL" as unknown as never)
    }
    form.setValue(eventIdField, "" as unknown as never)
    dispatch({ type: "RESET" })
    if (onCantLocate) {
      onCantLocate()
    }
  }

  useEffect(() => {
    if (!searchState.showResults) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (containerRef.current && !containerRef.current.contains(target)) {
        dispatch({ type: "SET_SHOW_RESULTS", payload: false })
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchState.showResults])

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="event-search-container">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-error-600">*</span>}
        </label>
        <div className="relative">
          <Input
            type="text"
            value={searchState.query}
            onChange={(e) => dispatch({ type: "SET_QUERY", payload: e.target.value })}
            placeholder={placeholder}
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
          {searchState.showResults &&
            searchState.query &&
            !searchState.isSearching &&
            searchState.results.length === 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-lg">
                No events found. Try a different search term.
              </div>
            )}
        </div>
        {selectedEventId && eventMode === "SELECT" && (
          <div className="mt-2 rounded-md bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">
              Selected: {searchState.selectedEventTitle || "Event"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Event ID: {selectedEventId}</p>
          </div>
        )}
      </div>

      {showCantLocateButton && (
        <Button type="button" variant="outline" onClick={handleCantLocate}>
          Can't Locate Event
        </Button>
      )}
    </div>
  )
}

