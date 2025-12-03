import { SavedEvent } from "@/features/profile/server/types";
import { SavedEventCard } from "./SavedEventCard";
import { Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";

interface SavedEventsGridProps {
  events: SavedEvent[];
  isLoading?: boolean;
}

export const SavedEventsGrid = ({ events, isLoading }: SavedEventsGridProps) => {
  if (isLoading) {
    return <Text className="mt-4 text-sm text-gray-600">Loading events…</Text>;
  }

  if (!events.length) {
    return (
      <Card className="mt-4 p-4">
        <Text className="text-sm text-gray-600">You haven’t saved any events yet.</Text>
      </Card>
    );
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {events.map((event) => (
        <SavedEventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
