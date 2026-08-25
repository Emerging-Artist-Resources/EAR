/**
 * Tracks in-flight request generations so only the latest response may apply.
 * Prefer this over AbortController when the goal is "stale results must never win"
 * rather than canceling network work.
 */
export function createRequestGenerationGate() {
  let latestGeneration = 0

  return {
    /** Start a new request; returns its generation number. */
    begin(): number {
      latestGeneration += 1
      return latestGeneration
    },

    /** True when this generation is still the most recent begin(). */
    isCurrent(generation: number): boolean {
      return generation === latestGeneration
    },
  }
}

export type RequestGenerationGate = ReturnType<typeof createRequestGenerationGate>
