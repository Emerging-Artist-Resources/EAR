"use client"

import { useState } from "react"
import { useForm, useFieldArray, type SubmitHandler, type Resolver, type FieldArrayPath } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { performanceSchema, type PerformanceFormData } from "@/lib/validations"
import { usePerformances } from "@/hooks/use-performances"
import { getSupabaseClient } from "@/lib/supabase/client"

interface PerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PerformanceModal({ isOpen, onClose, onSuccess }: PerformanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const { submitPerformance } = usePerformances()
  const supabase = getSupabaseClient()

  const resolver = zodResolver(performanceSchema) as unknown as Resolver<PerformanceFormData>
  const form = useForm<PerformanceFormData>({
    resolver,
    defaultValues: {
      referralSources: [],
      joinEmailList: false,
      agreeCompTickets: false,
      photoUrls: [""],
    },
  })

  const { register, control, handleSubmit, watch, formState: { errors }, reset, setValue } = form

  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = useFieldArray<PerformanceFormData, FieldArrayPath<PerformanceFormData>, "id">({
    control,
    name: "photoUrls" as FieldArrayPath<PerformanceFormData>,
  })

  type ReferralOption = "INSTAGRAM" | "WORD_OF_MOUTH" | "GOOGLE" | "OTHER"
  const referralSources = (watch("referralSources") || []) as ReferralOption[]
  const toggleReferral = (opt: ReferralOption, checked: boolean) => {
    const current = new Set<ReferralOption>(referralSources)
    if (checked) current.add(opt)
    else current.delete(opt)
    setValue("referralSources", Array.from(current))
  }

  const onSubmit: SubmitHandler<PerformanceFormData> = async (data) => {
    console.log("Form submitted with data:", data)
    
    setIsSubmitting(true)
    setSubmitMessage("")

    try {
      const { data: userResult } = await supabase.auth.getUser()
      const userId = userResult?.user?.id || null
      await submitPerformance({
        ...data,
        userId,
      })
      
      setSubmitMessage("Performance submitted successfully! It will be reviewed by an admin and added to the calendar if approved.")
      reset()
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "An error occurred while submitting the performance")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setSubmitMessage("")
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Submit Performance" closeOnOverlay={false}>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          You can submit without signing in. To track submissions, <a href="/auth/signin" className="underline hover:text-blue-900">sign in</a>.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name & Pronouns *</label>
            <div className="grid grid-cols-2 gap-3">
              <Input {...register("submitterName")} placeholder="Your name" error={!!errors.submitterName} />
              <Input {...register("submitterPronouns")} placeholder="Pronouns" error={!!errors.submitterPronouns} />
            </div>
            {(errors.submitterName || errors.submitterPronouns) && (
              <p className="mt-1 text-sm error-600">Enter name and pronouns</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input {...register("contactEmail")} type="email" placeholder="you@example.com" error={!!errors.contactEmail} />
            {errors.contactEmail && (<p className="mt-1 text-sm error-600">{errors.contactEmail.message}</p>)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <Input {...register("company")} placeholder="Company / Artist" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company/Artist Website</label>
            <Input {...register("companyWebsite")} placeholder="https://" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Name *</label>
          <Input {...register("title")} placeholder="Show title" error={!!errors.title} />
          {errors.title && (<p className="mt-1 text-sm error-600">{errors.title.message}</p>)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show Date *</label>
            <Input {...register("date")} type="date" error={!!errors.date} />
            {errors.date && (<p className="mt-1 text-sm error-600">{errors.date.message}</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show Time *</label>
            <Input {...register("showTime")} type="time" error={!!errors.showTime} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price *</label>
            <Input {...register("ticketPrice")} placeholder="$" error={!!errors.ticketPrice} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Link *</label>
          <Input {...register("ticketLink")} placeholder="https://tickets.example.com" error={!!errors.ticketLink} />
          {errors.ticketLink && (<p className="mt-1 text-sm error-600">{errors.ticketLink.message}</p>)}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (max 100 words) *</label>
          <Textarea {...register("shortDescription")} rows={4} placeholder="Describe your event" error={!!errors.shortDescription} />
          {errors.shortDescription && (<p className="mt-1 text-sm error-600">{errors.shortDescription.message}</p>)}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Promotional Photos (URLs, up to 5)</label>
          <div className="space-y-2">
            {photoFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`photoUrls.${index}` as const)} placeholder={`https://image${index+1}.jpg`} />
                <Button type="button" variant="outline" onClick={() => removePhoto(index)}>Remove</Button>
              </div>
            ))}
          </div>
          {photoFields.length < 5 && (
            <div className="mt-2">
              <Button type="button" variant="ghost" onClick={() => appendPhoto("")}>Add another photo</Button>
            </div>
          )}
          {errors.photoUrls && (<p className="mt-1 text-sm error-600">At least 1 valid photo URL (max 5)</p>)}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Credit Information *</label>
          <Textarea {...register("credits")} rows={3} placeholder="How to display credits" error={!!errors.credits} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Handles *</label>
          <Input {...register("socialHandles")} placeholder="@yourhandle, @company" error={!!errors.socialHandles} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know</label>
          <Textarea {...register("notes")} rows={3} placeholder="Accessibility, warnings, special notes" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about EAR?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              { value: "INSTAGRAM", label: "Instagram" },
              { value: "WORD_OF_MOUTH", label: "Word of mouth" },
              { value: "GOOGLE", label: "Google" },
              { value: "OTHER", label: "Other" },
            ] as { value: ReferralOption; label: string }[]).map(opt => (
              <label key={opt.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={referralSources.includes(opt.value)}
                  onChange={(e) => toggleReferral(opt.value, e.target.checked)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {referralSources.includes("OTHER") && (
            <div className="mt-2">
              <Input {...register("referralOther")} placeholder="Please specify" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Join our email list?</label>
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="yes" checked={watch("joinEmailList") === true} onChange={() => setValue("joinEmailList", true)} /> Yes
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="no" checked={watch("joinEmailList") === false} onChange={() => setValue("joinEmailList", false)} /> No
            </label>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-800 mb-2">
            EAR offers this calendar as a free resource. Please provide two complimentary tickets for EAR staff to attend your show.
          </p>
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input type="checkbox" {...register("agreeCompTickets")} /> I agree to provide two complimentary tickets for EAR staff
          </label>
          {errors.agreeCompTickets && (<p className="mt-1 text-sm error-600">Required</p>)}
        </div>

        {submitMessage && (
          <Alert variant={submitMessage.includes("successfully") ? "success" : "error"}>
            {submitMessage}
          </Alert>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Performance"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}