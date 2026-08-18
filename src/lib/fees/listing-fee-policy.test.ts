import {
  applyPlatformListingFeePolicy,
  getPlatformListingFeeContext,
  PLATFORM_LISTING_FEE_RULES,
  WAIVE_AUDITION_CREATIVE_PLATFORM_LISTING_FEE,
} from "./listing-fee-policy"

describe("PLATFORM_LISTING_FEE_RULES", () => {
  it("waives performance and class", () => {
    expect(PLATFORM_LISTING_FEE_RULES.performance).toEqual({ kind: "waived" })
    expect(PLATFORM_LISTING_FEE_RULES.class).toEqual({ kind: "waived" })
  })

  it("uses conditional participant_fee rules for audition and creative", () => {
    expect(PLATFORM_LISTING_FEE_RULES.audition).toEqual({
      kind: "conditional",
      feeUsd: 25,
      condition: "participant_fee",
    })
    expect(PLATFORM_LISTING_FEE_RULES.creative).toEqual({
      kind: "conditional",
      feeUsd: 25,
      condition: "participant_fee",
    })
  })
})

describe("getPlatformListingFeeContext", () => {
  it("returns no fee for waived listing types", () => {
    expect(getPlatformListingFeeContext({ listingType: "performance" })).toEqual({
      feeApplies: false,
      amountUsd: null,
      allowsFeeConfiguration: false,
    })
    expect(getPlatformListingFeeContext({ listingType: "class" })).toEqual({
      feeApplies: false,
      amountUsd: null,
      allowsFeeConfiguration: false,
    })
  })

  it("ignores stale PAY_FEE on waived listing types", () => {
    expect(
      getPlatformListingFeeContext({
        listingType: "performance",
        listingFeeOption: "PAY_FEE",
      })
    ).toEqual({
      feeApplies: false,
      amountUsd: null,
      allowsFeeConfiguration: false,
    })
  })

  it("does not charge audition/creative when participant fee is not indicated", () => {
    expect(
      getPlatformListingFeeContext({
        listingType: "audition",
        listingFeeOption: null,
      })
    ).toEqual({
      feeApplies: false,
      amountUsd: null,
      allowsFeeConfiguration: false,
    })
  })

  it("handles audition/creative when participant fee is indicated", () => {
    const ctx = getPlatformListingFeeContext({
      listingType: "creative",
      listingFeeOption: "PAY_FEE",
    })

    expect(ctx.allowsFeeConfiguration).toBe(true)

    if (WAIVE_AUDITION_CREATIVE_PLATFORM_LISTING_FEE) {
      expect(ctx).toEqual({
        feeApplies: false,
        amountUsd: null,
        allowsFeeConfiguration: true,
      })
    } else {
      expect(ctx).toEqual({
        feeApplies: true,
        amountUsd: 25,
        allowsFeeConfiguration: true,
      })
    }
  })
})

describe("applyPlatformListingFeePolicy", () => {
  it("clears performance platform fee fields when fee configuration is not allowed", () => {
    const details = {
      artist_type: "ESTABLISHED",
      listing_fee_option: "PAY_FEE",
      listing_fee_explanation: "test",
      complementary_ticket_info: "info",
    }

    applyPlatformListingFeePolicy("performance", details)

    expect(details.listing_fee_option).toBeNull()
    expect(details.listing_fee_explanation).toBeNull()
    expect(details.complementary_ticket_info).toBeNull()
  })

  it("clears class platform fee fields when fee configuration is not allowed", () => {
    const details = {
      artist_type: "EMERGING",
      listing_fee_option: "PROVIDE",
      listing_fee_explanation: "test",
      guest_spot_info: "guest",
    }

    applyPlatformListingFeePolicy("class", details)

    expect(details.listing_fee_option).toBeNull()
    expect(details.listing_fee_explanation).toBeNull()
    expect(details.guest_spot_info).toBeNull()
  })

  it("leaves audition fee null when participant fee is not configured", () => {
    const details = {
      artist_type: "ESTABLISHED",
      fee: null,
    }

    applyPlatformListingFeePolicy("audition", details)

    expect(details.fee).toBeNull()
  })

  it("preserves audition fee when participant fee applies (even while platform charge is waived)", () => {
    const details = {
      artist_type: "EMERGING",
      fee: "PAY_FEE",
    }

    applyPlatformListingFeePolicy("audition", details)

    expect(details.fee).toBe("PAY_FEE")
  })

  it("preserves creative fee when participant fee applies (even while platform charge is waived)", () => {
    const details = {
      artist_type: "ESTABLISHED",
      fee: "PAY_FEE",
    }

    applyPlatformListingFeePolicy("creative", details)

    expect(details.fee).toBe("PAY_FEE")
  })
})
