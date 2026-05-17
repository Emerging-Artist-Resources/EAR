"use client"

import { useFormContext } from "react-hook-form"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { Section } from "@/components/forms/blocks/Section"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { TextField } from "@/components/forms/blocks/TextField"
import { inquiryLayoutSpacing } from "@/components/forms/service-inquiry/inquiry-layout-spacing"
import {
  defaultPartitionServiceInquiryQuestions,
  questionOptionsIncludeOther,
  SERVICE_INQUIRY_OTHER_VALUE,
  sortedOptionLabels,
  toSelectOptionsForField,
  type ServiceInquiryQuestionPartition,
  type ServiceInquiryQuestionRow,
} from "@/lib/service-inquiries/service-inquiry-questions"
import type { DynamicServiceInquiryFormData } from "@/lib/validations/service-inquiry-dynamic"

export type DynamicServiceInquiryFieldsProps = {
  questions: ServiceInquiryQuestionRow[]
  questionNote?: (questionText: string) => string | undefined
  partitionQuestions?: (
    questions: ServiceInquiryQuestionRow[],
  ) => ServiceInquiryQuestionPartition
  contactSectionTitle?: string
  projectSectionTitle?: string
  projectSectionDescription?: string
}

function answerFieldName(questionId: string): `answers.${string}` {
  return `answers.${questionId}` as `answers.${string}`
}

function answerOtherFieldName(questionId: string): `answerOther.${string}` {
  return `answerOther.${questionId}` as `answerOther.${string}`
}

function DynamicQuestionField({
  q,
  questionNote,
}: {
  q: ServiceInquiryQuestionRow
  questionNote?: (questionText: string) => string | undefined
}) {
  const form = useFormContext<DynamicServiceInquiryFormData>()
  const name = answerFieldName(q.id)
  const note = questionNote?.(q.question_text)
  const labels = sortedOptionLabels(q)
  const allowOther = questionOptionsIncludeOther(q)
  const options = toSelectOptionsForField(labels)

  if (q.field_type === "textarea") {
    return (
      <TextAreaField
        form={form}
        name={name}
        label={q.question_text}
        note={note}
        required={q.is_required}
        showAsterisk={q.is_required}
        rows={5}
        errorMode="always"
      />
    )
  }

  if (q.field_type === "text" || q.field_type === "date" || q.field_type === "time") {
    return (
      <TextField
        form={form}
        name={name}
        label={q.question_text}
        note={note}
        type={q.field_type === "date" ? "date" : q.field_type === "time" ? "time" : "text"}
        required={q.is_required}
        showAsterisk={q.is_required}
        errorMode="always"
      />
    )
  }

  if (q.field_type === "select" && (options.length > 0 || allowOther)) {
    return (
      <SelectBlock
        form={form}
        name={name}
        label={q.question_text}
        note={note}
        required={q.is_required}
        showAsterisk={q.is_required}
        options={options}
        allowOther={allowOther}
        otherName={answerOtherFieldName(q.id)}
        otherValue={SERVICE_INQUIRY_OTHER_VALUE}
        errorMode="always"
      />
    )
  }

  if (q.field_type === "multiselect" && (options.length > 0 || allowOther)) {
    return (
      <SelectBlock
        form={form}
        name={name}
        label={q.question_text}
        note={note}
        required={q.is_required}
        showAsterisk={q.is_required}
        multiple
        options={options}
        allowOther={allowOther}
        otherName={answerOtherFieldName(q.id)}
        otherValue={SERVICE_INQUIRY_OTHER_VALUE}
        errorMode="always"
      />
    )
  }

  return null
}

export function DynamicServiceInquiryFields({
  questions,
  questionNote,
  partitionQuestions = defaultPartitionServiceInquiryQuestions,
  contactSectionTitle = "Contact information",
  projectSectionTitle = "Project details",
  projectSectionDescription,
}: DynamicServiceInquiryFieldsProps) {
  const form = useFormContext<DynamicServiceInquiryFormData>()
  const { pronounsQuestion, projectQuestions } = partitionQuestions(questions)

  return (
    <div className={inquiryLayoutSpacing.cardInner}>
      <Section title={contactSectionTitle}>
        <div className={inquiryLayoutSpacing.fieldGrid}>
          <TextField
            form={form}
            name="firstName"
            label="First Name"
            required
            errorMode="always"
          />
          <TextField
            form={form}
            name="lastName"
            label="Last Name"
            required
            errorMode="always"
          />
        </div>
        <TextField
          form={form}
          name="email"
          label="Email Address"
          type="email"
          required
          errorMode="always"
        />
        {pronounsQuestion ? (
          <TextField
            form={form}
            name={answerFieldName(pronounsQuestion.id)}
            label={pronounsQuestion.question_text}
            required={pronounsQuestion.is_required}
            showAsterisk={pronounsQuestion.is_required}
            errorMode="always"
          />
        ) : null}
      </Section>

      <Section title={projectSectionTitle} description={projectSectionDescription}>
        <div className={inquiryLayoutSpacing.section}>
          {projectQuestions.map((q) => (
            <DynamicQuestionField key={q.id} q={q} questionNote={questionNote} />
          ))}
        </div>
      </Section>
    </div>
  )
}
