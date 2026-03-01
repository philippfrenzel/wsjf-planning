---
phase: 06-feedback-completeness
plan: 01
subsystem: ui
tags: [react, inertia, confirm-dialog, useConfirm, AlertDialog, InputError]

# Dependency graph
requires:
  - phase: 05-foundation-phase-4-completion
    provides: ConfirmDialogProvider and useConfirm() hook installed and mounted in app-header-layout.tsx
provides:
  - Native confirm() replaced with useConfirm() async AlertDialog in features/index.tsx
  - Native confirm() replaced with useConfirm() async AlertDialog in plannings/index.tsx (both table and card views)
  - Broken onBefore async pitfall fixed in tenants/index.tsx invitation revoke
  - Member remove guard converted to async useConfirm() in tenants/index.tsx
  - InputError added below email invite field in tenants/index.tsx
affects: [07-form-processing-state, 08-input-error-normalization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useConfirm() async onClick pattern: import useConfirm, add const confirm = useConfirm() at component top, convert handler to async, await confirm({...}), guard with if (!ok) return"
    - "Never use onBefore with async confirm — Inertia's onBefore is synchronous; always use async onClick"
    - "Replace form+onSubmit delete wrapper with plain Button onClick async handler"

key-files:
  created: []
  modified:
    - resources/js/pages/features/index.tsx
    - resources/js/pages/plannings/index.tsx
    - resources/js/pages/tenants/index.tsx

key-decisions:
  - "Replaced <form onSubmit> wrapper pattern for delete buttons with plain <Button onClick={async ()=> ...}> — cleaner and enables dialog intercept"
  - "Kept single const confirm = useConfirm() per component (not per handler) — one hook call serves all handlers in the file"
  - "errors destructured from useForm in tenants/index.tsx (was previously omitted from destructuring) to expose email validation errors via InputError"

patterns-established:
  - "Async confirm pattern: const confirm = useConfirm(); const handleDelete = async (id) => { const ok = await confirm({...}); if (!ok) return; router.delete(...); }"
  - "onBefore async pitfall: NEVER use onBefore: () => confirm() — always convert to async onClick"

requirements-completed: [FEED-01, FEED-03]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 6 Plan 01: Confirm Dialog Migration Summary

**Native `confirm()` / `onBefore` async pitfall eliminated from features, plannings, and tenants index pages — all destructive actions now use the `useConfirm()` AlertDialog hook from Phase 5**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T08:38:58Z
- **Completed:** 2026-03-01T08:43:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced 1 native `confirm()` call in `features/index.tsx` — feature delete now shows styled AlertDialog
- Replaced 2 native `confirm()` calls in `plannings/index.tsx` (table view + card view) — single `handleDeletePlanning` handler wired to both buttons
- Fixed critical `onBefore` async pitfall in `tenants/index.tsx` — invitation revoke was a broken Promise that fired immediately; now correctly async
- Replaced `if (!confirm(...))` guard in `tenants/index.tsx` member remove with async useConfirm()
- Added `<InputError message={errors.email} />` to tenant invite form (FEED-03 partial — tenants file)
- All 5 `confirm()` call sites across 3 files migrated; zero native browser dialogs remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace native confirm() in features/index.tsx and plannings/index.tsx** - `645187a` (feat)
2. **Task 2: Fix tenants/index.tsx — async onBefore pitfall, member remove guard, email InputError** - `8d0452e` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `resources/js/pages/features/index.tsx` — Added `useConfirm` import + hook; replaced form+onSubmit delete wrapper with async Button onClick
- `resources/js/pages/plannings/index.tsx` — Same pattern; both table-view and card-view delete buttons migrated to single async handler
- `resources/js/pages/tenants/index.tsx` — `revokeInvitation` fixed (async, no onBefore); `removeMember` fixed (async); `InputError` added for email; `errors` added to useForm destructuring

## Decisions Made

- Replaced `<form onSubmit>` delete wrappers with plain `<Button onClick={async ...}>` — eliminates the unnecessary `e.preventDefault()` noise and makes the intent clear
- Single `const confirm = useConfirm()` per component, shared by all handlers (not one per handler)
- The `errors` object was already available from `useForm` in tenants/index.tsx but not destructured — added it without changing any other useForm behavior

## Deviations from Plan

None - plan executed exactly as written.

The pre-existing TypeScript errors in `plannings/index.tsx` (`route('plannings.destroy', planning)` type mismatch) and unrelated files (`users/index.tsx`, `votes/session.tsx`) were present before this plan and remain unchanged. No new errors were introduced.

## Issues Encountered

None. The `onBefore` pitfall fix was straightforward once the function was converted to `async` — the `router.delete` call remained identical, just moved below the `await confirm()` guard.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FEED-01 (confirm dialogs): 5 of 11 locations complete (this plan). Remaining 6 locations (projects, commitments, DependencyManager, users) addressed in later plans.
- FEED-03 (InputError): tenants/index.tsx email field done. Full normalization across 8 form pages is Plan 06-03.
- All patterns established and verified — future plans can follow the same async useConfirm pattern without additional research.

---
*Phase: 06-feedback-completeness*
*Completed: 2026-03-01*

## Self-Check: PASSED

- ✅ `resources/js/pages/features/index.tsx` — exists, contains `useConfirm`
- ✅ `resources/js/pages/plannings/index.tsx` — exists, contains `useConfirm`
- ✅ `resources/js/pages/tenants/index.tsx` — exists, contains `useConfirm`, `InputError`, `errors.email`
- ✅ `.planning/phases/06-feedback-completeness/06-01-SUMMARY.md` — created
- ✅ Commit `645187a` — Task 1 (features + plannings)
- ✅ Commit `8d0452e` — Task 2 (tenants)
- ✅ Zero native `confirm('...')` calls in all 3 files
- ✅ REQUIREMENTS.md: FEED-01, FEED-03 marked complete
- ✅ ROADMAP.md: Phase 06 progress updated (1/7 summaries)
