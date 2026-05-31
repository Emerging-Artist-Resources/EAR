"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Text } from "@/components/ui/typography"
import { useToast } from "@/contexts/ToastContext"
import type { NewsletterSource } from "@/features/newsletter/constants"

type NewsletterSignupModalProps = {
  isOpen: boolean
  onClose: () => void
  source?: NewsletterSource
  sourceContext?: string
}

export function NewsletterSignupModal({
  isOpen,
  onClose,
  source = "modal",
  sourceContext,
}: NewsletterSignupModalProps) {
  const { showToast } = useToast()
  const [email, setEmail] = useState("")
  const [ear, setEar] = useState(true)
  const [calendar, setCalendar] = useState(true)
  const [loading, setLoading] = useState(false)

  const resetAndClose = () => {
    setEmail("")
    setEar(true)
    setCalendar(true)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ear && !calendar) {
      showToast("Select at least one subscription option.", "error")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          subscribed_to_newsletter: ear,
          subscribed_to_calendar: calendar,
          source,
          source_context: sourceContext,
        }),
      })
      const json = (await res.json()) as {
        data?: unknown
        error?: { message?: string; details?: { message?: string }[] }
      }

      if (!res.ok) {
        const d = json.error?.details
        const firstDetail =
          Array.isArray(d) && d[0] && typeof d[0] === "object" && d[0] !== null && "message" in d[0]
            ? String((d[0] as { message: string }).message)
            : null
        const msg = firstDetail ?? json.error?.message ?? "Something went wrong. Please try again."
        showToast(msg, "error")
        return
      }

      showToast("You're subscribed. Thank you!", "success")
      resetAndClose()
    } catch {
      showToast("Something went wrong. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Join our Newsletters" size="sm" contentClassName="bg-ear-off-white">
      <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-2 bg-ear-off-white">
        <Text className="text-sm text-gray-600">
          Choose what you would like to hear about. You can use the same email as your EAR account or
          any email you prefer.
        </Text>
        <div>
          <label htmlFor="newsletter-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <fieldset className="space-y-3">
          <legend className="sr-only">Subscription options</legend>
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <Checkbox
              checked={ear}
              onChange={(e) => setEar((e.target as HTMLInputElement).checked)}
              className="mt-0.5"
            />
            <span>EAR newsletter</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <Checkbox
              checked={calendar}
              onChange={(e) => setCalendar((e.target as HTMLInputElement).checked)}
              className="mt-0.5"
            />
            <span>Calendar updates</span>
          </label>
        </fieldset>
        <div className="flex justify-end gap-2 pt-2 text-ear-dark-red">
          <Button type="button" variant="outline" onClick={resetAndClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving…" : "Subscribe"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
