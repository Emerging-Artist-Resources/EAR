import { z } from "zod"
import { flexibleUrlOptionalSchema } from "../flexible-url"
import { occurrenceSchema } from "./base"

// Audition-only
export const auditionFields = z
  .object({
    title: z.string().optional(),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
    eligibility: z.string().optional(),
    compensation: z.string().optional(),
    instructions: z.string().optional(),
    occurrences: z.array(occurrenceSchema).optional(),
    deadlineOccurrences: z.array(occurrenceSchema).optional(),
    fee: z.enum(["FEE", "NO_FEE"]).optional(),
    feeAmount: z.string().optional(),
    preAuditionClasses: z.string().optional(),
    /** Company / project website (DB: audition_details.website) */
    listingWebsite: flexibleUrlOptionalSchema,
    /**
     * Listing fee fields (only shown if fee === "FEE")
     * Established artists: $25
     * Emerging artists: $35
     */
    artistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
  })
  .superRefine((data, ctx) => {
    // Required fields
    if (!data.title || data.title.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "Title is required",
      })
    }
    if (!data.description || data.description.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      })
    }
    if (!data.eligibility || data.eligibility.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["eligibility"],
        message: "Eligibility is required",
      })
    }
    if (!data.compensation || data.compensation.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["compensation"],
        message: "Compensation is required",
      })
    }
    if (!data.instructions || data.instructions.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["instructions"],
        message: "Instructions is required",
      })
    }
    if (!data.occurrences || data.occurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrences"],
        message: "Add at least one date & time",
      })
    }
    if (!data.deadlineOccurrences || data.deadlineOccurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["deadlineOccurrences"],
        message: "Deadline date or deadline time is required",
      })
    }
    if (!data.fee) {
      ctx.addIssue({
        code: "custom",
        path: ["fee"],
        message: "Fee selection is required",
      })
    }

    // Conditional validation for fee
    if (data.fee === "FEE") {
      if (!data.feeAmount || data.feeAmount.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["feeAmount"],
          message: "Fee amount is required when there is a fee",
        })
      }
      if (!data.artistType) {
        ctx.addIssue({
          code: "custom",
          path: ["artistType"],
          message: "Artist type is required when there is a fee",
        })
      }
    }
  })
