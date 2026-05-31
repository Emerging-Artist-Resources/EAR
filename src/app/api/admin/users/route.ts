import { NextRequest } from "next/server"
import { listUsers, updateUserRole } from "@/features/users/server/service"
import { requireRole } from "@/lib/auth/helpers"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api/utils"
import { z } from "zod"

const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["USER", "ADMIN"]),
})

export async function GET() {
  try {
    await requireRole("ADMIN")
    const users = await listUsers()
    return createSuccessResponse(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const body = await request.json()
    const { userId, role } = validateRequestBody(body, updateUserRoleSchema)

    const updated = await updateUserRole(userId, role)
    return createSuccessResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
