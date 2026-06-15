import type { ReactNode } from "react"
import { buildPageMetadata } from "@/lib/config/site-metadata"

export const metadata = buildPageMetadata({
  title: "Emerging Artist Resources",
  description:
    "Free arts opportunities, performances, classes, auditions, and artist resources in New York City. Community calendar, fiscal sponsorship, and support for emerging artists.",
  path: "/",
})

export default function HomeRouteLayout({ children }: { children: ReactNode }) {
  return children
}
