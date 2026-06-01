"use client"

import { Text } from "@/components/ui/typography"
import type { MailchimpHealth, NewsletterStats } from "@/features/analytics/server/types"

interface NewsletterBreakdownProps {
  newsletter: NewsletterStats
  mailchimp: MailchimpHealth
  formatNumber: (n: number) => string
}

export function NewsletterBreakdown({
  newsletter,
  mailchimp,
  formatNumber,
}: NewsletterBreakdownProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Text className="text-sm font-medium text-[var(--gray-800)]">Subscriptions</Text>
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
      <div className="space-y-3">
        <Text className="text-sm font-medium text-[var(--gray-800)]">Mailchimp sync</Text>
        <div className="flex justify-between text-sm">
          <Text className="text-[var(--gray-600)]">Pending sync</Text>
          <Text className="font-medium text-[var(--warning-600)]">
            {formatNumber(mailchimp.pending)}
          </Text>
        </div>
        <div className="flex justify-between text-sm">
          <Text className="text-[var(--gray-600)]">Failed sync</Text>
          <Text className="font-medium text-[var(--error-600)]">
            {formatNumber(mailchimp.failed)}
          </Text>
        </div>
      </div>
    </div>
  )
}
