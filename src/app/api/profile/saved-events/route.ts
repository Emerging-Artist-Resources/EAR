import { NextRequest } from "next/server";
import { getSavedEvents } from "@/features/profile/server/service";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { handleApiError, createSuccessResponse, getQueryParam } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const mode = (getQueryParam(request, "mode", "all") || "all") as "all" | "upcoming" | "past";

    const events = await getSavedEvents(auth.user.id, { mode });
    
    return createSuccessResponse(events);
  } catch (error) {
    return handleApiError(error);
  }
}

