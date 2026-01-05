"use client"

import { useMemo } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { usePathname } from "next/navigation"
import { H2 } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { signupFormSchema } from "@/lib/validations/signup"
import { zodResolver } from "@/lib/vendor/react-hook-form-zod"

interface LayoutProps {
  children: React.ReactNode
}

export default function SignUpLayout({ children }: LayoutProps) {
  const methods = useForm({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      profile_type: "individual",
      name: "",
      email: "",
      pronouns: null,
      website: null,
      organization_name: null,
      location_place_id: null,
      location_label: null,
      newsletter_ear_opt_in: false,
      newsletter_calendar_opt_in: false,
      referral_source: null,
      referral_source_other: null,
      self_identifies_emerging: false,
      operating_budget_range: "r_0_24999",
      operating_budget_other_text: null,
      owns_or_operates_venue: "no",
      owns_or_operates_venue_other_text: null,
      supported_by_major_institution: "no",
      supported_by_major_institution_other_text: null,
      classes_hosted_independently: "no",
      classes_hosted_independently_other_text: null,
      has_501c3: "no",
      has_501c3_other_text: null,
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const pathname = usePathname()
  const step = useMemo<1 | 2 | 3 | 4>(() => {
    if (pathname?.endsWith("/eligibility")) return 2
    if (pathname?.endsWith("/wrap-up")) return 3
    if (pathname?.endsWith("/password")) return 4
    return 1
  }, [pathname])

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <div className="relative -mx-6 -mt-6 mb-4 px-6 py-4 rounded-t-md bg-primary">
              <H2 className="text-center text-white">Create an EAR Account</H2>
            </div>
            <CardContent>
              <div className="flex items-center justify-center pb-5 text-sm">
                <PageNumbers current={step} total={4} />
              </div>
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  )
}

