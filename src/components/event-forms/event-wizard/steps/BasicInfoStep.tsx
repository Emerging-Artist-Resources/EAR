"use client"

import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { EventTypeSelector, type EventType } from "../EventTypeSelector"
import { H3, H4, Text } from "@/components/ui/typography"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface BasicInfoStepProps {
  form: UseFormReturn<EventFormData>
  eventType: EventType | null
  onChangeType: (t: EventType) => void
  /** When editing an existing listing, listing type cannot change */
  lockListingType?: boolean
}

export function BasicInfoStep({ eventType, onChangeType, lockListingType }: BasicInfoStepProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <H3>Listing Options</H3>
        </CardHeader>
        <CardContent>
          <Text>
            Our community calendar is designed to support emerging artists and creative professionals by offering a range of listing options.
          </Text>
          <ol className="mt-4 space-y-2 text-sm text-gray-700 pl-4">
            <li><strong>1. Performances:</strong> Promote shows, premiers, immersive experiences, and movement based events.</li>
            <li><strong>2. Auditions:</strong> Share upcoming audition opportunities.</li>
            <li><strong>3. Classes/Workshops:</strong> List classes, workshops, intensives, and training opportunities.</li>
            <li><strong>4. Opportunities:</strong> Share choreographic opportunities, residencies, open calls, or any creative offering that doesn’t fit into another category.</li>
          </ol>
          <Text className="mt-4">Each listing is designed to provide essential information at glance.</Text>
          <Text className="mt-4">Whether you’re looking to perform, train, create, or secure support, this calendar helps you connect you with opportunities that move your practice forward.</Text>
        </CardContent>
      </Card>

      <Section className="mt-4" >
        <H4>Select your listing:</H4>
        <EventTypeSelector eventType={eventType} onChangeType={onChangeType} disabled={lockListingType} />
      </Section>
    </>
  );
}
