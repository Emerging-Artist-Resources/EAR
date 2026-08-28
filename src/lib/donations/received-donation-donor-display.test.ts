import {
  formatDonorCellDesignationLine,
  formatDonorCellMessageLine,
  truncateForDonorCellDisplay,
} from "@/lib/donations/received-donation-donor-display"

describe("truncateForDonorCellDisplay", () => {
  it("returns text unchanged when within limit", () => {
    expect(truncateForDonorCellDisplay("Tickets", 28)).toEqual({
      display: "Tickets",
      full: "Tickets",
      truncated: false,
    })
  })

  it("truncates with ellipsis when over limit", () => {
    const long = "a".repeat(50)
    const result = truncateForDonorCellDisplay(long, 40)
    expect(result.display).toBe(`${"a".repeat(40)}…`)
    expect(result.full).toBe(long)
    expect(result.truncated).toBe(true)
  })
})

describe("formatDonorCellDesignationLine", () => {
  it("builds For · label and title when label is long", () => {
    const label = "Annual artist development fund"
    const result = formatDonorCellDesignationLine(label, "For")
    expect(result.display.startsWith("For · ")).toBe(true)
    expect(result.display.length).toBeLessThan(label.length + 6)
    expect(result.title).toBe(`For · ${label}`)
  })
})

describe("formatDonorCellMessageLine", () => {
  it("wraps message in quotes and sets title when truncated", () => {
    const message =
      "How many emerging artists do you know with an annual accolade program?"
    const result = formatDonorCellMessageLine(message)
    expect(result.display.startsWith("“")).toBe(true)
    expect(result.display.endsWith("”")).toBe(true)
    expect(result.title).toBe(message)
  })
})
