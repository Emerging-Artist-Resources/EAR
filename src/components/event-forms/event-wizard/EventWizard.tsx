"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
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
import { MediaAndAdditionalInfoStep } from "./steps/MediaAndAdditionalInfoStep"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { validateStep2 } from "./validation-helpers"
import { buildEventPayload, type UserInfo } from "./payload-builders"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
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
  const [submitMessage, setSubmitMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePronouns, setProfilePronouns] = useState<string | null>(null)
  const { user, userName } = useAuth()
  const { showToast } = useToast()

  // Fetch pronouns from profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const profile = await apiGet<ProfileData>("/api/profile")
        console.log("[EventWizard] Fetched profile:", profile)
        setProfilePronouns(profile?.pronouns || null)
      } catch (error) {
        console.error("Error fetching profile for pronouns:", error)
        setProfilePronouns(null)
      }
    }
    fetchProfile()
  }, [user])

  // Derive userInfo from auth state and profile
  const userInfo = useMemo<UserInfo | null>(() => {
    if (!user || !userName || !user.email) return null
    const info = {
      name: userName,
      email: user.email,
      pronouns: profilePronouns,
    }
    console.log("[EventWizard] userInfo:", info)
    return info
  }, [user, userName, profilePronouns])


  const resolver = zodResolver(eventFormSchema) as unknown as Resolver<EventFormData>
  const form = useForm<EventFormData>({
    resolver,
    defaultValues: {
      agreeCompTickets: false,
      address: "",
      // Only initialize extraOccurrences for performance types (legacy field)
      // For auditions, occurrences and deadlineOccurrences are initialized by DateTimeList
      extraOccurrences: [],
      occurrences: [],
      deadlineOccurrences: [],
    } as Partial<EventFormData>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    shouldFocusError: false, // prevents scroll-to-first-error / focus jumps
  })

  const goNext = useCallback(async () => {
    console.log("[EventWizard] goNext called, step:", step)
    if (step === 1) {
      if (!eventType) {
        console.log("[EventWizard] No event type selected")
        showToast("Please select an event type to continue", "warning")
        return
      }
      console.log("[EventWizard] Moving to step 2")
      setStep(2)
      return
    }
    if (step === 2) {
      if (!eventType) {
        console.log("[EventWizard] No event type selected")
        showToast("Please select an event type to continue", "warning")
        return
      }
      console.log("[EventWizard] Validating step 2 for eventType:", eventType)
      const validation = await validateStep2(form, eventType)
      console.log("[EventWizard] Validation result:", validation)
      if (!validation.isValid) {
        console.log("[EventWizard] Validation failed:", validation.message)
        showToast(validation.message || "Please complete required fields on this step", "error")
        return
      }
      console.log("[EventWizard] Validation passed, moving to step 3")
      setStep(3)
      return
    }
    // Step 3 - validation passed, ready to submit
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

        if (!user?.id) {
          setSubmitMessage("Please sign in to submit")
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
              setSubmitMessage(`Photo upload failed: ${errorMsg}`)
              showToast(`Photo upload failed: ${errorMsg}`, "error")
              setIsSubmitting(false)
              return
            }
          }
        }

        // Debug: Log form data before building payload
        console.group("🟢 Form Submission - Before Payload")
        console.log("Event type:", eventType)
        console.log("Form data:", data)
        console.log("Photo paths:", photoPaths)
        console.log("Location fields in form data:", {
          address: data.address,
          placeId: data.placeId,
          lat: data.lat,
          lng: data.lng,
          venueName: data.venueName,
          locationInstructions: data.locationInstructions,
        })
        console.log("Form state:", {
          isValid: form.formState.isValid,
          errors: form.formState.errors,
          isDirty: form.formState.isDirty,
        })
        console.groupEnd()

        const payload = await buildEventPayload(data, eventType, userInfo)
        
        // Add photos to payload
        if (photoPaths.length > 0) {
          payload.photos = photoPaths
        }
        
        // Debug: Log payload being sent
        console.group("🟢 Form Submission - Payload")
        console.log("Payload:", payload)
        console.log("Payload base (location fields):", payload.base)
        console.groupEnd()

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
      // Debug: Log all validation errors
      console.group("🔴 Form Validation Errors")
      console.log("All errors:", errors)
      console.log("Form values:", form.getValues())
      console.log("Form state:", {
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors,
      })
      
      // Log each field error
      const errorEntries = Object.entries(errors)
      console.log(`Total fields with errors: ${errorEntries.length}`)
      errorEntries.forEach(([field, error]) => {
        console.log(`Field "${field}":`, error)
        const fieldValue = form.getValues(field as keyof EventFormData)
        console.log(`  Current value:`, fieldValue)
      })
      
      // Log location-related fields specifically
      const locationFields = ['address', 'placeId', 'lat', 'lng', 'venueName', 'locationInstructions']
      console.log("Location fields:")
      locationFields.forEach(field => {
        const value = form.getValues(field as keyof EventFormData)
        console.log(`  ${field}:`, value, typeof value)
      })
      console.groupEnd()
      
      // Extract first error message for user feedback
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