---
phase: 06-feedback-completeness
plan: 04
subsystem: ui
tags: [react, inertia, useForm, InputError, LoaderCircle, projects]

# Dependency graph
requires:
  - phase: 06-feedback-completeness
    provides: useForm migration pattern established in 06-03 (features domain)
provides:
  - projects/create.tsx migrated to useForm with processing state and 8 InputError replacements
  - projects/edit.tsx migrated to useForm with processing state (both buttons) and 9 InputError replacements
affects: [06-05, 06-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useForm() replaces useState + router.post/put for all project form submissions"
    - "disabled={processing} + conditional LoaderCircle/Save icon swap on submit buttons"
    - "InputError replaces raw <p className='text-red-600'> for all field errors"

key-files:
  created: []
  modified:
    - resources/js/pages/projects/create.tsx
    - resources/js/pages/projects/edit.tsx

key-decisions:
  - "Swap Save icon for LoaderCircle when processing (not both simultaneously) — cleaner UX than showing both icons"
  - "handleChange/handleSelectChange updated to use setData(field as keyof typeof data, value) — preserves existing handler structure while being type-safe"
  - "new_status field included in the same useForm instance as all other project fields — single put() covers both content and status changes"

patterns-established:
  - "useForm migration: setData(e.target.name as keyof typeof data, value) for generic change handlers"
  - "Both top and bottom submit buttons in edit forms get identical disabled={processing} + spinner treatment"

requirements-completed: [FEED-02, FEED-03]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 6 Plan 04: Projects Domain — useForm Migration + InputError Normalization Summary

**projects/create.tsx and projects/edit.tsx migrated from router.post/put to useForm with processing-disabled buttons and 17 InputError replacements (8 + 9)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T08:54:44Z
- **Completed:** 2026-03-01T08:59:20Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `projects/create.tsx`: Full useForm migration — `useState` + `router.post` replaced, 8 `<InputError>` replacements, submit button with `disabled={processing}` + LoaderCircle
- `projects/edit.tsx`: Full useForm migration — `useState` + `router.put` replaced, 9 `<InputError>` replacements, BOTH submit buttons (top bar + bottom bar) with `disabled={processing}` + LoaderCircle
- Zero pre-existing TypeScript errors introduced in either file

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate projects/create.tsx** - `d4d20d3` (feat)
2. **Task 2: Migrate projects/edit.tsx** - `6797690` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `resources/js/pages/projects/create.tsx` — useForm + processing button + 8 InputError replacements for: project_number, name, description, jira_base_uri, project_leader_id, deputy_leader_id, start_date, end_date
- `resources/js/pages/projects/edit.tsx` — useForm + processing on both buttons + 9 InputError replacements for: project_number, name, description, jira_base_uri, project_leader_id, deputy_leader_id, start_date, end_date, new_status

## Decisions Made
- **Save icon swap:** When `processing`, the Save icon is swapped for LoaderCircle (not both shown together) — `{processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save />}`. Cleaner UX.
- **Generic `setData` handler:** Updated `handleChange` to `setData(e.target.name as keyof typeof data, value)` — preserves the existing pattern while being type-safe with useForm.
- **Single form instance for edit:** The `new_status` field is included in the same `useForm` instance as all other project fields. No separate form needed since the backend handles the status change as part of the same PUT request.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript check confirmed zero errors in the modified files. Pre-existing TS errors in plannings/index.tsx and votes/session.tsx were out-of-scope and untouched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Projects domain (create + edit) is now fully FEED-02 and FEED-03 compliant
- Wave 2 plans 06-05 and 06-06 can proceed independently (different file domains)
- Remaining FEED-02/FEED-03 work: plannings domain (06-03 if not yet done), plans domain (06-05/06), votes domain

---
*Phase: 06-feedback-completeness*
*Completed: 2026-03-01*

## Self-Check: PASSED

- `resources/js/pages/projects/create.tsx` ✅ exists
- `resources/js/pages/projects/edit.tsx` ✅ exists
- `d4d20d3` feat(06-04): migrate projects/create.tsx ✅ exists
- `6797690` feat(06-04): migrate projects/edit.tsx ✅ exists
- Zero `text-red-600` in either file ✅
- Zero `router.post/put` in either file ✅
- `useForm` present in both files ✅
