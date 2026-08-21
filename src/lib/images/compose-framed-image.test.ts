import { getMediaDestRectInCropArea } from "./compose-framed-image"

describe("getMediaDestRectInCropArea", () => {
  it("places zoom=1 media relative to the crop frame (may overflow the frame)", () => {
    // Portrait media sized to a tall container, with a shorter wide crop frame —
    // matching react-easy-crop contain-in-container behavior.
    const rect = getMediaDestRectInCropArea({
      mediaWidth: 120,
      mediaHeight: 320,
      cropWidth: 400,
      cropHeight: 160,
      zoom: 1,
      cropX: 0,
      cropY: 0,
    })

    expect(rect.width).toBe(120)
    expect(rect.height).toBe(320)
    expect(rect.x).toBe(140)
    expect(rect.y).toBe(-80)
  })

  it("scales around the crop center when zoomed out", () => {
    const rect = getMediaDestRectInCropArea({
      mediaWidth: 120,
      mediaHeight: 320,
      cropWidth: 400,
      cropHeight: 160,
      zoom: 0.5,
      cropX: 0,
      cropY: 0,
    })

    expect(rect.width).toBe(60)
    expect(rect.height).toBe(160)
    expect(rect.x).toBe(170)
    expect(rect.y).toBe(0)
  })

  it("applies pan offset from the crop center", () => {
    const rect = getMediaDestRectInCropArea({
      mediaWidth: 100,
      mediaHeight: 100,
      cropWidth: 200,
      cropHeight: 200,
      zoom: 1,
      cropX: 40,
      cropY: -10,
    })

    expect(rect.x).toBe(90)
    expect(rect.y).toBe(40)
  })
})
