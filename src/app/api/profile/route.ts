import { NextRequest, NextResponse } from "next/server";
import { getProfileRepo, updateProfileRepo } from "@/features/profile/server/repository";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileRepo(auth.user.id);
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ data: profile });
  } catch (err: unknown) {
    console.error("Get profile error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates = validateRequestBody(body, updateProfileSchema);

    const updatedProfile = await updateProfileRepo(auth.user.id, updates);
    
    return createSuccessResponse(updatedProfile);
  } catch (error) {
    return handleApiError(error);
  }
}