# STATE.md — WSJF Planning Tool

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-27)

**Core value:** Teams can run a complete WSJF planning session without friction, in a single sitting.
**Current focus:** Phase 7 — Empty States & Visual Polish (v3.0 milestone)

## Current Status

**Phase:** Phase 7 — Empty States & Visual Polish
**Plan:** Plan 04 complete → Phase 7 complete
**Status:** Milestone complete
**Milestone:** v3.0 (Polish & UX)
**Last activity:** 2026-03-01 — Phase 7 complete (Plans 07-01 through 07-04): shared EmptyState rollout, autosave icon polish, and board card loading overlay

## What Was Just Done

- **Phase 7 complete (2026-03-01) — Empty States & Visual Polish** (POLISH-01, POLISH-02, POLISH-03, POLISH-04)
  - Added shared `EmptyState` component (`resources/js/components/empty-state.tsx`) with icon/title/description + CTA (`href`/`onClick`) contract
  - Added route-keyed fade animation wrapper in `app-header-layout.tsx` (`key={url}` + `animate-in fade-in-0 duration-300`)
  - Applied true-empty vs filter-empty states to `features/index.tsx`, `plannings/index.tsx` (table+card), and `projects/index.tsx`
  - Applied empty states to `tenants/index.tsx`, `votes/index.tsx`, `votes/session.tsx`, and `votes/card-session.tsx`
  - Added autosave icon trio (`Loader2`/`CheckCircle2`/`AlertCircle`) + timed success reset in vote session pages
  - Added per-card loading overlay in `features/board.tsx` via `loadingFeatureId` during status persistence

- **Phase 6, Plan 07: Gap-Closure — Comments.tsx confirm() + Hooks isSaving + show.tsx guards** (2026-03-01) — FEED-01, FEED-02 gap-closure
  - Comments.tsx: native confirm() replaced with useConfirm() async pattern (title/description/labels)
  - useEstimationManagement.ts: confirm() guard removed; isSaving state added with setIsSaving(true/false) in handleDeleteEstimation and handleEstimationSubmit; isSaving returned
  - useComponentManagement.ts: confirm() guard removed from archiveComponent; isSaving state added in handleComponentSubmit, handleEditComponentSubmit, archiveComponent; isSaving returned
  - features/show.tsx: useConfirm imported; isSaving aliased as componentIsSaving/estimationIsSaving; handleArchiveWithConfirm + handleDeleteEstimationWithConfirm async wrappers; EstimationDialog gets processing={estimationIsSaving}; EditComponentDialog gets processing={componentIsSaving}

- **Phase 6, Plan 06: Vote session isSaving binding + Commitment InputError + plans/create useForm** (2026-03-01) — FEED-02, FEED-03 complete
  - votes/session.tsx: added `disabled={isSaving}` + LoaderCircle to both submit buttons (header + form footer)
  - votes/card-session.tsx: added `disabled={isSaving}` + LoaderCircle (icon swap) to save button
  - commitments/create.tsx: 4 raw `<p>` error elements replaced with `<InputError>` (planning_id, feature_id, commitment_type, status)
  - commitments/edit.tsx: 4 raw `<p>` error elements replaced with `<InputError>` (feature_id, user_id, commitment_type, status)
  - plans/create.tsx: `useState+router.post` → `useForm+post`; `disabled={processing}` on button; 3 InputError elements added

## Previous Completed Work

- **Phase 6, Plan 04: Projects Domain useForm Migration** (2026-03-01) — FEED-02, FEED-03 complete
  - projects/create.tsx: useState + router.post → useForm; submit button disabled={processing} + LoaderCircle; 8 InputError replacements
  - projects/edit.tsx: useState + router.put → useForm; BOTH submit buttons disabled={processing} + LoaderCircle; 9 InputError replacements

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

Phase 7 complete. Empty-state coverage and visual-save feedback polish are in place across targeted list and voting screens. Ready for next milestone/phase planning.

## Key Decisions (Accumulated)

- `Mail::queue()` used (not `Mail::send()`) — non-blocking, compatible with sync queue in tests
- `acceptFor()` uses raw `DB::table` update-check for `accepted_at` atomicity (not `forceFill`)
- New tenant owner `role='Admin'` assigned via `whereNull('role')` patch immediately after registration login
- Cashier billable model is `Tenant` (not `User`) — `Cashier::useCustomerModel(Tenant::class)` in AppServiceProvider
- CSRF exclusion for `stripe/*` registered in bootstrap/app.php
- **[06-01]** Single `const confirm = useConfirm()` per component serves all handlers — do not call useConfirm() inside individual handlers
- **[06-01]** `onBefore` in Inertia router calls is synchronous — async `confirm()` Promise is ignored; always use async onClick pattern instead
- **[06-02]** `<Link method="delete">` is incompatible with async dialogs — replaced with `<Button onClick={asyncHandler}>` + `router.delete()`
- **[06-02]** Custom Dialog + local state boilerplate for destructive confirmation replaced by single `useConfirm()` call
- **[06-04]** Save icon swapped for LoaderCircle when processing (not both simultaneously) — cleaner than showing both icons
- **[06-04]** `setData(e.target.name as keyof typeof data, value)` used in generic handleChange — type-safe useForm pattern for dynamic field name handlers
- **[06-03]** `useForm` errors used directly (not `usePage().props.errors`) — useForm manages its own error bag from server validation responses
- **[06-03]** Optional `processing?: boolean` prop on dialog components — undefined = not disabled, fully backward-compatible
- **[07-01]** Shared `EmptyState` centralizes icon/title/description/action rendering and keeps CTA behavior consistent (`href` → Link, handler → Button)
- **[07-01]** Route-keying content wrapper (`key={url}`) is the minimal way to replay page-enter animations on each Inertia navigation
- **[07-03]** Vote autosave status should be icon-first with timed success reset to avoid stale "saved" signals after subsequent edits
- **[07-04]** Board drag persistence feedback should be scoped per-card (`loadingFeatureId`) instead of blocking entire lanes or board

## Open Questions / Blockers

- **Vote completeness formula (Phase 8):** Confirm `stakeholders_count × features_count` vs. actual vote rows is the right formula given polymorphic vote types — check against DB schema before scoping Phase 8 plans
- **Onboarding persistence (Phase 9):** Decision needed — localStorage flag (simple, loses on new device) vs. DB flag (accurate cross-device); defer until Phase 8 is stable
- **Zod scope (Phase 6):** Identify which specific forms warrant Zod pre-validation vs. Inertia-only error display — only multi-step or expensive round-trip forms
- PHP binary broken on host (libicu version mismatch) — runtime verification done with PHP 8.3 (`/opt/homebrew/opt/php@8.3/bin/php`)
- Stripe API keys not yet configured (needed for billing features)

## Session Notes

_Add notes here during active work sessions._

  - **[06-06]** Vote session pages use local `isSaving` state (not `useForm`) — bind `disabled={isSaving}` directly without migration; save flow uses custom timer/navigation logic incompatible with `useForm`
  - **[06-06]** plans/create.tsx wrapped each Input in a `<div>` to allow InputError placement below each field

  - **[06-07]** Confirm guards belong at the call site (component/show.tsx), not in custom hooks — hooks run outside ConfirmDialogProvider React context and cannot call useConfirm()
  - **[06-07]** isSaving state owned by each hook alongside the router.delete/post/put calls — co-located loading state; hooks return isSaving for parent to thread to dialog processing props

---
*Last updated: 2026-03-01 after Phase 7 complete (Plans 07-01 to 07-04)*
