"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useRef, useEffect } from "react"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
import type { LocationConfigFull } from "@/components/forms/blocks/DateTime/types"
import { Button } from "@/components/ui/button"
import { formatTime12Hour } from "@/lib/datetime-utils"
import {
  isEveryOrganizerOccurrenceRowComplete,
  isOrganizerOccurrenceRowComplete,
} from "@/lib/validations/events/occurrence-row"

const ORGANIZER_OCCURRENCE_LOCATION: LocationConfigFull = {
  addressName: "address",
  venueName: "venueName",
  placeIdName: "placeId",
  latName: "lat",
  lngName: "lng",
  instructionsName: "locationInstructions",
  label: "Location",
  required: true,
}

type DateTimeEntry = { 
  date: string
  times: Array<{ time: string }>
  // Location fields (optional, added when locationConfig is provided)
  address?: string
  venueName?: string
  placeId?: string
  lat?: number
  lng?: number
  locationInstructions?: string
}

function isValidEntry(entry: DateTimeEntry | undefined): boolean {
  return isOrganizerOccurrenceRowComplete(entry, { requireTime: true })
}

function filterValidEntries(entries: DateTimeEntry[]): DateTimeEntry[] {
  return entries.filter(isValidEntry)
}

// Use the utility function from datetime-utils

export function OrganizerDatesTimes({ form }: { form: UseFormReturn<EventFormData> }) {
  // Use useWatch for better reactivity with nested form values
  const extras = (useWatch({
    control: form.control,
    name: "occurrences" as Path<EventFormData>,
    defaultValue: [],
  }) as DateTimeEntry[] | undefined) ?? []
  const isConfirmed = useWatch({
    control: form.control,
    name: "eventDatesConfirmed" as Path<EventFormData>,
  }) as boolean | undefined
  const eventType = useWatch({
    control: form.control,
    name: "eventType" as Path<EventFormData>,
  }) as "SOLO" | "SPLIT_BILL" | "FESTIVAL" | undefined
  
  // For SOLO events, skip confirmation - dates will be saved on submit
  const isSolo = eventType === "SOLO"
  const needsConfirmation = !isSolo // Only SPLIT_BILL and FESTIVAL need confirmation
  
  // Store confirmed entries to preserve them even if form values change during editing
  const confirmedEntriesRef = useRef<DateTimeEntry[]>([])
  const prevConfirmedRef = useRef<boolean | undefined>(isConfirmed)
  // Key to force schedule editor remount when entering edit mode with correct defaults
  const editKeyRef = useRef(0)
  
  // When switching from confirmed to editing, restore the confirmed values to the form
  // This ensures values are restored even if handleEdit timing is off
  useEffect(() => {
    if (prevConfirmedRef.current === true && isConfirmed === false && confirmedEntriesRef.current.length > 0) {
      console.log("[OrganizerDatesTimes] useEffect - switching from confirmed to editing")
      console.log("[OrganizerDatesTimes] useEffect - confirmedEntriesRef.current:", JSON.stringify(confirmedEntriesRef.current, null, 2))
      
      const currentExtras = (form.getValues("occurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined) ?? []
      console.log("[OrganizerDatesTimes] useEffect - currentExtras:", JSON.stringify(currentExtras, null, 2))
      
      const validCurrentEntries = filterValidEntries(currentExtras)
      
      // Check if location fields are missing (compare first entry if both exist)
      const hasLocationInConfirmed = confirmedEntriesRef.current.length > 0 && 
                                      (confirmedEntriesRef.current[0].address || 
                                       confirmedEntriesRef.current[0].venueName ||
                                       confirmedEntriesRef.current[0].placeId)
      const missingLocation = validCurrentEntries.length > 0 && 
                              hasLocationInConfirmed &&
                              !validCurrentEntries[0].address && 
                              !validCurrentEntries[0].venueName &&
                              !validCurrentEntries[0].placeId
      
      // Restore values if form is empty, invalid, or missing location data
      const needsRestore = validCurrentEntries.length === 0 || 
                          currentExtras.length !== confirmedEntriesRef.current.length ||
                          missingLocation
      
      console.log("[OrganizerDatesTimes] useEffect - needsRestore:", needsRestore, {
        validCurrentEntriesLength: validCurrentEntries.length,
        currentExtrasLength: currentExtras.length,
        confirmedLength: confirmedEntriesRef.current.length,
        hasLocationInConfirmed,
        missingLocation,
      })
      
      if (needsRestore) {
        // Deep copy to ensure all fields including location are preserved
        const entriesToRestore = JSON.parse(JSON.stringify(confirmedEntriesRef.current))
        console.log("[OrganizerDatesTimes] useEffect - entriesToRestore:", JSON.stringify(entriesToRestore, null, 2))
        
        // Use setTimeout to ensure this runs after any component remounts
        setTimeout(() => {
          const beforeSet = form.getValues("occurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined
          console.log("[OrganizerDatesTimes] useEffect - form values BEFORE setValue (10ms):", JSON.stringify(beforeSet, null, 2))
          
          form.setValue("occurrences" as Path<EventFormData>, entriesToRestore as unknown as never, {
            shouldDirty: true,
            shouldTouch: false,
            shouldValidate: false,
          })
          
          const afterSet = form.getValues("occurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined
          console.log("[OrganizerDatesTimes] useEffect - form values AFTER setValue (10ms):", JSON.stringify(afterSet, null, 2))
          
          // Explicitly set location fields on ALL entries to preserve different locations per occurrence
          entriesToRestore.forEach((entry: DateTimeEntry, index: number) => {
            if (entry.address) {
              form.setValue(`occurrences.${index}.address` as Path<EventFormData>, entry.address as unknown as never, {
                shouldDirty: true,
                shouldTouch: false,
              })
            }
            if (entry.venueName) {
              form.setValue(`occurrences.${index}.venueName` as Path<EventFormData>, entry.venueName as unknown as never, {
                shouldDirty: true,
                shouldTouch: false,
              })
            }
            if (entry.placeId) {
              form.setValue(`occurrences.${index}.placeId` as Path<EventFormData>, entry.placeId as unknown as never, {
                shouldDirty: true,
                shouldTouch: false,
              })
            }
            if (entry.lat !== undefined) {
              form.setValue(`occurrences.${index}.lat` as Path<EventFormData>, entry.lat as unknown as never, {
                shouldDirty: true,
                shouldTouch: false,
              })
            }
            if (entry.lng !== undefined) {
              form.setValue(`occurrences.${index}.lng` as Path<EventFormData>, entry.lng as unknown as never, {
                shouldDirty: true,
                shouldTouch: false,
              })
            }
            if (entry.locationInstructions) {
              form.setValue(`occurrences.${index}.locationInstructions` as Path<EventFormData>, entry.locationInstructions as unknown as never, {
                shouldDirty: true,
                shouldTouch: false,
              })
            }
          })
          
          console.log("[OrganizerDatesTimes] useEffect - restored location fields for all entries:", entriesToRestore.map((e: DateTimeEntry, i: number) => ({
            index: i,
            address: e.address,
            venueName: e.venueName,
          })))
          
          const afterLocationSet = form.getValues("occurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined
          console.log("[OrganizerDatesTimes] useEffect - form values AFTER setting location fields:", JSON.stringify(afterLocationSet, null, 2))
        }, 10)
      }
    }
    prevConfirmedRef.current = isConfirmed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed])
  
  const hasCompleteEntries = useMemo(() => {
    return isEveryOrganizerOccurrenceRowComplete(extras, true)
  }, [extras])

  const confirmedEntries = useMemo(() => {
    if (isConfirmed && confirmedEntriesRef.current.length > 0) {
      return confirmedEntriesRef.current
    }
    return filterValidEntries(extras)
  }, [extras, isConfirmed])

  const handleConfirm = () => {
    if (hasCompleteEntries) {
      const currentExtras = (form.getValues("occurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined) ?? []
      console.log("[OrganizerDatesTimes] handleConfirm - currentExtras:", JSON.stringify(currentExtras, null, 2))
      
      const valid = filterValidEntries(currentExtras)
      console.log("[OrganizerDatesTimes] handleConfirm - valid entries:", JSON.stringify(valid, null, 2))
      
      // Deep copy to preserve all fields including location fields
      confirmedEntriesRef.current = JSON.parse(JSON.stringify(valid))
      console.log("[OrganizerDatesTimes] handleConfirm - saved to confirmedEntriesRef:", JSON.stringify(confirmedEntriesRef.current, null, 2))
      
      // Ensure we're saving the complete entries with all location fields
      form.setValue("occurrences" as Path<EventFormData>, confirmedEntriesRef.current as unknown as never, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      })
      
      // Verify what was actually set
      const afterSet = form.getValues("occurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined
      console.log("[OrganizerDatesTimes] handleConfirm - after setValue:", JSON.stringify(afterSet, null, 2))
      
      form.setValue("eventDatesConfirmed" as Path<EventFormData>, true as unknown as never, {
        shouldDirty: true,
      })
    }
  }

  const handleEdit = () => {
    if (confirmedEntriesRef.current.length === 0) return

    // Deep copy to ensure all fields including location are preserved
    const entriesToRestore = JSON.parse(JSON.stringify(confirmedEntriesRef.current))
    
    // Set eventDatesConfirmed to false first
    form.setValue("eventDatesConfirmed" as Path<EventFormData>, false as unknown as never, {
      shouldDirty: true,
    })
    
    // Set occurrences BEFORE incrementing key, so the values are in place when the editor remounts
    // This is critical - the values must be set before the component remounts
    form.setValue("occurrences" as Path<EventFormData>, entriesToRestore as unknown as never, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    })
    
    // Increment key to force remount of the schedule editor with the restored values
    editKeyRef.current += 1
    
    // Use multiple timeouts to ensure values persist through the remount cycle
    // After remount, explicitly set location fields on ALL entries to preserve different locations
    // This ensures each entry keeps its own location when restoring from the confirmed state
    setTimeout(() => {
      entriesToRestore.forEach((entry: DateTimeEntry, index: number) => {
        console.log(`[OrganizerDatesTimes] handleEdit - restoring location for entry ${index}:`, {
          address: entry.address,
          venueName: entry.venueName,
        })
        
        if (entry.address) {
          form.setValue(`occurrences.${index}.address` as Path<EventFormData>, entry.address as unknown as never, {
            shouldDirty: true,
            shouldTouch: false,
          })
        }
        if (entry.venueName) {
          form.setValue(`occurrences.${index}.venueName` as Path<EventFormData>, entry.venueName as unknown as never, {
            shouldDirty: true,
            shouldTouch: false,
          })
        }
        if (entry.placeId) {
          form.setValue(`occurrences.${index}.placeId` as Path<EventFormData>, entry.placeId as unknown as never, {
            shouldDirty: true,
            shouldTouch: false,
          })
        }
        if (entry.lat !== undefined) {
          form.setValue(`occurrences.${index}.lat` as Path<EventFormData>, entry.lat as unknown as never, {
            shouldDirty: true,
            shouldTouch: false,
          })
        }
        if (entry.lng !== undefined) {
          form.setValue(`occurrences.${index}.lng` as Path<EventFormData>, entry.lng as unknown as never, {
            shouldDirty: true,
            shouldTouch: false,
          })
        }
        if (entry.locationInstructions) {
          form.setValue(`occurrences.${index}.locationInstructions` as Path<EventFormData>, entry.locationInstructions as unknown as never, {
            shouldDirty: true,
            shouldTouch: false,
          })
        }
      })
      
      const afterLocationSet = form.getValues("occurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined
      console.log("[OrganizerDatesTimes] handleEdit - form values AFTER setting all location fields:", JSON.stringify(afterLocationSet, null, 2))
    }, 50)
  }

  const confirmActionLabel = "Confirm showtimes"
  const confirmedHeadline = "Showtimes confirmed"
  const emptyConfirmedLabel = "No showtimes confirmed"
  const editActionLabel = "Edit showtimes"

  const scheduleEditor = (
    <ShowtimesList<EventFormData>
      form={form}
      name="occurrences"
      title=""
      note=""
      required
      locationConfig={ORGANIZER_OCCURRENCE_LOCATION}
    />
  )

  return (
    <div>
      <Section title="Performance times">
      {!needsConfirmation ? (
        // SOLO: show schedule editor directly (no confirmation)
        scheduleEditor
      ) : (
        // SPLIT_BILL and FESTIVAL: confirmation flow
        <>
          {!isConfirmed ? (
            <>
              <div key={`edit-${editKeyRef.current}`}>{scheduleEditor}</div>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!hasCompleteEntries}
              >
                {confirmActionLabel}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">{confirmedHeadline}</p>
                {confirmedEntries.length > 0 ? (
                  <ul className="space-y-1 text-sm text-gray-600">
                    {confirmedEntries.map((ex, idx) => {
                      const validTimes = ex.times?.filter(t => t?.time && t.time.trim() !== "").map(t => formatTime12Hour(t.time)) || []
                      const venueName = ex.venueName || ex.address || ""
                      const timesDisplay = validTimes.join(", ")
                      const locationDisplay = venueName ? ` · ${venueName}` : ""
                      return (
                        <li key={idx}>
                          {ex.date} · {timesDisplay}{locationDisplay}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">{emptyConfirmedLabel}</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="mt-3"
                >
                  {editActionLabel}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      </Section>
    </div>
  )
}
