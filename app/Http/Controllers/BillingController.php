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
            'billingStatus'  => 'active',
            'trialEndsAt'    => null,
            'trialDaysLeft'  => null,
            'upgradePrompt'  => false,
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
