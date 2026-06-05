/**
 * Supabase auth errors may arrive in the query string or URL hash (implicit flow).
 */
export function getSupabaseAuthErrorParams(url: URL): URLSearchParams | null {
  const hasErrorFields = (params: URLSearchParams) =>
    Boolean(
      params.get("error") ||
        params.get("error_code") ||
        params.get("error_description")
    )

  if (hasErrorFields(url.searchParams)) {
    return url.searchParams
  }

  const hashRaw = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
  if (!hashRaw) return null

  const hashParams = new URLSearchParams(hashRaw)
  return hasErrorFields(hashParams) ? hashParams : null
}

export function getHashAuthParams(url: URL): URLSearchParams | null {
  const hashRaw = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
  if (!hashRaw) return null
  return new URLSearchParams(hashRaw)
}
