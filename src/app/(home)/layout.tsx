import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Emerging Artist Resources",
  description:
    "Resources, community, and tools for emerging artists in NYC — calendar, services, and support.",
}

export default function HomeRouteLayout({ children }: { children: ReactNode }) {
  return children
}
