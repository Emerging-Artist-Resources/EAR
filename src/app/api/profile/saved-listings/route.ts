import { NextRequest } from "next/server";
import { saveListing, checkListingSaved } from "@/features/profile/server/service";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { handleApiError, createSuccessResponse, validateRequestBody, getQueryParam } from "@/lib/api-utils";
import { saveListingSchema } from "@/lib/validations/profile";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const body = await request.json();
    const { listingId } = validateRequestBody(body, saveListingSchema);

    const savedListing = await saveListing(auth.user.id, listingId);
    
    return createSuccessResponse({
      id: savedListing.id,
      listingId: savedListing.listing_id,
      saved_at: savedListing.saved_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const listingId = getQueryParam(request, "listingId");
    if (!listingId) {
      return handleApiError(new Error("listingId query parameter is required"));
    }

    const isSaved = await checkListingSaved(auth.user.id, listingId);
    
    return createSuccessResponse(isSaved);
  } catch (error) {
    return handleApiError(error);
  }
}
