import { readFile } from "fs/promises"
import path from "path"
import type { PDFDocument, PDFImage } from "pdf-lib"

/** Public URL path (matches {@link EAR_PDF_LOGO_FILE_NAME} under `public/EAR-Logos/`). */
export const EAR_PDF_LOGO_SRC = "/EAR-Logos/EAR LOGOS-09.png"

const EAR_PDF_LOGO_FILE_NAME = "EAR LOGOS-09.png"

export function getEarPdfLogoFilePath(): string {
  return path.join(process.cwd(), "public", "EAR-Logos", EAR_PDF_LOGO_FILE_NAME)
}

export async function readEarPdfLogoBytes(): Promise<Uint8Array | null> {
  try {
    return await readFile(getEarPdfLogoFilePath())
  } catch {
    return null
  }
}

export async function embedEarPdfLogo(doc: PDFDocument): Promise<PDFImage | null> {
  const bytes = await readEarPdfLogoBytes()
  if (!bytes) return null
  try {
    return await doc.embedPng(bytes)
  } catch {
    return null
  }
}

/** Max logo height in PDF points (1/72 inch). */
export const EAR_PDF_LOGO_MAX_HEIGHT = 62

/** Vertical gap between logo bottom and title baseline (stacked header). */
export const EAR_PDF_LOGO_TITLE_GAP = 38

export function scaleEarPdfLogoSize(
  logo: PDFImage,
  maxHeight = EAR_PDF_LOGO_MAX_HEIGHT,
): { width: number; height: number } {
  const scale = maxHeight / logo.height
  return {
    width: logo.width * scale,
    height: logo.height * scale,
  }
}
