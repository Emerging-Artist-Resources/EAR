import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import { handleApiError, getOptionalQueryParam } from "@/lib/api/utils"
import { exportFiscalSponsorshipDonations } from "@/features/profile/server/service"

const EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return handleApiError(new Error("Unauthorized"))
    }

    const { bytes, fileName } = await exportFiscalSponsorshipDonations(auth.user.id, {
      dateFrom: getOptionalQueryParam(request, "dateFrom"),
      dateTo: getOptionalQueryParam(request, "dateTo"),
    })

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": EXCEL_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
