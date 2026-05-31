import { NextResponse } from "next/server";
import { getEligibilitySubmissionsRepo } from "@/features/profile/server/repository";
import { getAuthenticatedUser } from "@/lib/auth/helpers";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await getEligibilitySubmissionsRepo(auth.user.id);
    
    return NextResponse.json({ data: submissions });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorDetails = err instanceof Error ? err.stack : undefined;
    console.error("Get eligibility submissions error:", errorMessage, errorDetails);
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

