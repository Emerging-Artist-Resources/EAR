"use client"

import Link from "next/link"

import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"
import { ROUTES } from "@/lib/config/constants"

export const AUTH_MODAL_CONTENT_CLASS =
  "bg-ear-off-white border-ear-black/10 text-ear-black" as const

export type SignInRequiredModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Path passed to `/auth/signin?returnTo=…` */
  returnTo: string
  message: string
}

export function SignInRequiredModal({
  isOpen,
  onClose,
  returnTo,
  message,
}: SignInRequiredModalProps) {
  const signInHref = `/auth/signin?returnTo=${encodeURIComponent(returnTo)}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign in required"
      size="sm"
      contentClassName={AUTH_MODAL_CONTENT_CLASS}
    >
      <div className="space-y-5">
        <Text className="text-sm text-ear-black/70">{message}</Text>
        <div className="flex justify-between gap-3">
          <Link href={signInHref}>
            <Button variant="primary">Sign in</Button>
          </Link>
          <Link href={ROUTES.SIGN_UP}>
            <Button
              variant="outline"
              className="border-ear-black/20 bg-white text-ear-black hover:bg-ear-black/5"
            >
              Create account
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  )
}
