import type { CalendarItem } from "@/hooks/use-calendar"

export const getEventTypeColor = (type: CalendarItem["type"]) => {
  switch (type) {
    case "performance":
      return { bg: "#0a9468", text: "#ffffff", border: "#087a5a" }
    case "class":
      return { bg: "#007a91", text: "#ffffff", border: "#006275" }
    case "audition":
      return { bg: "#a68200", text: "#ffffff", border: "#856900" }
    case "creative":
      return { bg: "#ff9a9a", text: "#ffffff", border: "#ff8a8a" }
    default:
      return { bg: "#e5e7eb", text: "#374151", border: "#d1d5db" }
  }
}

export const getFilterTypeColor = (type: string) => {
  switch (type) {
    case "PERFORMANCE":
      return { bg: "#0a9468", text: "#ffffff" }
    case "CLASS":
      return { bg: "#007a91", text: "#ffffff" }
    case "AUDITION":
      return { bg: "#a68200", text: "#ffffff" }
    case "CREATIVE":
      return { bg: "#ff9a9a", text: "#ffffff" }
    default:
      return { bg: "#e5e7eb", text: "#374151" }
  }
}
