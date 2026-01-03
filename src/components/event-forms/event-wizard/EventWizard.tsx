"use client"

import { useState, useCallback, useMemo } from "react"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import type { Resolver } from "react-hook-form"
import { eventFormSchema, type EventFormData } from "@/lib/validations/events"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { type EventType } from "./EventTypeSelector"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { PerformanceDetailsStep } from "./steps/performance/PerformanceDetailsStep"
import { ClassesWorkshopsStep } from "./steps/ClassWorkshopStep"
import { OpportunityStep } from "./steps/OpportunityStep"
import { AuditionStep } from "./steps/AuditionStep"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { validateStep2 } from "./validation-helpers"
import { buildEventPayload, type UserInfo } from "./payload-builders"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { apiPost } from "@/lib/fetch-utils"

interface EventWizardProps {
  onSuccess: () => void
  onClose: () => void
}

export function EventWizard({ onSuccess, onClose }: EventWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [submitMessage, setSubmitMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, userName } = useAuth()
  const { showToast } = useToast()

  // Derive userInfo from auth state
  const userInfo = useMemo<UserInfo | null>(() => {
    if (!user || !userName || !user.email) return null
    return {
      name: userName,
      email: user.email,
      pronouns: (user.user_metadata?.pronouns as string | undefined) || null,
    }
  }, [user, userName])


  const resolver = zodResolver(eventFormSchema) as unknown as Resolver<EventFormData>
  const form = useForm<EventFormData>({
    resolver,
    defaultValues: {
      agreeCompTickets: false,
      photoUrls: [""],
      address: "",
      // Seed one date card with one time for performance extras
      extraOccurrences: [{ date: "", times: [{ time: "" }] }],
    } as Partial<EventFormData>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    shouldFocusError: false, // prevents scroll-to-first-error / focus jumps
  })

  const goNext = useCallback(async () => {
    if (step === 1) {
      if (!eventType) {
        showToast("Please select an event type to continue", "warning")
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (!eventType) {
        showToast("Please select an event type to continue", "warning")
        return
      }
      if (eventType === 'PERFORMANCE') {
        const validation = await validateStep2(form, eventType)
        if (!validation.isValid) {
          showToast(validation.message || "Please complete required fields on this step", "error")
          return
        }
        setStep(3)
        return
      } else {
        // For non-performance types, step 2 is the submit step
        const validation = await validateStep2(form, eventType)
        if (!validation.isValid) {
          showToast(validation.message || "Please complete required fields on this step", "error")
          return
        }
        // Validation passed, ready to submit
        return
      }
    }
    // Step 3 (Performance Media & Socials) - validation passed, ready to submit
  }, [step, eventType, form, showToast])

  const goBack = useCallback(() => {
    if (step === 1) return
    setStep(((step - 1) as 1 | 2 | 3))
  }, [step])

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        setIsSubmitting(true)
        setSubmitMessage("")

        if (!eventType) {
          setSubmitMessage("Please select an event type")
          setIsSubmitting(false)
          return
        }

        if (!userInfo) {
          setSubmitMessage("Please sign in to submit")
          setIsSubmitting(false)
          return
        }

        const payload = buildEventPayload(data, eventType, userInfo)

        // Additional validation for occurrences
        if (eventType === "PERFORMANCE" && payload.occurrences.length === 0) {
          setSubmitMessage("Please add at least one date & time")
          setIsSubmitting(false)
          return
        }

        if (eventType === "CLASS" && payload.occurrences.length === 0) {
          setSubmitMessage("Please provide at least one valid class date/time")
          setIsSubmitting(false)
          return
        }

        await apiPost("/api/events", payload)
        
        setSubmitMessage("Submitted successfully! Pending review.")
        showToast("Submitted successfully! Pending review.", "success")
        form.reset()
        
        // Navigate after success message
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1200)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Something went wrong"
        setSubmitMessage(errorMessage)
        showToast(errorMessage, "error")
      } finally {
        setIsSubmitting(false)
      }
    },
    (errors) => {
      // Extract first error message for user feedback
      const errorEntries = Object.entries(errors)
      let errorMessage = "Please check all required fields"
      
      if (errorEntries.length > 0) {
        const firstErrorEntry = errorEntries[0]
        const firstError = firstErrorEntry[1]
        
        if (firstError) {
          if (typeof firstError === 'object' && 'message' in firstError) {
            errorMessage = firstError.message as string
          } else if (Array.isArray(firstError) && firstError.length > 0) {
            const nestedError = firstError[0]
            if (nestedError && typeof nestedError === 'object' && 'message' in nestedError) {
              errorMessage = nestedError.message as string
            }
          }
        }
      }
      
      setSubmitMessage(errorMessage)
      showToast(errorMessage, "error")
      setIsSubmitting(false)
    }
  )

  return (
    <div className="space-y-6">
      {/* Progress */}
      {/* {(() => {
        const progressPct = step === 1 ? 50 : 100
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
      })()} */}
      {/* Step indicators */}
      <div className="flex justify-center gap-2 text-sm">
        <PageNumbers current={step} total={eventType === 'PERFORMANCE' ? 3 : 2} />
      </div>
      {step === 1 && (
        <BasicInfoStep form={form} eventType={eventType} onChangeType={setEventType} />
      )}
      {step === 2 && (
        eventType === 'PERFORMANCE' ? (
          <PerformanceDetailsStep form={form} />
        ) : eventType === 'CLASS' ? (
          <ClassesWorkshopsStep form={form} />
        ) : eventType === 'AUDITION' ? (
          <AuditionStep form={form} />
        ) : (
          <OpportunityStep
            form={form}
          />
        )
      )}
      {/*{step === 3 && eventType === 'PERFORMANCE' && (
        <OrganizerMediaSocials form={form} />
      )} */}

      {submitMessage && (
        <Alert variant={submitMessage.includes('success') ? 'success' : 'error'}>{submitMessage}</Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
          {/* If you want Cancel on the left as well, uncomment:
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          */}
        </div>
        <div className="flex gap-2">
          {(step === 1 || (step === 2 && eventType === 'PERFORMANCE')) && (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          )}
          {((step === 2 && eventType !== 'PERFORMANCE') || (step === 3 && eventType === 'PERFORMANCE')) && (
            <Button
              type="button"
              onClick={() => {
                handleSubmit()
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}