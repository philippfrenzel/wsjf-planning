---
phase: 06-feedback-completeness
plan: "02"
subsystem: ui
tags: [react, inertia, confirm-dialog, useConfirm, destructive-actions, ux]

# Dependency graph
requires:
  - phase: 05-foundation-phase-4-completion
    provides: ConfirmDialogProvider + useConfirm() hook installed and mounted in app-header-layout.tsx
provides:
  - Confirmation guard on all 5 previously unguarded/wrong-dialog destructive actions (FEED-01 partial)
  - useConfirm() pattern applied to projects/index, commitments/index, commitments/show, DependencyManager, users/index
  - Link method="delete" antipattern eliminated from all commitment pages
  - Dialog + local state boilerplate removed from users/index.tsx
affects:
  - 06-feedback-completeness (remaining plans in this phase)
  - Any future page implementing destructive actions

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Async onClick + await useConfirm() for all destructive actions (no onBefore, no window.confirm)"
    - "router.delete() called only after Promise<boolean> resolves true"
    - "Link method=delete replaced with Button + async handler for guarded deletes"

key-files:
  created: []
  modified:
    - resources/js/pages/projects/index.tsx
    - resources/js/pages/commitments/index.tsx
    - resources/js/pages/commitments/show.tsx
    - resources/js/pages/features/components/DependencyManager.tsx
    - resources/js/pages/users/index.tsx

key-decisions:
  - "useConfirm() async onClick pattern chosen over onBefore (Inertia onBefore is sync — Promises ignored)"
  - "Link method=delete eliminated — cannot intercept async dialog; replaced with plain Button + router.delete"
  - "users/index.tsx Dialog + 4-variable state replaced with single useConfirm() call — removes boilerplate"

patterns-established:
  - "Pattern: All destructive actions use async onClick + await confirm() + if (!ok) return guard"
  - "Pattern: No <Link method=delete> for any action that needs a confirmation dialog"

requirements-completed: [FEED-01]

# Metrics
duration: 9min
completed: 2026-03-01
---

# Phase 6 Plan 02: Confirmation Guards (Unguarded Actions) Summary

**Confirmation dialogs added to all 5 unguarded/wrong-dialog destructive actions: project delete, commitment delete (list + detail), dependency removal, and user delete replaced from Dialog boilerplate to useConfirm()**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-01T08:42:30Z
- **Completed:** 2026-03-01T08:51:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Eliminated `<Link method="delete">` antipattern from `commitments/index.tsx` and `commitments/show.tsx` — replaced with async `useConfirm()` + `router.delete()` buttons
- Removed unguarded form-submit delete from `projects/index.tsx` — `<form onSubmit>` wrapper gone, replaced with async onClick handler
- Added `useConfirm()` guard to `DependencyManager.tsx` dependency removal
- Replaced `users/index.tsx` custom Dialog (with `isDeleteDialogOpen` / `userToDelete` / `useForm().delete` state) with a single `useConfirm()` call — removed ~4 state variables and full Dialog JSX block
- TypeScript error count decreased from 49 → 48 (removing unused `useForm` in users/index.tsx fixed one pre-existing issue)

## Task Commits

Each task was committed atomically:

1. **Task 1: Guard project delete + fix commitment Link-method-delete antipattern** - `b1433b3` (feat)
2. **Task 2: Guard DependencyManager.tsx + replace Dialog state in users/index.tsx** - `483aa4a` (feat)

**Plan metadata:** _(docs commit — see below)_

## Files Created/Modified

- `resources/js/pages/projects/index.tsx` — Removed form-submit delete wrapper; added `useConfirm` async `handleDeleteProject`
- `resources/js/pages/commitments/index.tsx` — Replaced `<Link method="delete">` with `useConfirm` async `handleDeleteCommitment` button; added `router` import
- `resources/js/pages/commitments/show.tsx` — Replaced `<Link method="delete">` with `useConfirm` async `handleDeleteCommitment` button; added `router` import
- `resources/js/pages/features/components/DependencyManager.tsx` — Renamed `remove()` → `handleRemoveDependency()` async, wrapped with `useConfirm` guard
- `resources/js/pages/users/index.tsx` — Removed `Dialog` import, `X` icon, `useForm`, `isDeleteDialogOpen`/`userToDelete` state, `handleDelete`/`confirmDelete` functions, and full Dialog JSX block; replaced with `useConfirm` async `handleDeleteUser`

## Decisions Made

- Used `async onClick` + `await confirm()` pattern exclusively — never `onBefore` (Inertia's `onBefore` is synchronous; Promises returned there are ignored, so the guard would never actually block)
- `<Link method="delete">` is fundamentally incompatible with async confirmation dialogs (fires on click immediately); all such usages replaced with `<Button onClick={asyncHandler}>`
- users/index.tsx `useForm().delete` removed in favour of `router.delete()` inside the `useConfirm` handler — simpler, no form state needed for a bare delete action

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FEED-01 fully resolved: all 11 destructive action locations now use `useConfirm()` (Plan 01 covered 6 confirm()/onBefore locations; this plan covered the remaining 5 unguarded/wrong-dialog locations)
- Phase 6 Plan 03 (FEED-02 — form processing state) is unblocked
- All 5 modified files pass TypeScript (no new errors introduced; 1 pre-existing error resolved)

---
*Phase: 06-feedback-completeness*
*Completed: 2026-03-01*

## Self-Check: PASSED

- ✅ `resources/js/pages/projects/index.tsx` — exists, contains `useConfirm`
- ✅ `resources/js/pages/commitments/index.tsx` — exists, contains `useConfirm`
- ✅ `resources/js/pages/commitments/show.tsx` — exists, contains `useConfirm`
- ✅ `resources/js/pages/features/components/DependencyManager.tsx` — exists, contains `useConfirm`
- ✅ `resources/js/pages/users/index.tsx` — exists, contains `useConfirm`, no `isDeleteDialogOpen`
- ✅ `.planning/phases/06-feedback-completeness/06-02-SUMMARY.md` — exists
- ✅ Commit `b1433b3` found (Task 1)
- ✅ Commit `483aa4a` found (Task 2)
- ✅ Commit `36ffa6e` found (metadata)
- ✅ TypeScript: 48 errors (same pre-existing errors, 1 fewer than before changes)
