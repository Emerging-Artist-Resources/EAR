import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { performanceId, status, comments } = await request.json()

    if (!performanceId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const performance = await prisma.performance.findUnique({
      where: { id: performanceId }
    })

    if (!performance) {
      return NextResponse.json(
        { error: "Performance not found" },
        { status: 404 }
      )
    }

    const review = await prisma.review.create({
      data: {
        performanceId,
        status,
        comments: comments || null,
        reviewerId: session.user.id
      }
    })

    await prisma.performance.update({
      where: { id: performanceId },
      data: {
        status: status === "APPROVED" ? "APPROVED" : "REJECTED"
      }
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
