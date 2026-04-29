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
import { useAuth } from "@/hooks/use-auth";

type FilterMode = "all" | "upcoming" | "past";

export const SavedEventsTab = () => {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const { isAuthed, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<SavedEvent[]>(`/api/profile/saved-events?mode=${filter}`, {
          signal: controller.signal,
        });
        setEvents(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isExpectedLogoutError =
          message === "UNAUTHORIZED" ||
          message === "Unauthorized" ||
          message.includes("HTTP 401");
        if (!isExpectedLogoutError && !controller.signal.aborted) {
          console.error("Error fetching saved events:", error);
        }
        setEvents([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      controller.abort();
    };
  }, [filter, isAuthed, authLoading]);

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
