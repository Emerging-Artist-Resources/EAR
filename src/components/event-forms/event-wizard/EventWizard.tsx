"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import type { Resolver } from "react-hook-form"
import { eventFormSchema, type EventFormData } from "@/lib/validations/events"
import { Button } from "@/components/ui/button"
import { type EventType } from "./EventTypeSelector"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { PerformanceDetailsStep } from "./steps/performance/PerformanceDetailsStep"
import { ClassesWorkshopsStep } from "./steps/ClassWorkshopStep"
import { OpportunityStep } from "./steps/OpportunityStep"
import { AuditionStep } from "./steps/AuditionStep"
import { MediaAndAdditionalInfoStep } from "./steps/MediaAndAdditionalInfoStep"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { useEventStepValidation } from "@/hooks/use-event-step-validation"
import { DEFAULT_EVENT_ERROR_MESSAGE } from "@/lib/validations/events"
import { buildEventPayload, type UserInfo } from "./payload-builders"
import { normalizeShareRecipientEmails } from "@/lib/listing-share"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/contexts/ToastContext"
import { apiPost, apiGet } from "@/lib/fetch-utils"
import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"

interface EventWizardProps {
  onSuccess: () => void
  onClose: () => void
}

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  pronouns: string | null
  website: string | null
  organization_name: string | null
  location_label: string | null
  artist_status: string | null
}



export function EventWizard({ onSuccess, onClose }: EventWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePronouns, setProfilePronouns] = useState<string | null>(null)
  const { user, userName } = useAuth()
  const { showToast } = useToast()

  // Fetch pronouns from profile - fetch once on mount if user exists
  useEffect(() => {
    if (!user) {
      setProfilePronouns(null)
      return
    }
    
    let cancelled = false
    const fetchProfile = async () => {
      try {
        const profile = await apiGet<ProfileData>("/api/profile")
        if (!cancelled) {
          setProfilePronouns(profile?.pronouns || null)
        }
      } catch (error) {
        if (!cancelled) {
          setProfilePronouns(null)
        }
      }
    }
    fetchProfile()
    
    return () => {
      cancelled = true
    }
  }, [user])

  // Derive userInfo from auth state and profile
  const userInfo = useMemo<UserInfo | null>(() => {
    if (!user || !userName || !user.email) return null
    return {
      name: userName,
      email: user.email,
      pronouns: profilePronouns,
    }
  }, [user, userName, profilePronouns])


  const resolver = zodResolver(eventFormSchema) as unknown as Resolver<EventFormData>
  const form = useForm<EventFormData>({
    resolver,
    defaultValues: {
      agreeCompTickets: false,
      address: "",
      // Only initialize extraOccurrences for performance types (legacy field)
      // For auditions, occurrences and deadlineOccurrences are initialized by ShowtimesList
      extraOccurrences: [],
      occurrences: [],
      deadlineOccurrences: [],
      shareRecipientEmails: [],
      creativeSubmissionInstructions: "",
      listingWebsite: "",
    } as Partial<EventFormData>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    shouldFocusError: false, // prevents scroll-to-first-error / focus jumps
  })

  // Hook must be called unconditionally - use PERFORMANCE as default
  // Must be called after form initialization
  // Use nullish coalescing to avoid unnecessary re-initialization when eventType is null
  const validationHook = useEventStepValidation(form, eventType ?? "PERFORMANCE")

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
      // Use validation hook directly - it's already memoized based on eventType
      const isValid = await validationHook.validateStep()
      if (!isValid) {
        if (process.env.NODE_ENV !== "production" && eventType === "PERFORMANCE") {
          const v = form.getValues()
          console.log("[EAR piece schedule] step 2 Next blocked", {
            toastMessage: validationHook.getFirstError() || DEFAULT_EVENT_ERROR_MESSAGE,
            type: v.type,
            selectedSlots: v.selectedSlots,
            pieceScheduleMode: v.pieceScheduleMode,
            occurrences: v.occurrences,
            extraOccurrences: v.extraOccurrences,
            eventDatesConfirmed: v.eventDatesConfirmed,
            parentEventId: v.parentEventId,
            formErrors: form.formState.errors,
          })
        }
        const errorMessage = validationHook.getFirstError() || DEFAULT_EVENT_ERROR_MESSAGE
        showToast(errorMessage, "error")
        return
      }
      setStep(3)
      return
    }
  }, [step, eventType, showToast, validationHook.validateStep, validationHook.getFirstError])

  const goBack = useCallback(() => {
    if (step === 1) return
    setStep(((step - 1) as 1 | 2 | 3))
  }, [step])

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        setIsSubmitting(true)

        if (!eventType) {
          showToast("Please select an event type", "error")
          setIsSubmitting(false)
          return
        }

        if (!userInfo) {
          showToast("Please sign in to submit", "error")
          setIsSubmitting(false)
          return
        }

        if (!user?.id) {
          showToast("Please sign in to submit", "error")
          setIsSubmitting(false)
          return
        }

        // Upload photos to storage before building payload
        const photoPaths: Array<{ path: string; credit?: string | null; sort_order?: number }> = []
        const promoFiles = data.promoFiles as File[] | undefined
        
        if (promoFiles && Array.isArray(promoFiles) && promoFiles.length > 0) {
          const bucket = "event-photos"
          const userId = user.id
          
          for (let i = 0; i < Math.min(promoFiles.length, 5); i++) {
            const file = promoFiles[i]
            if (!file || !(file instanceof File)) continue
            
            try {
              // Generate unique filename: listings/{userId}/{timestamp}-{index}.jpg
              const timestamp = Date.now()
              const fileExt = file.name.split('.').pop() || 'jpg'
              const fileName = `${timestamp}-${i}.${fileExt}`
              const filePath = `listings/${userId}/${fileName}`
              
              // Upload file to storage
              await storageService.uploadFile(supabase, bucket, filePath, file, {
                cacheControl: '3600',
                upsert: false
              })
              
              // Add to photo paths array
              photoPaths.push({
                path: filePath,
                credit: data.credits || null,
                sort_order: i
              })
            } catch (uploadError) {
              console.error(`Failed to upload photo ${i}:`, uploadError)
              const errorMsg = uploadError instanceof Error ? uploadError.message : "Failed to upload photo"
              showToast(`Photo upload failed: ${errorMsg}`, "error")
              setIsSubmitting(false)
              return
            }
          }
        }

        const payload = await buildEventPayload(data, eventType, userInfo)
        
        // Add photos to payload
        if (photoPaths.length > 0) {
          payload.photos = photoPaths
        }

        // Additional validation for occurrences
        if (eventType === "PERFORMANCE" && payload.occurrences.length === 0) {
          if (process.env.NODE_ENV !== "production") {
            const v = data as Record<string, unknown>
            console.log("[EAR piece schedule] submit blocked — payload has zero occurrences", {
              formType: v.type,
              selectedSlots: v.selectedSlots,
              pieceScheduleMode: v.pieceScheduleMode,
              formOccurrences: v.occurrences,
              formExtraOccurrences: v.extraOccurrences,
            })
          }
          showToast("Please add at least one date & time", "error")
          setIsSubmitting(false)
          return
        }

        if (eventType === "CLASS" && payload.occurrences.length === 0) {
          showToast("Please provide at least one valid class date/time", "error")
          setIsSubmitting(false)
          return
        }

        const response = await apiPost<{ id: string; payment_required?: boolean }>("/api/events", payload)
        
        if (response?.payment_required) {
          try {
            const checkoutResponse = await apiPost<{ url: string }>("/api/stripe/create-checkout-session", {
              listingId: response.id,
            })
            
            if (checkoutResponse?.url) {
              window.location.href = checkoutResponse.url
              return
            }
          } catch (checkoutError) {
            const errorMessage = checkoutError instanceof Error ? checkoutError.message : "Failed to create payment session"
            showToast(errorMessage, "error")
            setIsSubmitting(false)
            return
          }
        }

        if (eventType === "PERFORMANCE" && userInfo.email) {
          const raw = (data.shareRecipientEmails ?? []).filter(
            (e): e is string => typeof e === "string"
          )
          const n = normalizeShareRecipientEmails(raw, userInfo.email).length
          if (n > 0) {
            showToast(
              `Submitted successfully! ${n} ${n === 1 ? "person" : "people"} will be notified once your listing is approved.`,
              "success"
            )
          } else {
            showToast("Submitted successfully! Pending review.", "success")
          }
        } else {
          showToast("Submitted successfully! Pending review.", "success")
        }
        form.reset()
        
        // Navigate after success message
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1200)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Something went wrong"
        showToast(errorMessage, "error")
      } finally {
        setIsSubmitting(false)
      }
    },
    (_errors) => {
      if (process.env.NODE_ENV !== "production" && eventType === "PERFORMANCE") {
        const v = form.getValues()
        console.log("[EAR piece schedule] final Submit — RHF/zod rejected", {
          rhfErrors: _errors,
          type: v.type,
          selectedSlots: v.selectedSlots,
          pieceScheduleMode: v.pieceScheduleMode,
          occurrences: v.occurrences,
          extraOccurrences: v.extraOccurrences,
          eventDatesConfirmed: v.eventDatesConfirmed,
          parentEventId: v.parentEventId,
        })
      }
      // Simplified error handling using validation hook
      const errorMessage = validationHook.getFirstError() || DEFAULT_EVENT_ERROR_MESSAGE
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
        <PageNumbers current={step} total={3} />
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
      {step === 3 && eventType && (
        <MediaAndAdditionalInfoStep form={form} eventType={eventType} />
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
          {(step === 1 || step === 2) && (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          )}
          {step === 3 && (
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