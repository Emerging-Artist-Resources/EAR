import { DateItem, LocationConfig } from "./types"

export function createLocationFields(
  locationConfig: LocationConfig | undefined,
  existingItem?: Partial<DateItem>,
  includeEmpty = false
): Partial<DateItem> {
  if (!locationConfig) return {}
  
  const fields: Partial<DateItem> = {}
  const fieldNames: Array<keyof LocationConfig> = [
    "addressName",
    "venueName",
    "placeIdName",
    "latName",
    "lngName",
    "instructionsName",
  ]
  
  for (const fieldName of fieldNames) {
    const configKey = locationConfig[fieldName]
    if (configKey) {
      const existingValue = existingItem?.[configKey as keyof typeof existingItem]
      if (existingValue !== undefined) {
        fields[configKey as keyof DateItem] = existingValue as any
      } else if (includeEmpty) {
        fields[configKey as keyof DateItem] = "" as any
      }
    }
  }
  
  return fields
}

