/**
 * Parent layout for /auth/signup/* — wizard chrome lives in (wizard)/layout.tsx only.
 * /auth/signup/confirm stays outside (wizard) so the success screen is standalone.
 */
export default function SignUpRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
