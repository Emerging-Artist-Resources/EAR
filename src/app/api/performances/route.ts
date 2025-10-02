import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { performanceSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const validatedData = performanceSchema.parse(body)

    // Allow anonymous submissions - userId can be null
    // Fix timezone issue by creating date in local timezone
    const dateStr = validatedData.date
    const localDate = new Date(dateStr + 'T00:00:00') // Force local timezone interpretation
    
    const performance = await prisma.performance.create({
      data: {
        ...validatedData,
        date: localDate,
        userId: session?.user?.id || null, // Explicitly set to null for anonymous
        status: "PENDING"
      }
    })

    return NextResponse.json(performance, { status: 201 })
  } catch (error) {
    console.error("Performance creation error:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (userId) {
      where.userId = userId
    }

    const performances = await prisma.performance.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: "asc"
      }
    })

    return NextResponse.json(performances)
  } catch (error) {
    console.error("Performance fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
