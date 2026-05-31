import type { CreateListingInput } from "./repository-types"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import { UNTITLED_OPPORTUNITY_TITLE } from "@/lib/listings/type-labels"

function isCreateListingInput(input: CreateListingInput | PublicListingDetail): input is CreateListingInput {
  return "details" in input && "base" in input
}

export function getListingTitle(input: CreateListingInput | PublicListingDetail): string {
  if (input.type === "performance") {
    if (isCreateListingInput(input)) {
      const subtype = input.details.subtype as string | undefined
      if (subtype === "PIECE" && input.piece_details) {
        const pieceTitle = input.piece_details.piece_title || input.piece_details.piece_company
        const parentName = input.piece_details.parent_event_name
        if (parentName && pieceTitle) {
          return `${parentName} - ${pieceTitle}`
        }
        return pieceTitle || parentName || "Untitled Piece"
      }
      return (input.details.title as string) || "Untitled Performance"
    } else {
      if (input.performance_details?.subtype === "PIECE" && input.piece_details) {
        const pieceTitle = input.piece_details.piece_title || input.piece_details.piece_company
        const parentName = input.piece_details.parent_event_name
        if (parentName && pieceTitle) {
          return `${parentName} - ${pieceTitle}`
        }
        return pieceTitle || parentName || "Untitled Piece"
      }
      return input.performance_details?.title || "Untitled Performance"
    }
  }
  
  if (input.type === "audition") {
    if (isCreateListingInput(input)) {
      return (input.details.title as string) || "Untitled Audition"
    } else {
      return input.audition_details?.title || "Untitled Audition"
    }
  }
  
  if (input.type === "creative") {
    if (isCreateListingInput(input)) {
      return (input.details.title as string) || UNTITLED_OPPORTUNITY_TITLE
    } else {
      return input.creative_details?.title || UNTITLED_OPPORTUNITY_TITLE
    }
  }
  
  if (input.type === "class") {
    if (isCreateListingInput(input)) {
      const classWorkshopType = input.details.class_workshop_type as string | undefined
      if (classWorkshopType === "CLASS") {
        const parentWorkshopName = input.details.parent_workshop_name as string | undefined
        const className = (input.details.title as string) || undefined
        if (parentWorkshopName && className) {
          return `${parentWorkshopName} - ${className}`
        }
        return parentWorkshopName || className || "Untitled Class"
      }
      return (input.details.title as string) || "Untitled Class/Workshop"
    } else {
      const classWorkshopType = input.class_workshop_details?.class_workshop_type
      if (classWorkshopType === "CLASS") {
        const parentWorkshopName = input.class_workshop_details?.parent_workshop_name
        const className = input.class_workshop_details?.title
        if (parentWorkshopName && className) {
          return `${parentWorkshopName} - ${className}`
        }
        return parentWorkshopName || className || "Untitled Class"
      }
      return input.class_workshop_details?.title || "Untitled Class/Workshop"
    }
  }
  
  return "Untitled Listing"
}
