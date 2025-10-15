export const PERFORMANCE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const

export const REVIEW_STATUS = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const

export const NOTIFICATION_TYPE = {
  INFO: "INFO",
  WARNING: "WARNING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
} as const

export const ROUTES = {
  HOME: "/",
  CALENDAR: "/calendar",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  NOTIFICATIONS: "/notifications",
  ADMIN_NOTIFICATIONS: "/admin/notifications",
  SIGN_IN: "/auth/signin",
  SIGN_UP: "/auth/signup",
} as const

export const API_ENDPOINTS = {
  PERFORMANCES: "/api/performances",
  NOTIFICATIONS: "/api/announcements",
  ADMIN_REVIEWS: "/api/admin/reviews",
  ADMIN_USERS: "/api/admin/users",
  AUTH_REGISTER: "/api/auth/register",
  AUTH_SIGNOUT: "/api/auth/signout",
} as const

export function getStatusColor(status: string) {
  switch (status) {
    case PERFORMANCE_STATUS.PENDING:
      return "warning"
    case PERFORMANCE_STATUS.APPROVED:
      return "success"
    case PERFORMANCE_STATUS.REJECTED:
      return "error"
    default:
      return "default"
  }
}

export function getNotificationTypeColor(type: string) {
  switch (type) {
    case NOTIFICATION_TYPE.INFO:
      return "info"
    case NOTIFICATION_TYPE.WARNING:
      return "warning"
    case NOTIFICATION_TYPE.SUCCESS:
      return "success"
    case NOTIFICATION_TYPE.ERROR:
      return "error"
    default:
      return "default"
  }
}

export function formatDate(date: string | Date) {
  const dateObj = new Date(date)
  // Use toLocaleDateString with explicit options to avoid timezone issues
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Display in UTC to match stored date
  })
}

export function formatDateTime(date: string | Date, time?: string | null) {
  const dateStr = formatDate(date)
  return time ? `${dateStr} at ${time}` : dateStr
}

export function formatDateForInput(date: string | Date) {
  const dateObj = new Date(date)
  // Format as YYYY-MM-DD for input fields
  return dateObj.toISOString().split('T')[0]
}

export function isAdmin(userRole?: string) {
  return userRole === USER_ROLES.ADMIN
}

export function isUser(userRole?: string) {
  return userRole === USER_ROLES.USER
}
