"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { PieceList } from "@/components/admin/pieces/PieceList"
import { PieceLinkModal } from "@/components/admin/pieces/PieceLinkModal"
import { PieceNeedingLink } from "@/components/admin/pieces/types"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import { H1 } from "@/components/ui/typography"

export default function AdminPiecesPage() {
  const [pieces, setPieces] = useState<PieceNeedingLink[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPiece, setSelectedPiece] = useState<PieceNeedingLink | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchPieces = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/pieces")
      if (!response.ok) throw new Error("Failed to fetch pieces")
      const json = await response.json()
      setPieces(json.data || [])
    } catch (error) {
      console.error("Error fetching pieces:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPieces()
  }, [fetchPieces])

  const handleLinkClick = (piece: PieceNeedingLink) => {
    setSelectedPiece(piece)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedPiece(null)
  }

  const handleSuccess = () => {
    fetchPieces()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <H1>Link Pieces to Parent Events</H1>
          <p className="text-gray-600 mt-2">
            Link pieces to existing parent events or create minimal parent events for pieces that reference parents that don't exist yet.
          </p>
        </div>

        {loading ? (
          <AdminLoadingState />
        ) : (
          <>
            <PieceList pieces={pieces} onLinkClick={handleLinkClick} />
            {selectedPiece && (
              <PieceLinkModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                piece={selectedPiece}
                onSuccess={handleSuccess}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
