"use client"

import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from "react"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import { useWatch } from "react-hook-form"
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
import { apiPost, apiGet, apiPut } from "@/lib/fetch-utils"
import { supabase } from "@/lib/supabase/client"
import { storageService } from "@/services/storage"
import {
  normalizeOrganizerProgramPiecesFromDb,
  piecePromoFilesFieldName,
  type OrganizerProgramPiecePhoto,
} from "@/lib/organizer-program-pieces"
import { ownerListingToFormLoad } from "./owner-listing-to-form"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { resetModalFormView } from "@/lib/reset-scroll-ancestors"

interface EventWizardProps {
  onSuccess: (info?: { wasApprovedResubmit?: boolean }) => void
  onClose: () => void
  /** When set, wizard loads this listing and saves via PUT /api/events/:id */
  listingId?: string | null
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



export function EventWizard({ onSuccess, onClose, listingId }: EventWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const wizardRootRef = useRef<HTMLDivElement>(null)
  const wizardFocusSentinelRef = useRef<HTMLDivElement>(null)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePronouns, setProfilePronouns] = useState<string | null>(null)
  const [initialPersistedStatus, setInitialPersistedStatus] = useState<string | null>(null)
  const [showApprovedResubmitConfirm, setShowApprovedResubmitConfirm] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const existingPhotosRef = useRef<Array<{ path: string; credit?: string | null }>>([])
  const organizerPiecePhotosRef = useRef<Record<string, OrganizerProgramPiecePhoto[]>>({})
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

  useEffect(() => {
    if (!listingId) {
      setInitialPersistedStatus(null)
      setLoadError(null)
      existingPhotosRef.current = []
      organizerPiecePhotosRef.current = {}
      return
    }

    let cancelled = false
    setLoadError(null)

    const run = async () => {
      try {
        const row = await apiGet<Record<string, unknown>>(`/api/events/${listingId}/owner`)
        if (cancelled) return
        const { eventType: et, defaults, initialPersistedStatus: st, existingPhotos, organizerPiecePhotosById } =
          ownerListingToFormLoad(row)
        existingPhotosRef.current = existingPhotos
        organizerPiecePhotosRef.current = organizerPiecePhotosById
        setEventType(et)
        setInitialPersistedStatus(st)
        form.reset({
          agreeCompTickets: false,
          locationMode: "IN_PERSON",
          address: "",
          extraOccurrences: [],
          occurrences: [],
          deadlineOccurrences: [],
          shareRecipientEmails: [],
          creativeSubmissionInstructions: "",
          listingWebsite: "",
          classRegistrationDetails: "",
          ...defaults,
        } as Partial<EventFormData>)
        setStep(1)
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load listing")
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [listingId])

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
      locationMode: "IN_PERSON",
      address: "",
      // Only initialize extraOccurrences for performance types (legacy field)
      // For auditions, occurrences and deadlineOccurrences are initialized by ShowtimesList
      extraOccurrences: [],
      occurrences: [],
      deadlineOccurrences: [],
      shareRecipientEmails: [],
      pieces: [],
      creativeSubmissionInstructions: "",
      listingWebsite: "",
      classRegistrationDetails: "",
    } as Partial<EventFormData>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    shouldFocusError: false, // prevents scroll-to-first-error / focus jumps
  })

  const perfType = useWatch({ control: form.control, name: "type" })
  const performanceFormat = useWatch({ control: form.control, name: "eventType" })
  const classWorkshopType = useWatch({ control: form.control, name: "classWorkshopType" })

  const scrollResetKey =
    step === 2
      ? `${step}:${eventType}:${perfType}:${performanceFormat}:${classWorkshopType}`
      : `${step}:${eventType}`

  // Runs after child layout effects (e.g. ShowtimesList row seed) so scroll stays at top.
  useLayoutEffect(() => {
    resetModalFormView(wizardRootRef.current, wizardFocusSentinelRef.current)
  }, [scrollResetKey])

  // Google Places mounts asynchronously and can refocus after layout; reset once it settles.
  useEffect(() => {
    if (step !== 2) return
    const id = window.setTimeout(() => {
      resetModalFormView(wizardRootRef.current, wizardFocusSentinelRef.current)
    }, 200)
    return () => window.clearTimeout(id)
  }, [scrollResetKey, step])

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

  const submitListingData = async (data: EventFormData) => {
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

      const photoPaths: Array<{ path: string; credit?: string | null; sort_order?: number }> = []
      const promoFiles = data.promoFiles as File[] | undefined

      if (promoFiles && Array.isArray(promoFiles) && promoFiles.length > 0) {
        const bucket = "event-photos"
        const userId = user.id

        for (let i = 0; i < Math.min(promoFiles.length, 5); i++) {
          const file = promoFiles[i]
          if (!file || !(file instanceof File)) continue

          try {
            const timestamp = Date.now()
            const fileExt = file.name.split(".").pop() || "jpg"
            const fileName = `${timestamp}-${i}.${fileExt}`
            const filePath = `listings/${userId}/${fileName}`

            await storageService.uploadFile(supabase, bucket, filePath, file, {
              cacheControl: "3600",
              upsert: false,
            })

            photoPaths.push({
              path: filePath,
              credit: data.credits || null,
              sort_order: i,
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

      const details = payload.details as Record<string, unknown> | undefined
      if (payload.type === "performance" && details) {
        const doc = normalizeOrganizerProgramPiecesFromDb(details.organizer_program_pieces)
        if (doc && doc.pieces.length > 0) {
          const formRec = data as unknown as Record<string, unknown>
          const credit = data.credits?.trim() || null
          const bucket = "event-photos"
          const userId = user.id

          for (let i = 0; i < doc.pieces.length; i++) {
            const piece = doc.pieces[i]
            const fieldName = piecePromoFilesFieldName(i)
            const filesRaw = formRec[fieldName]
            const files: File[] = Array.isArray(filesRaw)
              ? filesRaw.filter((f): f is File => f instanceof File)
              : []

            if (files.length > 0) {
              const uploaded: OrganizerProgramPiecePhoto[] = []
              for (let j = 0; j < Math.min(files.length, 5); j++) {
                const file = files[j]
                if (!file || !(file instanceof File)) continue
                try {
                  const timestamp = Date.now()
                  const fileExt = file.name.split(".").pop() || "jpg"
                  const fileName = `${timestamp}-piece-${piece.id}-${j}.${fileExt}`
                  const filePath = `listings/${userId}/${fileName}`

                  await storageService.uploadFile(supabase, bucket, filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                  })

                  uploaded.push({
                    path: filePath,
                    credit,
                    sort_order: j,
                  })
                } catch (uploadError) {
                  console.error(`Failed to upload piece photo ${j}:`, uploadError)
                  const errorMsg =
                    uploadError instanceof Error ? uploadError.message : "Failed to upload photo"
                  showToast(`Piece image upload failed: ${errorMsg}`, "error")
                  setIsSubmitting(false)
                  return
                }
              }
              piece.photos = uploaded
            } else if (organizerPiecePhotosRef.current[piece.id]?.length) {
              piece.photos = organizerPiecePhotosRef.current[piece.id].map((ph, idx) => ({
                path: ph.path,
                credit: credit ?? ph.credit ?? null,
                sort_order: idx,
              }))
            }
          }
          details.organizer_program_pieces = doc
        }
      }

      if (photoPaths.length > 0) {
        payload.photos = photoPaths
      } else if (existingPhotosRef.current.length > 0) {
        payload.photos = existingPhotosRef.current.map((p, i) => ({
          path: p.path,
          credit: (data.credits && data.credits.trim()) || p.credit || null,
          sort_order: i,
        }))
      }

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

      if (listingId) {
        const putResult = await apiPut<{
          id: string
          payment_required?: boolean
          was_approved_resubmit?: boolean
        }>(`/api/events/${listingId}`, payload)

        if (putResult?.payment_required) {
          try {
            const checkoutResponse = await apiPost<{ url: string }>("/api/stripe/create-checkout-session", {
              listingId: putResult.id,
            })

            if (checkoutResponse?.url) {
              window.location.href = checkoutResponse.url
              return
            }
          } catch (checkoutError) {
            const errorMessage =
              checkoutError instanceof Error ? checkoutError.message : "Failed to create payment session"
            showToast(errorMessage, "error")
            setIsSubmitting(false)
            return
          }
        }

        if (putResult?.was_approved_resubmit) {
          showToast(
            "Your changes were submitted for review. The listing will reappear publicly once approved.",
            "success"
          )
        } else {
          showToast("Listing updated successfully.", "success")
        }

        form.reset()
        setTimeout(() => {
          onSuccess({ wasApprovedResubmit: Boolean(putResult?.was_approved_resubmit) })
          onClose()
        }, 800)
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
          const errorMessage =
            checkoutError instanceof Error ? checkoutError.message : "Failed to create payment session"
          showToast(errorMessage, "error")
          setIsSubmitting(false)
          return
        }
      }

      if (eventType === "PERFORMANCE" && userInfo.email) {
        const raw = (data.shareRecipientEmails ?? []).filter((e): e is string => typeof e === "string")
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
  }

  const handleSubmit = form.handleSubmit(
    async (data) => {
      await submitListingData(data)
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
    <div ref={wizardRootRef} className="space-y-6">
      <div
        ref={wizardFocusSentinelRef}
        tabIndex={-1}
        aria-hidden
        className="sr-only outline-none"
      />
      {loadError && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {loadError}
        </p>
      )}
      <ConfirmDialog
        isOpen={showApprovedResubmitConfirm}
        title="Resubmit for review?"
        description={
          <div className="space-y-2">
            <p>Editing this approved listing will resubmit it for review.</p>
            <p>It will be temporarily removed from the public calendar until approved again.</p>
          </div>
        }
        confirmLabel="Save and resubmit"
        cancelLabel="Cancel"
        onCancel={() => setShowApprovedResubmitConfirm(false)}
        onConfirm={() => {
          setShowApprovedResubmitConfirm(false)
          void handleSubmit()
        }}
      />
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
        <BasicInfoStep
          form={form}
          eventType={eventType}
          onChangeType={setEventType}
          lockListingType={!!listingId}
        />
      )}
      {step === 2 && (
        eventType === 'PERFORMANCE' ? (
          <PerformanceDetailsStep form={form} organizerPiecePhotosByIdRef={organizerPiecePhotosRef} />
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
                if (listingId && initialPersistedStatus === "approved") {
                  setShowApprovedResubmitConfirm(true)
                  return
                }
                void handleSubmit()
              }}
              disabled={isSubmitting || !!loadError}
            >
              {isSubmitting ? "Saving..." : listingId ? "Save changes" : "Submit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}