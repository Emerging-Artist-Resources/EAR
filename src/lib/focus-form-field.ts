import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

/** RHF forwards options to native `focus()`; types omit `preventScroll`. */
export function focusFormFieldNoScroll<T extends FieldValues>(
  form: UseFormReturn<T>,
  name: Path<T> | string,
  options?: { shouldSelect?: boolean },
) {
  form.setFocus(name as Path<T>, { ...options, preventScroll: true } as never)
}
