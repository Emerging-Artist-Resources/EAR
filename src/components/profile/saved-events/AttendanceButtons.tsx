"use client";

import { Button } from "@/components/ui/button";

type AttendanceStatus = "attended" | "missed" | null;

interface AttendanceButtonsProps {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
}

export const AttendanceButtons = ({ value, onChange }: AttendanceButtonsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        className="flex-1"
        variant={value === "attended" ? "primary" : "outline"}
        onClick={() => onChange(value === "attended" ? null : "attended")}
        aria-pressed={value === "attended"}
      >
        Yes, I attended
      </Button>
      <Button
        type="button"
        size="sm"
        className="flex-1"
        variant={value === "missed" ? "primary" : "outline"}
        onClick={() => onChange(value === "missed" ? null : "missed")}
        aria-pressed={value === "missed"}
      >
        Couldn’t make it
      </Button>
    </div>
  );
};
