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
  /** Form field for IN_PERSON | ONLINE; defaults to `locationMode`. */
  locationModeName?: string
}

export interface LocationConfigFull {
  addressName: string
  venueName?: string
  placeIdName?: string
  latName?: string
  lngName?: string
  instructionsName?: string
  locationModeName?: string
  label?: string
  note?: string
  instructionsLabel?: string
  instructionsPlaceholder?: string
  labelTooltip?: string
  required?: boolean
}

