/**
 * Canonical enrollment-state enum for the Rello ecosystem.
 * Consumed by Rello (NurtureEnrollment + LeadJourneyEnrollment),
 * Journey-Engine (Enrollment), and any future enrollment-style
 * state machine. Mirrors the Prisma `EnrollmentStatus` enum in
 * each repo's schema.prisma — drift between TS-side and DB-side
 * is caught at compile time.
 *
 * Provenance: ANSWERS.md Revision C (2026-05-02) — replaces
 * historical NurtureEnrollmentStatus + JourneyEnrollmentStatus
 * + JE-local EnrollmentStatus.
 */
export const ENROLLMENT_STATUSES = [
    "ACTIVE",
    "PAUSED",
    "COMPLETED",
    "EXITED",
    "FAILED",
    "STALLED",
    "WAITING",
];
export const ENROLLMENT_STATUS_SET = new Set(ENROLLMENT_STATUSES);
/**
 * Legacy-form → canonical mapping. Every drifted/historical
 * variant observed in production write paths as of unification.
 * Used at trust-boundary read positions (e.g., webhook payload
 * decode) to map stale values forward without dropping rows.
 *
 * "CANCELLED" → "EXITED" is the only required remap (semantic
 * equivalence per Revision C). Historical UI-only "ABANDONED"
 * also folds to "EXITED".
 */
export const LEGACY_STATUS_ALIASES = {
    CANCELLED: "EXITED",
    ABANDONED: "EXITED",
};
/** Type guard — accepts unknown, narrows to EnrollmentStatus. */
export function isCanonicalEnrollmentStatus(value) {
    return typeof value === "string" && ENROLLMENT_STATUS_SET.has(value);
}
/**
 * Normalize an unknown input (string-literal, legacy-aliased, or junk)
 * to a canonical EnrollmentStatus or null. Use at any boundary that
 * accepts external/persisted enrollment-status strings.
 *
 * Implementation note: lookup table uses Object.create(null) precedent
 * per `feedback-null-prototype-lookup-maps` for any caller-provided keys.
 */
export function normalizeEnrollmentStatus(value) {
    if (typeof value !== "string")
        return null;
    const upper = value.toUpperCase();
    if (ENROLLMENT_STATUS_SET.has(upper))
        return upper;
    return Object.prototype.hasOwnProperty.call(LEGACY_STATUS_ALIASES, upper)
        ? LEGACY_STATUS_ALIASES[upper]
        : null;
}
