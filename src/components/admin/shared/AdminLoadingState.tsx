"use client"

import { Text } from "@/components/ui/typography"

export function AdminLoadingState() {
  return (
    <div className="p-8 text-center">
      <Text className="text-[var(--gray-600)]">Loading…</Text>
    </div>
  )
}

