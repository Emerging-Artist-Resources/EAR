import React from "react"
import { cn } from "@/lib/utils"
import { variants } from "@/lib/utils"
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
      className={variants.modal.overlay} 
      onClick={handleOverlayClick}
      style={{ zIndex: 9999 }}
    >
      <div 
        className={cn(variants.modal.content, sizeClasses[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header strip with customizable background */}
          <div
            className={cn(
              "relative -mx-6 -mt-6 mb-6 px-6 py-4 flex items-center justify-center rounded-t-md",
              // default header styling if none provided
              headerClassName ?? "bg-primary text-white"
            )}
          >
            <H2 className="text-center text-white">{title}</H2>
            {showCloseButton && (
              <Button
                aria-label="Close"
                variant="simple"
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
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
