import { greetingNameFromFullName } from "./person-name"

describe("greetingNameFromFullName", () => {
  it("returns first token for multi-word names", () => {
    expect(greetingNameFromFullName("Jane Doe")).toBe("Jane")
    expect(greetingNameFromFullName("Madonna Ciccone")).toBe("Madonna")
  })

  it("returns full name for single-word names", () => {
    expect(greetingNameFromFullName("Prince")).toBe("Prince")
  })

  it('returns "there" for missing or blank names', () => {
    expect(greetingNameFromFullName(null)).toBe("there")
    expect(greetingNameFromFullName(undefined)).toBe("there")
    expect(greetingNameFromFullName("")).toBe("there")
    expect(greetingNameFromFullName("   ")).toBe("there")
  })
})
