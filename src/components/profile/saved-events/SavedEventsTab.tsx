"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { SavedEvent } from "@/features/profile/server/types";
import { apiGet } from "@/lib/fetch-utils";
import { SavedEventsFilters } from "./SavedEventsFilters";
import { SavedEventsGrid } from "./SavedEventsGrid";
import { H3, Text } from "@/components/ui/typography";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListingDetailsModal } from "@/components/calendar/ListingDetailsModal";

type FilterMode = "all" | "upcoming" | "past";

export const SavedEventsTab = () => {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<SavedEvent[]>(`/api/profile/saved-events?mode=${filter}`);
        setEvents(data);
      } catch (error) {
        console.error("Error fetching saved events:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();
  }, [filter]);

  const handleListingClick = useCallback((listingId: string) => {
    setSelectedListingId(listingId);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedListingId(null);
  }, []);

  return (
    <>
      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <H3>Saved Events</H3>
            <Text className="text-sm text-gray-600">Events you bookmarked for later</Text>
          </div>
          <Link href="/calendar">
            <Button variant="link">Browse More Events</Button>
          </Link>
        </div>

        <Card className="p-4" padding="md" border="dashed">
          <SavedEventsFilters value={filter} onChange={setFilter} />
          <SavedEventsGrid events={events} isLoading={isLoading} onListingClick={handleListingClick} />
        </Card>
      </section>
      <ListingDetailsModal
        isOpen={selectedListingId !== null}
        onClose={handleModalClose}
        listingId={selectedListingId}
        onListingClick={handleListingClick}
      />
    </>
  );
};
