/** Reset scrollTop on scrollable ancestors (e.g. modal body) starting from `startEl`. */
export function resetScrollAncestors(startEl: HTMLElement | null) {
  let el: HTMLElement | null = startEl
  while (el && el !== document.body) {
    const { overflowY } = window.getComputedStyle(el)
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      el.scrollTop = 0
    }
    el = el.parentElement
  }
}

/**
 * Reset modal/wizard scroll and move focus to a top sentinel so date/time/Places
 * fields do not keep focus and scroll the body into view.
 */
export function resetModalFormView(
  scrollRoot: HTMLElement | null,
  focusTarget?: HTMLElement | null,
) {
  resetScrollAncestors(scrollRoot)
  focusTarget?.focus({ preventScroll: true })
}
