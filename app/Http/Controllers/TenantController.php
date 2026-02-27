<?php

namespace App\Http\Controllers;

use App\Mail\TenantInvitationMail;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verified'])->except('accept');
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
            ->with([
                'members' => function ($q) {
                    $q->select('users.id', 'users.name', 'users.email')->withPivot('role');
                },
                'invitations' => function ($q) {
                    $q->select('id', 'tenant_id', 'email', 'accepted_at', 'created_at');
                },
            ])
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
        $invitation = TenantInvitation::create([
            'tenant_id' => $tenant->id,
            'email' => $request->email,
            'inviter_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        Mail::queue(new TenantInvitationMail($invitation));

        return back()->with('success', 'Einladung erstellt. Token: ' . $token);
    }

    public function revokeInvitation(Request $request, Tenant $tenant, TenantInvitation $invitation): RedirectResponse
    {
        $user = Auth::user();

        if ($tenant->owner_user_id !== $user->id) {
            abort(403);
        }

        if ($invitation->tenant_id !== $tenant->id) {
            abort(404);
        }

        if ($invitation->accepted_at) {
            return back()->with('error', 'Diese Einladung wurde bereits angenommen und kann nicht zurückgezogen werden.');
        }

        $invitation->delete();

        return back()->with('success', 'Einladung wurde zurückgezogen.');
    }

    public function updateMemberRole(Request $request, Tenant $tenant, User $member): RedirectResponse
    {
        $request->validate(['role' => 'required|in:Admin,Planner,Voter']);

        if (!$tenant->members()->where('users.id', $member->id)->exists()) {
            abort(404, 'Member not found in this tenant.');
        }

        DB::table('tenant_user')
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $member->id)
            ->update(['role' => $request->role]);

        return back()->with('success', 'Role updated.');
    }

    public function removeMember(Request $request, Tenant $tenant, User $member): RedirectResponse
    {
        if (Auth::id() === $member->id) {
            return back()->withErrors(['member' => 'You cannot remove yourself from the tenant.']);
        }

        $tenant->members()->detach($member->id);

        if ($member->current_tenant_id === $tenant->id) {
            $member->forceFill(['current_tenant_id' => null])->save();
        }

        return back()->with('success', 'Member removed.');
    }

    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $request->validate(['name' => 'required|string|min:2|max:100']);

        $tenant->update(['name' => $request->name]);

        return back()->with('success', 'Tenant name updated.');
    }

    public function accept(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $inv = TenantInvitation::where('token', $request->token)
            ->whereNull('accepted_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        if (!Auth::check()) {
            $request->session()->put('tenant_invitation_token', $inv->token);

            return redirect()->route('login')->with('status', 'Bitte melde dich an, um die Einladung anzunehmen.');
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($inv->email !== $user->email) {
            abort(403, 'Invitation is for a different email');
        }

        $inv->acceptFor($user);

        $request->session()->forget('tenant_invitation_token');

        return back()->with('success', 'Einladung akzeptiert und Tenant gewechselt.');
    }
}
