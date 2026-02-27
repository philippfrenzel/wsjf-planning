---
phase: 02-stripe-subscription-per-seat-billing
plan: 02
type: execute
wave: 2
depends_on: [01-cashier-foundation-PLAN.md]
files_modified:
  - app/Http/Controllers/BillingController.php
  - routes/web.php
  - resources/js/pages/billing/index.tsx
  - resources/js/types/index.d.ts
  - .env.example
autonomous: true
requirements: [BILL-04, BILL-06, ENF-01]

must_haves:
  truths:
    - "BillingController exists with index, checkout, success, and portal methods"
    - "GET /billing shows subscription status, trial countdown, or upgrade prompt (ENF-01 fulfilled on billing page)"
    - "GET /billing/checkout redirects tenant owner to Stripe Checkout for subscription creation (BILL-04)"
    - "GET /billing/portal redirects tenant owner to Stripe Billing Portal (BILL-06)"
    - "Billing routes are auth+verified protected but NOT behind subscribed middleware"
    - "Inertia billing page receives billingStatus prop with trial/active/inactive state"
  artifacts:
    - app/Http/Controllers/BillingController.php
    - resources/js/pages/billing/index.tsx
  key_links:
    - "BillingController::checkout() calls $tenant->newSubscription('default', config('services.stripe.price_id'))->checkout([...])"
    - "BillingController::portal() calls $tenant->redirectToBillingPortal(route('dashboard'))"
    - "billing.index Inertia page shows upgrade_prompt=true when $page.props.billingStatus === 'inactive'"
    - "Success URL after Stripe Checkout: route('billing.success'); cancel URL: route('billing.index')"
---

<objective>
Create the BillingController with checkout/portal/success flows, add billing routes, and build the billing Inertia page that displays subscription status, trial countdown, and upgrade prompts.

Purpose: This is the user-facing billing surface. Tenant owners must be able to start a subscription via Stripe Checkout (BILL-04) and manage it via the Stripe Billing Portal (BILL-06). The billing index page also serves as the upgrade landing page for the enforcement middleware (ENF-01).

Output: BillingController, billing routes, billing Inertia page with status display and action buttons.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/02-stripe-subscription-per-seat-billing/02-RESEARCH.md

<interfaces>
<!-- Post-Plan-01 state: Cashier is installed, Tenant has Billable trait -->

Cashier status methods available on Tenant:
```php
$tenant->subscribed('default')          // active OR on grace period
$tenant->onTrial()                       // generic or subscription trial
$tenant->onGenericTrial()               // generic trial (no subscription object)
$tenant->subscription('default')?->onGracePeriod() // canceled but not expired
$tenant->subscription('default')?->canceled()       // canceled
```

User::currentTenant() relationship:
```php
// User model — returns BelongsTo Tenant via current_tenant_id
$request->user()->currentTenant  // Tenant instance (Eloquent relationship)
```

Existing auth structure in routes/web.php:
```php
Route::middleware(['auth', 'verified'])->group(function () {
    // existing routes
});
```

Existing tenant index route:
```php
Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
```

HandleInertiaRequests shared props (for reference):
- auth.user, auth.currentRole, auth.isSuperAdmin are already shared

TypeScript types in resources/js/types/index.d.ts — Auth interface must be referenced but not broken.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: BillingController + billing routes</name>
  <files>
    app/Http/Controllers/BillingController.php
    routes/web.php
    .env.example
  </files>
  <action>
**Create app/Http/Controllers/BillingController.php:**

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(Request $request): Response
    {
        $tenant = $request->user()->currentTenant;

        $billingStatus = match(true) {
            $tenant === null => 'no_tenant',
            $tenant->subscribed('default') => 'active',
            $tenant->onGenericTrial() => 'trial',
            default => 'inactive',
        };

        $trialEndsAt = $tenant?->trial_ends_at?->toDateString();
        $trialDaysLeft = $tenant?->onGenericTrial()
            ? (int) now()->diffInDays($tenant->trial_ends_at, false)
            : null;

        return Inertia::render('billing/index', [
            'billingStatus' => $billingStatus,
            'trialEndsAt'   => $trialEndsAt,
            'trialDaysLeft' => $trialDaysLeft,
            'upgradePrompt' => session('upgrade_prompt', false),
        ]);
    }

    public function checkout(Request $request): mixed
    {
        $tenant = $request->user()->currentTenant;

        abort_if($tenant === null, 403, 'No active tenant.');

        return $tenant
            ->newSubscription('default', config('services.stripe.price_id'))
            ->checkout([
                'success_url' => route('billing.success'),
                'cancel_url'  => route('billing.index'),
            ]);
    }

    public function success(Request $request): Response
    {
        return Inertia::render('billing/index', [
            'billingStatus' => 'active',
            'trialEndsAt'   => null,
            'trialDaysLeft' => null,
            'upgradePrompt' => false,
            'successMessage' => 'Subscription activated successfully!',
        ]);
    }

    public function portal(Request $request): RedirectResponse
    {
        $tenant = $request->user()->currentTenant;

        abort_if($tenant === null, 403, 'No active tenant.');
        abort_unless($tenant->hasStripeId(), 402, 'No billing account found. Please subscribe first.');

        return $tenant->redirectToBillingPortal(route('dashboard'));
    }
}
```

**Update routes/web.php:**
Find the `Route::middleware(['auth', 'verified'])->group` block that currently contains the plans/subscribe routes. Inside that group (or in a new group with the same middleware), add billing routes:

```php
// Billing routes (auth + verified; NOT behind subscribed middleware)
Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
Route::get('billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');
Route::get('billing/success', [BillingController::class, 'success'])->name('billing.success');
Route::get('billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
```

Add the import at the top of routes/web.php:
```php
use App\Http\Controllers\BillingController;
```

**Update .env.example** — add Stripe env stubs after any existing entries:
```dotenv
STRIPE_KEY=pk_test_
STRIPE_SECRET=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_
CASHIER_CURRENCY=eur
CASHIER_CURRENCY_LOCALE=de_DE
```

Also add to `config/services.php` under the `'stripe'` key (create the key if it doesn't exist):
```php
'stripe' => [
    'key'       => env('STRIPE_KEY'),
    'secret'    => env('STRIPE_SECRET'),
    'webhook'   => ['secret' => env('STRIPE_WEBHOOK_SECRET')],
    'price_id'  => env('STRIPE_PRICE_ID'),
],
```
If the `stripe` key already exists in services.php, add only the missing `price_id` line.
  </action>
  <verify>
    <automated>php artisan route:list --name=billing 2>&1 | grep billing && php -l app/Http/Controllers/BillingController.php</automated>
  </verify>
  <done>
    - `php artisan route:list --name=billing` shows 4 billing routes (index, checkout, success, portal)
    - BillingController.php parses without PHP errors
    - routes/web.php imports BillingController
    - .env.example has Stripe key stubs
  </done>
</task>

<task type="auto">
  <name>Task 2: Billing Inertia page — status display, trial countdown, upgrade prompt</name>
  <files>
    resources/js/pages/billing/index.tsx
    resources/js/types/index.d.ts
  </files>
  <action>
**Create resources/js/pages/billing/index.tsx:**

The page receives these props from BillingController::index():
- `billingStatus`: 'active' | 'trial' | 'inactive' | 'no_tenant'
- `trialEndsAt`: string | null (ISO date)
- `trialDaysLeft`: number | null
- `upgradePrompt`: boolean (true when redirected from RequireSubscription middleware)
- `successMessage`: string | undefined

Use existing component conventions: import from `@/components/ui/*` (shadcn components), use `AppLayout` from `@/layouts/app-layout`, use the `Head` component from `@inertiajs/react`.

```tsx
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';

interface BillingPageProps {
    billingStatus: 'active' | 'trial' | 'inactive' | 'no_tenant';
    trialEndsAt: string | null;
    trialDaysLeft: number | null;
    upgradePrompt: boolean;
    successMessage?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
];

export default function BillingPage({
    billingStatus,
    trialEndsAt,
    trialDaysLeft,
    upgradePrompt,
    successMessage,
}: BillingPageProps) {
    const statusLabel = {
        active: 'Active',
        trial: `Free Trial${trialDaysLeft !== null ? ` (${trialDaysLeft} days left)` : ''}`,
        inactive: 'Inactive',
        no_tenant: 'No Tenant',
    }[billingStatus];

    const statusVariant = {
        active: 'default',
        trial: 'secondary',
        inactive: 'destructive',
        no_tenant: 'destructive',
    }[billingStatus] as 'default' | 'secondary' | 'destructive';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Billing & Subscription</h1>
                </div>

                {upgradePrompt && billingStatus !== 'active' && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            Your subscription is inactive. Subscribe to access all features.
                        </AlertDescription>
                    </Alert>
                )}

                {successMessage && (
                    <Alert>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            Subscription Status
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {billingStatus === 'trial' && trialEndsAt &&
                                `Your free trial ends on ${new Date(trialEndsAt).toLocaleDateString()}.`}
                            {billingStatus === 'active' &&
                                'Your subscription is active. Seats are billed per team member.'}
                            {billingStatus === 'inactive' &&
                                'Your trial has ended or subscription is cancelled. Subscribe to continue using the app.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        {billingStatus !== 'active' && (
                            <Button asChild>
                                <Link href="/billing/checkout">Subscribe Now</Link>
                            </Button>
                        )}
                        {billingStatus === 'active' && (
                            <Button variant="outline" asChild>
                                <Link href="/billing/portal">Manage Billing</Link>
                            </Button>
                        )}
                        {billingStatus === 'trial' && (
                            <Button variant="outline" asChild>
                                <Link href="/billing/checkout">Add Payment Method</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
```

Check if `resources/js/types/index.d.ts` already exports `BreadcrumbItem` — if not, no change needed to types file (the import would fail — use whatever the project's breadcrumb type is called, check existing pages like tenants/index.tsx for the correct import path).

Verify that `AppLayout` import path and `BreadcrumbItem` match the pattern in `resources/js/pages/tenants/index.tsx` exactly. Do not assume — check the tenants page first and copy its layout/breadcrumb import pattern verbatim.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep billing/index || echo "No billing TS errors"</automated>
  </verify>
  <done>
    - `resources/js/pages/billing/index.tsx` exists
    - TypeScript compiles without errors in billing/index.tsx
    - The page shows subscription status badge, upgrade prompt alert when upgradePrompt=true, checkout button when not active, portal button when active
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 3: Human verify — billing page renders and Stripe links work</name>
  <files></files>
  <action>
Verify the billing feature end-to-end:

1. Navigate to `/billing` while logged in — should see subscription status card
2. For a new tenant (in trial): should see "Free Trial (N days left)" badge and "Add Payment Method" button
3. The upgrade prompt alert appears when `?upgrade_prompt=1` is set in session (simulate by manually visiting `/billing` with `session(['upgrade_prompt' => true])`)
4. Clicking "Subscribe Now" redirects to Stripe Checkout (requires STRIPE_KEY and STRIPE_PRICE_ID in .env — if not set, graceful error is acceptable)
5. Clicking "Manage Billing" (when active) redirects to Stripe portal (requires stripe_id on tenant — acceptable error if none)

**If Stripe .env vars are not configured:** Billing page renders correctly with status card and buttons. Stripe redirect may fail with a config error — that is acceptable at this stage (Stripe keys are set up by human operator).
  </action>
  <verify>
    <automated>php artisan route:list --name=billing 2>&1</automated>
  </verify>
  <done>Billing page renders without 500 errors. Status card, badge, and buttons display correctly based on billingStatus prop. Upgrade prompt alert shows when upgradePrompt=true.</done>
</task>

</tasks>

<verification>
```bash
php artisan test --stop-on-failure 2>&1 | tail -20
npm run build 2>&1 | tail -10
```
All tests pass. Frontend builds without TypeScript errors.
</verification>

<success_criteria>
- 4 billing routes exist: billing.index, billing.checkout, billing.success, billing.portal
- BillingController methods: index returns Inertia response, checkout calls newSubscription()->checkout(), portal calls redirectToBillingPortal()
- Billing page renders with status badge (active/trial/inactive), conditional action buttons, and upgrade alert when prompted
- No existing tests broken
- TypeScript compiles cleanly for billing/index.tsx
</success_criteria>

<output>
After completion, create `.planning/phases/02-stripe-subscription-per-seat-billing/02-billing-controller-ui-SUMMARY.md` with what was built, files modified, and any deviations.
</output>
