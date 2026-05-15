import {
  isOnlineLocationDisplay,
  listingHasLocationDisplay,
  type LocationDisplaySource,
} from "@/lib/location-display"
import { ONLINE_VENUE_LABEL } from "@/lib/location-mode"
import { FieldRow } from "@/components/calendar/PublicListingDetailSections"

function getGoogleMapsLink(
  address: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }
  return null
}

type ListingLocationDisplayProps = {
  location: LocationDisplaySource | null | undefined
  linkifyAddress?: boolean
  addressClassName?: string
  variant?: "fieldRow" | "inline"
}

export function ListingLocationDisplay({
  location,
  linkifyAddress = false,
  addressClassName = "",
  variant = "fieldRow",
}: ListingLocationDisplayProps) {
  if (!location || !listingHasLocationDisplay(location)) return null

  if (variant === "inline") {
    return (
      <div className="ml-0 mt-2 space-y-1 font-sans text-sm">
        {isOnlineLocationDisplay(location) ? (
          <>
            <div>
              <span className="text-text-muted font-medium">Location: </span>
              <span className="text-text-primary">{ONLINE_VENUE_LABEL}</span>
            </div>
            {location.location_instructions ? (
              <div>
                <span className="text-text-muted font-medium">How to attend: </span>
                <span className="text-text-primary">{location.location_instructions}</span>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {location.address ? (
              <div className="flex items-start gap-2">
                <span className="text-text-muted font-medium">Address:</span>
                <div className="flex-1">
                  <span className="text-text-primary">{location.address}</span>
                  {linkifyAddress &&
                    getGoogleMapsLink(location.address, location.place_id) && (
                      <a
                        href={getGoogleMapsLink(location.address, location.place_id)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-brand-primary hover:text-brand-primary-hover underline"
                      >
                        View on Maps →
                      </a>
                    )}
                </div>
              </div>
            ) : null}
            {location.venue_name && location.venue_name !== ONLINE_VENUE_LABEL ? (
              <div>
                <span className="text-text-muted font-medium">Venue: </span>
                <span className="text-text-primary">{location.venue_name}</span>
              </div>
            ) : null}
            {location.location_instructions ? (
              <div>
                <span className="text-text-muted font-medium">Instructions: </span>
                <span className="text-text-primary">{location.location_instructions}</span>
              </div>
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
          <FieldRow label="How to attend" value={location.location_instructions} />
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
              <div>
                <span className={addressClassName}>{location.address}</span>
                {mapsLink ? (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-brand-primary hover:text-brand-primary-hover underline"
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
        <FieldRow label="Location Instructions" value={location.location_instructions} />
      ) : null}
    </>
  )
}
