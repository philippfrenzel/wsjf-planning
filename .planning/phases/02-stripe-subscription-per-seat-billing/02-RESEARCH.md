# Phase 2: Stripe Subscription & Per-Seat Billing — Research

**Researched:** 2025-01-27
**Domain:** Stripe billing, laravel/cashier-stripe, subscription enforcement
**Confidence:** HIGH (primary findings from official Laravel 12.x docs, verified against live doc pages)

---

## Summary

Phase 2 wires Stripe subscription billing into the multi-tenant SaaS. The central architectural decision is that **`Tenant` is the billable model**, not `User` — because one team subscribes together, not each individual user. This deviates from Cashier's default (`User`) and requires explicit configuration, but Cashier fully supports it.

The hand-rolled `Plan` and `Subscription` models are stubs with no production data. Cashier provides its own `subscriptions` and `subscription_items` tables with a completely different schema. The migration path is clean: drop the existing `subscriptions` table via a new migration, publish and customise Cashier's migrations to target `tenants` instead of `users`, then delete the stub `Subscription` model (while keeping a slimmed `Plan` model for Stripe price-ID storage).

Per-seat billing works through Cashier's `subscription->updateQuantity($n)` API: every time a member joins or leaves a tenant, sync the quantity. The 14-day free trial should use the **generic trial** pattern (`trial_ends_at` on the `Tenant` row, set at tenant creation) rather than a payment-method-up-front trial, because new tenants shouldn't need a card immediately. Stripe Checkout is the right UX for initial card capture — it handles SCA/3DS automatically and is far simpler than a custom Payment Intent form.

**Primary recommendation:** Install `laravel/cashier` v16, make `Tenant` the Cashier customer model, use Stripe Checkout for subscription creation, update quantity on tenant member events, and use a `RequireSubscription` middleware (similar to Phase 1's `RequireRole`) for enforcement.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BILL-01 | Stripe integration via laravel/cashier | See §Standard Stack — Cashier 16 install steps |
| BILL-02 | Plans defined with per-seat pricing (Stripe price IDs) | See §Architecture Patterns — Plan model migration |
| BILL-03 | New tenant gets 14-day free trial before billing | See §Code Examples — Generic Trial pattern |
| BILL-04 | Subscription created when tenant owner adds payment method | See §Code Examples — Stripe Checkout subscription flow |
| BILL-05 | Seat count updates automatically when members added/removed | See §Architecture Patterns — Seat Sync Observer |
| BILL-06 | Tenant owner can access Stripe billing portal | See §Code Examples — Billing portal route |
| BILL-07 | Lapsed subscriptions block core features (grace period allowed) | See §Architecture Patterns — RequireSubscription middleware |
| BILL-08 | Stripe webhooks handle payment success, failure, cancellation | See §Code Examples — Webhook listener pattern |
| ENF-01 | Inactive subscription returns upgrade prompt | See §Architecture Patterns — RequireSubscription middleware |
| ENF-02 | SuperAdmin exempt from subscription enforcement | See §Architecture Patterns — SuperAdmin bypass |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `laravel/cashier` | `^15.6` (Laravel 12 compatible, resolves to Cashier 16) | Stripe subscription lifecycle, webhooks, billing portal | Official Laravel package; handles webhooks, trials, quantities, SCA/3DS, billing portal |

> **Note on version:** `composer require laravel/cashier` will pull the latest compatible version. As of the research date, Cashier 16 targets Stripe API `2025-06-30.basil` and supports Laravel 12 fully. Verify with `composer show laravel/cashier` post-install.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Stripe JS (`stripe.js` CDN v3) | CDN | Stripe Elements for card input | Only if building custom card form (skip if using Checkout) |
| `dompdf/dompdf` | `^2.0` | Invoice PDF generation | If you want `$tenant->downloadInvoice()` functionality |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout (hosted) | Custom Setup Intent form | Custom form gives more control but requires Stripe.js, handles SCA manually, much more code |
| Generic trial (no card upfront) | `trialDays()` with card upfront | Card-upfront increases conversion friction at signup; generic trial is friendlier for v1 |
| Tenant as billable | User as billable | User-billable would mean one subscription per user, not per team — wrong model for a team SaaS |

### Installation

```bash
composer require laravel/cashier

# Publish Cashier's migrations (DO NOT run yet — customise first, see below)
php artisan vendor:publish --tag="cashier-migrations"

# Optionally publish config
php artisan vendor:publish --tag="cashier-config"

# After customising migrations:
php artisan migrate
```

---

## Architecture Patterns

### Recommended Project Structure

```
app/
├── Models/
│   ├── Tenant.php              # Add Billable trait; add stripe_* accessors
│   ├── Plan.php                # Keep; add stripe_price_id column
│   └── Subscription.php        # DELETE — replaced by Cashier's model
├── Http/
│   ├── Controllers/
│   │   ├── BillingController.php    # NEW — Checkout, portal, webhook-related UI
│   │   └── SubscriptionController.php  # REPLACE — wire to Cashier
│   └── Middleware/
│       └── RequireSubscription.php  # NEW — enforcement middleware
├── Listeners/
│   └── StripeEventListener.php  # NEW — custom webhook event handlers
└── Providers/
    └── AppServiceProvider.php  # Configure Cashier::useCustomerModel(Tenant::class)

database/migrations/
├── XXXX_drop_subscriptions_table.php        # NEW — drop stub table
├── XXXX_cashier_subscriptions.php           # PUBLISHED + CUSTOMISED (tenant_id, not user_id)
├── XXXX_cashier_subscription_items.php      # PUBLISHED as-is
└── XXXX_add_cashier_columns_to_tenants.php  # NEW — stripe_id, pm_type, etc.
```

### Pattern 1: Tenant as Billable Model

**What:** Register `Tenant` (not `User`) as the Cashier customer model. This means all `->subscription()`, `->subscribed()`, `->newSubscription()` calls run on a `Tenant` instance.
**When to use:** Any multi-tenant SaaS where billing is per-team, not per-user.

```php
// app/Providers/AppServiceProvider.php
use Laravel\Cashier\Cashier;

public function boot(): void
{
    // Source: https://laravel.com/docs/12.x/billing#billable-model
    Cashier::useCustomerModel(\App\Models\Tenant::class);

    // EUR currency for this project
    // CASHIER_CURRENCY=eur in .env is preferred, but can also call:
    // Cashier::useCurrency('eur', 'de_DE');
}
```

```php
// app/Models/Tenant.php — add Billable trait
use Laravel\Cashier\Billable;

class Tenant extends Model
{
    use HasFactory, SoftDeletesWithUser, Billable;
    // ...
}
```

### Pattern 2: Cashier Migrations — Customise for Tenants

**What:** Cashier's published migrations assume `users` table. Since `Tenant` is billable, modify them before running.

**Migration 1 — Add Cashier columns to tenants table (new migration):**
```php
// Source: https://laravel.com/docs/12.x/billing#installation
Schema::table('tenants', function (Blueprint $table) {
    $table->string('stripe_id')->nullable()->index();
    $table->string('pm_type')->nullable();
    $table->string('pm_last_four', 4)->nullable();
    $table->timestamp('trial_ends_at')->nullable();
});
```

**Migration 2 — Replace Cashier's published subscription migration:**
Change `$table->foreignId('user_id')` → `$table->foreignId('tenant_id')` in the published migration file before running migrate.

**Migration 3 — Drop old stub subscriptions table:**
```php
Schema::dropIfExists('subscriptions'); // drop the hand-rolled stub
// Then run the Cashier subscriptions migration
```

**Order:** Drop stub → Cashier subscriptions → subscription_items → add Cashier columns to tenants.

### Pattern 3: Generic Trial (No Card Upfront)

**What:** Set `trial_ends_at` on the `Tenant` at registration. Cashier's `$tenant->onTrial()` returns `true` while within the period.
**When to use:** For frictionless onboarding — tenant can use the product for 14 days before being asked for a card.

```php
// Source: https://laravel.com/docs/12.x/billing#without-payment-method-up-front
// In TenantController (or wherever new tenants are created):
$tenant = Tenant::create([
    'name' => $validated['name'],
    'owner_user_id' => Auth::id(),
    'trial_ends_at' => now()->addDays(14),
]);
```

Add date cast to Tenant model:
```php
protected $casts = [
    'trial_ends_at' => 'datetime',
];
```

Check trial status anywhere:
```php
if ($tenant->onTrial()) {
    // Within generic trial — no subscription created yet
}
if ($tenant->onGenericTrial()) {
    // Specifically on generic trial (no active subscription object)
}
```

### Pattern 4: Stripe Checkout for Subscription Creation

**What:** Redirect tenant owner to Stripe's hosted checkout page. Handles SCA, 3DS, and payment method storage automatically.
**When to use:** Initial subscription creation — simplest secure path for v1.

```php
// Source: https://laravel.com/docs/12.x/billing#quickstart-selling-subscriptions
// BillingController::checkout()
public function checkout(Request $request)
{
    $tenant = $request->user()->currentTenant; // resolve current tenant

    return $tenant
        ->newSubscription('default', config('cashier.price_id')) // Stripe Price ID from .env
        ->checkout([
            'success_url' => route('billing.success'),
            'cancel_url'  => route('billing.index'),
        ]);
}
```

On success, Cashier syncs the subscription via webhook. The tenant is now subscribed.

### Pattern 5: Seat Count Sync (Per-Seat Billing)

**What:** Every time a member is added or removed from a tenant, update the Stripe subscription quantity to match the active member count.
**When to use:** Whenever `tenant_user` pivot changes.

```php
// Source: https://laravel.com/docs/12.x/billing#subscription-quantity
// Could be an Observer or Event Listener on TenantUser pivot changes.
// Simplest v1 approach: call directly in TenantController after add/remove:

protected function syncSeatCount(Tenant $tenant): void
{
    if ($tenant->subscribed('default')) {
        $memberCount = $tenant->members()->count();
        $tenant->subscription('default')->updateQuantity($memberCount);
    }
}
```

Call `$this->syncSeatCount($tenant)` after:
- `TenantController::invite()` accept (member joined)
- `TenantController::removeMember()` (member removed)
- `TenantInvitation::acceptFor()` (existing user accepts)

### Pattern 6: RequireSubscription Middleware

**What:** Middleware that checks if the current tenant has an active subscription or is in trial. Redirects to billing page if not.
**When to use:** Apply to all "core feature" route groups.

```php
// Source: https://laravel.com/docs/12.x/billing#quickstart-building-a-subscribed-middleware
// app/Http/Middleware/RequireSubscription.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireSubscription
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        // SuperAdmin bypass — exempt from all billing enforcement
        // Source: Phase 1 established User::isSuperAdmin() via Gate::before()
        if ($user?->isSuperAdmin()) {
            return $next($request);
        }

        $tenant = $user?->currentTenant(); // however current tenant is resolved

        if (! $tenant || (! $tenant->subscribed('default') && ! $tenant->onTrial())) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Subscription required.'], 402)
                : redirect()->route('billing.index')->with('upgrade_prompt', true);
        }

        return $next($request);
    }
}
```

Register alias in `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'subscribed' => \App\Http\Middleware\RequireSubscription::class,
    ]);
})
```

### Pattern 7: Billing Portal

```php
// Source: https://laravel.com/docs/12.x/billing#billing-portal
// BillingController::portal()
public function portal(Request $request)
{
    $tenant = $request->user()->currentTenant;
    return $tenant->redirectToBillingPortal(route('dashboard'));
}

// Or get URL without redirect:
$url = $tenant->billingPortalUrl(route('dashboard'));
```

The portal covers: card management, invoice history, plan changes, subscription cancellation.

### Pattern 8: Webhook Handling

**What:** Cashier auto-registers `/stripe/webhook` route. Extend with a listener for custom events.
**Setup:**

```php
// bootstrap/app.php — exclude webhook route from CSRF
// Source: https://laravel.com/docs/12.x/billing#webhooks-and-csrf-protection
->withMiddleware(function (Middleware $middleware): void {
    $middleware->validateCsrfTokens(except: [
        'stripe/*',
    ]);
})
```

Create webhook in Stripe (auto-registers all required events):
```bash
php artisan cashier:webhook
# For local dev with Stripe CLI:
# stripe listen --forward-to localhost:8000/stripe/webhook
```

Listen to custom events via Laravel's event system:
```php
// Source: https://laravel.com/docs/12.x/billing#defining-webhook-event-handlers
// app/Listeners/StripeEventListener.php
use Laravel\Cashier\Events\WebhookReceived;

class StripeEventListener
{
    public function handle(WebhookReceived $event): void
    {
        match ($event->payload['type']) {
            'invoice.payment_succeeded' => $this->handlePaymentSucceeded($event->payload),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event->payload),
            default => null,
        };
    }
}
```

**Events Cashier handles automatically** (no custom listener needed):
- `customer.subscription.created/updated/deleted` → syncs `subscriptions` table
- `customer.updated/deleted` → syncs billable model
- `invoice.payment_action_required` → triggers SCA notification
- `payment_method.automatically_updated`

**Events requiring custom listener** for this app:
- `invoice.payment_succeeded` → optionally notify tenant owner of successful charge
- `invoice.payment_failed` → notify tenant owner, possibly mark tenant as past-due

### Anti-Patterns to Avoid

- **Putting `Billable` on `User` when billing is per-team:** Causes one subscription per user — incompatible with per-seat team billing.
- **Running Cashier migrations before customising them:** Cashier adds columns to `users` by default; running before modification requires a messy retroactive migration.
- **Hand-rolling webhook signature verification:** Never skip `STRIPE_WEBHOOK_SECRET` — Cashier validates it automatically when the env var is set.
- **Using `trialDays()` without a payment method:** `trialDays()` requires calling `->create($paymentMethod)` — use generic trial (`trial_ends_at`) when no card is collected upfront.
- **Calling `updateQuantity()` on a non-subscribed tenant:** Always guard with `if ($tenant->subscribed('default'))` before calling quantity methods.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC check | Cashier's built-in middleware (enabled by `STRIPE_WEBHOOK_SECRET`) | Timing attacks, header parsing edge cases |
| Subscription status tracking | Custom `status` state machine | Cashier's `subscribed()`, `onTrial()`, `onGracePeriod()`, `canceled()` | Cashier syncs all states from Stripe webhooks automatically |
| Invoice PDF generation | Custom PDF template | `$tenant->downloadInvoice($id)` with dompdf | Stripe's invoice format is standard; Cashier wraps it |
| Payment form | Custom Stripe Elements form | Stripe Checkout (hosted) | SCA/3DS, Apple/Google Pay, card validation all free |
| Billing portal | Custom invoice/card management UI | `$tenant->redirectToBillingPortal()` | Stripe's portal handles everything; zero maintenance |
| Grace period logic | Custom "still active after cancel" logic | `$tenant->subscription('default')->onGracePeriod()` | Cashier tracks `ends_at` and grace automatically |

**Key insight:** Stripe + Cashier handle 95% of billing edge cases. The app only needs to wire events to domain actions (sync seat count, enforce subscription).

---

## Common Pitfalls

### Pitfall 1: Cashier Targets `users` Table by Default
**What goes wrong:** Publishing Cashier's migrations and running `php artisan migrate` adds `stripe_id`, `pm_type`, `pm_last_four`, `trial_ends_at` columns to `users`, not `tenants`.
**Why it happens:** Cashier assumes the billable model is `User`. The migration file references `users` table.
**How to avoid:** Before running `migrate`, edit the published migration at `database/migrations/*_add_stripe_columns_to_users_table.php` to target `tenants` instead of `users`. Or write a separate migration.
**Warning signs:** `Call to undefined method Tenant::subscribed()` after setup.

### Pitfall 2: Existing `subscriptions` Table Conflicts with Cashier
**What goes wrong:** Cashier's migration tries to create a `subscriptions` table that already exists, or creates a new schema that conflicts with the old stub.
**Why it happens:** The stub `2025_07_15_000001_create_subscriptions_table.php` creates a `subscriptions` table with `user_id` and `plan_id` columns. Cashier needs a completely different schema.
**How to avoid:** Create a new migration that `Schema::dropIfExists('subscriptions')` BEFORE the Cashier migration runs. Use a timestamp that sorts before the Cashier migration filename.
**Warning signs:** `SQLSTATE[42S01]: Table 'subscriptions' already exists` during migrate.

### Pitfall 3: Stub `Subscription` Model Conflict
**What goes wrong:** Cashier uses `Laravel\Cashier\Subscription` internally. If `App\Models\Subscription` is still loaded, type confusion can occur, especially if custom models are registered.
**Why it happens:** The stub `app/Models/Subscription.php` still exists with `user_id` and `plan_id`.
**How to avoid:** Delete `app/Models/Subscription.php` and `app/Http/Controllers/SubscriptionController.php` (replace with `BillingController`). Update any imports.
**Warning signs:** `MassAssignmentException` or wrong column errors on subscription operations.

### Pitfall 4: CSRF Blocking Stripe Webhooks
**What goes wrong:** Stripe webhook POST requests fail with 419 (CSRF mismatch).
**Why it happens:** Laravel's CSRF middleware blocks all non-GET requests by default.
**How to avoid:** Exclude `stripe/*` in `bootstrap/app.php` CSRF exceptions (see Pattern 8).
**Warning signs:** Stripe dashboard shows webhook delivery failures with 419 responses.

### Pitfall 5: `updateQuantity()` Called on a Tenant Without a Subscription
**What goes wrong:** `Call to a member function updateQuantity() on null` when a tenant in free trial adds/removes a member.
**Why it happens:** `$tenant->subscription('default')` returns `null` if no Cashier subscription exists yet (generic trial tenants have `trial_ends_at` set, but no `subscriptions` row).
**How to avoid:** Always guard: `if ($tenant->subscribed('default')) { $tenant->subscription('default')->updateQuantity($n); }`.

### Pitfall 6: `stripe_id` Column Collation (MySQL only)
**What goes wrong:** Stripe ID lookups are case-sensitive; MySQL `utf8mb4_unicode_ci` is case-insensitive.
**Why it happens:** Stripe IDs like `cus_Abc123` vs `cus_abc123` would match incorrectly.
**How to avoid:** This project uses SQLite in dev/test; for production MySQL, set `stripe_id` collation to `utf8_bin`. Noted in official docs.

### Pitfall 7: Resolving "Current Tenant" in Middleware
**What goes wrong:** The `RequireSubscription` middleware doesn't know which tenant the authenticated user is currently operating in.
**Why it happens:** Users can belong to multiple tenants; the "current tenant" must be tracked per-session or per-request.
**How to avoid:** Phase 1 added `current_tenant_id` to the `users` table (see migration `2025_09_08_210100_add_current_tenant_to_users.php`). Use `$user->currentTenant` relationship. Verify this is correct in the actual model.

---

## Code Examples

### Complete Installation Sequence

```bash
# 1. Install Cashier
composer require laravel/cashier

# 2. Publish migrations (don't run yet)
php artisan vendor:publish --tag="cashier-migrations"
php artisan vendor:publish --tag="cashier-config"

# 3. Edit published migrations:
#    - Change 'users' → 'tenants' in the billable columns migration
#    - Change 'user_id' → 'tenant_id' in subscriptions migration

# 4. Create new migration to drop stub subscriptions table
php artisan make:migration drop_stub_subscriptions_table

# 5. Run all migrations
php artisan migrate

# 6. Create Stripe webhook (requires STRIPE_SECRET in .env)
php artisan cashier:webhook
```

### .env Variables Required

```dotenv
STRIPE_KEY=pk_test_...          # Publishable key
STRIPE_SECRET=sk_test_...       # Secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
CASHIER_CURRENCY=eur            # Match project currency
CASHIER_CURRENCY_LOCALE=de_DE   # For German locale formatting
```

### Checking Subscription Status (all states)

```php
// Source: https://laravel.com/docs/12.x/billing#checking-subscription-status
$tenant->subscribed('default')        // active OR on grace period after cancel
$tenant->subscription('default')->onTrial()       // within trial on a real sub
$tenant->onGenericTrial()             // generic trial (no sub object yet)
$tenant->onTrial()                    // either type of trial
$tenant->subscription('default')->onGracePeriod() // canceled but not yet expired
$tenant->subscription('default')->canceled()       // canceled (may still be active)
$tenant->subscription('default')->ended()          // fully expired
$tenant->subscription('default')->pastDue()        // payment failed
```

### Seat Sync in TenantController

```php
// Call after any member add/remove
private function syncSeatCount(Tenant $tenant): void
{
    if (! $tenant->subscribed('default')) {
        return; // Generic trial — no subscription to update
    }

    $count = $tenant->members()->count();
    $tenant->subscription('default')->updateQuantity($count);
}
```

### Billing Routes (web.php additions)

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/billing', [BillingController::class, 'index'])->name('billing.index');
    Route::get('/billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');
    Route::get('/billing/success', [BillingController::class, 'success'])->name('billing.success');
    Route::get('/billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stripe.js Payment Intent for subscriptions | Setup Intent → Checkout or `newSubscription()->checkout()` | Cashier 13+ | Checkout handles SCA/3DS automatically; no custom JS needed |
| `php artisan cashier:webhook` not available | `cashier:webhook` command creates Stripe webhook automatically | Cashier 14+ | No need to manually configure webhook URL in Stripe dashboard |
| Custom webhook route | Auto-registered `/stripe/webhook` by Cashier service provider | Cashier 13+ | No route definition needed |
| `trialDays()` always requires payment method | Generic trial via `trial_ends_at` requires no payment method | Cashier core | Two distinct trial patterns exist; choose based on onboarding UX |

**Deprecated/outdated:**
- `SubscriptionController` stub: Hand-rolled controller — replace entirely with `BillingController` using Cashier APIs.
- `Subscription` model stub: Hand-rolled model with `user_id`/`plan_id` — delete; Cashier's model takes over.
- `plans` table `price`/`interval` columns: Sufficient for display; add `stripe_price_id` string column for Cashier integration.

---

## Open Questions

1. **How is `currentTenant` resolved for the authenticated user?**
   - What we know: `users` table has a `current_tenant_id` column (from migration `2025_09_08_210100`). Phase 1 TenantController sets it.
   - What's unclear: Is there a `User::currentTenant()` method or relationship already defined? The Tenant model and User model stubs shown don't include it explicitly.
   - Recommendation: Check `app/Models/User.php` for `currentTenant` before implementing middleware. If absent, add `belongsTo(Tenant::class, 'current_tenant_id')` relationship.

2. **Should `Plan` model be kept or fully replaced by Stripe products?**
   - What we know: `Plan` model exists with `name`, `price`, `interval`. No `stripe_price_id` yet.
   - What's unclear: Whether the plans/index UI will be kept or replaced by Stripe product lookup.
   - Recommendation: Keep `Plan` model, add `stripe_price_id` string column. Store Stripe Price IDs in `.env` or seed the table. One plan for v1 is sufficient.

3. **Multi-tenant webhook routing: how to identify which tenant a webhook belongs to?**
   - What we know: Cashier resolves the billable model by `stripe_id`. Since `Tenant` is billable and has `stripe_id`, Cashier will look up the tenant by Stripe customer ID.
   - What's unclear: Whether `Cashier::findBillable($stripeId)` works with custom model out of the box after `useCustomerModel(Tenant::class)`.
   - Recommendation: Verify with a quick test after setup. According to docs, `findBillable` uses the customer model registered via `useCustomerModel`.

---

## Sources

### Primary (HIGH confidence)
- `https://laravel.com/docs/12.x/billing` — Complete Cashier 16 documentation for Laravel 12; verified all patterns against live page (fetched 2025-01-27)
  - Installation, configuration, billable model customisation
  - Subscription creation, quantity, trials (both patterns)
  - Billing portal, webhook handling, CSRF exclusion
  - Subscription status checking (all methods)

### Secondary (MEDIUM confidence)
- `https://github.com/laravel/cashier-stripe` — Official Cashier source (referenced via docs; UPGRADE.md notes Cashier 16 + Stripe API 2025-06-30.basil)

### Tertiary (LOW confidence — validate before implementation)
- Tenant-as-billable pattern (non-User): Common community pattern verified against Cashier docs `useCustomerModel` section; however the exact migration customisation (changing `user_id` → `tenant_id` in published migrations) is inferred from docs rather than explicitly documented.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Official Laravel 12.x billing docs, current version verified
- Architecture patterns: HIGH — Directly from official docs; custom model pattern documented
- Migration conflict resolution: MEDIUM — Inferred from docs + existing stub analysis; requires careful execution
- Pitfalls: HIGH — Derived from explicit docs warnings + codebase analysis (existing stub conflicts)

**Research date:** 2025-01-27
**Valid until:** 2025-03-01 (Cashier versioning stable; re-verify if Cashier major version changes)
