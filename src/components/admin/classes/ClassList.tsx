"use client"

import { ClassNeedingLink } from "./types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateTimeEST } from "@/lib/datetime-utils"

interface ClassListProps {
  classes: ClassNeedingLink[]
  onLinkClick: (classItem: ClassNeedingLink) => void
}

export function ClassList({ classes, onLinkClick }: ClassListProps) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No classes need linking.</p>
        <p className="text-sm mt-2">All classes are already linked to parent workshops.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {classes.map((classItem) => (
        <Card key={classItem.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {classItem.title || "Untitled Class"}
                  </h3>
                  <Badge variant={classItem.status === "pending" ? "default" : "secondary"}>
                    {classItem.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Class Information</h4>
                  {classItem.organizer && (
                    <p className="text-sm text-gray-600">
                      Organizer: {classItem.organizer}
                    </p>
                  )}
                  {classItem.teachers && (
                    <p className="text-sm text-gray-600">
                      Teachers: {classItem.teachers}
                    </p>
                  )}
                </div>

                {(classItem.contact_name || classItem.contact_email) && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
                    {classItem.contact_name && (
                      <p className="text-sm text-gray-600">
                        Name: {classItem.contact_name}
                      </p>
                    )}
                    {classItem.contact_email && (
                      <p className="text-sm text-gray-600">
                        Email: {classItem.contact_email}
                      </p>
                    )}
                  </div>
                )}

                {(classItem.occurrences.length > 0 || classItem.venue_name || classItem.address) && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Date/Time & Location</h4>
                    {classItem.occurrences.length > 0 && (
                      <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                        {classItem.occurrences.map((occ) => (
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
                    {!classItem.occurrences.length && classItem.venue_name && (
                      <p className="text-sm text-gray-600">
                        Venue: {classItem.venue_name}
                      </p>
                    )}
                    {!classItem.occurrences.length && classItem.address && (
                      <p className="text-sm text-gray-600">
                        Address: {classItem.address}
                      </p>
                    )}
                    {classItem.location_instructions && (
                      <p className="text-sm text-gray-600">
                        Instructions: {classItem.location_instructions}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Manual Parent Workshop Info</h4>
                  <p className="text-sm text-gray-900">{classItem.parent_workshop_name || "No name provided"}</p>
                  {classItem.parent_workshop_website && (
                    <p className="text-sm text-gray-600">
                      Website:{" "}
                      <a
                        href={classItem.parent_workshop_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {classItem.parent_workshop_website}
                      </a>
                    </p>
                  )}
                  {classItem.parent_workshop_contact_email && (
                    <p className="text-sm text-gray-600">
                      Email: {classItem.parent_workshop_contact_email}
                    </p>
                  )}
                </div>
              </div>
              
              <Button onClick={() => onLinkClick(classItem)}>
                Link Parent
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
