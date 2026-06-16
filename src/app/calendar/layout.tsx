import type { ReactNode } from "react"
import { buildPageMetadata } from "@/lib/config/site-metadata"
import { calendarHero } from "@/lib/content/calendar"

export const metadata = buildPageMetadata({
  title: calendarHero.title,
  description:
    "Discover performances, classes, auditions, and arts opportunities for emerging artists in New York City and the greater metro area. Free listings.",
  path: "/calendar",
})

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return children
}
