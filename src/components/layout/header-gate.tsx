"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { isDonationFunnelPath } from "@/lib/donation-funnel-path"

export default function HeaderGate() {
  const pathname = usePathname()
  if (!pathname || typeof pathname !== "string") return null
  if (pathname.startsWith("/auth")) return null
  if (isDonationFunnelPath(pathname)) return null
  return <Header />
}