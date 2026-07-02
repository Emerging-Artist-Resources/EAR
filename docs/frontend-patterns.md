# Frontend patterns and rules

This document describes how the **performance-calendar** frontend is structured and what conventions to follow when adding or changing UI code. It reflects the current stack: **Next.js 16 (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS v4**, and shared libraries listed in `package.json`.

---

## 1. Stack at a glance

| Area | Choice |
|------|--------|
| Framework | Next.js App Router (`src/app/`) |
| Styling | Tailwind v4 (`@import "tailwindcss"` in `globals.css`), design tokens in CSS variables |
| Component primitives | Radix UI (`@radix-ui/*`), **CVA** (`class-variance-authority`) for variants |
| Class merging | `cn()` from `@/lib/utils` (`clsx` + `tailwind-merge`) |
| Forms | `react-hook-form` + **Zod** (`@hookform/resolvers` / project resolver wrapper) |
| Icons | `lucide-react`, `react-icons` (use consistently within a feature) |
| Validation schemas | `src/lib/validations/**` (keep schemas next to domain, e.g. `donations.ts`) |

---

## 2. Server vs client components

**Default:** React Server Components (RSC). Do not add `"use client"` unless you need:

- Browser APIs, `useState`, `useEffect`, event handlers, or other client-only hooks
- Third-party libraries that require the client

**Patterns in this repo:**

- **Pages** (`page.tsx`): Often async server components that load data (e.g. Prisma / feature repositories), then render presentational or client children.
- **Interactive UI**: Mark with `"use client"` at the top of the file (e.g. `DonationForm.tsx`, `ToastContext.tsx`).

**Rule:** Keep server boundaries high—fetch and authorize on the server; pass plain props (IDs, display strings, flags) into client components instead of passing secrets or heavy objects you do not need.

---

## 3. Project layout and responsibilities

| Location | Purpose |
|----------|---------|
| `src/app/` | Routes, layouts, `loading.tsx` / `error.tsx` if used, route handlers under `api/` |
| `src/components/` | Reusable UI and feature-specific components (e.g. `layout/`, `ui/`, `forms/blocks/`, `donations/`) |
| `src/features/**/` | Domain logic split by feature (`server/` for data access, services, types—**not** React components) |
| `src/lib/` | Shared utilities: `env`, `fetch-utils`, `validations`, `utils` (`cn`), etc. |
| `src/hooks/` | Reusable React hooks (`use-auth`, `use-calendar`, …) |
| `src/contexts/` | React context providers (e.g. toast) |

**Rule:** UI that only exists for one route can live under `components/` with a clear folder name; cross-cutting server logic stays in `features/*/server` or `lib/`.

---

## 4. Imports and aliases

TypeScript path aliases (see `tsconfig.json`):

- `@/*` → `src/*`
- `@/features/*`, `@/services/*`, `@/lib/*` → explicit subtrees

**Rule:** Prefer `@/...` imports over long relative paths (`../../../`). Keep import order readable: external packages, then blank line, then `@/` modules.

---

## 5. Styling rules

1. **Tailwind-first:** Use utility classes for layout, spacing, and responsive behavior (`sm:`, `lg:`, etc.).
2. **Design tokens:** Prefer semantic/theme variables defined in `src/app/globals.css` (e.g. `primary`, `error-600`, `text-text-muted`) over hard-coded hex values in JSX—unless you are matching a one-off design spec.
3. **Merging classes:** Use `cn()` whenever `className` is composed from props, variants, or conditionals so Tailwind classes merge correctly.
4. **Variants:** For buttons, cards, and similar primitives, follow the **CVA** pattern used in `src/components/ui/button.tsx` (`cva`, `VariantProps`, `defaultVariants`).
5. **Dark mode:** The codebase defines `@custom-variant dark`; follow existing `dark:` usage when adding surfaces that must work in both themes.

### Typography

Import roles from `@/components/ui/typography`. Components set **type only** (font, size, weight, leading); pass color via `className` when needed.

| Component | Use |
|-----------|-----|
| `Display` | Marketing heroes only (large uppercase title font) |
| `H1` | Page titles (dashboard, auth) |
| `H2` | Section headings |
| `H3` | Subsections, form section titles |
| `H4` | Card or group titles |
| `Text` | Body copy |
| `TextSmall` | Secondary body, inline descriptions |
| `Muted` | Helper text, field notes |
| `Label` | Form field labels (`<label>`) |
| `Caption` | Fine print, errors, footnotes |
| `Eyebrow` | Uppercase taglines (marketing/footer) |

**App vs marketing:** Dashboards and forms use `H1`–`H4` and `Text`. Public marketing pages may additionally use `Display` and hero constants in `src/lib/marketing/page-hero.ts`.

**Avoid:** Overriding heading sizes with redundant classes (e.g. `H2 className="text-2xl"`). Prefer semantic text colors (`text-text-primary`, `text-text-muted`) over `text-gray-*`.

**Inline form actions:** use a `<button type="button">` with TextSmall-equivalent classes (`font-sans text-body-sm leading-body`) plus `underline text-primary`. Do not use `<p>`-based typography components for interactive controls.

Type scale tokens live in `globals.css` (`--type-h1-size`, etc.) and map to Tailwind utilities (`text-h1`, `text-body-sm`, `leading-body`, `tracking-eyebrow`).

### Spacing

Import named stacks from `@/lib/spacing` instead of ad-hoc `space-y-*` for standard vertical rhythm:

| Constant | Tailwind | Typical use |
|----------|----------|-------------|
| `stack.xs` | `space-y-1` | Tight label groups |
| `stack.sm` | `space-y-2` | Form field internals |
| `stack.md` | `space-y-4` | Section children |
| `stack.lg` | `space-y-6` | Form sections, card content |
| `stack.xl` | `space-y-8` | Page sections |
| `stack["2xl"]` | `space-y-10` | Wizard step groups |

**Form density** (`form.*` in `spacing.ts`) — use in modals and wizards:

| Constant | Tailwind | Typical use |
|----------|----------|-------------|
| `form.step` | `space-y-6` | Between sections in a wizard step |
| `form.section` | `space-y-2` | Section title to fields |
| `form.fields` | `space-y-3` | Between fields in a section |

`page.container` is the standard max-width page shell (`max-w-7xl` + horizontal padding).

Domain-specific layout (e.g. service inquiry forms) may extend these in local constants; prefer importing `stack` over duplicating values.

---

## 6. UI components (`src/components/ui/`)

- Treat `ui/` as the **design system layer**: `Button`, `Input`, `Card`, `Modal`, etc.
- Extend these primitives rather than duplicating raw `<button>` styles across features.
- Use **`asChild`** with Radix `Slot` where the component should render as a child element (see `Button`).

**Rule:** New generic controls (inputs, dialogs, menus) should match existing patterns: `forwardRef` where needed, `cn()` for `className`, and accessible attributes (`aria-*`, focus rings).

---

## 7. Forms

1. **Schema:** Define Zod schemas in `src/lib/validations/` (or feature-specific validation modules).
2. **Hook:** `useForm` with the project’s zod resolver (see `DonationForm` for a full example).
3. **Fields:** Prefer shared blocks under `src/components/forms/blocks/` (`TextField`, `TextAreaField`, `Select`, …) so labels, errors, and touched-state behavior stay consistent.
4. **Modes:** Use explicit `mode` / `reValidateMode` when UX requires (e.g. `onChange` for immediate feedback).

**Rule:** Do not validate only on the client; API routes and server actions should re-validate with the same (or stricter) Zod schemas.

---

## 8. Talking to the backend from the browser

- Use **`apiFetch` / `apiGet` / `apiPost`** from `@/lib/client/fetch-utils` for JSON APIs that return the project’s `ApiResponse` shape. They centralize `Content-Type`, error parsing, and typed unwrap.
- Keep URLs relative (`/api/...`) unless there is a deliberate cross-origin need.

**Rule:** After mutations, surface failures with **`showToast`** (see below) or inline `Alert` components; avoid silent failures except for genuinely optional background fetches (log in development).

---

## 9. Toasts and global feedback

The root layout wraps the app with **`ToastProvider`** and renders **`ToastContainer`**.

- For notifications that should appear in the **global** toast region, use **`useToast` from `@/contexts/ToastContext`** (same hook consumed by `ToastContainer`).
- Avoid mixing in a separate local toast hook for user-visible flows unless you intentionally want disconnected behavior.

---

## 10. App Router pages

- **Dynamic routes:** Type `params` and `searchParams` as `Promise<...>` where the framework provides async props (see `src/app/donate/[slug]/page.tsx`).
- **Not found:** Use `notFound()` from `next/navigation` when domain data is missing.
- **Metadata:** Export `metadata` or `generateMetadata` from layouts/pages as appropriate.

---

## 11. TypeScript and quality gates

`tsconfig.json` enables **strict** mode, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`.

**Rule:** Fix types at the source; avoid `as unknown as` unless bridging a third-party typing gap—and narrow the scope (e.g. a single resolver line with a comment if unavoidable).

ESLint uses **`eslint-config-next`** (`next/core-web-vitals`, `next/typescript`). Run `npm run lint` before merging substantive UI changes.

---

## 12. Testing

Jest + Testing Library are configured (`npm test`). Add tests for non-trivial hooks and components when behavior is easy to regress (validation, conditional rendering, accessibility).

---

## 13. Quick checklist for new UI work

- [ ] Server component by default; `"use client"` only when required  
- [ ] Use `@/` imports and existing `ui/` + `forms/blocks` where possible  
- [ ] Compose classes with `cn()`; variants with CVA for repeated patterns  
- [ ] Zod schema colocated under `lib/validations` (or feature validations)  
- [ ] Client fetches via `fetch-utils`; errors visible to users  
- [ ] Global toasts via `@/contexts/ToastContext`  
- [ ] `npm run lint` passes  

---

## 14. Related files

- Global styles and tokens: `src/app/globals.css`  
- Typography components: `src/components/ui/typography.tsx`  
- Spacing constants: `src/lib/spacing.ts`  
- Root shell: `src/app/layout.tsx`  
- Class helper: `src/lib/utils.ts`  
- Example form: `src/components/donations/DonationForm.tsx`  
- Example server page + client child: `src/app/donate/[slug]/page.tsx`  

This document should evolve with the codebase; update it when you introduce a new cross-cutting pattern (e.g. a second design system, server actions convention, or i18n).
