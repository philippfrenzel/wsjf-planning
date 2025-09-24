<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TenantInvitation;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        $token = $request->session()->pull('tenant_invitation_token');

        if ($token && $user) {
            $invitation = TenantInvitation::where('token', $token)
                ->whereNull('accepted_at')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->first();

            if (!$invitation) {
                $request->session()->flash('error', 'Die Einladung ist ungültig oder abgelaufen.');
            } elseif ($invitation->email !== $user->email) {
                $request->session()->flash('error', 'Die Einladung ist für eine andere E-Mail-Adresse bestimmt.');
            } elseif (!$user->hasVerifiedEmail()) {
                // Einladung erneut im Session-State speichern, damit sie nach der Verifizierung angenommen werden kann
                $request->session()->put('tenant_invitation_token', $token);
                $request->session()->flash('error', 'Bitte verifiziere deine E-Mail-Adresse, um die Einladung anzunehmen.');
            } else {
                $invitation->acceptFor($user);
                $request->session()->flash('success', 'Einladung akzeptiert und Tenant gewechselt.');
            }
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
