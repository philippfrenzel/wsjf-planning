# STATE.md — WSJF Planning Tool

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-27)

**Core value:** Teams can run a complete WSJF planning session without friction, in a single sitting.
**Current focus:** Phase 2 — Stripe Subscription & Per-Seat Billing

## Current Status

**Phase:** 3 of 4
**Phase status:** Planning complete — 3 plans written (01-job-size-vote-type, 02-voting-session-ui, 03-wsjf-ranking-display); ready to execute
**Milestone:** v2.0 (WSJF Formula Complete)

## What Was Just Done

- **Phase 3 Planning** (2026-03-01) — Plans 01, 02, 03 written for WSJF Formula Completion
  - Plan 01: `01-job-size-vote-type-PLAN.md` — DB enum migration (SQLite-guarded), StoreVoteRequest/UpdateVoteRequest Fibonacci validation, all 5 VoteController `$types` arrays updated
  - Plan 02: `02-voting-session-ui-PLAN.md` — Fibonacci button-group picker in session.tsx and card-session.tsx; ensureUniqueValues skipped for JobSize
  - Plan 03: `03-wsjf-ranking-display-PLAN.md` — CommonVotesTable adds JobSize + WSJF Score columns; plannings/show.tsx gets third "WSJF Ranking" tab with frontend sort

## Previous Completed Work

- **Plan 03: Seat Sync & Webhooks** (2026-02-28) — Phase 2, Plan 03
  - `TenantController::syncSeatCount()`: private helper with `subscribed('default')` guard; calls `updateQuantity($count)` via Cashier
  - Wired to `accept()` — seat count synced when invitation accepted
  - Wired to `removeMember()` — seat count synced when member removed
  - Created `app/Listeners/StripeEventListener.php`: handles `invoice.payment_succeeded` (logs amount) and `invoice.payment_failed` (logs attempt_count)
  - Registered `StripeEventListener` against `WebhookReceived` in `AppServiceProvider::boot()` via `Event::listen()`

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

- **Plan 05: Tenant Management UI** (2026-02-27)
  - `TenantController`: added `updateMemberRole()`, `removeMember()`, `update()` methods; fixed `withPivot('role')` in `index()`
  - `HandleInertiaRequests`: added `currentRole` and `isSuperAdmin` to shared auth props
  - `routes/web.php`: moved invite/revoke into role:Admin group; added 3 new tenant management routes
  - `tenants/index.tsx`: Members tab with role badges + role-change + remove; Settings tab with name edit, seat count, subscription placeholder; admin-gated UI controls
  - `types/index.d.ts`: `Auth` interface updated with `currentRole` and `isSuperAdmin`

## What's Next

Phase 3, Plan 01: Execute `01-job-size-vote-type-PLAN.md` — migration + validation + controller whitelist.
Phase 3, Plan 02: Execute `02-voting-session-ui-PLAN.md` — Fibonacci picker in session pages.
Phase 3, Plan 03: Execute `03-wsjf-ranking-display-PLAN.md` — WSJF Ranking tab on planning show page.

## Key Decisions (Accumulated)

- `Mail::queue()` used (not `Mail::send()`) — non-blocking, compatible with sync queue in tests
- `acceptFor()` uses raw `DB::table` update-check for `accepted_at` atomicity (not `forceFill`)
- New tenant owner `role='Admin'` assigned via `whereNull('role')` patch immediately after registration login
- Cashier billable model is `Tenant` (not `User`) — `Cashier::useCustomerModel(Tenant::class)` in AppServiceProvider
- CSRF exclusion for `stripe/*` registered in bootstrap/app.php

## Open Questions / Blockers

- PHP binary broken on host (libicu version mismatch) — runtime verification done with PHP 8.3 (`/opt/homebrew/opt/php@8.3/bin/php`)
- Stripe API keys not yet configured (needed for Plan 02)

## Session Notes

_Add notes here during active work sessions._

---
*Last updated: 2026-03-01 after Phase 3 planning complete — 3 plans ready to execute*
