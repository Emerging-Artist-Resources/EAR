"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { useEffect } from "react"

import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { Text } from "@/components/ui/typography"

export function ListingFeeSection({ form }: { form: UseFormReturn<EventFormData> }) {
  const artistType = form.watch("artistType" as Path<EventFormData>) as "ESTABLISHED" | "EMERGING" | undefined
  const listingFeeOption = form.watch("listingFeeOption" as Path<EventFormData>) as
    | "PAY_FEE"
    | "PROVIDE_TICKET"
    | "EXPLAIN"
    | undefined

  useEffect(() => {
    if (artistType === "ESTABLISHED") {
      form.setValue("listingFeeOption" as Path<EventFormData>, undefined as unknown as never)
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.setValue("complementaryTicketInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeOption", "listingFeeExplanation", "complementaryTicketInfo"] as unknown as never)
    }
  }, [artistType, form])

  useEffect(() => {
    if (listingFeeOption !== "PROVIDE_TICKET") {
      form.setValue("complementaryTicketInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["complementaryTicketInfo"] as unknown as never)
    }
    if (listingFeeOption !== "EXPLAIN") {
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeExplanation"] as unknown as never)
    }
  }, [listingFeeOption, form])

  return (
    <Section title="Listing Fee">
      <SelectBlock
        form={form}
        name={"artistType" as Path<EventFormData>}
        label="Are you an established or emerging artist?"
        required
        options={[
          { label: "Established artist", value: "ESTABLISHED" },
          { label: "Emerging artist", value: "EMERGING" },
        ]}
      />

      {artistType === "ESTABLISHED" && (
        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
          <Text className="text-sm font-medium text-gray-900">Listing Fee: $50</Text>
          <Text className="text-xs text-gray-600 mt-1">Payment will be processed after submission.</Text>
        </div>
      )}

      {artistType === "EMERGING" && (
        <div className="mt-4 space-y-4">
          <SelectBlock
            form={form}
            name={"listingFeeOption" as Path<EventFormData>}
            label="How would you like to handle the listing fee?"
            required
            options={[
              { label: "Pay listing fee ($35)", value: "PAY_FEE" },
              { label: "Provide a complementary ticket", value: "PROVIDE_TICKET" },
              { label: "Explain why I can't pay the fee or provide a ticket", value: "EXPLAIN" },
            ]}
          />

          {listingFeeOption === "PROVIDE_TICKET" && (
            <TextAreaField
              form={form}
              name={"complementaryTicketInfo" as Path<EventFormData>}
              label="Complementary Ticket Information"
              required
              rows={4}
            />
          )}

          {listingFeeOption === "EXPLAIN" && (
            <TextAreaField
              form={form}
              name={"listingFeeExplanation" as Path<EventFormData>}
              label="Please explain your situation"
              required
              rows={4}
            />
          )}

          {listingFeeOption === "PAY_FEE" && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-md">
              <Text className="text-sm font-medium text-gray-900">Listing Fee: $35</Text>
              <Text className="text-xs text-gray-600 mt-1">Payment will be processed after submission.</Text>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
