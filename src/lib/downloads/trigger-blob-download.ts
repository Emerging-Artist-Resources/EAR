/**
 * Trigger a browser file download from an in-memory Blob.
 * Call only after a successful response (never on error JSON bodies).
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = fileName
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}
