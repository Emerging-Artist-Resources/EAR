import {
  buildListingPhotoSubmitPlan,
  getListingPhotoRemainingSlots,
  removeListingPhotoAt,
  seedListingPhotoDraftFromExisting,
  setListingPhotoAsCover,
  takeFilesForRemainingSlots,
  type ListingPhotoDraftItem,
} from "./listing-photo-draft"

function existing(path: string): ListingPhotoDraftItem {
  return { key: `existing:${path}`, kind: "existing", path }
}

function draftNew(name: string, draftKey = name): ListingPhotoDraftItem {
  return {
    key: `new:${draftKey}`,
    kind: "new",
    file: new File([name], name, { type: "image/jpeg" }),
    previewUrl: `blob:${draftKey}`,
  }
}

describe("setListingPhotoAsCover", () => {
  it("moves the chosen index to 0 and preserves relative order of the rest", () => {
    const items = [existing("a"), existing("b"), existing("c")]
    expect(setListingPhotoAsCover(items, 1).map((i) => (i.kind === "existing" ? i.path : i.key))).toEqual([
      "b",
      "a",
      "c",
    ])
  })

  it("no-ops when index is already 0", () => {
    const items = [existing("a"), existing("b")]
    const next = setListingPhotoAsCover(items, 0)
    expect(next).toEqual(items)
    expect(next).not.toBe(items)
  })

  it("no-ops for out-of-range indexes", () => {
    const items = [existing("a"), existing("b")]
    expect(setListingPhotoAsCover(items, -1)).toEqual(items)
    expect(setListingPhotoAsCover(items, 99)).toEqual(items)
  })

  it("preserves order when set cover runs after a removal", () => {
    const afterRemove = removeListingPhotoAt(
      [existing("a"), existing("b"), existing("c")],
      0
    )
    expect(afterRemove.map((i) => (i.kind === "existing" ? i.path : ""))).toEqual(["b", "c"])
    expect(
      setListingPhotoAsCover(afterRemove, 1).map((i) => (i.kind === "existing" ? i.path : ""))
    ).toEqual(["c", "b"])
  })
})

describe("removeListingPhotoAt", () => {
  it("drops the item at index", () => {
    expect(
      removeListingPhotoAt([existing("a"), existing("b"), existing("c")], 1).map((i) =>
        i.kind === "existing" ? i.path : ""
      )
    ).toEqual(["a", "c"])
  })

  it("allows an empty list", () => {
    expect(removeListingPhotoAt([existing("a")], 0)).toEqual([])
  })

  it("no-ops for out-of-range indexes", () => {
    const items = [existing("a")]
    expect(removeListingPhotoAt(items, -1)).toEqual(items)
    expect(removeListingPhotoAt(items, 3)).toEqual(items)
  })
})

describe("getListingPhotoRemainingSlots", () => {
  it("returns remaining capacity", () => {
    expect(getListingPhotoRemainingSlots([], 5)).toBe(5)
    expect(getListingPhotoRemainingSlots([existing("a"), existing("b")], 5)).toBe(3)
    expect(
      getListingPhotoRemainingSlots(
        [existing("a"), existing("b"), existing("c"), existing("d"), existing("e")],
        5
      )
    ).toBe(0)
  })
})

describe("takeFilesForRemainingSlots", () => {
  it("takes only the first N files before compression would run", () => {
    const files = [
      new File(["1"], "1.jpg"),
      new File(["2"], "2.jpg"),
      new File(["3"], "3.jpg"),
    ]
    expect(takeFilesForRemainingSlots(files, 1).map((f) => f.name)).toEqual(["1.jpg"])
    expect(takeFilesForRemainingSlots(files, 0)).toEqual([])
    expect(takeFilesForRemainingSlots(files, 5).map((f) => f.name)).toEqual([
      "1.jpg",
      "2.jpg",
      "3.jpg",
    ])
  })
})

describe("seedListingPhotoDraftFromExisting", () => {
  it("preserves input order and uses existing keys", () => {
    expect(seedListingPhotoDraftFromExisting([{ path: "b.jpg" }, { path: "a.jpg" }])).toEqual([
      { key: "existing:b.jpg", kind: "existing", path: "b.jpg" },
      { key: "existing:a.jpg", kind: "existing", path: "a.jpg" },
    ])
  })
})

describe("buildListingPhotoSubmitPlan", () => {
  it("keeps draft order with draftIndex on new items; removed paths stay absent", () => {
    const draft: ListingPhotoDraftItem[] = [
      existing("b.jpg"),
      existing("c.jpg"),
      draftNew("d.jpg", "d"),
    ]
    const plan = buildListingPhotoSubmitPlan(draft)

    expect(plan.existingPaths).toEqual(["b.jpg", "c.jpg"])
    expect(plan.orderedItems).toHaveLength(3)
    expect(plan.orderedItems[0]).toEqual({ kind: "existing", path: "b.jpg" })
    expect(plan.orderedItems[1]).toEqual({ kind: "existing", path: "c.jpg" })
    expect(plan.orderedItems[2]).toMatchObject({ kind: "new", draftIndex: 2 })
    expect(plan).not.toHaveProperty("newFiles")
  })

  it("returns empty plan for empty draft", () => {
    expect(buildListingPhotoSubmitPlan([])).toEqual({
      orderedItems: [],
      existingPaths: [],
    })
  })
})
