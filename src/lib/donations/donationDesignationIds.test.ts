import {
  buildDesignationConfigFromFormRows,
  designationOptionId,
  mapDesignationToFormRows,
} from "./donationDesignationIds"
import { donationDesignationConfigSchema } from "./donationDesignationConfig"

describe("designationOptionId", () => {
  it("returns 1-based option ids", () => {
    expect(designationOptionId(0)).toBe("option-1")
    expect(designationOptionId(1)).toBe("option-2")
    expect(designationOptionId(9)).toBe("option-10")
  })
})

describe("buildDesignationConfigFromFormRows", () => {
  it("assigns index-based ids by row order", () => {
    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Designate to",
      options: [
        { label: "Tour 2025" },
        { label: "New Project" },
      ],
    })

    expect(config.fieldLabel).toBe("Designate to")
    expect(config.allowNoPreference).toBe(false)
    expect(config.options).toEqual([
      { id: "option-1", label: "Tour 2025" },
      { id: "option-2", label: "New Project" },
    ])
    expect(donationDesignationConfigSchema.safeParse(config).success).toBe(true)
  })

  it("skips blank rows and reindexes ids", () => {
    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Fund",
      options: [
        { label: "General support" },
        { label: "   " },
        { label: "No preference" },
      ],
    })

    expect(config.options).toEqual([
      { id: "option-1", label: "General support" },
      { id: "option-2", label: "No preference" },
    ])
  })

  it("reassigns ids when labels change on save", () => {
    const config = buildDesignationConfigFromFormRows({
      fieldLabel: "Fund",
      options: [{ label: "Renamed option" }],
    })

    expect(config.options).toEqual([{ id: "option-1", label: "Renamed option" }])
  })
})

describe("mapDesignationToFormRows", () => {
  it("maps parsed config to label-only form rows", () => {
    const rows = mapDesignationToFormRows({
      fieldLabel: "Fund",
      allowNoPreference: false,
      options: [{ id: "option-1", label: "General" }],
    })

    expect(rows.fieldLabel).toBe("Fund")
    expect(rows.options).toEqual([{ label: "General" }])
  })

  it("returns a single empty row when designation is disabled", () => {
    const rows = mapDesignationToFormRows(null)

    expect(rows).toEqual({
      fieldLabel: "",
      options: [{ label: "" }],
    })
  })
})
