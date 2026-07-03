"use client"

import { useEffect, useId } from "react"
import { Controller, Path, UseFormReturn } from "react-hook-form"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { Input } from "@/components/ui/input"
import { Caption, Label, Muted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import {
  clearedInPersonLocationFields,
  DEFAULT_LOCATION_MODE,
  isOnlineLocationMode,
  LOCATION_MODE_IN_PERSON,
  LOCATION_MODE_ONLINE,
  LOCATION_MODE_OPTIONS,
  type LocationMode,
} from "@/lib/location/mode"
import { FormFieldTooltip } from "@/components/forms/blocks/FormFieldTooltip"
import { form as formSpacing, stack } from "@/lib/spacing"

export type LocationSectionProps<T extends Record<string, unknown>> = {
  form: UseFormReturn<T>
  modeName?: Path<T>
  addressName: Path<T>
  venueName?: Path<T>
  placeIdName?: Path<T>
  latName?: Path<T>
  lngName?: Path<T>
  instructionsName?: Path<T>
  label?: string
  /** Tooltip beside the section label (e.g. undisclosed venue guidance). */
  labelTooltip?: string
  note?: string
  instructionsLabel?: string
  instructionsNote?: string
  instructionsPlaceholder?: string
  onlineInstructionsLabel?: string
  onlineInstructionsPlaceholder?: string
  required?: boolean
  showAsterisk?: boolean
  compact?: boolean
  instructionsCollapsible?: boolean
  includeInstructionsInPlace?: boolean
  errorMode?: "touched" | "always"
  className?: string
}

export function LocationSection<T extends Record<string, unknown>>({
  form,
  modeName = "locationMode" as Path<T>,
  addressName,
  venueName,
  placeIdName,
  latName,
  lngName,
  instructionsName,
  label = "Location",
  labelTooltip,
  note,
  instructionsLabel = "Location instructions",
  instructionsNote,
  instructionsPlaceholder = "Provide details to help attendees find the space.",
  onlineInstructionsLabel = "How to attend online",
  onlineInstructionsPlaceholder = "Link, platform, or instructions (e.g. Zoom URL, registration page, password)",
  required = false,
  showAsterisk = true,
  compact = false,
  instructionsCollapsible = false,
  includeInstructionsInPlace = true,
  errorMode = "touched",
  className,
}: LocationSectionProps<T>) {
  const groupId = useId()
  const mode = form.watch(modeName) as LocationMode | undefined
  const isOnline = isOnlineLocationMode(mode)
  const showLabel = Boolean(label?.trim())

  useEffect(() => {
    const current = form.getValues(modeName)
    if (current === LOCATION_MODE_IN_PERSON || current === LOCATION_MODE_ONLINE) return
    form.setValue(modeName, DEFAULT_LOCATION_MODE as never, { shouldDirty: false })
  }, [form, modeName])

  const clearInPersonFields = () => {
    const cleared = clearedInPersonLocationFields()
    form.setValue(addressName, cleared.address as never, { shouldDirty: true })
    if (venueName) form.setValue(venueName, cleared.venueName as never, { shouldDirty: true })
    if (placeIdName) form.setValue(placeIdName, cleared.placeId as never, { shouldDirty: true })
    if (latName) form.setValue(latName, cleared.lat as never, { shouldDirty: true })
    if (lngName) form.setValue(lngName, cleared.lng as never, { shouldDirty: true })
  }

  const handleModeChange = (next: LocationMode) => {
    form.setValue(modeName, next as never, { shouldDirty: true, shouldValidate: true })
    if (next === LOCATION_MODE_ONLINE) {
      clearInPersonFields()
    }
    void form.trigger([modeName, addressName, ...(instructionsName ? [instructionsName] : [])] as never)
  }

  void form.formState.errors
  const modeState = form.getFieldState(modeName, form.formState)
  const showModeErr =
    modeState.error &&
    (errorMode === "always" ||
      modeState.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)

  return (
    <div className={cn(formSpacing.section, className)}>
      <div className={stack.xs}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1",
            showLabel ? "justify-between" : "justify-end",
          )}
        >
          {showLabel ? (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <Label className="text-text-primary">
                {label} {required && showAsterisk ? <span className="text-error-600">*</span> : null}
              </Label>
              {labelTooltip?.trim() ? <FormFieldTooltip text={labelTooltip.trim()} /> : null}
            </div>
          ) : null}
          <fieldset className="m-0 min-w-0 shrink-0 border-0 p-0" aria-labelledby={groupId}>
            <legend id={groupId} className="sr-only">
              {showLabel ? `${label} type` : "Location type"}
            </legend>
            <div
              className="relative inline-grid grid-cols-2 rounded-full bg-primary-600 p-0.5"
              role="radiogroup"
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-0.5 bottom-0.5 w-[calc(50%-0.125rem)] rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out",
                  isOnline ? "left-[calc(50%+0.0625rem)]" : "left-0.5",
                )}
              />
              {LOCATION_MODE_OPTIONS.map((opt) => {
                const selected = (mode ?? DEFAULT_LOCATION_MODE) === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={cn(
                      "relative z-10 rounded-full px-2 py-0.5 text-xs font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-1 focus-visible:ring-offset-primary-600",
                      selected ? "text-primary-900" : "text-white hover:text-white/90",
                    )}
                    onClick={() => handleModeChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>
        {note && !compact ? <Muted>{note}</Muted> : null}
        {showModeErr && modeState.error?.message ? (
          <Caption className="text-error-600">{String(modeState.error.message)}</Caption>
        ) : null}
      </div>

      {isOnline ? (
        instructionsName ? (
          <OnlineInstructionsField
            form={form}
            instructionsName={instructionsName}
            label={onlineInstructionsLabel}
            placeholder={onlineInstructionsPlaceholder}
            required={required}
            errorMode={errorMode}
          />
        ) : null
      ) : (
        <LocationField
          form={form}
          addressName={addressName}
          venueName={venueName}
          placeIdName={placeIdName}
          latName={latName}
          lngName={lngName}
          instructionsName={instructionsName}
          label=""
          showAsterisk={false}
          instructionsLabel={instructionsLabel}
          instructionsNote={instructionsNote}
          instructionsPlaceholder={instructionsPlaceholder}
          required={required}
          compact={compact}
          instructionsCollapsible={instructionsCollapsible}
          includeInstructionsInPlace={includeInstructionsInPlace}
          errorMode={errorMode}
        />
      )}
    </div>
  )
}

function OnlineInstructionsField<T extends Record<string, unknown>>({
  form,
  instructionsName,
  label,
  placeholder,
  required,
  errorMode,
}: {
  form: UseFormReturn<T>
  instructionsName: Path<T>
  label: string
  placeholder: string
  required?: boolean
  errorMode: "touched" | "always"
}) {
  const fieldId = useId()
  void form.formState.errors
  const state = form.getFieldState(instructionsName, form.formState)
  const showErr =
    state.error &&
    (errorMode === "always" ||
      state.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)

  return (
    <div className={stack.sm}>
      <div className={stack.xs}>
        <Label htmlFor={fieldId}>
          {label} {required ? <span className="text-error-600">*</span> : null}
        </Label>
        <Muted>Share how people join — link, platform, or other access details.</Muted>
      </div>
      <Controller
        control={form.control}
        name={instructionsName}
        rules={
          required
            ? { required: "Please add how to attend online" }
            : undefined
        }
        render={({ field }) => (
          <Input
            id={fieldId}
            error={Boolean(showErr)}
            placeholder={placeholder}
            value={(field.value as string) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      />
      {showErr && state.error?.message ? (
        <Caption className="text-error-600">{String(state.error.message)}</Caption>
      ) : null}
    </div>
  )
}
