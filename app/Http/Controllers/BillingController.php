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
                $tenant->isSponsored() => 'sponsored',
                $tenant->onGenericTrial() => 'trial',
                default => 'inactive',
            };
        } catch (\Throwable $e) {
            report($e);
            $billingStatus = match(true) {
                $tenant === null => 'no_tenant',
                $tenant->isSponsored() => 'sponsored',
                default => 'inactive',
            };
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
            && config('services.stripe.price_id') !== 'price_'
            && str_starts_with(config('services.stripe.price_id'), 'price_')
            && strlen(config('services.stripe.price_id')) > 10;

        // Fetch invoices from Stripe
        $invoices = [];
        if ($tenant && $tenant->hasStripeId() && $stripeConfigured) {
            try {
                $invoices = $tenant->invoices()->map(fn ($invoice) => [
                    'id'          => $invoice->id,
                    'date'        => $invoice->date()->toDateString(),
                    'total'       => $invoice->total(),
                    'status'      => $invoice->status ?? ($invoice->paid ? 'paid' : 'open'),
                    'number'      => $invoice->number,
                    'pdf_url'     => $invoice->invoicePdf(),
                ])->toArray();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return Inertia::render('billing/index', [
            'billingStatus'    => $billingStatus,
            'trialEndsAt'      => $trialEndsAt,
            'trialDaysLeft'    => $trialDaysLeft,
            'sponsoredUntil'   => $tenant?->sponsored_until?->toDateString(),
            'sponsorNote'      => $tenant?->sponsor_note,
            'upgradePrompt'    => session('upgrade_prompt', false),
            'stripeConfigured' => $stripeConfigured,
            'invoices'         => $invoices,
        ]);
    }

    public function checkout(Request $request): mixed
    {
        $tenant = $request->user()->currentTenant;

        abort_if($tenant === null, 403, 'No active tenant.');

        $priceId = config('services.stripe.price_id');
        if (empty($priceId) || $priceId === 'price_') {
            return redirect()->route('billing.index')
                ->with('error', 'STRIPE_PRICE_ID ist nicht gesetzt. Bitte hinterlege eine gültige Stripe Price ID (beginnt mit price_...) in deiner Umgebungskonfiguration.');
        }

        if (!str_starts_with($priceId, 'price_') || strlen($priceId) < 10) {
            return redirect()->route('billing.index')
                ->with('error', "Ungültige STRIPE_PRICE_ID: \"{$priceId}\". Die Price ID muss mit \"price_\" beginnen. Hinweis: Eine Product ID (prod_...) ist nicht dasselbe wie eine Price ID.");
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
