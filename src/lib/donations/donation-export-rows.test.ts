import type { ReceivedDonationSummary } from "@/features/profile/server/types"
import { computeDonationFeeBreakdown } from "@/lib/payments/computeDonationCharge"
import { centsToUsdAmount } from "@/lib/payments/formatUsdFromCents"
import { ANONYMOUS_DONOR_LABEL } from "@/lib/donations/donor-display"
import {
  buildDonationExportFileName,
  toDonationExportRow,
} from "./donation-export-rows"

function summary(
  overrides: Partial<ReceivedDonationSummary> & Pick<ReceivedDonationSummary, "amount">,
): ReceivedDonationSummary {
  const fees = computeDonationFeeBreakdown(overrides.amount)
  return {
    id: "donation-1",
    created_at: "2026-06-01T12:00:00.000Z",
    donor_name: "Jane Donor",
    donor_email: "jane@example.com",
    stripe_fee_cents: fees.stripeFeeCents,
    fiscal_fee_cents: fees.fiscalFeeCents,
    net_cents: fees.netCents,
    message: "Keep creating!",
    designation_label_snapshot: "General support",
    ...overrides,
  }
}

describe("toDonationExportRow", () => {
  it("maps a donation to spreadsheet columns using the shared fee breakdown", () => {
    const amount = 5250
    const donation = summary({ amount })
    const fees = computeDonationFeeBreakdown(amount)

    expect(toDonationExportRow(donation)).toEqual({
      donor: "Jane Donor",
      email: "jane@example.com",
      date: new Date("2026-06-01T12:00:00.000Z"),
      amount: centsToUsdAmount(amount),
      stripeFee: centsToUsdAmount(fees.stripeFeeCents),
      fiscalFee: centsToUsdAmount(fees.fiscalFeeCents),
      net: centsToUsdAmount(fees.netCents),
      designation: "General support",
      message: "Keep creating!",
    })
  })

  it("uses Anonymous and blank optional fields when missing", () => {
    const donation = summary({
      amount: 1000,
      donor_name: null,
      donor_email: null,
      message: null,
      designation_label_snapshot: null,
    })

    const row = toDonationExportRow(donation)
    expect(row.donor).toBe(ANONYMOUS_DONOR_LABEL)
    expect(row.email).toBe("")
    expect(row.designation).toBe("")
    expect(row.message).toBe("")
  })
})

describe("buildDonationExportFileName", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2026-08-21T15:00:00.000Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("includes both bounds when a range is selected", () => {
    expect(buildDonationExportFileName("2026-08-01", "2026-08-18")).toBe(
      "donations-2026-08-01-to-2026-08-18.xlsx",
    )
  })

  it("includes a single bound when only from or to is set", () => {
    expect(buildDonationExportFileName("2026-08-01")).toBe("donations-from-2026-08-01.xlsx")
    expect(buildDonationExportFileName(undefined, "2026-08-18")).toBe(
      "donations-through-2026-08-18.xlsx",
    )
  })

  it("uses the date-less fallback when either provided bound is invalid", () => {
    expect(buildDonationExportFileName("2026-08-01", "not-a-date")).toBe(
      "donations-2026-08-21.xlsx",
    )
    expect(buildDonationExportFileName("2026-02-30", "2026-08-18")).toBe(
      "donations-2026-08-21.xlsx",
    )
    expect(buildDonationExportFileName("nope")).toBe("donations-2026-08-21.xlsx")
  })

  it("uses the date-less fallback when neither bound is set", () => {
    expect(buildDonationExportFileName()).toBe("donations-2026-08-21.xlsx")
    expect(buildDonationExportFileName("", "")).toBe("donations-2026-08-21.xlsx")
  })
})
