import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FavoriteButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onToggle"> {
  active?: boolean
  onToggle?: (event: React.MouseEvent<HTMLButtonElement>, next: boolean) => void
  size?: "sm" | "md" | "lg"
}

const sizeToIcon = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
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
      variant="favorite"
      className={cn("p-0 h-auto w-auto rounded-none", className)}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      onClick={handleClick}
      {...props}
    >
      <svg
        className={cn(sizeToIcon[size])}
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


