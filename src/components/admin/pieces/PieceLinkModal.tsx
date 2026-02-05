"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ParentSearch } from "./ParentSearch"
import { PieceNeedingLink } from "./types"

interface PieceLinkModalProps {
  isOpen: boolean
  onClose: () => void
  piece: PieceNeedingLink
  onSuccess: () => void
}

export function PieceLinkModal({ isOpen, onClose, piece, onSuccess }: PieceLinkModalProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const handleLinkToExisting = async () => {
    if (!selectedParentId) {
      alert("Please select a parent event")
      return
    }

    setLinking(true)
    try {
      const response = await fetch(`/api/admin/pieces/${piece.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentListingId: selectedParentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to link piece")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error linking piece:", error)
      alert(error instanceof Error ? error.message : "Failed to link piece")
    } finally {
      setLinking(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Piece to Parent Event"
      size="lg"
    >
      <div className="space-y-4">
        <ParentSearch
          onSelect={setSelectedParentId}
          selectedParentId={selectedParentId}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={linking}>
            Cancel
          </Button>
          <Button onClick={handleLinkToExisting} disabled={linking || !selectedParentId}>
            {linking ? "Linking..." : "Link Piece"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
