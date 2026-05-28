import { NextRequest } from "next/server";
import { unsaveListing, updateAttendanceStatus } from "@/features/profile/server/service";
import { getAuthenticatedUser } from "@/lib/auth/helpers";
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api/utils";
import { updateAttendanceSchema } from "@/lib/validations/profile";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ listingId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const { listingId } = await ctx.params;
    await unsaveListing(auth.user.id, listingId);
    
    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ listingId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return handleApiError(new Error("Unauthorized"));
    }

    const { listingId } = await ctx.params;
    const body = await request.json();
    const { attendanceStatus } = validateRequestBody(body, updateAttendanceSchema);

    const updated = await updateAttendanceStatus(auth.user.id, listingId, attendanceStatus);
    
    return createSuccessResponse({
      id: updated.id,
      attendance_status: updated.attendance_status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
