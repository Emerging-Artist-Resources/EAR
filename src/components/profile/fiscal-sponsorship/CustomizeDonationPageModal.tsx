"use client"

import { useEffect, useState } from "react"
import { useFieldArray } from "react-hook-form"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Text } from "@/components/ui/typography"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { TextField } from "@/components/forms/blocks/TextField"
import { Section } from "@/components/forms/blocks/Section"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import type { Resolver } from "react-hook-form"
import { apiPatch } from "@/lib/client/fetch-utils"
import { useToast } from "@/contexts/ToastContext"
import { useAuth } from "@/hooks/use-auth"
import type { DonationPageSettings } from "@/lib/donations/donationPageSettings"
import {
  buildDesignationConfigFromFormRows,
  createEmptyDesignationOptionFormRow,
  mapDesignationToFormRows,
} from "@/lib/donations/donationDesignationIds"
import {
  DONATION_PRESET_MAX_COUNT,
} from "@/lib/donations/donationPresetAmounts"
import {
  customizeDonationPageFormSchema,
  mapCustomizeFormToUpdatePayload,
  sanitizeCustomizeDonationPageFormData,
  type CustomizeDonationPageFormData,
} from "@/lib/validations/donation-page"
import {
  removeDonationPageImageFromStorage,
  uploadDonationPageImage,
} from "@/lib/storage/uploadDonationPageImage"
import { saveDonationPageWithImageChanges } from "@/lib/storage/saveDonationPageImageChanges"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"
import { DonationPageImageField } from "@/components/profile/fiscal-sponsorship/DonationPageImageField"

const copy = fiscalSponsorshipDashboard.customizeDonationPage

function mapSettingsToFormValues(settings: DonationPageSettings): CustomizeDonationPageFormData {
  const designation = mapDesignationToFormRows(settings.donation_designation)

  return {
    donation_page_message: settings.donation_page_message ?? "",
    donation_preset_amounts: settings.donation_preset_amounts.map(String),
    designation_enabled: settings.designation_enabled,
    designation_field_label: designation.fieldLabel,
    designation_options: designation.options,
    donation_page_image_files: [],
  }
}

export function CustomizeDonationPageModal({
  isOpen,
  onClose,
  initialSettings,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  initialSettings: DonationPageSettings
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)

  const form = useForm<CustomizeDonationPageFormData>({
    resolver: zodResolver(
      customizeDonationPageFormSchema,
    ) as Resolver<CustomizeDonationPageFormData>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: mapSettingsToFormValues(initialSettings),
  })

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: "designation_options",
    // Keep our stable option `id` as form data; RHF needs a different key name.
    keyName: "fieldKey",
  })

  const designationEnabled = form.watch("designation_enabled")
  const presetAmounts = form.watch("donation_preset_amounts")

  const addPreset = () => {
    if (presetAmounts.length < DONATION_PRESET_MAX_COUNT) {
      form.setValue("donation_preset_amounts", [...presetAmounts, ""], { shouldValidate: true })
    }
  }

  const removePresetAt = (index: number) => {
    form.setValue(
      "donation_preset_amounts",
      presetAmounts.filter((_, currentIndex) => currentIndex !== index),
      { shouldValidate: true },
    )
  }

  useEffect(() => {
    if (isOpen) {
      form.reset(mapSettingsToFormValues(initialSettings))
      setRemoveExistingImage(false)
      setSaveError(null)
    }
  }, [isOpen, initialSettings, form])

  const handleSubmit = async (values: CustomizeDonationPageFormData) => {
    if (!user?.id) {
      setSaveError("Please sign in to save your donation page settings")
      return
    }

    setSaveError(null)
    setSaving(true)

    const sanitizedValues = sanitizeCustomizeDonationPageFormData(values)
    form.setValue("donation_preset_amounts", sanitizedValues.donation_preset_amounts, {
      shouldValidate: false,
    })

    try {
      const payload = mapCustomizeFormToUpdatePayload(sanitizedValues, buildDesignationConfigFromFormRows)
      const pendingFile = sanitizedValues.donation_page_image_files?.[0]

      await saveDonationPageWithImageChanges({
        userId: user.id,
        payload,
        pendingFile,
        removeExisting: removeExistingImage,
        previousImagePath: initialSettings.donation_page_image_path,
        deps: {
          upload: uploadDonationPageImage,
          remove: removeDonationPageImageFromStorage,
          patch: (body) => apiPatch<DonationPageSettings>("/api/profile/donation-page", body),
        },
      })
      showToast(copy.saveSuccess, "success")
      onSuccess()
      onClose()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save donation page settings")
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={copy.modalTitle}
      size="lg"
      closeOnOverlay={false}
      showCloseButton={!saving}
    >
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 px-1 pb-2"
      >
        {saveError ? (
          <Alert variant="error">
            <Text className="text-sm">{saveError}</Text>
          </Alert>
        ) : null}

        <Section title={copy.message.title} description={copy.message.description}>
          <TextAreaField
            form={form}
            name="donation_page_message"
            label={copy.message.label}
            placeholder={copy.message.placeholder}
            rows={4}
            showAsterisk={false}
            inputClassName="bg-white"
          />
        </Section>

        <Section title={copy.image.title} description={copy.image.description}>
          <DonationPageImageField
            form={form}
            existingImageUrl={initialSettings.donation_page_image_url}
            removeExisting={removeExistingImage}
            onRemoveExistingChange={setRemoveExistingImage}
          />
        </Section>

        <Section title={copy.presets.title} description={copy.presets.description}>
          <div className="space-y-3">
            {presetAmounts.map((_, index) => (
              <div key={`preset-${index}`} className="flex items-start gap-2">
                <TextField
                  form={form}
                  name={`donation_preset_amounts.${index}`}
                  label={`${copy.presets.title} ${index + 1}`}
                  type="number"
                  prefix="$"
                  showAsterisk={false}
                  inputClassName="bg-white"
                  className="flex-1"
                />
                {presetAmounts.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-7"
                    onClick={() => removePresetAt(index)}
                  >
                    {copy.presets.removeLabel}
                  </Button>
                ) : null}
              </div>
            ))}
            {form.formState.errors.donation_preset_amounts?.message ? (
              <Text className="text-sm text-error-600">
                {form.formState.errors.donation_preset_amounts.message}
              </Text>
            ) : null}
            {presetAmounts.length < DONATION_PRESET_MAX_COUNT ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPreset}
              >
                {copy.presets.addLabel}
              </Button>
            ) : null}
            <Text className="text-sm text-gray-600">{copy.presets.defaultHint}</Text>
          </div>
        </Section>

        <Section title={copy.designation.title} description={copy.designation.description}>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={designationEnabled}
              onChange={(event) => {
                form.setValue("designation_enabled", event.target.checked, {
                  shouldValidate: true,
                })
              }}
              className="mt-0.5"
            />
            <Text className="text-sm text-gray-700">{copy.designation.enabledLabel}</Text>
          </label>

          {designationEnabled ? (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <TextField
                form={form}
                name="designation_field_label"
                label={copy.designation.fieldLabel}
                placeholder={copy.designation.fieldPlaceholder}
                required
                inputClassName="bg-white"
              />

              <div className="space-y-3">
                {optionFields.map((field, index) => (
                  <div key={field.fieldKey} className="flex items-start gap-2">
                    {/* Keep option id in form state without colliding with RHF's fieldKey. */}
                    <input
                      type="hidden"
                      {...form.register(`designation_options.${index}.id`)}
                    />
                    <TextField
                      form={form}
                      name={`designation_options.${index}.label`}
                      label={`${copy.designation.optionLabel} ${index + 1}`}
                      placeholder={copy.designation.optionPlaceholder}
                      required
                      inputClassName="bg-white"
                      className="flex-1"
                    />
                    {optionFields.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-7"
                        onClick={() => removeOption(index)}
                      >
                        {copy.designation.removeOptionLabel}
                      </Button>
                    ) : null}
                  </div>
                ))}
                {form.formState.errors.designation_options?.message ? (
                  <Text className="text-sm text-error-600">
                    {form.formState.errors.designation_options.message}
                  </Text>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendOption(createEmptyDesignationOptionFormRow())}
                >
                  {copy.designation.addOptionLabel}
                </Button>
              </div>
            </div>
          ) : null}
        </Section>

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            {copy.cancelLabel}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? copy.savingLabel : copy.saveLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
