import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedEvent } from "@/features/profile/server/types";
import { AttendanceButtons } from "./AttendanceButtons";
import { H3, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useState } from "react";

interface SavedEventCardProps {
  event: SavedEvent;
}

export const SavedEventCard = ({ event }: SavedEventCardProps) => {
  const deadlineText = event.deadline ? `Deadline: ${event.deadline}` : null;
  const [isFavorite, setIsFavorite] = useState<boolean>(true);
  const eventType = String(event.type || "").toLowerCase();
  const question =
    eventType === "performance" || eventType === "class"
      ? "Did you attend this event?"
      : "Did you submit to this listing?";
  const attendanceMode = eventType === "audition" || eventType === "creative" || eventType === "funding" ? "submit" : "attend";

  return (
    <Card className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="primary" className="text-xs capitalize">
            {event.type}
          </Badge>
          {/* TODO: hook this up to "unsave" later */}
          <FavoriteButton
            active={isFavorite}
            onToggle={(_, next) => {
              setIsFavorite(next)
              // TODO: call API to persist favorite toggle
            }}
          />
        </div>

        <div className="space-y-1">
          <H3 className="text-sm font-semibold">{event.name}</H3>
          <Text className="text-sm text-gray-700">{event.date}</Text>
          <Text className="text-sm text-gray-700">{event.location}</Text>
          {deadlineText && <Text className="text-sm text-gray-700">{deadlineText}</Text>}
          {event.description && <Text className="text-sm text-gray-600 line-clamp-3">{event.description}</Text>}
        </div>

        <Button type="button" variant="link" className="mt-3">More details</Button>
      </div>

      <div className="mt-4 border-t pt-3">
        <Text className="text-sm font-medium text-gray-800 mb-2">{question}</Text>
        <AttendanceButtons
          value={event.attendanceStatus ?? null}
          mode={attendanceMode}
          onChange={(status) => {
            // TODO: hook up to API
            console.log("attendance change", event.id, status);
          }}
        />
      </div>
    </Card>
  );
};
