"use client"

import { ClampableText } from "@/components/calendar/ClampableText"
import { formatFieldLabel } from "@/components/calendar/performance-detail-shared"
import { FieldRow } from "@/components/calendar/PublicListingDetailSections"
import {
  isOnlineLocationDisplay,
  listingHasLocationDisplay,
  type LocationDisplaySource,
} from "@/lib/location/display"
import { getGoogleMapsLink } from "@/lib/location/google-maps-link"
import { ONLINE_VENUE_LABEL } from "@/lib/location/mode"
import { cn } from "@/lib/utils"

function LocationInstructionsBlock({
  label,
  text,
  labelClassName = "font-semibold text-text-primary",
}: {
  label: string
  text: string
  labelClassName?: string
}) {
  return (
    <div className="min-w-0 max-w-full">
      <div className={labelClassName}>{formatFieldLabel(label)}</div>
      <ClampableText text={text} clampClassName="line-clamp-3" className="mt-0.5" />
    </div>
  )
}

type ListingLocationDisplayProps = {
  location: LocationDisplaySource | null | undefined
  linkifyAddress?: boolean
  addressClassName?: string
  variant?: "fieldRow" | "inline" | "performance" | "performance-inline"
}

function PerformanceLocationInline({
  location,
  linkifyAddress,
}: {
  location: LocationDisplaySource
  linkifyAddress: boolean
}) {
  if (isOnlineLocationDisplay(location)) {
    return (
      <>
        <div className="min-w-0 max-w-full">
          <span className="font-semibold text-text-primary">Venue: </span>
          <span className="text-text-primary">{ONLINE_VENUE_LABEL}</span>
        </div>
        {location.location_instructions?.trim() ? (
          <LocationInstructionsBlock
            label="Additional Instructions"
            text={location.location_instructions.trim()}
          />
        ) : null}
      </>
    )
  }

  const venue =
    location.venue_name?.trim() && location.venue_name !== ONLINE_VENUE_LABEL
      ? location.venue_name.trim()
      : null
  const address = location.address?.trim() ? location.address.trim() : null
  const instructions = location.location_instructions?.trim()
    ? location.location_instructions.trim()
    : null

  return (
    <>
      {venue ? (
        <div className="min-w-0 max-w-full [overflow-wrap:anywhere]">
          <span className="font-semibold text-text-primary">Venue: </span>
          <span className="text-text-primary">{venue}</span>
        </div>
      ) : null}
      {address ? (
        <div className="min-w-0 max-w-full [overflow-wrap:anywhere]">
          <span className="font-semibold text-text-primary">Address: </span>
          <span className="text-text-primary">
            <AddressWithMapsLink
              address={address}
              placeId={location.place_id}
              linkifyAddress={linkifyAddress}
              mapsLinkClassName="ml-2 inline-block text-sm text-brand-primary hover:text-brand-primary-hover underline"
            />
          </span>
        </div>
      ) : null}
      {instructions ? (
        <LocationInstructionsBlock label="Additional Instructions" text={instructions} />
      ) : null}
    </>
  )
}

function AddressWithMapsLink({
  address,
  placeId,
  linkifyAddress,
  addressClassName = "",
  mapsLinkClassName = "ml-2 text-brand-primary hover:text-brand-primary-hover underline",
}: {
  address: string
  placeId?: string | null
  linkifyAddress: boolean
  addressClassName?: string
  mapsLinkClassName?: string
}) {
  const mapsLink = linkifyAddress ? getGoogleMapsLink(address, placeId) : null

  return (
    <>
      <span className={cn("[overflow-wrap:anywhere]", addressClassName)}>{address}</span>
      {mapsLink ? (
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className={mapsLinkClassName}
        >
          View on Maps →
        </a>
      ) : null}
    </>
  )
}

export function ListingLocationDisplay({
  location,
  linkifyAddress = false,
  addressClassName = "",
  variant = "fieldRow",
}: ListingLocationDisplayProps) {
  if (!location || !listingHasLocationDisplay(location)) return null

  if (variant === "performance" || variant === "performance-inline") {
    return (
      <div
        className={cn(
          "min-w-0 max-w-full",
          variant === "performance-inline"
            ? "ml-0 mt-2 space-y-1 font-sans text-sm"
            : "space-y-1 font-sans text-sm",
        )}
      >
        <PerformanceLocationInline location={location} linkifyAddress={linkifyAddress} />
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <div className="ml-0 mt-2 min-w-0 max-w-full space-y-1 font-sans text-sm">
        {isOnlineLocationDisplay(location) ? (
          <>
            <div className="min-w-0 max-w-full">
              <span className="text-text-muted font-medium">Location: </span>
              <span className="text-text-primary">{ONLINE_VENUE_LABEL}</span>
            </div>
            {location.location_instructions ? (
              <LocationInstructionsBlock
                label="How to attend"
                text={location.location_instructions}
                labelClassName="text-text-muted font-medium"
              />
            ) : null}
          </>
        ) : (
          <>
            {location.address ? (
              <div className="flex min-w-0 max-w-full items-start gap-2">
                <span className="shrink-0 text-text-muted font-medium">Address:</span>
                <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <span className="text-text-primary">{location.address}</span>
                  {linkifyAddress &&
                    getGoogleMapsLink(location.address, location.place_id) && (
                      <a
                        href={getGoogleMapsLink(location.address, location.place_id)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-block text-xs text-brand-primary hover:text-brand-primary-hover underline"
                      >
                        View on Maps →
                      </a>
                    )}
                </div>
              </div>
            ) : null}
            {location.venue_name && location.venue_name !== ONLINE_VENUE_LABEL ? (
              <div className="min-w-0 max-w-full [overflow-wrap:anywhere]">
                <span className="text-text-muted font-medium">Venue: </span>
                <span className="text-text-primary">{location.venue_name}</span>
              </div>
            ) : null}
            {location.location_instructions ? (
              <LocationInstructionsBlock
                label="Instructions"
                text={location.location_instructions}
                labelClassName="text-text-muted font-medium"
              />
            ) : null}
          </>
        )}
      </div>
    )
  }

  if (isOnlineLocationDisplay(location)) {
    return (
      <>
        <FieldRow label="Location" value={ONLINE_VENUE_LABEL} />
        {location.location_instructions ? (
          <FieldRow
            label="How to attend"
            value={
              <ClampableText
                text={location.location_instructions}
                clampClassName="line-clamp-3"
              />
            }
          />
        ) : null}
      </>
    )
  }

  const mapsLink =
    linkifyAddress && location.address
      ? getGoogleMapsLink(location.address, location.place_id)
      : null

  return (
    <>
      {location.address ? (
        <FieldRow
          label="Location"
          value={
            linkifyAddress ? (
              <div className="min-w-0 max-w-full [overflow-wrap:anywhere]">
                <span className={addressClassName}>{location.address}</span>
                {mapsLink ? (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-block text-brand-primary hover:text-brand-primary-hover underline"
                  >
                    View on Maps →
                  </a>
                ) : null}
              </div>
            ) : (
              location.address
            )
          }
        />
      ) : null}
      {location.venue_name && location.venue_name !== ONLINE_VENUE_LABEL ? (
        <FieldRow label="Venue" value={location.venue_name} />
      ) : null}
      {location.location_instructions ? (
        <FieldRow
          label="Location Instructions"
          value={
            <ClampableText text={location.location_instructions} clampClassName="line-clamp-3" />
          }
        />
      ) : null}
    </>
  )
}
