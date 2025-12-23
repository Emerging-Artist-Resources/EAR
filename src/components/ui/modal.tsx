import React from "react"
import { cn } from "@/lib/utils"
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
}) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        // replacement for variants.modal.overlay
        "fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-[9999] overflow-y-auto"
      )}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          // replacement for variants.modal.content
          "w-full bg-background rounded-md shadow-lg border border-border my-auto",
          "max-h-[90vh] flex flex-col",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "relative flex-shrink-0 px-6 py-4 flex items-center justify-center rounded-t-md",
            headerClassName ?? "bg-primary text-white"
          )}
        >
          <H2 className="text-center text-white">{title}</H2>

          {showCloseButton && (
            <Button
              aria-label="Close"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </div>
  )
}
