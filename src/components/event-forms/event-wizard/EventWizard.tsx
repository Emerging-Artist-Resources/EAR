"use client"

import { useState } from "react"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import type { Resolver } from "react-hook-form"
import { eventFormSchema, type EventFormData } from "@/lib/validations/events"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { type EventType } from "./EventTypeSelector"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { PerformanceDetailsStep } from "./steps/PerformanceDetailsStep"
import { ClassWorkshopStep } from "./steps/ClassWorkshopStep"
import { OpportunityStep } from "./steps/OpportunityStep"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { Card } from "@/components/ui/card"

interface EventWizardProps {
  onSuccess: () => void
  onClose: () => void
}

export function EventWizard({ onSuccess, onClose }: EventWizardProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [submitMessage, setSubmitMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)


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
  })

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 4000)
  }

  const goNext = async () => {
    if (step === 1) {
      if (!eventType) { showToast('Please select an event type to continue'); return }
      setStep(2)
      return
    }
    if (step === 2) {
      if (eventType === 'PERFORMANCE') {
        // Validate only performance step fields + nested extras
        const ok = await form.trigger(
          ['title', 'shortDescription', 'credits', 'ticketPrice', 'extraOccurrences'],
          { shouldFocus: true }
        )
        if (!ok) {
          showToast('Please complete required fields on this step')
          return
        }
        // Ensure at least one date+time exists
        const extras = (form.getValues().extraOccurrences ?? []) as Array<{ date?: string; times?: Array<{ time?: string }> }>
        const hasOne = Array.isArray(extras) && extras.some(d => d?.date && Array.isArray(d?.times) && d.times.some(t => t?.time))
        if (!hasOne) {
          showToast('Please add at least one date & time')
          return
        }
      } else if (eventType === 'AUDITION') {
        const ok = await form.trigger(['auditionName','aboutProject','eligibility','compensation','auditionDate','auditionTime','auditionLink'])
        if (!ok) {
          showToast('Please complete required fields on this step')
          return
        }
      } else if (eventType === 'CREATIVE') {
        const ok = await form.trigger(['opportunityName','briefDescription','creativeEligibility','whatsOffered','stipendAmount','requirements','deadline','applyLink'])
        if (!ok) {
          showToast('Please complete required fields on this step')
          return
        }
      } else if (eventType === 'CLASS') {
        const ok = await form.trigger(['className','classDates','classTimes','classPrices','classLink','classDescription','classCreditInfo'])
        if (!ok) {
          showToast('Please complete required fields on this step')
          return
        }
        console.log('[next] CLASS validated, moving to step 3')
      } else if (eventType === 'FUNDING') {
        const ok = await form.trigger(['fundingLink'])
        if (!ok) {
          showToast('Please complete required fields on this step')
          return
        }
      }
      // In 2-step flow, Step 2 is submit step; do nothing here
      return
    }
  }

  const goBack = () => {
    if (step === 1) return
    setStep(((step - 1) as 1 | 2))
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      setSubmitMessage("")
      // Map to anonymous create payload
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
      const type = (eventType || 'PERFORMANCE').toLowerCase() as 'performance'|'audition'|'creative'|'class'|'funding'
      console.log('[submit] start type', type)
      const base = {
        contact_name: data.submitterName,
        pronouns: data.submitterPronouns || null,
        contact_email: data.contactEmail,
        org_name: data.company || null,
        org_website: data.companyWebsite || null,
        address: data.address || null,
        social_handles: { raw: data.socialHandles },
        notes: data.notes || null,
        borough: null as string | null,
      }

      let payload: Record<string, unknown> = { type, base }

      if (type === 'performance') {
        const occurrences: Array<{ starts_at_utc: string; tz: string }> = []
        // Accept simple fields if they exist
        const primaryDate = data.date
        const primaryTime = data.showTime
        if (primaryDate && primaryTime) {
          occurrences.push({ starts_at_utc: new Date(`${primaryDate}T${primaryTime}:00Z`).toISOString(), tz })
        }
        // Flatten nested extras: [{ date, times: [{ time }] }]
        for (const d of (data.extraOccurrences ?? [])) {
          if (!d?.date || !Array.isArray(d?.times)) continue
          for (const t of d.times) {
            if (!t?.time) continue
            occurrences.push({ starts_at_utc: new Date(`${d.date}T${t.time}:00Z`).toISOString(), tz })
          }
        }
        if (occurrences.length === 0) {
          setSubmitMessage('Please add at least one date & time')
          setIsSubmitting(false)
          return
        }
        payload = {
          ...payload,
          details: {
            show_name: data.title ?? '',
            short_description: data.shortDescription ?? '',
            credit_info: data.credits ?? '',
            ticket_price_cents: Number(String(data.ticketPrice ?? '0').replace(/[^0-9]/g, '')) || 0,
            ticket_link: data.ticketLink ?? '',
            agree_comp_tickets: Boolean(data.agreeCompTickets),
          },
          occurrences,
        }
        console.log('[submit][performance] occurrences', occurrences)
      } else if (type === 'audition') {
        const primaryDate = data.auditionDate ?? ''
        const primaryTime = data.auditionTime ?? '00:00'
        const occurrences = primaryDate ? [ { starts_at_utc: new Date(`${primaryDate}T${primaryTime}:00Z`).toISOString(), tz } ] : []
        payload = {
          ...payload,
          details: {
            audition_name: data.auditionName ?? '',
            about_project: data.aboutProject ?? '',
            eligibility: data.eligibility ?? '',
            compensation: data.compensation ?? '',
            audition_link: data.auditionLink ?? '',
          },
          occurrences,
        }
        console.log('[submit][audition] occurrences', occurrences)
      } else if (type === 'creative') {
        const deadlineIso = data.deadline ? new Date(data.deadline).toISOString() : new Date().toISOString()
        payload = {
          ...payload,
          details: {
            opportunity_name: data.opportunityName ?? '',
            brief_description: data.briefDescription ?? '',
            eligibility: data.creativeEligibility ?? '',
            whats_offered: data.whatsOffered ?? '',
            stipend_amount: data.stipendAmount ?? '',
            requirements: data.requirements ?? '',
            deadline: deadlineIso,
            apply_link: data.applyLink ?? '',
          },
          occurrences: [],
        }
        console.log('[submit][creative] deadline', deadlineIso)
      } else if (type === 'class') {
        const primaryDateRaw = (data.classDates ?? '').trim()
        const primaryTime = (data.classTimes ?? '00:00').trim()
        const tokens = primaryDateRaw
          ? primaryDateRaw.split(',').map(s => s.trim()).filter(Boolean)
          : []
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        const primaryList = tokens
          .filter(tok => dateRegex.test(tok))
          .map(tok => ({ starts_at_utc: new Date(`${tok}T${primaryTime}:00Z`).toISOString(), tz }))
        const extraOcc = (data.classExtraOccurrences ?? [])
          .filter(o => o?.date && o?.time)
          .map(o => ({ starts_at_utc: new Date(`${o.date}T${o.time}:00Z`).toISOString(), tz }))
        const occurrences = [...primaryList, ...extraOcc]
        if (occurrences.length === 0) {
          console.log('[submit][class] no occurrences', { primaryDateRaw, primaryTime, tokens, primaryListLen: primaryList.length, extraOccLen: extraOcc.length })
          setSubmitMessage('Please provide at least one valid class date/time')
          setIsSubmitting(false)
          return
        }
        const pricesArray = (data.classPrices ? String(data.classPrices).split(';').map(s => s.trim()).filter(Boolean) : []) as string[]
        payload = {
          ...payload,
          details: {
            festival_name: data.festivalName || null,
            festival_link: data.festivalLink || null,
            class_name: data.className ?? '',
            description: data.classDescription ?? '',
            prices: pricesArray,
            rrule: data.classRecurrence || null,
          },
          occurrences,
        }
        console.log('[submit][class] occurrences', occurrences)
      } else if (type === 'funding') {
        payload = {
          ...payload,
          details: {
            funding_link: data.fundingLink ?? '',
            title: data.fundingTitle || '',
            summary: data.fundingSummary || '',
          },
          occurrences: [],
        }
        console.log('[submit][funding] link', data.fundingLink)
      }
      console.log('[submit] type', type)
      console.log('[submit] payload', payload)
      const res = await fetch('/api/events/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        console.error('[submit] failed', j)
        const msg = j?.error?.issues ? 'Invalid input' : (j?.error?.code || 'Failed to submit')
        throw new Error(msg)
      }
      const created = await res.json()
      setSubmitMessage("Submitted successfully! Pending review.")
      form.reset()
      setTimeout(() => { onSuccess(); onClose() }, 1200)
      return created
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }, (errors) => {
    console.error('[submit] invalid form', errors)
    setSubmitMessage('Invalid input')
    setIsSubmitting(false)
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
        <PageNumbers current={step} total={2} />
      </div>
      {step === 1 && <BasicInfoStep form={form} eventType={eventType} onChangeType={setEventType} />}
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

      {submitMessage && (
        <Alert variant={submitMessage.includes('success') ? 'success' : 'error'}>{submitMessage}</Alert>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <div className="flex gap-2">
          {step > 1 && <Button type="button" variant="outline" onClick={goBack}>Back</Button>}
          {step === 1 && <Button type="button" variant="primary" onClick={goNext}>Next</Button>}
          {step === 2 && (
            <Button type="button" variant="primary" onClick={() => { handleSubmit() }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}