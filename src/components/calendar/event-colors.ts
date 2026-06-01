import type { CalendarItem } from "@/hooks/use-calendar"

const CALENDAR_COLOR_BY_TYPE = {
  performance: {
    bg: "var(--ear-dark-red)",
    text: "var(--ear-off-white)",
    border: "var(--ear-dark-red)",
  },
  class: {
    bg: "var(--ear-orange)",
    text: "var(--ear-off-white)",
    border: "var(--ear-orange)",
  },
  audition: {
    bg: "var(--ear-dark-sage)",
    text: "var(--ear-off-white)",
    border: "var(--ear-dark-sage)",
  },
  creative: {
    bg: "var(--ear-dark-blue)",
    text: "var(--ear-off-white)",
    border: "var(--ear-dark-blue)",
  },
  default: {
    bg: "var(--surface-interactive)",
    text: "var(--text-primary)",
    border: "var(--border-default)",
  },
} as const

type EventTypeColors = {
  bg: string
  text: string
  border: string
}

function muteEventTypeColors(colors: EventTypeColors): EventTypeColors {
  return {
    bg: `color-mix(in srgb, ${colors.bg} 40%, var(--surface-panel))`,
    // Light label colors (e.g. off-white) wash out on muted backgrounds — use a darker type tint.
    text: `color-mix(in srgb, ${colors.border} 72%, var(--text-primary))`,
    border: `color-mix(in srgb, ${colors.border} 50%, var(--border-default))`,
  }
}

export const getEventTypeColor = (
  type: CalendarItem["type"],
  options?: { muted?: boolean },
) => {
  let colors: EventTypeColors
  switch (type) {
    case "performance":
      colors = CALENDAR_COLOR_BY_TYPE.performance
      break
    case "class":
      colors = CALENDAR_COLOR_BY_TYPE.class
      break
    case "audition":
      colors = CALENDAR_COLOR_BY_TYPE.audition
      break
    case "creative":
      colors = CALENDAR_COLOR_BY_TYPE.creative
      break
    default:
      colors = CALENDAR_COLOR_BY_TYPE.default
  }
  return options?.muted ? muteEventTypeColors(colors) : colors
}

export const getFilterTypeColor = (type: string) => {
  switch (type) {
    case "PERFORMANCE":
      return {
        accent: CALENDAR_COLOR_BY_TYPE.performance.border,
        bg: CALENDAR_COLOR_BY_TYPE.performance.bg,
        text: CALENDAR_COLOR_BY_TYPE.performance.text,
      }
    case "CLASS":
      return {
        accent: CALENDAR_COLOR_BY_TYPE.class.border,
        bg: CALENDAR_COLOR_BY_TYPE.class.bg,
        text: CALENDAR_COLOR_BY_TYPE.class.text,
      }
    case "AUDITION":
      return {
        accent: CALENDAR_COLOR_BY_TYPE.audition.border,
        bg: CALENDAR_COLOR_BY_TYPE.audition.bg,
        text: CALENDAR_COLOR_BY_TYPE.audition.text,
      }
    case "CREATIVE":
      return {
        accent: CALENDAR_COLOR_BY_TYPE.creative.border,
        bg: CALENDAR_COLOR_BY_TYPE.creative.bg,
        text: "var(--ear-off-white)",
        outlineText: "var(--ear-dark-blue)",
      }
    default:
      return {
        accent: CALENDAR_COLOR_BY_TYPE.default.border,
        bg: CALENDAR_COLOR_BY_TYPE.default.bg,
        text: CALENDAR_COLOR_BY_TYPE.default.text,
      }
  }
}
