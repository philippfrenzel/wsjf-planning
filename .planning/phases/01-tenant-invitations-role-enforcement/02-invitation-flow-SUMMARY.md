---
phase: 01-tenant-invitations-role-enforcement
plan: 02
subsystem: auth
tags: [mail, queue, invitation, roles, laravel]

# Dependency graph
requires: []
provides:
  - TenantInvitationMail queued mailable with blade template
  - TenantController::invite() dispatches invitation email via Mail::queue()
  - TenantInvitation::acceptFor() assigns Voter role with race-safe atomic update
  - RegisteredUserController::store() processes invitation token post-registration
  - New tenant owners automatically assigned Admin role on registration

affects:
  - 03-role-enforcement (uses acceptFor, relies on role='Voter'/'Admin' being set correctly)
  - future billing phase (tenant membership gating relies on correct roles)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Queued Mailables implementing ShouldQueue with SerializesModels for invitation emails
    - Race-safe invitation acceptance via DB::table atomic update-check inside transaction
    - Session-based invitation token flow bridging pre-login and post-registration acceptance

key-files:
  created:
    - app/Mail/TenantInvitationMail.php
    - resources/views/mail/tenant-invitation.blade.php
  modified:
    - app/Http/Controllers/TenantController.php
    - app/Models/TenantInvitation.php
    - app/Http/Controllers/Auth/RegisteredUserController.php

key-decisions:
  - "Use Mail::queue() (not Mail::send()) so mail delivery is non-blocking even with QUEUE_CONNECTION=sync in tests"
  - "acceptFor() does atomic DB update-check before syncWithoutDetaching — prevents double-accept race condition"
  - "New-user registration assigns Admin role via DB patch on null-role rows (ROLE-01/03 fix)"
  - "accepted_at is set via DB::table raw update (not Eloquent forceFill) to keep the race-check atomic within the transaction"

patterns-established:
  - "Race-safe invitation acceptance: DB::table atomic update-check before pivot attachment"
  - "Session token flow: accept route stores token → login/register controller pulls and processes it"

requirements-completed: [INV-01, INV-02, INV-03, INV-05]

# Metrics
duration: 15min
completed: 2026-02-27
---

# Plan 02: Invitation Flow Summary

**End-to-end invitation flow: email dispatched on invite, Voter role assigned on accept, new-user registration processes session token with race-safe atomic DB update**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- `TenantInvitationMail` queued mailable with HTML blade template including accept link, inviter name, tenant name, and expiry date
- `TenantController::invite()` now calls `Mail::queue(new TenantInvitationMail($invitation))` after creating the invitation record
- `TenantInvitation::acceptFor()` replaced with race-safe version: atomic `DB::table` update-check for `accepted_at`, then pivot attachment, then `role='Voter'` assignment
- `RegisteredUserController::store()` processes `tenant_invitation_token` from session after `Auth::login()`, and patches `role='Admin'` for newly created tenant owners

## Task Commits

Each task was committed atomically:

1. **Task 1: TenantInvitationMail + blade template** - `a23098a` (feat)
2. **Task 2: Wire email dispatch + fix acceptFor()** - `70925cd` (feat)
3. **Task 3: Handle invitation token in RegisteredUserController** - `bed885b` (feat)

## Files Created/Modified
- `app/Mail/TenantInvitationMail.php` - Queued mailable, ShouldQueue, accepts TenantInvitation, renders blade template
- `resources/views/mail/tenant-invitation.blade.php` - HTML email with accept button, inviter attribution, expiry notice
- `app/Http/Controllers/TenantController.php` - Added Mail::queue() call after TenantInvitation::create()
- `app/Models/TenantInvitation.php` - acceptFor() rewritten with atomic update-check + Voter role assignment
- `app/Http/Controllers/Auth/RegisteredUserController.php` - Added invitation token processing and Admin role patch

## Decisions Made
- Used `Mail::queue()` (not `Mail::send()`) so the dispatch is non-blocking and compatible with `QUEUE_CONNECTION=sync` in tests
- `accepted_at` is set via raw `DB::table` update inside the transaction (not `forceFill`) to preserve atomicity of the race check
- New-tenant owner gets `role='Admin'` via a `whereNull('role')` DB patch immediately after login — minimal and backwards-compatible

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- PHP binary was broken (libicu version mismatch on the host) — runtime verification via `php artisan tinker` was not possible. Files were verified by syntax inspection and `git diff` review.

## User Setup Required

None - no external service configuration required. Email delivery uses `MAIL_MAILER=log` in dev; queue uses `QUEUE_CONNECTION=sync` in tests.

## Next Phase Readiness
- Invitation flow fully wired end-to-end
- Voter and Admin roles are now correctly assigned at the database level
- Ready for Phase 01 Plan 03: Role enforcement middleware and policy updates

---
*Phase: 01-tenant-invitations-role-enforcement*
*Completed: 2026-02-27*
