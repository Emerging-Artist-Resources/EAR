import { ROUTES } from "@/lib/constants"

export type ContentPadding = "none" | "admin" | "dashboard" | "standard"

export type AppLayoutMode =
  | { type: "admin"; sidebar: "admin"; contentPadding: ContentPadding }
  | { type: "dashboard"; sidebar: "dashboard"; contentPadding: "dashboard" }
  | { type: "calendar"; contentPadding: "none" }
  | { type: "fullBleed"; contentPadding: "none" }
  | { type: "bare"; contentPadding: "none" }
  | { type: "default"; contentPadding: "standard" }

type UserRole = "ADMIN" | "REVIEWER" | "EDITOR" | "USER" | undefined

function getAdminContentPadding(path: string): ContentPadding {
  if (path === ROUTES.HOME || path.startsWith("/calendar")) return "none"
  if (path.startsWith("/admin")) return "admin"
  return "standard"
}

export function getAppLayoutMode(
  pathname: string | null,
  role: UserRole
): AppLayoutMode {
  const path = pathname ?? ""

  if (path.startsWith("/auth") || path.startsWith("/donate")) {
    return { type: "bare", contentPadding: "none" }
  }

  if (path.startsWith(ROUTES.PROFILE)) {
    return { type: "dashboard", sidebar: "dashboard", contentPadding: "dashboard" }
  }

  if (role === "ADMIN") {
    return {
      type: "admin",
      sidebar: "admin",
      contentPadding: getAdminContentPadding(path),
    }
  }

  if (path === ROUTES.HOME) {
    return { type: "fullBleed", contentPadding: "none" }
  }

  if (path.startsWith("/calendar")) {
    return { type: "calendar", contentPadding: "none" }
  }

  return { type: "default", contentPadding: "standard" }
}
