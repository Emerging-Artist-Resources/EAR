"use client"

import { useState } from "react"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal"
import { Text } from "@/components/ui/typography"
import { useAuth } from "@/hooks/use-auth"
import { useSavedListings } from "@/hooks/use-saved-listings"

export const SAVE_LISTING_SIGN_IN_MESSAGE =
  "You must be signed in to save listings to your favorites."

export function SaveListingFavoriteButton({
  listingId,
  size = "md",
  returnTo,
  className,
}: {
  listingId: string
  size?: "sm" | "md" | "lg"
  returnTo?: string
  className?: string
}) {
  const { isAuthed } = useAuth()
  const { isSaved, loading, saving, error, toggleSave } = useSavedListings(listingId)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const resolvedReturnTo = returnTo ?? `/calendar?listingId=${listingId}`

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!isAuthed) {
      setAuthPromptOpen(true)
      return
    }
    if (!saving && !loading) {
      void toggleSave()
    }
  }

  return (
    <>
      <div className={className ?? "flex items-center gap-2"}>
        {error ? <Text className="text-status-error-fg">{error}</Text> : null}
        <FavoriteButton
          active={isSaved}
          onToggle={handleToggle}
          size={size}
          disabled={isAuthed && (saving || loading)}
          aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
        />
      </div>
      <SignInRequiredModal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        returnTo={resolvedReturnTo}
        message={SAVE_LISTING_SIGN_IN_MESSAGE}
      />
    </>
  )
}
