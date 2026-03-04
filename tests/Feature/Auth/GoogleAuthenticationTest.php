<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_redirect_route_redirects_to_provider(): void
    {
        $provider = Mockery::mock(Provider::class);
        $provider->shouldReceive('redirect')->once()->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);

        $response = $this->get(route('auth.google.redirect'));

        $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_google_callback_logs_in_existing_user_by_email(): void
    {
        $user = User::factory()->create([
            'email' => 'existing@example.com',
            'google_id' => null,
        ]);

        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-123');
        $socialiteUser->shouldReceive('getEmail')->andReturn('existing@example.com');
        $socialiteUser->shouldReceive('getName')->andReturn('Existing User');

        $provider = Mockery::mock(Provider::class);
        $provider->shouldReceive('user')->once()->andReturn($socialiteUser);
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $this->assertAuthenticatedAs($user->fresh());
        $this->assertEquals('google-123', $user->fresh()->google_id);
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_google_callback_creates_new_user_and_tenant(): void
    {
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-new-1');
        $socialiteUser->shouldReceive('getEmail')->andReturn('new-google@example.com');
        $socialiteUser->shouldReceive('getName')->andReturn('New Google User');

        $provider = Mockery::mock(Provider::class);
        $provider->shouldReceive('user')->once()->andReturn($socialiteUser);
        Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $user = User::where('email', 'new-google@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->tenant_id);
        $this->assertEquals('google-new-1', $user->google_id);
        $this->assertNotNull($user->email_verified_at);
        $this->assertDatabaseHas('tenants', ['id' => $user->tenant_id]);
        $this->assertDatabaseHas('tenant_user', ['tenant_id' => $user->tenant_id, 'user_id' => $user->id, 'role' => 'Admin']);
        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard', absolute: false));
    }
}
