# STATE.md — WSJF Planning Tool

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-27)

**Core value:** Teams can run a complete WSJF planning session without friction, in a single sitting.
**Current focus:** Phase 5 — Foundation & Phase 4 Completion (v3.0 milestone)

## Current Status

**Phase:** Phase 5 — Foundation & Phase 4 Completion
**Plan:** Plan 01 complete → Plan 02 next
**Status:** Plan 01 executed — ready for Plan 02
**Milestone:** v3.0 (Polish & UX)
**Last activity:** 2026-02-28 — Phase 5 Plan 01: Foundation Infrastructure complete

## What Was Just Done

- **Phase 5, Plan 01: Foundation Infrastructure** (2026-02-28) — FOUND-01→04 complete
  - Installed `sonner` npm + 3 shadcn components (sonner.tsx, alert-dialog.tsx, progress.tsx)
  - Fixed NProgress duplication in `app.tsx`: removed `progress:` key from `createInertiaApp`
  - Wired flash→toast pipeline: `HandleInertiaRequests::share()` flash key → `SharedData.flash` type → `useFlashToast` hook
  - Mounted `<Toaster position="bottom-right" richColors />` and `<ConfirmDialogProvider>` in `app-header-layout.tsx`
  - Removed ad-hoc `props.success` Dialog modals from `votes/session.tsx` and `votes/card-session.tsx`
  - Restored custom button variants (success, info, cancel) after shadcn CLI overwrite

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

Phase 5, Plan 02: Deliver Phase 4 UX features — one-click session start (UX-01), vote progress indicator (UX-03), CSV export verification (UX-04).

## Key Decisions (Accumulated)

- `Mail::queue()` used (not `Mail::send()`) — non-blocking, compatible with sync queue in tests
- `acceptFor()` uses raw `DB::table` update-check for `accepted_at` atomicity (not `forceFill`)
- New tenant owner `role='Admin'` assigned via `whereNull('role')` patch immediately after registration login
- Cashier billable model is `Tenant` (not `User`) — `Cashier::useCustomerModel(Tenant::class)` in AppServiceProvider
- CSRF exclusion for `stripe/*` registered in bootstrap/app.php
- **[05-01]** Toaster placed outside AppShell but inside ConfirmDialogProvider — sibling pattern avoids z-index issues
- **[05-01]** Lazy closures in HandleInertiaRequests flash share() ensure session read at response time (not middleware boot)
- **[05-01]** useFlashToast called once at layout level only — prevents duplicate toast firing on page component re-renders

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
