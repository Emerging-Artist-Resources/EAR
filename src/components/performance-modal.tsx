"use client"

import { Modal } from "@/components/ui/modal"
import { EventWizard } from "@/components/event-forms/event-wizard/EventWizard"

interface PerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (info?: { wasApprovedResubmit?: boolean }) => void
  /** When set, modal opens in edit mode for this listing id */
  listingId?: string | null
}

export default function PerformanceModal({ isOpen, onClose, onSuccess, listingId }: PerformanceModalProps) {
  const handleClose = () => {
    onClose()
  }

  const title = listingId ? "Edit listing" : "Submit a Listing"

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      closeOnOverlay={false}
      contentClassName="border-border-default bg-surface-modal-warm text-text-primary"
    >
      <EventWizard
        key={listingId ?? "new-listing"}
        listingId={listingId ?? undefined}
        onSuccess={onSuccess}
        onClose={handleClose}
      />
    </Modal>
  )
}