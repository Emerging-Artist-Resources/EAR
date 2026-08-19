import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import { handleApiError } from "@/lib/api/utils"
import { getDonationReceiptPdf } from "@/features/profile/server/service"

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return handleApiError(new Error("Unauthorized"))
    }

    const { id } = await ctx.params
    const { bytes, fileName } = await getDonationReceiptPdf(auth.user.id, id)

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
