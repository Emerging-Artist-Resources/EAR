import {
  computeDonationFeeBreakdown,
  computeGrossChargeCents,
  FISCAL_SPONSORSHIP_FEE_RATE,
} from "./computeDonationCharge"

describe("computeDonationFeeBreakdown", () => {
  it("returns zeros for a zero or invalid gross", () => {
    expect(computeDonationFeeBreakdown(0)).toEqual({
      stripeFeeCents: 0,
      fiscalFeeCents: 0,
      netCents: 0,
    })
    expect(computeDonationFeeBreakdown(-50)).toEqual({
      stripeFeeCents: 0,
      fiscalFeeCents: 0,
      netCents: 0,
    })
    expect(computeDonationFeeBreakdown(Number.NaN)).toEqual({
      stripeFeeCents: 0,
      fiscalFeeCents: 0,
      netCents: 0,
    })
  })

  it("splits a $100 gross into Stripe fee, 5.5%, and net", () => {
    expect(computeDonationFeeBreakdown(10_000)).toEqual({
      stripeFeeCents: 320,
      fiscalFeeCents: 550,
      netCents: 9_130,
    })
  })

  it("makes net equal gross minus both fees", () => {
    const gross = 5_250
    const { stripeFeeCents, fiscalFeeCents, netCents } = computeDonationFeeBreakdown(gross)
    expect(netCents).toBe(gross - stripeFeeCents - fiscalFeeCents)
  })

  it("leaves net near the base gift when the donor covers both fees", () => {
    const baseGiftCents = 10_000
    const gross = computeGrossChargeCents(baseGiftCents, true, true)
    const { netCents } = computeDonationFeeBreakdown(gross)
    expect(netCents).toBe(baseGiftCents)
  })
})

describe("computeGrossChargeCents", () => {
  it("returns the base gift when no fees are covered", () => {
    expect(computeGrossChargeCents(5_000, false, false)).toBe(5_000)
  })

  it("grosses up by 5.5% when only the fiscal fee is covered", () => {
    expect(computeGrossChargeCents(10_000, true, false)).toBe(
      Math.round(10_000 / (1 - FISCAL_SPONSORSHIP_FEE_RATE)),
    )
  })
})
