# STATE.md — WSJF Planning Tool

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-27)

**Core value:** Teams can run a complete WSJF planning session without friction, in a single sitting.
**Current focus:** Phase 1 — Tenant Invitations & Role Enforcement

## Current Status

**Phase:** 1 of 4
**Phase status:** In progress — Plans 01, 02, and 04 complete
**Milestone:** v1.0 (Sellable SaaS)

## What Was Just Done

- **Plan 01: Role Foundation** (2026-02-27)
  - Migration: seeded SuperAdmin/Admin/Planner/Voter role names, backfilled tenant owners to `role='Admin'`
  - `User::isSuperAdmin()` — memoized with `once()`, queries `role_user` pivot
  - `User::hasRoleInTenant()` — queries `tenant_user` pivot
  - `User::currentTenantRole()` — returns current tenant role string
  - `Gate::before()` registered: SuperAdmin bypasses all policy checks
  - `TenantScope::apply()` early-returns for SuperAdmin (sees all tenant data)

- **Plan 02: Invitation Flow** (2026-02-27)
  - Created `TenantInvitationMail` queued mailable + blade email template
  - `TenantController::invite()` now dispatches `Mail::queue(new TenantInvitationMail($invitation))`
  - `TenantInvitation::acceptFor()` rewritten with race-safe atomic DB update-check and `role='Voter'` assignment
  - `RegisteredUserController::store()` processes invitation token from session post-login and patches `role='Admin'` for new tenant owners

- **Plan 04: Policy Role Enforcement** (2026-02-27)
  - FeaturePolicy, PlanningPolicy, CommitmentPolicy: create/update/delete require Admin|Planner
  - VotePolicy: create allows Admin|Planner|Voter; update/delete require Admin|Planner
  - view/viewAny methods unchanged — any tenant member can read
  - No SuperAdmin checks added (Gate::before handles this)

- **Plan 03: RequireRole Middleware** (2026-02-27)
  - Created `RequireRole` middleware: SuperAdmin bypass, per-tenant role check via `hasRoleInTenant()`
  - Registered `'role'` alias in `bootstrap/app.php`
  - Gated `plannings.admin`, `plannings.set-creator`, and `/admin/users` routes with `role:Admin` middleware
  - Removed inline `roles()->where('name','admin')` checks from `PlanningController`

## What's Next

Run Plan 04: Policy updates — update existing Laravel policies to check tenant roles.

## Key Decisions (Accumulated)

- `Mail::queue()` used (not `Mail::send()`) — non-blocking, compatible with sync queue in tests
- `acceptFor()` uses raw `DB::table` update-check for `accepted_at` atomicity (not `forceFill`)
- New tenant owner `role='Admin'` assigned via `whereNull('role')` patch immediately after registration login

## Open Questions / Blockers

- PHP binary broken on host (libicu version mismatch) — runtime verification done by code inspection only.

## Session Notes

_Add notes here during active work sessions._

---
*Last updated: 2026-02-27 after Plan 04 (policy role enforcement) execution*
