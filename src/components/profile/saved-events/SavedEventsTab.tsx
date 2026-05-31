"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { SavedEvent } from "@/features/profile/server/types";
import { apiGet } from "@/lib/client/fetch-utils";
import { SavedEventsFilters } from "./SavedEventsFilters";
import { SavedEventsGrid } from "./SavedEventsGrid";
import { ListingDetailsModal } from "@/components/calendar/ListingDetailsModal";
import { useAuth } from "@/hooks/use-auth";
import {
  CALENDAR_FILTER_TYPES,
  filterByCalendarListingTypes,
  isAllCalendarFilterTypesSelected,
} from "@/lib/listings/calendar-filter-types";

type FilterMode = "all" | "upcoming" | "past";

interface SavedEventsTabProps {
  hideHeader?: boolean;
}

export const SavedEventsTab = ({ hideHeader = false }: SavedEventsTabProps) => {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    () => new Set(CALENDAR_FILTER_TYPES),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const { isAuthed, isLoading: authLoading } = useAuth();

  const filteredEvents = useMemo(
    () => filterByCalendarListingTypes(events, selectedTypes),
    [events, selectedTypes],
  );

  const isTypeFilterActive = !isAllCalendarFilterTypesSelected(selectedTypes);

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
      <section className={hideHeader ? undefined : "mt-6"}>
        <Card className="p-4" padding="md" border="dashed">
          <SavedEventsFilters
            value={filter}
            onChange={setFilter}
            selectedTypes={selectedTypes}
            onChangeTypes={setSelectedTypes}
          />
          <SavedEventsGrid
            events={filteredEvents}
            isLoading={isLoading}
            onListingClick={handleListingClick}
            isFiltered={isTypeFilterActive}
          />
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
