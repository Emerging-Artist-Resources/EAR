import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import { handleApiError, getOptionalQueryParam } from "@/lib/api/utils"
import { exportFiscalSponsorshipDonations } from "@/features/profile/server/service"
import { donationExportMetaHeaders } from "@/lib/donations/donation-export-meta"

const EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return handleApiError(new Error("Unauthorized"))
    }

    const { bytes, fileName, rowCount, totalCount, truncated } =
      await exportFiscalSponsorshipDonations(auth.user.id, {
        dateFrom: getOptionalQueryParam(request, "dateFrom"),
        dateTo: getOptionalQueryParam(request, "dateTo"),
      })

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": EXCEL_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
        ...donationExportMetaHeaders({ truncated, rowCount, totalCount }),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
