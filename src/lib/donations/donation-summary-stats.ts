import type { DonationSummaryStats } from "@/features/profile/server/types"

/**
 * Build summary stats from a pre-aggregated total and count
 * (e.g. SQL sum + exact count). Normalizes bad inputs and treats
 * a null/empty aggregate total as 0.
 */
export function buildDonationSummaryStats(params: {
  totalAmountCents: number
  donationCount: number
}): DonationSummaryStats {
  const totalAmountCents = Number.isFinite(params.totalAmountCents)
    ? Math.max(0, Math.round(params.totalAmountCents))
    : 0
  const donationCount = Number.isFinite(params.donationCount)
    ? Math.max(0, Math.round(params.donationCount))
    : 0

  return {
    total_amount_cents: totalAmountCents,
    donation_count: donationCount,
    average_amount_cents:
      donationCount > 0 ? Math.round(totalAmountCents / donationCount) : 0,
  }
}

/** Convenience for tests and in-memory amount lists. */
export function computeDonationSummaryStats(amounts: number[]): DonationSummaryStats {
  const totalAmountCents = amounts.reduce((sum, amount) => sum + amount, 0)
  return buildDonationSummaryStats({
    totalAmountCents,
    donationCount: amounts.length,
  })
}

/**
 * PostgREST `amount.sum()` returns `null` when no rows match.
 * Coerce that (and non-numeric values) to 0 cents.
 */
export function normalizeAggregateSumCents(sum: unknown): number {
  if (sum == null) return 0
  const value = typeof sum === "number" ? sum : Number(sum)
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

/** Read `sum` from a one-row PostgREST aggregate result set. */
export function readFirstAggregateSumCents(data: unknown): number {
  if (!Array.isArray(data) || data.length === 0) return 0
  const row = data[0]
  if (!row || typeof row !== "object") return 0
  return normalizeAggregateSumCents((row as { sum?: unknown }).sum)
}
