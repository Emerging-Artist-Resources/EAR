/** Shared vertical rhythm — maps to standard Tailwind utilities. */
export const stack = {
  xs: "space-y-1",
  sm: "space-y-2",
  md: "space-y-4",
  lg: "space-y-6",
  xl: "space-y-8",
  "2xl": "space-y-10",
} as const

/** Tighter rhythm for dense forms (modals, wizards). */
export const form = {
  /** Between sections within a step. */
  step: "space-y-6",
  /** Section title block to field group. */
  section: "space-y-2",
  /** Between fields inside a section. */
  fields: "space-y-3",
} as const

export const page = {
  container: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
} as const

/** Inline text actions in forms (e.g. "Back to search", "+ Add another time"). */
export const formInlineLink =
  "font-sans text-body-sm leading-body underline text-primary hover:text-primary/80" as const
