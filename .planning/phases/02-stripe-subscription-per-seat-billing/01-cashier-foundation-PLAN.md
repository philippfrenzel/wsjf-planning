---
phase: 02-stripe-subscription-per-seat-billing
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - composer.json
  - composer.lock
  - database/migrations/2026_02_28_000001_drop_stub_subscriptions_table.php
  - database/migrations/(cashier-published-subscriptions-migration — edit after publish)
  - database/migrations/(cashier-published-customer-columns-migration — edit after publish)
  - app/Models/Tenant.php
  - app/Models/Plan.php
  - app/Providers/AppServiceProvider.php
  - bootstrap/app.php
  - app/Http/Controllers/Auth/RegisteredUserController.php
autonomous: true
requirements: [BILL-01, BILL-02, BILL-03]

must_haves:
  truths:
    - "laravel/cashier is installed and resolvable via composer"
    - "Tenant model has the Billable trait from Laravel\\Cashier\\Billable"
    - "Cashier::useCustomerModel(Tenant::class) is registered in AppServiceProvider::boot()"
    - "Cashier migrations target tenants (not users): subscriptions.tenant_id, cashier columns on tenants table"
    - "The stub subscriptions table (user_id/plan_id schema) is dropped before Cashier migrations run"
    - "Plan model has stripe_price_id in fillable and as a database column"
    - "New tenants receive trial_ends_at = now()->addDays(14) at registration"
    - "Tenant model casts trial_ends_at to datetime"
    - "Stripe/* routes are excluded from CSRF verification"
  artifacts:
    - database/migrations/2026_02_28_000001_drop_stub_subscriptions_table.php
    - app/Models/Tenant.php (with Billable trait, trial_ends_at cast)
    - app/Models/Plan.php (with stripe_price_id fillable)
    - app/Providers/AppServiceProvider.php (with Cashier::useCustomerModel)
    - bootstrap/app.php (with stripe/* CSRF exclusion)
  key_links:
    - "Tenant::subscribed('default') — Cashier method available after Billable trait applied"
    - "Tenant::onTrial() / onGenericTrial() — checks trial_ends_at set at registration"
    - "Cashier::useCustomerModel must be called before any Cashier methods are invoked"
    - "CSRF exclusion for stripe/* prevents webhook 419 errors (Pitfall 4 from research)"
---

<objective>
Install laravel/cashier, configure Tenant as the billable model, and set up the database foundation for per-seat subscription billing.

Purpose: All subsequent plans (BillingController, seat sync, enforcement middleware) depend on Cashier being installed and the Tenant model being billable. The migration order is critical: drop the hand-rolled stub before Cashier creates its own subscriptions table. The 14-day generic trial sets trial_ends_at at registration — no card required upfront.

Output: Cashier installed, Tenant is billable, migrations are customized and run, Plan model has stripe_price_id, new tenants get free trial.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/02-stripe-subscription-per-seat-billing/02-RESEARCH.md

<interfaces>
<!-- Current state of key files before this plan runs -->

app/Models/Tenant.php (current):
```php
class Tenant extends Model
{
    use HasFactory, SoftDeletesWithUser;

    protected $fillable = ['name', 'owner_user_id'];
    // members(), invitations(), owner(), users() relationships exist
}
```

app/Models/Plan.php (current):
```php
class Plan extends Model
{
    use HasFactory, SoftDeletesWithUser;
    protected $fillable = ['name', 'price', 'interval'];
    // subscriptions() hasMany relationship to stub Subscription model
}
```

database/migrations/2025_07_15_000001_create_subscriptions_table.php:
- Creates `subscriptions` table with columns: user_id, plan_id, status, starts_at, ends_at
- Must be dropped before Cashier migrations run

app/Providers/AppServiceProvider.php (current):
```php
public function boot(): void
{
    Estimation::observe(EstimationObserver::class);
    Feature::observe(FeatureObserver::class);
    if (config('app.env') !== 'local') { URL::forceScheme('https'); }
    Vite::prefetch(concurrency: 3);
}
```

bootstrap/app.php (current):
- Already has `'role' => RequireRole::class` alias
- Has CSRF middleware but NO stripe/* exception yet

app/Http/Controllers/Auth/RegisteredUserController.php:
```php
$tenant = Tenant::create([
    'name' => ($user->name ?: $user->email) . ' Tenant',
    'owner_user_id' => Auth::id(),
]);
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Cashier, publish migrations, customise for Tenant billable model</name>
  <files>
    composer.json
    composer.lock
    database/migrations/2026_02_28_000001_drop_stub_subscriptions_table.php
    database/migrations/(cashier published subscriptions migration)
    database/migrations/(cashier published customer columns migration)
  </files>
  <action>
**Step 1 — Install Cashier:**
```bash
cd /Users/philippfrenzel/wsjf-planning
composer require laravel/cashier
```

**Step 2 — Publish Cashier migrations (do NOT run yet):**
```bash
php artisan vendor:publish --tag="cashier-migrations"
```
This creates files in `database/migrations/`. After publishing, list them to identify which are new:
```bash
ls -la database/migrations/ | grep cashier
```
Cashier 16 publishes two migration files:
- One creating the `subscriptions` table (contains `user_id` column — must change to `tenant_id`)
- One adding Cashier columns to the billable model table (contains `users` table reference — must change to `tenants`)

**Step 3 — Edit the published subscriptions migration:**
Find the newly published file that creates the `subscriptions` table (it contains `user_id` and `stripe_id` columns on subscriptions). Edit it:
- Change `$table->foreignId('user_id')` → `$table->foreignId('tenant_id')`
- Update the `constrained()` call from `->constrained()` (defaults to users) → `->constrained('tenants')`
- Also update the table comment or index name if it references 'user'
- Do NOT change subscription_items table — it only references the subscriptions table, no user_id

**Step 4 — Edit the published billable-columns migration:**
Find the published file that adds columns to the billable model (it contains `stripe_id`, `pm_type`, `pm_last_four`, `trial_ends_at`). Edit it:
- Change every reference to the `users` table → `tenants` table
- Specifically: `Schema::table('users', ...)` → `Schema::table('tenants', ...)`
- Also change the `down()` method's `Schema::table('users', ...)` → `Schema::table('tenants', ...)`

**Step 5 — Create drop-stub migration with timestamp BEFORE Cashier migrations:**
Create `database/migrations/2026_02_28_000001_drop_stub_subscriptions_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('subscriptions');
    }

    public function down(): void
    {
        // Stub table not restored — replaced by Cashier schema
    }
};
```

**Step 6 — Verify migration order before running:**
The drop-stub migration (2026_02_28_000001) must sort BEFORE the Cashier published migrations. If Cashier migrations have earlier timestamps (e.g. 2019_xx_xx_), create the drop migration with a timestamp of 2019_08_18_999999 (one second before any Cashier timestamp) to guarantee ordering. Check with `ls database/migrations/ | sort`.

**Step 7 — Run migrations:**
```bash
php artisan migrate
```
  </action>
  <verify>
    <automated>php artisan migrate:status 2>&1 | grep -E "cashier|subscriptions|drop_stub" && php artisan tinker --execute="Schema::hasTable('subscriptions') ? 'exists' : 'dropped'; Schema::hasColumn('subscriptions', 'tenant_id') ? 'tenant_id found' : 'no tenant_id';" 2>&1</automated>
  </verify>
  <done>
    - `composer show laravel/cashier` confirms package is installed
    - `subscriptions` table exists with `tenant_id` column (not `user_id`)
    - `tenants` table has columns: `stripe_id`, `pm_type`, `pm_last_four`, `trial_ends_at`
    - No migration errors during `php artisan migrate`
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire Tenant as billable model, set trial on registration, configure Cashier</name>
  <files>
    app/Models/Tenant.php
    app/Models/Plan.php
    app/Providers/AppServiceProvider.php
    bootstrap/app.php
    app/Http/Controllers/Auth/RegisteredUserController.php
  </files>
  <action>
**app/Models/Tenant.php** — Add Billable trait and trial cast:
```php
use Laravel\Cashier\Billable;

class Tenant extends Model
{
    use HasFactory, SoftDeletesWithUser, Billable;

    protected $fillable = [
        'name',
        'owner_user_id',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
    ];

    // ...existing relationships unchanged...
}
```

**app/Models/Plan.php** — Add stripe_price_id column and update fillable. Also remove the `subscriptions()` relationship (it referenced the stub Subscription model which is being deleted — Cashier manages subscriptions directly from Tenant):
```php
protected $fillable = [
    'name',
    'price',
    'interval',
    'stripe_price_id',
];
```
Remove the `subscriptions(): HasMany` method (it imports `Subscription::class` which no longer exists). Remove the `use App\Models\Subscription;` import if present. Keep all other relationships.

Also create a migration for the new column:
Create `database/migrations/2026_02_28_000010_add_stripe_price_id_to_plans_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('stripe_price_id')->nullable()->after('interval');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('stripe_price_id');
        });
    }
};
```
Run `php artisan migrate` after creating this.

**app/Providers/AppServiceProvider.php** — Add Cashier::useCustomerModel in boot():
```php
use Laravel\Cashier\Cashier;

public function boot(): void
{
    Cashier::useCustomerModel(\App\Models\Tenant::class);

    Estimation::observe(EstimationObserver::class);
    Feature::observe(FeatureObserver::class);
    // ...rest unchanged...
}
```

**bootstrap/app.php** — Add CSRF exclusion for stripe/* webhooks. Inside `->withMiddleware(function (Middleware $middleware) {`, add:
```php
$middleware->validateCsrfTokens(except: [
    'stripe/*',
]);
```
Place this alongside the existing `$middleware->alias([...])` call.

**app/Http/Controllers/Auth/RegisteredUserController.php** — Add trial_ends_at at tenant creation:
```php
$tenant = Tenant::create([
    'name' => ($user->name ?: $user->email) . ' Tenant',
    'owner_user_id' => Auth::id(),
    'trial_ends_at' => now()->addDays(14),
]);
```

**Delete stub files** (they conflict with Cashier):
- Delete `app/Models/Subscription.php` — replaced by Cashier's model
- Delete `app/Http/Controllers/SubscriptionController.php` — replaced by BillingController (Plan 02)

After deleting, remove from routes/web.php:
- Remove `use App\Http\Controllers\SubscriptionController;` import
- Remove the two subscription routes (subscriptions.create and subscriptions.store) — they will be replaced in Plan 02

Run `php artisan migrate` to apply the plans migration, then verify with `php artisan tinker`.
  </action>
  <verify>
    <automated>php artisan tinker --execute="echo (new App\Models\Tenant)->onGenericTrial() ? 'trial_ok' : 'no_trial';" 2>&1 | grep -v "^>" ; php -l app/Models/Tenant.php && php -l app/Providers/AppServiceProvider.php</automated>
  </verify>
  <done>
    - `Tenant` model parses cleanly and Billable trait methods are available
    - `AppServiceProvider::boot()` contains `Cashier::useCustomerModel(Tenant::class)`
    - `bootstrap/app.php` has `validateCsrfTokens(except: ['stripe/*'])`
    - `Tenant::create(['trial_ends_at' => now()->addDays(14)])` creates a tenant with onGenericTrial() returning true
    - `app/Models/Subscription.php` and `app/Http/Controllers/SubscriptionController.php` do NOT exist
    - `plans` table has `stripe_price_id` column
  </done>
</task>

</tasks>

<verification>
```bash
php artisan test --stop-on-failure 2>&1 | tail -20
```
All pre-existing tests must pass. If any test imports `App\Http\Controllers\SubscriptionController` or `App\Models\Subscription`, update the import in the test file to remove/replace it.

Check migration ran cleanly:
```bash
php artisan migrate:status | grep -E "Ran|Pending"
```
No pending migrations should exist after this plan.
</verification>

<success_criteria>
- `composer show laravel/cashier` returns a version line
- `php artisan tinker --execute="echo Tenant::first()?->onGenericTrial();"` doesn't throw — Billable trait is wired
- `tenants` table has `stripe_id`, `pm_type`, `pm_last_four`, `trial_ends_at` columns
- `subscriptions` table has `tenant_id` (not `user_id`) and is created by Cashier schema
- `plans` table has `stripe_price_id` column
- New tenant registration sets `trial_ends_at` to 14 days from now
- `stripe/*` routes exempt from CSRF
- No stub Subscription model or SubscriptionController files remain
</success_criteria>

<output>
After completion, create `.planning/phases/02-stripe-subscription-per-seat-billing/01-cashier-foundation-SUMMARY.md` with what was built, files modified, migration timestamps used, and any deviations from the plan.
</output>
