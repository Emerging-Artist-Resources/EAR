import { NextRequest } from "next/server";
import { listMyListingsRepo, resolveMyListingsPageForListing } from "@/features/events/server/read";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { handleApiError, createSuccessResponse, getQueryParam, getQueryParamNumber } from "@/lib/api/utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    let page = getQueryParamNumber(request, "page", 0, 0);
    const limit = getQueryParamNumber(request, "limit", 5, 1);
    const focusListingId = getQueryParam(request, "focusListingId");

    if (focusListingId) {
      const resolvedPage = await resolveMyListingsPageForListing(focusListingId, limit);
      if (resolvedPage !== null) {
        page = resolvedPage;
      }
    }

    const result = await listMyListingsRepo(page, limit);
    
    return createSuccessResponse({ ...result, page });
  } catch (error) {
    return handleApiError(error);
  }
}
