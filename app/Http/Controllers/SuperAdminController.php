<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function licenses(Request $request): Response
    {
        $tenants = Tenant::with(['owner:id,name,email'])
            ->withCount('members')
            ->orderBy('name')
            ->get()
            ->map(fn (Tenant $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'owner_name' => $t->owner?->name,
                'owner_email' => $t->owner?->email,
                'members_count' => $t->members_count,
                'sponsored_until' => $t->sponsored_until?->toDateString(),
                'sponsor_note' => $t->sponsor_note,
                'is_sponsored' => $t->isSponsored(),
                'has_subscription' => false,
                'trial_ends_at' => $t->trial_ends_at?->toDateString(),
            ]);

        // Check subscriptions (may fail if Stripe not configured)
        $tenants = $tenants->map(function ($t) {
            try {
                $tenant = Tenant::find($t['id']);
                $t['has_subscription'] = $tenant->subscribed('default');
            } catch (\Throwable) {}
            return $t;
        });

        return Inertia::render('admin/licenses', [
            'tenants' => $tenants->values(),
        ]);
    }

    public function updateSponsor(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'sponsored_until' => ['nullable', 'date'],
            'sponsor_note' => ['nullable', 'string', 'max:500'],
        ]);

        $tenant->update([
            'sponsored_until' => $validated['sponsored_until'],
            'sponsor_note' => $validated['sponsor_note'] ?? null,
        ]);

        $action = $validated['sponsored_until'] ? 'Lizenz freigeschaltet' : 'Lizenz entzogen';

        return redirect()->route('admin.licenses')
            ->with('success', "{$action} für {$tenant->name}.");
    }

    public function sponsorDomain(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'domain' => ['required', 'string', 'max:255'],
            'sponsored_until' => ['required', 'date'],
            'sponsor_note' => ['nullable', 'string', 'max:500'],
        ]);

        $domain = strtolower(trim($validated['domain']));

        // Find all tenants owned by users with matching email domain
        $ownerIds = User::where('email', 'like', "%@{$domain}")
            ->pluck('id');

        $count = Tenant::whereIn('owner_user_id', $ownerIds)
            ->update([
                'sponsored_until' => $validated['sponsored_until'],
                'sponsor_note' => $validated['sponsor_note'] ?? "Domain-Lizenz: @{$domain}",
            ]);

        return redirect()->route('admin.licenses')
            ->with('success', "{$count} Tenant(s) der Domain @{$domain} freigeschaltet.");
    }
}
