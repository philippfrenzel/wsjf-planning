---
phase: 02-stripe-subscription-per-seat-billing
plan: 03
type: execute
wave: 2
depends_on: [01-cashier-foundation-PLAN.md]
files_modified:
  - app/Http/Controllers/TenantController.php
  - app/Listeners/StripeEventListener.php
  - app/Providers/EventServiceProvider.php
autonomous: true
requirements: [BILL-05, BILL-08]

must_haves:
  truths:
    - "syncSeatCount() helper exists in TenantController and guards against non-subscribed tenants"
    - "syncSeatCount() is called after TenantController::accept() (invitation accepted — member joined)"
    - "syncSeatCount() is called after TenantController::removeMember() (member removed)"
    - "Stripe subscription quantity equals tenant member count after add/remove operations"
    - "StripeEventListener handles invoice.payment_succeeded and invoice.payment_failed events"
    - "StripeEventListener is registered to listen for WebhookReceived events"
  artifacts:
    - app/Http/Controllers/TenantController.php (with syncSeatCount)
    - app/Listeners/StripeEventListener.php
    - app/Providers/EventServiceProvider.php (or AppServiceProvider with listener registration)
  key_links:
    - "syncSeatCount guards: if (!$tenant->subscribed('default')) return; — prevents null->updateQuantity() on trial tenants"
    - "$tenant->subscription('default')->updateQuantity($count) — Cashier quantity API (BILL-05)"
    - "WebhookReceived event dispatched by Cashier for all incoming webhook events"
    - "customer.subscription.updated/deleted handled automatically by Cashier — no custom listener needed for those"
---

<objective>
Wire per-seat billing: sync subscription quantity when members join or leave a tenant. Register a webhook event listener for invoice payment events.

Purpose: Stripe charges per seat. When a tenant member joins (invitation accepted) or leaves (removeMember), Cashier must update the subscription quantity to match the actual member count. The webhook listener handles payment success/failure notifications for future extensibility.

Output: syncSeatCount() in TenantController wired to accept/removeMember, StripeEventListener for invoice events.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/02-stripe-subscription-per-seat-billing/02-RESEARCH.md

<interfaces>
<!-- Relevant TenantController methods (post-Phase-1) -->

TenantController::accept() — handles invitation acceptance:
```php
public function accept(Request $request): RedirectResponse
{
    // ... validates token, finds invitation ...
    $inv->acceptFor($user);
    // syncSeatCount must be called HERE, after acceptFor
    return redirect()->route('dashboard');
}
```

TenantController::removeMember() — removes a member:
```php
public function removeMember(Request $request, Tenant $tenant, User $member): RedirectResponse
{
    $tenant->members()->detach($member->id);
    // syncSeatCount must be called HERE, after detach
    return back()->with('success', 'Member removed.');
}
```

Cashier seat quantity API (available after Plan 01):
```php
// Always guard before calling — subscription may not exist (trial tenants)
if ($tenant->subscribed('default')) {
    $count = $tenant->members()->count();
    $tenant->subscription('default')->updateQuantity($count);
}
```

Cashier webhook events:
- Cashier auto-registers /stripe/webhook route
- Dispatches Laravel\Cashier\Events\WebhookReceived for every event
- Cashier itself handles: customer.subscription.created/updated/deleted, customer.updated/deleted
- Custom handling needed for: invoice.payment_succeeded, invoice.payment_failed
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: syncSeatCount() in TenantController — wire to accept and removeMember</name>
  <files>app/Http/Controllers/TenantController.php</files>
  <action>
Add a private `syncSeatCount()` method to TenantController. Place it near the bottom of the class, before the closing brace:

```php
private function syncSeatCount(Tenant $tenant): void
{
    if (! $tenant->subscribed('default')) {
        return; // Generic trial — no Cashier subscription object exists yet
    }

    $count = $tenant->members()->count();
    $tenant->subscription('default')->updateQuantity($count);
}
```

**Wire to accept() method:**
Find the `accept()` method. After the line `$inv->acceptFor($user);` and before the return statement, add:

```php
// Sync seat count after member joins
$this->syncSeatCount($inv->tenant);
```

Note: `$inv->tenant` should be the Tenant instance from the invitation. If `$inv->tenant` is not loaded at that point, load it with `$inv->load('tenant')` first, or use `Tenant::find($inv->tenant_id)`. Check the exact variable name in the existing accept() method.

**Wire to removeMember() method:**
Find the `removeMember()` method. After the `$tenant->members()->detach($member->id)` line and before the return, add:

```php
// Sync seat count after member removed
$this->syncSeatCount($tenant);
```

No changes to any other methods. Do NOT add syncSeatCount() calls to the invite() method — seat count increases only when the invitation is accepted, not when it is sent.
  </action>
  <verify>
    <automated>php -l app/Http/Controllers/TenantController.php && grep -n 'syncSeatCount' app/Http/Controllers/TenantController.php</automated>
  </verify>
  <done>
    - TenantController.php parses without PHP errors
    - `grep syncSeatCount` shows 3 occurrences: method definition + 2 call sites (accept + removeMember)
    - syncSeatCount() has the subscribed() guard before calling updateQuantity()
  </done>
</task>

<task type="auto">
  <name>Task 2: StripeEventListener for invoice events + registration</name>
  <files>
    app/Listeners/StripeEventListener.php
    app/Providers/EventServiceProvider.php
  </files>
  <action>
**Create app/Listeners/StripeEventListener.php:**

```php
<?php

namespace App\Listeners;

use Laravel\Cashier\Events\WebhookReceived;
use Illuminate\Support\Facades\Log;

class StripeEventListener
{
    public function handle(WebhookReceived $event): void
    {
        $type = $event->payload['type'] ?? '';

        match ($type) {
            'invoice.payment_succeeded' => $this->handlePaymentSucceeded($event->payload),
            'invoice.payment_failed'    => $this->handlePaymentFailed($event->payload),
            default                     => null,
        };
    }

    private function handlePaymentSucceeded(array $payload): void
    {
        $customerId = $payload['data']['object']['customer'] ?? null;
        Log::info('Stripe invoice payment succeeded', [
            'customer_id' => $customerId,
            'amount_paid' => $payload['data']['object']['amount_paid'] ?? null,
        ]);
        // Future: notify tenant owner of successful charge
    }

    private function handlePaymentFailed(array $payload): void
    {
        $customerId = $payload['data']['object']['customer'] ?? null;
        Log::warning('Stripe invoice payment failed', [
            'customer_id'   => $customerId,
            'attempt_count' => $payload['data']['object']['attempt_count'] ?? null,
        ]);
        // Future: notify tenant owner of failed payment, prompt card update
    }
}
```

**Register the listener:**

Check if `app/Providers/EventServiceProvider.php` exists. If it does, add to the `$listen` array:
```php
\Laravel\Cashier\Events\WebhookReceived::class => [
    \App\Listeners\StripeEventListener::class,
],
```

If `EventServiceProvider.php` does NOT exist (Laravel 11+ uses AppServiceProvider for event listening), add registration to `AppServiceProvider::boot()`:
```php
\Illuminate\Support\Facades\Event::listen(
    \Laravel\Cashier\Events\WebhookReceived::class,
    \App\Listeners\StripeEventListener::class,
);
```

Add the `use Illuminate\Support\Facades\Event;` import to AppServiceProvider if needed.

To check whether EventServiceProvider exists:
```bash
ls app/Providers/
```
  </action>
  <verify>
    <automated>php -l app/Listeners/StripeEventListener.php && php artisan event:list 2>&1 | grep -i webhook || echo "event:list may require full app boot"</automated>
  </verify>
  <done>
    - app/Listeners/StripeEventListener.php parses without errors
    - StripeEventListener handles invoice.payment_succeeded and invoice.payment_failed
    - Listener is registered against WebhookReceived event (either via EventServiceProvider $listen array or AppServiceProvider Event::listen)
    - Log statements exist for both success and failure paths
  </done>
</task>

</tasks>

<verification>
```bash
php artisan test --stop-on-failure 2>&1 | tail -20
php -l app/Http/Controllers/TenantController.php
php -l app/Listeners/StripeEventListener.php
```
All pre-existing tests pass. Both files parse cleanly.
</verification>

<success_criteria>
- TenantController::syncSeatCount() exists with subscribed() guard
- syncSeatCount() called in accept() after member joins
- syncSeatCount() called in removeMember() after member removed
- StripeEventListener exists and handles invoice.payment_succeeded + invoice.payment_failed
- Listener is registered and will receive WebhookReceived events dispatched by Cashier
- No null pointer risk: updateQuantity() is only called when $tenant->subscribed() is true
</success_criteria>

<output>
After completion, create `.planning/phases/02-stripe-subscription-per-seat-billing/03-seat-sync-webhooks-SUMMARY.md` with what was built, files modified, and any deviations.
</output>
