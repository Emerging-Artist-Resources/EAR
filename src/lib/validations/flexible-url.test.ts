import {
  flexibleUrlNullableSchema,
  flexibleUrlOptionalSchema,
  flexibleUrlOrEmptySchema,
  flexibleUrlRequiredSchema,
  normalizeUserEnteredUrl,
  signupOptionalWebsiteSchema,
} from "./flexible-url"

describe("normalizeUserEnteredUrl", () => {
  it("prefixes https when scheme is missing", () => {
    expect(normalizeUserEnteredUrl("example.com/path")).toBe("https://example.com/path")
  })

  it("leaves http and https URLs unchanged", () => {
    expect(normalizeUserEnteredUrl("http://a.test")).toBe("http://a.test")
    expect(normalizeUserEnteredUrl("HTTPS://B.TEST")).toBe("HTTPS://B.TEST")
  })

  it("trims whitespace", () => {
    expect(normalizeUserEnteredUrl("  dance.org  ")).toBe("https://dance.org")
  })
})

describe("flexibleUrlOrEmptySchema", () => {
  it("accepts domain-only input", () => {
    const r = flexibleUrlOrEmptySchema.safeParse("tickets.site/event")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe("https://tickets.site/event")
  })

  it("allows empty string", () => {
    const r = flexibleUrlOrEmptySchema.safeParse("")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe("")
  })

  it("rejects non-http schemes like ftp", () => {
    const r = flexibleUrlOrEmptySchema.safeParse("ftp://example.com")
    expect(r.success).toBe(false)
  })

  it("rejects single-label hosts like dance (not a real public URL)", () => {
    const r = flexibleUrlOrEmptySchema.safeParse("dance")
    expect(r.success).toBe(false)
  })

  it("rejects incomplete hosts like www.", () => {
    expect(flexibleUrlOrEmptySchema.safeParse("www.").success).toBe(false)
  })

  it("rejects reserved .test TLD hostnames like www.test", () => {
    expect(flexibleUrlOrEmptySchema.safeParse("www.test").success).toBe(false)
  })

  it("rejects empty DNS labels (double dots)", () => {
    expect(flexibleUrlOrEmptySchema.safeParse("foo..bar.org").success).toBe(false)
  })

  it("accepts normal multi-label hosts", () => {
    const r = flexibleUrlOrEmptySchema.safeParse("www.example.org/path")
    expect(r.success).toBe(true)
  })

  it("rejects dangerous schemes like javascript", () => {
    const r = flexibleUrlOrEmptySchema.safeParse("javascript:alert(1)")
    expect(r.success).toBe(false)
  })
})

describe("flexibleUrlNullableSchema", () => {
  it("preserves undefined for omitted-style input", () => {
    const r = flexibleUrlNullableSchema.safeParse(undefined)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBeUndefined()
  })

  it("normalizes non-empty values", () => {
    const r = flexibleUrlNullableSchema.safeParse("foo.bar")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe("https://foo.bar")
  })

  it("rejects malformed hosts", () => {
    const r = flexibleUrlNullableSchema.safeParse("https://")
    expect(r.success).toBe(false)
  })
})

describe("flexibleUrlOptionalSchema", () => {
  it("treats blank input as undefined", () => {
    const r = flexibleUrlOptionalSchema.safeParse("   ")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBeUndefined()
  })
})

describe("flexibleUrlRequiredSchema", () => {
  const schema = flexibleUrlRequiredSchema()

  it("requires non-empty value", () => {
    const r = schema.safeParse("")
    expect(r.success).toBe(false)
  })

  it("rejects ftp protocol", () => {
    const r = schema.safeParse("ftp://tickets.example.com")
    expect(r.success).toBe(false)
  })
})

describe("signupOptionalWebsiteSchema", () => {
  it("matches create-account behavior for domain-only values", () => {
    const r = signupOptionalWebsiteSchema.safeParse("example.org")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe("https://example.org")
  })

  it("rejects javascript scheme", () => {
    const r = signupOptionalWebsiteSchema.safeParse("javascript:alert(1)")
    expect(r.success).toBe(false)
  })
})
