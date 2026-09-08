/**
 * Org-wide EAR member codes. Server-only — never import from client components.
 * Override with EAR_MEMBER_CODE_STANDARD / EAR_MEMBER_CODE_FISCAL_SPONSOR.
 */
export type MemberCodeConfig = {
  standardCode: string
  fiscalSponsorCode: string
}

export function getMemberCodeConfig(): MemberCodeConfig {
  return {
    standardCode: process.env.EAR_MEMBER_CODE_STANDARD?.trim() || "EAR-MEMBER",
    fiscalSponsorCode: process.env.EAR_MEMBER_CODE_FISCAL_SPONSOR?.trim() || "EAR-FISCAL",
  }
}
