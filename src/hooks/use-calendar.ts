import { useState, useCallback } from "react"
import { apiGet } from "@/lib/client/fetch-utils"

export type CalendarItem = {
  occurrenceId: string
  listingId: string
  type: "performance" | "audition" | "creative" | "class" | "funding"
  title: string | null
  start: string
  /** Present when the occurrence has an end instant (e.g. class/workshop slots). */
  endsAt?: string | null
  tz: string
}

export type CalendarResponse = {
  data: CalendarItem[]
  deadlines?: CalendarItem[]
}

export interface CalendarParams {
  from?: string
  to?: string
  types?: string[]
  q?: string
  limit?: number
}

export function useCalendar() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [deadlines, setDeadlines] = useState<CalendarItem[]>([])
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
      if (params?.q) qs.set("q", params.q)
      if (params?.limit) qs.set("limit", String(params.limit))
      qs.set("includeDeadlines", "true")

      const url = `/api/calendar${qs.toString() ? `?${qs.toString()}` : ""}`
      const response = await apiGet<CalendarResponse>(url)
      setItems(Array.isArray(response?.data) ? response.data : [])
      setDeadlines(Array.isArray(response?.deadlines) ? response.deadlines : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  return { items, deadlines, loading, error, fetchCalendar }
}


