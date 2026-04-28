const fromMock = jest.fn()

jest.mock("@/lib/supabase/serverAnon", () => ({
  getSupabaseServerClientAnon: () => ({
    from: fromMock,
  }),
}))

import { searchListingsRepo } from "./read"

describe("searchListingsRepo", () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it("returns no results for one-letter queries without fetching listings", async () => {
    const results = await searchListingsRepo({ query: "w", limit: 20 })

    expect(results).toEqual([])
    expect(fromMock).not.toHaveBeenCalled()
  })
})
