import { readFile } from "fs/promises"
import path from "path"
import type { PDFDocument, PDFImage } from "pdf-lib"

/** Public URL path (matches {@link MIGNOLO_PDF_LOGO_FILE_NAME} under `public/logos/mignolo/`). */
export const MIGNOLO_PDF_LOGO_SRC = "/logos/mignolo/mignolo-logo.png"

const MIGNOLO_PDF_LOGO_FILE_NAME = "mignolo-logo.png"

export function getMignoloPdfLogoFilePath(): string {
  return path.join(process.cwd(), "public", "logos", "mignolo", MIGNOLO_PDF_LOGO_FILE_NAME)
}

export async function readMignoloPdfLogoBytes(): Promise<Uint8Array | null> {
  try {
    return await readFile(getMignoloPdfLogoFilePath())
  } catch {
    return null
  }
}

export async function embedMignoloPdfLogo(doc: PDFDocument): Promise<PDFImage | null> {
  const bytes = await readMignoloPdfLogoBytes()
  if (!bytes) return null
  try {
    return await doc.embedPng(bytes)
  } catch {
    return null
  }
}

/**
 * Max logo height in PDF points (1/72 inch).
 * Shorter than the EAR mark (50pt) so the wide wordmark matches the donation page proportion.
 */
export const MIGNOLO_PDF_LOGO_MAX_HEIGHT = 30

export function scaleMignoloPdfLogoSize(
  logo: PDFImage,
  maxHeight = MIGNOLO_PDF_LOGO_MAX_HEIGHT,
): { width: number; height: number } {
  const scale = maxHeight / logo.height
  return {
    width: logo.width * scale,
    height: logo.height * scale,
  }
}
