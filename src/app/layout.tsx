import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { buildSiteMetadata } from "@/lib/config/site-metadata";
import HeaderGate from "@/components/layout/header-gate"
import FooterGate from "@/components/layout/footer-gate"
import { ErrorBoundary } from "@/components/error-boundary"
import { AdminLayoutWrapper } from "@/components/admin/shared/AdminLayoutWrapper"
import { SessionExpiredModal } from "@/components/auth/SessionExpiredModal"
import { ToastProvider } from "@/contexts/ToastContext"
import { ToastContainer } from "@/components/ui/ToastContainer"
import { AppTooltipProvider } from "@/components/providers/app-tooltip-provider"
import { Analytics } from "@vercel/analytics/react"
import { SiteJsonLd } from "@/components/seo/SiteJsonLd"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = buildSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col antialiased`}
      >
        <SiteJsonLd />
        <AppTooltipProvider>
          <ToastProvider>
            <ErrorBoundary>
              <HeaderGate />
              <div className="flex min-h-0 flex-1 flex-col">
                <AdminLayoutWrapper>
                  {children}
                </AdminLayoutWrapper>
              </div>
              <FooterGate />
              <SessionExpiredModal />
              <ToastContainer />
              <Analytics />
            </ErrorBoundary>
          </ToastProvider>
        </AppTooltipProvider>
      </body>
    </html>
  );
}
