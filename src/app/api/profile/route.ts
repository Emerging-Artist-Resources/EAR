import { NextRequest, NextResponse } from "next/server";
import { getProfileRepo, updateProfileRepo } from "@/features/profile/server/repository";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
  createErrorResponse,
  ErrorCodes,
} from "@/lib/api/utils";
import { updateProfileSchema } from "@/lib/validations/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

    const existing = await getProfileRepo(auth.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { slug: requestedSlug, ...rest } = updates;
    const patchPayload: Parameters<typeof updateProfileRepo>[1] = { ...rest };

    if (requestedSlug !== undefined) {
      if (existing.slug) {
        return createErrorResponse(
          ErrorCodes.BAD_REQUEST,
          "Your public donation link cannot be changed once it is set",
          undefined,
          400,
        );
      }
      const normalized = requestedSlug.trim().toLowerCase();
      const supabase = await getSupabaseServerClient();
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", normalized)
        .neq("id", auth.user.id)
        .maybeSingle();

      if (taken) {
        return createErrorResponse(ErrorCodes.BAD_REQUEST, "That URL is already taken", undefined, 409);
      }

      patchPayload.slug = normalized;
    }

    const updatedProfile = await updateProfileRepo(auth.user.id, patchPayload);
    
    return createSuccessResponse(updatedProfile);
  } catch (error) {
    return handleApiError(error);
  }
}