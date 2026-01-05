import { NextResponse } from "next/server";
import { getProfileRepo } from "@/features/profile/server/repository";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

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

