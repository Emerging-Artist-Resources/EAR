import { createRequestGenerationGate } from "./request-generation-gate"

describe("createRequestGenerationGate", () => {
  it("marks only the latest begin() generation as current", () => {
    const gate = createRequestGenerationGate()

    const first = gate.begin()
    const second = gate.begin()

    expect(gate.isCurrent(first)).toBe(false)
    expect(gate.isCurrent(second)).toBe(true)
  })

  it("ignores an earlier request after a later one has started (A then B; B wins)", () => {
    const gate = createRequestGenerationGate()
    const requestA = gate.begin()
    const requestB = gate.begin()

    // B resolves first, then A — only B is still current.
    expect(gate.isCurrent(requestB)).toBe(true)
    expect(gate.isCurrent(requestA)).toBe(false)
  })
})
