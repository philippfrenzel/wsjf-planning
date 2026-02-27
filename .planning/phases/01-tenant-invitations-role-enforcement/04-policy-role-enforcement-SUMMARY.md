# Plan 04: Policy Role Enforcement — SUMMARY

**Phase:** 01-tenant-invitations-role-enforcement
**Plan:** 04-policy-role-enforcement
**Status:** ✅ Complete
**Date:** 2026-02-27

## What Was Built

Added role enforcement to all four existing Laravel policies. Previously, any authenticated tenant member could create, update, or delete any resource. After this plan:

- **FeaturePolicy** — create/update/delete require `Admin` or `Planner`
- **PlanningPolicy** — create/update/delete require `Admin` or `Planner`
- **VotePolicy** — create allows `Admin`, `Planner`, or `Voter`; update/delete require `Admin` or `Planner`
- **CommitmentPolicy** — create/update/delete require `Admin` or `Planner`

All `viewAny()` and `view()` methods are unchanged — any tenant member can read.

## Files Modified

| File | Change |
|------|--------|
| `app/Policies/FeaturePolicy.php` | `create()`, `update()`, `delete()` now call `hasRoleInTenant()` for Admin\|Planner |
| `app/Policies/PlanningPolicy.php` | `create()`, `update()`, `delete()` now call `hasRoleInTenant()` for Admin\|Planner |
| `app/Policies/VotePolicy.php` | `create()` allows Admin\|Planner\|Voter; `update()`/`delete()` require Admin\|Planner |
| `app/Policies/CommitmentPolicy.php` | `create()`, `update()`, `delete()` now call `hasRoleInTenant()` for Admin\|Planner |

## Key Design Decisions

- **No SuperAdmin checks in policies** — `Gate::before()` (Plan 01) returns `true` for SuperAdmin before any policy method is reached; adding `isSuperAdmin()` in policies would be redundant.
- **update/delete always check `sameTenant()` first** — cross-tenant mutation is still blocked even if somehow a wrong tenant ID leaked.
- **VotePolicy::create() includes Voter** — voters participate in voting sessions by casting votes; they must be able to create `Vote` records.
- **Private helpers (`sameTenant`, `userHasTenant`, `tenantId`) unchanged** — used by unchanged view methods and as building blocks.

## Deviations from Plan

None. All changes match the specification exactly.

## Commits

- `3cfaaed` — feat(policies): enforce Admin|Planner roles in FeaturePolicy and PlanningPolicy
- `071d6cc` — feat(policies): enforce role checks in VotePolicy and CommitmentPolicy

## Requirements Satisfied

- ROLE-04: Voters restricted from mutating Features, Plannings, Commitments
- ROLE-05: Voters can participate in voting sessions (create Votes)
