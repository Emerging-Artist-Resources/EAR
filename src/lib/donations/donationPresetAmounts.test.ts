import {
  DEFAULT_DONATION_PRESET_AMOUNTS,
  parseDonationPresetAmounts,
  resolveDonationPresetAmounts,
} from "./donationPresetAmounts"

describe("parseDonationPresetAmounts", () => {
  it("returns null for missing or non-array input", () => {
    expect(parseDonationPresetAmounts(null)).toBeNull()
    expect(parseDonationPresetAmounts(undefined)).toBeNull()
    expect(parseDonationPresetAmounts("25,50")).toBeNull()
  })

  it("accepts valid whole-dollar amounts", () => {
    expect(parseDonationPresetAmounts([100, 25, 50])).toEqual([25, 50, 100])
  })

  it("dedupes and sorts", () => {
    expect(parseDonationPresetAmounts([50, 50, 25])).toEqual([25, 50])
  })

  it("rejects out-of-range, non-integer, or too many values", () => {
    expect(parseDonationPresetAmounts([0])).toBeNull()
    expect(parseDonationPresetAmounts([100_001])).toBeNull()
    expect(parseDonationPresetAmounts([25.5])).toBeNull()
    expect(parseDonationPresetAmounts([25, 50, 75, 100, 125, 150, 175])).toBeNull()
    expect(parseDonationPresetAmounts([])).toBeNull()
  })
})

describe("resolveDonationPresetAmounts", () => {
  it("returns default when custom is null or invalid", () => {
    expect(resolveDonationPresetAmounts(null)).toEqual([...DEFAULT_DONATION_PRESET_AMOUNTS])
    expect(resolveDonationPresetAmounts([])).toEqual([...DEFAULT_DONATION_PRESET_AMOUNTS])
  })

  it("returns validated custom amounts", () => {
    expect(resolveDonationPresetAmounts([10, 20, 30])).toEqual([10, 20, 30])
  })
})
