import {
  buildDesignationConfigFromFormRows,
  createDesignationOptionId,
  createEmptyDesignationOptionFormRow,
  mapDesignationToFormRows,
} from "./donationDesignationIds"
import { donationDesignationConfigSchema } from "./donationDesignationConfig"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe("createDesignationOptionId", () => {
  it("returns a UUID string", () => {
    expect(createDesignationOptionId()).toMatch(UUID_PATTERN)
  })
})

describe("buildDesignationConfigFromFormRows", () => {
  it("assigns a UUID only when a row has no existing id", () => {
    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Designate to",
      options: [
        { label: "Tour 2025" },
        { id: "existing-tour", label: "New Project" },
      ],
    })

    expect(config.fieldLabel).toBe("Designate to")
    expect(config.allowNoPreference).toBe(false)
    expect(config.options).toHaveLength(2)
    expect(config.options[0].label).toBe("Tour 2025")
    expect(config.options[0].id).toMatch(UUID_PATTERN)
    expect(config.options[1]).toEqual({ id: "existing-tour", label: "New Project" })
    expect(donationDesignationConfigSchema.safeParse(config).success).toBe(true)
  })

  it("skips blank rows without recycling ids by position", () => {
    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Fund",
      options: [
        { id: "keep-me", label: "General support" },
        { id: "blank-row", label: "   " },
        { label: "Brand new" },
      ],
    })

    expect(config.options).toHaveLength(2)
    expect(config.options[0]).toEqual({ id: "keep-me", label: "General support" })
    expect(config.options[1].label).toBe("Brand new")
    expect(config.options[1].id).toMatch(UUID_PATTERN)
    expect(config.options[1].id).not.toBe("blank-row")
    expect(config.options[1].id).not.toBe("option-2")
  })

  it("preserves id when an option is renamed", () => {
    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Fund",
      options: [{ id: "stable-id", label: "Renamed option" }],
    })

    expect(config.options).toEqual([{ id: "stable-id", label: "Renamed option" }])
  })

  it("preserves ids when options are reordered", () => {
    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Fund",
      options: [
        { id: "second", label: "Second" },
        { id: "first", label: "First" },
      ],
    })

    expect(config.options).toEqual([
      { id: "second", label: "Second" },
      { id: "first", label: "First" },
    ])
  })

  it("assigns a new UUID after delete-one-existing then add-new (no position recycle)", () => {
    const deletedId = "deleted-option"
    const addedRow = createEmptyDesignationOptionFormRow()

    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Fund",
      options: [
        { id: "kept-option", label: "Kept" },
        // Same-session delete→add: new row already has its own id (modal append behavior)
        { id: addedRow.id, label: "Added after delete" },
      ],
    })

    expect(config.options[0]).toEqual({ id: "kept-option", label: "Kept" })
    expect(config.options[1]).toEqual({
      id: addedRow.id,
      label: "Added after delete",
    })
    expect(config.options[1].id).not.toBe(deletedId)
    expect(config.options[1].id).not.toBe("option-2")
  })

  it("does not revive a deleted id when a new row is appended at the same index", () => {
    // Simulates RHF defaultValues recycling if append omitted id; modal must append a fresh id.
    const removedId = "uuid-removed"
    const freshRow = createEmptyDesignationOptionFormRow()

    expect(freshRow.id).toBeTruthy()
    expect(freshRow.id).not.toBe(removedId)

    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Fund",
      options: [
        { id: "uuid-kept", label: "Kept" },
        { id: freshRow.id, label: "Replacement" },
      ],
    })

    expect(config.options.map((option) => option.id)).toEqual(["uuid-kept", freshRow.id])
    expect(config.options.some((option) => option.id === removedId)).toBe(false)
  })
})

describe("createEmptyDesignationOptionFormRow", () => {
  it("returns a blank label with a fresh UUID", () => {
    const row = createEmptyDesignationOptionFormRow()
    expect(row.label).toBe("")
    expect(row.id).toMatch(UUID_PATTERN)
  })
})

describe("mapDesignationToFormRows", () => {
  it("preserves option ids when mapping config into form rows", () => {
    const rows = mapDesignationToFormRows({
      fieldLabel: "Fund",
      allowNoPreference: false,
      options: [{ id: "legacy-option-1", label: "General" }],
    })

    expect(rows.fieldLabel).toBe("Fund")
    expect(rows.options).toEqual([{ id: "legacy-option-1", label: "General" }])
  })

  it("returns a single empty row with a fresh id when designation is disabled", () => {
    const rows = mapDesignationToFormRows(null)

    expect(rows.fieldLabel).toBe("")
    expect(rows.options).toHaveLength(1)
    expect(rows.options[0].label).toBe("")
    expect(rows.options[0].id).toMatch(UUID_PATTERN)
  })
})
