"use client"

import { Modal } from "@/components/ui/modal"
import { EventWizard } from "@/components/event-forms/event-wizard/EventWizard"

interface PerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PerformanceModal({ isOpen, onClose, onSuccess }: PerformanceModalProps) {
  const handleClose = () => {
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Submit a Listing" closeOnOverlay={false}>
      {/* Wizard is now a separate component */}
      <EventWizard onSuccess={onSuccess} onClose={handleClose} />
    </Modal>
  )
}