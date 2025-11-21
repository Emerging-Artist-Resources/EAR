"use client"

import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "../../blocks/Section"
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
            We offer a diverse range of listings tailored to meet the needs of creative professionals and enthusiasts. Our platform provides five main types of listings:
          </Text>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <p><strong>1. Performance:</strong> Discover performance opportunities that span across genres and disciplines. Share shows and connect audiences with your work.</p>
            <p><strong>2. Audition:</strong> Stay informed about upcoming auditions and casting calls across theater, film, television, and more.</p>
            <p><strong>3. Creative Opportunities:</strong> Collaborations, residencies, open calls—find opportunities that encourage artistic expression and partnership.</p>
            <p><strong>4. Class/Workshop:</strong> Promote educational offerings ranging from weekly classes to one-time workshops and intensives.</p>
            <p><strong>5. Funding:</strong> Help the community find grants, scholarships, and other financial support opportunities.</p>
          </div>  
        </CardContent>
      </Card>

      <Section className="mt-4" >
        <H4>Pick your listing type:</H4>
        <EventTypeSelector eventType={eventType} onChangeType={onChangeType} />
      </Section>
    </>
  );
}
