export type TimeItem = { time: string; endTime?: string }

export type DateItem = {
  date: string
  times: TimeItem[]
  // Location fields are dynamic based on locationConfig field names
  [key: string]: any
}

export type LocationConfig = {
  addressName: string
  venueName?: string
  placeIdName?: string
  latName?: string
  lngName?: string
  instructionsName?: string
}

export interface LocationConfigFull {
  addressName: string
  venueName?: string
  placeIdName?: string
  latName?: string
  lngName?: string
  instructionsName?: string
  label?: string
  note?: string
  instructionsLabel?: string
  instructionsPlaceholder?: string
  required?: boolean
}

