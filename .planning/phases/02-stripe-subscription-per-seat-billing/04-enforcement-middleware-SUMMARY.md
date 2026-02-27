---
phase: 02-stripe-subscription-per-seat-billing
plan: 04
subsystem: auth
tags: [laravel, middleware, cashier, stripe, subscription]

# Dependency graph
requires:
  - phase: 02-stripe-subscription-per-seat-billing/01-cashier-foundation
    provides: Tenant billable model, subscribed()/onGenericTrial()/onGracePeriod() Cashier methods
  - phase: 01-tenant-invitations-role-enforcement/01-role-foundation
    provides: User::isSuperAdmin() helper used for SuperAdmin bypass

provides:
  - RequireSubscription middleware: blocks non-subscribed/non-trial tenants from core routes
  - SuperAdmin bypass (ENF-02): isSuperAdmin() short-circuits before billing check
  - Grace period honoring (BILL-07): onGracePeriod() allows canceled-but-not-expired tenants through
  - JSON API support: returns 402 for API consumers, redirect for browser requests
  - 'subscribed' middleware alias registered globally in bootstrap/app.php
  - Core routes (plannings, projects, features, votes, commitments, estimations) gated with subscribed middleware
  - Billing, auth, tenant management routes remain ungated

affects: [03-wsjf-formula, 04-planning-ux, any phase adding new core feature routes]

# Tech tracking
tech-stack:
  added: []
  patterns: [Laravel middleware alias, grouped route middleware, Cashier subscription status checks]

key-files:
  created:
    - app/Http/Middleware/RequireSubscription.php
  modified:
    - bootstrap/app.php
    - routes/web.php

key-decisions:
  - "SuperAdmin bypass happens before tenant/subscription check — no interaction with billing state"
  - "Grace period check uses $tenant->subscription('default')?->onGracePeriod() with null-safe operator"
  - "Admin routes also include 'subscribed' middleware — SuperAdmin bypass handles admin-level global access"
  - "Consolidated previously scattered route groups into single ['auth', 'verified', 'subscribed'] group"

patterns-established:
  - "Subscription gate: subscribed('default') OR onGenericTrial() OR subscription->onGracePeriod()"
  - "denyAccess(): HTML → redirect to billing.index with upgrade_prompt session; JSON → 402"

requirements-completed: [BILL-07, ENF-01, ENF-02]

# Metrics
duration: 15min
completed: 2026-02-28
---

# Phase 2 Plan 04: Enforcement Middleware Summary

**RequireSubscription middleware gates core routes — trial/subscribed/grace-period pass, inactive tenants redirect to billing with upgrade prompt; SuperAdmin bypasses all billing checks**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-28
- **Completed:** 2026-02-28
- **Tasks:** 2 auto (Task 3 is human-verify checkpoint)
- **Files modified:** 3

## Accomplishments
- Created `RequireSubscription` middleware enforcing ENF-01/ENF-02/BILL-07
- Registered `'subscribed'` alias globally in `bootstrap/app.php`
- Consolidated core feature routes into single `['auth', 'verified', 'subscribed']` group; billing/tenants/auth routes remain ungated

## Task Commits

1. **Task 1: Create RequireSubscription middleware + register alias** - `02159aa` (feat)
2. **Task 2: Apply 'subscribed' middleware to core feature routes** - `c1ac8ab` (feat)
3. **Task 3: Human verify — subscription enforcement works end-to-end** - checkpoint (manual)

## Files Created/Modified
- `app/Http/Middleware/RequireSubscription.php` - Subscription enforcement middleware with SuperAdmin bypass, trial/grace-period allowance, HTML redirect and JSON 402 responses
- `bootstrap/app.php` - Added `'subscribed' => RequireSubscription::class` alias
- `routes/web.php` - Consolidated core routes into subscribed group; admin group also gets subscribed; billing/tenants/auth remain ungated

## Decisions Made
- Admin routes (`role:Admin` group) also get 'subscribed' middleware — SuperAdmin bypasses RequireSubscription before the role check, so no conflict; regular admins need an active subscription
- Comments routes left in plain `auth+verified` group (not in plan's enumerated core routes)
- Null-safe `?->onGracePeriod()` on subscription to handle tenants with no subscription record

## Deviations from Plan
None — plan executed exactly as written. Route consolidation followed plan's recommended strategy.

## Issues Encountered
None. Pre-existing test failures (NOT NULL on `projects.start_date`) are unrelated to this plan.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Enforcement layer complete: trial → subscribed → grace-period all honored; inactive tenants blocked
- Task 3 (human-verify) requires manual browser testing to confirm end-to-end redirect behavior
- Phase 2 subscription enforcement requirements (ENF-01, ENF-02, BILL-07) are fulfilled
- Ready to proceed to any remaining Phase 2 plans or Phase 3

---
*Phase: 02-stripe-subscription-per-seat-billing*
*Completed: 2026-02-28*
