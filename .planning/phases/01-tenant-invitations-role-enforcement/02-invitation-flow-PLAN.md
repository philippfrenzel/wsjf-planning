---
phase: 01-tenant-invitations-role-enforcement
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - app/Mail/TenantInvitationMail.php
  - resources/views/mail/tenant-invitation.blade.php
  - app/Http/Controllers/TenantController.php
  - app/Models/TenantInvitation.php
  - app/Http/Controllers/Auth/RegisteredUserController.php
autonomous: true
requirements: [INV-01, INV-02, INV-03, INV-05]

must_haves:
  truths:
    - "Inviting a user by email dispatches a queued email with a signed invitation link"
    - "The invitation link contains the token stored in tenant_invitations.token"
    - "An existing user clicking the link and logging in is added to the tenant with role='Voter'"
    - "A new user clicking the link, registering, and logging in is added to the tenant with role='Voter'"
    - "acceptFor() sets tenant_user.role = 'Voter' for the accepted user"
    - "acceptFor() is atomic — race conditions handled via transactional update-check"
  artifacts:
    - app/Mail/TenantInvitationMail.php
    - resources/views/mail/tenant-invitation.blade.php
    - app/Http/Controllers/TenantController.php (invite() sends mail)
    - app/Models/TenantInvitation.php (acceptFor() assigns Voter, race-safe)
    - app/Http/Controllers/Auth/RegisteredUserController.php (processes invitation token post-registration)
  key_links:
    - "TenantController::invite() → Mail::queue(new TenantInvitationMail($invitation))"
    - "TenantInvitation::acceptFor() → DB update sets role='Voter' after syncWithoutDetaching"
    - "RegisteredUserController::store() → pulls tenant_invitation_token from session after Auth::login(), calls acceptFor()"
    - "Invitation URL uses route('tenants.invitations.accept', ['token' => $invitation->token])"
---

<objective>
Complete the invitation delivery and acceptance flow end-to-end.

Purpose: INV-01/02/03/05 — owner sends invite → email delivered → new or existing user accepts → joins tenant as Voter. The controller and model stubs exist; this plan wires the missing pieces: email dispatch, Voter role assignment, and new-user registration path.

Output: TenantInvitationMail Mailable, blade email template, TenantController::invite() updated to send mail, TenantInvitation::acceptFor() updated to assign Voter role with race safety, RegisteredUserController updated to process invitation token after registration.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Key existing code the executor must work with. -->

From app/Models/TenantInvitation.php (current acceptFor — missing Voter assignment):
```php
public function acceptFor(User $user): void
{
    DB::transaction(function () use ($user) {
        $user->tenants()->syncWithoutDetaching([$this->tenant_id]);

        $this->forceFill(['accepted_at' => now()])->save();

        $user->forceFill(['current_tenant_id' => $this->tenant_id])->save();
    });
}
```

From app/Http/Controllers/TenantController.php (current invite() — missing email dispatch):
```php
public function invite(Request $request, Tenant $tenant): RedirectResponse
{
    // validation + TenantInvitation::create() already exists
    // Mail::queue() is missing
}
```

From app/Http/Controllers/Auth/RegisteredUserController.php (current store()):
```php
public function store(Request $request): RedirectResponse
{
    // ... validates, creates User, Auth::login($user) ...
    // After login: invitation token handling is MISSING
    return redirect(route('dashboard', absolute: false));
}
```

From app/Http/Controllers/Auth/AuthenticatedSessionController.php (already works — reference only):
```php
// After Auth::attempt(), the session token is processed:
if ($token = $request->session()->pull('tenant_invitation_token')) {
    $inv = TenantInvitation::where('token', $token)
        ->whereNull('accepted_at')
        ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
        ->first();
    if ($inv && $inv->email === $user->email) {
        $inv->acceptFor($user);
    }
}
```

Route that already exists for accept (verify it's in routes/web.php before creating):
```
GET /invitations/accept?token=... → TenantController@accept
```

Mail config (dev env): MAIL_MAILER=log (emails written to storage/logs/laravel.log — no real SMTP needed for dev/test)
Queue config: QUEUE_CONNECTION=sync (for tests); use Mail::queue() which respects the mailer
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: TenantInvitationMail Mailable + blade template</name>
  <files>app/Mail/TenantInvitationMail.php, resources/views/mail/tenant-invitation.blade.php</files>
  <action>
**Create app/Mail/TenantInvitationMail.php:**

```php
<?php

namespace App\Mail;

use App\Models\TenantInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TenantInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public TenantInvitation $invitation) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You have been invited to ' . $this->invitation->tenant->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.tenant-invitation',
        );
    }
}
```

**Create resources/views/mail/tenant-invitation.blade.php:**

A clean, minimal HTML email with:
- Greeting: "You have been invited to join {{ $invitation->tenant->name }}"
- Body: "{{ $invitation->inviter->name }} has invited you to join their WSJF Planning workspace."
- Accept button/link using `route('tenants.invitations.accept', ['token' => $invitation->token])`
- Note: "This invitation expires on {{ $invitation->expires_at?->format('d M Y') ?? 'no expiry' }}"
- Plain text fallback: include the URL directly after the button
- Use `$invitation` variable (automatically available in the view because the Mailable has a public `$invitation` property)

Keep the template simple — no external CSS frameworks, just inline styles for the button.
  </action>
  <verify>
    <automated>php -l app/Mail/TenantInvitationMail.php && php artisan tinker --execute="echo class_exists(App\Mail\TenantInvitationMail::class) ? 'ok' : 'fail';" 2>&1 | grep ok</automated>
  </verify>
  <done>TenantInvitationMail class loads without error. Blade template exists at resources/views/mail/tenant-invitation.blade.php with the accept link referencing the invitation token.</done>
</task>

<task type="auto">
  <name>Task 2: Wire email dispatch in TenantController::invite() and fix acceptFor()</name>
  <files>app/Http/Controllers/TenantController.php, app/Models/TenantInvitation.php</files>
  <action>
**In app/Http/Controllers/TenantController.php — update invite():**

After the `TenantInvitation::create([...])` call, add:
```php
\Illuminate\Support\Facades\Mail::queue(new \App\Mail\TenantInvitationMail($invitation));
```

Or add `use Illuminate\Support\Facades\Mail;` and `use App\Mail\TenantInvitationMail;` to the imports at the top of the file, then call `Mail::queue(new TenantInvitationMail($invitation));`.

Do NOT wrap in try/catch — let mail failures surface as exceptions so they are logged.

**In app/Models/TenantInvitation.php — update acceptFor():**

Replace the current `acceptFor()` method entirely with a race-safe version that assigns Voter role:

```php
public function acceptFor(User $user): void
{
    DB::transaction(function () use ($user) {
        // Atomic accept — prevents race condition on double-click
        $updated = DB::table('tenant_invitations')
            ->where('id', $this->id)
            ->whereNull('accepted_at')
            ->update(['accepted_at' => now()]);

        if ($updated === 0) {
            return; // Already accepted by a concurrent request — safe to exit
        }

        $user->tenants()->syncWithoutDetaching([$this->tenant_id]);

        // INV-05: Assign Voter role in the tenant_user pivot
        DB::table('tenant_user')
            ->where('tenant_id', $this->tenant_id)
            ->where('user_id', $user->id)
            ->update(['role' => 'Voter']);

        $user->forceFill(['current_tenant_id' => $this->tenant_id])->save();
    });
}
```

Note: The `accepted_at` is now updated inside the transaction via raw DB update (not forceFill on `$this`) — this is the race-safe pattern. The Eloquent model instance's `accepted_at` attribute will not be automatically updated; this is intentional for the atomic check.
  </action>
  <verify>
    <automated>php -l app/Http/Controllers/TenantController.php && php -l app/Models/TenantInvitation.php</automated>
  </verify>
  <done>Both files parse without errors. TenantController::invite() calls Mail::queue(). TenantInvitation::acceptFor() contains the DB::table update for accepted_at AND the tenant_user role='Voter' update.</done>
</task>

<task type="auto">
  <name>Task 3: Handle invitation token in RegisteredUserController after registration</name>
  <files>app/Http/Controllers/Auth/RegisteredUserController.php</files>
  <action>
In `RegisteredUserController::store()`, immediately after the `Auth::login($user)` call and before the `return redirect(...)`, add two blocks:

**Block A — invitation token path (user accepted an invite before registering):**
```php
// Process pending invitation token stored in session by the accept route
if ($token = $request->session()->pull('tenant_invitation_token')) {
    $inv = \App\Models\TenantInvitation::where('token', $token)
        ->whereNull('accepted_at')
        ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
        ->first();
    if ($inv && $inv->email === $user->email) {
        $inv->acceptFor($user);
    }
}
```

**Block B — new-tenant creation path (user registered without an invitation and a new tenant was created for them):**

After Block A, ensure any new tenant the user just created has them recorded with role='Admin' in the pivot. The tenant creation during registration leaves `role` NULL via `syncWithoutDetaching()`; patch it immediately:

```php
// ROLE-01/03: ensure the owner of any newly created tenant is assigned Admin role
DB::table('tenant_user')
    ->where('user_id', $user->id)
    ->whereNull('role')
    ->update(['role' => 'Admin']);
```

Add `use App\Models\TenantInvitation;` and `use Illuminate\Support\Facades\DB;` to imports if not already present (use the short class name rather than inline fully-qualified names — whichever style matches the file's existing imports).

Do NOT modify the validation logic, user creation, or the final redirect. Only add the two blocks.

Block A mirrors the exact pattern in `AuthenticatedSessionController::store()`. Block B fixes the gap where new-tenant owners would have `role=null` and receive 403 on all Admin-gated routes in their own tenant (ROLE-01, ROLE-03).
  </action>
  <verify>
    <automated>php -l app/Http/Controllers/Auth/RegisteredUserController.php</automated>
  </verify>
  <done>RegisteredUserController::store() parses without error, contains `session()->pull('tenant_invitation_token')` after Auth::login(), and contains the `DB::table('tenant_user')...whereNull('role')->update(['role' => 'Admin'])` call for new-tenant owners.</done>
</task>

</tasks>

<verification>
Run PHPUnit test suite:
```
php artisan test --stop-on-failure 2>&1 | tail -20
```

Smoke test invitation email rendering:
```
php artisan tinker --execute="
\$inv = App\Models\TenantInvitation::first();
if (\$inv) {
    \$mail = new App\Mail\TenantInvitationMail(\$inv);
    echo 'Mailable constructed ok';
}
" 2>&1
```
</verification>

<success_criteria>
- TenantInvitationMail Mailable class exists and instantiates without error
- Blade template renders the accept link with the invitation token
- TenantController::invite() calls Mail::queue() after creating the invitation
- acceptFor() assigns role='Voter' to the accepted user in tenant_user pivot
- acceptFor() is race-safe (transactional update-check before syncWithoutDetaching)
- RegisteredUserController::store() processes invitation token from session after login
- All pre-existing tests pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-tenant-invitations-role-enforcement/01-02-SUMMARY.md` with what was built, files modified, and any deviations from the plan.
</output>
