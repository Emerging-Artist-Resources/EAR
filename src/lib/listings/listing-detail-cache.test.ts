import { LISTING_DETAIL_CACHE_CONTROL } from "./listing-detail-cache"

describe("LISTING_DETAIL_CACHE_CONTROL", () => {
  it("blocks shared caches from storing listing detail responses", () => {
    expect(LISTING_DETAIL_CACHE_CONTROL).toBe("private, no-store")
  })
})
