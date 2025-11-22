"use client"

import { useMemo } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { usePathname } from "next/navigation"
import { H2 } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { PiNumberCircleOneFill } from "react-icons/pi";
import { PiNumberCircleTwoFill } from "react-icons/pi";
import { PiNumberCircleThreeFill } from "react-icons/pi";
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"


interface LayoutProps {
  children: React.ReactNode
}

export default function SignUpLayout({ children }: LayoutProps) {
  const methods = useForm({
    defaultValues: {
      name: "",
      pronouns: "",
      email: "",
      address: "",
      "company-name": "",
      website: "",
      emergingArtistIdentification: "",
      operatingBudget: "",
      physicalSpace: "",
      affiliation: "",
      instruction: "",
      status_501c3: "",
      referralSources: [],
      newsLetter: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const pathname = usePathname()
  const step = useMemo<1 | 2 | 3>(() => {
    if (pathname?.endsWith("/eligibility")) return 2
    if (pathname?.endsWith("/wrap-up")) return 3
    return 1
  }, [pathname])

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full h-30 rounded-xl max-w-2xl space-y-6 py-4 bg-primary-100">
          <div>
            <H2 className="text-center">Create your account</H2>
            <div className="mt-4">
              
              {/* <div className="h-2 w-full rounded bg-gray-200">
                <div
                  className="h-2 rounded bg-primary-400 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div> */}
            </div>
          </div>
          <Card>
            <CardContent>
              <div className=" flex items-center justify-center pb-5 text-sm">
                <PageNumbers current={step} total={3} />
              </div>

              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  )
}

