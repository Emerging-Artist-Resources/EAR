import { redirect, notFound } from "next/navigation"
import { DonationSuccessView } from "@/components/donations/DonationSuccessView"
import { getProfileBySlugForDonationRepo } from "@/features/profile/server/repository"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ donation_id?: string }>
}

export default async function ArtistDonationSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const q = await searchParams
  const donationId = q.donation_id ?? ""

  const profile = await getProfileBySlugForDonationRepo(slug)
  if (!profile) {
    notFound()
  }

  if (!donationId) {
    redirect(`/donate/${encodeURIComponent(slug)}`)
  }

  return (
    <DonationSuccessView
      donationId={donationId}
      variant="artist"
      artist={{
        slug: profile.slug,
        profileId: profile.id,
        displayName: profile.name?.trim() || "this artist",
      }}
    />
  )
}
