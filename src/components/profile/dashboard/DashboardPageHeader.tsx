import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { H1, Text } from "@/components/ui/typography"

interface DashboardPageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function DashboardPageHeader({
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <Card
      padding="md"
      className="flex w-full flex-col items-start justify-start gap-4 bg-ear-black p-4"
    >
      <H1 className="text-ear-baby-blue">{title}</H1>
      {description ? (
        <Text className="text-ear-off-white">{description}</Text>
      ) : null}
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </Card>
  )
}
