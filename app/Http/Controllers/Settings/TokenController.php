<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TokenController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('settings/tokens', [
            'tokens' => $request->user()->tokens()->orderByDesc('created_at')->get()->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                'abilities' => $token->abilities,
                'last_used_at' => $token->last_used_at?->toIso8601String(),
                'created_at' => $token->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $token = $request->user()->createToken($validated['name'], ['mcp:use']);

        return Inertia::render('settings/tokens', [
            'tokens' => $request->user()->tokens()->orderByDesc('created_at')->get()->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'abilities' => $t->abilities,
                'last_used_at' => $t->last_used_at?->toIso8601String(),
                'created_at' => $t->created_at->toIso8601String(),
            ]),
            'newToken' => $token->plainTextToken,
        ]);
    }

    public function destroy(Request $request, int $tokenId)
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();

        return back();
    }
}
