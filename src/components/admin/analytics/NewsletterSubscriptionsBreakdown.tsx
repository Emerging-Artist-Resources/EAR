"use client"

import { Text } from "@/components/ui/typography"
import type { NewsletterStats } from "@/features/analytics/server/types"

interface NewsletterSubscriptionsBreakdownProps {
  newsletter: NewsletterStats
  formatNumber: (n: number) => string
}

export function NewsletterSubscriptionsBreakdown({
  newsletter,
  formatNumber,
}: NewsletterSubscriptionsBreakdownProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <Text className="text-[var(--gray-600)]">Total subscribers</Text>
        <Text className="font-medium">{formatNumber(newsletter.totalSubscribers)}</Text>
      </div>
      <div className="flex justify-between text-sm">
        <Text className="text-[var(--gray-600)]">EAR newsletter</Text>
        <Text className="font-medium">{formatNumber(newsletter.earNewsletter)}</Text>
      </div>
      <div className="flex justify-between text-sm">
        <Text className="text-[var(--gray-600)]">Calendar weekly email</Text>
        <Text className="font-medium">{formatNumber(newsletter.calendarEmail)}</Text>
      </div>
      <div className="flex justify-between text-sm">
        <Text className="text-[var(--gray-600)]">Both lists</Text>
        <Text className="font-medium">{formatNumber(newsletter.bothLists)}</Text>
      </div>
    </div>
  )
}
