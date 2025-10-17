"use client"

import { useState } from "react"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import type { Resolver } from "react-hook-form"
import { eventFormSchema, type EventFormData } from "@/lib/validations/events"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase/client"
import { usePerformances } from "@/hooks/use-performances"
import { EventTypeSelector, type EventType } from "./EventTypeSelector"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { PerformanceDetailsStep } from "./steps/PerformanceDetailsStep"
import { ClassWorkshopStep } from "./steps/ClassWorkshopStep"
import { OpportunityStep } from "./steps/OpportunityStep"
import { WrapUpStep } from "./steps/WrapUpStep"

interface EventWizardProps {
  onSuccess: () => void
  onClose: () => void
}

export function EventWizard({ onSuccess, onClose }: EventWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [submitMessage, setSubmitMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmittedBefore, setHasSubmittedBefore] = useState<null | boolean>(null)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = getSupabaseClient()
  const { submitPerformance } = usePerformances()

  const resolver = zodResolver(eventFormSchema) as unknown as Resolver<EventFormData>
  const form = useForm<EventFormData>({
    resolver,
    defaultValues: { referralSources: [], joinEmailList: false, submittedBefore: undefined, agreeCompTickets: false, photoUrls: [""], address: "" } as Partial<EventFormData>,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 4000)
  }

  const goNext = async () => {
    if (step === 1) {
      if (!eventType) {
        showToast('Please select an event type to continue')
        return
      }
      const ok = await form.trigger(['submitterName','submitterPronouns','contactEmail','company','companyWebsite','socialHandles','photoUrls','credits'])
      if (!ok) {
        showToast('Please complete required fields on this step')
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (eventType === 'PERFORMANCE') {
        const ok = await form.trigger(['title','date','showTime','ticketPrice','ticketLink','shortDescription'])
        if (!ok) {
          showToast('Please complete required fields on this step')
          return
        }
      }
      setStep(3)
      return
    }
  }

  const goBack = () => {
    if (step === 1) return
    setStep(((step - 1) as 1 | 2 | 3))
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      setSubmitMessage("")
      const { data: userResult } = await supabase.auth.getUser()
      const userId = userResult?.user?.id || null
      const created = await submitPerformance({ ...data, userId })
      setSubmitMessage("Submitted successfully! Pending review.")
      form.reset()
      setTimeout(() => { onSuccess(); onClose() }, 1200)
      return created
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-md bg-gray-800 bg-opacity-80 text-white px-4 py-2 shadow-lg text-sm">
            {toast}
          </div>
        </div>
      )}
      {/* Progress */}
      {(() => {
        const progressPct = step === 1 ? 33 : step === 2 ? 67 : 100
        return (
          <div className="w-full">
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-primary-400 rounded transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )
      })()}
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`px-2 py-1 rounded ${step === 1 ? 'bg-primary-100 text-gray-700' : 'bg-gray-100 text-gray-700'}`}>Basic Info</span>
        <span className="text-gray-400">/</span>
        <span className={`px-2 py-1 rounded ${step === 2 ? 'bg-primary-100 text-gray-700' : 'bg-gray-100 text-gray-700'}`}>Event Details</span>
        <span className="text-gray-400">/</span>
        <span className={`px-2 py-1 rounded ${step === 3 ? 'bg-primary-100 text-gray-700' : 'bg-gray-100 text-gray-700'}`}>Wrap-up</span>
      </div>
      {step === 1 && (
        <EventTypeSelector eventType={eventType} onChangeType={setEventType} />
      )}

      {step === 1 && <BasicInfoStep form={form} />}
      {step === 2 && (
        eventType === 'PERFORMANCE' ? (
          <PerformanceDetailsStep form={form} />
        ) : eventType === 'CLASS' ? (
          <ClassWorkshopStep form={form} />
        ) : (
          <OpportunityStep
            form={form}
            subtype={eventType === 'FUNDING' ? 'FUNDING' : eventType === 'AUDITION' ? 'AUDITION' : 'CREATIVE'}
          />
        )
      )}
      {step === 3 && (
        <WrapUpStep form={form} hasSubmittedBefore={hasSubmittedBefore} setHasSubmittedBefore={setHasSubmittedBefore} />
      )}

      {submitMessage && (
        <Alert variant={submitMessage.includes('success') ? 'success' : 'error'}>{submitMessage}</Alert>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <div className="flex gap-2">
          {step > 1 && <Button type="button" variant="outline" onClick={goBack}>Back</Button>}
          {step < 3 && <Button type="button" variant="primary" onClick={goNext}>Next</Button>}
          {step === 3 && (
            <Button type="button" variant="primary" onClick={handleSubmit} disabled={isSubmitting || eventType !== 'PERFORMANCE'}>
              {eventType !== 'PERFORMANCE' ? 'Submit (coming soon)' : isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}


