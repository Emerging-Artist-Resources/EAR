export interface IsRouteActiveOptions {
  exact?: boolean
}

/**
 * Returns whether `pathname` matches a nav `href`.
 * Use `exact: true` for section roots (e.g. `/profile`, `/admin`) so nested routes don't highlight the parent.
 */
export function isRouteActive(
  pathname: string,
  href: string,
  options?: IsRouteActiveOptions
): boolean {
  const normalizedPath = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname
  const normalizedHref = href.endsWith("/") && href.length > 1
    ? href.slice(0, -1)
    : href

  if (options?.exact) {
    return normalizedPath === normalizedHref
  }

  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(`${normalizedHref}/`)
  )
}
