import React from "react"
import { cn } from "@/lib/utils"

export interface FavoriteButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onToggle"> {
  active?: boolean
  onToggle?: (event: React.MouseEvent<HTMLButtonElement>, next: boolean) => void
  size?: "sm" | "md" | "lg"
}

const sizeToIcon = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  active = false,
  onToggle,
  size = "md",
  className,
  disabled,
  onClick,
  "aria-label": ariaLabel,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    onToggle?.(e, !active)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "group inline-flex shrink-0 items-center justify-center rounded-sm p-0.5",
        "bg-transparent hover:bg-transparent active:bg-transparent",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      aria-pressed={active}
      aria-label={ariaLabel ?? (active ? "Remove from favorites" : "Add to favorites")}
      onClick={handleClick}
      {...props}
    >
      <svg
        className={cn(
          sizeToIcon[size],
          "pointer-events-none transition-[fill,stroke] duration-150",
          active
            ? "fill-amber-400 stroke-amber-500 group-hover:fill-amber-500 group-hover:stroke-amber-600"
            : "fill-none stroke-text-muted group-hover:fill-amber-300 group-hover:stroke-amber-500",
        )}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    </button>
  )
}
