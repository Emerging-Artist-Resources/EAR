import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DonationForm } from "@/components/donations/DonationForm"
import { getProfileBySlugForDonationRepo } from "@/features/profile/server/repository"
import { buildArtistDonationMetadata } from "@/lib/site-metadata"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string; canceled?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const profile = await getProfileBySlugForDonationRepo(slug)

  if (!profile) {
    return { title: "Not Found" }
  }

  const displayName = profile.donation_recipient_display_name?.trim() || "this artist"
  const description =
    profile.donation_page_message?.trim() ||
    `Support ${displayName} through Emerging Artist Resources fiscal sponsorship.`

  return buildArtistDonationMetadata({
    displayName,
    description,
    slug: profile.slug,
    imageUrl: profile.donation_page_image_url,
  })
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
    <div className="min-h-screen bg-ear-off-white py-12 px-4 sm:px-6 lg:px-8">
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
