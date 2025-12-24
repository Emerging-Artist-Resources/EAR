"use client"

import { ProfileStatus, ProfileType } from "./profile-types"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"

export type ProfileFilter = ProfileStatus | "all" | "needsReview"

export function AdminProfileHeader({
  filter,
  profileTypeFilter,
  counts,
  newCount,
  onChange,
  onProfileTypeChange,
}: {
  filter: ProfileFilter
  profileTypeFilter: ProfileType | "all"
  counts: Record<"emerging" | "established", number>
  newCount: number
  onChange: (f: ProfileFilter) => void
  onProfileTypeChange: (t: ProfileType | "all") => void
}) {
  const tabBtn = (state: ProfileFilter, label: string, count?: number) => {
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
        <div className="flex items-center gap-3">
          <H2>Profile Reviews</H2>
          {newCount > 0 && (
            <Badge variant="warning" size="sm">
              {newCount} new {newCount === 1 ? "user" : "users"} (72h)
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {tabBtn("all", "All")}
          {tabBtn("needsReview", "Needs Review", newCount)}
          {tabBtn("emerging", "Emerging", counts.emerging)}
          {tabBtn("established", "Established", counts.established)}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--gray-600)] whitespace-nowrap">Profile Type:</label>
          <Select
            value={profileTypeFilter}
            onChange={(e) => onProfileTypeChange(e.target.value as ProfileType | "all")}
            className="min-w-[140px]"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="festival">Festival</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>
    </div>
  )
}

