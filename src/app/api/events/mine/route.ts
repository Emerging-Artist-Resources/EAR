// src/app/api/events/mine/route.ts
import { NextResponse } from "next/server"
import { listMyEventsRepo } from "@/features/events/server/repository"

export async function GET() {
  try {
    const data = await listMyEventsRepo()
    return NextResponse.json(data)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("List mine error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
