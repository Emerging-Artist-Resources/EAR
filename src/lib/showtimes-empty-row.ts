import { createLocationFields, type DateItem, type LocationConfigFull } from "@/components/forms/blocks/DateTime"

export function buildEmptyShowtimeRow(options: {
  showTime?: boolean
  showEndTime?: boolean
  locationConfig?: LocationConfigFull
} = {}): DateItem {
  const { showTime = true, showEndTime = false, locationConfig } = options
  return {
    date: "",
    times: showTime
      ? showEndTime
        ? [{ time: "", endTime: "" }]
        : [{ time: "" }]
      : [],
    ...createLocationFields(locationConfig, undefined, true),
  } as DateItem
}
