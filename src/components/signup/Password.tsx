"use client"

import Link from "next/link"
import { UseFormReturn, useFormState } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { Checkbox } from "@/components/ui/checkbox"
import { AUTH_LINK_CLASS } from "@/lib/auth/page-styles"
import { accountTermsDocument, privacyPolicyDocument } from "@/lib/content/legal"
import { SignupFormData } from "@/lib/validations/signup"

interface SignUpPasswordProps {
    form: UseFormReturn<SignupFormData>
}

export function SignUpPassword({ form }: SignUpPasswordProps) {
    useFormState({ control: form.control, name: "accept_account_terms_and_privacy" })
    const acceptanceError = form.getFieldState("accept_account_terms_and_privacy", form.formState).error

    return (
        <Section title="Create Password">
            <TextField 
                form={form} 
                name={"password"} 
                label="Password" 
                type="password"
                autoComplete="new-password"
                required
                note="Password must be at least 8 characters"
            />
            <TextField 
                form={form} 
                name={"confirmPassword"} 
                label="Confirm Password" 
                type="password"
                autoComplete="new-password"
                required
            />
            <div>
                <div className="flex items-start gap-2">
                    <Checkbox
                        id="accept-account-terms-and-privacy"
                        className="mt-1"
                        aria-required
                        aria-invalid={acceptanceError ? true : undefined}
                        {...form.register("accept_account_terms_and_privacy")}
                    />
                    <label htmlFor="accept-account-terms-and-privacy" className="text-sm text-gray-800">
                        I agree to EAR&apos;s{" "}
                        <Link
                            href={accountTermsDocument.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${AUTH_LINK_CLASS} underline underline-offset-2`}
                        >
                            Terms & Conditions
                        </Link>{" "}
                        and acknowledge that I have read EAR&apos;s{" "}
                        <Link
                            href={privacyPolicyDocument.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${AUTH_LINK_CLASS} underline underline-offset-2`}
                        >
                            Privacy Policy
                        </Link>.
                    </label>
                </div>
                {acceptanceError?.message ? (
                    <p className="mt-1 text-xs text-error-600">{acceptanceError.message}</p>
                ) : null}
            </div>
        </Section>
    )
}

