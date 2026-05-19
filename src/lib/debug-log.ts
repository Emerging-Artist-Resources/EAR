/**
 * Verbose schedule-debug logging — off in production unless DEBUG_SCHEDULE=true.
 */
export function debugScheduleLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production" || process.env.DEBUG_SCHEDULE === "true") {
    console.log(...args)
  }
}
