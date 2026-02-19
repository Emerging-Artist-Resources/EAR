"use client";

import { Button } from "@/components/ui/button";

type AttendanceStatus = "attended" | "missed" | null;

interface AttendanceButtonsProps {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  mode?: "attend" | "submit";
  disabled?: boolean;
}

export const AttendanceButtons = ({ value, onChange, mode = "attend", disabled = false }: AttendanceButtonsProps) => {
  const yesLabel = mode === "submit" ? "Yes, I submitted" : "Yes, I attended";
  const noLabel = mode === "submit" ? "No, did not submit" : "Couldn’t make it";
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        className="flex-1"
        variant="primary"
        onClick={() => onChange(value === "attended" ? null : "attended")}
        aria-pressed={value === "attended"}
        disabled={disabled}
      >
        {yesLabel}
      </Button>
      <Button
        type="button"
        size="sm"
        className="flex-1"
        variant="secondary"
        onClick={() => onChange(value === "missed" ? null : "missed")}
        aria-pressed={value === "missed"}
        disabled={disabled}
      >
        {noLabel}
      </Button>
    </div>
  );
};
