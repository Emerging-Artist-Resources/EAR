import { useState, useCallback, useRef } from "react"
import { apiGet } from "@/lib/client/fetch-utils"
import { createRequestGenerationGate, type RequestGenerationGate } from "@/lib/async/request-generation-gate"
import {
  deadlineWindow,
  dedupeCalendarItems,
  monthKeysOverlapping,
  monthWindow,
  neighborMonthKeys,
  type CalendarVisibleRange,
} from "@/lib/calendar/feed-window"

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

export type RefreshOptions = {
  bypassCache?: boolean
}

type MonthFetchOptions = {
  force?: boolean
  bypassCache?: boolean
  prefetch?: boolean
}

/**
 * Calendar feed hook.
 *
 * Items are cached by calendar month. A successful month is the complete
 * eligible set for that half-open window. Later navigations reuse the cache.
 * `isInitialLoading` is true only until the first fetch settles.
 * On failure, cached items and deadlines stay mounted.
 */
export function useCalendar() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [deadlines, setDeadlines] = useState<CalendarItem[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheRef = useRef<Map<string, CalendarItem[]>>(new Map())
  const gatesRef = useRef<Map<string, RequestGenerationGate>>(new Map())
  const inFlightRef = useRef<Map<string, number>>(new Map())
  const visibleRangeRef = useRef<CalendarVisibleRange | null>(null)
  const loadGateRef = useRef(createRequestGenerationGate())
  const deadlinesGateRef = useRef(createRequestGenerationGate())
  const hasLoadedOnceRef = useRef(false)

  const publishItems = useCallback(() => {
    const merged = dedupeCalendarItems([...cacheRef.current.values()].flat())
    setItems(merged)
  }, [])

  const gateFor = useCallback((monthKey: string) => {
    let gate = gatesRef.current.get(monthKey)
    if (!gate) {
      gate = createRequestGenerationGate()
      gatesRef.current.set(monthKey, gate)
    }
    return gate
  }, [])

  const fetchMonth = useCallback(
    async (monthKey: string, opts: MonthFetchOptions = {}): Promise<boolean> => {
      if (opts.prefetch) {
        if (cacheRef.current.has(monthKey) || inFlightRef.current.has(monthKey)) return true
      } else if (!opts.force && cacheRef.current.has(monthKey)) {
        return true
      }

      const gate = gateFor(monthKey)
      const generation = gate.begin()
      inFlightRef.current.set(monthKey, generation)
      const { from, to } = monthWindow(monthKey)

      try {
        const qs = new URLSearchParams({ from, to })
        if (opts.bypassCache) qs.set("refresh", String(Date.now()))
        const response = await apiGet<CalendarResponse>(
          `/api/calendar?${qs.toString()}`,
          opts.bypassCache ? { cache: "no-store" } : undefined
        )
        if (!gate.isCurrent(generation)) return true

        cacheRef.current.set(monthKey, Array.isArray(response?.data) ? response.data : [])
        publishItems()
        return true
      } catch (e) {
        if (!gate.isCurrent(generation)) return true
        if (!opts.prefetch) {
          setError(e instanceof Error ? e.message : "An error occurred")
          return false
        }
        console.error("Calendar month prefetch failed", { monthKey, error: e })
        return true
      } finally {
        if (inFlightRef.current.get(monthKey) === generation) {
          inFlightRef.current.delete(monthKey)
        }
      }
    },
    [gateFor, publishItems]
  )

  const loadMonths = useCallback(
    async (monthKeys: string[], opts?: { force?: boolean; bypassCache?: boolean }) => {
      const generation = loadGateRef.current.begin()
      const first = !hasLoadedOnceRef.current
      if (first) setIsInitialLoading(true)
      else if (opts?.force) setIsRefreshing(true)

      try {
        const results = await Promise.all(
          monthKeys.map((monthKey) =>
            fetchMonth(monthKey, {
              force: opts?.force,
              bypassCache: opts?.bypassCache,
              prefetch: false,
            })
          )
        )
        if (loadGateRef.current.isCurrent(generation) && results.every(Boolean)) {
          setError(null)
        }

        const neighbors = neighborMonthKeys(monthKeys)
        void Promise.all(neighbors.map((monthKey) => fetchMonth(monthKey, { prefetch: true })))
      } finally {
        hasLoadedOnceRef.current = true
        if (loadGateRef.current.isCurrent(generation)) {
          setIsInitialLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [fetchMonth]
  )

  const ensureVisibleRange = useCallback(
    async (range: CalendarVisibleRange) => {
      visibleRangeRef.current = range
      await loadMonths(monthKeysOverlapping(range))
    },
    [loadMonths]
  )

  const refreshVisible = useCallback(
    async ({ bypassCache = false }: RefreshOptions = {}) => {
      const range = visibleRangeRef.current
      if (!range) return
      await loadMonths(monthKeysOverlapping(range), { force: true, bypassCache })
    },
    [loadMonths]
  )

  const loadDeadlines = useCallback(
    async ({ bypassCache = false, now = new Date() }: RefreshOptions & { now?: Date } = {}) => {
      const generation = deadlinesGateRef.current.begin()
      const { from, to } = deadlineWindow(now)
      try {
        const qs = new URLSearchParams({ from, to, feed: "deadlines" })
        if (bypassCache) qs.set("refresh", String(Date.now()))
        const response = await apiGet<CalendarResponse>(
          `/api/calendar?${qs.toString()}`,
          bypassCache ? { cache: "no-store" } : undefined
        )
        if (!deadlinesGateRef.current.isCurrent(generation)) return
        setDeadlines(Array.isArray(response?.deadlines) ? response.deadlines : [])
      } catch (e) {
        if (!deadlinesGateRef.current.isCurrent(generation)) return
        setError(e instanceof Error ? e.message : "An error occurred")
      }
    },
    []
  )

  return {
    items,
    deadlines,
    isInitialLoading,
    isRefreshing,
    error,
    ensureVisibleRange,
    refreshVisible,
    loadDeadlines,
  }
}
