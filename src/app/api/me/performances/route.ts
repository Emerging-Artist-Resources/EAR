// import { NextRequest, NextResponse } from "next/server"
// import { getSupabaseServerClient } from "@/lib/supabase/server"
// import { listPerformances } from "@/features/events/server/service"
// import { z } from "zod"

// export async function GET(request: NextRequest) {
//   try {
//     const supabase = await getSupabaseServerClient()
//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })

//     const listQuery = z.object({
//       status: z.enum(['PENDING','APPROVED','REJECTED']).optional(),
//       limit: z.coerce.number().int().min(1).max(100).default(20),
//       cursor: z.string().optional(),
//     })
//     const q = listQuery.parse(Object.fromEntries(new URL(request.url).searchParams))

//     const result = await listPerformances({
//       status: q.status,
//       limit: q.limit,
//       cursor: q.cursor ?? null,
//       userId: user.id,
//     })
//     return NextResponse.json({ data: result.items, nextCursor: result.nextCursor })
//   } catch (error) {
//     console.error('My performances fetch error:', error)
//     return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//   }
// }


