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
