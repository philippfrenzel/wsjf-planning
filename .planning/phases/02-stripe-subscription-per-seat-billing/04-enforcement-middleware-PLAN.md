---
phase: 02-stripe-subscription-per-seat-billing
plan: 04
type: execute
wave: 3
depends_on: [02-billing-controller-ui-PLAN.md, 03-seat-sync-webhooks-PLAN.md]
files_modified:
  - app/Http/Middleware/RequireSubscription.php
  - bootstrap/app.php
  - routes/web.php
autonomous: true
requirements: [BILL-07, ENF-01, ENF-02]

must_haves:
  truths:
    - "RequireSubscription middleware exists and blocks tenants with no active subscription or trial"
    - "SuperAdmin users bypass subscription enforcement (ENF-02)"
    - "Tenants on generic trial (onGenericTrial()) are allowed through (BILL-03 trial must work)"
    - "Tenants on grace period after cancellation (onGracePeriod()) are allowed through (BILL-07 grace period)"
    - "Blocked requests redirect to billing.index with upgrade_prompt=true for HTML, return 402 JSON for API"
    - "'subscribed' middleware alias is registered in bootstrap/app.php"
    - "Core feature routes (plannings, projects, features) are behind 'subscribed' middleware"
    - "Billing routes are NOT behind 'subscribed' middleware (prevents redirect loop)"
    - "Auth routes (login, register) are NOT behind 'subscribed' middleware"
  artifacts:
    - app/Http/Middleware/RequireSubscription.php
    - bootstrap/app.php (with 'subscribed' alias)
    - routes/web.php (with subscribed middleware applied to core routes)
  key_links:
    - "RequireSubscription uses $user->isSuperAdmin() from Phase 1 User helper — exempt from all billing checks"
    - "Allowed states: subscribed('default') OR onGenericTrial() OR subscription->onGracePeriod()"
    - "Billing page (billing.index) must NOT be gated — it is the redirect destination"
    - "Grace period: Cashier sets ends_at when subscription is canceled; onGracePeriod() returns true until expiry"
---

<objective>
Create the RequireSubscription middleware, register it as 'subscribed' alias, and apply it to core feature routes so that tenants with lapsed subscriptions are redirected to the billing page with an upgrade prompt.

Purpose: This is the enforcement layer (BILL-07, ENF-01, ENF-02). Tenants that have neither an active subscription nor a valid trial are blocked from creating/viewing plannings, projects, and features. SuperAdmin bypasses all enforcement. Grace period (post-cancellation) is honored.

Output: RequireSubscription middleware applied to core routes. Blocked tenants see upgrade prompt on billing page.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/02-stripe-subscription-per-seat-billing/02-RESEARCH.md

<interfaces>
<!-- Key interfaces available post-Plans 01-03 -->

Cashier subscription status methods on Tenant:
```php
$tenant->subscribed('default')                           // active or on grace period
$tenant->onGenericTrial()                                // trial_ends_at set, no subscription
$tenant->onTrial()                                       // either type of trial
$tenant->subscription('default')?->onGracePeriod()      // canceled but ends_at not yet passed
```

User helpers from Phase 1:
```php
$user->isSuperAdmin()           // true if global SuperAdmin role — bypasses all enforcement
$user->currentTenant            // BelongsTo Tenant via current_tenant_id (Eloquent relationship)
```

Current route groups in routes/web.php that need 'subscribed' applied:
- `Route::resource('projects', ...)` — no middleware currently
- `Route::resource('plannings', ...)->middleware(['auth', 'verified'])`
- `Route::resource('features', ...)` — no middleware currently
- `Route::resource('estimations', ...)` — inside auth+verified group
- `Route::resource('estimation-components', ...)` — inside auth+verified group
- `Route::resource('commitments', ...)` (via Route::resources) — inside auth+verified group
- Votes routes — inside auth+verified group

Existing middleware alias in bootstrap/app.php:
```php
$middleware->alias([
    'role' => \App\Http\Middleware\RequireRole::class,
]);
```

Billing routes that MUST NOT be gated (redirect destination):
- billing.index, billing.checkout, billing.success, billing.portal
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RequireSubscription middleware + register alias</name>
  <files>
    app/Http/Middleware/RequireSubscription.php
    bootstrap/app.php
  </files>
  <action>
**Create app/Http/Middleware/RequireSubscription.php:**

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // SuperAdmin is exempt from all billing enforcement (ENF-02)
        if ($user?->isSuperAdmin()) {
            return $next($request);
        }

        $tenant = $user?->currentTenant;

        // No tenant: cannot have a subscription — block
        if ($tenant === null) {
            return $this->denyAccess($request);
        }

        // Allow if: active subscription, generic trial, or on grace period after cancellation
        $allowed = $tenant->subscribed('default')
            || $tenant->onGenericTrial()
            || ($tenant->subscription('default')?->onGracePeriod() ?? false);

        if ($allowed) {
            return $next($request);
        }

        return $this->denyAccess($request);
    }

    private function denyAccess(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => 'An active subscription is required.'], 402);
        }

        return redirect()->route('billing.index')
            ->with('upgrade_prompt', true);
    }
}
```

**Register 'subscribed' alias in bootstrap/app.php:**
Find the existing `$middleware->alias([...])` block and add the new alias:

```php
$middleware->alias([
    'role'       => \App\Http\Middleware\RequireRole::class,
    'subscribed' => \App\Http\Middleware\RequireSubscription::class,
]);
```
  </action>
  <verify>
    <automated>php -l app/Http/Middleware/RequireSubscription.php && php artisan route:list 2>&1 | head -5</automated>
  </verify>
  <done>
    - RequireSubscription.php parses without PHP errors
    - Middleware has SuperAdmin bypass using $user->isSuperAdmin()
    - Middleware allows: subscribed, onGenericTrial, onGracePeriod
    - Denied HTML requests redirect to billing.index with upgrade_prompt session
    - Denied JSON requests return 402
    - 'subscribed' alias is registered in bootstrap/app.php
  </done>
</task>

<task type="auto">
  <name>Task 2: Apply 'subscribed' middleware to core feature routes</name>
  <files>routes/web.php</files>
  <action>
Apply `subscribed` middleware to core feature routes in routes/web.php. The goal is to wrap the routes that provide core product value (plannings, projects, features, estimations, votes, commitments) with subscription enforcement.

**Strategy:** Wrap the core routes in a new group or add 'subscribed' to existing groups. The cleanest approach is to add a wrapping group:

Find the section in routes/web.php where these routes are defined (currently around lines 50-115). Wrap them in a subscription-enforced group:

```php
// Core feature routes — require active subscription or trial
Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('votes/session', function () { /* ... */ });
    Route::get('votes/session/{planning}', [VoteController::class, 'voteSession'])->name('votes.session');
    Route::post('votes/session/{planning}', [VoteController::class, 'voteSessionStore'])->name('votes.session.store');
    Route::get('votes/card-session/{planning}', [VoteController::class, 'cardVoteSession'])->name('votes.card-session');

    Route::resource('estimation-components', EstimationComponentController::class);
    Route::resource('estimations', EstimationController::class);
    Route::put('estimation-components/{id}/archive', [EstimationComponentController::class, 'archive'])->name('estimation-components.archive');
    Route::put('estimation-components/{id}/activate', [EstimationComponentController::class, 'activate'])->name('estimation-components.activate');

    Route::resource('projects', ProjectController::class);
    Route::resource('plannings', PlanningController::class);
    Route::get('features/board', [FeatureController::class, 'board'])->name('features.board');
    Route::post('features/{feature}/status', [FeatureController::class, 'updateStatus'])->name('features.status.update');
    Route::get('features/lineage', [FeatureController::class, 'lineage'])->name('features.lineage');
    Route::resource('features', FeatureController::class);
    Route::get('api/features/state-history', [FeatureStateHistoryController::class, 'index'])->name('api.features.state-history');
    Route::post('features/{feature}/dependencies', [FeatureDependencyController::class, 'store'])->name('features.dependencies.store');
    Route::delete('features/{feature}/dependencies/{dependency}', [FeatureDependencyController::class, 'destroy'])->name('features.dependencies.destroy');
    Route::get('projects/{project}/features/import', [FeatureImportController::class, 'create'])->name('projects.features.import');
    Route::post('projects/{project}/features/import', [FeatureImportController::class, 'store'])->name('projects.features.import.store');
    Route::resources([
        'commitments' => CommitmentController::class,
    ]);
    Route::get('plannings/{planning}/commitments', [CommitmentController::class, 'planningCommitments'])->name('plannings.commitments');
    Route::post('api/planning-features', [CommitmentController::class, 'getFeaturesForPlanning'])->name('api.planning-features');
    Route::post('plannings/{planning}/recalculate-commonvotes', [PlanningController::class, 'recalculateCommonVotes'])->name('plannings.recalculate-commonvotes');
});
```

**Do NOT add 'subscribed' to these routes:**
- Auth routes (login, register, password reset)
- `GET /` (welcome page) and `/impressum`
- `GET tenants` (tenants.index) — users need to reach their tenant management
- `POST tenants/{tenant}/switch` — tenant switching
- `POST tenants/accept` — invitation acceptance (needed to join before subscribing)
- `GET /billing*` routes — the billing page itself is the redirect target
- Admin-only routes group (`plannings.admin`, `plannings.set-creator`, tenant management) — these are already behind `role:Admin`; the SuperAdmin bypass in RequireSubscription handles admin-level access

**Important:** After consolidating into the new group, remove any duplicate standalone middleware declarations (e.g., `->middleware(['auth', 'verified'])` on individual resource routes that are now inside the group) to avoid redundant middleware chains. But be careful — only remove duplicates that are now covered by the outer group. Verify with `php artisan route:list` that no routes lose their auth middleware.

Also add 'subscribed' to the admin route group:
```php
Route::middleware(['auth', 'verified', 'role:Admin', 'subscribed'])->group(function () {
    Route::get('plannings/admin', ...)->name('plannings.admin');
    // ...other admin routes...
});
```
(SuperAdmin bypasses RequireSubscription before the subscribed check runs, so no conflict with admin-level SuperAdmin access.)
  </action>
  <verify>
    <automated>php artisan route:list --columns=uri,middleware 2>&1 | grep -E "plannings|projects|features" | head -20</automated>
  </verify>
  <done>
    - `php artisan route:list` shows plannings, projects, features routes have 'subscribed' in middleware column
    - billing.index, tenants.index, tenants.accept do NOT have 'subscribed' middleware
    - Auth routes do NOT have 'subscribed' middleware
    - No route:list errors or duplicate route name warnings
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 3: Human verify — subscription enforcement works end-to-end</name>
  <files></files>
  <action>
Verify enforcement behavior for three scenarios:

**Scenario A — Trial tenant (new user, 14-day trial active):**
1. Register a new user → new tenant is created with trial_ends_at = 14 days from now
2. Navigate to `/plannings` → should load normally (trial is allowed through)
3. Navigate to `/billing` → should show "Free Trial (14 days left)" badge

**Scenario B — Inactive tenant (trial expired, no subscription):**
1. Temporarily set trial_ends_at to the past in tinker: `Tenant::first()->update(['trial_ends_at' => now()->subDay()])`
2. Navigate to `/plannings` → should redirect to `/billing` with upgrade prompt alert visible
3. Billing page should show "Inactive" badge and "Subscribe Now" button

**Scenario C — SuperAdmin user:**
1. Ensure a SuperAdmin user exists (role 'SuperAdmin' in role_user table)
2. As SuperAdmin, navigate to `/plannings` with expired trial → should NOT be blocked
3. SuperAdmin should see all data regardless of subscription status

**Reset after testing:**
Restore trial_ends_at: `Tenant::first()->update(['trial_ends_at' => now()->addDays(14)])`
  </action>
  <verify>
    <automated>php artisan route:list --name=billing 2>&1 && php artisan route:list --name=plannings.index 2>&1 | grep subscribed</automated>
  </verify>
  <done>Trial tenants access core features. Inactive tenants are redirected to billing page with upgrade prompt. SuperAdmin bypasses enforcement. Billing page itself is always accessible.</done>
</task>

</tasks>

<verification>
```bash
php artisan test --stop-on-failure 2>&1 | tail -20
php artisan route:list 2>&1 | grep -E "ERROR|error" || echo "Route list OK"
```
All pre-existing tests pass. Route list generates without errors.
</verification>

<success_criteria>
- RequireSubscription middleware enforces: block if not (subscribed OR onGenericTrial OR onGracePeriod)
- SuperAdmin bypasses via $user->isSuperAdmin() — ENF-02 fulfilled
- Blocked HTML requests redirect to billing.index with upgrade_prompt in session — ENF-01 fulfilled
- Blocked JSON requests return 402 — ENF-01 fulfilled for API consumers
- Grace period after cancellation: tenants on grace period still access features — BILL-07 fulfilled
- Core routes (plannings, projects, features, votes, commitments) gated behind 'subscribed'
- Billing, auth, tenant management routes remain ungated
- 'subscribed' alias registered in bootstrap/app.php
</success_criteria>

<output>
After completion, create `.planning/phases/02-stripe-subscription-per-seat-billing/04-enforcement-middleware-SUMMARY.md` with what was built, files modified, and any deviations.

Then update `.planning/STATE.md` to reflect Phase 2 complete (or in-checkpoint state) and update `.planning/ROADMAP.md` Phase 2 progress checkboxes.
</output>
