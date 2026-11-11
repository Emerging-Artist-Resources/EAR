import { saveAnnouncementWithImageChanges } from "./saveAnnouncementImageChanges"

const PREVIOUS_URL =
  "https://example.supabase.co/storage/v1/object/public/announcement-photos/announcements/11111111-1111-4111-8111-111111111111.jpg"
const NEW_URL =
  "https://example.supabase.co/storage/v1/object/public/announcement-photos/announcements/22222222-2222-4222-8222-222222222222.jpg"
const STATIC_URL = "/images/announcements/intern.png"

const basePayload = { title: "Workshop", content: "Details", heroImageUrl: PREVIOUS_URL }

function createFile(): File {
  return new File(["hero"], "hero.jpg", { type: "image/jpeg" })
}

describe("saveAnnouncementWithImageChanges", () => {
  it("replace: upload succeeds and save fails → new object is cleaned up; previous URL untouched", async () => {
    const removed: string[] = []
    const upload = jest.fn().mockResolvedValue(NEW_URL)
    const remove = jest.fn(async (url: string) => {
      removed.push(url)
    })
    const save = jest.fn().mockRejectedValue(new Error("Failed to save notification"))

    await expect(
      saveAnnouncementWithImageChanges({
        payload: basePayload,
        pendingFile: createFile(),
        removeExisting: false,
        previousImageUrl: PREVIOUS_URL,
        deps: { upload, remove, save },
      })
    ).rejects.toThrow("Failed to save notification")

    expect(save).toHaveBeenCalledWith({ ...basePayload, heroImageUrl: NEW_URL })
    expect(removed).toEqual([NEW_URL])
  })

  it("replace: save succeeds and deleting the old image fails → save still succeeds", async () => {
    const upload = jest.fn().mockResolvedValue(NEW_URL)
    const remove = jest.fn().mockRejectedValue(new Error("storage delete failed"))
    const save = jest.fn().mockResolvedValue(undefined)
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

    await expect(
      saveAnnouncementWithImageChanges({
        payload: basePayload,
        pendingFile: createFile(),
        removeExisting: false,
        previousImageUrl: PREVIOUS_URL,
        deps: { upload, remove, save },
      })
    ).resolves.toBeUndefined()

    expect(remove).toHaveBeenCalledWith(PREVIOUS_URL)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("remove: save fails → old object is not deleted", async () => {
    const remove = jest.fn()
    const save = jest.fn().mockRejectedValue(new Error("Failed to save notification"))

    await expect(
      saveAnnouncementWithImageChanges({
        payload: basePayload,
        removeExisting: true,
        previousImageUrl: PREVIOUS_URL,
        deps: { upload: jest.fn(), remove, save },
      })
    ).rejects.toThrow("Failed to save notification")

    expect(save).toHaveBeenCalledWith({ ...basePayload, heroImageUrl: null })
    expect(remove).not.toHaveBeenCalled()
  })

  it("remove: save succeeds then deletes a previous bucket image", async () => {
    const remove = jest.fn().mockResolvedValue(undefined)
    const save = jest.fn().mockResolvedValue(undefined)

    await saveAnnouncementWithImageChanges({
      payload: basePayload,
      removeExisting: true,
      previousImageUrl: PREVIOUS_URL,
      deps: { upload: jest.fn(), remove, save },
    })

    expect(remove).toHaveBeenCalledWith(PREVIOUS_URL)
  })

  it("leaves static public files on disk", async () => {
    const remove = jest.fn()
    const save = jest.fn().mockResolvedValue(undefined)

    await saveAnnouncementWithImageChanges({
      payload: { ...basePayload, heroImageUrl: STATIC_URL },
      removeExisting: true,
      previousImageUrl: STATIC_URL,
      deps: { upload: jest.fn(), remove, save },
    })

    expect(save).toHaveBeenCalledWith({
      ...basePayload,
      heroImageUrl: null,
    })
    expect(remove).not.toHaveBeenCalled()
  })

  it("no image change: saves the payload only", async () => {
    const upload = jest.fn()
    const remove = jest.fn()
    const save = jest.fn().mockResolvedValue(undefined)

    await saveAnnouncementWithImageChanges({
      payload: basePayload,
      removeExisting: false,
      previousImageUrl: PREVIOUS_URL,
      deps: { upload, remove, save },
    })

    expect(save).toHaveBeenCalledWith(basePayload)
    expect(upload).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
})