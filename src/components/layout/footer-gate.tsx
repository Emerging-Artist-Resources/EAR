"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/layout/footer"
import { isDonationFunnelPath } from "@/lib/donations/funnel-path"

export default function FooterGate() {
  const pathname = usePathname()
  if (!pathname || typeof pathname !== "string") return null
  if (pathname.startsWith("/auth")) return null
  if (isDonationFunnelPath(pathname)) return null
  return <Footer />
}


