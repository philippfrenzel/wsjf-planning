# Phase 1: Tenant Invitations & Role Enforcement — Research

**Researched:** 2026-02-27
**Domain:** Laravel multi-tenant roles, email invitations, middleware authorization
**Confidence:** HIGH — findings based on direct codebase inspection; no CONTEXT.md constraints exist

---

## Summary

The codebase already has substantial scaffolding for this phase: `TenantInvitation` model with token/expiry fields, `TenantController` with invite/revoke/accept methods, `Role` model + `role_user` pivot (global), and `tenant_user.role` string column (per-tenant). The invitation flow is ~70% complete — the critical missing pieces are email delivery, Voter-role assignment on acceptance, and handling new-user registration via invitation link.

The role-enforcement layer is entirely absent: no `RequireRole` middleware exists, no policies check roles (only tenant membership), and the `AdminPlannings`/`setCreator` routes do inline `roles()->where('name', 'admin')` checks that are inconsistent with the design intent. The architecture for roles needs a clear decision: the `role_user` pivot (global, no tenant context) already exists alongside `tenant_user.role` (per-tenant string column). These must be unified rather than operated in parallel.

**Primary recommendation:** Use `tenant_user.role` (string: 'Admin' | 'Planner' | 'Voter') for all per-tenant authorization; use the global `roles` + `role_user` tables exclusively for SuperAdmin. Add `User::hasRoleInTenant()` and `User::isSuperAdmin()` helpers. Do NOT install `spatie/laravel-permission` — the hand-rolled system matches the multi-tenant model better and is already partially wired.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INV-01 | Tenant owner/admin can invite a user by email address | `TenantController::invite()` exists; add Admin role gate + email send |
| INV-02 | Invited user receives an email with a secure, expiring invitation link | No `Mail` class exists; create `TenantInvitationMail` Mailable; token already stored in DB with `expires_at` |
| INV-03 | Invited user can accept invitation and join the tenant (existing account or register) | `accept()` + `acceptFor()` exist for existing users; register path doesn't handle invitation token — must be fixed in `RegisteredUserController` |
| INV-04 | Pending invitations are visible and cancellable by admin | `TenantController::index()` passes `invitations` to Inertia; revoke exists; UI needs Admin gate |
| INV-05 | Accepting an invitation automatically assigns the Voter role | `acceptFor()` does NOT set `tenant_user.role = 'Voter'` — must be added |
| ROLE-01 | Four roles exist and are enforced: SuperAdmin, Admin, Planner, Voter | `roles` table has names; need seeder + `tenant_user.role` enum |
| ROLE-02 | SuperAdmin can manage all tenants and users (global) | Needs `Gate::before()` in `AuthServiceProvider` + TenantScope bypass |
| ROLE-03 | Admin can manage members, roles, and invitations within their tenant | Needs `RequireRole` middleware on tenant management routes |
| ROLE-04 | Planner can create/edit/delete Plannings, Features, Projects within their tenant | Policies currently check only tenant membership; add Planner role check to create/update/delete |
| ROLE-05 | Voter can participate in voting sessions and view results; cannot manage data | VotePolicy allows any tenant member to create votes; needs `Voter OR Planner OR Admin` gate |
| ROLE-06 | Admin can change the role of any tenant member (except their own SuperAdmin flag) | New controller action needed: `TenantController::updateMemberRole()` |
| ROLE-07 | All existing admin-only routes (e.g. admin plannings) are gated on Admin role | `adminPlannings` and `setCreator` do inline `roles()->where('name','admin')` — must be replaced with middleware |
| TEN-01 | Tenant owner can view all members and their roles | `TenantController::index()` passes `members`; needs role data on each member from `tenant_user.role` |
| TEN-02 | Tenant owner/admin can remove a member from the tenant | New action needed: `TenantController::removeMember()` |
| TEN-03 | Tenant settings page shows current subscription status and seat count | Separate settings route; can stub subscription status for now |
| TEN-04 | Tenant name is editable by admin | New action: `TenantController::update()` with Admin gate |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Laravel Mail (built-in) | Laravel 12 | Sending invitation emails via Mailable classes | Already configured in `.env.example`; `MAIL_MAILER=log` in dev, `array` in tests |
| Laravel Gate / Policies (built-in) | Laravel 12 | Authorization layer | Already used via `AuthServiceProvider`; `Gate::before()` is the canonical SuperAdmin bypass |
| Laravel named middleware (built-in) | Laravel 12 | Route-level role enforcement | `bootstrap/app.php` accepts `$middleware->alias()` — no Kernel.php needed |
| PHPUnit (built-in) | ^11 | Feature tests | Already configured; `phpunit.xml` uses SQLite in-memory |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Laravel Queue (built-in) | Laravel 12 | Async email dispatch | `QUEUE_CONNECTION=database` in env; use `dispatch()` for invitation emails |
| Ziggy (already installed) | ^2.4 | Named route URLs in React/TS | Already in HandleInertiaRequests shared data |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `tenant_user.role` | `spatie/laravel-permission` | Spatie adds `model_has_roles` and `model_has_permissions` tables but doesn't understand `tenant_user` pivot natively; would require tenant-scoped team mode (spatie `teams` feature) and extra configuration. Hand-rolled is simpler given what's already built. |
| UUID token in DB (`tenant_invitations.token`) | `URL::temporarySignedRoute()` | Signed URLs don't require a DB lookup to verify but can't be revoked before expiry. DB tokens are already in place and support `revokeInvitation()`. Keep the existing approach. |
| `tenant_user.role` string | Adding `tenant_id` to `role_user` pivot | Adding `tenant_id` to `role_user` would require reworking the `User::roles()` relationship and all downstream consumers. Using `tenant_user.role` is simpler and already structured for it. |

**Installation:** None required. All dependencies are already installed.

---

## Architecture Patterns

### Role Storage Architecture

Two role systems coexist in the DB — they must NOT be used interchangeably:

```
roles + role_user (global)
└── SuperAdmin only — "Does this user have a global role?"
    └── User::isSuperAdmin() → roles()->where('name', 'SuperAdmin')->exists()

tenant_user.role (per-tenant string column, already exists)
└── 'Admin' | 'Planner' | 'Voter' | null
    └── User::hasRoleInTenant($role, $tenantId) → DB::table('tenant_user')
```

The `tenant_user.role` column already exists in the migration (`2025_09_08_210000_create_tenant_user_table.php`). The `role` column is nullable string. **No new migration is needed for the column itself**, but a seeder/migration is needed to:
1. Seed 'SuperAdmin', 'Admin', 'Planner', 'Voter' names in the `roles` table
2. Set `tenant_user.role = 'Admin'` for all current tenant owners (backfill)

### Recommended Project Structure

```
app/
├── Http/
│   ├── Middleware/
│   │   └── RequireRole.php          # NEW — route-level role guard
│   └── Controllers/
│       └── TenantController.php     # MODIFY — add updateMemberRole(), removeMember(), update()
├── Mail/
│   └── TenantInvitationMail.php     # NEW — invitation Mailable
├── Models/
│   └── User.php                     # MODIFY — add isSuperAdmin(), hasRoleInTenant(), currentTenantRole()
├── Models/Scopes/
│   └── TenantScope.php              # MODIFY — SuperAdmin bypass
├── Policies/
│   ├── FeaturePolicy.php            # MODIFY — add Planner role checks
│   ├── PlanningPolicy.php           # MODIFY — add Planner role checks
│   ├── VotePolicy.php               # MODIFY — add Voter/Planner role checks
│   └── CommitmentPolicy.php         # MODIFY — add role checks
└── Providers/
    └── AuthServiceProvider.php      # MODIFY — Gate::before() SuperAdmin bypass

database/
└── migrations/
    └── XXXX_seed_roles_and_backfill.php  # NEW — seed role names, backfill owner roles

resources/views/mail/
└── tenant-invitation.blade.php      # NEW — email template
```

### Pattern 1: RequireRole Middleware

**What:** Named middleware that checks `tenant_user.role` (or SuperAdmin) before allowing route access.
**When to use:** Route-level enforcement for Admin-only sections; policy layer handles per-resource authorization.

```php
// app/Http/Middleware/RequireRole.php
class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(403);
        }
        // SuperAdmin bypasses all role checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }
        foreach ($roles as $role) {
            if ($user->hasRoleInTenant($role, $user->current_tenant_id)) {
                return $next($request);
            }
        }
        abort(403, 'Insufficient role for this action.');
    }
}
```

Register in `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    // ... existing middleware ...
    $middleware->alias([
        'role' => \App\Http\Middleware\RequireRole::class,
    ]);
})
```

Apply to routes:
```php
Route::get('plannings/admin', ...)->middleware(['auth', 'verified', 'role:Admin']);
Route::post('plannings/{planning}/set-creator', ...)->middleware(['auth', 'verified', 'role:Admin']);
```

### Pattern 2: Gate::before() for SuperAdmin

**What:** Single callback that bypasses ALL policy checks for SuperAdmin users.
**When to use:** ROLE-02 — SuperAdmin has global access.

```php
// app/Providers/AuthServiceProvider.php
public function boot(): void
{
    $this->registerPolicies();

    Gate::before(function (User $user, string $ability) {
        if ($user->isSuperAdmin()) {
            return true; // null = let policy decide; true = unconditional allow
        }
    });
}
```

### Pattern 3: TenantScope SuperAdmin Bypass

**What:** SuperAdmin should see all tenants' data (global admin view), not be blocked by tenant filtering.
**When to use:** ROLE-02 — SuperAdmin needs cross-tenant visibility.

```php
// app/Models/Scopes/TenantScope.php — modify apply()
public function apply(Builder $builder, Model $model): void
{
    $user = Auth::user();
    if (!$user) {
        $builder->whereRaw('1 = 0');
        return;
    }
    // SuperAdmin sees all data across all tenants
    if ($user->isSuperAdmin()) {
        return; // no tenant filter applied
    }
    $tenantId = $user->current_tenant_id ?? $user->tenant_id ?? null;
    if (!$tenantId) {
        $builder->whereRaw('1 = 0');
        return;
    }
    $builder->where($model->getTable() . '.tenant_id', '=', $tenantId);
}
```

### Pattern 4: User Helper Methods

```php
// app/Models/User.php — add these methods:

public function isSuperAdmin(): bool
{
    return $this->roles()->where('name', 'SuperAdmin')->exists();
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

### Pattern 5: Policy Role Layer

Existing policies check only `sameTenant()`. For this phase, add role checks to the action methods:

```php
// Example: FeaturePolicy — Planner OR Admin can create/update/delete
public function create(User $user): bool
{
    if ($user->isSuperAdmin()) return true;
    $tenantId = $this->tenantId($user);
    return $tenantId !== null
        && ($user->hasRoleInTenant('Admin', $tenantId)
            || $user->hasRoleInTenant('Planner', $tenantId));
}

public function view(User $user, Feature $feature): bool
{
    // All roles can view within their tenant
    return $this->sameTenant($user, $feature);
}
```

### Pattern 6: Invitation Email + Accept Flow

**Email delivery:**
```php
// app/Mail/TenantInvitationMail.php
class TenantInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public TenantInvitation $invitation) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You have been invited to ' . $this->invitation->tenant->name);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.tenant-invitation');
    }
}
```

**Dispatch in TenantController::invite():**
```php
Mail::to($request->email)->queue(new TenantInvitationMail($invitation));
```

**Fix: New-user registration with invitation** — `RegisteredUserController::store()` currently doesn't process `tenant_invitation_token` from session. After `Auth::login($user)`, add:
```php
if ($token = $request->session()->pull('tenant_invitation_token')) {
    $inv = TenantInvitation::where('token', $token)
        ->whereNull('accepted_at')
        ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
        ->first();
    if ($inv && $inv->email === $user->email) {
        $inv->acceptFor($user);
    }
}
```

**Fix: `acceptFor()` must assign Voter role (INV-05):**
```php
public function acceptFor(User $user): void
{
    DB::transaction(function () use ($user) {
        $user->tenants()->syncWithoutDetaching([$this->tenant_id]);

        // Assign Voter role in tenant_user pivot (INV-05)
        DB::table('tenant_user')
            ->where('tenant_id', $this->tenant_id)
            ->where('user_id', $user->id)
            ->update(['role' => 'Voter']);

        $this->forceFill(['accepted_at' => now()])->save();
        $user->forceFill(['current_tenant_id' => $this->tenant_id])->save();
    });
}
```

**Note on existing login flow:** `AuthenticatedSessionController::store()` already reads `tenant_invitation_token` from session and calls `acceptFor()` — this part is functional. Only the `RegisteredUserController` path is missing.

### Pattern 7: Sharing Roles with Front-End

Add to `HandleInertiaRequests::share()`:
```php
'auth' => [
    'user' => $request->user(),
    'tenants' => fn () => ...,
    'currentTenant' => fn () => ...,
    'currentRole' => fn () => $request->user()?->currentTenantRole(),  // ADD THIS
    'isSuperAdmin' => fn () => $request->user()?->isSuperAdmin() ?? false,  // ADD THIS
],
```

### Anti-Patterns to Avoid

- **Inline role checks in controllers:** `if (!Auth::user()->roles()->where('name', 'admin')->exists()) { abort(403); }` — this is in `PlanningController::adminPlannings()` and `setCreator()`. Replace ALL inline checks with middleware + policy layer.
- **Using `role_user` for per-tenant roles:** The `role_user` table has no `tenant_id`. Never query it for `Admin/Planner/Voter` checks — only for `SuperAdmin`.
- **Mixing global scope bypass into controller logic:** SuperAdmin visibility should be handled purely in `TenantScope::apply()` + `Gate::before()`. Controllers should not check `isSuperAdmin()` themselves.
- **Forgetting `syncWithoutDetaching`:** When assigning Voter on invitation accept, use `update()` on the pivot row (which was created by `syncWithoutDetaching` during `tenants()->syncWithoutDetaching()`), not `attach()` which would create a duplicate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invitation email HTML | Custom SMTP client | Laravel `Mailable` + `Mail::queue()` | Queue retry, environment swap (log→SMTP→SES), already configured in `.env` |
| Token security | Custom random string | `Str::uuid()` (already used) or `Str::random(64)` | Already in codebase; UUID is sufficiently unguessable for this use case |
| Gate logic | Complex role inheritance class | `Gate::before()` + simple `isSuperAdmin()` | One-liner SuperAdmin bypass; overkill to build RBAC inheritance for 4 flat roles |
| Permission cache | Custom Redis-backed permission store | Not needed at this scale | `isSuperAdmin()` hits DB once per request; acceptable for v1 |

---

## Common Pitfalls

### Pitfall 1: `tenant_user.role` NULL After Owner Registration

**What goes wrong:** When a user registers, `RegisteredUserController` creates a tenant and calls `$user->tenants()->syncWithoutDetaching([$tenant->id])` — but sets `role = null` in the pivot (see `backfill_memberships` migration). The tenant owner has no role in `tenant_user`.

**Why it happens:** The owner's role wasn't assigned during tenant creation.

**How to avoid:** In `RegisteredUserController::store()`, after adding the tenant membership, set `role = 'Admin'` in the pivot for the new owner:
```php
DB::table('tenant_user')
    ->where('tenant_id', $tenant->id)
    ->where('user_id', $user->id)
    ->update(['role' => 'Admin']);
```
**Also backfill:** The migration must backfill existing tenant owners to 'Admin' in `tenant_user`.

### Pitfall 2: `isSuperAdmin()` Causes N+1 in Middleware

**What goes wrong:** Every request with the `role` middleware triggers a `SELECT` on `role_user` join `roles`. In pages that load many models (e.g., feature board), this fires per-request.

**Why it happens:** Eager loading is not automatic for user relationships.

**How to avoid:** Cache `isSuperAdmin()` on the user object as a computed property or use `once()` helper (Laravel 11+):
```php
public function isSuperAdmin(): bool
{
    return once(fn() => $this->roles()->where('name', 'SuperAdmin')->exists());
}
```

### Pitfall 3: `acceptFor()` Race Condition on Duplicate Accept

**What goes wrong:** If a user double-clicks the accept link, two requests can race and both see `accepted_at = null`, both calling `acceptFor()`.

**Why it happens:** The check `whereNull('accepted_at')` is not inside the transaction lock.

**How to avoid:** Use `DB::transaction()` with an update-or-fail pattern:
```php
$updated = DB::table('tenant_invitations')
    ->where('id', $this->id)
    ->whereNull('accepted_at')
    ->update(['accepted_at' => now()]);
if ($updated === 0) {
    throw new \RuntimeException('Invitation already accepted');
}
```

### Pitfall 4: Invitation for Unregistered Email Shows Wrong Error

**What goes wrong:** User receives invitation for email A, registers with email B, and gets a confusing 403.

**Why it happens:** `accept()` aborts if `$inv->email !== $user->email`, but the user may have registered with a different email.

**How to avoid:** In the accept flow, after login redirect, show a friendly message: "This invitation was sent to {email}. Please log in with that account." Use `session()->flash()` rather than `abort(403)`.

### Pitfall 5: Policy `before()` Hook Returns `null` vs `false`

**What goes wrong:** `Gate::before()` returning `null` means "let the policy decide." Returning `false` means "deny unconditionally." Mistakenly returning `false` for non-SuperAdmin users would block everyone.

**Why it happens:** Confusion about Gate callback return semantics.

**How to avoid:** Only return `true` inside the SuperAdmin check; fall through (return nothing / `null`) for all other users:
```php
Gate::before(function (User $user, string $ability) {
    if ($user->isSuperAdmin()) {
        return true; // only SuperAdmin gets the blanket pass
    }
    // implicit null → normal policy evaluation continues
});
```

### Pitfall 6: Missing `soft_deleted_by` on tenant_invitations

**What goes wrong:** `TenantInvitation` uses `SoftDeletesWithUser` trait (inferred from the class definition). But `tenant_invitations` table migration doesn't have `deleted_at` or `deleted_by` columns — the `revokeInvitation()` method calls `$invitation->delete()` which would fail if soft-deletes are active.

**Why it happens:** `SoftDeletesWithUser` trait is applied but not checked for migration column existence.

**How to avoid:** Verify the migration includes soft-delete columns. If not, add a migration or remove the trait from `TenantInvitation`. For simplicity, hard-delete revoked invitations is fine (no need for audit trail at v1).

---

## Code Examples

### Registration + Invitation Token (post-login merge)

```php
// app/Http/Controllers/Auth/RegisteredUserController.php — after Auth::login($user)
if ($token = $request->session()->pull('tenant_invitation_token')) {
    $inv = TenantInvitation::where('token', $token)
        ->whereNull('accepted_at')
        ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
        ->first();
    if ($inv && $inv->email === $user->email) {
        $inv->acceptFor($user);
    }
}
```

### Migration: Seed Role Names + Backfill Owner Roles

```php
// database/migrations/XXXX_seed_roles_and_backfill_tenant_roles.php
public function up(): void
{
    // Seed role names
    $roles = ['SuperAdmin', 'Admin', 'Planner', 'Voter'];
    foreach ($roles as $name) {
        DB::table('roles')->insertOrIgnore(['name' => $name, 'created_at' => now(), 'updated_at' => now()]);
    }

    // Backfill tenant owners to 'Admin' role in tenant_user pivot
    $owners = DB::table('tenants')->whereNotNull('owner_user_id')->get(['id', 'owner_user_id']);
    foreach ($owners as $tenant) {
        DB::table('tenant_user')
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $tenant->owner_user_id)
            ->whereNull('role')
            ->update(['role' => 'Admin']);
    }
}
```

### Role-Aware Policy Method

```php
// Standard pattern for all create/update/delete policy methods:
public function create(User $user): bool
{
    if ($user->isSuperAdmin()) return true;
    $tenantId = $this->tenantId($user);
    if (!$tenantId) return false;
    return $user->hasRoleInTenant('Admin', $tenantId)
        || $user->hasRoleInTenant('Planner', $tenantId);
}
```

### Route Wiring

```php
// routes/web.php
Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::get('plannings/admin', [PlanningController::class, 'adminPlannings'])->name('plannings.admin');
    Route::post('plannings/{planning}/set-creator', [PlanningController::class, 'setCreator'])->name('plannings.set-creator');
    Route::post('tenants/{tenant}/invite', [TenantController::class, 'invite'])->name('tenants.invite');
    Route::delete('tenants/{tenant}/invitations/{invitation}', [TenantController::class, 'revokeInvitation'])->name('tenants.invitations.destroy');
    Route::patch('tenants/{tenant}/members/{user}', [TenantController::class, 'updateMemberRole'])->name('tenants.members.update');
    Route::delete('tenants/{tenant}/members/{user}', [TenantController::class, 'removeMember'])->name('tenants.members.destroy');
    Route::patch('tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `app/Http/Kernel.php` route middleware aliases | `bootstrap/app.php` `$middleware->alias()` | Laravel 11 | No `Kernel.php` exists in this project — use `bootstrap/app.php` only |
| `Illuminate\Foundation\Support\Providers\AuthServiceProvider` subclass | Direct `Gate::` calls in `AppServiceProvider::boot()` | Laravel 11 | `AuthServiceProvider.php` still works and exists in this codebase — keep it, just add `Gate::before()` |
| `Mail::send()` with view | `Mail::queue(new Mailable())` | Laravel 5.3+ | Use Mailable class + `Mail::queue()` for async email |

**Deprecated/outdated:**
- `Auth::check()` inline in controllers for role guards: replaced by middleware + policy layer in this phase.
- Dead import `use Spatie\Permission\PermissionRegistrar` in `AppServiceProvider`: remove this unused import.

---

## Open Questions

1. **Should `SoftDeletesWithUser` remain on `TenantInvitation`?**
   - What we know: The trait is applied; the table migration doesn't visibly add `deleted_at`/`deleted_by` columns
   - What's unclear: Whether the migration chain has a separate soft-delete migration for this table (check `2025_09_20_000000_add_soft_deletes_with_user_columns.php`)
   - Recommendation: Inspect that migration. If it adds `deleted_at` to `tenant_invitations`, soft-deletes work correctly. If not, add columns or remove the trait before calling `delete()`.

2. **Tenant settings page (TEN-03) — stub subscription data?**
   - What we know: Phase 2 will add Stripe subscription; `Subscription` model stub exists
   - What's unclear: Whether the settings page should be built now (Phase 1 scope) with placeholder subscription data or deferred to Phase 2
   - Recommendation: Build the page shell in Phase 1 showing member count and `"No active subscription"` status. Subscription data wired in Phase 2. TEN-03 requires the page to exist; the subscription status field can be a stub.

3. **Admin user `/admin/users` route — currently unprotected**
   - What we know: `Route::get('/admin/users', ...)` exists outside any role group in `routes/web.php`
   - What's unclear: Whether this is intentionally global or should be SuperAdmin-only
   - Recommendation: Add `middleware('role:Admin,SuperAdmin')` to this route in Phase 1 since it lists users.

---

## DB Schema Summary (No New Columns Needed)

| Table | Relevant Columns | Status |
|-------|-----------------|--------|
| `tenant_invitations` | `token`, `expires_at`, `accepted_at`, `email`, `tenant_id`, `inviter_id` | ✅ All exist |
| `tenant_user` | `tenant_id`, `user_id`, `role` (nullable string) | ✅ All exist; `role` needs values populated |
| `roles` | `id`, `name` | ✅ Exists; needs role names seeded |
| `role_user` | `user_id`, `role_id` | ✅ Exists; for SuperAdmin global role only |

**Only migration needed:** Seed role names in `roles` table + backfill `tenant_user.role = 'Admin'` for tenant owners.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `app/Models/`, `app/Http/Controllers/TenantController.php`, `app/Policies/`, `database/migrations/`, `bootstrap/app.php`, `routes/web.php`
- Laravel 12 middleware registration: `bootstrap/app.php` — `$middleware->alias()` confirmed present
- `Gate::before()` callback semantics: `app/Providers/AuthServiceProvider.php` structure confirmed

### Secondary (MEDIUM confidence)
- Laravel `Mailable` + `Mail::queue()` pattern: standard since Laravel 5.3; confirmed in project `.env.example` mail config
- `once()` helper for memoization: available in Laravel 11+ (this project uses Laravel 12)

### Tertiary (LOW confidence — needs validation)
- Race condition in invitation acceptance: standard DB concern; specific behavior under SQLite in tests may differ from MySQL in production

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all built-in Laravel features
- Architecture: HIGH — based on direct inspection of existing code; patterns follow Laravel conventions
- Pitfalls: MEDIUM — logic pitfalls inferred from code inspection; race conditions are theoretical without load testing

**Research date:** 2026-02-27
**Valid until:** 2026-06-01 (stable Laravel conventions)
