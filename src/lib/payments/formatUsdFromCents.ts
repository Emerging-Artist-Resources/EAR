export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Dollar amount for spreadsheets (numeric, not a formatted string). */
export function centsToUsdAmount(cents: number): number {
  return cents / 100;
}
