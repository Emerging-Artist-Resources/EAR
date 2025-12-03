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
}

export function BasicInfoStep({ eventType, onChangeType }: BasicInfoStepProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <H3>What type of listing are you creating?</H3>
        </CardHeader>
        <CardContent>
          <Text>
          Our community calendar is designed to support emerging artists and creative professionals by offering a variety of listing options.
          </Text>
          <ol className="mt-4 space-y-2 text-sm text-gray-700 pl-4">
            <li><strong>1. Performances:</strong> Promote your shows, premiers, immersive experiences, and any movement-centered events.</li>
            <li><strong>2. Auditions:</strong> Spread the word about upcoming auditions and performance opportunities.</li>
            <li><strong>3. Classes/Workshops:</strong> List your classes, workshops, intensives, and other training opportunities.            </li>
            <li><strong>4. Creative Opportunities:</strong> Share choreographic opportunities, residencies, open calls, or any creative offering that doesn’t neatly fit into another category.</li>
          </ol>  
          <Text className="mt-4">Each listing is crafted to give artists and audience members the essential details they need at glance. Whether you’re looking to perform, train, create, or secure support for your next project, our calendar helps you connect with the opportunities that move your practice forward.</Text>
        </CardContent>
      </Card>

      <Section className="mt-4" >
        <H4>Pick your listing type:</H4>
        <EventTypeSelector eventType={eventType} onChangeType={onChangeType} />
      </Section>
    </>
  );
}
