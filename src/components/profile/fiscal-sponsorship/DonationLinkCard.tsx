"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { fiscalSponsorshipDashboard, fiscalDashboardButtonClass } from "@/lib/content/fiscal-sponsorship-dashboard"

export function DonationLinkCard({
  donationLink,
  slug,
}: {
  donationLink: string
  slug: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = fiscalSponsorshipDashboard.donationLink

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(donationLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card border="dashed" padding="md" className="space-y-3">
      <H3 className="text-base font-semibold text-gray-900">{copy.heading}</H3>
      <Text className="break-all text-sm text-gray-700">{donationLink}</Text>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className={fiscalDashboardButtonClass.secondary}
          onClick={() => void handleCopy()}
        >
          {copied ? copy.copiedLabel : copy.copyLabel}
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/donate/${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer">
            {copy.openLabel}
          </Link>
        </Button>
      </div>
    </Card>
  )
}
