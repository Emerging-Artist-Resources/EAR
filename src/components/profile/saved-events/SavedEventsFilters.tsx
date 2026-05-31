"use client";

import { Button } from "@/components/ui/button";
import { ListingTypeFilterDropdown } from "@/components/calendar/ListingTypeFilterDropdown";

type FilterMode = "all" | "upcoming" | "past";

interface SavedEventsFiltersProps {
  value: FilterMode;
  onChange: (mode: FilterMode) => void;
  selectedTypes: Set<string>;
  onChangeTypes: (types: Set<string>) => void;
}

export const SavedEventsFilters = ({
  value,
  onChange,
  selectedTypes,
  onChangeTypes,
}: SavedEventsFiltersProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        className="rounded-full"
        variant={value === "all" ? "primary" : "outline"}
        size="default"
        onClick={() => onChange("all")}
      >
        All Events
      </Button>
      <Button
        type="button"
        className="rounded-full"
        variant={value === "upcoming" ? "primary" : "outline"}
        size="default"
        onClick={() => onChange("upcoming")}
      >
        Upcoming
      </Button>
      <Button
        type="button"
        className="rounded-full"
        variant={value === "past" ? "primary" : "outline"}
        size="default"
        onClick={() => onChange("past")}
      >
        Past Events
      </Button>
      <ListingTypeFilterDropdown
        selectedTypes={selectedTypes}
        onChange={onChangeTypes}
      />
    </div>
  );
};
