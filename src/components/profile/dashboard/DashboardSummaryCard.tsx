import type { ComponentType } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { H3, Text } from "@/components/ui/typography"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Fixed height so titles align across cards in the stats row. */
const LEADING_SLOT_CLASS = "flex h-8 items-center"

interface DashboardSummaryCardProps {
  title: string
  description: string
  href: string
  colorClass?: string
  /** When set, shows a count badge in the top-left. */
  count?: number
  /** When count is omitted, shows this icon in the top-left. */
  icon?: ComponentType<{ className?: string }>
}

export function DashboardSummaryCard({
  title,
  description,
  href,
  colorClass = "bg-gray-50",
  count,
  icon: Icon,
}: DashboardSummaryCardProps) {
  return (
    <Card className={cn("flex h-full flex-col p-6 text-left", colorClass)}>
      <div className={LEADING_SLOT_CLASS}>
        {count != null ? (
          <Badge variant="primary" size="md">{count}</Badge>
        ) : Icon ? (
          <Icon className="h-8 w-8 shrink-0 text-ear-dark-red" aria-hidden />
        ) : null}
      </div>
      <H3 className="mt-3 text-lg">{title}</H3>
      <Text className="mt-1 text-sm text-gray-600">{description}</Text>
      <Link href={href} className="mt-4 block">
        <Button variant="outline" size="sm" className="w-full">
          View more
          <ArrowRightIcon className="size-4 text-ear-black" />
        </Button>
      </Link>
    </Card>
  )
}
