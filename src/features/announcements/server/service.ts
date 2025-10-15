import {
  listAnnouncementsRepo,
  getAnnouncementRepo,
  createAnnouncementRepo,
  updateAnnouncementRepo,
  deleteAnnouncementRepo,
  listAnnouncementsRepoAdmin,
} from "./repository"
import { notificationSchema } from "@/lib/validations"

export async function listAnnouncements() {
  const data = await listAnnouncementsRepo()
  return data
}

export async function listAnnouncementsAdmin() {
  const data = await listAnnouncementsRepoAdmin()
  return data
}

export async function getAnnouncement(id: string) {
  return getAnnouncementRepo(id)
}

export async function createAnnouncement(input: { title: string; content: string; type: string; authorUserId: string }) {
  const parsed = notificationSchema.parse({
    title: input.title,
    content: input.content,
    type: input.type,
  })
  return createAnnouncementRepo({
    title: parsed.title,
    content: parsed.content,
    type: parsed.type,
    author_user_id: input.authorUserId,
    published_at: new Date(),
    archived_at: null,
  })
}

export async function updateAnnouncement(id: string, body: unknown) {
  const partial = notificationSchema.partial().parse(body)
  const updatePayload: Record<string, unknown> = {}
  if (partial.title !== undefined) updatePayload.title = partial.title
  if (partial.content !== undefined) updatePayload.content = partial.content
  if (partial.type !== undefined) updatePayload.type = partial.type
  if (Object.prototype.hasOwnProperty.call(body as Record<string, unknown>, 'isActive')) {
    const isActive = Boolean((body as Record<string, unknown>).isActive)
    updatePayload.archived_at = isActive ? null : new Date()
    if (isActive && !('published_at' in updatePayload)) updatePayload.published_at = new Date()
  }
  return updateAnnouncementRepo(id, updatePayload)
}

export async function deleteAnnouncement(id: string) {
  return deleteAnnouncementRepo(id)
}


