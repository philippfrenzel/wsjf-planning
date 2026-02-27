---
phase: 01-tenant-invitations-role-enforcement
plan: 03
type: execute
wave: 2
depends_on: [01-PLAN-role-foundation]
files_modified:
  - app/Http/Middleware/RequireRole.php
  - bootstrap/app.php
  - routes/web.php
  - app/Http/Controllers/PlanningController.php
autonomous: true
requirements: [ROLE-03, ROLE-07]

must_haves:
  truths:
    - "Routes gated with middleware('role:Admin') return 403 for Voter and Planner users"
    - "Routes gated with middleware('role:Admin') are accessible to Admin users"
    - "SuperAdmin users pass the role:Admin middleware check without a tenant role"
    - "plannings.admin and plannings.set-creator routes require Admin role via middleware (not inline check)"
    - "The inline roles()->where('name','admin') checks in PlanningController are removed"
    - "The /admin/users route requires at minimum an Admin or SuperAdmin role"
  artifacts:
    - app/Http/Middleware/RequireRole.php
    - bootstrap/app.php (with 'role' alias)
    - routes/web.php (admin routes inside role:Admin group)
    - app/Http/Controllers/PlanningController.php (inline checks removed)
  key_links:
    - "bootstrap/app.php $middleware->alias(['role' => RequireRole::class]) → enables middleware('role:Admin') syntax in routes"
    - "RequireRole::handle() calls $user->isSuperAdmin() (from Plan 01) before checking tenant role"
    - "RequireRole reads $user->current_tenant_id to determine which tenant's role to check"
---

<objective>
Create the RequireRole middleware and apply it to all admin-only routes, replacing inconsistent inline role checks.

Purpose: ROLE-03 and ROLE-07 — tenant management routes and existing adminPlannings/setCreator routes must be gated by role, not ad-hoc controller checks. This plan creates the single enforcement point.

Output: RequireRole middleware registered as 'role' alias, routes/web.php updated with role:Admin groups, inline checks removed from PlanningController.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Key code the executor needs from Plan 01 output and existing files. -->

From app/Models/User.php (added in Plan 01):
```php
public function isSuperAdmin(): bool
{
    return once(fn() => $this->roles()->where('name', 'SuperAdmin')->exists());
}

public function hasRoleInTenant(string $role, ?int $tenantId): bool
{
    if (!$tenantId) return false;
    return DB::table('tenant_user')
        ->where('tenant_id', $tenantId)
        ->where('user_id', $this->id)
        ->where('role', $role)
        ->exists();
}
```

From bootstrap/app.php (current shape — add alias inside withMiddleware):
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
    $middleware->web(append: [
        \App\Http\Middleware\HandleInertiaRequests::class,
        \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
    ]);
    // ADD: $middleware->alias([...]) here
})
```

From routes/web.php (current admin routes — NOT in a role group):
```php
Route::get('plannings/admin', [PlanningController::class, 'adminPlannings'])->name('plannings.admin');
Route::post('plannings/{planning}/set-creator', [PlanningController::class, 'setCreator'])->name('plannings.set-creator');
Route::get('/admin/users', [UserController::class, 'index'])->name('users.index');
```

From app/Http/Controllers/PlanningController.php (inline checks to REMOVE):
```php
// These inline checks must be deleted and replaced by middleware:
if (!Auth::user()->roles()->where('name', 'admin')->exists()) {
    abort(403);
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RequireRole middleware and register as 'role' alias</name>
  <files>app/Http/Middleware/RequireRole.php, bootstrap/app.php</files>
  <action>
**Create app/Http/Middleware/RequireRole.php:**

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthenticated.');
        }

        // SuperAdmin bypasses all role checks (ROLE-02)
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $tenantId = $user->current_tenant_id;

        foreach ($roles as $role) {
            if ($user->hasRoleInTenant($role, $tenantId)) {
                return $next($request);
            }
        }

        abort(403, 'Insufficient role for this action.');
    }
}
```

**In bootstrap/app.php** — inside the `->withMiddleware(function (Middleware $middleware) {` closure, add the alias registration AFTER the existing `$middleware->web(append: [...])` block:

```php
$middleware->alias([
    'role' => \App\Http\Middleware\RequireRole::class,
]);
```

Do not remove any existing middleware configuration — only append the alias() call.
  </action>
  <verify>
    <automated>php -l app/Http/Middleware/RequireRole.php && php artisan route:list 2>&1 | head -5</automated>
  </verify>
  <done>RequireRole.php parses without error. `php artisan route:list` runs without errors (confirms bootstrap/app.php is valid). The 'role' alias is registered.</done>
</task>

<task type="auto">
  <name>Task 2: Gate admin routes behind role:Admin + remove inline PlanningController checks</name>
  <files>routes/web.php, app/Http/Controllers/PlanningController.php</files>
  <action>
**In routes/web.php:**

1. Find the existing lines for `plannings.admin` and `plannings.set-creator` routes. Remove them from their current location.

2. Add a new route group with `role:Admin` middleware containing those two routes:

```php
Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::get('plannings/admin', [\App\Http\Controllers\PlanningController::class, 'adminPlannings'])->name('plannings.admin');
    Route::post('plannings/{planning}/set-creator', [\App\Http\Controllers\PlanningController::class, 'setCreator'])->name('plannings.set-creator');
});
```

If the original routes were already inside an `auth`/`verified` group, move just the two routes OUT of that group and into the new `role:Admin` group to avoid duplicated middleware. Use whichever import style (use or FQCN) is consistent with the rest of the file.

3. Find the `/admin/users` route:
```php
Route::get('/admin/users', [UserController::class, 'index'])->name('users.index');
```
Add `role:Admin` middleware to this route (it lists all users and must be Admin-gated):
```php
Route::get('/admin/users', [UserController::class, 'index'])->name('users.index')->middleware(['auth', 'role:Admin']);
```

**In app/Http/Controllers/PlanningController.php:**

Search for all occurrences of inline role checks like:
```php
if (!Auth::user()->roles()->where('name', 'admin')->exists()) {
    abort(403);
}
```
or similar patterns checking for 'admin' role inline. Delete these checks entirely — the route middleware now handles this. Do not replace them with anything; just remove the if-block.

Verify the `adminPlannings()` and `setCreator()` methods still function correctly after removing the inline guard.
  </action>
  <verify>
    <automated>php artisan route:list --name=plannings.admin 2>&1 | grep "role:Admin" && php -l app/Http/Controllers/PlanningController.php</automated>
  </verify>
  <done>`php artisan route:list --name=plannings.admin` shows the route with role:Admin middleware. PlanningController parses without error. No inline `roles()->where('name', 'admin')` checks remain in PlanningController.</done>
</task>

</tasks>

<verification>
```bash
# Confirm the role alias is registered and routes are protected
php artisan route:list --middleware=role:Admin 2>&1

# Confirm no inline admin checks remain in PlanningController
grep -n "roles()->where" app/Http/Controllers/PlanningController.php && echo "FOUND (should be empty)" || echo "Clean — no inline checks"

# Run tests
php artisan test --stop-on-failure 2>&1 | tail -20
```
</verification>

<success_criteria>
- RequireRole middleware exists and parses correctly
- 'role' middleware alias is registered in bootstrap/app.php
- plannings.admin and plannings.set-creator routes have role:Admin middleware
- /admin/users route has role:Admin middleware
- No inline `roles()->where('name', 'admin')` checks remain in PlanningController
- All pre-existing tests pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-tenant-invitations-role-enforcement/01-03-SUMMARY.md` with what was built, files modified, and any deviations from the plan.
</output>
