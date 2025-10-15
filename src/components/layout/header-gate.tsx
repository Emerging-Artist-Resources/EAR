"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"

export default function HeaderGate() {
  const pathname = usePathname()
  if (!pathname) return null
  if (pathname.startsWith("/auth")) return null
  return <Header />
}