---
phase: 01-tenant-invitations-role-enforcement
plan: 04
type: execute
wave: 2
depends_on: [01-PLAN-role-foundation]
files_modified:
  - app/Policies/FeaturePolicy.php
  - app/Policies/PlanningPolicy.php
  - app/Policies/VotePolicy.php
  - app/Policies/CommitmentPolicy.php
autonomous: true
requirements: [ROLE-04, ROLE-05]

must_haves:
  truths:
    - "A Voter cannot create, update, or delete Features, Plannings, or Commitments"
    - "A Planner or Admin can create, update, and delete Features, Plannings, and Commitments"
    - "A Voter can create Votes (participate in voting sessions)"
    - "A Voter, Planner, and Admin can view Features, Plannings, Votes, and Commitments within their tenant"
    - "SuperAdmin bypasses all policy checks (handled by Gate::before from Plan 01 — policies need not check this)"
  artifacts:
    - app/Policies/FeaturePolicy.php (create/update/delete require Admin|Planner)
    - app/Policies/PlanningPolicy.php (create/update/delete require Admin|Planner)
    - app/Policies/VotePolicy.php (create requires Admin|Planner|Voter)
    - app/Policies/CommitmentPolicy.php (create/update/delete require Admin|Planner)
  key_links:
    - "All policy create/update/delete methods call hasRoleInTenant() from Plan 01"
    - "view/viewAny methods continue to use existing sameTenant() check only"
    - "Gate::before() (Plan 01) handles SuperAdmin — policies do NOT need isSuperAdmin() checks"
---

<objective>
Add role enforcement to all four existing policies so create/update/delete actions require Planner or Admin, and vote creation requires any tenant role.

Purpose: ROLE-04/05 — the policies currently allow any tenant member to create/update/delete anything. After this plan, only users with appropriate roles can mutate data.

Output: Updated create/update/delete methods in FeaturePolicy, PlanningPolicy, VotePolicy, and CommitmentPolicy. View methods unchanged.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Key code the executor needs. -->

From app/Models/User.php (added in Plan 01):
```php
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

IMPORTANT: Gate::before() in AuthServiceProvider (Plan 01) returns true for SuperAdmin, which means policy methods are NEVER called for SuperAdmin. Do NOT add isSuperAdmin() checks inside the policies — it is redundant and would add unnecessary DB queries.

All four policies share the same structure:
```php
class XxxPolicy
{
    public function viewAny(User $user): bool      // currently: userHasTenant($user)
    public function view(User $user, Xxx $xxx): bool  // currently: sameTenant($user, $xxx)
    public function create(User $user): bool        // currently: userHasTenant($user) — CHANGE THIS
    public function update(User $user, Xxx $xxx): bool  // currently: sameTenant($user, $xxx) — CHANGE THIS
    public function delete(User $user, Xxx $xxx): bool  // currently: sameTenant($user, $xxx) — CHANGE THIS
    public function restore(User $user, Xxx $xxx): bool // currently: false — leave unchanged
    public function forceDelete(User $user, Xxx $xxx): bool // currently: false — leave unchanged
    private function sameTenant(User $user, Xxx $xxx): bool  // tenant match check — DO NOT CHANGE
    private function userHasTenant(User $user): bool  // user has a current tenant — DO NOT CHANGE
    private function tenantId(User $user): ?int  // returns $user->current_tenant_id — DO NOT CHANGE
}
```

Role authorization matrix:
| Action          | VotePolicy  | FeaturePolicy | PlanningPolicy | CommitmentPolicy |
|-----------------|-------------|---------------|----------------|-----------------|
| viewAny / view  | any member  | any member    | any member     | any member      |
| create          | Admin|Planner|Voter | Admin|Planner | Admin|Planner | Admin|Planner |
| update          | Admin|Planner | Admin|Planner | Admin|Planner | Admin|Planner |
| delete          | Admin|Planner | Admin|Planner | Admin|Planner | Admin|Planner |
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add role checks to FeaturePolicy and PlanningPolicy</name>
  <files>app/Policies/FeaturePolicy.php, app/Policies/PlanningPolicy.php</files>
  <action>
In both FeaturePolicy and PlanningPolicy, update the `create()`, `update()`, and `delete()` methods to require Admin OR Planner role. The `viewAny()`, `view()`, `restore()`, and `forceDelete()` methods must NOT be changed.

**Pattern for create() (no model parameter):**
```php
public function create(User $user): bool
{
    $tenantId = $this->tenantId($user);
    if (!$tenantId) return false;
    return $user->hasRoleInTenant('Admin', $tenantId)
        || $user->hasRoleInTenant('Planner', $tenantId);
}
```

**Pattern for update() and delete() (has model parameter):**
```php
public function update(User $user, Feature $feature): bool
{
    if (!$this->sameTenant($user, $feature)) return false;
    $tenantId = $this->tenantId($user);
    return $user->hasRoleInTenant('Admin', $tenantId)
        || $user->hasRoleInTenant('Planner', $tenantId);
}
```

Apply this same pattern to `delete()` (substituting the model type and parameter name). For PlanningPolicy, substitute `Feature` with `Planning` in the method signatures.

The existing private helper methods (`sameTenant()`, `userHasTenant()`, `tenantId()`) are already in each file — use them. Do NOT duplicate or re-implement them.
  </action>
  <verify>
    <automated>php -l app/Policies/FeaturePolicy.php && php -l app/Policies/PlanningPolicy.php</automated>
  </verify>
  <done>Both policy files parse without error. create/update/delete methods call hasRoleInTenant() for Admin and Planner. view/viewAny methods are unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Add role checks to VotePolicy and CommitmentPolicy</name>
  <files>app/Policies/VotePolicy.php, app/Policies/CommitmentPolicy.php</files>
  <action>
**VotePolicy** — Voters can CREATE votes (they participate in voting sessions); only Admin/Planner can UPDATE or DELETE votes:

```php
// create: Admin | Planner | Voter (any tenant member with a role)
public function create(User $user): bool
{
    $tenantId = $this->tenantId($user);
    if (!$tenantId) return false;
    return $user->hasRoleInTenant('Admin', $tenantId)
        || $user->hasRoleInTenant('Planner', $tenantId)
        || $user->hasRoleInTenant('Voter', $tenantId);
}

// update: Admin | Planner only
public function update(User $user, Vote $vote): bool
{
    if (!$this->sameTenant($user, $vote)) return false;
    $tenantId = $this->tenantId($user);
    return $user->hasRoleInTenant('Admin', $tenantId)
        || $user->hasRoleInTenant('Planner', $tenantId);
}

// delete: Admin | Planner only
public function delete(User $user, Vote $vote): bool
{
    if (!$this->sameTenant($user, $vote)) return false;
    $tenantId = $this->tenantId($user);
    return $user->hasRoleInTenant('Admin', $tenantId)
        || $user->hasRoleInTenant('Planner', $tenantId);
}
```

**CommitmentPolicy** — same pattern as FeaturePolicy (Admin | Planner for create/update/delete, Voter cannot mutate commitments). Apply the exact same patterns as Task 1, substituting `Commitment` for `Feature`.

Do NOT change view/viewAny/restore/forceDelete in either policy.
  </action>
  <verify>
    <automated>php -l app/Policies/VotePolicy.php && php -l app/Policies/CommitmentPolicy.php</automated>
  </verify>
  <done>Both policy files parse without error. VotePolicy::create() allows Voter role. VotePolicy::update/delete() require Admin|Planner. CommitmentPolicy create/update/delete require Admin|Planner.</done>
</task>

</tasks>

<verification>
```bash
# Confirm no policies still use plain userHasTenant() for create/update/delete
grep -n "userHasTenant\|sameTenant" app/Policies/FeaturePolicy.php app/Policies/PlanningPolicy.php app/Policies/VotePolicy.php app/Policies/CommitmentPolicy.php

# Confirm hasRoleInTenant is used in all four policies
grep -n "hasRoleInTenant" app/Policies/FeaturePolicy.php app/Policies/PlanningPolicy.php app/Policies/VotePolicy.php app/Policies/CommitmentPolicy.php

# Run tests
php artisan test --stop-on-failure 2>&1 | tail -20
```

Expected: `view()` and `viewAny()` still use `sameTenant()`/`userHasTenant()`. `create()`, `update()`, `delete()` now call `hasRoleInTenant()`.
</verification>

<success_criteria>
- All four policy files parse without error
- create/update/delete in FeaturePolicy, PlanningPolicy, CommitmentPolicy require Admin OR Planner
- VotePolicy::create() allows Admin, Planner, AND Voter
- VotePolicy::update/delete() require Admin or Planner
- view/viewAny methods in all policies are unchanged (still tenant-membership-based)
- All pre-existing tests pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-tenant-invitations-role-enforcement/01-04-SUMMARY.md` with what was built, files modified, and any deviations from the plan.
</output>
