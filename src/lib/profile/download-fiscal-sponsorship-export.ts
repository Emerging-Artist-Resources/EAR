import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"
import { buildDonationExportFileName } from "@/lib/donations/donation-export-rows"
import {
  readDonationExportMeta,
  type DonationExportMeta,
} from "@/lib/donations/donation-export-meta"
import { triggerBlobDownload } from "@/lib/downloads/trigger-blob-download"
import { fiscalSponsorshipExportPath } from "@/lib/profile/fiscal-sponsorship-query"

const exportCopy = fiscalSponsorshipDashboard.approved.exportExcel

export function formatDonationExportTruncatedToast(meta: DonationExportMeta): string {
  return exportCopy.truncatedToast
    .replaceAll("{rowCount}", String(meta.rowCount))
    .replaceAll("{totalCount}", String(meta.totalCount))
}

async function readExportErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } }
    const message = body.error?.message?.trim()
    if (message) return message
  } catch {
    // Non-JSON error body — fall through to the generic copy.
  }
  return exportCopy.errorToast
}

/**
 * Fetch the Excel export, reject non-2xx before reading the body as a file,
 * then save the blob locally. Returns truncation metadata for UI toasts.
 */
export async function downloadFiscalSponsorshipExport(options: {
  dateFrom?: string
  dateTo?: string
}): Promise<DonationExportMeta> {
  const response = await fetch(fiscalSponsorshipExportPath(options), {
    method: "GET",
    credentials: "same-origin",
  })

  if (!response.ok) {
    throw new Error(await readExportErrorMessage(response))
  }

  const meta = readDonationExportMeta(response.headers)
  const blob = await response.blob()
  triggerBlobDownload(blob, buildDonationExportFileName(options.dateFrom, options.dateTo))
  return meta
}
