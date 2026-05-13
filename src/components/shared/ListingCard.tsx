"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { formatOccurrenceRangeEST } from "@/lib/datetime-utils"
import { useSavedListings } from "@/hooks/use-saved-listings"
import { useAuth } from "@/hooks/use-auth"
import { getCalendarListingTypeLabel } from "@/lib/listing-type-labels"

interface ListingCardProps {
  id: string
  type: string
  title: string
  starts_at_utc?: string | null
  ends_at_utc?: string | null
  onClick?: () => void
  is_piece?: boolean
  piece_company?: string | null
  piece_company_website?: string | null
  piece_description?: string | null
  choreographer?: string | null
  is_class?: boolean
  class_title?: string | null
  class_description?: string | null
  class_organizer?: string | null
  class_teachers?: string | null
  class_price?: string | null
  class_link?: string | null
  class_style_category?: string | null
  notes?: string | null
  occurrences?: Array<{
    id: string
    starts_at_utc: string
    ends_at_utc: string | null
    tz: string
  }>
  /** First listing photo by sort_order (e.g. admin-chosen cover). */
  coverImageUrl?: string | null
  coverImageAlt?: string | null
}

function getTypeLabel(type: string): string {
  return getCalendarListingTypeLabel(type)
}

export function ListingCard({ 
  id, 
  type, 
  title, 
  starts_at_utc, 
  ends_at_utc, 
  onClick,
  is_piece,
  piece_company,
  piece_company_website,
  piece_description,
  choreographer,
  is_class,
  class_title,
  class_description,
  class_organizer,
  class_teachers,
  class_price,
  class_link,
  class_style_category,
  notes,
  occurrences,
  coverImageUrl,
  coverImageAlt,
}: ListingCardProps) {
  const { isAuthed } = useAuth();
  const { isSaved, loading, saving, toggleSave } = useSavedListings(id);
  const sortedOccurrences = occurrences?.sort((a: { starts_at_utc: string }, b: { starts_at_utc: string }) => 
    new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
  ) || []

  return (
    <Card
      className="p-4 h-full cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={onClick}
    >
      {coverImageUrl && (
        <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-lg border-b border-border-default">
          <img
            src={coverImageUrl}
            alt={coverImageAlt || ""}
            className="h-36 w-full object-cover"
          />
        </div>
      )}
      {isAuthed && (
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            active={isSaved}
            onToggle={(e) => {
              e.stopPropagation();
              if (!saving && !loading) {
                void toggleSave();
              }
            }}
            size="sm"
            disabled={saving || loading}
            aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
          />
        </div>
      )}
      <div className="space-y-2">
        <div className="space-y-1">
          <Badge variant="primary" size="sm" className="inline-block">
            {getTypeLabel(type)}
          </Badge>
          <h4 className="font-header text-xl font-semibold text-text-primary line-clamp-2 pr-8">{title}</h4>
        </div>
        
        {is_piece && sortedOccurrences.length > 0 && (
          <div className="font-sans text-xs text-text-muted">
            <div className="font-medium text-text-primary mb-1">Dates:</div>
            <ul className="list-disc ml-4 space-y-0.5">
              {sortedOccurrences.map((occ) => (
                <li key={occ.id}>
                  {formatOccurrenceRangeEST(occ.starts_at_utc, occ.ends_at_utc)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!is_piece && starts_at_utc && (
          <div className="font-sans text-xs text-text-muted">
            {formatOccurrenceRangeEST(starts_at_utc, ends_at_utc)}
          </div>
        )}
        
        {is_piece && (
          <div className="space-y-1 font-sans text-xs text-text-muted border-t border-border-default pt-2 mt-2">
            {piece_company && (
              <div>
                <span className="font-medium text-text-primary">Company/Artist:</span> {piece_company}
              </div>
            )}
            {piece_company_website && (
              <div>
                <span className="font-medium text-text-primary">Website:</span>{" "}
                <a
                  href={piece_company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {piece_company_website}
                </a>
              </div>
            )}
            {piece_description && (
              <div>
                <span className="font-medium text-text-primary">Description:</span>{" "}
                <span className="line-clamp-2">{piece_description}</span>
              </div>
            )}
            {choreographer && (
              <div>
                <span className="font-medium text-text-primary">Choreographer:</span> {choreographer}
              </div>
            )}
            {notes && (
              <div>
                <span className="font-medium text-text-primary">Credits:</span> {notes}
              </div>
            )}
          </div>
        )}
        
        {is_class && (
          <div className="space-y-1 font-sans text-xs text-text-muted border-t border-border-default pt-2 mt-2">
            {class_title && (
              <div>
                <span className="font-medium text-text-primary">Title:</span> {class_title}
              </div>
            )}
            {class_description && (
              <div>
                <span className="font-medium text-text-primary">Description:</span>{" "}
                <span className="line-clamp-2">{class_description}</span>
              </div>
            )}
            {class_organizer && (
              <div>
                <span className="font-medium text-text-primary">Organizer:</span> {class_organizer}
              </div>
            )}
            {class_teachers && (
              <div>
                <span className="font-medium text-text-primary">Teachers:</span> {class_teachers}
              </div>
            )}
            {class_price && (
              <div>
                <span className="font-medium text-text-primary">Price:</span> {class_price}
              </div>
            )}
            {class_link && (
              <div>
                <span className="font-medium text-text-primary">Link:</span>{" "}
                <a
                  href={class_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {class_link}
                </a>
              </div>
            )}
            {class_style_category && (
              <div>
                <span className="font-medium text-text-primary">Style Category:</span> {class_style_category}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
