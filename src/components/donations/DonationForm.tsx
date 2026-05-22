"use client"

import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import type { Resolver } from "react-hook-form"
import {
  donationArtistFormSchema,
  donationArtistWithDesignationFormSchema,
  donationFormSchema,
  type DonationFormData,
} from "@/lib/validations/donations"
import type { DonationDesignationConfigParsed } from "@/lib/donations/donationDesignationConfig"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { Alert } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/contexts/ToastContext"
import { apiPost, apiGet } from "@/lib/fetch-utils"
import { H2, Text } from "@/components/ui/typography"
import { Card } from "@/components/ui/card"
import { DonationFunnelTrustHeader } from "@/components/donations/DonationFunnelTrustHeader"
import { computeGrossChargeCents } from "@/lib/payments/computeDonationCharge"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageWithBlurredFill } from "@/components/shared/ImageWithBlurredFill"

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000]

interface ProfileData {
  name: string | null
  email: string | null
}

export type DonationLockedRecipient = {
  userId: string
  displayName: string | null
  slug: string
  /** Optional hero from profile; only used on /donate/[slug]. */
  donationPageMessage?: string | null
  donationPageImageUrl?: string | null
  /** When set, designation dropdown is shown (options in array order). */
  donationDesignation?: DonationDesignationConfigParsed | null
}

/** Hardcoded org hero for /donate only; ignored when `lockedRecipient` is set. */
export type OrgDonationHero = {
  /** Public path (e.g. /donate-ear-hero.JPG). Omit or leave empty to show message only. */
  imageSrc?: string
  message: string
  alt?: string
}

interface DonationFormProps {
  lockedRecipient?: DonationLockedRecipient
  statusMessage?: "canceled" | null
  orgDonationHero?: OrgDonationHero
}

export function DonationForm({ lockedRecipient, statusMessage, orgDonationHero }: DonationFormProps) {
  const { user, userName } = useAuth()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  const effectiveOrgHero = !lockedRecipient ? orgDonationHero : undefined
  const orgHeroMessageText = effectiveOrgHero?.message?.trim() ?? ""
  const orgHeroImageSrc = effectiveOrgHero?.imageSrc?.trim() || undefined
  /** Only show org hero image after preload succeeds — avoids broken-image icon flash on 404. */
  const [orgHeroImageReady, setOrgHeroImageReady] = useState(false)

  useEffect(() => {
    setOrgHeroImageReady(false)
    if (!orgHeroImageSrc) return

    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setOrgHeroImageReady(true)
    }
    img.onerror = () => {
      if (!cancelled) setOrgHeroImageReady(false)
    }
    img.src = orgHeroImageSrc

    return () => {
      cancelled = true
    }
  }, [orgHeroImageSrc])

  const artistMessageText = lockedRecipient?.donationPageMessage?.trim() ?? ""
  const [artistMessageExpanded, setArtistMessageExpanded] = useState(false)
  const [artistMessageOverflows, setArtistMessageOverflows] = useState(false)
  const artistMessageRef = useRef<HTMLParagraphElement>(null)

  const [orgMessageExpanded, setOrgMessageExpanded] = useState(false)
  const [orgMessageOverflows, setOrgMessageOverflows] = useState(false)
  const orgMessageRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    setArtistMessageExpanded(false)
  }, [artistMessageText])

  useEffect(() => {
    setOrgMessageExpanded(false)
  }, [orgHeroMessageText])

  useLayoutEffect(() => {
    if (!artistMessageText) return
    const el = artistMessageRef.current
    if (!el) return
    if (artistMessageExpanded) return
    setArtistMessageOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [artistMessageText, artistMessageExpanded])

  useLayoutEffect(() => {
    if (!orgHeroMessageText) return
    const el = orgMessageRef.current
    if (!el) return
    if (orgMessageExpanded) return
    setOrgMessageOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [orgHeroMessageText, orgMessageExpanded])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const profile = await apiGet<ProfileData>("/api/profile")
        setProfileData({
          name: profile?.name || null,
          email: profile?.email || null,
        })
      } catch (error) {
        console.error("Error fetching profile:", error)
      }
    }
    fetchProfile()
  }, [user])

  const validationSchema = useMemo(() => {
    if (lockedRecipient?.donationDesignation) {
      return donationArtistWithDesignationFormSchema
    }
    if (lockedRecipient) {
      return donationArtistFormSchema
    }
    return donationFormSchema
  }, [lockedRecipient])

  const resolver = useMemo(
    () => zodResolver(validationSchema) as unknown as Resolver<DonationFormData>,
    [validationSchema],
  )

  const defaultDesignationId = lockedRecipient?.donationDesignation?.options[0]?.id ?? ""

  const form = useForm<DonationFormData>({
    resolver,
    defaultValues: {
      amount: 0,
      donor_name: profileData?.name || userName || "",
      donor_email: profileData?.email || user?.email || "",
      message: "",
      cover_card_fee: false,
      cover_fiscal_fee: false,
      designation_option_id: defaultDesignationId,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  useEffect(() => {
    if (profileData) {
      form.setValue("donor_name", profileData.name || userName || "")
      form.setValue("donor_email", profileData.email || user?.email || "")
    }
  }, [profileData, userName, user, form])

  useEffect(() => {
    const first = lockedRecipient?.donationDesignation?.options[0]?.id
    if (first) {
      form.setValue("designation_option_id", first)
    }
  }, [lockedRecipient?.donationDesignation, form])

  const setPresetAmount = (amount: number) => {
    form.setValue("amount", amount * 100)
    form.trigger("amount")
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (!data.amount || data.amount < 100) {
        form.setError("amount", { message: "Minimum donation is $1.00" })
        setIsSubmitting(false)
        return
      }

      const donationResponse = await apiPost<{ id: string }>("/api/donations", {
        amount: data.amount,
        donor_name: data.donor_name?.trim() ? data.donor_name.trim() : null,
        donor_email: data.donor_email,
        message: data.message?.trim() || null,
        cover_card_fee: Boolean(data.cover_card_fee),
        cover_fiscal_fee: isArtistDonation ? Boolean(data.cover_fiscal_fee) : false,
        ...(lockedRecipient
          ? {
              recipient_user_id: lockedRecipient.userId,
              recipient_slug: lockedRecipient.slug,
            }
          : {}),
        ...(lockedRecipient?.donationDesignation && data.designation_option_id?.trim()
          ? { designation_option_id: data.designation_option_id.trim() }
          : {}),
      })

      if (!donationResponse?.id) {
        throw new Error("Failed to create donation")
      }

      const checkoutResponse = await apiPost<{ url?: string; already_paid?: boolean }>(
        "/api/stripe/create-donation-session",
        {
          donationId: donationResponse.id,
        },
      )

      if (checkoutResponse?.already_paid) {
        showToast("This donation was already completed.", "success")
        setIsSubmitting(false)
        return
      }

      if (!checkoutResponse?.url) {
        throw new Error("Failed to create payment session")
      }

      window.location.href = checkoutResponse.url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong"
      setError(errorMessage)
      showToast(errorMessage, "error")
      setIsSubmitting(false)
    }
  })

  const amountValue = form.watch("amount")
  const baseGiftCents = amountValue || 0
  const amountInDollars = baseGiftCents / 100
  const coverCardFee = form.watch("cover_card_fee")
  const coverFiscalFee = form.watch("cover_fiscal_fee")
  const isArtistDonation = Boolean(lockedRecipient)

  const totalChargedCents = computeGrossChargeCents(baseGiftCents, Boolean(coverFiscalFee), Boolean(coverCardFee))
  const totalChargedDollars = totalChargedCents / 100
  const feesCoveredCents = Math.max(0, totalChargedCents - baseGiftCents)
  const feesCoveredDollars = feesCoveredCents / 100

  const recipientLabel = lockedRecipient?.displayName?.trim() || "this artist"
  const heroImageAlt =
    lockedRecipient && lockedRecipient.donationPageImageUrl
      ? `Image from ${recipientLabel}`
      : ""

  return (
    <>
      <DonationFunnelTrustHeader
        variant={lockedRecipient ? "artist" : "generic"}
        className="mb-4 max-w-3xl mx-auto gap-1.5 px-2"
      />
    <Card className="max-w-3xl mx-auto px-6 py-5 bg-white">
      {lockedRecipient?.donationPageImageUrl ? (
        <ImageWithBlurredFill
          src={lockedRecipient.donationPageImageUrl}
          alt={heroImageAlt}
          className="mb-4 rounded-lg border border-gray-200 bg-gray-50"
          frameClassName="aspect-[16/9] w-full max-h-64"
          hideOnError
        />
      ) : effectiveOrgHero && orgHeroImageSrc && orgHeroImageReady ? (
        <ImageWithBlurredFill
          src={orgHeroImageSrc}
          alt={effectiveOrgHero.alt ?? "Emerging Artist Resources"}
          className="mb-4 rounded-lg border border-gray-200 bg-gray-50"
          frameClassName="aspect-[16/9] w-full max-h-64"
          hideOnError
          onError={() => setOrgHeroImageReady(false)}
        />
      ) : null}
      <div className="mb-4">
        <H2 className="text-2xl font-bold text-gray-900 mb-1">
          {lockedRecipient ? `Support ${recipientLabel}` : "Make a Donation"}
        </H2>
        {lockedRecipient || effectiveOrgHero ? (
          <Text className="text-gray-600">Your gift is tax-deductible to the extent permitted by law.</Text>
        ) : (
          <Text className="text-gray-600">
            Your support helps us continue providing resources for emerging artists.
          </Text>
        )}
      </div>
      {artistMessageText ? (
        <div className="mb-4">
          <p
            ref={artistMessageRef}
            className={cn(
              "text-sm leading-6 text-gray-700 whitespace-pre-wrap",
              !artistMessageExpanded && "line-clamp-2",
            )}
          >
            {artistMessageText}
          </p>
          {(artistMessageOverflows || artistMessageExpanded) && (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              aria-expanded={artistMessageExpanded}
              onClick={() => setArtistMessageExpanded((v) => !v)}
            >
              {artistMessageExpanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
      ) : orgHeroMessageText ? (
        <div className="mb-4">
          <p
            ref={orgMessageRef}
            className={cn(
              "text-sm leading-6 text-gray-700 whitespace-pre-wrap",
              !orgMessageExpanded && "line-clamp-2",
            )}
          >
            {orgHeroMessageText}
          </p>
          {(orgMessageOverflows || orgMessageExpanded) && (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              aria-expanded={orgMessageExpanded}
              onClick={() => setOrgMessageExpanded((v) => !v)}
            >
              {orgMessageExpanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
      ) : null}

      {statusMessage === "canceled" && (
        <Alert variant="error" className="mb-6">
          Checkout was canceled. You can adjust your amount and try again when you are ready.
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Donation Amount <span className="text-error-600">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {PRESET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={amountInDollars === amount ? "primary" : "outline"}
                onClick={() => setPresetAmount(amount)}
                className="w-full"
              >
                ${amount}
              </Button>
            ))}
          </div>
          <div>
            <div className="mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Custom Amount <span className="text-error-600">*</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">Minimum $1.00</p>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max="100000"
                placeholder="Enter amount in dollars"
                className="w-full bg-white pl-7 rounded-md border border-gray-300 px-3 py-2"
                value={amountInDollars > 0 ? amountInDollars : ""}
                onChange={(e) => {
                  const dollars = parseFloat(e.target.value) || 0
                  const cents = Math.round(dollars * 100)
                  form.setValue("amount", cents, { shouldValidate: true })
                }}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="mt-1 text-sm text-error-600">
                {form.formState.errors.amount.message}
              </p>
            )}
            {amountInDollars > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                ${totalChargedDollars.toFixed(2)} will be charged
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            {isArtistDonation
              ? "Add these optional fees so the artist receives the full amount of your donation."
              : "Add these optional fees so EAR receives the full amount of your donation."}
          </p>
          {isArtistDonation && (
            <label className="flex items-start gap-2 text-sm text-gray-800">
              <Checkbox
                checked={Boolean(coverFiscalFee)}
                onChange={(e) => {
                  form.setValue("cover_fiscal_fee", (e.target as HTMLInputElement).checked, {
                    shouldValidate: false,
                  })
                }}
              />
              <span>Cover fiscal sponsorship fee (5.5%)</span>
            </label>
          )}
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <Checkbox
              checked={Boolean(coverCardFee)}
              onChange={(e) => {
                form.setValue("cover_card_fee", (e.target as HTMLInputElement).checked, {
                  shouldValidate: false,
                })
              }}
            />
            <span>Cover processing fees (2.9% + $0.30)</span>
          </label>

          {amountInDollars > 0 && (
            <div className="rounded-md p-3 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-medium text-gray-900">Donation:</span> ${amountInDollars.toFixed(2)}
              </p>
              <p>
                <span className="font-medium text-gray-900">Fees covered:</span> ${feesCoveredDollars.toFixed(2)}
              </p>
              <p className="font-semibold text-gray-900">Total charged: ${totalChargedDollars.toFixed(2)}</p>
            </div>
          )}
        </div>

        {lockedRecipient?.donationDesignation ? (
          <div>
            <label
              htmlFor="donation-designation-option"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {lockedRecipient.donationDesignation.fieldLabel}
            </label>
            <select
              id="donation-designation-option"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...form.register("designation_option_id")}
            >
              {lockedRecipient.donationDesignation.options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {form.formState.errors.designation_option_id && (
              <p className="mt-1 text-sm text-error-600">
                {form.formState.errors.designation_option_id.message}
              </p>
            )}
          </div>
        ) : null}

        <TextField
          form={form}
          name="donor_name"
          label="Name"
          placeholder="Your name"
          required
          inputClassName="bg-white ring-offset-white"
        />

        <TextField
          form={form}
          name="donor_email"
          label="Email"
          type="email"
          placeholder="your.email@example.com"
          required
          inputClassName="bg-white ring-offset-white"
        />

        <TextAreaField
          form={form}
          name="message"
          label="Message"
          placeholder="Optional message (optional)"
          rows={4}
          inputClassName="bg-white ring-offset-white"
        />

        <div className="space-y-3">
          <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock className="size-3.5 shrink-0 text-gray-400" aria-hidden />
            <span>Payments are securely processed by Stripe.</span>
          </p>
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 bg-ear-dark-red text-ear-off-white hover:bg-ear-dark-red/90"
            >
              {isSubmitting ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-500">
            Questions? Contact us at{" "}
            <a
              href="mailto:info@eararts.org"
              className="text-gray-600 underline underline-offset-2 hover:text-gray-900"
            >
              info@eararts.org
            </a>
            .
          </p>
        </div>
      </form>
    </Card>
    </>
  )
}
