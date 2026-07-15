/** Calendar deep links only work for listings visible on the public calendar. */
export function isListingPubliclyShareable(status: string | null | undefined): boolean {
  return status === "approved"
}
