# @rello-platform/enrollments

Canonical enrollment-state enum for the Rello ecosystem. A single source of truth for the running-state machines that govern lead progression through nurture sequences and journey workflows. Consuming this package makes the canonical 7-value `EnrollmentStatus` enum a **compile-time contract** across Rello (`NurtureEnrollment` + `LeadJourneyEnrollment`), Journey-Engine (`Enrollment`), Milo-Engine, and any future enrollment-style state machine.

Provenance: ANSWERS.md Revision C (2026-05-02). Replaces three parallel historical enums (Rello `NurtureEnrollmentStatus`, Rello `JourneyEnrollmentStatus`, Journey-Engine local `EnrollmentStatus`) with a single canonical declaration distributed via this package.

## Install

```bash
npm install "github:rello-platform/enrollments#v0.1.0"
```

## Usage

```ts
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_SET,
  LEGACY_STATUS_ALIASES,
  isCanonicalEnrollmentStatus,
  normalizeEnrollmentStatus,
  type EnrollmentStatus,
} from "@rello-platform/enrollments";

// Type-checked status comparisons (e.g., admin filter UIs)
if (enrollment.status === ("EXITED" satisfies EnrollmentStatus)) {
  // ...
}

// Boundary normalization (webhook payloads, legacy persisted values)
const status = normalizeEnrollmentStatus(payload.status);
if (status === null) throw new Error(`Unknown enrollment status: ${payload.status}`);

// Type guard for runtime validation
if (!isCanonicalEnrollmentStatus(input)) {
  throw new Error(`Unknown enrollment status: ${input}`);
}
```

## Canonical values

```ts
const ENROLLMENT_STATUSES = [
  "ACTIVE",     // Currently running through steps
  "PAUSED",     // Manually paused; can resume
  "COMPLETED",  // Finished all steps successfully
  "EXITED",     // Manually removed before completion (replaces Nurture's CANCELLED)
  "FAILED",     // Errored out; retry exhausted
  "STALLED",    // Hasn't progressed in N days (per Q3.9 stall detection)
  "WAITING",    // Queued behind higher-priority enrollment
] as const;
```

Drift between this package's value list and any consumer's Prisma `enum EnrollmentStatus` declaration is caught by `tsc --noEmit` at the boundary import (Prisma-generated client types and this package's type union must agree by structural equivalence).

## Legacy aliases

`normalizeEnrollmentStatus()` consults a small alias table to forward-map historical variants observed in production write paths:

| Legacy value | Canonical |
|---|---|
| `CANCELLED` | `EXITED` |
| `ABANDONED` | `EXITED` |

Use it at trust-boundary read positions (webhook payload decode, parsing persisted values from older snapshots). Direct comparison against the canonical 7-value enum is preferred for all internal code paths.

## Prisma counterpart

Each schema-bearing repo declares the matching Prisma enum:

```prisma
enum EnrollmentStatus {
  ACTIVE
  PAUSED
  COMPLETED
  EXITED
  FAILED
  STALLED
  WAITING
}
```

- Rello (`~/Rello/prisma/schema.prisma`) — `@@schema("public")`. Both `NurtureEnrollment.status` and `LeadJourneyEnrollment.status` reference this enum.
- Journey-Engine (`~/Journey-Engine/prisma/schema.prisma`) — `@@schema("journey_engine")`. `Enrollment.status` references this enum.
- Milo-Engine consumes Rello's schema via shared Prisma client; no local declaration.

## Coordination discipline

Changing the canonical value list (adding, removing, or renaming) is a coordinated cross-repo migration. The minimum sequence is:

1. Bump this package's version + value list; ship a tag.
2. Coordinate atomic schema-push in Rello + Journey-Engine within one deploy window (CLAUDE.md "Schema-First Within Atomic PR" + "Database Schema Changes" 6-step ritual).
3. Regenerate Milo-Engine's Prisma client (no schema push — shared Rello DB).
4. Update APP-OWNERSHIP-MATRIX cross-app surface entry.

Renaming or removing a value is forward-only at the schema layer in Postgres. Pre-launch the cost is small; post-launch a rename becomes a dual-write + reader-widening + soak migration.

## Versioning

- `v0.1.0` — bootstrap. Canonical 7-value list per Revision C. Adds `STALLED` (new, gated on Q3.9 stall-detection write path) and consolidates Nurture `CANCELLED` → `EXITED` semantically.

## Provenance

- Spec: `~/Library/Mobile Documents/com~apple~CloudDocs/ClearPath Utah Mortgage/Applications/~Application Docs/RELLO TO BE BUILT/PLATFORM ADMIN BUILD/SPEC-ENROLLMENT-STATUS-UNIFICATION.md` (2026-05-02).
- Lock: `ANSWERS.md` § Revision C — Q5.5 Enrollment status enum (2026-05-02).
- Pattern reference: `@rello-platform/slugs`, `@rello-platform/permissions`, `@rello-platform/nurture-goals`.
