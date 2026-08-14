import {
  getExistingImageBucketOrder,
  PRIVATE_EVENT_PHOTOS_BUCKET,
  PUBLIC_EVENT_PHOTOS_BUCKET,
  toListingStatus,
  transitionExistingImageOnError,
  uniqueExistingImagePaths,
} from "./existing-image-resolution"

describe("getExistingImageBucketOrder", () => {
  it("chooses public first for approved listings", () => {
    expect(getExistingImageBucketOrder("approved")).toEqual({
      primary: PUBLIC_EVENT_PHOTOS_BUCKET,
      fallback: PRIVATE_EVENT_PHOTOS_BUCKET,
    })
  })

  it("chooses private first for pending listings", () => {
    expect(getExistingImageBucketOrder("pending")).toEqual({
      primary: PRIVATE_EVENT_PHOTOS_BUCKET,
      fallback: PUBLIC_EVENT_PHOTOS_BUCKET,
    })
  })

  it("chooses private first when status is omitted", () => {
    expect(getExistingImageBucketOrder(null)).toEqual({
      primary: PRIVATE_EVENT_PHOTOS_BUCKET,
      fallback: PUBLIC_EVENT_PHOTOS_BUCKET,
    })
    expect(getExistingImageBucketOrder()).toEqual({
      primary: PRIVATE_EVENT_PHOTOS_BUCKET,
      fallback: PUBLIC_EVENT_PHOTOS_BUCKET,
    })
  })
})

describe("transitionExistingImageOnError", () => {
  it("resolves fallback on the first error", () => {
    expect(transitionExistingImageOnError({ fallbackAttempted: false, hidden: false })).toEqual({
      type: "resolve_fallback",
    })
  })

  it("hides on the second error without retrying", () => {
    expect(transitionExistingImageOnError({ fallbackAttempted: true, hidden: false })).toEqual({
      type: "hide",
    })
  })
})

describe("uniqueExistingImagePaths", () => {
  it("dedupes and caps at 5", () => {
    expect(uniqueExistingImagePaths(["a", "a", "b", "", "c", "d", "e", "f"])).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ])
  })
})

describe("toListingStatus", () => {
  it("narrows known statuses and drops others", () => {
    expect(toListingStatus("approved")).toBe("approved")
    expect(toListingStatus("pending_payment")).toBeNull()
    expect(toListingStatus(null)).toBeNull()
  })
})
