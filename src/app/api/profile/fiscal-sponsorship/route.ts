import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import {
  handleApiError,
  createSuccessResponse,
  getOptionalQueryParam,
  getQueryParamNumber,
} from "@/lib/api/utils";
import { getFiscalSponsorshipDashboard } from "@/features/profile/server/service";
import { FISCAL_SPONSORSHIP_DONATIONS_PAGE_SIZE } from "@/features/profile/server/repository";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const page = getQueryParamNumber(request, "page", 0, 0);
    const limit = getQueryParamNumber(
      request,
      "limit",
      FISCAL_SPONSORSHIP_DONATIONS_PAGE_SIZE,
      1,
      FISCAL_SPONSORSHIP_DONATIONS_PAGE_SIZE,
    );
    const dateFrom = getOptionalQueryParam(request, "dateFrom");
    const dateTo = getOptionalQueryParam(request, "dateTo");

    const dashboard = await getFiscalSponsorshipDashboard(auth.user.id, {
      page,
      limit,
      dateFrom,
      dateTo,
    });

    return createSuccessResponse(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
