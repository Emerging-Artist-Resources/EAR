/** Shared vertical rhythm — maps to standard Tailwind utilities. */
export const stack = {
  xs: "space-y-1",
  sm: "space-y-2",
  md: "space-y-4",
  lg: "space-y-6",
  xl: "space-y-8",
  "2xl": "space-y-10",
} as const

export const page = {
  container: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
} as const
