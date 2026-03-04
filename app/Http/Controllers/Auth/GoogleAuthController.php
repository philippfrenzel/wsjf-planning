<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();
        $email = strtolower((string) $googleUser->getEmail());

        if ($email === '') {
            return redirect()->route('login')->with('error', 'Google hat keine E-Mail-Adresse bereitgestellt.');
        }

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        if ($user) {
            $updates = [];

            if (!$user->google_id) {
                $updates['google_id'] = $googleUser->getId();
            }

            if (!$user->email_verified_at) {
                $updates['email_verified_at'] = now();
            }

            if (!$user->name && $googleUser->getName()) {
                $updates['name'] = $googleUser->getName();
            }

            if (!empty($updates)) {
                $user->forceFill($updates)->save();
            }
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: 'Google User',
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'password' => Hash::make(Str::password(32)),
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();

            $tenant = Tenant::create([
                'name' => ($user->name ?: $user->email) . ' Tenant',
                'owner_user_id' => $user->id,
                'trial_ends_at' => now()->addDays(14),
            ]);

            $user->tenant_id = $tenant->id;
            $user->current_tenant_id = $tenant->id;
            $user->save();

            $user->tenants()->syncWithoutDetaching([$tenant->id]);

            DB::table('tenant_user')
                ->where('user_id', $user->id)
                ->whereNull('role')
                ->update(['role' => 'Admin']);

            event(new Registered($user));
        }

        Auth::login($user, true);
        $this->handlePendingInvitation($request, $user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function handlePendingInvitation(Request $request, User $user): void
    {
        $token = $request->session()->pull('tenant_invitation_token');

        if (!$token) {
            return;
        }

        $invitation = TenantInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$invitation) {
            $request->session()->flash('error', 'Die Einladung ist ungültig oder abgelaufen.');
            return;
        }

        if ($invitation->email !== $user->email) {
            $request->session()->flash('error', 'Die Einladung ist für eine andere E-Mail-Adresse bestimmt.');
            return;
        }

        $invitation->acceptFor($user);
        $request->session()->flash('success', 'Einladung akzeptiert und Tenant gewechselt.');
    }
}
