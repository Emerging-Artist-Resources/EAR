export type AdminStatus = "PENDING" | "APPROVED" | "REJECTED"

export type EventType = "performance" | "audition" | "creative" | "class" | "funding"

export interface AdminEventItem {
  id: string
  type: EventType
  status: "pending" | "approved" | "rejected"
  submitted_at: string
  title: string | null
}

export type AdminEventDetail = {
  id: string
  type: EventType
  status: "pending" | "approved" | "rejected"
  submitted_at: string
  contact_name?: string
  pronouns?: string | null
  contact_email?: string
  org_name?: string | null
  org_website?: string | null
  address?: string | null
  borough?: string | null
  social_handles?: Record<string, string> | null
  notes?: string | null
  meta?: Record<string, unknown> | null
  event_occurrences?: Array<{ id: string; starts_at_utc: string; tz: string }>
  event_photos?: Array<{ id: string; path: string; credit?: string | null }>
  performance_details?: {
    show_name?: string
    short_description?: string
    credit_info?: string
    ticket_link?: string
    ticket_price_cents?: number
    agree_comp_tickets?: boolean
  } | null
  audition_details?: {
    audition_name?: string
    about_project?: string
    eligibility?: string
    compensation?: string
    audition_link?: string
  } | null
  opportunity_details?: {
    opportunity_name?: string
    brief_description?: string
    eligibility?: string
    whats_offered?: string
    stipend_amount?: string
    requirements?: string
    deadline?: string
    apply_link?: string
  } | null
  class_details?: {
    class_name?: string
    description?: string
    prices?: Array<{ label?: string; amount_cents?: number }>
    rrule?: string | null
    festival_name?: string | null
    festival_link?: string | null
  } | null
  funding_details?: {
    title?: string
    summary?: string
    funding_link?: string
  } | null
}

export const TYPE_BADGE: Record<EventType, string> = {
  performance: "bg-[var(--primary-100)] text-[var(--primary-700)]",
  audition: "bg-[var(--warning-50)] text-[var(--warning-600)]",
  creative: "bg-[var(--secondary-50)] text-[var(--primary-700)]",
  class: "bg-[var(--success-50)] text-[var(--success-600)]",
  funding: "bg-[var(--gray-100)] text-[var(--gray-700)]",
}

export const STATUS_BADGE: Record<AdminEventItem["status"], string> = {
  pending: "bg-[var(--warning-50)] text-[var(--warning-600)]",
  approved: "bg-[var(--success-50)] text-[var(--success-600)]",
  rejected: "bg-[var(--error-50)] text-[var(--error-600)]",
}
