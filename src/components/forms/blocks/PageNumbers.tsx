import { TfiLayoutLineSolid } from "react-icons/tfi";
import React from "react";

interface PageNumbersProps {
  current: number;       // 1-based current step
  total: number;         // total number of steps
  className?: string;
  connector?: boolean;   // show connectors between numbers
  size?: "sm" | "md" | "lg";
}

export function PageNumbers({
  current,
  total,
  className,
  connector = true,
  size = "md",
}: PageNumbersProps) {
 
  const items = Array.from({ length: Math.max(0, total) }, (_, i) => i + 1);

  return (
    <div className={`mt-2 flex items-center justify-center gap-2 ${className || ""}`}>
      {items.map((n, idx) => {
        const active = n === current;
        return (
          <React.Fragment key={n}>
            <span
                className={[
                    "inline-flex items-center justify-center rounded-full border border-border-default font-medium",
                    size === "lg" ? "h-10 w-10 text-base" : size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm",
                    active
                      ? "border-brand-primary bg-brand-primary text-primary-foreground"
                      : "bg-surface-interactive text-text-muted"
                ].join(" ")}
                aria-current={active ? "step" : undefined}
                >
                {n}
            </span>
            {connector && idx < items.length - 1 && (
              <span className="text-brand-primary/70" style={{ fontSize: size === "lg" ? 22 : size === "sm" ? 16 : 20 }}>
                <TfiLayoutLineSolid />
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}