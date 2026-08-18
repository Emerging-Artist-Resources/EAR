/**
 * Cache-Control for GET /api/calendar/listing/[id].
 *
 * Do not use a shared CDN / reverse-proxy cache for this response:
 *
 * 1. Owners can receive pending (and other non-public) listings for preview.
 *    A `public` cache is not keyed by auth, so an owner 200 can be replayed to
 *    signed-out visitors.
 * 2. Resubmitting an approved listing demotes it to pending. The share URL
 *    stays the same, so a cached approved 200 would keep the deep link open
 *    until the TTL (and stale-while-revalidate window) expired.
 *
 * Listing detail is a one-off modal fetch; the calendar grid endpoints remain
 * the place for shared caching.
 */
export const LISTING_DETAIL_CACHE_CONTROL = "private, no-store" as const
