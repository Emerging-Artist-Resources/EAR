import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
export const revalidate = 60
import { listAnnouncements } from "@/features/announcements/server/service"

type Announcement = {
  id: string
  title: string
  content: string
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  published_at?: string | null
  created_at?: string | null
}

function typeVariant(type?: string) {
  switch (type) {
    case 'WARNING':
      return 'warning'
    case 'SUCCESS':
      return 'success'
    case 'ERROR':
      return 'error'
    default:
      return 'default'
  }
}

async function getAnnouncements(): Promise<Announcement[]> {
  const data = await listAnnouncements()
  return (data as Announcement[]) ?? []
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements()
  

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Announcements</h2>

          <Card className="p-6">
            {announcements.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No announcements at this time.</div>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{a.title}</h3>
                          <Badge variant={typeVariant(a.type)}>{a.type ?? 'INFO'}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{a.content}</p>
                      </div>
                      {(a.published_at || a.created_at) && (
                        <div className="text-xs text-gray-500 min-w-[140px] text-right">
                          {(a.published_at || a.created_at) && new Date(a.published_at ?? a.created_at as string).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}


