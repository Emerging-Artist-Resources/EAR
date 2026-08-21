/** MIME types the browser can reliably decode for crop/compress. */
const SUPPORTED_WEB_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

const HEIC_LIKE_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
])

const SUPPORTED_EXTENSION_PATTERN = /\.(jpe?g|png|webp)$/i
const HEIC_EXTENSION_PATTERN = /\.hei[cf]$/i

/** True for HEIC/HEIF (iPhone default camera format) — not supported in our crop/compress pipeline. */
export function isHeicLikeImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (HEIC_LIKE_TYPES.has(type)) return true
  return HEIC_EXTENSION_PATTERN.test(file.name)
}

/**
 * True when the file is a JPEG/PNG/WebP we expect HTML Image + canvas to handle.
 * Empty MIME is allowed when the extension is a supported type.
 */
export function isSupportedWebImageFile(file: File): boolean {
  if (isHeicLikeImageFile(file)) return false

  const type = file.type.toLowerCase()
  if (SUPPORTED_WEB_IMAGE_TYPES.has(type)) return true

  if (!type || type === "application/octet-stream") {
    return SUPPORTED_EXTENSION_PATTERN.test(file.name)
  }

  return false
}

/** `accept` value that steers the file picker toward supported formats. */
export const SUPPORTED_WEB_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
