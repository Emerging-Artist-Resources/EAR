import {
  isHeicLikeImageFile,
  isSupportedWebImageFile,
} from "./supported-web-image"

describe("isHeicLikeImageFile", () => {
  it("detects HEIC by MIME type and extension", () => {
    expect(
      isHeicLikeImageFile(new File([""], "photo.heic", { type: "image/heic" })),
    ).toBe(true)
    expect(
      isHeicLikeImageFile(new File([""], "photo.HEIF", { type: "" })),
    ).toBe(true)
  })

  it("does not flag JPEG/PNG/WebP", () => {
    expect(
      isHeicLikeImageFile(new File([""], "photo.jpg", { type: "image/jpeg" })),
    ).toBe(false)
  })
})

describe("isSupportedWebImageFile", () => {
  it("accepts JPEG, PNG, and WebP", () => {
    expect(
      isSupportedWebImageFile(new File([""], "a.jpg", { type: "image/jpeg" })),
    ).toBe(true)
    expect(
      isSupportedWebImageFile(new File([""], "a.png", { type: "image/png" })),
    ).toBe(true)
    expect(
      isSupportedWebImageFile(new File([""], "a.webp", { type: "image/webp" })),
    ).toBe(true)
  })

  it("accepts supported extensions when MIME is missing", () => {
    expect(isSupportedWebImageFile(new File([""], "a.jpeg", { type: "" }))).toBe(true)
  })

  it("rejects HEIC and other formats", () => {
    expect(
      isSupportedWebImageFile(new File([""], "a.heic", { type: "image/heic" })),
    ).toBe(false)
    expect(
      isSupportedWebImageFile(new File([""], "a.gif", { type: "image/gif" })),
    ).toBe(false)
  })
})
