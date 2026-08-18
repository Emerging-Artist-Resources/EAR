import { getReusedExistingPhotoPaths } from "./reused-photo-paths"

describe("getReusedExistingPhotoPaths", () => {
  it("excludes newly uploaded paths and removed paths", () => {
    expect(
      getReusedExistingPhotoPaths(
        ["keep.jpg", "removed.jpg"],
        [{ path: "keep.jpg" }, { path: "new.jpg" }]
      )
    ).toEqual(["keep.jpg"])
  })

  it("dedupes duplicate submitted paths", () => {
    expect(
      getReusedExistingPhotoPaths(
        ["a.jpg"],
        [{ path: "a.jpg" }, { path: "a.jpg" }]
      )
    ).toEqual(["a.jpg"])
  })

  it("treats credit-only changes as reused", () => {
    expect(
      getReusedExistingPhotoPaths(["a.jpg"], [{ path: "a.jpg", credit: "New credit" }])
    ).toEqual(["a.jpg"])
  })

  it("returns empty when nothing is submitted", () => {
    expect(getReusedExistingPhotoPaths(["a.jpg"])).toEqual([])
    expect(getReusedExistingPhotoPaths(["a.jpg"], [])).toEqual([])
  })
})
