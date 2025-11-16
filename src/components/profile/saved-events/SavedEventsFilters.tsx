"use client";

import { Button } from "@/components/ui/button";

type FilterMode = "all" | "upcoming" | "past";

interface SavedEventsFiltersProps {
  value: FilterMode;
  onChange: (mode: FilterMode) => void;
}

export const SavedEventsFilters = ({ value, onChange }: SavedEventsFiltersProps) => {
  return (
    <div className="mb-4 inline-flex gap-2">
      <Button
        type="button"
        className="rounded-full"
        variant={value === "all" ? "primary" : "outline"}
        size="md"
        onClick={() => onChange("all")}
      >
        All Events
      </Button>
      <Button
        type="button"
        className="rounded-full"
        variant={value === "upcoming" ? "primary" : "outline"}
        size="md"
        onClick={() => onChange("upcoming")}
      >
        Upcoming
      </Button>
      <Button
        type="button"
        className="rounded-full"
        variant={value === "past" ? "primary" : "outline"}
        size="md"
        onClick={() => onChange("past")}
      >
        Past Events
      </Button>
    </div>
  );
};
