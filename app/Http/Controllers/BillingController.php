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

        try {
            $billingStatus = match(true) {
                $tenant === null => 'no_tenant',
                $tenant->subscribed('default') => 'active',
                $tenant->onGenericTrial() => 'trial',
                default => 'inactive',
            };
        } catch (\Throwable $e) {
            report($e);
            $billingStatus = $tenant === null ? 'no_tenant' : 'inactive';
        }

        $trialEndsAt = $tenant?->trial_ends_at?->toDateString();
        $trialDaysLeft = null;
        try {
            $trialDaysLeft = $tenant?->onGenericTrial()
                ? (int) now()->diffInDays($tenant->trial_ends_at, false)
                : null;
        } catch (\Throwable) {
            // Cashier not fully configured
        }

        $stripeConfigured = !empty(config('cashier.secret'))
            && config('cashier.secret') !== 'sk_test_'
            && !empty(config('services.stripe.price_id'))
            && config('services.stripe.price_id') !== 'price_';

        return Inertia::render('billing/index', [
            'billingStatus'    => $billingStatus,
            'trialEndsAt'      => $trialEndsAt,
            'trialDaysLeft'    => $trialDaysLeft,
            'upgradePrompt'    => session('upgrade_prompt', false),
            'stripeConfigured' => $stripeConfigured,
        ]);
    }

    public function checkout(Request $request): mixed
    {
        $tenant = $request->user()->currentTenant;

        abort_if($tenant === null, 403, 'No active tenant.');

        $priceId = config('services.stripe.price_id');
        if (empty($priceId) || $priceId === 'price_') {
            return redirect()->route('billing.index')
                ->with('error', 'Stripe is not configured. Please set STRIPE_PRICE_ID in your environment.');
        }

        try {
            return $tenant
                ->newSubscription('default', $priceId)
                ->checkout([
                    'success_url' => route('billing.success'),
                    'cancel_url'  => route('billing.index'),
                ]);
        } catch (\Throwable $e) {
            report($e);
            return redirect()->route('billing.index')
                ->with('error', 'Stripe checkout failed: ' . $e->getMessage());
        }
    }

    public function success(Request $request): Response
    {
        return Inertia::render('billing/index', [
            'billingStatus'    => 'active',
            'trialEndsAt'      => null,
            'trialDaysLeft'    => null,
            'upgradePrompt'    => false,
            'successMessage'   => 'Subscription activated successfully!',
            'stripeConfigured' => true,
        ]);
    }

    public function portal(Request $request): RedirectResponse
    {
        $tenant = $request->user()->currentTenant;

        abort_if($tenant === null, 403, 'No active tenant.');

        if (!$tenant->hasStripeId()) {
            return redirect()->route('billing.index')
                ->with('error', 'No billing account found. Please subscribe first.');
        }

        try {
            return $tenant->redirectToBillingPortal(route('dashboard'));
        } catch (\Throwable $e) {
            report($e);
            return redirect()->route('billing.index')
                ->with('error', 'Stripe portal access failed: ' . $e->getMessage());
        }
    }
}
