import { NextRequest } from "next/server";
import { getActivityOverview } from "@/features/profile/server/service";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { handleApiError, createSuccessResponse } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const overview = await getActivityOverview(auth.user.id);
    
    return createSuccessResponse(overview);
  } catch (error) {
    return handleApiError(error);
  }
}
