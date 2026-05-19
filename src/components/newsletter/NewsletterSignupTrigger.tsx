"use client"

import { useState, type ReactNode } from "react"
import { NewsletterSignupModal } from "@/components/newsletter/NewsletterSignupModal"
import type { NewsletterSource } from "@/features/newsletter/constants"

type NewsletterSignupTriggerProps = {
  source: NewsletterSource
  sourceContext?: string
  children: (props: { onClick: () => void }) => ReactNode
}

export function NewsletterSignupTrigger({
  source,
  sourceContext,
  children,
}: NewsletterSignupTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {children({ onClick: () => setOpen(true) })}
      <NewsletterSignupModal
        isOpen={open}
        onClose={() => setOpen(false)}
        source={source}
        sourceContext={sourceContext}
      />
    </>
  )
}
