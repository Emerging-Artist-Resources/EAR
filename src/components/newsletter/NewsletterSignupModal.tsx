"use client"

import { useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import type { NewsletterSource } from "@/features/newsletter/constants"
import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe"
import { NewsletterSignupFormFields } from "./NewsletterSignupFormFields"

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
  const { values, setField, reset, submit, loading } = useNewsletterSubscribe({
    source,
    sourceContext,
    onSuccess: onClose,
  })

  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join our Newsletters" size="sm" contentClassName="bg-ear-off-white">
      <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-2 bg-ear-off-white">
        <NewsletterSignupFormFields
          idPrefix="newsletter-modal"
          values={values}
          onChange={setField}
          labelSize="md"
          intro={
            <Text className="text-sm text-gray-600">
              Choose what you would like to hear about. You can use the same email as your EAR account or
              any email you prefer.
            </Text>
          }
        />
        <div className="flex justify-end gap-2 pt-2 text-ear-dark-red">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
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
