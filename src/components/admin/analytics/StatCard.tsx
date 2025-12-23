"use client"

import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export function StatCard({ title, value, subtitle, trend }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text className="text-sm text-[var(--gray-600)] mb-1">{title}</Text>
          <H3 className="text-2xl font-bold text-[var(--gray-900)] mb-1">{value}</H3>
          {subtitle && (
            <Text className="text-xs text-[var(--gray-500)]">{subtitle}</Text>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <Text
                className={`text-xs font-medium ${
                  trend.isPositive
                    ? "text-[var(--success-600)]"
                    : "text-[var(--error-600)]"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </Text>
              <Text className="text-xs text-[var(--gray-500)]">{trend.label}</Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

