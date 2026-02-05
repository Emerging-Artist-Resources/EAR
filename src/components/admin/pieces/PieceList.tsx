"use client"

import { PieceNeedingLink } from "./types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateTimeEST } from "@/lib/datetime-utils"

interface PieceListProps {
  pieces: PieceNeedingLink[]
  onLinkClick: (piece: PieceNeedingLink) => void
}

export function PieceList({ pieces, onLinkClick }: PieceListProps) {
  if (pieces.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No pieces need linking.</p>
        <p className="text-sm mt-2">All pieces are already linked to parent events.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pieces.map((piece) => (
        <Card key={piece.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {piece.piece_title || "Untitled Piece"}
                  </h3>
                  <Badge variant={piece.status === "pending" ? "default" : "secondary"}>
                    {piece.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Piece Information</h4>
                  {piece.piece_company && (
                    <p className="text-sm text-gray-600">
                      Company/Artist: {piece.piece_company}
                    </p>
                  )}
                  {piece.choreographer && (
                    <p className="text-sm text-gray-600">
                      Choreographer: {piece.choreographer}
                    </p>
                  )}
                </div>

                {(piece.contact_name || piece.contact_email) && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
                    {piece.contact_name && (
                      <p className="text-sm text-gray-600">
                        Name: {piece.contact_name}
                      </p>
                    )}
                    {piece.contact_email && (
                      <p className="text-sm text-gray-600">
                        Email: {piece.contact_email}
                      </p>
                    )}
                  </div>
                )}

                {(piece.occurrences.length > 0 || piece.venue_name || piece.address) && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Date/Time & Location</h4>
                    {piece.occurrences.length > 0 && (
                      <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                        {piece.occurrences.map((occ) => (
                          <li key={occ.id}>
                            {formatDateTimeEST(occ.starts_at_utc)}
                            {occ.ends_at_utc && ` - ${formatDateTimeEST(occ.ends_at_utc)}`}
                            {(occ.venue_name || occ.address) && (
                              <span className="text-gray-500">
                                {" "}
                                {occ.venue_name || occ.address}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!piece.occurrences.length && piece.venue_name && (
                      <p className="text-sm text-gray-600">
                        Venue: {piece.venue_name}
                      </p>
                    )}
                    {!piece.occurrences.length && piece.address && (
                      <p className="text-sm text-gray-600">
                        Address: {piece.address}
                      </p>
                    )}
                    {piece.location_instructions && (
                      <p className="text-sm text-gray-600">
                        Instructions: {piece.location_instructions}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Manual Parent Event Info</h4>
                  <p className="text-sm text-gray-900">{piece.parent_event_name || "No name provided"}</p>
                  {piece.parent_event_website && (
                    <p className="text-sm text-gray-600">
                      Website:{" "}
                      <a
                        href={piece.parent_event_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {piece.parent_event_website}
                      </a>
                    </p>
                  )}
                  {piece.parent_event_contact_email && (
                    <p className="text-sm text-gray-600">
                      Email: {piece.parent_event_contact_email}
                    </p>
                  )}
                </div>
              </div>
              
              <Button onClick={() => onLinkClick(piece)}>
                Link Parent
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
