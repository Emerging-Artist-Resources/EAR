import { saveDonationPageWithImageChanges } from "./saveDonationPageImageChanges"
import type { UpdateDonationPageData } from "@/lib/validations/donation-page"

const USER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
const PREVIOUS_PATH = `profiles/${USER_ID}/donation-hero.jpg`
const NEW_PATH = `profiles/${USER_ID}/donation-hero-11111111-1111-1111-1111-111111111111.jpg`

const basePayload: UpdateDonationPageData = {
  donation_page_message: "Hello",
  donation_preset_amounts: [25, 50],
  designation_enabled: false,
}

function createFile(): File {
  return new File(["hero"], "hero.jpg", { type: "image/jpeg" })
}

describe("saveDonationPageWithImageChanges", () => {
  it("replace: upload succeeds and PATCH fails → new object is cleaned up; previous path untouched", async () => {
    const removed: string[] = []
    const upload = jest.fn().mockResolvedValue(NEW_PATH)
    const remove = jest.fn(async (path: string) => {
      removed.push(path)
    })
    const patch = jest.fn().mockRejectedValue(new Error("PATCH failed"))

    await expect(
      saveDonationPageWithImageChanges({
        userId: USER_ID,
        payload: basePayload,
        pendingFile: createFile(),
        removeExisting: false,
        previousImagePath: PREVIOUS_PATH,
        deps: { upload, remove, patch },
      }),
    ).rejects.toThrow("PATCH failed")

    expect(upload).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith({
      ...basePayload,
      donation_page_image_path: NEW_PATH,
    })
    expect(removed).toEqual([NEW_PATH])
    expect(removed).not.toContain(PREVIOUS_PATH)
  })

  it("remove: PATCH fails → old object is not deleted", async () => {
    const remove = jest.fn()
    const patch = jest.fn().mockRejectedValue(new Error("PATCH failed"))

    await expect(
      saveDonationPageWithImageChanges({
        userId: USER_ID,
        payload: basePayload,
        removeExisting: true,
        previousImagePath: PREVIOUS_PATH,
        deps: {
          upload: jest.fn(),
          remove,
          patch,
        },
      }),
    ).rejects.toThrow("PATCH failed")

    expect(patch).toHaveBeenCalledWith({
      ...basePayload,
      donation_page_image_path: null,
    })
    expect(remove).not.toHaveBeenCalled()
  })

  it("replace: PATCH succeeds and deleting the old image fails → save still succeeds", async () => {
    const upload = jest.fn().mockResolvedValue(NEW_PATH)
    const remove = jest.fn().mockRejectedValue(new Error("storage delete failed"))
    const patch = jest.fn().mockResolvedValue({})
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

    await expect(
      saveDonationPageWithImageChanges({
        userId: USER_ID,
        payload: basePayload,
        pendingFile: createFile(),
        removeExisting: false,
        previousImagePath: PREVIOUS_PATH,
        deps: { upload, remove, patch },
      }),
    ).resolves.toBeUndefined()

    expect(patch).toHaveBeenCalledWith({
      ...basePayload,
      donation_page_image_path: NEW_PATH,
    })
    expect(remove).toHaveBeenCalledWith(PREVIOUS_PATH)
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it("remove: PATCH succeeds then deletes the previous image", async () => {
    const remove = jest.fn().mockResolvedValue(undefined)
    const patch = jest.fn().mockResolvedValue({})

    await saveDonationPageWithImageChanges({
      userId: USER_ID,
      payload: basePayload,
      removeExisting: true,
      previousImagePath: PREVIOUS_PATH,
      deps: {
        upload: jest.fn(),
        remove,
        patch,
      },
    })

    expect(patch).toHaveBeenCalledWith({
      ...basePayload,
      donation_page_image_path: null,
    })
    expect(remove).toHaveBeenCalledWith(PREVIOUS_PATH)
  })

  it("no image change: patches payload only", async () => {
    const upload = jest.fn()
    const remove = jest.fn()
    const patch = jest.fn().mockResolvedValue({})

    await saveDonationPageWithImageChanges({
      userId: USER_ID,
      payload: basePayload,
      removeExisting: false,
      previousImagePath: PREVIOUS_PATH,
      deps: { upload, remove, patch },
    })

    expect(patch).toHaveBeenCalledWith(basePayload)
    expect(upload).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
})
