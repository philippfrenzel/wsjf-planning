# STATE.md — WSJF Planning Tool

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-27)

**Core value:** Teams can run a complete WSJF planning session without friction, in a single sitting.
**Current focus:** Phase 5 — Foundation & Phase 4 Completion (v3.0 milestone)

## Current Status

**Phase:** Phase 6 — Feedback Completeness
**Plan:** Plan 01 complete → Plan 02 next
**Status:** In Progress
**Milestone:** v3.0 (Polish & UX)
**Last activity:** 2026-03-01 — Phase 6 Plan 01: Confirm Dialog Migration complete

## What Was Just Done

- **Phase 6, Plan 01: Confirm Dialog Migration** (2026-03-01) — FEED-01 (partial), FEED-03 (partial) complete
  - features/index.tsx: `useConfirm` import + hook; `<form onSubmit>` delete replaced with async `<Button onClick>`
  - plannings/index.tsx: same pattern for both table-view and card-view delete buttons
  - tenants/index.tsx: `revokeInvitation` fixed (was broken `onBefore` async pitfall → now proper async onClick); `removeMember` made async; `InputError` added for email field; `errors` added to useForm destructuring

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

Phase 6, Plan 02: Remaining FEED-01 locations — projects/index.tsx (unguarded delete), commitments/index.tsx + show.tsx (Link method="delete" antipattern), DependencyManager.tsx, users/index.tsx (Dialog → useConfirm).

## Key Decisions (Accumulated)

- `Mail::queue()` used (not `Mail::send()`) — non-blocking, compatible with sync queue in tests
- `acceptFor()` uses raw `DB::table` update-check for `accepted_at` atomicity (not `forceFill`)
- New tenant owner `role='Admin'` assigned via `whereNull('role')` patch immediately after registration login
- Cashier billable model is `Tenant` (not `User`) — `Cashier::useCustomerModel(Tenant::class)` in AppServiceProvider
- CSRF exclusion for `stripe/*` registered in bootstrap/app.php
- **[06-01]** Single `const confirm = useConfirm()` per component serves all handlers — do not call useConfirm() inside individual handlers
- **[06-01]** `onBefore` in Inertia router calls is synchronous — async `confirm()` Promise is ignored; always use async onClick pattern instead

## Open Questions / Blockers

- **Vote completeness formula (Phase 8):** Confirm `stakeholders_count × features_count` vs. actual vote rows is the right formula given polymorphic vote types — check against DB schema before scoping Phase 8 plans
- **Onboarding persistence (Phase 9):** Decision needed — localStorage flag (simple, loses on new device) vs. DB flag (accurate cross-device); defer until Phase 8 is stable
- **Zod scope (Phase 6):** Identify which specific forms warrant Zod pre-validation vs. Inertia-only error display — only multi-step or expensive round-trip forms
- PHP binary broken on host (libicu version mismatch) — runtime verification done with PHP 8.3 (`/opt/homebrew/opt/php@8.3/bin/php`)
- Stripe API keys not yet configured (needed for billing features)

## Session Notes

_Add notes here during active work sessions._

---
*Last updated: 2026-02-28 after Phase 5 Plan 01: Foundation Infrastructure complete (FOUND-01→04)*
