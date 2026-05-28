"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedEvent } from "@/features/profile/server/types";
import { AttendanceButtons } from "./AttendanceButtons";
import { H3, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useState, useMemo, useEffect } from "react";
import { useSavedListings } from "@/hooks/use-saved-listings";
import { apiPatch } from "@/lib/client/fetch-utils";

interface SavedEventCardProps {
  event: SavedEvent;
  onListingClick?: (listingId: string) => void;
}

export const SavedEventCard = ({ event, onListingClick }: SavedEventCardProps) => {
  const { isSaved, saving, error: saveError, toggleSave } = useSavedListings(event.id, event.isSaved);
  const [updatingAttendance, setUpdatingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<"attended" | "missed" | null>(event.attendanceStatus ?? null);
  
  // Sync local state with prop when event updates
  useEffect(() => {
    setAttendanceStatus(event.attendanceStatus ?? null);
  }, [event.attendanceStatus]);
  
  const isPastEvent = useMemo(() => {
    const iso = event.primaryStartsAtIso ?? event.date;
    if (!iso) return false;
    const parsedDate = new Date(iso);
    return !isNaN(parsedDate.getTime()) && parsedDate < new Date();
  }, [event.primaryStartsAtIso, event.date]);
  
  const deadlineText = event.deadline ? `Deadline: ${event.deadline}` : null;
  const eventType = String(event.type || "").toLowerCase();
  const question =
    eventType === "performance" || eventType === "class"
      ? "Did you attend this event?"
      : "Did you submit to this listing?";
  const attendanceMode = eventType === "audition" || eventType === "creative" || eventType === "funding" ? "submit" : "attend";

  const updateAttendanceStatus = async (status: "attended" | "missed" | null) => {
    const previousStatus = attendanceStatus;
    setAttendanceStatus(status); // Optimistic update
    setUpdatingAttendance(true);
    setAttendanceError(null);
    try {
      await apiPatch(`/api/profile/saved-listings/${event.id}`, { attendanceStatus: status });
      // The saved events list will be refreshed when the parent component refetches
    } catch (err) {
      console.error("Failed to update attendance:", err);
      setAttendanceStatus(previousStatus); // Rollback on error
      setAttendanceError(err instanceof Error ? err.message : "Failed to update attendance");
    } finally {
      setUpdatingAttendance(false);
    }
  };

  return (
    <Card className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="primary" className="text-xs capitalize">
            {event.type}
          </Badge>
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-xs text-red-600">{saveError}</span>
            )}
            <FavoriteButton
              active={isSaved}
              onToggle={() => {
                if (!saving) {
                  void toggleSave();
                }
              }}
              size="sm"
              disabled={saving}
              aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
            />
          </div>
        </div>

        <div className="space-y-1">
          <H3 className="text-sm font-semibold">{event.name}</H3>
          <Text className="text-sm text-gray-700">{event.date}</Text>
          <Text className="text-sm text-gray-700">{event.location}</Text>
          {deadlineText && <Text className="text-sm text-gray-700">{deadlineText}</Text>}
          {event.description && <Text className="text-sm text-gray-600 line-clamp-3">{event.description}</Text>}
        </div>

        <Button 
          type="button" 
          variant="link" 
          className="mt-3"
          onClick={() => onListingClick?.(event.id)}
        >
          More details
        </Button>
      </div>

      {isPastEvent && isSaved && (
        <div className="mt-4 border-t pt-3">
          {attendanceStatus ? (
            <div>
              <Text className="text-sm text-gray-700">
                {attendanceMode === "submit" 
                  ? (attendanceStatus === "attended" ? "I submitted" : "Not submitted")
                  : (attendanceStatus === "attended" ? "I attended" : "Not attended")
                }
              </Text>
            </div>
          ) : (
            <>
              <Text className="text-sm font-medium text-gray-800 mb-2">{question}</Text>
              {attendanceError && (
                <Text className="text-xs text-red-600 mb-2">{attendanceError}</Text>
              )}
              <AttendanceButtons
                value={attendanceStatus ?? null}
                mode={attendanceMode}
                onChange={(status) => {
                  void updateAttendanceStatus(status);
                }}
                disabled={updatingAttendance}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
};
