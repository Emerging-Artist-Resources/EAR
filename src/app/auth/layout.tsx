import type { ReactNode } from "react"
import { buildNoIndexMetadata } from "@/lib/config/site-metadata"

export const metadata = buildNoIndexMetadata()

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children
}
