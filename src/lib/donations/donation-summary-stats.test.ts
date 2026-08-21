import {
  buildDonationSummaryStats,
  computeDonationSummaryStats,
  normalizeAggregateSumCents,
  readFirstAggregateSumCents,
} from "./donation-summary-stats"

describe("buildDonationSummaryStats", () => {
  it("computes rounded average from total and count", () => {
    expect(
      buildDonationSummaryStats({ totalAmountCents: 10500, donationCount: 3 }),
    ).toEqual({
      total_amount_cents: 10500,
      donation_count: 3,
      average_amount_cents: 3500,
    })
  })

  it("returns zeros when there are no donations", () => {
    expect(
      buildDonationSummaryStats({ totalAmountCents: 0, donationCount: 0 }),
    ).toEqual({
      total_amount_cents: 0,
      donation_count: 0,
      average_amount_cents: 0,
    })
  })

  it("treats a non-zero total with zero count as zero average", () => {
    expect(
      buildDonationSummaryStats({ totalAmountCents: 5000, donationCount: 0 }),
    ).toEqual({
      total_amount_cents: 5000,
      donation_count: 0,
      average_amount_cents: 0,
    })
  })
})

describe("computeDonationSummaryStats", () => {
  it("sums amounts and computes rounded average", () => {
    expect(computeDonationSummaryStats([5000, 3000, 2500])).toEqual({
      total_amount_cents: 10500,
      donation_count: 3,
      average_amount_cents: 3500,
    })
  })

  it("returns zeros when there are no donations", () => {
    expect(computeDonationSummaryStats([])).toEqual({
      total_amount_cents: 0,
      donation_count: 0,
      average_amount_cents: 0,
    })
  })
})

describe("normalizeAggregateSumCents / readFirstAggregateSumCents", () => {
  it("normalizes null and invalid sums to 0", () => {
    expect(normalizeAggregateSumCents(null)).toBe(0)
    expect(normalizeAggregateSumCents(undefined)).toBe(0)
    expect(normalizeAggregateSumCents("not-a-number")).toBe(0)
  })

  it("reads sum from a PostgREST aggregate row", () => {
    expect(readFirstAggregateSumCents([{ sum: 12500 }])).toBe(12500)
    expect(readFirstAggregateSumCents([{ sum: null }])).toBe(0)
    expect(readFirstAggregateSumCents([])).toBe(0)
  })

  it("accepts numeric strings from drivers that stringify bigints", () => {
    expect(readFirstAggregateSumCents([{ sum: "4200" }])).toBe(4200)
  })
})
