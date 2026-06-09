"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export const headerDropdownMenuClass =
  "rounded-md border border-border-default bg-surface-panel py-1 text-text-primary shadow-lg"

export const headerDropdownMenuItemClass =
  "h-auto w-full justify-start rounded-none px-4 py-2 text-sm font-normal"

const CLOSE_DELAY_MS = 150

type HeaderDropdownTriggerProps = {
  isOpen: boolean
  toggle: () => void
}

interface HeaderHoverDropdownProps {
  trigger: ReactNode | ((props: HeaderDropdownTriggerProps) => ReactNode)
  children: ReactNode
  align?: "left" | "center" | "right"
  menuClassName?: string
  className?: string
}

/** Opens on trigger hover or click; closes on outside click, Escape, or menu item selection. */
export function HeaderHoverDropdown({
  trigger,
  children,
  align = "center",
  menuClassName,
  className,
}: HeaderHoverDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const open = () => {
    clearCloseTimer()
    setIsOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS)
  }

  const toggle = () => {
    clearCloseTimer()
    setIsOpen((prev) => !prev)
  }

  const close = () => {
    clearCloseTimer()
    setIsOpen(false)
  }

  useEffect(() => () => clearCloseTimer(), [])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const triggerNode =
    typeof trigger === "function" ? trigger({ isOpen, toggle }) : trigger

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex flex-col items-center", className)}
    >
      <div onMouseEnter={open} onMouseLeave={scheduleClose}>
        {triggerNode}
      </div>

      <div
        className={cn(
          "absolute top-full z-50 pt-1",
          align === "center" && "left-1/2 min-w-[12rem] -translate-x-1/2",
          align === "right" && "right-0 min-w-[10rem]",
          align === "left" && "left-0 min-w-[12rem]",
          !isOpen && "pointer-events-none",
        )}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div
          className={cn(
            headerDropdownMenuClass,
            "transition-[opacity,visibility] duration-150",
            isOpen ? "visible opacity-100" : "invisible opacity-0",
            menuClassName,
          )}
          role="menu"
          onClick={close}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
