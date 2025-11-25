"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/layout/footer"

export default function FooterGate() {
  const pathname = usePathname()
  if (!pathname) return null
  if (pathname.startsWith("/auth")) return null
  return <Footer />
}


