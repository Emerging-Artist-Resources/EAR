// lib/email/types.ts
export enum EmailType {
    LISTING_RECEIVED = "listing_received",
    LISTING_UPDATED = "listing_updated",
    LISTING_APPROVED = "listing_approved",
    LISTING_REJECTED = "listing_rejected",
  
    PAYMENT_CONFIRMED = "payment_confirmed",
    PAYMENT_REFUNDED = "payment_refunded",
  
    STATUS_CHANGED = "status_changed",
}