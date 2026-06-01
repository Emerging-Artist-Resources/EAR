import React, { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { resetModalFormView } from "@/lib/forms/reset-scroll-ancestors"
import { Button } from "./button"
import { H2 } from "./typography"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  showCloseButton?: boolean
  closeOnOverlay?: boolean
  headerClassName?: string
  /** Extra classes on the modal title (e.g. font-title for performance listings). */
  titleClassName?: string
  /** Replaces default `bg-background border-border` on the dialog panel (e.g. light cream shell). */
  contentClassName?: string
  /** Extra classes on the full-screen overlay (e.g. higher z-index for nested modals). */
  overlayClassName?: string
  /**
   * CSS vars to apply to the modal "chrome" layer (overlay root), allowing per-type
   * theming of header background/spinner colors without changing every className.
   */
  chromeStyle?: React.CSSProperties
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlay = true,
  headerClassName,
  titleClassName,
  contentClassName,
  overlayClassName,
  chromeStyle,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null)
  const focusSentinelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!isOpen) return
    resetModalFormView(bodyRef.current, focusSentinelRef.current)
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        "modal-chrome fixed inset-0 bg-ear-black/70 backdrop-blur-[1px] flex items-start justify-center p-2 sm:p-4 z-[9999] overflow-hidden",
        overlayClassName,
      )}
      style={chromeStyle}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          "w-full min-w-0 rounded-md shadow-lg border max-h-[90vh] flex flex-col",
          sizeClasses[size],
          contentClassName ?? "bg-surface-modal-warm border-border"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "relative flex-shrink-0 px-6 py-4 flex items-center justify-center rounded-t-md",
            headerClassName ?? "bg-primary text-primary-foreground"
          )}
        >
          <H2
            className={cn(
              "m-0 text-center leading-none text-primary-foreground",
              showCloseButton && "px-11",
              titleClassName,
            )}
          >
            {title}
          </H2>

          {showCloseButton && (
            <Button
              aria-label="Close"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-2 top-2 text-ear-off-white hover:bg-transparent active:bg-transparent dark:hover:bg-transparent hover:text-ear-off-white/80"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div
            ref={focusSentinelRef}
            tabIndex={-1}
            aria-hidden
            className="sr-only outline-none"
          />
          <div className="relative z-10 min-w-0 max-w-full">{children}</div>
        </div>
      </div>
    </div>
  )
}
