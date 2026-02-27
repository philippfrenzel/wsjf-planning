<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Standard: Für jeden neuen Benutzer einen eigenen Tenant anlegen
        $tenant = Tenant::create([
            'name' => ($user->name ?: $user->email) . ' Tenant',
            'owner_user_id' => $user->id,
        ]);

        // Set default and current tenant
        $user->tenant_id = $tenant->id;
        $user->current_tenant_id = $tenant->id;
        $user->save();

        // Add membership for own tenant
        $user->tenants()->syncWithoutDetaching([$tenant->id]);

        event(new Registered($user));

        Auth::login($user);

        // Process pending invitation token stored in session by the accept route
        if ($token = $request->session()->pull('tenant_invitation_token')) {
            $inv = TenantInvitation::where('token', $token)
                ->whereNull('accepted_at')
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->first();
            if ($inv && $inv->email === $user->email) {
                $inv->acceptFor($user);
            }
        }

        // ROLE-01/03: ensure the owner of any newly created tenant is assigned Admin role
        DB::table('tenant_user')
            ->where('user_id', $user->id)
            ->whereNull('role')
            ->update(['role' => 'Admin']);

        return redirect(route('dashboard', absolute: false));
    }
}
