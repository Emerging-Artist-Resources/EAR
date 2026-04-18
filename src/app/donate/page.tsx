import { DonationForm, type OrgDonationHero } from "@/components/donations/DonationForm"

const ORG_DONATION_HERO: OrgDonationHero = {
  imageSrc: "/donate-ear-hero.JPG",
  message:
    "Your donation directly supports emerging artists by funding opportunities, resources, and access to creative work.",
  alt: "Support Emerging Artist Resources",
}

type PageProps = {
  searchParams: Promise<{ canceled?: string }>
}

export default async function DonatePage({ searchParams }: PageProps) {
  const q = await searchParams
  const statusMessage = q.canceled === "true" ? ("canceled" as const) : null

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <DonationForm orgDonationHero={ORG_DONATION_HERO} statusMessage={statusMessage} />
    </div>
  )
}
