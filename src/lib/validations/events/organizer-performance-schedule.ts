import type { RefinementCtx } from "zod"
import { pieceFieldPrefix } from "@/lib/organizer-program-pieces"
import {
  buildOrganizerOccurrenceSlotKeySet,
  indexOfOrganizerRowsMissingLocation,
  isEveryOrganizerOccurrenceRowComplete,
  type OccurrenceLike,
  ORGANIZER_OCCURRENCE_USER_MESSAGES,
} from "./occurrence-row"

/** Prefer `occurrences`; fall back to legacy `extraOccurrences` when the former has no dated rows. */
export function resolveOrganizerOccurrencesForValidation(
  occurrences: OccurrenceLike[] | undefined,
  extraOccurrences: OccurrenceLike[] | undefined,
): OccurrenceLike[] | undefined {
  const hasValid = (arr: OccurrenceLike[] | undefined) =>
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.some(
      (d) =>
        d?.date &&
        d.date.trim() !== "" &&
        Array.isArray(d?.times) &&
        d.times.length > 0 &&
        d.times.some((t) => t?.time && t.time.trim() !== ""),
    )
  if (hasValid(occurrences)) return occurrences
  if (hasValid(extraOccurrences)) return extraOccurrences
  return undefined
}

/**
 * Organizer listing date/time/location + SPLIT/FESTIVAL confirmation gate.
 * Reuses occurrence-row helpers so UI (OrganizerDatesTimes) and Zod stay aligned.
 */
export function addOrganizerListingScheduleIssues(
  ctx: RefinementCtx,
  params: {
    occurrences: OccurrenceLike[] | undefined
    eventType: "SOLO" | "SPLIT_BILL" | "FESTIVAL" | undefined
    eventDatesConfirmed: boolean | undefined
  },
): void {
  const { occurrences: occs, eventType, eventDatesConfirmed } = params
  const needsConfirmation = eventType === "SPLIT_BILL" || eventType === "FESTIVAL"

  if (!Array.isArray(occs) || occs.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["occurrences"],
      message: ORGANIZER_OCCURRENCE_USER_MESSAGES.needSchedule,
    })
    return
  }

  const requireTime = true
  const missingLocationIndexes = indexOfOrganizerRowsMissingLocation(occs, requireTime)
  for (const index of missingLocationIndexes) {
    ctx.addIssue({
      code: "custom",
      path: ["occurrences", index, "address"],
      message: ORGANIZER_OCCURRENCE_USER_MESSAGES.locationOnSubmit,
    })
  }

  if (!isEveryOrganizerOccurrenceRowComplete(occs, requireTime)) {
    if (missingLocationIndexes.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrences"],
        message: ORGANIZER_OCCURRENCE_USER_MESSAGES.needSchedule,
      })
    }
    return
  }

  if (needsConfirmation && eventDatesConfirmed !== true) {
    ctx.addIssue({
      code: "custom",
      path: ["eventDatesConfirmed"],
      message: ORGANIZER_OCCURRENCE_USER_MESSAGES.confirmSchedule,
    })
  }
}

function pieceSlotsFieldPath(i: number, p: string): string {
  return i === 0 ? "piece_selectedSlots" : `${p}_selectedSlots`
}

function pieceExtrasFieldPath(i: number, p: string): string {
  return i === 0 ? "piece_extraOccurrences" : `${p}_extraOccurrences`
}

export function isOrganizerListingReadyForPieceSlotValidation(
  organizerOccurrences: OccurrenceLike[] | undefined,
  eventType: "SOLO" | "SPLIT_BILL" | "FESTIVAL" | undefined,
  eventDatesConfirmed: boolean | undefined,
): boolean {
  if (!Array.isArray(organizerOccurrences) || organizerOccurrences.length === 0) return false
  if (!isEveryOrganizerOccurrenceRowComplete(organizerOccurrences, true)) return false
  if (eventType === "SPLIT_BILL" || eventType === "FESTIVAL") {
    return eventDatesConfirmed === true
  }
  return true
}

/**
 * After `organizerPieceHasSchedule`: enforce slots ⊆ organizer showtimes and complete custom piece rows.
 */
export function addOrganizerMultiProgramPieceSlotAndCustomIssues(
  ctx: RefinementCtx,
  params: {
    raw: Record<string, unknown>
    pieceCount: number
    organizerOccurrences: OccurrenceLike[] | undefined
    eventDatesConfirmed: boolean | undefined
    eventType: "SOLO" | "SPLIT_BILL" | "FESTIVAL" | undefined
  },
): void {
  const { raw, pieceCount, organizerOccurrences, eventDatesConfirmed, eventType } = params
  const needsConfirmation = eventType === "SPLIT_BILL" || eventType === "FESTIVAL"

  for (let i = 0; i < pieceCount; i++) {
    const p = pieceFieldPrefix(i)
    const slotsField = pieceSlotsFieldPath(i, p)
    const extrasField = pieceExtrasFieldPath(i, p)

    const slots = raw[`${p}_selectedSlots`]
    const extras = raw[`${p}_extraOccurrences`]

    const hasSlots =
      Array.isArray(slots) && slots.some((s) => typeof s === "string" && (s as string).trim() !== "")

    if (hasSlots) {
      if (needsConfirmation && eventDatesConfirmed !== true) {
        ctx.addIssue({
          code: "custom",
          path: [slotsField],
          message: ORGANIZER_OCCURRENCE_USER_MESSAGES.confirmBeforePieceSlots,
        })
      } else if (
        isOrganizerListingReadyForPieceSlotValidation(
          organizerOccurrences,
          eventType,
          eventDatesConfirmed,
        )
      ) {
        const allowedKeys = buildOrganizerOccurrenceSlotKeySet(organizerOccurrences)
        let invalid = false
        for (const s of slots as unknown[]) {
          if (typeof s !== "string") continue
          const key = s.trim()
          if (!key) continue
          if (!allowedKeys.has(key)) {
            invalid = true
            break
          }
        }
        if (invalid || allowedKeys.size === 0) {
          ctx.addIssue({
            code: "custom",
            path: [slotsField],
            message: ORGANIZER_OCCURRENCE_USER_MESSAGES.pieceSlotsMustMatch,
          })
        }
      }
    }

    if (Array.isArray(extras) && extras.length > 0) {
      if (!isEveryOrganizerOccurrenceRowComplete(extras as OccurrenceLike[], true)) {
        ctx.addIssue({
          code: "custom",
          path: [extrasField],
          message: ORGANIZER_OCCURRENCE_USER_MESSAGES.pieceCustomScheduleIncomplete,
        })
      }
    }
  }
}
