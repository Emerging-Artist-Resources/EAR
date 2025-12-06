"use client"

import { ProfileStatus } from "./profile-types"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"

export function AdminProfileHeader({
  filter,
  counts,
  onChange,
}: {
  filter: ProfileStatus | "all"
  counts: Record<"emerging" | "established", number>
  onChange: (f: ProfileStatus | "all") => void
}) {
  const tabBtn = (state: ProfileStatus | "all", label: string, count?: number) => {
    const active = filter === state
    return (
      <Button
        size="sm"
        variant={active ? "primary" : "outline"}
        onClick={() => onChange(state)}
      >
        {label} {count !== undefined ? `(${count})` : ""}
      </Button>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <H2>Profile Reviews</H2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabBtn("all", "All")}
        {tabBtn("emerging", "Emerging", counts.emerging)}
        {tabBtn("established", "Established", counts.established)}
      </div>
    </div>
  )
}

