import ExcelJS from "exceljs"
import type { ReceivedDonationSummary } from "@/features/profile/server/types"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"
import { toDonationExportRow } from "@/lib/donations/donation-export-rows"

const USD_FORMAT = "$#,##0.00"
const DATE_FORMAT = "yyyy-mm-dd hh:mm"

export async function buildDonationsWorkbook(
  donations: ReceivedDonationSummary[],
): Promise<Buffer> {
  const copy = fiscalSponsorshipDashboard.approved
  const columns = copy.donationColumns
  const exportCopy = copy.exportExcel

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Emerging Artist Resources"

  const sheet = workbook.addWorksheet(exportCopy.sheetName)
  sheet.columns = [
    { header: columns.donor, key: "donor", width: 24 },
    { header: columns.email, key: "email", width: 28 },
    { header: columns.date, key: "date", width: 20, style: { numFmt: DATE_FORMAT } },
    { header: columns.amount, key: "amount", width: 14, style: { numFmt: USD_FORMAT } },
    { header: columns.stripeFee, key: "stripeFee", width: 14, style: { numFmt: USD_FORMAT } },
    { header: columns.fiscalFee, key: "fiscalFee", width: 12, style: { numFmt: USD_FORMAT } },
    { header: columns.net, key: "net", width: 14, style: { numFmt: USD_FORMAT } },
    { header: exportCopy.designation, key: "designation", width: 24 },
    { header: exportCopy.message, key: "message", width: 40 },
  ]

  for (const donation of donations) {
    sheet.addRow(toDonationExportRow(donation))
  }

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  sheet.views = [{ state: "frozen", ySplit: 1 }]
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
