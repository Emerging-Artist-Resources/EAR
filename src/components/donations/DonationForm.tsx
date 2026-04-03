"use client"

import { useState, useEffect } from "react"
import { useForm, zodResolver } from "@/lib/vendor/react-hook-form-zod"
import type { Resolver } from "react-hook-form"
import { donationFormSchema, type DonationFormData } from "@/lib/validations/donations"
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

const PRESET_AMOUNTS = [25, 50, 100, 250, 500]

interface ProfileData {
  name: string | null
  email: string | null
}

export type DonationLockedRecipient = {
  userId: string
  displayName: string | null
  slug: string
}

interface DonationFormProps {
  lockedRecipient?: DonationLockedRecipient
  statusMessage?: "canceled" | null
}

export function DonationForm({ lockedRecipient, statusMessage }: DonationFormProps) {
  const { user, userName } = useAuth()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

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

  const resolver = zodResolver(donationFormSchema) as unknown as Resolver<DonationFormData>
  const form = useForm<DonationFormData>({
    resolver,
    defaultValues: {
      amount: 0,
      donor_name: profileData?.name || userName || "",
      donor_email: profileData?.email || user?.email || "",
      message: "",
      cover_card_fee: false,
      cover_fiscal_fee: false,
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
        donor_name: data.donor_name?.trim() || null,
        donor_email: data.donor_email,
        message: data.message?.trim() || null,
        cover_card_fee: Boolean(data.cover_card_fee) && Boolean(lockedRecipient),
        cover_fiscal_fee: Boolean(data.cover_fiscal_fee) && Boolean(lockedRecipient),
        ...(lockedRecipient
          ? {
              recipient_user_id: lockedRecipient.userId,
              recipient_slug: lockedRecipient.slug,
            }
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

  const totalChargedCents = isArtistDonation
    ? computeGrossChargeCents(baseGiftCents, Boolean(coverFiscalFee), Boolean(coverCardFee))
    : baseGiftCents
  const totalChargedDollars = totalChargedCents / 100
  const feesCoveredCents = Math.max(0, totalChargedCents - baseGiftCents)
  const feesCoveredDollars = feesCoveredCents / 100
  const showFeeBreakdown =
    isArtistDonation && baseGiftCents > 0 && (Boolean(coverFiscalFee) || Boolean(coverCardFee))

  const recipientLabel =
    lockedRecipient?.displayName?.trim() || "this artist"

  return (
    <>
      <DonationFunnelTrustHeader
        variant={lockedRecipient ? "artist" : "generic"}
        className="mb-6 max-w-2xl mx-auto px-2"
      />
    <Card className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <H2 className="text-2xl font-bold text-gray-900 mb-2">
          {lockedRecipient ? `Support ${recipientLabel}` : "Make a Donation"}
        </H2>
        <Text className="text-gray-600">
          {lockedRecipient
            ? "Your gift is a fiscally sponsored donation to support this artist."
            : "Your support helps us continue providing resources for emerging artists."}
        </Text>
      </div>

      {statusMessage === "canceled" && (
        <Alert variant="error" className="mb-6">
          Checkout was canceled. You can adjust your amount and try again when you are ready.
        </Alert>
      )}

      {/* {lockedRecipient && (
        <Alert variant="default" className="mb-6">
          Donating to <span className="font-semibold">{recipientLabel}</span>. Recipient cannot be changed on
          this page.
        </Alert>
      )} */}

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
                className="w-full pl-7 rounded-md border border-gray-300 px-3 py-2"
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

        {isArtistDonation && (
          <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              Add these optional fees so the artist receives the full amount of your donation.
            </p>
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
              <div className="rounded-md bg-white p-3 text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-medium text-gray-900">Donation:</span> ${amountInDollars.toFixed(2)}
                </p>
                {showFeeBreakdown && (
                  <p>
                    <span className="font-medium text-gray-900">Fees covered:</span> $
                    {feesCoveredDollars.toFixed(2)}
                  </p>
                )}
                <p className="font-semibold text-gray-900">Total charged: ${totalChargedDollars.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        <TextField
          form={form}
          name="donor_name"
          label="Name"
          placeholder="Your name (optional)"
        />

        <TextField
          form={form}
          name="donor_email"
          label="Email"
          type="email"
          placeholder="your.email@example.com"
          required
        />

        <TextAreaField
          form={form}
          name="message"
          label="Message"
          placeholder="Optional message (optional)"
          rows={4}
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
              className="flex-1"
            >
              {isSubmitting ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
    </>
  )
}
