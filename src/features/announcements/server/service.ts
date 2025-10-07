import {
  listAnnouncementsRepo,
  getAnnouncementRepo,
  createAnnouncementRepo,
  updateAnnouncementRepo,
  deleteAnnouncementRepo,
} from "./repository"

export async function listAnnouncements(params: { active?: boolean | null }) {
  return listAnnouncementsRepo(params)
}

export async function getAnnouncement(id: string) {
  return getAnnouncementRepo(id)
}

export async function createAnnouncement(input: { title: string; content: string; type: string; authorUserId: string }) {
  return createAnnouncementRepo({
    title: input.title,
    content: input.content,
    type: input.type,
    author_user_id: input.authorUserId,
  })
}

export async function updateAnnouncement(id: string, updatePayload: Record<string, unknown>) {
  return updateAnnouncementRepo(id, updatePayload)
}

export async function deleteAnnouncement(id: string) {
  return deleteAnnouncementRepo(id)
}


