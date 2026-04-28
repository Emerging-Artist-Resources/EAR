import { normalizeSearchText, scoreListingTitleMatch } from "./read"

describe("listing search scoring", () => {
  it("normalizes punctuation and whitespace", () => {
    expect(normalizeSearchText("Westbeth Dance Festival: Top Floor")).toBe("westbeth dance festival top floor")
    expect(normalizeSearchText("Westbeth-Dance   Festival")).toBe("westbeth dance festival")
  })

  it("gives strong score for reordered token coverage", () => {
    const result = scoreListingTitleMatch(
      normalizeSearchText("dance westbeth"),
      normalizeSearchText("Westbeth Dance Festival")
    )

    expect(result.allTokensPresent).toBe(true)
    expect(result.tokenCoverageRatio).toBe(1)
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  it("supports short token-level prefix inputs", () => {
    const result = scoreListingTitleMatch(
      normalizeSearchText("wes"),
      normalizeSearchText("Westbeth Dance Festival")
    )

    expect(result.hasPrefixMatch).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(30)
  })

  it("keeps weak noisy matches low-scoring", () => {
    const result = scoreListingTitleMatch(
      normalizeSearchText("xyz qqq"),
      normalizeSearchText("Westbeth Dance Festival")
    )

    expect(result.tokenCoverageRatio).toBe(0)
    expect(result.score).toBeLessThan(30)
  })
})
