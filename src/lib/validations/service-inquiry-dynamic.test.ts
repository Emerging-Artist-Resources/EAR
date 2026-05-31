import {
  buildDynamicServiceInquiryDefaultValues,
  buildDynamicServiceInquirySchema,
} from "./service-inquiry-dynamic"
import type { ServiceInquiryQuestionRow } from "@/lib/service-inquiries/service-inquiry-questions"

const baseQuestions: ServiceInquiryQuestionRow[] = [
  {
    id: "comprehensive-id",
    question_text: "What comprehensive fiscal services are you interested in?",
    field_type: "multiselect",
    is_required: false,
    order_index: 3,
    options: [
      { label: "Bookkeeping", value: "Bookkeeping", order_index: 1, is_other: false },
      { label: "Other", value: "Other", order_index: 2, is_other: true },
    ],
  },
  {
    id: "hourly-id",
    question_text: "What hourly fiscal services are you interested in?",
    field_type: "multiselect",
    is_required: false,
    order_index: 4,
    options: [
      {
        label: "Establishment of a Chart of Accounts (ongoing modifications)",
        value: "Establishment of a Chart of Accounts (ongoing modifications)",
        order_index: 1,
        is_other: false,
      },
      { label: "Other", value: "Other", order_index: 2, is_other: true },
    ],
  },
  {
    id: "explanation-id",
    question_text:
      "Please explain your financial situation and provide any details you feel are relevant to help us understand your needs.",
    field_type: "textarea",
    is_required: true,
    order_index: 5,
    options: [],
  },
]

describe("buildDynamicServiceInquirySchema", () => {
  const schema = buildDynamicServiceInquirySchema(baseQuestions)
  const defaults = buildDynamicServiceInquiryDefaultValues(baseQuestions)

  it("accepts blank optional multiselect answers", () => {
    const result = schema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      answers: {
        ...defaults.answers,
        "comprehensive-id": undefined,
        "hourly-id": [],
        "explanation-id": "Need help with year-end reporting.",
      },
      answerOther: defaults.answerOther,
    })

    expect(result.success).toBe(true)
  })

  it("requires explanation when other multiselects are left blank", () => {
    const result = schema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      answers: {
        ...defaults.answers,
        "comprehensive-id": [],
        "hourly-id": [],
        "explanation-id": "",
      },
      answerOther: defaults.answerOther,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "answers.explanation-id")).toBe(
        true,
      )
    }
  })

  it("requires other text when Other is selected", () => {
    const result = schema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      answers: {
        ...defaults.answers,
        "comprehensive-id": ["OTHER"],
        "hourly-id": [],
        "explanation-id": "Need help with bookkeeping.",
      },
      answerOther: {
        ...defaults.answerOther,
        "comprehensive-id": "",
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "answerOther.comprehensive-id")).toBe(
        true,
      )
    }
  })
})
