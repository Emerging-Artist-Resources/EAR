"use client"

import { H2 } from "@/components/ui/typography"

interface AnalyticsSectionProps {
  title: string
  children: React.ReactNode
}

export function AnalyticsSection({ title, children }: AnalyticsSectionProps) {
  return (
    <section className="mb-10">
      <H2 className="text-lg font-semibold text-[var(--gray-900)] mb-4 pb-2 border-b border-[var(--gray-200)]">
        {title}
      </H2>
      {children}
    </section>
  )
}
