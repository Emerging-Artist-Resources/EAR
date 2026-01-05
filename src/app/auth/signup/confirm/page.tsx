"use client"

import Link from "next/link"
import { H2, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default function SignUpConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <H2>Account Created Successfully!</H2>
                <Text className="text-gray-600">
                  Check your email to verify your account. Once verified, you can sign in.
                </Text>
              </div>

              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="/auth/signin">Go to Sign In</Link>
                </Button>
              </div>

              <Text className="text-sm text-gray-500">
                Didn't receive an email? Check your spam folder or{" "}
                <Link href="/auth/signin" className="text-primary hover:underline">
                  try signing in
                </Link>
              </Text>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

