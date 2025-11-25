"use client"

import { useMemo } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { usePathname } from "next/navigation"
import { H2 } from "@/components/ui/typography"
import { Card, CardContent } from "@/components/ui/card"
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

