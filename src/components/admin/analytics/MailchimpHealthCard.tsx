"use client"

import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import type { MailchimpHealth } from "@/features/analytics/server/types"

interface MailchimpHealthCardProps {
  mailchimp: MailchimpHealth
  formatNumber: (n: number) => string
}

export function MailchimpHealthCard({ mailchimp, formatNumber }: MailchimpHealthCardProps) {
  return (
    <Card className="p-6">
      <Text className="text-sm text-[var(--gray-600)] mb-2">Mailchimp Sync</Text>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <H3 className="text-2xl font-bold text-[var(--warning-600)]">
            {formatNumber(mailchimp.pending)}
          </H3>
          <Text className="text-xs text-[var(--gray-500)] mt-1">Pending</Text>
        </div>
        <div>
          <H3 className="text-2xl font-bold text-[var(--error-600)]">
            {formatNumber(mailchimp.failed)}
          </H3>
          <Text className="text-xs text-[var(--gray-500)] mt-1">Failed</Text>
        </div>
      </div>
    </Card>
  )
}
