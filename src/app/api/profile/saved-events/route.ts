import { NextRequest, NextResponse } from "next/server";
import { getSavedEvents } from "@/features/profile/server/service";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "all") as "all" | "upcoming" | "past";

    const events = await getSavedEvents(auth.user.id, { mode });
    
    return NextResponse.json({ data: events });
  } catch (err: unknown) {
    console.error("Get saved events error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

