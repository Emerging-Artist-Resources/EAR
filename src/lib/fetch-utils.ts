/**
 * Utilities for making API requests with proper error handling and type safety
 */

import type { ApiResponse } from "./api-utils"

let sessionExpiredModalShown = false

function notifySessionExpired() {
  if (typeof window === "undefined" || sessionExpiredModalShown) return

  if (window.location.pathname.startsWith("/auth/signin")) return

  const next = `${window.location.pathname}${window.location.search}`
  sessionExpiredModalShown = true

  window.dispatchEvent(
    new CustomEvent("app:session-expired", {
      detail: { next },
    })
  )
}

export function resetSessionExpiredModalFlag() {
  sessionExpiredModalShown = false
}

/**
 * Type-safe fetch wrapper that handles API responses
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiResponse
    if (response.status === 401) {
      notifySessionExpired()
    }
    throw new Error(
      errorData.error?.message || errorData.error?.code || `HTTP ${response.status}`
    )
  }

  const data = (await response.json()) as ApiResponse<T>
  return (data.data ?? data) as T
}

/**
 * Type-safe POST request helper
 */
export async function apiPost<T = unknown>(
  url: string,
  body: unknown,
  options?: Omit<RequestInit, "method" | "body">
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  })
}

/**
 * Type-safe GET request helper
 */
export async function apiGet<T = unknown>(
  url: string,
  options?: Omit<RequestInit, "method">
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: "GET",
  })
}

/**
 * Type-safe PATCH request helper
 */
export async function apiPatch<T = unknown>(
  url: string,
  body: unknown,
  options?: Omit<RequestInit, "method" | "body">
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

/**
 * Type-safe PUT request helper
 */
export async function apiPut<T = unknown>(
  url: string,
  body: unknown,
  options?: Omit<RequestInit, "method" | "body">
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  })
}

/**
 * Type-safe DELETE request helper
 */
export async function apiDelete<T = unknown>(
  url: string,
  options?: Omit<RequestInit, "method">
): Promise<T> {
  return apiFetch<T>(url, {
    ...options,
    method: "DELETE",
  })
}
