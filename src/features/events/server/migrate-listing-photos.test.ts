import {
  migrateReusedPhotosBestEffort,
  type PhotoMigrateStorage,
} from "./migrate-listing-photos"

function createMockStorage(overrides?: Partial<PhotoMigrateStorage>): PhotoMigrateStorage & {
  moveFile: jest.Mock
  objectExists: jest.Mock
} {
  return {
    moveFile: jest.fn().mockResolvedValue(undefined),
    objectExists: jest.fn().mockResolvedValue(false),
    ...overrides,
  } as PhotoMigrateStorage & { moveFile: jest.Mock; objectExists: jest.Mock }
}

describe("migrateReusedPhotosBestEffort", () => {
  it("migrates duplicate paths once", async () => {
    const storage = createMockStorage()
    const result = await migrateReusedPhotosBestEffort(storage, ["a.jpg", "a.jpg"])
    expect(storage.moveFile).toHaveBeenCalledTimes(1)
    expect(result.moved).toEqual(["a.jpg"])
  })

  it("returns alreadyAtDestination when source is missing and destination exists", async () => {
    const storage = createMockStorage({
      moveFile: jest.fn().mockRejectedValue(new Error("missing source")),
      objectExists: jest.fn().mockResolvedValue(true),
    })
    const result = await migrateReusedPhotosBestEffort(storage, ["a.jpg"])
    expect(result).toEqual({
      moved: [],
      alreadyAtDestination: ["a.jpg"],
      failed: [],
    })
  })

  it("does not throw when one path fails and still migrates others", async () => {
    const storage = createMockStorage({
      moveFile: jest.fn(async (_from: string, _to: string, path: string) => {
        if (path === "bad.jpg") throw new Error("move failed")
      }),
      objectExists: jest.fn(async (_bucket: string, path: string) => path !== "bad.jpg"),
    })

    const result = await migrateReusedPhotosBestEffort(storage, ["good.jpg", "bad.jpg", "also-good.jpg"])
    expect(result.moved).toEqual(["good.jpg", "also-good.jpg"])
    expect(result.failed).toEqual([{ path: "bad.jpg", error: expect.any(Error) }])
  })
})
