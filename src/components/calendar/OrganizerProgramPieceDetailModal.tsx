"use client"

import { useEffect, useMemo, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { getCalendarListingTypeLabel } from "@/lib/listings/type-labels"
import type { OrganizerProgramPiecePersisted } from "@/lib/listings/organizer-program-pieces"
import {
  organizerProgramPieceDisplayTitle,
  organizerProgramPiecePhotosForDisplay,
  organizerProgramPieceToPublicListingDetail,
} from "@/lib/listings/organizer-program-pieces-display"
import { normalizePublicListingRelations } from "@/lib/listings/display"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { PerformancePieceDetailContent } from "./PerformancePieceDetailContent"

export interface OrganizerProgramPieceDetailModalProps {
  isOpen: boolean
  /** Closes the piece overlay only (e.g. “Back to Performance”). */
  onClosePiece: () => void
  /** Closes the piece overlay and the parent listing modal (X / overlay). */
  onDismissAll: () => void
  piece: OrganizerProgramPiecePersisted | null
  parentListing: PublicListingDetail | null
}

export function OrganizerProgramPieceDetailModal({
  isOpen,
  onClosePiece,
  onDismissAll,
  piece,
  parentListing,
}: OrganizerProgramPieceDetailModalProps) {
  const [showAllDates, setShowAllDates] = useState(false)

  useEffect(() => {
    if (!isOpen) setShowAllDates(false)
  }, [isOpen])

  const title = piece ? organizerProgramPieceDisplayTitle(piece) : "Program piece"
  const typeLabel = getCalendarListingTypeLabel("performance")

  const pieceListing = useMemo(() => {
    if (!piece || !parentListing) return null
    return organizerProgramPieceToPublicListingDetail(
      piece,
      normalizePublicListingRelations(parentListing),
    )
  }, [piece, parentListing])

  const sortedPhotos = useMemo(
    () => (piece ? organizerProgramPiecePhotosForDisplay(piece) : []),
    [piece],
  )

  if (!piece || !pieceListing) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDismissAll}
      title={title}
      size="lg"
      headerClassName="bg-primary"
      titleClassName="font-title text-2xl font-bold tracking-wide md:text-3xl"
      contentClassName="border-border-default bg-surface-modal-warm text-text-primary"
      overlayClassName="z-[10050]"
    >
      <PerformancePieceDetailContent
        listing={pieceListing}
        typeLabel={typeLabel}
        sortedPhotos={sortedPhotos}
        showAllDates={showAllDates}
        onShowAllDatesChange={setShowAllDates}
        onBackToParent={onClosePiece}
        parentListingId={parentListing?.id ?? null}
        backToParentLabel="Back to Performance"
        showSave={false}
      />
    </Modal>
  )
}
