"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { ParentSearch } from "./ParentSearch"
import { ClassNeedingLink } from "./types"

interface ClassLinkModalProps {
  isOpen: boolean
  onClose: () => void
  classItem: ClassNeedingLink
  onSuccess: () => void
}

export function ClassLinkModal({ isOpen, onClose, classItem, onSuccess }: ClassLinkModalProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const handleLinkToExisting = async () => {
    if (!selectedParentId) {
      alert("Please select a parent workshop")
      return
    }

    setLinking(true)
    try {
      const response = await fetch(`/api/admin/classes/${classItem.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentListingId: selectedParentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to link class")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error linking class:", error)
      alert(error instanceof Error ? error.message : "Failed to link class")
    } finally {
      setLinking(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Class to Parent Workshop"
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
            {linking ? "Linking..." : "Link Class"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
