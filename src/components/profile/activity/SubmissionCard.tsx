import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { H4, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getCalendarListingTypeLabel } from "@/lib/listings/type-labels"

export interface SubmissionItem {
  id: string
  name: string
  type: "performance" | "audition" | "creative" | "class" | "funding"
  submittedAt: string // ISO or display string
  status: "approved" | "pending" | "rejected" | "under_review"
  href: string
}

function statusToVariant(status: SubmissionItem["status"]): "success" | "warning" | "error" | "default" {
  if (status === "approved") return "success"
  if (status === "pending" || status === "under_review") return "warning"
  if (status === "rejected") return "error"
  return "default"
}

export const SubmissionCard: React.FC<{ item: SubmissionItem }> = ({ item }) => {
  const submitted = item.submittedAt
  const typeLabel =
    item.type === "performance" ||
    item.type === "audition" ||
    item.type === "creative" ||
    item.type === "class"
      ? getCalendarListingTypeLabel(item.type)
      : item.type.charAt(0).toUpperCase() + item.type.slice(1)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="pr-4">
          <H4>{item.name}</H4>
          <Text className="text-sm text-gray-600">
            {typeLabel} • Submitted on {submitted}
          </Text>
          <div className="mt-1">
            <Link href={item.href}>
              <Button variant="link">View submission</Button>
            </Link>
          </div>
        </div>
        <Badge variant={statusToVariant(item.status)}>
          {item.status === "under_review" ? "Under review" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      </div>
    </Card>
  )
}


