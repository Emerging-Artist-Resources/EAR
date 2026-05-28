/**
 * Donation funnel routes use no global header/footer (see header-gate / footer-gate).
 * Uses exact `/donate` or `/donate/...` so paths like `/donate-later` are not matched.
 */
export function isDonationFunnelPath(pathname: string): boolean {
  if (pathname === "/donate" || pathname.startsWith("/donate/")) return true
  if (pathname.startsWith("/donations/")) return true
  return false
}
