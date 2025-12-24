import { useState, useCallback } from "react"
import { apiGet } from "@/lib/fetch-utils"

export type CalendarItem = {
  occurrenceId: string
  eventId: string
  type: "performance" | "audition" | "creative" | "class" | "funding"
  title: string | null
  start: string
  tz: string
}

export interface CalendarParams {
  from?: string
  to?: string
  types?: string[]
  borough?: string
  q?: string
  limit?: number
}

export function useCalendar() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalendar = useCallback(async (params?: CalendarParams) => {
    try {
      setLoading(true)
      setError(null)
      
      const qs = new URLSearchParams()
      if (params?.from) qs.set("from", params.from)
      if (params?.to) qs.set("to", params.to)
      if (params?.types?.length) qs.set("types", params.types.join(","))
      if (params?.borough) qs.set("borough", params.borough)
      if (params?.q) qs.set("q", params.q)
      if (params?.limit) qs.set("limit", String(params.limit))

      const url = `/api/calendar${qs.toString() ? `?${qs.toString()}` : ""}`
      const data = await apiGet<CalendarItem[]>(url)
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  return { items, loading, error, fetchCalendar }
}


