import type { UseFormReturn } from "react-hook-form"
import type { EventFormData } from "@/lib/validations/events"

/** Manual-parent fields cleared when returning to EAR search so they never persist alongside a linked parent. */
const MANUAL_PARENT_FIELDS = [
  "parentEventName",
  "organizer",
  "parentEventWebsite",
  "parentEventContactEmail",
  "link",
  "price",
] as const

/**
 * Clears parent-derived schedule selection.
 * Call when the EAR parent changes, is cleared, or the user switches to MANUAL —
 * otherwise stale selectedSlots can submit as location-less dates.
 */
export function clearPieceParentDependentSchedule(
  form: Pick<UseFormReturn<EventFormData>, "setValue" | "clearErrors">,
): void {
  form.setValue("selectedSlots", [] as never, { shouldDirty: true, shouldValidate: false })
  form.clearErrors("selectedSlots")
}

/** Clears MANUAL parent + ticket fields when returning to EAR parent search (avoids stale hidden values). */
export function resetPieceParentToSearch(
  form: Pick<UseFormReturn<EventFormData>, "setValue" | "clearErrors">,
): void {
  form.setValue("parentEventMode", "SELECT" as never, { shouldDirty: true, shouldValidate: false })
  for (const field of MANUAL_PARENT_FIELDS) {
    form.setValue(field as never, "" as never, { shouldDirty: true, shouldValidate: false })
  }
  form.clearErrors([...MANUAL_PARENT_FIELDS])
  clearPieceParentDependentSchedule(form)
}
