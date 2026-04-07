"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Text } from "@/components/ui/typography"
import { Card } from "@/components/ui/card"
import { useToast } from "@/contexts/ToastContext"
import { useAuth } from "@/hooks/use-auth"
import { apiPost } from "@/lib/fetch-utils"
import { supabase } from "@/lib/supabase/client"
import {
  DOCUMENTATION_SERVICE_SLUG,
  selectOptionsForQuestion,
} from "@/lib/service-inquiries/documentation-options"
import { cn } from "@/lib/utils"

type QuestionRow = {
  id: string
  question_text: string
  field_type: string
  is_required: boolean
  order_index: number
}

export function DocumentationInquiryForm() {
  const { user, userName } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})
  const [multiValues, setMultiValues] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setLoadError(null)
      const { data: svc, error: e1 } = await supabase
        .from("services")
        .select("id")
        .eq("slug", DOCUMENTATION_SERVICE_SLUG)
        .eq("is_active", true)
        .maybeSingle()

      if (e1 || !svc) {
        setLoadError("This form is temporarily unavailable.")
        setLoading(false)
        return
      }

      const { data: qs, error: e2 } = await supabase
        .from("service_questions")
        .select("id, question_text, field_type, is_required, order_index")
        .eq("service_id", svc.id)
        .order("order_index", { ascending: true })

      if (e2 || !qs?.length) {
        setLoadError("Could not load form questions.")
        setLoading(false)
        return
      }

      setQuestions(qs as QuestionRow[])
      setLoading(false)
    }
    void run()
  }, [])

  useEffect(() => {
    if (user) {
      setEmail((e) => e || user.email || "")
    }
    if (userName) {
      setName((n) => n || userName)
    }
  }, [user, userName])

  const setText = useCallback((id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }))
  }, [])

  const toggleMulti = useCallback((qid: string, option: string, checked: boolean) => {
    setMultiValues((prev) => {
      const cur = prev[qid] ?? []
      if (checked) {
        if (cur.includes(option)) return prev
        return { ...prev, [qid]: [...cur, option] }
      }
      return { ...prev, [qid]: cur.filter((x) => x !== option) }
    })
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questions.length) return
    setSubmitting(true)
    try {
      const answers: { question_id: string; answer_text: string }[] = []
      for (const q of questions) {
        if (q.field_type === "multiselect") {
          const arr = multiValues[q.id] ?? []
          answers.push({
            question_id: q.id,
            answer_text: JSON.stringify(arr),
          })
        } else {
          answers.push({
            question_id: q.id,
            answer_text: (values[q.id] ?? "").trim(),
          })
        }
      }

      await apiPost<{ id: string }>("/api/service-inquiries", {
        service_slug: DOCUMENTATION_SERVICE_SLUG,
        name: name.trim(),
        email: email.trim(),
        answers,
      })
      showToast("Thanks — we received your inquiry.", "success")
      setValues({})
      setMultiValues({})
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      showToast(msg, "error")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Text className="text-muted-foreground">Loading form…</Text>
    )
  }

  if (loadError) {
    return (
      <Text className="text-destructive">{loadError}</Text>
    )
  }

  return (
    <Card className="p-6 shadow-sm">
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="inquiry-name" className="mb-1 block text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="inquiry-name"
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
            />
          </div>
          <div>
            <label htmlFor="inquiry-email" className="mb-1 block text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="inquiry-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
          </div>
        </div>

        {questions.map((q) => {
          const opts = selectOptionsForQuestion(q.question_text, q.field_type)
          return (
            <div key={q.id}>
              <span className="mb-1 block text-sm font-medium">
                {q.question_text}
                {q.is_required ? <span className="text-destructive"> *</span> : null}
              </span>

              {q.field_type === "textarea" && (
                <Textarea
                  id={q.id}
                  required={q.is_required}
                  className="min-h-[100px]"
                  value={values[q.id] ?? ""}
                  onChange={(ev) => setText(q.id, ev.target.value)}
                />
              )}

              {(q.field_type === "text" || q.field_type === "date" || q.field_type === "time") && (
                <Input
                  id={q.id}
                  type={q.field_type === "date" ? "date" : q.field_type === "time" ? "time" : "text"}
                  required={q.is_required}
                  value={values[q.id] ?? ""}
                  onChange={(ev) => setText(q.id, ev.target.value)}
                />
              )}

              {q.field_type === "select" && opts.length > 0 && (
                <select
                  id={q.id}
                  required={q.is_required}
                  className={cn(
                    "border-input bg-background h-9 w-full rounded-md border px-3 text-sm",
                    "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
                  )}
                  value={values[q.id] ?? ""}
                  onChange={(ev) => setText(q.id, ev.target.value)}
                >
                  <option value="">Select…</option>
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}

              {q.field_type === "multiselect" && opts.length > 0 && (
                <ul className="space-y-2">
                  {opts.map((o) => {
                    const checked = (multiValues[q.id] ?? []).includes(o)
                    return (
                      <li key={o} className="flex items-center gap-2">
                        <Checkbox
                          id={`${q.id}-${o}`}
                          checked={checked}
                          onChange={(ev) => toggleMulti(q.id, o, ev.target.checked)}
                        />
                        <label htmlFor={`${q.id}-${o}`} className="text-sm">
                          {o}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Sending…" : "Submit inquiry"}
        </Button>
      </form>
    </Card>
  )
}
