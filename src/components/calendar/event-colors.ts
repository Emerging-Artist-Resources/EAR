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
    bg: "var(--ear-baby-blue)",
    text: "var(--ear-black)",
    border: "var(--ear-baby-blue)",
  },
  default: {
    bg: "var(--surface-interactive)",
    text: "var(--text-primary)",
    border: "var(--border-default)",
  },
} as const

export const getEventTypeColor = (type: CalendarItem["type"]) => {
  switch (type) {
    case "performance":
      return CALENDAR_COLOR_BY_TYPE.performance
    case "class":
      return CALENDAR_COLOR_BY_TYPE.class
    case "audition":
      return CALENDAR_COLOR_BY_TYPE.audition
    case "creative":
      return CALENDAR_COLOR_BY_TYPE.creative
    default:
      return CALENDAR_COLOR_BY_TYPE.default
  }
}

export const getFilterTypeColor = (type: string) => {
  switch (type) {
    case "PERFORMANCE":
      return {
        bg: CALENDAR_COLOR_BY_TYPE.performance.bg,
        text: CALENDAR_COLOR_BY_TYPE.performance.text,
      }
    case "CLASS":
      return {
        bg: CALENDAR_COLOR_BY_TYPE.class.bg,
        text: CALENDAR_COLOR_BY_TYPE.class.text,
      }
    case "AUDITION":
      return {
        bg: CALENDAR_COLOR_BY_TYPE.audition.bg,
        text: CALENDAR_COLOR_BY_TYPE.audition.text,
      }
    case "CREATIVE":
      return {
        bg: CALENDAR_COLOR_BY_TYPE.creative.bg,
        text: CALENDAR_COLOR_BY_TYPE.creative.text,
      }
    default:
      return {
        bg: CALENDAR_COLOR_BY_TYPE.default.bg,
        text: CALENDAR_COLOR_BY_TYPE.default.text,
      }
  }
}
