import { NextRequest } from "next/server"
import { listAdminEvents } from "@/features/events/server/service"
import { requireRole, hasRole } from "@/lib/auth/helpers"
import { parseAdminListingDateBasis } from "@/lib/admin/listing-date-filter"
import {
  handleApiError,
  createSuccessResponse,
  getQueryParam,
  getQueryParamNumber,
  ErrorCodes,
  createErrorResponse,
} from "@/lib/api/utils"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole("REVIEWER")

    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", undefined, 403)
    }

    const status = (getQueryParam(req, "status") || "pending").toLowerCase() as
      | "pending"
      | "approved"
      | "rejected"
    if (!["pending", "approved", "rejected"].includes(status)) {
      return createErrorResponse(ErrorCodes.BAD_REQUEST, "Invalid status parameter", undefined, 400)
    }

    const limit = getQueryParamNumber(req, "limit", 50, 1, 100)
    const dateFrom = getQueryParam(req, "dateFrom")
    const dateTo = getQueryParam(req, "dateTo")
    const dateBasis = parseAdminListingDateBasis(getQueryParam(req, "dateBasis"))

    const items = await listAdminEvents(status, limit, { dateFrom, dateTo, dateBasis })
    return createSuccessResponse(items)
  } catch (error) {
    return handleApiError(error)
  }
}
