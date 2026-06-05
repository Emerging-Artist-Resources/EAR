import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { H2, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AUTH_LINK_CLASS,
  AUTH_MUTED_TEXT_CLASS,
  AUTH_PAGE_CARD_CLASS,
  AUTH_PAGE_SHELL_CLASS,
} from "@/lib/auth/page-styles"

type AuthLinkErrorCardProps = {
  title: string
  description: string
  children?: React.ReactNode
}

export function AuthLinkErrorCard({ title, description, children }: AuthLinkErrorCardProps) {
  return (
    <div className={AUTH_PAGE_SHELL_CLASS}>
      <div className="max-w-md w-full">
        <Card border="solid" className={AUTH_PAGE_CARD_CLASS}>
          <CardContent className="px-6 pb-8 pt-8">
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-ear-dark-red" aria-hidden />
              </div>

              <div className="space-y-2">
                <H2 className="text-ear-black">{title}</H2>
                <Text className={AUTH_MUTED_TEXT_CLASS}>{description}</Text>
              </div>

              {children}

              <div className="pt-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signin">Back to sign in</Link>
                </Button>
              </div>

              <Text className={`text-sm ${AUTH_MUTED_TEXT_CLASS}`}>
                Check your spam folder if you don&apos;t see the email. Already verified?{" "}
                <Link href="/auth/signin" className={`${AUTH_LINK_CLASS} underline`}>
                  Sign in
                </Link>
                .
              </Text>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
