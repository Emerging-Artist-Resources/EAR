import React from "react"
import { Button } from "@/components/ui/button"
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
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    onToggle?.(e, !active)
  }
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("p-0 h-auto w-auto rounded-none", className)}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      onClick={handleClick}
      {...props}
    >
      <svg
        className={cn(sizeToIcon[size], active && "text-brand-accent-neutral fill-brand-accent-neutral")}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    </Button>
  )
}


