"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { EventFormData } from "@/lib/validations/events"

type ReferralOption = "INSTAGRAM" | "WORD_OF_MOUTH" | "GOOGLE" | "OTHER"

interface WrapUpStepProps {
  form: UseFormReturn<EventFormData>
  hasSubmittedBefore: null | boolean
  setHasSubmittedBefore: (val: null | boolean) => void
}

export function WrapUpStep({ form, hasSubmittedBefore, setHasSubmittedBefore }: WrapUpStepProps) {
  const { register, watch, setValue } = form
  const selected = (watch("referralSources") || []) as ReferralOption[]
  const toggle = (opt: ReferralOption, checked: boolean) => {
    const current = new Set<ReferralOption>(selected)
    if (checked) current.add(opt)
    else current.delete(opt)
    setValue("referralSources", Array.from(current))
  }
  return (
    <>
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
                checked={selected.includes(opt.value)}
                onChange={(e) => toggle(opt.value, e.target.checked)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {selected.includes("OTHER") && (
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Have you submitted to EAR before?</label>
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="submittedBefore" checked={hasSubmittedBefore === true} onChange={() => setHasSubmittedBefore(true)} /> Yes
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="submittedBefore" checked={hasSubmittedBefore === false} onChange={() => setHasSubmittedBefore(false)} /> No
          </label>
        </div>
      </div>
    </>
  )
}