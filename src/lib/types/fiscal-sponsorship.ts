/**
 * Matches DB `profiles.fiscal_sponsorship_status` (Postgres enum / app union).
 * Shared domain type — import from here in server, API, and UI; avoid coupling server to `components/admin`.
 */
export type FiscalSponsorshipStatus = "none" | "pending" | "approved" | "paused" | "revoked"
