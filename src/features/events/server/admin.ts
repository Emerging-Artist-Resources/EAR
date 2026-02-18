// Barrel export - re-exports all admin functions from modular files
// This maintains backward compatibility for existing imports

export {
  approveListingRepo,
  rejectListingRepo,
  deleteListingRepo,
} from "./admin-review"

export {
  listAdminListingsRepo,
  getAdminListingDetailRepo,
} from "./admin-queries"

export {
  updatePieceParentLinkRepo,
  createMinimalParentEventRepo,
  updateClassParentLinkRepo,
  createMinimalParentWorkshopRepo,
} from "./admin-parent-linking"

export {
  searchParentEventsRepo,
  searchParentWorkshopsRepo,
} from "./admin-parent-search"

export {
  listPiecesNeedingLinkRepo,
  listClassesNeedingLinkRepo,
} from "./admin-parent-queries"

export {
  addPieceOccurrencesToParent,
  addClassOccurrencesToParent,
  removePieceOccurrencesFromParent,
  removeClassOccurrencesFromParent,
} from "./admin-occurrence-sync"
