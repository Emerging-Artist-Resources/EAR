import { notFound } from "next/navigation"
import { DonationForm } from "@/components/donations/DonationForm"
import { getProfileBySlugForDonationRepo } from "@/features/profile/server/repository"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string; canceled?: string }>
}

export default async function DonateToArtistPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const q = await searchParams

  const profile = await getProfileBySlugForDonationRepo(slug)
  if (!profile) {
    notFound()
  }

  const statusMessage = q.canceled === "true" ? ("canceled" as const) : null

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <DonationForm
        lockedRecipient={{
          userId: profile.id,
          displayName: profile.donation_recipient_display_name,
          slug: profile.slug,
          donationPageMessage: profile.donation_page_message,
          donationPageImageUrl: profile.donation_page_image_url,
          donationDesignation: profile.donation_designation,
        }}
        statusMessage={statusMessage}
      />
    </div>
  )
}
