import { getContainRect, getCoverRect } from "./scaled-rect"

describe("getContainRect", () => {
  it("letterboxes a tall source into a wide destination", () => {
    const rect = getContainRect(100, 200, 400, 200)
    expect(rect.width).toBe(100)
    expect(rect.height).toBe(200)
    expect(rect.x).toBe(150)
    expect(rect.y).toBe(0)
  })

  it("pillarboxes a wide source into a tall destination", () => {
    const rect = getContainRect(200, 100, 200, 400)
    expect(rect.width).toBe(200)
    expect(rect.height).toBe(100)
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(150)
  })
})

describe("getCoverRect", () => {
  it("covers a wide destination with a tall source", () => {
    const rect = getCoverRect(100, 200, 400, 200)
    expect(rect.width).toBe(400)
    expect(rect.height).toBe(800)
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(-300)
  })
})
