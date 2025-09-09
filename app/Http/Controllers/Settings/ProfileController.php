<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'imageSupport' => [
                'imagick' => extension_loaded('imagick'),
                'gd' => extension_loaded('gd'),
                'jpeg' => function_exists('imagecreatefromjpeg'),
            ],
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Update the user's avatar image.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:5120', // max 5MB
        ]);

        $user = $request->user();
        $file = $request->file('avatar');

        // Choose available image driver (prefer Imagick)
        $driver = null;
        if (extension_loaded('imagick')) {
            $driver = new ImagickDriver();
        } elseif (extension_loaded('gd')) {
            $driver = new GdDriver();
        }
        if (!$driver) {
            return to_route('profile.edit')->withErrors([
                'avatar' => 'Kein Bildtreiber verfügbar. Bitte Imagick oder GD für PHP installieren.',
            ]);
        }

        // Prepare image processor
        $manager = new ImageManager($driver);
        try {
            $image = $manager->read($file->getRealPath());
        } catch (\Throwable $e) {
            return to_route('profile.edit')->withErrors([
                'avatar' => 'Bild konnte nicht gelesen werden (fehlende JPEG-Unterstützung?). Bitte anderes Format (PNG/WebP) wählen oder Server-Erweiterung installieren.',
            ]);
        }

        // Create square cover and convert to WEBP for optimization
        $image = $image->cover(256, 256);
        $image->toWebp(quality: 85);

        $dir = 'avatars/' . $user->id;
        $filename = 'avatar.webp';
        $path = $dir . '/' . $filename;

        // Ensure old avatar removed to avoid leftovers
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        // Store optimized image in public disk
        Storage::disk('public')->put($path, (string) $image);

        // Persist path
        $user->avatar_path = $path;
        $user->save();

        return to_route('profile.edit')->with('status', 'avatar-updated');
    }
}
