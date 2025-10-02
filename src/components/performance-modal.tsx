"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { performanceSchema, type PerformanceFormData } from "@/lib/validations"
import { usePerformances } from "@/hooks/use-performances"

interface PerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PerformanceModal({ isOpen, onClose, onSuccess }: PerformanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const { data: session } = useSession()
  const { submitPerformance } = usePerformances()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PerformanceFormData>({
    resolver: zodResolver(performanceSchema),
  })

  const onSubmit = async (data: PerformanceFormData) => {
    console.log("Form submitted with data:", data)
    
    setIsSubmitting(true)
    setSubmitMessage("")

    try {
      await submitPerformance({
        ...data,
        userId: session?.user?.id || null, // Allow anonymous submissions
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Submit Performance">
      {!session && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Anonymous Submission:</strong> You can submit without signing in. 
            If you&apos;d like to track your submissions, <a href="/auth/signin" className="underline hover:text-blue-900">sign in here</a>.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Performance Title *
          </label>
          <Input
            {...register("title")}
            placeholder="Enter performance title"
            error={!!errors.title}
            className="w-full"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            {...register("description")}
            placeholder="Describe your performance"
            error={!!errors.description}
            className="w-full"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Performance Date *
            </label>
            <Input
              {...register("date")}
              type="date"
              error={!!errors.date}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Performance Time
            </label>
            <Input
              {...register("time")}
              type="time"
              error={!!errors.time}
            />
            {errors.time && (
              <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <Input
            {...register("location")}
            placeholder="Where will the performance take place?"
            error={!!errors.location}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="performer" className="block text-sm font-medium text-gray-700 mb-1">
            Performer Name *
          </label>
          <Input
            {...register("performer")}
            placeholder="Enter performer name"
            error={!!errors.performer}
          />
          {errors.performer && (
            <p className="mt-1 text-sm text-red-600">{errors.performer.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <Input
              {...register("contactEmail")}
              type="email"
              placeholder="contact@example.com"
              error={!!errors.contactEmail}
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <Input
              {...register("contactPhone")}
              type="tel"
              placeholder="(555) 123-4567"
              error={!!errors.contactPhone}
            />
            {errors.contactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
            )}
          </div>
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