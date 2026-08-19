import { mapReceivedDonationSummary, computeDonationSummaryStats } from "./repository"
import { computeDonationFeeBreakdown } from "@/lib/payments/computeDonationCharge"

describe("mapReceivedDonationSummary", () => {
  it("maps donor email, total charged amount, and estimated fee breakdown", () => {
    const amount = 5250
    const fees = computeDonationFeeBreakdown(amount)
    const summary = mapReceivedDonationSummary({
      id: "donation-1",
      created_at: "2026-06-01T12:00:00.000Z",
      donor_name: "Jane Donor",
      donor_email: "jane@example.com",
      amount,
      message: "Keep creating!",
      designation_label_snapshot: "General support",
    })

    expect(summary).toEqual({
      id: "donation-1",
      created_at: "2026-06-01T12:00:00.000Z",
      donor_name: "Jane Donor",
      donor_email: "jane@example.com",
      amount,
      stripe_fee_cents: fees.stripeFeeCents,
      fiscal_fee_cents: fees.fiscalFeeCents,
      net_cents: fees.netCents,
      message: "Keep creating!",
      designation_label_snapshot: "General support",
    })
  })

  it("normalizes null optional fields", () => {
    const summary = mapReceivedDonationSummary({
      id: "donation-2",
      created_at: "2026-06-02T12:00:00.000Z",
      donor_name: null,
      donor_email: null,
      amount: 1000,
      message: null,
      designation_label_snapshot: null,
    })

    expect(summary.donor_name).toBeNull()
    expect(summary.donor_email).toBeNull()
    expect(summary.message).toBeNull()
    expect(summary.designation_label_snapshot).toBeNull()
    expect(summary.amount).toBe(1000)
    expect(summary.net_cents).toBe(
      summary.amount - summary.stripe_fee_cents - summary.fiscal_fee_cents,
    )
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
