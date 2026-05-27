import { NextRequest, NextResponse } from "next/server"
import { getAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/features/announcements/server/service"
import { requireRole } from "@/lib/auth-helpers"
import { createSuccessResponse, handleApiError } from "@/lib/api-utils"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const data = await getAnnouncement(params.id)
    if (!data) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
    }
    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const params = await context.params

    const body = await request.json()
    const data = await updateAnnouncement(params.id, body)
    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const params = await context.params

    await deleteAnnouncement(params.id)
    return createSuccessResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
