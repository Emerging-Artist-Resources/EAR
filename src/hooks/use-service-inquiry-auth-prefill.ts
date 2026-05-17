import { useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useAuth } from "@/hooks/use-auth"

type ContactFields = {
  firstName: string
  lastName: string
  email: string
}

/**
 * Prefills first name, last name, and email from signed-in user when fields are empty.
 */
export function useServiceInquiryAuthPrefill<T extends ContactFields>(
  form: UseFormReturn<T>,
) {
  const { user, userName } = useAuth()

  useEffect(() => {
    if (user?.email && !form.getValues("email" as never)) {
      form.setValue("email" as never, user.email as never)
    }
    if (userName) {
      const parts = userName.trim().split(/\s+/)
      if (parts.length >= 2) {
        if (!form.getValues("firstName" as never)) {
          form.setValue("firstName" as never, (parts[0] ?? "") as never)
        }
        if (!form.getValues("lastName" as never)) {
          form.setValue("lastName" as never, parts.slice(1).join(" ") as never)
        }
      } else if (!form.getValues("firstName" as never)) {
        form.setValue("firstName" as never, userName as never)
      }
    }
  }, [user, userName, form])
}
