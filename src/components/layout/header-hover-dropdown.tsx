"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export const headerDropdownMenuClass =
  "rounded-md border border-border-default bg-surface-panel py-1 text-text-primary shadow-lg"

export const headerDropdownMenuItemClass =
  "h-auto w-full justify-start rounded-none px-4 py-2 text-sm font-normal"

interface HeaderHoverDropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: "left" | "center" | "right"
  menuClassName?: string
  className?: string
}

/** Opens on hover; clicking the trigger collapses the menu (does not stay open). */
export function HeaderHoverDropdown({
  trigger,
  children,
  align = "center",
  menuClassName,
  className,
}: HeaderHoverDropdownProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [suppressOpen, setSuppressOpen] = useState(false)
  const isOpen = isHovered && !suppressOpen

  return (
    <div
      className={cn("group relative inline-flex flex-col items-center", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setSuppressOpen(false)
      }}
    >
      <div
        className="relative inline-flex flex-col items-center"
        onClick={() => setSuppressOpen(true)}
      >
        {trigger}
      </div>

      <div
        className={cn(
          "absolute top-full z-50 pt-1",
          align === "center" && "left-1/2 min-w-[12rem] -translate-x-1/2",
          align === "right" && "right-0 min-w-[10rem]",
          align === "left" && "left-0 min-w-[12rem]"
        )}
      >
        <div
          className={cn(
            headerDropdownMenuClass,
            "transition-[opacity,visibility] duration-150",
            isOpen ? "visible opacity-100" : "invisible opacity-0",
            menuClassName
          )}
          role="menu"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
