<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(): Response
    {
        $user = Auth::user();
        $tenants = $user->tenants()
            ->with(['members' => function ($q) {
                $q->select('users.id', 'users.name', 'users.email');
            }])
            ->get(['tenants.id', 'tenants.name']);

        $owned = Tenant::where('owner_user_id', $user->id)
            ->with(['members' => function ($q) {
                $q->select('users.id', 'users.name', 'users.email');
            }])
            ->get(['id', 'name']);
        $invitations = TenantInvitation::where('email', $user->email)
            ->whereNull('accepted_at')
            ->select('id', 'tenant_id', 'email', 'token', 'expires_at')
            ->with('tenant:id,name')
            ->get();

        return Inertia::render('tenants/index', [
            'tenants' => $tenants,
            'ownedTenants' => $owned,
            'currentTenantId' => $user->current_tenant_id,
            'pendingInvitations' => $invitations,
        ]);
    }

    public function switch(Request $request, Tenant $tenant): RedirectResponse
    {
        $user = Auth::user();

        // Prüfen, ob User Mitglied ist
        if (!$user->tenants()->where('tenants.id', $tenant->id)->exists()) {
            abort(403, 'Not a member of this tenant');
        }

        $user->current_tenant_id = $tenant->id;
        $user->save();

        return back()->with('success', 'Tenant gewechselt.');
    }

    public function invite(Request $request, Tenant $tenant): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = Auth::user();
        if (!$user->tenants()->where('tenants.id', $tenant->id)->exists()) {
            abort(403);
        }

        $token = Str::uuid()->toString();
        TenantInvitation::create([
            'tenant_id' => $tenant->id,
            'email' => $request->email,
            'inviter_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        return back()->with('success', 'Einladung erstellt. Token: ' . $token);
    }

    public function accept(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $inv = TenantInvitation::where('token', $request->token)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        $user = Auth::user();
        if ($inv->email !== $user->email) {
            abort(403, 'Invitation is for a different email');
        }

        // Mitgliedschaft hinzufügen
        $user->tenants()->syncWithoutDetaching([$inv->tenant_id]);
        $inv->accepted_at = now();
        $inv->save();

        // Optional: direkt zu diesem Tenant wechseln
        $user->current_tenant_id = $inv->tenant_id;
        $user->save();

        return back()->with('success', 'Einladung akzeptiert und Tenant gewechselt.');
    }
}
