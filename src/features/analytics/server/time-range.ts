import type { AnalyticsRange } from "./types"

export type PeriodBounds = {
  periodStart: Date | null
  periodEnd: Date
  previousPeriodStart: Date | null
  previousPeriodEnd: Date | null
}

const RANGE_DAYS: Record<Exclude<AnalyticsRange, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
}

export function parseAnalyticsRange(value: string | undefined): AnalyticsRange {
  if (value === "7d" || value === "30d" || value === "90d" || value === "1y" || value === "all") {
    return value
  }
  return "30d"
}

export function getPeriodBounds(range: AnalyticsRange): PeriodBounds {
  const periodEnd = new Date()

  if (range === "all") {
    return {
      periodStart: null,
      periodEnd,
      previousPeriodStart: null,
      previousPeriodEnd: null,
    }
  }

  const days = RANGE_DAYS[range]
  const periodStart = new Date(periodEnd.getTime() - days * 24 * 60 * 60 * 1000)
  const previousPeriodEnd = new Date(periodStart.getTime())
  const previousPeriodStart = new Date(previousPeriodEnd.getTime() - days * 24 * 60 * 60 * 1000)

  return { periodStart, periodEnd, previousPeriodStart, previousPeriodEnd }
}

export function toIso(date: Date | null): string | undefined {
  return date ? date.toISOString() : undefined
}
