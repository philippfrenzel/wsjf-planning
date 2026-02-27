<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // SuperAdmin is exempt from all billing enforcement (ENF-02)
        if ($user?->isSuperAdmin()) {
            return $next($request);
        }

        $tenant = $user?->currentTenant;

        // No tenant: cannot have a subscription — block
        if ($tenant === null) {
            return $this->denyAccess($request);
        }

        // Allow if: active subscription, generic trial, or on grace period after cancellation
        $allowed = $tenant->subscribed('default')
            || $tenant->onGenericTrial()
            || ($tenant->subscription('default')?->onGracePeriod() ?? false);

        if ($allowed) {
            return $next($request);
        }

        return $this->denyAccess($request);
    }

    private function denyAccess(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => 'An active subscription is required.'], 402);
        }

        return redirect()->route('billing.index')
            ->with('upgrade_prompt', true);
    }
}
