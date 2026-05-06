"use client"

import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  /** When true, confirm button uses primary variant (destructive-style flows can pass false + custom className later). */
  confirmVariant?: "primary" | "outline"
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "primary",
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      closeOnOverlay={false}
      contentClassName="border-border-default bg-surface-modal-warm text-text-primary"
    >
      <div className="px-6 pb-6 pt-2 space-y-4">
        <div className="text-sm text-gray-700 space-y-2">{typeof description === "string" ? <Text>{description}</Text> : description}</div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
