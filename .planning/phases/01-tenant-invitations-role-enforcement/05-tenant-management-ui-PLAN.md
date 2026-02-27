---
phase: 01-tenant-invitations-role-enforcement
plan: 05
type: execute
wave: 3
depends_on: [01-PLAN-role-foundation, 01-PLAN-invitation-flow, 01-PLAN-require-role-middleware, 01-PLAN-policy-role-enforcement]
files_modified:
  - app/Http/Controllers/TenantController.php
  - app/Http/Middleware/HandleInertiaRequests.php
  - routes/web.php
  - resources/js/pages/tenants/index.tsx
  - resources/js/types/index.d.ts
autonomous: false
requirements: [ROLE-06, INV-04, TEN-01, TEN-02, TEN-03, TEN-04]

must_haves:
  truths:
    - "Tenant management page shows all members with their current role (Admin/Planner/Voter)"
    - "Admin can change a member's role via a dropdown on the members list"
    - "Admin can remove a member from the tenant (with confirmation)"
    - "Admin can cancel (revoke) a pending invitation"
    - "Admin can edit the tenant name inline"
    - "Tenant settings area shows seat count (member count) and a subscription status placeholder"
    - "currentRole and isSuperAdmin are shared with the front-end via Inertia shared data"
    - "All tenant management routes (invite, revoke, updateMemberRole, removeMember, update) require Admin role"
  artifacts:
    - app/Http/Controllers/TenantController.php (updateMemberRole, removeMember, update methods added; index() includes role in members)
    - app/Http/Middleware/HandleInertiaRequests.php (currentRole and isSuperAdmin added to auth share)
    - routes/web.php (new tenant management routes in role:Admin group)
    - resources/js/pages/tenants/index.tsx (updated UI with role display, role change, remove member, edit name, settings tab)
    - resources/js/types/index.d.ts (Member type updated with role field)
  key_links:
    - "TenantController::index() must eager-load role from tenant_user pivot (withPivot('role') or raw select)"
    - "TenantController::updateMemberRole() validates role is one of Admin|Planner|Voter"
    - "HandleInertiaRequests::share() → auth.currentRole calls User::currentTenantRole()"
    - "routes/web.php → new routes inside middleware(['auth','verified','role:Admin']) group"
---

<objective>
Build the complete tenant management experience: member list with roles, role changes, member removal, invitation revocation, tenant name editing, and a settings stub with seat count.

Purpose: TEN-01/02/03/04, ROLE-06, INV-04 — the data layer and invitation flow are complete (Plans 01-04). This plan wires them into the UI and adds the missing controller actions.

Output: Three new TenantController actions, role data in shared Inertia props, updated routes, and a fully functional tenant management page.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Key existing code the executor needs. -->

From app/Models/User.php (added in Plan 01):
```php
public function currentTenantRole(): ?string  // queries tenant_user for current_tenant_id
public function hasRoleInTenant(string $role, ?int $tenantId): bool
public function isSuperAdmin(): bool
```

From app/Http/Controllers/TenantController.php (current index() — needs role in members):
```php
$owned = Tenant::where('owner_user_id', $user->id)
    ->with([
        'members' => function ($q) {
            $q->select('users.id', 'users.name', 'users.email');
            // MISSING: ->withPivot('role') to include the role column from tenant_user
        },
        'invitations' => function ($q) {
            $q->select('id', 'tenant_id', 'email', 'accepted_at', 'created_at');
        },
    ])
    ->get(['id', 'name']);
```

From app/Http/Middleware/HandleInertiaRequests.php (current auth share):
```php
'auth' => [
    'user' => $request->user(),
    'tenants' => fn () => $request->user()?->tenants()->get(['tenants.id', 'tenants.name']) ?? [],
    'currentTenant' => fn () => $request->user()?->currentTenant()->first(['id', 'name']),
    // MISSING: 'currentRole' and 'isSuperAdmin'
],
```

Existing tenant management routes (Plan 03 added admin routes group — extend it here):
```php
// routes/web.php — existing role:Admin group from Plan 03:
Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::get('plannings/admin', ...)->name('plannings.admin');
    Route::post('plannings/{planning}/set-creator', ...)->name('plannings.set-creator');
    // ADD tenant management routes here
});
```

From resources/js/pages/tenants/index.tsx (current member type — missing role):
```typescript
const tenants = (page.props.tenants as {
    id: number; name: string;
    members?: { id: number; name: string; email: string }[]  // role is MISSING
}[]) ?? [];
```

Shared data types in resources/js/types/index.d.ts:
```typescript
export interface SharedData {
    auth: {
        user: User;
        tenants: Tenant[];
        currentTenant: Tenant | null;
        // ADD: currentRole: string | null;
        // ADD: isSuperAdmin: boolean;
    };
    // ...
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend — new TenantController actions + role in index + shared Inertia data</name>
  <files>app/Http/Controllers/TenantController.php, app/Http/Middleware/HandleInertiaRequests.php, routes/web.php</files>
  <action>
**In app/Http/Controllers/TenantController.php:**

1. Fix `index()` — add `->withPivot('role')` to the members eager-load so role data is returned:
```php
'members' => function ($q) {
    $q->select('users.id', 'users.name', 'users.email')->withPivot('role');
},
```
Also add `->withPivot('role')` to the general `$user->tenants()` query members load if present.

2. Add `updateMemberRole()` method:
```php
public function updateMemberRole(Request $request, Tenant $tenant, User $member): RedirectResponse
{
    $request->validate(['role' => 'required|in:Admin,Planner,Voter']);

    // Ensure the target member belongs to this tenant
    if (!$tenant->members()->where('users.id', $member->id)->exists()) {
        abort(404, 'Member not found in this tenant.');
    }

    DB::table('tenant_user')
        ->where('tenant_id', $tenant->id)
        ->where('user_id', $member->id)
        ->update(['role' => $request->role]);

    return back()->with('success', 'Role updated.');
}
```

3. Add `removeMember()` method:
```php
public function removeMember(Request $request, Tenant $tenant, User $member): RedirectResponse
{
    // Prevent removing yourself
    if (Auth::id() === $member->id) {
        return back()->withErrors(['member' => 'You cannot remove yourself from the tenant.']);
    }

    $tenant->members()->detach($member->id);

    // If the removed user's current_tenant_id was this tenant, clear it
    if ($member->current_tenant_id === $tenant->id) {
        $member->forceFill(['current_tenant_id' => null])->save();
    }

    return back()->with('success', 'Member removed.');
}
```

4. Add `update()` method for tenant name:
```php
public function update(Request $request, Tenant $tenant): RedirectResponse
{
    $request->validate(['name' => 'required|string|min:2|max:100']);

    // Only the owner or Admin member may rename the tenant
    $tenant->update(['name' => $request->name]);

    return back()->with('success', 'Tenant name updated.');
}
```

Add `use Illuminate\Support\Facades\DB;` if not already imported.

**In app/Http/Middleware/HandleInertiaRequests.php:**

In the `share()` method, add `currentRole` and `isSuperAdmin` inside the `'auth'` array:
```php
'auth' => [
    'user' => $request->user(),
    'tenants' => fn () => $request->user()?->tenants()->get(['tenants.id', 'tenants.name']) ?? [],
    'currentTenant' => fn () => $request->user()?->currentTenant()->first(['id', 'name']),
    'currentRole' => fn () => $request->user()?->currentTenantRole(),
    'isSuperAdmin' => fn () => $request->user()?->isSuperAdmin() ?? false,
],
```

**In routes/web.php:**

Inside the existing `middleware(['auth', 'verified', 'role:Admin'])` group (created in Plan 03), add the new tenant management routes:
```php
Route::post('tenants/{tenant}/invite', [\App\Http\Controllers\TenantController::class, 'invite'])->name('tenants.invite');
Route::delete('tenants/{tenant}/invitations/{invitation}', [\App\Http\Controllers\TenantController::class, 'revokeInvitation'])->name('tenants.invitations.destroy');
Route::patch('tenants/{tenant}/members/{user}', [\App\Http\Controllers\TenantController::class, 'updateMemberRole'])->name('tenants.members.update');
Route::delete('tenants/{tenant}/members/{user}', [\App\Http\Controllers\TenantController::class, 'removeMember'])->name('tenants.members.destroy');
Route::patch('tenants/{tenant}', [\App\Http\Controllers\TenantController::class, 'update'])->name('tenants.update');
```

If `tenants.invite` and `tenants.invitations.destroy` already exist in a non-Admin route group, MOVE them into the role:Admin group (don't duplicate — only one route definition per name). Check for existing route definitions before adding.
  </action>
  <verify>
    <automated>php artisan route:list --name=tenants 2>&1 | grep -E "invite|members|update" && php -l app/Http/Controllers/TenantController.php && php -l app/Http/Middleware/HandleInertiaRequests.php</automated>
  </verify>
  <done>TenantController parses without error. HandleInertiaRequests parses without error. `php artisan route:list --name=tenants` shows all five new tenant management route names.</done>
</task>

<task type="auto">
  <name>Task 2: Frontend — update tenant management page with role UI</name>
  <files>resources/js/pages/tenants/index.tsx, resources/js/types/index.d.ts</files>
  <action>
Update the existing `resources/js/pages/tenants/index.tsx` to surface role data and management actions. Keep the existing KPI cards, tab structure, and invite form. Add or enhance:

**Type updates (also in resources/js/types/index.d.ts SharedData interface):**
- Member type: add `role: 'Admin' | 'Planner' | 'Voter' | null`
- Invitation type: already has `id`, `email`, `accepted_at` — verify it also has `tenant_id`
- Auth: add `currentRole: string | null` and `isSuperAdmin: boolean` to the auth shared data type

**In the tenants/index.tsx page component:**

1. **Members tab / section — for each member in the owned tenant:**
   - Display: name, email, role badge (colored: Admin=blue, Planner=green, Voter=gray)
   - Role change: a `<select>` dropdown (values: Admin, Planner, Voter) using `router.patch(route('tenants.members.update', {tenant: tenant.id, user: member.id}), {role: newRole})`; disable if member.id === auth.user.id (cannot change own role)
   - Remove button: calls `router.delete(route('tenants.members.destroy', {tenant: tenant.id, user: member.id}))` with `confirm()` dialog; hide if member.id === auth.user.id

2. **Pending invitations section — for each pending invitation (accepted_at === null):**
   - Display: email, created_at (formatted), expires_at if set
   - Revoke button: calls `router.delete(route('tenants.invitations.destroy', {tenant: invitation.tenant_id, invitation: invitation.id}))` with `confirm()` dialog

3. **Settings tab — new tab (or section) with:**
   - Editable tenant name: an input pre-filled with current tenant name + save button calling `router.patch(route('tenants.update', {tenant: selectedTenant.id}), {name: newName})`
   - Seat count: display `{members.length} seat(s)` as a read-only stat
   - Subscription status: display `"No active subscription"` as a static placeholder (will be wired in Phase 2)

4. **Role-gated UI visibility:**
   - Read the `auth.currentRole` and `auth.isSuperAdmin` from `usePage<SharedData>().props`
   - Only show invite form, role-change dropdowns, remove buttons, and settings tab if `currentRole === 'Admin' || isSuperAdmin`
   - Voters and Planners see the members list (read-only) but not the management controls

Use existing UI components from the codebase: `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Input`, `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` (already imported in the file). For the role select, use a standard HTML `<select>` or the `Select` component from `@/components/ui/select` if it exists in the project. For the role badge, use a simple `<span>` with inline Tailwind classes.

Do NOT rewrite the entire page from scratch — make targeted additions to the existing component. Keep the existing KPI cards, tab structure, tenant switcher, and invite form intact.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -E "tenants/index|types/index" | head -10 || echo "TypeScript check complete"</automated>
  </verify>
  <done>TypeScript compiles without errors on the tenant index page. The page renders member list with roles, role-change controls, remove buttons, pending invitation revocation, tenant name edit, and seat count. Controls are hidden for Voter/Planner roles.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 3: Verify tenant management UI end-to-end</name>
  <files></files>
  <action>
Run the development server (`php artisan serve` + `npm run dev`) and verify:
1. Log in as a tenant Admin — visit /tenants
2. Confirm members list shows names, emails, and roles
3. Confirm role dropdown appears and can change a member's role
4. Confirm remove button appears (and is absent for own row)
5. Confirm pending invitations show with a Revoke button
6. Confirm tenant name edit field saves correctly
7. Confirm Settings tab shows seat count and "No active subscription"
8. Log in as a Voter — confirm management controls are hidden (read-only view)
  </action>
  <verify>Manual verification by the user.</verify>
  <done>Tenant management page is functional for Admin users and read-only for Voter/Planner users.</done>
</task>

</tasks>

<verification>
```bash
# Backend routes exist
php artisan route:list --name=tenants 2>&1

# TypeScript check
npx tsc --noEmit 2>&1 | tail -20

# Full test suite
php artisan test --stop-on-failure 2>&1 | tail -20
```
</verification>

<success_criteria>
- TenantController has updateMemberRole(), removeMember(), update() methods
- TenantController::index() returns role data in members via withPivot('role')
- HandleInertiaRequests shares currentRole and isSuperAdmin
- All five new tenant management routes exist and require role:Admin middleware
- Tenant page displays member roles, role-change controls, remove controls
- Pending invitations shown with Revoke button
- Tenant name is editable by Admin
- Settings tab shows seat count and subscription status placeholder
- TypeScript compiles without errors
- All pre-existing tests pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-tenant-invitations-role-enforcement/01-05-SUMMARY.md` with what was built, files modified, and any deviations from the plan.
</output>
