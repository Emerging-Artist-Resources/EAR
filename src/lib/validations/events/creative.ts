import { z } from "zod"
import { flexibleUrlOptionalSchema } from "../flexible-url"
import { occurrenceSchema } from "./base"

/**
 * Creative opportunity fields. Submission instructions use `creativeSubmissionInstructions`, not `link`:
 * the merged event schema ends with class fields, so `link` is always URL-validated for class/performance.
 */
export const creativeFields = z
  .object({
    title: z.string().optional(),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
    host: z.string().optional(),
    dates: z.string().optional(),
    compensation: z.string().optional(),
    requirements: z.string().optional(),
    creativeSubmissionInstructions: z
      .string()
      .max(5000, "Submission instructions must be 5000 characters or less")
      .optional(),
    deadlineOccurrences: z.array(occurrenceSchema).optional(),
    fee: z.enum(["FEE", "NO_FEE"]).optional(),
    feeAmount: z.string().optional(),
    /**
     * Listing fee fields (only shown if fee === "FEE")
     * Established artists: $25
     * Emerging artists: $35
     */
    artistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
    /** Host / project website (DB: creative_details.website; distinct from link = submission instructions) */
    listingWebsite: flexibleUrlOptionalSchema,
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
    if (!data.host || data.host.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["host"],
        message: "Host is required",
      })
    }
    if (!data.dates || data.dates.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["dates"],
        message: "Opportunity dates are required",
      })
    }
    if (!data.compensation || data.compensation.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["compensation"],
        message: "Compensation is required",
      })
    }
    if (!data.requirements || data.requirements.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["requirements"],
        message: "Requirements is required",
      })
    }
    if (!data.creativeSubmissionInstructions || data.creativeSubmissionInstructions.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["creativeSubmissionInstructions"],
        message: "Submission instructions are required",
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
