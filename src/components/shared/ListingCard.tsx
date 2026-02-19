"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { formatDateTimeEST } from "@/lib/datetime-utils"
import { useSavedListings } from "@/hooks/use-saved-listings"
import { useAuth } from "@/hooks/use-auth"

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
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    performance: "Performance",
    audition: "Audition",
    creative: "Creative Opportunity",
    class: "Class/Workshop",
  }
  return labels[type] || type
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
}: ListingCardProps) {
  const { isAuthed } = useAuth();
  const { isSaved, loading, saving, toggleSave } = useSavedListings(id);
  const sortedOccurrences = occurrences?.sort((a, b) => 
    new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
  ) || []

  return (
    <Card
      className="p-4 h-full cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={onClick}
    >
      {isAuthed && (
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            active={isSaved}
            onToggle={(e, next) => {
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
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 pr-8">{title}</h4>
        </div>
        
        {is_piece && sortedOccurrences.length > 0 && (
          <div className="text-xs text-gray-600">
            <div className="font-medium text-gray-700 mb-1">Dates:</div>
            <ul className="list-disc ml-4 space-y-0.5">
              {sortedOccurrences.map((occ) => (
                <li key={occ.id}>
                  {formatDateTimeEST(occ.starts_at_utc)}
                  {occ.ends_at_utc && ` - ${formatDateTimeEST(occ.ends_at_utc)}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!is_piece && starts_at_utc && (
          <div className="text-xs text-gray-600">
            {formatDateTimeEST(starts_at_utc)}
            {ends_at_utc && ` - ${formatDateTimeEST(ends_at_utc)}`}
          </div>
        )}
        
        {is_piece && (
          <div className="space-y-1 text-xs text-gray-600 border-t border-gray-200 pt-2 mt-2">
            {piece_company && (
              <div>
                <span className="font-medium text-gray-700">Company/Artist:</span> {piece_company}
              </div>
            )}
            {piece_company_website && (
              <div>
                <span className="font-medium text-gray-700">Website:</span>{" "}
                <a
                  href={piece_company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {piece_company_website}
                </a>
              </div>
            )}
            {piece_description && (
              <div>
                <span className="font-medium text-gray-700">Description:</span>{" "}
                <span className="line-clamp-2">{piece_description}</span>
              </div>
            )}
            {choreographer && (
              <div>
                <span className="font-medium text-gray-700">Choreographer:</span> {choreographer}
              </div>
            )}
            {notes && (
              <div>
                <span className="font-medium text-gray-700">Credits:</span> {notes}
              </div>
            )}
          </div>
        )}
        
        {is_class && (
          <div className="space-y-1 text-xs text-gray-600 border-t border-gray-200 pt-2 mt-2">
            {class_title && (
              <div>
                <span className="font-medium text-gray-700">Title:</span> {class_title}
              </div>
            )}
            {class_description && (
              <div>
                <span className="font-medium text-gray-700">Description:</span>{" "}
                <span className="line-clamp-2">{class_description}</span>
              </div>
            )}
            {class_organizer && (
              <div>
                <span className="font-medium text-gray-700">Organizer:</span> {class_organizer}
              </div>
            )}
            {class_teachers && (
              <div>
                <span className="font-medium text-gray-700">Teachers:</span> {class_teachers}
              </div>
            )}
            {class_price && (
              <div>
                <span className="font-medium text-gray-700">Price:</span> {class_price}
              </div>
            )}
            {class_link && (
              <div>
                <span className="font-medium text-gray-700">Link:</span>{" "}
                <a
                  href={class_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {class_link}
                </a>
              </div>
            )}
            {class_style_category && (
              <div>
                <span className="font-medium text-gray-700">Style Category:</span> {class_style_category}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
