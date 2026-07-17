"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { useEffect, useReducer, useRef, useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/client/fetch-utils"
import { FormFieldTooltip } from "@/components/forms/blocks/FormFieldTooltip"

type EventType = "performance" | "audition" | "creative" | "class" | "funding"

type CalendarItem = {
  occurrenceId?: string
  listingId: string
  type: EventType
  title: string | null
  start: string | null
  tz: string | null
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
  /** Overrides default "Can't Locate Event" button label. */
  cantLocateButtonLabel?: string
  /** Shown beside the "can't locate" control when search is visible. */
  cantLocateTooltip?: string
  onCantLocate?: () => void
  /** Fired when the selected EAR parent id is set or cleared (piece schedule depends on this). */
  onParentIdChange?: (listingId: string | null) => void
  required?: boolean
}

export function EventSearch<T extends Record<string, unknown>>({
  form,
  eventType,
  eventIdField,
  eventModeField,
  label = "Search for EAR event",
  placeholder = "Start typing the event title...",
  showCantLocateButton = false,
  cantLocateButtonLabel = "Event not listed with EAR? Enter manually.",
  cantLocateTooltip,
  onCantLocate,
  onParentIdChange,
  required = false,
}: EventSearchProps<T>) {
  const eventTypes = Array.isArray(eventType) ? eventType : [eventType]
  const apiTypes = eventTypes.map(mapEventTypeToApi).join(",")

  const selectedEventId = form.watch(eventIdField) as string | undefined
  const eventMode = eventModeField ? (form.watch(eventModeField) as string | undefined) : undefined

  const [searchState, dispatch] = useReducer(searchReducer, initialState)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [eventTitle, setEventTitle] = useState<string | null>(null)
  const [loadingTitle, setLoadingTitle] = useState(false)

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
        const response = await apiGet<{ data: CalendarItem[]; deadlines?: CalendarItem[] }>(`/api/calendar?${qs.toString()}`)
        const items = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])
        dispatch({ type: "SET_RESULTS", payload: items })
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


  const handleSelectEvent = (listingId: string, title: string | null) => {
    const previousId = form.getValues(eventIdField) as string | undefined
    form.setValue(eventIdField, listingId as unknown as never)
    if (eventModeField) {
      form.setValue(eventModeField, "SELECT" as unknown as never)
    }
    dispatch({ type: "SET_SELECTED_TITLE", payload: title })
    setEventTitle(title)
    dispatch({ type: "SET_SHOW_RESULTS", payload: false })
    dispatch({ type: "SET_QUERY", payload: "" })
    if (previousId !== listingId) {
      onParentIdChange?.(listingId)
    }
  }

  const handleBackToSearch = () => {
    form.setValue(eventIdField, "" as unknown as never)
    dispatch({ type: "RESET" })
    setEventTitle(null)
    onParentIdChange?.(null)
  }

  // Fetch event title when selectedEventId changes (if we don't already have it)
  useEffect(() => {
    if (selectedEventId && eventMode === "SELECT" && !eventTitle && !loadingTitle) {
      setLoadingTitle(true)
      apiGet<{ data: { performance_details?: { title: string } | null; audition_details?: { title: string } | null; creative_details?: { title: string } | null; class_workshop_details?: { title: string } | null; type: string } }>(`/api/events/${selectedEventId}`)
        .then((response) => {
          const data = (response as any)?.data || response
          const title =
            data.type === "performance" ? data.performance_details?.title :
            data.type === "audition" ? data.audition_details?.title :
            data.type === "creative" ? data.creative_details?.title :
            data.type === "class" ? data.class_workshop_details?.title :
            null
          setEventTitle(title)
          dispatch({ type: "SET_SELECTED_TITLE", payload: title })
        })
        .catch((error) => {
          console.error("Error fetching event title:", error)
          setEventTitle("Event")
        })
        .finally(() => {
          setLoadingTitle(false)
        })
    }
  }, [selectedEventId, eventMode, eventTitle, loadingTitle])

  const handleCantLocate = () => {
    if (eventModeField) {
      form.setValue(eventModeField, "MANUAL" as unknown as never)
    }
    form.setValue(eventIdField, "" as unknown as never)
    dispatch({ type: "RESET" })
    setEventTitle(null)
    onParentIdChange?.(null)
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

  const isEventSelected = selectedEventId && eventMode === "SELECT"
  const displayTitle = eventTitle || searchState.selectedEventTitle || "Event"

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="event-search-container">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-error-600">*</span>}
        </label>
        
        {isEventSelected ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {loadingTitle ? (
                  <p className="text-sm text-gray-500">Loading event...</p>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{displayTitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleBackToSearch}
                className="ml-4 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Back to search
              </button>
            </div>
          </div>
        ) : (
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
                    key={item.listingId}
                    type="button"
                    onClick={() => handleSelectEvent(item.listingId, item.title)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900">{item.title || "Untitled Event"}</div>
                    {item.start && (
                      <div className="text-sm text-gray-500">
                        {new Date(item.start).toLocaleDateString()}
                      </div>
                    )}
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
        )}
      </div>

      {showCantLocateButton && !isEventSelected && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleCantLocate}>
            {cantLocateButtonLabel}
          </Button>
          {cantLocateTooltip?.trim() ? <FormFieldTooltip text={cantLocateTooltip.trim()} /> : null}
        </div>
      )}
    </div>
  )
}

