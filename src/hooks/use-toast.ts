import { useState, useCallback } from "react"

export interface Toast {
  id: string
  message: string
  type?: "success" | "error" | "info" | "warning"
  duration?: number
}

/**
 * Custom hook for managing toast notifications
 * Provides a simple, reusable toast system
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (
      message: string,
      type: Toast["type"] = "info",
      duration = 4000
    ) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = { id, message, type, duration }

      setToasts((prev) => [...prev, newToast])

      // Auto-remove after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)

      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
  }
}
