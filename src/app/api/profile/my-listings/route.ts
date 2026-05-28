import { NextRequest } from "next/server";
import { listMyListingsRepo } from "@/features/events/server/read";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { handleApiError, createSuccessResponse, getQueryParamNumber } from "@/lib/api/utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const page = getQueryParamNumber(request, "page", 0, 0);
    const limit = getQueryParamNumber(request, "limit", 5, 1);

    const result = await listMyListingsRepo(page, limit);
    
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
