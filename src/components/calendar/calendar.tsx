"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { FilterBar } from "@/components/calendar/FilterBar"
import { Performance } from "@/hooks/use-performances"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
} from "date-fns"

interface CalendarProps {
  performances: Performance[]
}

export function Calendar({ performances }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL')
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL')
  const [genresFilter, setGenresFilter] = useState<Set<string>>(new Set())
  const [boroughsFilter, setBoroughsFilter] = useState<Set<string>>(new Set())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfMonth = monthStart.getDay()
  const emptyCells = Array.from({ length: firstDayOfMonth }, () => null)

  const navigate = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1
    if (view === 'month') {
      setCurrentDate(delta === -1 ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(delta === -1 ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(delta === -1 ? addDays(currentDate, -1) : addDays(currentDate, 1))
    }
  }

  const filteredPerformances = useMemo(() => {
    type Maybe<T> = T | null | undefined
    type PerfLike = Performance | (Performance & { [key: string]: unknown })

    const asRecord = (val: unknown): Record<string, unknown> | null => {
      return val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : null
    }

    const getFrom = (rec: Record<string, unknown> | null, key: string): unknown => {
      return rec ? rec[key] : undefined
    }

    const getEventType = (p: PerfLike): string | undefined => {
      const prec = asRecord(p)
      const details = asRecord(getFrom(prec, 'details'))
      const val = getFrom(prec, 'eventType') ?? getFrom(prec, 'event_type') ?? getFrom(details, 'eventType') ?? getFrom(details, 'event_type')
      return typeof val === 'string' ? val : undefined
    }

    const getPrice = (p: PerfLike): Maybe<string | number> => {
      const prec = asRecord(p)
      const details = asRecord(getFrom(prec, 'details'))
      const val = getFrom(prec, 'ticketPrice') ?? getFrom(details, 'ticketPrice') ?? getFrom(prec, 'price') ?? getFrom(details, 'price')
      return typeof val === 'string' || typeof val === 'number' ? val : undefined
    }

    const getLocation = (p: PerfLike): string | undefined => {
      const prec = asRecord(p)
      const details = asRecord(getFrom(prec, 'details'))
      const val = getFrom(prec, 'location') ?? getFrom(details, 'location')
      return typeof val === 'string' ? val : undefined
    }

    const getGenres = (p: PerfLike): string[] | undefined => {
      const prec = asRecord(p)
      const details = asRecord(getFrom(prec, 'details'))
      const raw = getFrom(prec, 'genres') ?? getFrom(prec, 'genre') ?? getFrom(details, 'genres') ?? getFrom(details, 'genre')
      if (Array.isArray(raw)) return raw.filter(v => typeof v === 'string') as string[]
      if (typeof raw === 'string') return [raw]
      return undefined
    }

    const getOpportunitySubtype = (p: PerfLike): string | undefined => {
      const prec = asRecord(p)
      const details = asRecord(getFrom(prec, 'details'))
      const val = getFrom(details, 'opportunityType') ?? getFrom(prec, 'opportunityType')
      return typeof val === 'string' ? val : undefined
    }

    const isFree = (val: unknown): boolean => {
      if (val == null) return false
      const s = String(val).toLowerCase().trim()
      if (s === 'free' || s === '$0' || s === '0') return true
      const num = parseFloat(s.replace(/[^0-9.]/g, ''))
      return !isNaN(num) && num === 0
    }

    const boroughFrom = (loc?: string): string | null => {
      if (!loc) return null
      const L = loc.toLowerCase()
      if (L.includes('manhattan')) return 'Manhattan'
      if (L.includes('brooklyn')) return 'Brooklyn'
      if (L.includes('queens')) return 'Queens'
      if (L.includes('bronx')) return 'Bronx'
      if (L.includes('staten island')) return 'Staten Island'
      return null
    }

    const matchGenre = (val: string[] | undefined): boolean => {
      if (genresFilter.size === 0) return true
      if (!val) return false
      const lowerSet = new Set(val.map(v => String(v).toLowerCase()))
      for (const g of genresFilter) {
        if (lowerSet.has(g.toLowerCase())) return true
      }
      return false
    }

    return performances.filter((p: PerfLike) => {
      const type = (getEventType(p) || '').toUpperCase()
      if (eventTypeFilter !== 'ALL') {
        if (eventTypeFilter === 'PERFORMANCE' || eventTypeFilter === 'CLASS') {
          if (type !== eventTypeFilter) return false
        } else {
          const sub = getOpportunitySubtype(p)
          if (String(sub || '').toUpperCase() !== eventTypeFilter) return false
        }
      }

      if (priceFilter !== 'ALL') {
        const priceVal = getPrice(p)
        const free = isFree(priceVal)
        if (priceFilter === 'FREE' && !free) return false
        if (priceFilter === 'PAID' && free) return false
      }

      if (!matchGenre(getGenres(p))) return false

      if (boroughsFilter.size > 0) {
        const prec = asRecord(p)
        const details = asRecord(getFrom(prec, 'details'))
        const boroughRaw = getFrom(details, 'borough')
        const borough = typeof boroughRaw === 'string' ? boroughRaw : boroughFrom(getLocation(p))
        if (!borough || !boroughsFilter.has(String(borough))) return false
      }

      return true
    })
  }, [performances, eventTypeFilter, priceFilter, genresFilter, boroughsFilter])

  const getPerformancesForDate = (date: Date) => {
    const targetIso = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      .toISOString()
      .slice(0, 10)
    return filteredPerformances.filter((performance) => {
      const src = performance.date as unknown as string
      const eventIso = (typeof src === 'string' ? src : new Date(src).toISOString()).slice(0, 10)
      return eventIso === targetIso
    })
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {view === 'month' && format(currentDate, "MMMM yyyy")}
          {view === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d")} – ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`}
          {view === 'day' && format(currentDate, "MMMM d, yyyy")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('prev')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => { setCurrentDate(new Date()); setSelectedDate(null) }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => navigate('next')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="w-full sm:w-auto sm:ml-4 inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setView('month')}
              className={`flex-1 sm:flex-none px-3 py-1 text-sm font-medium border border-gray-300 ${view === 'month' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-l-md`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`flex-1 sm:flex-none px-3 py-1 text-sm font-medium border-t border-b border-gray-300 ${view === 'week' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`flex-1 sm:flex-none px-3 py-1 text-sm font-medium border border-gray-300 ${view === 'day' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'} rounded-r-md`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <FilterBar
        show={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        eventType={eventTypeFilter}
        onChangeEventType={setEventTypeFilter}
        price={priceFilter}
        onChangePrice={(v) => setPriceFilter(v)}
        genres={genresFilter}
        onChangeGenres={(next) => setGenresFilter(new Set(next))}
        boroughs={boroughsFilter}
        onChangeBoroughs={(next) => setBoroughsFilter(new Set(next))}
      />

      {view === 'month' && (
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 py-2 text-center text-xs sm:text-sm font-medium text-gray-500">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
          {emptyCells.map((__, idx) => (
            <div key={`empty-${idx}`} className="bg-white min-h-[80px] sm:min-h-[120px]" />
          ))}
          {daysInMonth.map((day) => {
            const dayPerformances = getPerformancesForDate(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)
            return (
              <div
                key={day.toISOString()}
                className={`bg-white p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'text-gray-300' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-xs sm:text-sm font-medium ${
                  isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="mt-1 space-y-1">
                  {dayPerformances.slice(0, 2).map((performance) => (
                    <div
                      key={performance.id}
                      className="text-xs bg-indigo-100 text-indigo-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate"
                      title={performance.title}
                    >
                      <span className="hidden sm:inline">{performance.title}</span>
                      <span className="sm:hidden">{performance.title.substring(0, 8)}...</span>
                    </div>
                  ))}
                  {dayPerformances.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayPerformances.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'week' && (() => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
        return (
          <>
            <div className="hidden sm:grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-gray-50 py-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-px bg-gray-200">
              {daysOfWeek.map((day) => {
                const dayPerformances = getPerformancesForDate(day)
                const isToday = isSameDay(day, new Date())
                return (
                  <div key={day.toISOString()} className={`bg-white p-2 min-h-[100px] sm:min-h-[140px] ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>{format(day, 'EEE d')}</div>
                    <div className="mt-1 space-y-1">
                      {dayPerformances.length === 0 ? (
                        <div className="text-xs text-gray-400">No events</div>
                      ) : (
                        dayPerformances.map((performance) => (
                          <div key={performance.id} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded truncate" title={performance.title}>
                            {performance.title}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      })()}

      {view === 'day' && (
        <div className="p-2">
          <div className="text-base sm:text-sm text-gray-600 mb-2">{format(currentDate, 'EEEE, MMMM d, yyyy')}</div>
          {(() => {
            const dayPerformances = getPerformancesForDate(currentDate)
            if (dayPerformances.length === 0) {
              return <div className="text-sm text-gray-500">No performances scheduled for this date.</div>
            }
            return (
              <div className="space-y-3">
                {dayPerformances.map((performance) => (
                  <Card key={performance.id} padding="sm">
                    <h4 className="text-base sm:text-lg font-medium text-gray-900">{performance.title}</h4>
                    {performance.time && (
                      <p className="text-sm text-gray-600"><strong>Time:</strong> {performance.time}</p>
                    )}
                    {performance.location && (
                      <p className="text-sm text-gray-600"><strong>Location:</strong> {performance.location}</p>
                    )}
                    {performance.description && (
                      <p className="text-sm text-gray-600 mt-1">{performance.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {view === 'month' && selectedDate && (
        <Card className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performances on {format(selectedDate, "MMMM d, yyyy")}
          </h3>
          {getPerformancesForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500">No performances scheduled for this date.</p>
          ) : (
            <div className="space-y-4">
              {getPerformancesForDate(selectedDate).map((performance) => (
                <Card key={performance.id} padding="sm">
                  <h4 className="text-lg font-medium text-gray-900">
                    {performance.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Performer:</strong> {performance.performer}
                  </p>
                  {performance.time && (
                    <p className="text-sm text-gray-600">
                      <strong>Time:</strong> {performance.time}
                    </p>
                  )}
                  {performance.location && (
                    <p className="text-sm text-gray-600">
                      <strong>Location:</strong> {performance.location}
                    </p>
                  )}
                  {performance.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Description:</strong> {performance.description}
                    </p>
                  )}
                  {(performance.contactEmail || performance.contactPhone) && (
                    <p className="text-sm text-gray-500 mt-2">
                      <strong>Contact:</strong> {performance.contactEmail} {performance.contactPhone}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}
    </Card>
  )
}


