# STATE.md — WSJF Planning Tool

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-27)

**Core value:** Teams can run a complete WSJF planning session without friction, in a single sitting.
**Current focus:** Phase 1 — Tenant Invitations & Role Enforcement

## Current Status

**Phase:** 1 of 4
**Phase status:** In progress — Plan 02 complete
**Milestone:** v1.0 (Sellable SaaS)

## What Was Just Done

- **Plan 02: Invitation Flow** (2026-02-27)
  - Created `TenantInvitationMail` queued mailable + blade email template
  - `TenantController::invite()` now dispatches `Mail::queue(new TenantInvitationMail($invitation))`
  - `TenantInvitation::acceptFor()` rewritten with race-safe atomic DB update-check and `role='Voter'` assignment
  - `RegisteredUserController::store()` processes invitation token from session post-login and patches `role='Admin'` for new tenant owners

## What's Next

Run Plan 03: Role enforcement middleware and policy updates.

## Key Decisions (Accumulated)

- `Mail::queue()` used (not `Mail::send()`) — non-blocking, compatible with sync queue in tests
- `acceptFor()` uses raw `DB::table` update-check for `accepted_at` atomicity (not `forceFill`)
- New tenant owner `role='Admin'` assigned via `whereNull('role')` patch immediately after registration login

## Open Questions / Blockers

- PHP binary broken on host (libicu version mismatch) — runtime verification done by code inspection only.

## Session Notes

_Add notes here during active work sessions._

---
*Last updated: 2026-02-27 after Plan 02 (invitation flow) execution*
