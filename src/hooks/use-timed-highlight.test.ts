import { renderHook, act } from "@testing-library/react"
import { TIMED_HIGHLIGHT_MS, useTimedHighlight } from "./use-timed-highlight"

describe("useTimedHighlight", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("highlights a present target then clears after the listings duration", () => {
    document.body.innerHTML = `<div id="announcement-b"></div>`

    const { result } = renderHook(() =>
      useTimedHighlight("b", {
        ready: true,
        isPresent: true,
        elementId: "announcement-b",
      })
    )

    expect(result.current).toBe("b")
    expect(document.getElementById("announcement-b")?.scrollIntoView).toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(TIMED_HIGHLIGHT_MS)
    })

    expect(result.current).toBeNull()
  })

  it("does not highlight when the target is missing", () => {
    const { result } = renderHook(() =>
      useTimedHighlight("b", {
        ready: true,
        isPresent: false,
        elementId: "announcement-b",
      })
    )

    expect(result.current).toBeNull()
  })
})
