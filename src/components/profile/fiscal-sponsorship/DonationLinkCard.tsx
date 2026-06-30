"use client"

import { useState } from "react"
import { Text } from "@/components/ui/typography"
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
  const donatePath = `/donate/${encodeURIComponent(slug)}`

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
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Text className="text-sm text-gray-600">{copy.heading}:</Text>
      <a
        href={donatePath}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {donationLink}
      </a>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={fiscalDashboardButtonClass.secondary}
        onClick={() => void handleCopy()}
      >
        {copied ? copy.copiedLabel : copy.copyLabel}
      </Button>
    </div>
  )
}
