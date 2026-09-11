"use client"

import type { FormEvent, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Text } from "@/components/ui/typography"
import {
  ANNOUNCEMENT_POPUP_DEFAULT_CTA,
  announcementPopupButtonPreview,
} from "@/features/announcements/popup"
import {
  DEFAULT_DASHBOARD_WIDGET,
  isCopyableDashboardWidget,
  isDashboardWidgetOn,
  type AdminAnnouncement,
  type AnnouncementDashboardWidgetKind,
} from "@/features/announcements/types"
import type { AnnouncementAdminFormState } from "./announcement-admin-form"

export {
  emptyAnnouncementForm,
  formFromAnnouncement,
  toAnnouncementSavePayload,
} from "./announcement-admin-form"
export type { AnnouncementAdminFormState } from "./announcement-admin-form"

type AnnouncementAdminFormProps = {
  formData: AnnouncementAdminFormState
  onChange: (next: AnnouncementAdminFormState) => void
  editing: AdminAnnouncement | null
  submitting: boolean
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
}

function FormSection({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {hint ? <Text className="mt-1 text-xs text-gray-500">{hint}</Text> : null}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint ? <Text className="mt-1 text-xs text-gray-500">{hint}</Text> : null}
    </div>
  )
}

function CheckboxField({
  id,
  checked,
  label,
  hint,
  onChecked,
}: {
  id: string
  checked: boolean
  label: string
  hint?: string
  onChecked: (checked: boolean) => void
}) {
  return (
    <div>
      <div className="flex items-center">
        <Checkbox
          id={id}
          checked={checked}
          onChange={(e) => onChecked((e.target as HTMLInputElement).checked)}
        />
        <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      </div>
      {hint ? <Text className="mt-1 text-xs text-gray-500">{hint}</Text> : null}
    </div>
  )
}

export function AnnouncementAdminForm({
  formData,
  onChange,
  editing,
  submitting,
  onSubmit,
  onCancel,
}: AnnouncementAdminFormProps) {
  const patch = <K extends keyof AnnouncementAdminFormState>(
    key: K,
    value: AnnouncementAdminFormState[K]
  ) => {
    onChange({ ...formData, [key]: value })
  }

  const dashboardOn = isDashboardWidgetOn(formData.dashboardWidget)
  const hasActionButton = Boolean(formData.ctaKind)
  const popupButtons = announcementPopupButtonPreview({
    learnMoreEnabled: formData.popupLearnMoreEnabled,
    learnMoreLabel: formData.popupCtaLabel,
    showAnnouncementCta: hasActionButton && formData.popupShowAnnouncementCta,
    actionLabel: formData.ctaLabel,
  })

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault()
        }
      }}
      className="space-y-4"
    >
      <FormSection title="Announcement page">
        <Field label="Title">
          <Input
            value={formData.title}
            onChange={(e) => patch("title", e.target.value)}
            placeholder="Announcement title"
            required
          />
        </Field>

        <Field
          label="Content"
          hint="Use **bold**, *italic*, and dash or numbered lists. Paste stays plain text — add the marks here."
        >
          <Textarea
            value={formData.content}
            onChange={(e) => patch("content", e.target.value)}
            placeholder={
              "**Bold**, *italic*, and lists:\n- Who can apply\n- How to submit\n\nURLs become links automatically."
            }
            rows={10}
            required
          />
        </Field>

        <Field label="Hero image URL">
          <Input
            value={formData.heroImageUrl}
            onChange={(e) => patch("heroImageUrl", e.target.value)}
            placeholder="/images/workshop.jpg or https://…"
          />
        </Field>

        <Field
          label="Action button"
          hint="Shows on the announcement. The popup can reuse this too."
        >
          <Select
            value={formData.ctaKind}
            onChange={(e) =>
              patch("ctaKind", (e.target as HTMLSelectElement).value as AnnouncementAdminFormState["ctaKind"])
            }
            className="w-full"
          >
            <option value="">None</option>
            <option value="link">Link</option>
            <option value="authenticated_link">Sign-in required link</option>
          </Select>
        </Field>

        {hasActionButton ? (
          <>
            <Field label="Action button label">
              <Input
                value={formData.ctaLabel}
                onChange={(e) => patch("ctaLabel", e.target.value)}
                placeholder="Get your code"
                required
              />
            </Field>
            <Field label="Action button link">
              <Input
                value={formData.ctaHref}
                onChange={(e) => patch("ctaHref", e.target.value)}
                placeholder="/profile?announcement=… or https://…"
                required
              />
            </Field>
          </>
        ) : null}
      </FormSection>

      <FormSection
        title="Profile dashboard"
        hint="Signed-in members see this on their dashboard. Optional."
      >
        <CheckboxField
          id="dashboardEnabled"
          checked={dashboardOn}
          label="Show on dashboard"
          onChecked={(checked) =>
            onChange({
              ...formData,
              dashboardWidget: checked
                ? dashboardOn
                  ? formData.dashboardWidget
                  : DEFAULT_DASHBOARD_WIDGET
                : "none",
            })
          }
        />

        {dashboardOn ? (
          <>
            <Field label="Widget">
              <Select
                value={formData.dashboardWidget}
                onChange={(e) =>
                  patch(
                    "dashboardWidget",
                    (e.target as HTMLSelectElement).value as AnnouncementDashboardWidgetKind
                  )
                }
                className="w-full"
              >
                <option value="message">Text only</option>
                <option value="copyable_value">Copyable value (same for everyone)</option>
                <option value="member_code">Member code (standard vs fiscal)</option>
              </Select>
            </Field>
            {isCopyableDashboardWidget(formData.dashboardWidget) ? (
              <Field label="Value label">
                <Input
                  value={formData.dashboardWidgetLabel}
                  onChange={(e) => patch("dashboardWidgetLabel", e.target.value)}
                  placeholder="Your code"
                />
              </Field>
            ) : null}
            <Field
              label="Dashboard body"
              hint="Short copy on the profile dashboard."
            >
              <Textarea
                value={formData.dashboardWidgetBody}
                onChange={(e) => patch("dashboardWidgetBody", e.target.value)}
                placeholder="One or two sentences. **Bold**, *italic*, and lists work here too."
                rows={3}
              />
            </Field>
            {formData.dashboardWidget === "copyable_value" ? (
              <Field label="Value">
                <Input
                  value={formData.dashboardWidgetValue}
                  onChange={(e) => patch("dashboardWidgetValue", e.target.value)}
                  placeholder="EAR-WORKSHOP"
                  required
                />
              </Field>
            ) : null}
            <CheckboxField
              id="dashboardLearnMore"
              checked={formData.dashboardLearnMoreEnabled}
              label={`Show “${ANNOUNCEMENT_POPUP_DEFAULT_CTA}”`}
              hint="Links to this announcement."
              onChecked={(checked) => patch("dashboardLearnMoreEnabled", checked)}
            />
          </>
        ) : null}
      </FormSection>

      <FormSection
        title="App popup"
        hint="First-visit popup on any app page. If more than one is enabled, the newest published announcement wins."
      >
        <CheckboxField
          id="popupEnabled"
          checked={formData.popupEnabled}
          label="Show as app popup"
          onChecked={(checked) => patch("popupEnabled", checked)}
        />

        {formData.popupEnabled ? (
          <>
            <Field label="Popup headline">
              <Input
                value={formData.popupHeadline}
                onChange={(e) => patch("popupHeadline", e.target.value)}
                placeholder="Short headline"
                required
              />
            </Field>
            <Field label="Popup body">
              <Textarea
                value={formData.popupBody}
                onChange={(e) => patch("popupBody", e.target.value)}
                placeholder="One or two sentences. **Bold**, *italic*, and lists work here too."
                rows={3}
              />
            </Field>
            <CheckboxField
              id="popupLearnMore"
              checked={formData.popupLearnMoreEnabled}
              label={`Show “${ANNOUNCEMENT_POPUP_DEFAULT_CTA}”`}
              hint="Links to this announcement."
              onChecked={(checked) => patch("popupLearnMoreEnabled", checked)}
            />
            {formData.popupLearnMoreEnabled ? (
              <Field label="Learn more label">
                <Input
                  value={formData.popupCtaLabel}
                  onChange={(e) => patch("popupCtaLabel", e.target.value)}
                  placeholder={ANNOUNCEMENT_POPUP_DEFAULT_CTA}
                />
              </Field>
            ) : null}
            {hasActionButton ? (
              <CheckboxField
                id="popupShowAnnouncementCta"
                checked={formData.popupShowAnnouncementCta}
                label={`Also show “${formData.ctaLabel.trim() || "action button"}”`}
                hint="Same button as on the announcement page."
                onChecked={(checked) => patch("popupShowAnnouncementCta", checked)}
              />
            ) : null}
            <Text className="text-xs text-gray-500">
              {popupButtons.length > 0
                ? `Buttons: ${popupButtons.join(" · ")}`
                : "No buttons. People can close the popup."}
            </Text>
            {editing?.popupEnabled ? (
              <CheckboxField
                id="popupShowAgain"
                checked={formData.popupShowAgain}
                label="Show again to people who dismissed this"
                onChecked={(checked) => patch("popupShowAgain", checked)}
              />
            ) : null}
          </>
        ) : null}
      </FormSection>

      <FormSection title="Visibility">
        <CheckboxField
          id="isActive"
          checked={formData.isActive}
          label="Active (visible to users)"
          onChecked={(checked) => patch("isActive", checked)}
        />
      </FormSection>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Saving..." : editing ? "Update" : "Create"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
