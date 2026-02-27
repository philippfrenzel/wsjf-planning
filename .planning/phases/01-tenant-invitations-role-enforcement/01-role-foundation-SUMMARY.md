# Summary: 01-role-foundation

**Phase:** 01-tenant-invitations-role-enforcement
**Plan:** 01 — Role Foundation
**Status:** ✅ Complete
**Completed:** 2026-02-27

---

## What Was Built

### Task 1: Migration — Seed Roles & Backfill Tenant Owner Roles
**File:** `database/migrations/2026_02_27_000001_seed_roles_and_backfill_tenant_roles.php`

- Seeded four canonical role names (`SuperAdmin`, `Admin`, `Planner`, `Voter`) into the `roles` table using `insertOrIgnore` (idempotent)
- Backfilled `tenant_user.role = 'Admin'` for all existing tenant owners (only where `role IS NULL`, preserving manually-assigned roles)
- `down()` is a no-op — data migrations don't reverse cleanly
- No soft-delete columns added (already handled by `2025_09_20_000000_add_soft_deletes_with_user_columns.php`)

### Task 2: User Helpers
**File:** `app/Models/User.php`

Added three public methods after `currentTenant()`:

- **`isSuperAdmin(): bool`** — memoized with `once()`, queries `role_user JOIN roles WHERE name='SuperAdmin'`
- **`hasRoleInTenant(string $role, ?int $tenantId): bool`** — queries `tenant_user` pivot by tenant+user+role
- **`currentTenantRole(): ?string`** — returns the user's role in their current tenant, or null

Added `use Illuminate\Support\Facades\DB;` import.

### Task 3: Gate::before + TenantScope Bypass
**Files:** `app/Providers/AuthServiceProvider.php`, `app/Models/Scopes/TenantScope.php`

- **AuthServiceProvider:** Registered `Gate::before()` callback returning `true` (bypass) for SuperAdmin users, `null` for everyone else. `?bool` return type is critical — returning `false` would deny all.
- **TenantScope:** Added early-return SuperAdmin check at the top of `apply()` before any tenant filter, allowing SuperAdmin users to see data across all tenants.

---

## Files Modified

| File | Change |
|------|--------|
| `database/migrations/2026_02_27_000001_seed_roles_and_backfill_tenant_roles.php` | Created |
| `app/Models/User.php` | Added 3 methods + DB import |
| `app/Providers/AuthServiceProvider.php` | Added Gate::before() + Gate import |
| `app/Models/Scopes/TenantScope.php` | Added SuperAdmin bypass in apply() |

---

## Verification

- Migration ran cleanly on fresh DB (all 47 migrations applied)
- `DB::table('roles')->pluck('name')` returns `["SuperAdmin","Admin","Planner","Voter"]`
- `app(User::class)->isSuperAdmin()` returns `bool(false)` for fresh User
- Both AuthServiceProvider and TenantScope parse without errors
- Test suite: 64 pre-existing failures (unrelated to role changes — `projects.start_date` NOT NULL constraint issues in factories); no new failures introduced

---

## Deviations from Plan

- None. All three tasks implemented exactly as specified.
- Soft-delete migration step was correctly skipped: `2025_09_20_000000_add_soft_deletes_with_user_columns.php` already adds `deleted_at`/`deleted_by` to `tenant_invitations`.

---

## Commits

1. `feat: seed canonical role names and backfill tenant owner roles`
2. `feat: add isSuperAdmin, hasRoleInTenant, currentTenantRole to User model`
3. `feat: add SuperAdmin Gate::before bypass and TenantScope bypass`
