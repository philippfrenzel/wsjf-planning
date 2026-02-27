# SUMMARY: 01-cashier-foundation

**Phase:** 02-stripe-subscription-per-seat-billing  
**Plan:** 01  
**Status:** Complete  
**Date:** 2026-02-28

---

## What Was Built

Installed `laravel/cashier` (v16.3) and wired `Tenant` as the Cashier billable model, creating the database foundation for per-seat Stripe subscription billing.

---

## Tasks Completed

### Task 1: Install Cashier, publish & customise migrations

**Files modified:**
- `composer.json` / `composer.lock` — added `laravel/cashier:^16.3`
- `database/migrations/2026_02_27_185620_drop_stub_subscriptions_table.php` — drops the hand-rolled stub `subscriptions` table before Cashier migrations run (timestamp 185620 sorts before 185625)
- `database/migrations/2026_02_27_185625_create_customer_columns.php` — changed `users` → `tenants` table in both `up()` and `down()`
- `database/migrations/2026_02_27_185626_create_subscriptions_table.php` — changed `user_id` → `tenant_id`, updated composite index to `[tenant_id, stripe_status]`
- `database/migrations/2026_02_27_185627_create_subscription_items_table.php` — published as-is (no user references)
- `database/migrations/2026_02_27_185628_add_meter_id_to_subscription_items_table.php` — published as-is
- `database/migrations/2026_02_27_185629_add_meter_event_name_to_subscription_items_table.php` — published as-is

**Migration timestamp rationale:** Drop-stub migration uses timestamp `2026_02_27_185620` (5 seconds before Cashier's `185625`) to guarantee it runs first in sort order.

**Schema verified:**
- `subscriptions.tenant_id` ✅ (not user_id)
- `tenants.stripe_id`, `tenants.pm_type`, `tenants.pm_last_four`, `tenants.trial_ends_at` ✅

---

### Task 2: Wire Tenant as billable model, configure Cashier

**Files modified:**
- `app/Models/Tenant.php` — added `use Billable` trait, `trial_ends_at` datetime cast
- `app/Models/Plan.php` — added `stripe_price_id` to `$fillable`; removed stub `subscriptions()` HasMany relationship (references deleted Subscription model)
- `database/migrations/2026_02_28_000010_add_stripe_price_id_to_plans_table.php` — adds `stripe_price_id` (nullable string) to `plans` table
- `app/Providers/AppServiceProvider.php` — added `Cashier::useCustomerModel(\App\Models\Tenant::class)` at top of `boot()`
- `bootstrap/app.php` — added `$middleware->validateCsrfTokens(except: ['stripe/*'])` alongside the `role` alias registration
- `app/Http/Controllers/Auth/RegisteredUserController.php` — set `trial_ends_at => now()->addDays(14)` in `Tenant::create()`
- `routes/web.php` — removed `SubscriptionController` import and stub `subscriptions.create`/`subscriptions.store` routes

**Files deleted:**
- `app/Models/Subscription.php` — replaced by Cashier's built-in subscription model
- `app/Http/Controllers/SubscriptionController.php` — replaced by BillingController (Plan 02)

**Verified:**
- `Tenant` has `onGenericTrial()` method ✅ (Billable trait wired)
- `plans.stripe_price_id` column exists ✅
- All PHP syntax clean ✅

---

## Deviations from Plan

- **Drop-stub migration filename:** Plan specified `2026_02_28_000001` as the timestamp; used `2026_02_27_185620` instead so it sorts immediately before the Cashier published migrations (which landed at `2026_02_27_185625`). This guarantees correct ordering without relying on date differences.
- **No `constrained('tenants')` on subscriptions FK:** The Cashier subscriptions migration uses a raw `foreignId('tenant_id')` without a constrained() call — consistent with Cashier's design (it doesn't enforce the FK at migration level).

---

## Key Links (for subsequent plans)

- `Tenant::subscribed('default')` — Cashier method available (Billable trait applied)
- `Tenant::onTrial()` / `Tenant::onGenericTrial()` — checks `trial_ends_at` set at registration
- `Cashier::useCustomerModel` registered in `AppServiceProvider::boot()`
- CSRF exempt for `stripe/*` — prevents 419 errors on Stripe webhooks

---

## Pre-existing Test Failures (unrelated to this plan)

Existing test suite reports `MissingAppKeyException` and a `NOT NULL: projects.start_date` constraint error — both pre-existing environment issues that existed before this plan. No new failures introduced.
