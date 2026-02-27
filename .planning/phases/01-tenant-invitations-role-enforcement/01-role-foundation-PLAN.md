---
phase: 01-tenant-invitations-role-enforcement
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - database/migrations/2026_02_27_000001_seed_roles_and_backfill_tenant_roles.php
  - app/Models/User.php
  - app/Models/Scopes/TenantScope.php
  - app/Providers/AuthServiceProvider.php
autonomous: true
requirements: [ROLE-01, ROLE-02]

must_haves:
  truths:
    - "SuperAdmin role exists in the roles table and can be assigned to a user"
    - "Tenant owners have role='Admin' in the tenant_user pivot (backfilled)"
    - "User::isSuperAdmin() returns true iff the user has the 'SuperAdmin' global role"
    - "User::hasRoleInTenant('Admin', $tenantId) returns true for tenant owners after backfill"
    - "SuperAdmin users bypass all Gate policy checks (Gate::before returns true)"
    - "SuperAdmin users bypass TenantScope filtering and see data across all tenants"
  artifacts:
    - database/migrations/2026_02_27_000001_seed_roles_and_backfill_tenant_roles.php
    - app/Models/User.php (with isSuperAdmin, hasRoleInTenant, currentTenantRole methods)
    - app/Models/Scopes/TenantScope.php (with SuperAdmin bypass)
    - app/Providers/AuthServiceProvider.php (with Gate::before callback)
  key_links:
    - "User::isSuperAdmin() queries role_user join roles WHERE name='SuperAdmin' — used by Gate::before and RequireRole middleware"
    - "User::hasRoleInTenant() queries tenant_user WHERE tenant_id + user_id + role — used by all policies and RequireRole"
    - "Gate::before() returns true (not false) for SuperAdmin; returns implicit null for everyone else"
    - "TenantScope::apply() returns early (no filter) when user isSuperAdmin()"
---

<objective>
Establish the role data foundation and authorization helpers that all subsequent plans depend on.

Purpose: Every downstream plan (middleware, policies, UI) calls User::isSuperAdmin() and User::hasRoleInTenant(). These must exist before anything else is built. The migration seeds the four canonical role names and backfills existing tenant owners to 'Admin'.

Output: Migration file, three User helper methods, TenantScope SuperAdmin bypass, Gate::before() SuperAdmin exemption.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Key signatures the executor needs. -->

From app/Models/User.php (current state):
```php
class User extends Authenticatable
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class); // global roles table via role_user pivot
    }

    public function tenants(): EloquentBelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_user')->withTimestamps();
    }

    public function currentTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'current_tenant_id');
    }
}
```

From app/Models/Scopes/TenantScope.php (current apply() shape):
```php
public function apply(Builder $builder, Model $model): void
{
    // currently always applies tenant_id filter — must add SuperAdmin bypass
}
```

From app/Providers/AuthServiceProvider.php (current shape):
```php
public function boot(): void
{
    $this->registerPolicies();
    // Gate::before() does NOT exist yet — must be added
}
```

DB schema facts (no new columns needed):
- roles table: id, name, created_at, updated_at — needs 'SuperAdmin','Admin','Planner','Voter' rows seeded
- role_user: user_id, role_id — SuperAdmin global role only
- tenant_user: tenant_id, user_id, role (nullable string) — needs backfill for owners to 'Admin'
- tenants: id, owner_user_id — used for backfill query
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migration — seed role names and backfill tenant owner roles</name>
  <files>database/migrations/2026_02_27_000001_seed_roles_and_backfill_tenant_roles.php</files>
  <action>
Create a standard Laravel migration file. In `up()`:

1. Seed the four canonical role names into the `roles` table using `insertOrIgnore` to make it idempotent:
   - Names: 'SuperAdmin', 'Admin', 'Planner', 'Voter'
   - Include created_at/updated_at = now()

2. Backfill tenant owners to 'Admin' role in `tenant_user` pivot:
   - Query all rows from `tenants` where `owner_user_id` IS NOT NULL, get id + owner_user_id
   - For each: UPDATE `tenant_user` SET role = 'Admin' WHERE tenant_id = $tenant->id AND user_id = $tenant->owner_user_id AND role IS NULL
   - Only update NULL roles — do not overwrite manually assigned roles

In `down()`: no-op (data migrations don't reverse cleanly; just leave it).

Also: check if there is a migration that adds `deleted_at`/`deleted_by` columns to `tenant_invitations`. If none exists (search `database/migrations/` for files containing `tenant_invitations` and `deleted_at`), add a second `up()` statement that adds `softDeletesWithUser()` columns to `tenant_invitations` so the `SoftDeletesWithUser` trait works correctly. If a migration already adds these columns, skip this step.
  </action>
  <verify>
    <automated>php artisan migrate --pretend 2>&1 | grep -E "seed_roles|backfill" && php artisan migrate 2>&1 | grep -v "Nothing to migrate"</automated>
  </verify>
  <done>Migration runs without error. `php artisan tinker --execute="DB::table('roles')->pluck('name');"` returns a collection containing 'SuperAdmin', 'Admin', 'Planner', 'Voter'.</done>
</task>

<task type="auto">
  <name>Task 2: User helpers — isSuperAdmin, hasRoleInTenant, currentTenantRole</name>
  <files>app/Models/User.php</files>
  <action>
Add three public methods to the `User` model. Place them after the existing `currentTenant()` relationship method.

```php
public function isSuperAdmin(): bool
{
    return once(fn() => $this->roles()->where('name', 'SuperAdmin')->exists());
}

public function hasRoleInTenant(string $role, ?int $tenantId): bool
{
    if (!$tenantId) {
        return false;
    }
    return DB::table('tenant_user')
        ->where('tenant_id', $tenantId)
        ->where('user_id', $this->id)
        ->where('role', $role)
        ->exists();
}

public function currentTenantRole(): ?string
{
    $tenantId = $this->current_tenant_id;
    if (!$tenantId) {
        return null;
    }
    return DB::table('tenant_user')
        ->where('tenant_id', $tenantId)
        ->where('user_id', $this->id)
        ->value('role');
}
```

Add `use Illuminate\Support\Facades\DB;` to the imports if not already present.

The `once()` helper (Laravel 11+) memoizes `isSuperAdmin()` per request, preventing N+1 when middleware calls it on every request.

Do NOT remove or modify any existing methods.
  </action>
  <verify>
    <automated>php artisan tinker --execute="echo app(App\Models\User::class)->isSuperAdmin();" 2>&1 | grep -v "^>" ; php -l app/Models/User.php</automated>
  </verify>
  <done>User.php parses without errors. The three methods exist and are callable. `isSuperAdmin()` returns false for a freshly instantiated User (no roles attached).</done>
</task>

<task type="auto">
  <name>Task 3: Gate::before SuperAdmin bypass + TenantScope bypass</name>
  <files>app/Providers/AuthServiceProvider.php, app/Models/Scopes/TenantScope.php</files>
  <action>
**In app/Providers/AuthServiceProvider.php** — add `Gate::before()` inside the `boot()` method, after `$this->registerPolicies()`:

```php
Gate::before(function (\App\Models\User $user, string $ability): ?bool {
    if ($user->isSuperAdmin()) {
        return true; // SuperAdmin bypasses all policy checks
    }
    return null; // null = let policy decide normally
});
```

Add `use Illuminate\Support\Facades\Gate;` if not already imported. Return type MUST be `?bool` — returning `null` (not `false`) for non-SuperAdmin users is critical; returning `false` would deny everyone.

**In app/Models/Scopes/TenantScope.php** — in the `apply()` method, add a SuperAdmin early return at the top of the method body, before any existing tenant filter logic:

```php
$user = Auth::user();
if ($user && $user->isSuperAdmin()) {
    return; // SuperAdmin sees data across all tenants — no filter applied
}
```

Add `use Illuminate\Support\Facades\Auth;` if not already imported. Place the SuperAdmin check before any existing `whereRaw('1 = 0')` or tenant_id filter statements.
  </action>
  <verify>
    <automated>php -l app/Providers/AuthServiceProvider.php && php -l app/Models/Scopes/TenantScope.php</automated>
  </verify>
  <done>Both files parse without errors. AuthServiceProvider::boot() contains Gate::before() with ?bool return. TenantScope::apply() contains isSuperAdmin() check before tenant filter.</done>
</task>

</tasks>

<verification>
Run the full PHPUnit test suite to confirm no regressions:
```
php artisan test --stop-on-failure 2>&1 | tail -20
```
All pre-existing tests must pass. If the backfill migration fails on a fresh DB (no tenant rows), that is acceptable — the migration uses a loop that simply runs 0 iterations.
</verification>

<success_criteria>
- Migration executes cleanly on a fresh and existing DB
- `roles` table contains all four role names
- Existing tenant owners have `tenant_user.role = 'Admin'` (backfilled)
- `User::isSuperAdmin()`, `User::hasRoleInTenant()`, `User::currentTenantRole()` are callable
- `Gate::before()` is registered — verified by `php artisan tinker` Gate::inspect call
- `TenantScope::apply()` has SuperAdmin bypass before any tenant filter
</success_criteria>

<output>
After completion, create `.planning/phases/01-tenant-invitations-role-enforcement/01-01-SUMMARY.md` with what was built, files modified, and any deviations from the plan.
</output>
