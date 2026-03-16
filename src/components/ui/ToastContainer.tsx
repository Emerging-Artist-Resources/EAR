"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useToast } from "@/contexts/ToastContext"
import { cn } from "@/lib/utils"

export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toastContainer = (
    <div
      className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm w-full"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )

  return createPortal(toastContainer, document.body)
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  const typeStyles = {
    success: "bg-green-500 text-white border-green-600",
    error: "bg-red-500 text-white border-red-600",
    info: "bg-blue-500 text-white border-blue-600",
    warning: "bg-yellow-500 text-white border-yellow-600",
  }

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg shadow-lg border flex items-start gap-3 transition-all duration-300",
        typeStyles[toast.type || "info"],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
      role="alert"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

type Toast = {
  id: string
  message: string
  type?: "success" | "error" | "info" | "warning"
  duration?: number
}
