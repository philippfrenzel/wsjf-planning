---
phase: 06-feedback-completeness
plan: "07"
subsystem: ui
tags: [react, inertia, useConfirm, confirm-dialog, isSaving, hooks, features-domain]

# Dependency graph
requires:
  - phase: 06-feedback-completeness
    provides: "06-03 complete — EstimationDialog and EditComponentDialog accept optional processing prop"
provides:
  - Comments.tsx: native confirm() replaced with useConfirm() async pattern
  - useEstimationManagement.ts: confirm() removed, isSaving state added and returned
  - useComponentManagement.ts: confirm() removed, isSaving state added and returned
  - features/show.tsx: async guard wrappers for delete-estimation and archive-component; isSaving threaded to dialogs as processing prop
affects:
  - Any page rendering Comments component (features/show.tsx, plannings/show.tsx, projects/show.tsx)
  - features/show.tsx callers of ComponentItem and dialog components

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hook-level isSaving: useState(false) in custom hooks, setIsSaving(true) before router calls, setIsSaving(false) in onSuccess and onError"
    - "Async confirm wrapper in component: const handleXWithConfirm = async (id) => { const ok = await confirm({...}); if (!ok) return; hookFn(id); }"
    - "Separation of concerns: hooks execute actions directly; confirm guards live in the component/call site (hooks cannot call useConfirm — no React context)"

key-files:
  created: []
  modified:
    - resources/js/components/comments/Comments.tsx
    - resources/js/hooks/useEstimationManagement.ts
    - resources/js/hooks/useComponentManagement.ts
    - resources/js/pages/features/show.tsx

key-decisions:
  - "Confirm guards moved to call site (show.tsx), not hooks — hooks cannot call useConfirm() because custom hooks lack the ConfirmDialogProvider React context"
  - "isSaving added to both hooks rather than relying on parent state — hooks already own the router.delete/post/put calls, tracking isSaving there is the correct locality"
  - "handleArchiveWithConfirm and handleDeleteEstimationWithConfirm created as async wrappers in show.tsx — thin wrappers that await confirm() then call hook function directly"

patterns-established:
  - "isSaving in custom hooks: declare alongside other useState, setIsSaving(true) before each router call, setIsSaving(false) in both onSuccess and onError"
  - "Confirm wrapper pattern: async (id) => { const ok = await confirm({title, description, confirmLabel, cancelLabel}); if (!ok) return; hookFn(id); }"

requirements-completed: [FEED-01, FEED-02]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 6 Plan 07: Gap-Closure — Comments.tsx confirm() + Hooks isSaving + show.tsx guards Summary

**Native confirm() removed from Comments.tsx and both estimation/component hooks; isSaving state added to hooks and threaded to dialog processing props via async confirm wrappers in features/show.tsx**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T09:05:53Z
- **Completed:** 2026-03-01T09:08:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `Comments.tsx`: `handleDelete` now uses `await confirm({...})` from `useConfirm()` — no native `confirm()` remains in the comments component
- `useEstimationManagement.ts`: `confirm()` guard removed from `handleDeleteEstimation`; `isSaving` state added with `setIsSaving(true/false)` in `handleDeleteEstimation` and `handleEstimationSubmit`; `isSaving` returned
- `useComponentManagement.ts`: `confirm()` guard removed from `archiveComponent`; `isSaving` state added with `setIsSaving(true/false)` in `handleComponentSubmit`, `handleEditComponentSubmit`, and `archiveComponent`; `isSaving` returned
- `features/show.tsx`: `useConfirm` imported; `isSaving` aliased as `componentIsSaving` / `estimationIsSaving` from both hooks; async wrappers `handleArchiveWithConfirm` and `handleDeleteEstimationWithConfirm` created; `ComponentItem` receives wrappers; `EstimationDialog` receives `processing={estimationIsSaving}`; `EditComponentDialog` receives `processing={componentIsSaving}`

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Comments.tsx — replace native confirm() with useConfirm() async pattern** - `537b638` (feat)
2. **Task 2: Remove confirm() from hooks + add isSaving + wire guards and isSaving in features/show.tsx** - `3a074d6` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `resources/js/components/comments/Comments.tsx` — `useConfirm` import added; `const confirm = useConfirm()` inside component; `handleDelete` replaced native `confirm()` with `await confirm({title, description, confirmLabel, cancelLabel})`
- `resources/js/hooks/useEstimationManagement.ts` — `isSaving` state added; `confirm()` guard removed from `handleDeleteEstimation`; `setIsSaving(true/false)` in `handleDeleteEstimation` and `handleEstimationSubmit`; `isSaving` added to return object
- `resources/js/hooks/useComponentManagement.ts` — `isSaving` state added; `confirm()` guard removed from `archiveComponent`; `setIsSaving(true/false)` in `handleComponentSubmit`, `handleEditComponentSubmit`, `archiveComponent`; `isSaving` added to return object
- `resources/js/pages/features/show.tsx` — `useConfirm` import; `isSaving` aliased from both hooks; `const confirm = useConfirm()`; `handleArchiveWithConfirm` and `handleDeleteEstimationWithConfirm` async wrappers; `ComponentItem` updated to use wrappers; `EstimationDialog` + `EditComponentDialog` receive `processing` prop

## Decisions Made

- Confirm guards placed in `show.tsx` (the call site), not in the hooks — custom hooks run outside the `ConfirmDialogProvider` React context tree and cannot call `useConfirm()`. This is the correct architectural pattern.
- `isSaving` state owned by each hook — the hooks own the `router.delete/post/put` calls, so tracking loading state there keeps the logic co-located.
- Async wrapper functions are thin — they only `await confirm()` and then call the existing hook function. No logic duplication.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FEED-01 (native confirm() removal): Phase 6 features domain fully closed — all 3 missed `confirm()` calls from the gap-closure audit resolved
- FEED-02 (isSaving/processing state): Both estimation and component hooks now surface `isSaving`; dialog components receive it as `processing` prop
- Phase 6 complete — all FEED-01/FEED-02/FEED-03 items addressed across all 7 plans

---
*Phase: 06-feedback-completeness*
*Completed: 2026-03-01*

## Self-Check: PASSED

- ✅ `resources/js/components/comments/Comments.tsx` — exists, contains `useConfirm`, no native `confirm()` guard
- ✅ `resources/js/hooks/useEstimationManagement.ts` — exists, contains `isSaving`, no `confirm()` guard
- ✅ `resources/js/hooks/useComponentManagement.ts` — exists, contains `isSaving`, no `confirm()` guard
- ✅ `resources/js/pages/features/show.tsx` — exists, contains `useConfirm`, `estimationIsSaving`, `componentIsSaving`
- ✅ `.planning/phases/06-feedback-completeness/06-07-SUMMARY.md` — created
- ✅ Commit `537b638` — Task 1 (Comments.tsx)
- ✅ Commit `3a074d6` — Task 2 (hooks + show.tsx)
- ✅ TypeScript: 48 errors (same as baseline — no new errors introduced)
