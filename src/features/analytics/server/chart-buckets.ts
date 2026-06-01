import { addDays, addMonths, addWeeks, format, startOfDay, startOfMonth, startOfWeek } from "date-fns"
import type { AnalyticsRange } from "./types"

export type ChartBucket = {
  start: Date
  end: Date
  label: string
}

export function buildChartBuckets(
  range: AnalyticsRange,
  periodStart: Date | null,
  periodEnd: Date,
): ChartBucket[] {
  const end = startOfDay(periodEnd)

  if (range === "7d") {
    const start = periodStart ?? addDays(end, -6)
    const buckets: ChartBucket[] = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(startOfDay(start), i)
      buckets.push({
        start: day,
        end: addDays(day, 1),
        label: format(day, "MMM d"),
      })
    }
    return buckets
  }

  if (range === "30d" || range === "90d") {
    const start =
      periodStart ?? addDays(end, range === "30d" ? -29 : -89)
    const buckets: ChartBucket[] = []
    let weekStart = startOfWeek(startOfDay(start), { weekStartsOn: 0 })
    while (weekStart < addDays(end, 1)) {
      const weekEnd = addWeeks(weekStart, 1)
      buckets.push({
        start: weekStart,
        end: weekEnd,
        label: format(weekStart, "MMM d"),
      })
      weekStart = weekEnd
    }
    return buckets.length > 0 ? buckets : [singleBucket(end)]
  }

  const buckets: ChartBucket[] = []
  const monthStart = startOfMonth(addMonths(end, -11))
  for (let i = 0; i < 12; i++) {
    const m = addMonths(monthStart, i)
    buckets.push({
      start: m,
      end: addMonths(m, 1),
      label: format(m, "MMM yyyy"),
    })
  }
  return buckets
}

function singleBucket(end: Date): ChartBucket {
  const start = startOfDay(end)
  return { start, end: addDays(start, 1), label: format(start, "MMM d") }
}

export function aggregateIntoBuckets(
  timestamps: string[],
  buckets: ChartBucket[],
): { label: string; count: number }[] {
  const counts = buckets.map(() => 0)
  for (const ts of timestamps) {
    const t = new Date(ts).getTime()
    const idx = buckets.findIndex((b) => t >= b.start.getTime() && t < b.end.getTime())
    if (idx >= 0) counts[idx]++
  }
  return buckets.map((b, i) => ({ label: b.label, count: counts[i] }))
}

export function aggregateAmountsIntoBuckets(
  rows: { at: string; cents: number }[],
  buckets: ChartBucket[],
): { label: string; count: number; amountCents: number }[] {
  const counts = buckets.map(() => 0)
  const amounts = buckets.map(() => 0)
  for (const row of rows) {
    const t = new Date(row.at).getTime()
    const idx = buckets.findIndex((b) => t >= b.start.getTime() && t < b.end.getTime())
    if (idx >= 0) {
      counts[idx]++
      amounts[idx] += row.cents
    }
  }
  return buckets.map((b, i) => ({
    label: b.label,
    count: counts[i],
    amountCents: amounts[i],
  }))
}
